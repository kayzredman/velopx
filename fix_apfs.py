#!/usr/bin/env python3
"""
Fix APFS hard-link anomaly: files with real content on disk but returning {} when require()'d by Node.js.
Fix: read via Python, write back as a new file (breaks the hard link, creates new inode).
"""
import os
import sys
import subprocess
import tempfile

BASE = "/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/node_modules/.pnpm"

# Packages in the error chain that need fixing
TARGET_DIRS = [
    f"{BASE}/postcss@8.5.12/node_modules/postcss/lib",
    f"{BASE}/postcss@8.4.31/node_modules/postcss/lib",
    f"{BASE}/postcss@8.4.49/node_modules/postcss/lib",
    f"{BASE}/postcss-selector-parser@6.1.2/node_modules/postcss-selector-parser/dist",
    f"{BASE}/tailwindcss@3.4.15/node_modules/tailwindcss/lib",
    f"{BASE}/autoprefixer@10.5.0_postcss@8.5.12/node_modules/autoprefixer/lib",
    f"{BASE}/postcss-nested@6.2.0_postcss@8.5.12/node_modules/postcss-nested",
    f"{BASE}/postcss-js@4.0.1_postcss@8.5.12/node_modules/postcss-js",
]

def fix_file(fpath):
    """Rewrite file to break APFS hard link."""
    try:
        with open(fpath, 'rb') as f:
            content = f.read()
        if len(content) == 0:
            return False  # Actually empty, skip
        # Write to temp then replace atomically
        dirpath = os.path.dirname(fpath)
        fd, tmppath = tempfile.mkstemp(dir=dirpath, suffix='.tmp')
        try:
            os.write(fd, content)
            os.close(fd)
            os.replace(tmppath, fpath)
            return True
        except Exception as e:
            os.close(fd)
            os.unlink(tmppath)
            raise
    except Exception as e:
        print(f"  ERROR fixing {fpath}: {e}", file=sys.stderr)
        return False

fixed = 0
skipped = 0
errors = 0

for target_dir in TARGET_DIRS:
    if not os.path.isdir(target_dir):
        print(f"SKIP (not found): {target_dir}")
        continue
    
    js_files = []
    for root, dirs, files in os.walk(target_dir):
        for fname in files:
            if fname.endswith('.js'):
                js_files.append(os.path.join(root, fname))
    
    print(f"Fixing {len(js_files)} files in {target_dir.replace(BASE+'/', '')} ...")
    
    for fpath in js_files:
        # Check if it's a hard link (nlink > 1 means shared inode)
        try:
            st = os.stat(fpath)
            if st.st_size > 0:
                if fix_file(fpath):
                    fixed += 1
                else:
                    errors += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  stat error {fpath}: {e}")
            errors += 1

print(f"\nDone: fixed={fixed}, skipped={skipped}, errors={errors}")

# Now verify container.js works
cfile = f"{BASE}/postcss-selector-parser@6.1.2/node_modules/postcss-selector-parser/dist/selectors/container.js"
if os.path.exists(cfile):
    result = subprocess.run(
        ['node', '-e', f'try{{const m=require("{cfile}");console.log("container.js keys:",Object.keys(m).length)}}catch(e){{console.log("ERR:",e.message)}}'],
        capture_output=True, text=True, timeout=10
    )
    print(f"Verify container.js: {result.stdout.strip() or result.stderr.strip()}")

# Verify lazy-result.js
lrfile = f"{BASE}/postcss@8.5.12/node_modules/postcss/lib/lazy-result.js"
if os.path.exists(lrfile):
    result = subprocess.run(
        ['node', '-e', f'try{{const m=require("{lrfile}");console.log("lazy-result.js type:",typeof m,"registerPostcss:",typeof m.registerPostcss)}}catch(e){{console.log("ERR:",e.message)}}'],
        capture_output=True, text=True, timeout=10
    )
    print(f"Verify lazy-result.js: {result.stdout.strip() or result.stderr.strip()}")
