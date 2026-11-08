import {OSMS, padId, flattenMaps, rankMaps, validateRoute} from './core.js';
import {API_BASE} from './config.js';
const $ = id => document.getElementById(id);
let datasets, currentMonster, candidates = [], selected, selectedRoute, revision = 0, analyzeRevision = 0;
let api = localStorage.getItem('maple-api') || API_BASE;
$('api-url').value = api;
const status = text => { $('status').textContent = text; };
function node(tag, text, cls) { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; }
async function getDataset(name) {
  try { const r = await fetch(OSMS + 'data/current/' + name, {signal:AbortSignal.timeout(18000)}); if (!r.ok) throw Error(); return {data:await r.json(), source:'live'}; }
  catch { const r = await fetch('./data/' + name); if (!r.ok) throw Error('Não foi possível carregar os dados. Confira a conexão.'); return {data:await r.json(), source:'snapshot'}; }
}
async function load() {
  $('retry').hidden = true;
  try {
    const files = await Promise.all(['maps.json','monsters.json','map_manifest.json'].map(getDataset));
    datasets = {maps:flattenMaps(files[0].data), monsters:files[1].data.monsters, manifest:files[2].data};
    const metadata = await fetch('./data/source.json').then(r=>r.json()).catch(()=>null);
    const fallback = files.some(f=>f.source === 'snapshot');
    $('data-badge').textContent = fallback ? 'SNAPSHOT ' + (metadata?.retrievedAt?.slice(0,10) || '') : 'OSMS · AO VIVO';
    $('data-badge').title = fallback ? 'Parte dos dados usa a cópia obtida na data indicada.' : 'Dados consultados diretamente no OSMS.';
    const list = $('monster-list'); list.replaceChildren();
    datasets.monsters.filter(m=>datasets.maps.some(map=>(map.mob_positions||[]).some(p=>p.id===m.id))).sort((a,b)=>a.name.localeCompare(b.name)).forEach(m=>{ const o=node('option','');o.value=m.name;list.append(o); });
    $('monster').disabled = false; $('monster').value = 'Ribbon Pig';
    $('monster-meta').textContent = 'Use o nome do monstro em inglês.';
    status(fallback ? 'Dados de reserva carregados. A data está indicada ao lado do mapa.' : 'Bestiário atualizado. Pronto para explorar.');
    const stored = JSON.parse(localStorage.getItem('maple-profile') || 'null');
    if(stored) for(const key of ['class','level','accuracy','casts','goal']) if(stored[key]!==undefined) $(key).value=stored[key];
    // Do not retain the user's old 100% hit claim for a different future monster.
    $('full-hit').checked = false;
  } catch(e) {status(e.message);$('retry').hidden=false;}
}
function profile() {
  return {className:$('class').value, level:Number($('level').value), accuracy:$('accuracy').value===''?null:Number($('accuracy').value), fullHit:$('full-hit').checked, casts:$('casts').value, goal:$('goal').value};
}
$('farm-form').addEventListener('submit', e=>{
  e.preventDefault(); if(!datasets) return;
  currentMonster = datasets.monsters.find(m=>m.name.toLowerCase()===$('monster').value.trim().toLowerCase());
  if(!currentMonster){status('Escolha um nome válido do bestiário.');return;}
  analyzeRevision++; $('analyze').textContent='Gerar rota com IA ↗';
  const saved=Object.fromEntries(['class','level','accuracy','casts','goal'].map(k=>[k,$(k).value])); localStorage.setItem('maple-profile',JSON.stringify(saved));
  candidates = rankMaps(datasets.maps,currentMonster.id).slice(0,6);
  $('result-title').textContent = currentMonster.name;
  $('monster-meta').textContent = `Nível ${currentMonster.level} · ${currentMonster.hp.toLocaleString('pt-BR')} HP · ${currentMonster.exp} EXP`;
  $('summary').textContent = `${candidates.length} mapas para comparar. A ordem inicial considera quantidade e proporção do alvo; a IA avalia o terreno e o seu perfil ao gerar a rota. Não é uma medição de abates por hora.`;
  $('candidates').replaceChildren();
  candidates.forEach((c,i)=>{const b=node('button','', 'candidate');b.type='button';b.setAttribute('aria-pressed','false'); b.append(node('strong',c.map.name),node('small',`${c.targets.length} spawns · ${Math.round(c.purity*100)}% do mapa`)); b.addEventListener('click',()=>showMap(c,i));$('candidates').append(b);});
  if(candidates.length) showMap(candidates[0],0); else status('Nenhum mapa com esse monstro foi encontrado.');
});
async function showMap(candidate,index) {
  const mine=++revision; analyzeRevision++; selected=candidate; selectedRoute=null;
  $('analyze').disabled=true; $('analyze').textContent='Gerar rota com IA ↗';$('fit-map').disabled=true; $('original-link').disabled=true;
  [...$('candidates').children].forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});
  $('map-name').textContent=candidate.map.name; $('map-stage').hidden=true;$('empty-map').hidden=false;
  $('empty-map').replaceChildren(node('p','Carregando o mapa real…'));$('route').replaceChildren(node('p','Os pontos mostram o nascimento do alvo. Gere a análise para traçar um circuito sobre o terreno.','muted'));
  const hash=datasets.manifest[padId(candidate.map.id)];
  if(!hash || !/^[a-z0-9]+$/i.test(hash)){status('Imagem indisponível para este mapa.');return;}
  const image=$('map-image');
  try {
    image.src=OSMS+'data/maps/'+hash+'.webp'; image.alt=`Mapa real de ${candidate.map.name}, com spawns de ${currentMonster.name}`;
    await image.decode(); if(mine!==revision)return;
    $('empty-map').hidden=true;$('map-stage').hidden=false;
    drawOverlay();$('analyze').disabled=false;$('fit-map').disabled=false;$('original-link').disabled=false;
    status('Mapa carregado. Gere a rota para avaliar plataformas e deslocamento.');
  } catch {if(mine===revision) {status('A imagem não carregou. Tente outro mapa ou confira a conexão.');$('empty-map').replaceChildren(node('p','Não foi possível carregar a imagem deste mapa.'));}}
}
function svg(tag,attrs={}) { const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n; }
function drawOverlay(){
  const overlay=$('map-overlay'), image=$('map-image');overlay.replaceChildren();overlay.setAttribute('viewBox',`0 0 ${image.naturalWidth} ${image.naturalHeight}`);
  const scale=Math.max(image.naturalWidth/1000,1);
  const defs=svg('defs'), marker=svg('marker',{id:'arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#73ede1'}));defs.append(marker);overlay.append(defs);
  selected.targets.forEach(p=>{const c=svg('circle',{cx:p.x,cy:p.y-10*scale,r:5*scale,fill:'#d9ee9c',stroke:'#173a26','stroke-width':1.5*scale});const title=svg('title');title.textContent=currentMonster.name;c.append(title);overlay.append(c);});
  selectedRoute?.steps.forEach((step,i)=>{
    const points=step.points.map(p=>({x:p.x*image.naturalWidth,y:p.y*image.naturalHeight}));
    if(points.length>1){const path=svg('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#73ede1','stroke-width':3*scale,'stroke-linecap':'round','stroke-linejoin':'round','marker-end':'url(#arrow)'});if(step.action!=='walk')path.setAttribute('stroke-dasharray',`${7*scale} ${5*scale}`);overlay.append(path);}
    const p=points[0];overlay.append(svg('circle',{cx:p.x,cy:p.y,r:13*scale,fill:'#d9ee9c',stroke:'#111b18','stroke-width':2*scale}));const t=svg('text',{x:p.x,y:p.y+4.5*scale,'text-anchor':'middle',fill:'#152b24','font-size':13*scale,'font-weight':700,'font-family':'sans-serif'});t.textContent=i+1;overlay.append(t);
  });
}
$('fit-map').onclick=()=>{$('map-stage').style.width='100%';$('map-scroller').scrollTo(0,0);};
$('original-link').onclick=()=>window.open($('map-image').src,'_blank','noopener,noreferrer');
$('settings-button').onclick=()=>{const hidden=!$('settings').hidden;$('settings').hidden=hidden;$('settings-button').setAttribute('aria-expanded',String(!hidden));};
$('save-api').onclick=()=>{
  try {const value=$('api-url').value.trim();if(value){const u=new URL(value);if(u.protocol!=='https:' && !(u.protocol==='http:' && ['localhost','127.0.0.1'].includes(u.hostname)))throw Error();api=u.origin+u.pathname.replace(/\/$/,'');}else api='';localStorage.setItem('maple-api',api);$('settings').hidden=true;$('settings-button').setAttribute('aria-expanded','false');status(api?'Conexão salva. Gere a rota no mapa escolhido.':'Conexão removida. A busca de mapas continua disponível.');}catch{status('Use uma URL HTTPS válida ou localhost para desenvolvimento.');}
};
$('analyze').onclick=async()=>{
  if(!selected)return;
  if(!api){$('settings').hidden=false;$('settings-button').setAttribute('aria-expanded','true');$('api-url').focus();status('Configure a URL da API de IA para gerar a rota. Nenhuma chave deve ser colocada aqui.');return;}
  const run=++analyzeRevision, map=selected.map;
  $('analyze').disabled=true;$('analyze').textContent='Analisando terreno…';status('A IA está avaliando a imagem real e o perfil do personagem.');
  try{
    const r=await fetch(api+'/api/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({monsterId:currentMonster.id,mapId:map.id,profile:profile()}),signal:AbortSignal.timeout(120000)});
    const data=await r.json();if(!r.ok)throw Error(data.error || 'A análise não pôde ser concluída.');
    const result=validateRoute(data,[map.id]);if(run!==analyzeRevision)return;
    selectedRoute=result;drawOverlay();$('route').replaceChildren(node('p',result.reason),node('p',result.access));
    const ol=document.createElement('ol');result.steps.forEach(s=>ol.append(node('li',s.text)));$('route').append(ol,node('p',result.caution,'muted'));
    if(!result.steps.length)$('route').append(node('p','A IA não encontrou um caminho confiável. Os spawns continuam visíveis.'));
    status('Rota sugerida gerada. Confira os movimentos no jogo.');
  }catch(e){if(run===analyzeRevision)status(e.name==='TimeoutError'?'A análise demorou demais. Tente novamente.':e.message);}
  finally{if(run===analyzeRevision){$('analyze').disabled=false;$('analyze').textContent='Gerar rota com IA ↗';}}
};
$('retry').onclick=load;
load();
