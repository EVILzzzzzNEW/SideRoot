/* SideRoot shared store: SideID db (MongoDB via /api + localStorage fallback), cert utils */
(function(){
"use strict";
const LS_IDS="sideroot_ids_v1";
// When the static site and the API are hosted separately (e.g. Render static site
// + Render web service), set window.SIDEROOT_API_BASE="https://YOUR-api.onrender.com"
// before this script loads. Defaults to same-origin /api.
const API_BASE=String((typeof window!=="undefined"&&window.SIDEROOT_API_BASE)||"").replace(/\/+$/,"");
function loadIds(){ try{return JSON.parse(localStorage.getItem(LS_IDS)||"[]")}catch(e){return[]} }
function saveIds(a){ localStorage.setItem(LS_IDS,JSON.stringify(a)); }
function randCode(){ const L="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return L[Math.floor(Math.random()*26)]+L[Math.floor(Math.random()*26)]+Math.floor(Math.random()*10)+Math.floor(Math.random()*10); }
async function apiList(){ try{ const r=await fetch(API_BASE+"/api/sideid"); if(r.ok) return await r.json(); }catch(e){} return null; }
async function apiCreate(id,pass){ try{ const r=await fetch(API_BASE+"/api/sideid",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sideId:id,password:pass})}); if(r.ok) return await r.json(); }catch(e){} return null; }
async function createSideId(sideId,password){
  sideId=(sideId||"").trim(); password=password||"";
  if(!/^[a-zA-Z0-9_\-]{3,32}$/.test(sideId)) throw new Error("SideID must be 3-32 chars: letters/numbers/_/-");
  if(password.length<4) throw new Error("Password must be 4+ chars");
  const ids=loadIds();
  if(ids.find(x=>x.sideId.toLowerCase()===sideId.toLowerCase())) throw new Error("SideID already exists on this device");
  const rec={sideId,passwordCreated:Date.now(),createdAt:Date.now(),expiresAt:Date.now()+3*3600*1000,signingCode:randCode()};
  // NOTE: demo keeps a (plaintext-for-sim) copy locally; real server hashes via /api
  rec._pw=password;
  ids.push(rec); saveIds(ids);
  apiCreate(sideId,password); // fire & forget -> mongodb when server present
  return rec;
}
function getLocalId(sideId){ return loadIds().find(x=>x.sideId.toLowerCase()===String(sideId||"").toLowerCase())||null; }
function verifyLocal(sideId,password){ const r=getLocalId(sideId); return (r&&r._pw===password)?r:null; }
// C12 payload: JSON text saved with .c12 extension (NOT .txt): {sideId, signingCode, expiresAt, pwHash, requiresPassword}
function buildCertFile(rec,privatePassword){
  const payload={kind:"SideGrab-C12",sideId:rec.sideId,signingCode:rec.signingCode,issuedAt:Date.now(),
    expiresAt:rec.expiresAt,requiresPassword:!!(privatePassword&&privatePassword.length),pw:privatePassword||""};
  return JSON.stringify(payload);
}
function parseCertText(text){
  // detect signing code: 2 letters + 2 numbers anywhere
  const m=String(text||"").match(/([A-Z]{2}[0-9]{2})/);
  let obj=null; try{obj=JSON.parse(text);}catch(e){}
  const code=(obj&&obj.signingCode)||(m&&m[1])||null;
  const exp=(obj&&obj.expiresAt)||null;
  const valid=!!(code&&(!exp||exp>Date.now()));
  return {code,expiresAt:exp,valid,raw:obj,needsPassword:!!(obj&&obj.requiresPassword),pw:(obj&&obj.pw)||""};
}
function download(filename,text,mime){
  const b=new Blob([text],{type:mime||"application/octet-stream"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=filename;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
}
window.SideStore={loadIds,saveIds,createSideId,getLocalId,verifyLocal,buildCertFile,parseCertText,download,randCode,apiList};
})();
