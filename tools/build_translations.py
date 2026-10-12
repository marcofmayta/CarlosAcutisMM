"""Validate and bundle local translations. No network requests."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = json.loads((ROOT / 'locales/es.json').read_text(encoding='utf-8'))
KEYS = list(SOURCE)
INVARIANT = {1, 2, 3, 14, 28, 63, 73, 101, 102, 106, 120, 129, 131, 144, 147, 149, 150, 151}
LANGUAGES = ['en', 'pt', 'fr', 'it', 'de', 'ja', 'ko']
dictionaries = {'es': SOURCE}
for language in LANGUAGES:
    dictionary = {KEYS[i]: KEYS[i] for i in INVARIANT}
    for line in (ROOT / f'locales/{language}.txt').read_text(encoding='utf-8').splitlines():
        if not line or line.startswith('#'):
            continue
        index, value = line.split('=', 1)
        key = KEYS[int(index)]
        assert key not in dictionary, f'{language}: duplicate {index}'
        assert value.strip(), f'{language}: empty {index}'
        dictionary[key] = value
    for key in KEYS:
        if re.fullmatch(r'\d+ de 13', key):
            dictionary[key] = dictionary['{n} de {total}'].replace('{n}', key.split()[0]).replace('{total}', '13')
    missing = set(SOURCE) - set(dictionary)
    assert not missing, f'{language}: missing {[(KEYS.index(key), key) for key in missing]}'
    for key, value in dictionary.items():
        assert set(re.findall(r'\{\w+\}', key)) == set(re.findall(r'\{\w+\}', value)), f'{language}: placeholders in {key}'
    (ROOT / f'locales/{language}.json').write_text(json.dumps(dictionary, ensure_ascii=False, indent=2), encoding='utf-8')
    dictionaries[language] = dictionary
    print(f'{language}: {len(dictionary)} translations validated')
(ROOT / 'translations.js').write_text(
    '// Local translations. Rebuild: python tools/build_translations.py\nwindow.ACUTIS_TRANSLATIONS = '
    + json.dumps(dictionaries, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8'
)
