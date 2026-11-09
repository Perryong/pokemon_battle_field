// Package Vite's built scene and both GLBs into one locally openable HTML file.
import {readFileSync as read,writeFileSync as write} from 'node:fs';
let html=read('dist/index.html','utf8');
html=html.replace(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+)">/,(_,path)=>'<style>'+read('dist'+path,'utf8')+'</style>')
.replace(/<script type="module" crossorigin src="(\/assets\/[^"]+)"><\/script>/,(_,path)=>{
 const js=read('dist'+path,'utf8').replace(/"\/assets\/([^"]+\.(glb|webp))"/g,(_,file,ext)=>JSON.stringify('data:'+(ext==='glb'?'model/gltf-binary':'image/webp')+';base64,'+read('dist/assets/'+file).toString('base64')));
 return '<script type="module">'+js.replace(/<\/script/gi,'<\\/script')+'</script>';
});
const credits=read('public/credits.html','utf8').split('<h1>')[1].replace('</html>','');
html=html.replace('<a href="./credits.html">Model credits ↗</a>','<button class="creditlink" onclick="document.querySelector(\'#credits\').showModal()">Model credits ↗</button>').replace('</main>','</main><dialog id="credits"><h1>'+credits+'<form method="dialog"><button>Close</button></form></dialog>');
const licenses=[
 ['Diorama','src/lib/LICENSE'],
 ['Three.js','node_modules/three/LICENSE'],
 ['Pokémon Showdown simulator (@pkmn/sim)','node_modules/@pkmn/sim/LICENSE'],
 ['@pkmn/sets','src/lib/LICENSE.pkmn-sets'],
 ['@pkmn/streams','node_modules/@pkmn/streams/LICENSE'],
 ['ts-chacha20','node_modules/ts-chacha20/LICENSE'],
];
const license=licenses.map(([name,file])=>name+'\n'+read(file,'utf8')).join('\n\n');
write('dist/LICENSES.txt',license);
html=html.replace('</body>','<script type="text/plain" id="licenses">'+license+'</script></body>');
write('dist/pokemon-battle-field.html',html);
write('dist/indigo-field.html',html); // Keep existing local bookmarks working.
