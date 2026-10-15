/* SideRoot SideID API. Static site works WITHOUT this; run `npm i && node server.js` for MongoDB persistence. */
try{ require("dotenv").config(); }catch(e){}
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const ROOT = __dirname;
const app = express();
app.use(express.json());
try{ app.use(require("cors")()); }catch(e){} // needed when the API runs on a different origin than the static site
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB = process.env.MONGODB_DB || "sideroot";
let col = null; const mem = new Map();
function code(){ const L="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return L[Math.floor(Math.random()*26)]+L[Math.floor(Math.random()*26)]+Math.floor(Math.random()*10)+Math.floor(Math.random()*10); }
(async()=>{ try{
  const c = new MongoClient(URI,{serverSelectionTimeoutMS:2500}); await c.connect();
  col = c.db(DB).collection("sideids"); await col.createIndex({sideId:1},{unique:true});
  console.log("[sideroot] MongoDB connected:",URI,"/",DB);
}catch(e){ console.log("[sideroot] MongoDB unavailable, using memory store. Set MONGODB_URI. ("+e.message+")"); } })();
app.post("/api/sideid", async(req,res)=>{
  try{
    const {sideId,password}=req.body||{};
    if(!/^[a-zA-Z0-9_\-]{3,32}$/.test(String(sideId||""))) return res.status(400).json({error:"bad sideId"});
    if(String(password||"").length<4) return res.status(400).json({error:"bad password"});
    const hash=await bcrypt.hash(String(password),10);
    const rec={sideId:String(sideId),hash,createdAt:Date.now(),expiresAt:Date.now()+3*3600*1000,signingCode:code()};
    if(col){ try{ await col.insertOne(rec); }catch(e){ if(e.code===11000) return res.status(409).json({error:"exists"}); throw e; } }
    else { if(mem.has(rec.sideId.toLowerCase())) return res.status(409).json({error:"exists"}); mem.set(rec.sideId.toLowerCase(),rec); }
    const {hash:_,...pub}=rec; res.json(pub);
  }catch(e){ res.status(500).json({error:String(e.message||e)}); }
});
app.get("/api/sideid", async(req,res)=>{
  if(col){ const all=await col.find({},{projection:{hash:0}}).toArray(); return res.json(all); }
  return res.json([...mem.values()].map(({hash,...p})=>p));
});
app.use(express.static(ROOT));
const PORT=process.env.PORT||8080;
app.listen(PORT,()=>console.log("[sideroot] http://localhost:"+PORT+"  (static + /api/sideid)"));
