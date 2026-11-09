"""Rebuild the offline RBY catalogue: python3 scripts/import-kanto.py [local-PokeAPI-CSV-dir]."""
import base64
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import tempfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
POKEAPI = '6ea97b5641faa12e090866e8144ae8f57764fc64'
POKERED = '0dbf95cd12f5b1511c62ce69efe283000f780a8f'
SHOWDOWN = 'a78551b070769eb22e5261bb220d21153bf5788c'
DEX = '0.10.15'
DEX_SHA512 = 'U43OtvzzeS56fz7Ir0lHupydnmGeYLXoSywjeiouEGGj70IRJHX/UGV2HzKE4UmAMDL2gSu+coFPAvOEv0HsPw=='


def fetch(url):
    with urlopen(url, timeout=60) as res:
        return res.read()


def rows(name):
    if len(sys.argv) > 1:
        data = (Path(sys.argv[1]) / f'{name}.csv').read_text(encoding='utf-8')
    else:
        data = fetch(f'https://raw.githubusercontent.com/PokeAPI/pokeapi/{POKEAPI}/data/v2/csv/{name}.csv').decode()
    return csv.DictReader(io.StringIO(data))


names = {int(r['pokemon_species_id']): r['name'] for r in rows('pokemon_species_names')
         if r['local_language_id'] == '9'}
species = [dict(id=i, name=names[i], metres=int(r['height']) / 10, kg=int(r['weight']) / 10)
           for r in rows('pokemon') if 1 <= (i := int(r['id'])) <= 151 and r['is_default'] == '1']
assert [p['id'] for p in species] == list(range(1, 152))

# The cartridge and Showdown occasionally store different sentinel powers for fixed damage/OHKO.
asm = fetch(f'https://raw.githubusercontent.com/pret/pokered/{POKERED}/data/moves/moves.asm').decode()
cartridge = [re.split(r',\s*', row.strip()[5:]) for row in asm.splitlines() if row.startswith('\tmove ')]
assert len(cartridge) == 165
rules = fetch(f'https://raw.githubusercontent.com/smogon/pokemon-showdown/{SHOWDOWN}/data/mods/gen2/rulesets.ts').decode()
learn_rules = rules.split('obtainablemoves:', 1)[1].split('],', 1)[0]
conflicts = [s.split(' + ') for s in re.findall(r"'([^']+ \+ [^']+)'", learn_rules)]
# RBY-only conflict (GSC can teach Screech to the offspring). Source: Smogon's RBY and GSC Illegal Movesets.
conflicts.append(['Golbat', 'Leech Life', 'Screech'])
assert len(conflicts) == 20

# No runtime or development dependency. Extract only the three ESM data modules into a temporary directory.
archive = fetch(f'https://registry.npmjs.org/@pkmn/dex/-/dex-{DEX}.tgz')
if base64.b64encode(hashlib.sha512(archive).digest()).decode() != DEX_SHA512:
    raise ValueError('Unexpected @pkmn/dex package checksum')
with tempfile.TemporaryDirectory() as temp:
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
        for member in tar.getmembers():
            if re.fullmatch(r'package/build/(index|chunk-[\w-]+|learnsets-[\w-]+)\.mjs', member.name):
                (Path(temp) / Path(member.name).name).write_bytes(tar.extractfile(member).read())
    payload = dict(species=species, cartridge=cartridge, conflicts=conflicts,
                   sources=dict(pokeapi=POKEAPI, pokered=POKERED, showdown=SHOWDOWN, dex=DEX))
    subprocess.run(['node', str(ROOT / 'scripts/gen1-catalog.mjs'), str(Path(temp) / 'index.mjs')],
                   input=json.dumps(payload), text=True, check=True, cwd=ROOT)
