const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'IDs duplicados na interface');
for(const match of html.matchAll(/(?:src|href)="((?:assets\/)[^"]+)"/g))assert(fs.existsSync(path.join(root,match[1])),`Arquivo ausente: ${match[1]}`);
for(const name of ['index.html','styles.css','script.js','sw.js','manifest.webmanifest'])assert.equal(fs.readFileSync(path.join(root,name),'utf8'),fs.readFileSync(path.join(root,'src/main/resources/static',name),'utf8'),`Interface Java divergente: ${name}`);
for(const name of ['chat.js','header.css','refinement.css','experience.css','scene3d.mjs','scene-models.mjs','scene-math.mjs','scene-entry.mjs','typography.mjs','scene-fallback.svg','vendor/three.module.min.js','vendor/three.core.min.js'])assert.equal(fs.readFileSync(path.join(root,'assets',name),'utf8'),fs.readFileSync(path.join(root,'src/main/resources/static/assets',name),'utf8'),`Cena Java divergente: ${name}`);
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
function luminance(hex){const channels=hex.match(/[a-f\d]{2}/gi).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
function contrast(a,b){const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05);}
for(const [foreground,background]of[['#167A45','#FFFFFF'],['#105C34','#FFFFFF'],['#17231C','#FFFFFF'],['#58665D','#F6F7F4'],['#105C34','#EDF5EF'],['#52645A','#FFFFFF'],['#AD2828','#FFF1F1'],['#8A4C0A','#FFF4DD']]){const ratio=contrast(foreground,background);assert(ratio>=4.5,`Contraste insuficiente: ${foreground}/${background}`);console.log(`Contraste ${foreground}/${background}: ${ratio.toFixed(2)}:1`);}
assert(contrast('#84948A','#FFFFFF')>=3,'Contorno dos campos sem contraste suficiente');
for(const [foreground,background]of[['#EEF6F0','#243D2E'],['#C3CEC7','#243D2E'],['#8CDFAD','#243D2E'],['#102318','#A6F0C4']]){const ratio=contrast(foreground,background);assert(ratio>=4.5,`Contraste insuficiente no menu: ${foreground}/${background}`);console.log(`Contraste do menu ${foreground}/${background}: ${ratio.toFixed(2)}:1`);}
assert(css.includes('prefers-reduced-motion'),'Suporte a movimento reduzido ausente');
console.log('Integridade dos arquivos, sincronização e contraste aprovados.');
