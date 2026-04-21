import os
import glob

REPLACEMENTS = [
    ('百度', 'WinGo'),
    ('清华', 'WinGo'),
    ('OpenMAIC', 'WinGo'),
    ('THU-MAIC', 'WinGo'),
]

base_path = '/app/.next/server'
files = glob.glob(base_path + '/**/*.js', recursive=True)

for f in files:
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        new_content = content
        for old, new in REPLACEMENTS:
            new_content = new_content.replace(old, new)
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            print(f'Fixed: {f}')
    except Exception as e:
        print(f'Error {f}: {e}')

print('Done.')
