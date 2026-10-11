import test from 'node:test';
import assert from 'node:assert/strict';
import {makeServer} from './server.mjs';
test('profil, protections, absence de jetons et déconnexion',async()=>{
 let calls=0;
 const server=makeServer({authFactory:()=>({acquireTokenInteractive:async request=>{
  calls++;assert.deepEqual(request.scopes,['openid','profile']);assert.equal(request.prompt,'select_account');
  return {account:{name:'Compte Test',username:'test@example.com'},accessToken:'SECRET',idToken:'SECRET-ID'};
 }})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const status=await(await fetch(base+'/api/status')).json();assert.equal(calls,0);assert.equal(status.connected,false);
  const post=(path,headers={})=>fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':status.csrf,...headers},body:'{}'});
  assert.equal((await post('/api/login',{'X-CSRF-Token':'bad'})).status,403);
  const login=await(await post('/api/login')).json();assert.equal(login.account.name,'Compte Test');assert.equal(login.connected,true);assert.ok(!JSON.stringify(login).includes('SECRET'));
  assert.equal((await(await fetch(base+'/api/status')).json()).account.username,'test@example.com');
  assert.equal((await post('/api/chat')).status,404);
  await post('/api/logout');assert.equal((await(await fetch(base+'/api/status')).json()).connected,false);
 }finally{await new Promise(r=>server.close(r));}
});
