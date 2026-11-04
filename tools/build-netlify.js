const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
function backendOrigin(value) {
 if (!value) return null;
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || ['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('API_BASE_URL deve ser uma origem HTTPS pública, sem caminho ou credenciais.');
 return url.origin;
}
function build(value=process.env.API_BASE_URL) {
 const backend = backendOrigin(value);
 fs.mkdirSync(output,{recursive:true});
 for (const name of ['index.html','script.js','styles.css','sw.js','manifest.webmanifest','robots.txt']) fs.copyFileSync(path.join(root,name),path.join(output,name));
 fs.cpSync(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
 const redirects = backend ? `/api/* ${backend}/api/:splat 200!\n/uploads/* ${backend}/uploads/:splat 200!\n` : '/api/* /.netlify/functions/api-unavailable 200!\n';
 fs.writeFileSync(path.join(output,'_redirects'),redirects+'/login.html /?auth=login 302\n/register.html /?auth=register 302\n');
 console.log(backend?'Distribuição pública gerada com API HTTPS.':'Distribuição gerada. API pendente: o site exibirá indisponibilidade explícita.');
}
if (require.main===module) build();
module.exports={backendOrigin,build};
