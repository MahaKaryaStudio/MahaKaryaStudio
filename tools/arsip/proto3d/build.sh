#!/bin/sh
cd "$(dirname "$0")"
./node_modules/.bin/esbuild lamp3d.js --bundle --minify --format=esm --target=es2020 --tree-shaking=true --legal-comments=eof --outfile=dist/lamp3d.min.js --metafile=dist/meta.json "$@"
node -e "const fs=require('fs'),z=require('zlib');const b=fs.readFileSync('dist/lamp3d.min.js');console.log('raw',b.length,'gzip',z.gzipSync(b,{level:9}).length,'brotli',z.brotliCompressSync(b).length)"
