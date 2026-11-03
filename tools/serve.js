const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {gzipSync}=require('node:zlib');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const publicFiles = new Set(['index.html','styles.css','script.js','sw.js','manifest.webmanifest','robots.txt','sitemap.xml']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
http.createServer(async(request,response)=>{
 try {
  const route = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  if(route==='/api/runtime'){response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return response.end(JSON.stringify({mode:'local'}));}
  if(['/login.html','/register.html'].includes(route)){response.writeHead(302,{Location:`/?auth=${route.includes('register')?'register':'login'}`});return response.end();}
  const name=route==='/'?'index.html':route.slice(1);
  const filePath=path.resolve(root,name);
  const asset=route.startsWith('/assets/')&&Object.hasOwn(types,path.extname(name))&&path.relative(path.join(root,'assets'),filePath).split(path.sep).every(segment=>segment!=='..');
  if((!publicFiles.has(name)&&!asset)||!['GET','HEAD'].includes(request.method)){response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return response.end('Página não encontrada.');}
  let content=await fs.readFile(filePath);
  const headers={'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Vary':'Accept-Encoding'};
  if(content.length>2048&&/\b(?:text\/|application\/(?:javascript|manifest|xml))/.test(headers['Content-Type'])&&/\bgzip\b/.test(request.headers['accept-encoding']||'')){content=gzipSync(content);headers['Content-Encoding']='gzip';}
  response.writeHead(200,headers);
  response.end(request.method==='HEAD'?undefined:content);
 }catch{response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Arquivo não encontrado.');}
}).listen(port,'127.0.0.1',()=>console.log(`ReUse+ local: http://localhost:${port}`));
