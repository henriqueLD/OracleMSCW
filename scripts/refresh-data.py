"""Refresh the public fallback dataset for GitHub Pages (no credentials)."""
import datetime
import json
from pathlib import Path
import urllib.request

base = 'https://osmsdataexplorer.com/'
out = Path(__file__).resolve().parents[1] / 'site' / 'data'
out.mkdir(exist_ok=True)
for name in ('maps.json', 'monsters.json', 'map_manifest.json'):
    req = urllib.request.Request(base + 'data/current/' + name,
                                 headers={'User-Agent': 'OracleMSCW/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read()
    json.loads(data)
    (out / name).write_bytes(data)
(out / 'source.json').write_text(json.dumps({
    'source': base, 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'credits': 'OSMS Data Explorer; game assets © NEXON',
    'repository': 'https://github.com/ohmi69/osms_datamine_dashboard'
}, indent=2), encoding='utf-8')
print('OSMS fallback data updated.')
