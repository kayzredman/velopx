import os, tempfile, time

BASE = '/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/node_modules/.pnpm'
start = time.time()
fixed = 0
checked = 0

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d != '.cache']
    for fname in files:
        if not fname.endswith(('.js', '.cjs', '.mjs')):
            continue
        fpath = os.path.join(root, fname)
        try:
            if os.stat(fpath).st_size > 0:
                continue
            data = open(fpath, 'rb').read()
            if not data:
                continue
            fd, tmp = tempfile.mkstemp(dir=root, suffix='.apfs')
            os.write(fd, data)
            os.close(fd)
            os.replace(tmp, fpath)
            fixed += 1
        except Exception:
            pass
        checked += 1
        if checked % 2000 == 0:
            print('checked=%d fixed=%d %.0fs' % (checked, fixed, time.time()-start), flush=True)

print('DONE checked=%d fixed=%d elapsed=%.0fs' % (checked, fixed, time.time()-start))
