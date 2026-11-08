import test from 'node:test';
import assert from 'node:assert/strict';
import {rankMaps,validateRoute,padId} from '../site/core.js';
import {parseInput,createWorker} from '../api/worker.js';
const good={mapId:1,reason:'R',access:'A',caution:'C',steps:[{text:'Ida',action:'walk',points:[{x:.1,y:.2},{x:.3,y:.2}]}]};
test('ranking distinguishes the exact monster, excludes empty and town maps',()=>{
 const maps=[{id:1,mob_positions:[{id:6},{id:6},{id:7}]},{id:2,mob_positions:[{id:7}]},{id:3,is_town:true,mob_positions:[{id:6}]}];
 assert.deepEqual(rankMaps(maps,6).map(x=>x.map.id),[1]);
 assert.equal(rankMaps(maps,6)[0].targets.length,2);
 assert.equal(padId(10002010),'010002010');
});
test('rejects invented maps and off-image/non-finite route coordinates',()=>{
 assert.equal(validateRoute(good,[1]),good);
 assert.throws(()=>validateRoute({...good,mapId:99},[1]));
 for(const x of [-.1,1.1,Infinity,NaN])assert.throws(()=>validateRoute({...good,steps:[{text:'x',action:'walk',points:[{x,y:.5}]}]},[1]));
 assert.doesNotThrow(()=>validateRoute({...good,steps:[]},[1]));
});
const input={monsterId:10,mapId:1,profile:{className:'Assassin',level:33,accuracy:null,fullHit:true,casts:'unknown',goal:'materials'}};
test('request accepts unknown damage and rejects invalid profiles',()=>{
 assert.deepEqual(parseInput(input),input);
 assert.throws(()=>parseInput({...input,profile:{...input.profile,level:0}}));
 assert.throws(()=>parseInput({...input,profile:{...input.profile,accuracy:'100'}}));
});
test('worker blocks other origins before any external call',async()=>{
 let calls=0; const worker=createWorker(async()=>{calls++;throw Error('Unexpected call');});
 const r=await worker.fetch(new Request('https://api.test/api/route',{method:'POST',headers:{Origin:'https://evil.test'}}),{ALLOWED_ORIGINS:'https://site.test'});
 assert.equal(r.status,403);assert.equal(calls,0);
});
test('worker does not call paid API until secrets and limiter are configured',async()=>{
 const worker=createWorker(async()=>{throw Error('Unexpected call');});
 const req=()=>new Request('https://api.test/api/route',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify(input)});
 assert.equal((await worker.fetch(req(),{ALLOWED_ORIGINS:'https://site.test'})).status,503);
 assert.equal((await worker.fetch(req(),{ALLOWED_ORIGINS:'https://site.test',OPENAI_API_KEY:'test',OPENAI_MODEL:'test'})).status,503);
});
test('worker forwards verified map/image context and accepts structured AI response',async()=>{
 let aiCalled=false;
 const fetcher=async(url,options)=>{
  if(url.includes('maps.json'))return Response.json({regions:[{maps:[{id:1,name:'Real map',mob_positions:[{id:10,x:10,y:20}]}]}]});
  if(url.includes('monsters.json'))return Response.json({monsters:[{id:10,name:'Ribbon Pig',level:10,hp:172}]});
  if(url.includes('map_manifest'))return Response.json({'000000001':'abc123'});
  if(url.includes('portals.json'))return Response.json({});
  assert.equal(url,'https://api.openai.com/v1/responses');
  const body=JSON.parse(options.body);assert.equal(body.store,false);
  assert.equal(body.input[0].content[1].image_url,'https://osmsdataexplorer.com/data/maps/abc123.webp');
  aiCalled=true;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(good)}]}]});
 };
 const env={ALLOWED_ORIGINS:'https://site.test',OPENAI_API_KEY:'test',OPENAI_MODEL:'configured-model',ROUTE_LIMITER:{limit:async()=>({success:true})}};
 const r=await createWorker(fetcher).fetch(new Request('https://api.test/api/route',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify(input)}),env);
 assert.equal(r.status,200);assert.equal(aiCalled,true);assert.deepEqual(await r.json(),good);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://site.test');
});
