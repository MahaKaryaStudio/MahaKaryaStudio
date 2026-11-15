const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2];const port=+process.argv[3];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.webm':'video/webm','.mp4':'video/mp4'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('nf')}s.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});s.end(d)})}).listen(port);
