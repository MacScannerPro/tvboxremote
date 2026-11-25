const CLOUD_URL="https://workers.dev";
let MODE=location.port==="8898"?"lan":"cloud";
const IS_LAN=location.port==="8898";
let STATE={channels:[],playlists:[],categories:[],current:null};
function toast(m){const t=document.getElementById("toast");t.innerText=m;t.style.display="block";clearTimeout(t._tm);t._tm=setTimeout(()=>t.style.display="none",2600);}
function apiBase(){if(IS_LAN)return "";const ip=(localStorage.getItem("tv_lan_ip")||"").trim();return ip?("http://"+ip.replace(/^https?:\/\//,"")):"";}
function setMode(m){MODE=m;mCloud.classList.toggle("on",m==="cloud");mLan.classList.toggle("on",m==="lan");cloudBar.style.display=m==="cloud"?"flex":"none";}
function openLan(){const ip=(lanIp.value||localStorage.getItem("tv_lan_ip")||"").trim();if(!ip){toast("Inserisci IP:8898 del TV Box");lanIp.focus();return;}localStorage.setItem("tv_lan_ip",ip);location.href="http://"+ip.replace(/^https?:\/\//,"");}
function savePair(){localStorage.setItem("tv_mac",macIn.value.trim().toUpperCase());localStorage.setItem("tv_pin",pinIn.value.trim());toast("Abbinamento salvato!");refreshState();}
function tab(i,b){document.querySelectorAll(".page").forEach((p,k)=>p.classList.toggle("on",k===i));document.querySelectorAll(".nbtn").forEach(x=>x.classList.remove("on"));b.classList.add("on");if(i===1||i===2)refreshState();}
function togFields(){fXt.style.display=t.value==="xtream"?"flex":"none";fSt.style.display=t.value==="stalker"?"flex":"none";}
async function cloudPush(action,payload){const mac=(localStorage.getItem("tv_mac")||"").trim();const pin=(localStorage.getItem("tv_pin")||"").trim();if(!mac||!pin){toast("Inserisci MAC e PIN del TV Box");return;}const r=await fetch(CLOUD_URL+"/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mac,pin,action,payload})});toast(r.ok?"Inviato al TV Box via Cloud!":"Errore invio Cloud");}
async function cmd(c){const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/remote_cmd",{method:"POST",body:JSON.stringify({cmd:c})});}else{await cloudPush("remote_cmd",{cmd:c});}}
function loadTxtFile(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{n.value=f.name.replace(/\.[^.]+$/,"");t.value="m3u";const dUrl="data:audio/x-mpegurl;base64,"+btoa(unescape(encodeURIComponent(r.result)));u.value=dUrl;if(typeof raw!=="undefined")raw.value="FILE: "+f.name;toast("File caricato: "+f.name+" -> premi INVIA");};r.readAsText(f);}
async function sendPl(){const rawV=(raw.value||"").trim();if(rawV&&!rawV.startsWith("FILE:")&&!u.value.trim()){u.value=rawV;}if(!u.value.trim()){toast("Inserisci URL o carica file");return;}const pl={name:n.value.trim()||"Lista TV",type:t.value,url:u.value.trim(),username:us.value.trim(),password:pw.value.trim(),mac:m.value.trim(),sn:sn.value.trim(),deviceId:d1.value.trim(),deviceId2:d2.value.trim(),vpnPolicy:vp.value,vpnCountry:vc.value};const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/add_playlist",{method:"POST",body:JSON.stringify(pl)});toast("Lista inviata al TV Box!");refreshState();}else{await cloudPush("add_playlist",pl);}raw.value="";u.value="";}
async function sendCustomM3u(){const txt=(m3uTxt.value||"").trim();if(!txt)return;const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/upload_m3u",{method:"POST",body:JSON.stringify({name:"Lista Editor",content:txt})});toast("Lista inviata!");}else{await cloudPush("add_playlist",{name:"Lista Editor",type:"m3u",url:"data:audio/x-mpegurl;base64,"+btoa(unescape(encodeURIComponent(txt)))});}}
async function sendCin(){const link=(cinU.value||"").trim();if(!link)return;const b=apiBase();if(IS_LAN||b){const r=await fetch(b+"/api/cineteca_import",{method:"POST",body:JSON.stringify({url:link})});const j=await r.json();toast("Cineteca: +"+(j.added||0)+" sorgenti!");}else{await cloudPush("cineteca_import",{url:link});}cinU.value="";}
async function dlUrl(){const b=apiBase();if(!IS_LAN&&!b){toast("Inserisci IP Wi-Fi/LAN per scaricare");return;}const link=(dlCode.value||"").trim();if(!link)return;dlSt.innerText="Download sul TV Box...";const r=await fetch(b+"/api/download_url",{method:"POST",body:JSON.stringify({url:link})});const j=await r.json();dlSt.innerText=r.ok?("Salvato in Download: "+j.file):("Errore: "+(j.msg||""));}
async function sendEpg(){const link=(epgU.value||"").trim();if(!link)return;const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/add_epg",{method:"POST",body:JSON.stringify({url:link})});toast("EPG inviata!");}else{await cloudPush("add_epg",{url:link});}epgU.value="";}
async function restartTv(){const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/restart_app",{method:"POST"});toast("Riavvio TV...");}else{await cloudPush("remote_cmd",{cmd:"restart"});}}
function renderCh(){const q=(qCh.value||"").toLowerCase(),cat=catSel.value;const list=(STATE.channels||[]).filter(c=>(!cat||c.group===cat)&&(!q||c.name.toLowerCase().includes(q))).slice(0,200);chList.innerHTML=list.map(c=>`<div class="item" onclick="playCh('${c.id}')"><div><b>${c.num}. ${c.name}</b><div class="sub">${c.group}</div></div><span>?</span></div>`).join("");}
async function playCh(id){const b=apiBase();if(IS_LAN||b){await fetch(b+"/api/play_channel",{method:"POST",body:JSON.stringify({id})});toast("Cambio canale...");}}
async function refreshState(){const b=apiBase();if(!IS_LAN&&!b)return;try{const r=await fetch(b+"/api/state");STATE=await r.json();if(STATE.current){curCh.innerText=STATE.current.name;curGrp.innerText=STATE.current.group||"LIVE";curNow.innerText=STATE.current.now||"In onda";curBar.style.width=(STATE.current.nowPct||0)+"%";}catSel.innerHTML='<option value="">Tutte le categorie</option>'+(STATE.categories||[]).map(c=>`<option value="${c}">${c}</option>`).join("");plList.innerHTML=(STATE.playlists||[]).map(p=>`<div class="item"><div><b>${p.name}</b><div class="sub">${p.type}</div></div></div>`).join("");renderCh();}catch(_){}}
window.onload=()=>{macIn.value=localStorage.getItem("tv_mac")||"";pinIn.value=localStorage.getItem("tv_pin")||"";lanIp.value=localStorage.getItem("tv_lan_ip")||"";setMode(IS_LAN?"lan":"cloud");if(IS_LAN)refreshState();};
function autoParse(){
  const s=(raw.value||"").trim(); if(!s)return;
  const uM=s.match(/https?:\/\/[^\s"'<>]+/i);
  const macM=s.match(/\b([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/);
  if(uM){
    const url=uM; u.value=url;
    try{ if(!n.value.trim()) n.value=new URL(url).hostname; }catch(_){}
    if(macM){
      t.value="stalker"; togFields();
      m.value=macM.toUpperCase().replace(/-/g,":");
      const snM=s.match(/(?:sn|serial)[^\w]*([A-Za-z0-9]{6,20})/i); if(snM) sn.value=snM;
      toast("Portale MAC riconosciuto!"); return;
    }
    if(/username=/i.test(url)&&/password=/i.test(url)){
      try{
        const p=new URL(url); t.value="xtream"; togFields();
        u.value=p.origin; us.value=p.searchParams.get("username")||""; pw.value=p.searchParams.get("password")||"";
        toast("Xtream riconosciuto!"); return;
      }catch(_){}
    }
    t.value="m3u"; togFields(); toast("URL M3U compilato!");
  }
}