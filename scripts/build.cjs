require('esbuild').buildSync({entryPoints:['src/chamber.js'],outfile:'js/chamber.js',bundle:true,format:'esm',target:'es2020',minify:true,legalComments:'eof'});
console.log('Built js/chamber.js');
