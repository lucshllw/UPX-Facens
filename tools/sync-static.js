const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'src/main/resources/static');
for(const file of ['index.html','styles.css','script.js','sw.js','manifest.webmanifest'])fs.copyFileSync(path.join(root,file),path.join(destination,file));
fs.cpSync(path.join(root,'assets'),path.join(destination,'assets'),{recursive:true});
for(const [name,tab] of [['login','login'],['register','register']])fs.writeFileSync(path.join(destination,`${name}.html`),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>ReUse+ — acesso</title><meta http-equiv="refresh" content="0;url=/?auth=${tab}"><a href="/?auth=${tab}">Continuar para ${tab==='login'?'entrar':'criar uma conta'}</a></html>`);
console.log('Interface sincronizada para o servidor Java.');
