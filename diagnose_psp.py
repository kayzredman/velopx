#!/usr/bin/env python3
"""Diagnose postcss-selector-parser loading issues."""
import subprocess
import os

PSP = "/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/node_modules/.pnpm/postcss-selector-parser@6.1.2/node_modules/postcss-selector-parser/dist"

# Test each file with full error capture
test_files = [
    f"{PSP}/selectors/types.js",
    f"{PSP}/util/index.js",
    f"{PSP}/selectors/node.js",
    f"{PSP}/selectors/container.js",
    f"{PSP}/selectors/root.js",
    f"{PSP}/index.js",
]

script = """
'use strict';
const f = process.argv[1];
let m;
try {
    m = require(f);
    console.log('OK keys=' + Object.keys(m).length);
} catch(e) {
    console.log('THROW: ' + e.message);
    console.log('STACK: ' + (e.stack || '').split('\\n').slice(0,4).join(' | '));
}
"""

import tempfile
with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tf:
    tf.write(script)
    tfname = tf.name

for fpath in test_files:
    if not os.path.exists(fpath):
        print(f"MISSING: {fpath}")
        continue
    
    py_size = len(open(fpath, 'rb').read())
    result = subprocess.run(
        ['node', tfname, fpath],
        capture_output=True, text=True, timeout=10
    )
    out = (result.stdout + result.stderr).strip()
    shortpath = fpath.replace(PSP + '/', '')
    print(f"{shortpath}: py={py_size}b, node={out}")

os.unlink(tfname)
