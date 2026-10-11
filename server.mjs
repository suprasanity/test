import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function openBrowser(url) {
  // URL émise par MSAL, jamais une commande fournie par le navigateur.
  const u = new URL(url);
  if (u.protocol !== 'https:' || u.hostname !== 'login.microsoftonline.com') throw new Error('URL Microsoft invalide');
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler',url] : [url];
  return new Promise((resolve,reject) => {
    const child = spawn(command,args,{stdio:'ignore',shell:false});
    child.once('error',reject); child.once('exit',code => code === 0 ? resolve() : reject(new Error('Navigateur indisponible')));
  });
}

export function makeServer({authFactory}) {
  let auth = authFactory(), account = null, busy = false;
  const csrf = randomBytes(32).toString('hex');
  return createServer(async (req,res) => {
    const host = `127.0.0.1:${res.socket.localPort}`;
    const json = (status,data) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    if(req.headers.host !== host) return json(403,{error:'Utilise 127.0.0.1'});
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      if(req.method === 'GET' && req.url === '/api/status') return json(200,{connected:!!account,account,csrf});
      const assets = {'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
      if(req.method === 'GET' && assets[req.url]) {
        const [name,type] = assets[req.url]; const bytes = await readFile(new URL(`./public/${name}`,import.meta.url));
        res.writeHead(200,{'Content-Type':`${type}; charset=utf-8`,'Cache-Control':'no-store'});return res.end(bytes);
      }
      if(req.method !== 'POST' || !['/api/login','/api/logout'].includes(req.url)) return json(404,{error:'Route inconnue'});
      if(req.headers.origin !== `http://${host}` || req.headers['x-csrf-token'] !== csrf || !req.headers['content-type']?.startsWith('application/json')) return json(403,{error:'Requête refusée'});
      let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4096)return json(413,{error:'Requête trop volumineuse'});}
      try{JSON.parse(raw);}catch{return json(400,{error:'JSON invalide'});}
      if(busy)return json(409,{error:'Une connexion est déjà en cours'});
      if(req.url === '/api/logout'){auth=authFactory();account=null;return json(200,{connected:false,account:null});}
      busy=true;
      try{
        const result=await auth.acquireTokenInteractive({scopes:['openid','profile'],prompt:'select_account',openBrowser,timeout:180000});
        if(!result.account)throw new Error('Compte absent');
        account={name:result.account.name || result.account.username || 'Compte Microsoft',username:result.account.username || ''};
        return json(200,{connected:true,account});
      }finally{busy=false;}
    }catch(e){
      const code=String(e.errorCode || '');
      const match=String(e.message || '').match(/AADSTS\d+/);
      json(502,{error:`Connexion Microsoft impossible${match ? ' ('+match[0]+')' : ''}. Réessaie avec le bon compte. Si AADSTS50020 persiste, vérifie le répertoire du compte avec ton administrateur.`,code:match?.[0] || (/^[a-z_]+$/.test(code)?code:'authentication_failed')});
    }
  });
}
if(process.argv[1] === fileURLToPath(import.meta.url)){
  const {PublicClientApplication}=await import('@azure/msal-node');
  // Application publique Microsoft Azure CLI existante. Aucun identifiant à configurer.
  const authFactory=()=>new PublicClientApplication({auth:{clientId:'04b07795-8ddb-461a-bbee-02f9e1bf7b46',authority:'https://login.microsoftonline.com/common'}});
  const server=makeServer({authFactory});
  server.listen(3000,'127.0.0.1',()=>console.log('Ouvre http://127.0.0.1:3000 — Ctrl+C pour arrêter.'));
  server.on('error',()=>{console.error('Port 3000 indisponible. Arrête l’autre serveur.');process.exitCode=1;});
}
