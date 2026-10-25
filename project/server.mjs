import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {handleApi,securityHeaders} from './src/api.mjs';
const port=Number(process.env.PORT??4317);
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
createServer(async (req,res)=>{
  const controller=new AbortController();
  req.on('aborted',()=>controller.abort());
  res.on('close',()=>{if(!res.writableEnded)controller.abort();});
  try {
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    let response;
    if (url.pathname.startsWith('/api/')) {
      const parts=[];let size=0;
      for await(const part of req) {size+=part.length;if(size>4096){res.writeHead(413);res.end('Request too large');return;}parts.push(part);}
      response=await handleApi(new Request(url,{method:req.method,headers:req.headers,signal:controller.signal,...(req.method==='POST'?{body:Buffer.concat(parts)}:{})}),process.env);
    } else {
      const file=files[url.pathname];
      response=file?new Response(await readFile(new URL(`./public/${file[0]}`,import.meta.url)),{headers:{...securityHeaders,'content-type':`${file[1]}; charset=utf-8`}}):new Response('Not found',{status:404});
    }
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500);res.end('Request unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`Common Ground local fixture prototype: http://127.0.0.1:${port}`));
