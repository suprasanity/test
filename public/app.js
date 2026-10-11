const $=id=>document.getElementById(id);
let csrf,account=null,busy=false;
function render(){
 $('status').textContent=busy?'Connexion en cours…':account?'Connecté':'Non connecté';
 $('name').textContent=account?`Connecté avec ${account.name}`:'';
 $('username').textContent=account?.username && account.username !== account.name ? account.username : '';
 $('login').disabled=busy || !csrf || !!account;$('logout').disabled=busy || !account;
}
async function action(path){
 if(busy)return;busy=true;$('error').textContent='';render();
 try{
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:'{}'});
  const data=await response.json();if(!response.ok)throw new Error(data.error);
  account=data.account;
 }catch(e){$('error').textContent=e.message || 'Serveur indisponible';}finally{busy=false;render();}
}
$('login').onclick=()=>action('/api/login');$('logout').onclick=()=>action('/api/logout');
fetch('/api/status').then(r=>r.json()).then(s=>{csrf=s.csrf;account=s.account;render();}).catch(()=>{$('status').textContent='Serveur indisponible';});
