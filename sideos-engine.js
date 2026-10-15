/* SideOS engine — virtual iOS simulator used inside SideBoot. No dependencies. */
(function(){
"use strict";
const $=(s,r)=>(r||document).querySelector(s);
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function seededRand(seed){ let h=2166136261; for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619)} return ()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296} }
const JB_SPECS=[
 {name:"SideBreak", ver:"10.0", exploit:"PurpleSmoke + sidebag", mgr:"CydiaSide", desc:"Untethered classic. Stable on 10.0."},
 {name:"VioletStorm", ver:"11.5", exploit:"VioletCore + async_wake", mgr:"Sileo", desc:"Semi-untethered, fast respring."},
 {name:"BlackHole", ver:"13.5", exploit:"OOB Timestamp + oobPCI", mgr:"Zebra", desc:"The legendary 13.5 chain."},
 {name:"SideFugu", ver:"16.3", exploit:"CoreTrust + kcall KFD", mgr:"Sileo", desc:"Developer-grade arm64e chain."},
 {name:"KorBreak", ver:"17.9", exploit:"KorSandbox escape + FlexInjector", mgr:"SideStore", desc:"Latest, pairs with Coruna Flex."},
];
const TROLL_SUPPORT={"10.0":true,"11.5":false,"13.5":false,"16.3":true,"17.9":true,"18.3":true};
const REPOS=["VioletRepo","KorRepo","SidePurple","NightGlass","TweakHarbor","PurpleVault","iSide","FlexHouse","Glassy","RootlessSide"];
const TWEAK_ADJ=["Glassy","Neon","Pastel","Bubble","Mono","Aurora","Cotton","Velvet","Frost","Mint","Peach","Grape","Ink","Glow","Halo","Cloud","Dusk","Dawn","Ember","Tide","Moss","Sand","Storm","Lumen","Orbit","Pixel","Satin","Drift","Bloom","Wave"];
const TWEAK_OBJ=["Icons","Dock","Badges","Folders","Clock","Slider","Keyboard","LockGlyph","PageDots","Switcher","Shadows","Blur","Tint","Corners","Font","Wallpaper","Widgets","CC Toggles","Notch","HomeBar"];
function tweaksFor(repo){ const r=seededRand(repo); const out=[]; const used=new Set();
  while(out.length<32){ const t=TWEAK_ADJ[Math.floor(r()*TWEAK_ADJ.length)]+" "+TWEAK_OBJ[Math.floor(r()*TWEAK_OBJ.length)];
    if(used.has(t))continue; used.add(t); out.push({name:t,desc:"Visual tweak — "+t.toLowerCase()+" restyle for SideOS.",repo}); }
  out.push({name:"Filza",desc:"System file manager (browses SideOS files).",repo,filza:true}); return out; }
function now(){ const d=new Date(); return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0"); }

function respring(mount,logo,done){
  const o=document.createElement("div"); o.className="sos-respring";
  o.innerHTML=`<div class="wig">${logo||"S"}</div><div class="spin"></div><div>respringing…</div>`;
  mount.appendChild(o); setTimeout(()=>{o.remove();done&&done()},2600);
}
function notify(mount,text){
  const n=document.createElement("div"); n.className="sos-notif"; n.textContent=text;
  mount.appendChild(n); setTimeout(()=>n.classList.add("show")); setTimeout(()=>{n.classList.remove("show");setTimeout(()=>n.remove(),400)},2600);
}

function boot(mount,vm,opts){
  opts=opts||{}; const save=opts.save||(()=>{});
  mount.innerHTML=""; mount.classList.add("sos-root");
  const wallpaper=vm.wallpaper||("linear-gradient(160deg,#0b0b14,#3b0f6e 55%,#7c3aed)");
  // Screens: home | app
  let screen="home", appId=null, browserPage="home", flexDrag=false;
  function verNum(){ const v=parseFloat(vm.version); return isNaN(v)?0:v; }
  const icons=()=>baseIcons().filter(i=>i.show());
  function baseIcons(){
    const L=[
      {id:"kor",t:"KorBrowser",e:"🧭",show:()=>true},
      {id:"build",t:"SideBuild",e:"🛠",show:()=>true},
      {id:"files",t:"Files",e:"📂",show:()=>true},
      {id:"term",t:"Terminal",e:"💻",show:()=>true},
      {id:"photos",t:"Photos",e:"🖼",show:()=>true},
      {id:"camera",t:"Camera",e:"📷",show:()=>verNum()>=11.5},
      {id:"calc",t:"Calculator",e:"🔢",show:()=>true},
      {id:"clock",t:"Clock",e:"⏰",show:()=>true},
      {id:"cal",t:"Calendar",e:"📅",show:()=>true},
      {id:"contacts",t:"Contacts",e:"👥",show:()=>true},
      {id:"msgs",t:"Messages",e:"💬",show:()=>true},
      {id:"music",t:"Music",e:"🎵",show:()=>verNum()>=11.5},
      {id:"notes",t:"Notes",e:"📝",show:()=>true},
      {id:"monitor",t:"Monitor",e:"📊",show:()=>true},
      {id:"widgets",t:"Widgets",e:"🧩",show:()=>verNum()>=16.3},
      {id:"flows",t:"SideFlows",e:"⚡",show:()=>verNum()>=17.9},
      {id:"gpt",t:"SideGPT",e:"🤖",show:()=>verNum()>=18.3},
      {id:"settings",t:"Settings",e:"⚙️",show:()=>true},
      {id:"troll",t:"TrollStore",e:"🐴",show:()=>!!vm.trollstore},
      {id:"sileo",t:vm.pkgMgr||"Sileo",e:"📦",show:()=>!!vm.jailbroken},
      {id:"filza",t:"Filza",e:"📁",show:()=>!!(vm.tweaks&&vm.tweaks.Filza)},
    ];
    (vm.installedApps||[]).forEach(a=>L.push({id:"u_"+a.name,t:a.name,e:"✨",show:()=>true,custom:a}));
    return L;
  }
  function render(){
    mount.innerHTML="";
    const wall=document.createElement("div"); wall.className="sos-wall"; wall.style.background=wallpaper; mount.appendChild(wall);
    const sb=document.createElement("div"); sb.className="sos-status";
    sb.innerHTML=`<span class="sos-time" title="tap">${now()}${vm.flexOn?" · flex":""}</span><span>SideOS ${esc(vm.version)}${vm.jailbroken?" 💜":""}</span>`;
    sb.querySelector(".sos-time").onclick=()=>{
      if(!vm.flexReady){ notify(mount,"Flex not injected — visit coruna.net on 17.9"); return; }
      vm.flexOn=!vm.flexOn; save();
      notify(mount, vm.flexOn?"Flex activated":"Flex deactivated");
      render();
    };
    mount.appendChild(sb);
    if(screen==="home") renderHome(); else renderApp();
    if(vm.flexOn) mount.classList.add("flexon"); else mount.classList.remove("flexon");
  }
  function renderHome(){
    const g=document.createElement("div"); g.className="sos-grid"+(vm.flexOn?" flex":"");
    if(vm.widgetsOn&&verNum()>=16.3){
      const w=document.createElement("div"); w.className="sos-widgets";
      w.innerHTML=`<div class="sw">🕘 ${now()}</div><div class="sw">💾 ${(JSON.stringify(vm).length/1024).toFixed(1)}KB</div><div class="sw">${vm.jailbroken?("💜 "+esc(vm.pkgMgr)):"stock"}</div>`;
      mount.appendChild(w);
    }
    icons().forEach(ic=>{
      const pos=(vm.iconPos||{})[ic.id];
      const d=document.createElement("div"); d.className="sos-icon"; d.dataset.id=ic.id;
      d.innerHTML=`<div class="sos-e">${ic.e}</div><div class="sos-l">${esc(ic.t)}</div>${vm.flexOn?'<div class="sos-sq"></div>':""}`;
      if(pos){d.style.transform=`translate(${pos.x}px,${pos.y}px)`}
      d.onclick=e=>{ if(vm.flexOn) return; openApp(ic); };
      if(vm.flexOn){ // drag square moves icon, persists
        const sq=()=>d.querySelector(".sos-sq");
        d.onpointerdown=e=>{ if(e.target!==sq()&&e.target.closest(".sos-sq")===null) return;
          e.preventDefault(); const sx=e.clientX,sy=e.clientY; const ox=(pos&&pos.x)||0,oy=(pos&&pos.y)||0;
          const mv=ev=>{ const nx=ox+ev.clientX-sx,ny=oy+ev.clientY-sy; d.style.transform=`translate(${nx}px,${ny}px)`; };
          const up=ev=>{ const nx=Math.round(ox+ev.clientX-sx),ny=Math.round(oy+ev.clientY-sy);
            vm.iconPos=vm.iconPos||{}; vm.iconPos[ic.id]={x:nx,y:ny}; save();
            window.removeEventListener("pointermove",mv); window.removeEventListener("pointerup",up); };
          window.addEventListener("pointermove",mv); window.addEventListener("pointerup",up);
        };
      }
      g.appendChild(d);
    });
    mount.appendChild(g);
    const dock=document.createElement("div"); dock.className="sos-dock"; dock.textContent="SideOS "+vm.version+" · "+(vm.jailbroken?("jailbroken ("+vm.pkgMgr+")"):"stock")+(vm.trollstore?" · TrollStore":"");
    mount.appendChild(dock);
    const exit=document.createElement("button"); exit.className="sos-exit"; exit.textContent="⤺ Exit to SideBoot";
    exit.onclick=()=>opts.onExit&&opts.onExit(); mount.appendChild(exit);
  }
  function openApp(ic){ appId=ic.id; screen="app"; render(); }
  function back(){ screen="home"; appId=null; browserPage="home"; render(); }
  function shell(title,bodyHTML){
    const w=document.createElement("div"); w.className="sos-app";
    w.innerHTML=`<div class="sos-appbar"><button>‹</button><b>${esc(title)}</b><span></span></div><div class="sos-body"></div>`;
    w.querySelector("button").onclick=back; w.querySelector(".sos-body").innerHTML=bodyHTML;
    mount.appendChild(w); return w.querySelector(".sos-body");
  }
  function renderApp(){
    if(appId==="settings"){ const b=shell("Settings",`<p>SideOS <b>${esc(vm.version)}</b></p><p>Kernel: KorSandbox ${vm.version==="17.9"?"(Flex-capable)":"(standard)"}</p><p>Jailbreak: ${vm.jailbroken?esc(vm.pkgMgr):"none"}<br>TrollStore: ${vm.trollstore?"installed":"not installed"}<br>Cert: ${esc(opts.cert||"—")}</p><button class="sbtn" id="w">Change wallpaper</button>`);
      b.querySelector("#w").onclick=()=>{ const palettes=["linear-gradient(160deg,#0b0b14,#3b0f6e 55%,#7c3aed)","linear-gradient(160deg,#02131f,#0c4a6e 60%,#38bdf8)","linear-gradient(160deg,#14060a,#7f1d1d 55%,#f59e0b)","linear-gradient(160deg,#04120c,#065f46 55%,#34d399)"]; vm.wallpaper=palettes[(palettes.indexOf(vm.wallpaper)+1+palettes.length)%palettes.length]||palettes[0]; save(); render(); }; return; }
    if(appId==="notes"){ const b=shell("Notes",`<textarea id="nt" rows="8" style="width:100%">${esc(vm.notes||"")}</textarea><button class="sbtn" id="sv">Save (kept in VM)</button>`);
      b.querySelector("#sv").onclick=()=>{vm.notes=b.querySelector("#nt").value;save();notify(mount,"Saved in VM");}; return; }
    if(appId==="filza"){ const files=Object.keys(vm.fs||{}); const b=shell("Filza",`<p class="mut2">/SideOS files (persisted in this VM)</p>${files.length?files.map(f=>`<div class="row"><span>${esc(f)}</span><span>${esc(String((vm.fs[f]||"").length))}b</span></div>`).join(""):"<p>No files yet — build something in SideBuild.</p>"}`); return; }
    if(appId==="troll"){ const apps=Object.keys(vm.fs||{}).filter(f=>f.endsWith(".spa")); const b=shell("TrollStore",`<p class="mut2">Install .spa builds from SideOS files (not your real iPhone).</p>${apps.length?apps.map(f=>`<div class="row"><span>${esc(f)}</span><button class="sbtn" data-f="${esc(f)}">Install</button></div>`).join(""):"<p>No .spa builds yet. Use SideBuild → Build (.spa).</p>"}`);
      b.querySelectorAll("[data-f]").forEach(btn=>btn.onclick=()=>{ const name=btn.dataset.f.replace("/Apps/","").replace(".spa",""); const content=vm.fs[btn.dataset.f];
        vm.installedApps=vm.installedApps||[]; if(!vm.installedApps.find(a=>a.name===name)) vm.installedApps.push({name,script:content}); save(); notify(mount,name+" installed"); render(); }); return; }
    if(appId==="sileo"){ const tw=Object.keys(vm.tweaks||{}); const b=shell(vm.pkgMgr||"Sileo",`<p class="mut2">Jailbreak package manager (from ${esc(vm.jbName||"jailbreak")}). .jeb builds appear here.</p>${Object.keys(vm.fs||{}).filter(f=>f.endsWith(".jeb")).map(f=>`<div class="row"><span>${esc(f)}</span><button class="sbtn" data-f="${esc(f)}">Install</button></div>`).join("")||"<p>No .jeb packages.</p>"}<p>Installed tweaks: ${tw.length?tw.join(", "):"none"}</p>`);
      b.querySelectorAll("[data-f]").forEach(btn=>btn.onclick=()=>{ const txt=vm.fs[btn.dataset.f]; vm.installedApps=vm.installedApps||[]; const nm=btn.dataset.f.split("/").pop().replace(".jeb","");
        if(!vm.installedApps.find(a=>a.name===nm)) vm.installedApps.push({name:nm,script:txt}); save(); notify(mount,nm+" installed"); render(); }); return; }
    if(appId==="files") return renderFiles(shell("Files",""));
    if(appId==="term") return renderTerm(shell("Terminal",""));
    if(appId==="photos") return renderPhotos(shell("Photos",""));
    if(appId==="camera") return renderCamera(shell("Camera",""));
    if(appId==="calc") return renderCalc(shell("Calculator",""));
    if(appId==="clock") return renderClock(shell("Clock",""));
    if(appId==="cal") return renderCal(shell("Calendar",""));
    if(appId==="contacts") return renderContacts(shell("Contacts",""));
    if(appId==="msgs") return renderMsgs(shell("Messages",""));
    if(appId==="music") return renderMusic(shell("Music",""));
    if(appId==="monitor") return renderMonitor(shell("Monitor",""));
    if(appId==="widgets") return renderWidgets(shell("Widgets",""));
    if(appId==="flows") return renderFlows(shell("SideFlows",""));
    if(appId==="gpt") return renderGPT(shell("SideGPT",""));
    if(appId==="build") return renderBuild();
    if(appId==="kor") return renderBrowser();
    if(String(appId).startsWith("u_")){ const ic=icons().find(i=>i.id===appId); const b=shell(ic.t,`<div id="ca"></div>`); renderSideScript(b.querySelector("#ca"),ic.custom.script); return; }
  }
  /* ---------- System apps (persist inside this VM) ---------- */
  const PHOTO_GRADS=["linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#06b6d4,#3b82f6)","linear-gradient(135deg,#a855f7,#ec4899)","linear-gradient(135deg,#10b981,#84cc16)","linear-gradient(135deg,#f8fafc,#94a3b8)","linear-gradient(135deg,#1e1b4b,#7c3aed)"];
  function renderFiles(b){
    vm.fs=vm.fs||{};
    const draw=()=>{
      const fs=Object.keys(vm.fs);
      b.innerHTML=`<p class="mut2">/SideOS — ${fs.length} file(s), kept in this VM.</p>
        ${fs.length?fs.map(f=>`<div class="row"><span>📄 ${esc(f)}<br><span class="mut2">${esc(String(vm.fs[f]).slice(0,60))}${String(vm.fs[f]).length>60?"…":""}</span></span><span><button class="sbtn" data-v="${esc(f)}">View</button><button class="sbtn" data-d="${esc(f)}">Del</button></span></div>`).join(""):"<p>No files yet.</p>"}
        <div class="brow"><input id="fn" placeholder="/name.txt" style="max-width:150px"><input id="fc" placeholder="content…"></div>
        <button class="sbtn pri" id="mk">Create / overwrite file</button><pre id="fl" class="log"></pre>`;
      b.querySelectorAll("[data-v]").forEach(x=>x.onclick=()=>{b.querySelector("#fl").textContent="── "+x.dataset.v+" ──\n"+vm.fs[x.dataset.v]});
      b.querySelectorAll("[data-d]").forEach(x=>x.onclick=()=>{delete vm.fs[x.dataset.d];save();draw()});
      b.querySelector("#mk").onclick=()=>{const n=b.querySelector("#fn").value.trim();if(!n){b.querySelector("#fl").textContent="Enter a file name.";return}
        vm.fs[n.startsWith("/")?n:"/"+n]=b.querySelector("#fc").value;save();draw()};
    }; draw();
  }
  function renderTerm(b){
    b.innerHTML=`<pre id="tout" class="log" style="min-height:200px">SideTerm — type "help".\n</pre><div class="brow"><input id="tin" placeholder="$ …"><button class="sbtn pri" id="go">⏎</button></div>`;
    const out=b.querySelector("#tout"), inp=b.querySelector("#tin");
    const print=t=>{out.textContent+=t+"\n";out.scrollTop=1e6};
    const run=raw=>{
      const [cmd,...rest]=raw.trim().split(/\s+/); const arg=rest.join(" ");
      print("$ "+raw);
      if(!cmd) return;
      if(cmd==="help") print("help ls cat <f> echo <t> > <f> rm <f> uname neofetch date jb respring clear");
      else if(cmd==="ls") print(Object.keys(vm.fs||{}).join("\n")||"(empty)");
      else if(cmd==="cat") print((vm.fs||{})[arg]||(vm.fs||{})["/"+arg]||"no such file");
      else if(cmd==="echo"){ const m=raw.match(/echo\s+(.+?)\s*>\s*(\S+)/); if(m){vm.fs=vm.fs||{};vm.fs[m[2].startsWith("/")?m[2]:"/"+m[2]]=m[1];save();print("wrote "+m[2])} else print(arg); }
      else if(cmd==="rm"){ const k=(vm.fs||{})[arg]!==undefined?arg:("/"+arg); if(vm.fs&&vm.fs[k]!==undefined){delete vm.fs[k];save();print("removed")} else print("no such file"); }
      else if(cmd==="uname") print("KorDarwin SideOS-"+vm.version+" arm64e KORSANDBOX");
      else if(cmd==="neofetch") print("SideOS "+vm.version+"\nKernel: KorSandbox\nJB: "+(vm.jailbroken?vm.pkgMgr:"none")+"\nTrollStore: "+(vm.trollstore?"yes":"no")+"\nShell: SideTerm");
      else if(cmd==="date") print(new Date().toString());
      else if(cmd==="jb") print(vm.jailbroken?("jailbroken via "+(vm.jbName||"?")+" ("+vm.pkgMgr+")"):"stock — visit jailbreak.com");
      else if(cmd==="respring"){ print("respringing…"); respring(mount,"S",()=>render()); }
      else if(cmd==="clear") out.textContent="";
      else print("unknown: "+cmd);
    };
    b.querySelector("#go").onclick=()=>{run(inp.value);inp.value="";inp.focus()};
    inp.onkeydown=e=>{if(e.key==="Enter"){run(inp.value);inp.value=""}};
  }
  function renderPhotos(b){
    vm.photos=vm.photos||[];
    const draw=()=>{
      b.innerHTML=`<p class="mut2">${vm.photos.length} photo(s) in this VM.</p><div class="pgrid">`+
        vm.photos.map((p,i)=>`<div class="ph" style="background:${p.g}"><span>${esc(p.n)}</span><div class="brow"><button class="sbtn" data-w="${i}">Wallpaper</button><button class="sbtn" data-x="${i}">Del</button></div></div>`).join("")+
        `</div><p class="mut2">Tip: Camera takes new shots.</p>`;
      b.querySelectorAll("[data-w]").forEach(x=>x.onclick=()=>{vm.wallpaper=vm.photos[+x.dataset.w].g;save();notify(mount,"Wallpaper set")});
      b.querySelectorAll("[data-x]").forEach(x=>x.onclick=()=>{vm.photos.splice(+x.dataset.x,1);save();draw()});
    }; draw();
  }
  function renderCamera(b){
    b.innerHTML=`<div class="viewfinder"><div class="vig">SideOS ${esc(vm.version)} · KorCam</div></div><div class="brow"><button class="sbtn pri" id="snap">◉ Shutter</button></div><pre id="cl" class="log"></pre>`;
    b.querySelector("#snap").onclick=()=>{
      vm.photos=vm.photos||[];
      const g=PHOTO_GRADS[Math.floor(Math.random()*PHOTO_GRADS.length)];
      const n="IMG_"+String(vm.photos.length+1).padStart(3,"0");
      vm.photos.push({n,g,at:Date.now()}); vm.fs=vm.fs||{}; vm.fs["/Photos/"+n+".shot"]=g; save();
      b.querySelector("#cl").textContent=n+" captured → saved to Photos + /Photos/ ✓";
    };
  }
  function renderCalc(b){
    b.innerHTML=`<input id="cd" readonly style="text-align:right;font-size:22px" value="0"><div class="cgrid">`+
      ["C","(",")","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","⌫","="].map(k=>`<button class="sbtn" data-k="${k}">${k}</button>`).join("")+`</div>`;
    let expr="";
    const d=b.querySelector("#cd");
    b.querySelectorAll("[data-k]").forEach(x=>x.onclick=()=>{
      const k=x.dataset.k;
      if(k==="C"){expr="";d.value="0"}
      else if(k==="⌫"){expr=expr.slice(0,-1);d.value=expr||"0"}
      else if(k==="="){ try{ const r=Function('"use strict";return('+expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-")+')')(); d.value=String(Math.round(r*1e8)/1e8); expr=d.value; }catch(e){d.value="Error";expr=""} }
      else {expr+=k;d.value=expr}
    });
  }
  function renderClock(b){
    b.innerHTML=`<div style="font-size:44px;font-weight:800" id="ck">--:--:--</div><p class="mut2">SideOS ${esc(vm.version)}</p><div class="brow"><button class="sbtn" id="sw">Start stopwatch</button><button class="sbtn" id="rst">Reset</button></div><div id="swt" style="font-size:24px">0.0s</div>`;
    const ck=b.querySelector("#ck"); const tick=()=>{ck.textContent=new Date().toLocaleTimeString()}; tick();
    const iv=setInterval(()=>{if(!document.contains(ck)){clearInterval(iv);return}tick()},1000);
    let t0=null,ti=null;
    b.querySelector("#sw").onclick=e=>{ if(t0){clearInterval(ti);t0=null;e.target.textContent="Start stopwatch"} else {t0=Date.now();ti=setInterval(()=>{b.querySelector("#swt").textContent=((Date.now()-t0)/1000).toFixed(1)+"s"},100);
      e.target.textContent="Stop";} };
    b.querySelector("#rst").onclick=()=>{if(ti)clearInterval(ti);t0=null;b.querySelector("#sw").textContent="Start stopwatch";b.querySelector("#swt").textContent="0.0s"};
  }
  function renderCal(b){
    let cur=new Date(); cur.setDate(1);
    const draw=()=>{
      const y=cur.getFullYear(), m=cur.getMonth();
      const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
      const names=["S","M","T","W","T","F","S"];
      let h=`<div class="brow"><button class="sbtn" id="pm">‹</button><b>${cur.toLocaleString("en",{month:"long"})} ${y}</b><button class="sbtn" id="nm">›</button></div><div class="cgrid week">`+
        names.map(n=>`<b>${n}</b>`).join("")+Array(first).fill("<span></span>").join("");
      for(let d=1;d<=days;d++){ const today=new Date(); const isT=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
        h+=`<span class="day${isT?" t":""}">${d}</span>`; }
      b.innerHTML=h+"</div>";
      b.querySelector("#pm").onclick=()=>{cur.setMonth(cur.getMonth()-1);draw()};
      b.querySelector("#nm").onclick=()=>{cur.setMonth(cur.getMonth()+1);draw()};
    }; draw();
  }
  function renderContacts(b){
    vm.contacts=vm.contacts||[{name:"Kor",num:"000-1337"},{name:"Side Support",num:"555-0100"}];
    const draw=()=>{
      b.innerHTML=vm.contacts.map((c,i)=>`<div class="row"><span>👤 <b>${esc(c.name)}</b><br><span class="mut2">${esc(c.num)}</span></span><button class="sbtn" data-i="${i}">Del</button></div>`).join("")+
        `<div class="brow"><input id="cn" placeholder="Name" style="max-width:130px"><input id="cp" placeholder="Number" style="max-width:130px"><button class="sbtn pri" id="add">Add</button></div>`;
      b.querySelectorAll("[data-i]").forEach(x=>x.onclick=()=>{vm.contacts.splice(+x.dataset.i,1);save();draw()});
      b.querySelector("#add").onclick=()=>{const n=b.querySelector("#cn").value.trim();if(!n)return;vm.contacts.push({name:n,num:b.querySelector("#cp").value||"—"});save();draw()};
    }; draw();
  }
  function renderMsgs(b){
    vm.msgs=vm.msgs||[{to:"Kor",text:"Welcome to SideOS ✌️",at:Date.now()}];
    const draw=()=>{
      b.innerHTML=vm.msgs.slice(-30).map(m=>`<div class="card"><b>${esc(m.to)}</b> <span class="mut2">${new Date(m.at).toLocaleTimeString()}</span><br>${esc(m.text)}</div>`).join("")+
        `<div class="brow"><input id="mt" placeholder="To" style="max-width:100px"><input id="mx" placeholder="Message…"><button class="sbtn pri" id="snd">Send</button></div>`;
      b.querySelector("#snd").onclick=()=>{const to=b.querySelector("#mt").value.trim()||"Kor",tx=b.querySelector("#mx").value.trim();if(!tx)return;
        vm.msgs.push({to,text:tx,at:Date.now()});save();
        setTimeout(()=>{vm.msgs.push({to,text:"Got it: “"+tx.slice(0,40)+"” 👍",at:Date.now()});save();if(appId==="msgs")draw()},1200);
        draw()};
    }; draw();
  }
  function renderMusic(b){
    const tracks=[{n:"Purple Dawn",f:[262,330,392,523]},{n:"Glass Waves",f:[440,554,659,880]},{n:"Night Boot",f:[196,247,294,392]}];
    let ac=null, playing=null, timers=[];
    const stop=()=>{timers.forEach(clearTimeout);timers=[];playing=null;draw()};
    const play=i=>{ stop(); try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ b.querySelector("#ml").textContent="Audio blocked in this browser."; return; }
      playing=i; const t=tracks[i];
      t.f.forEach((f,k)=>{ timers.push(setTimeout(()=>{ const o=ac.createOscillator(),g=ac.createGain(); o.frequency.value=f; o.type="sine";
        g.gain.setValueAtTime(0.2,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.5);
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+0.5); },k*450)); });
      timers.push(setTimeout(()=>{if(playing===i)draw()},t.f.length*450+200)); draw(); };
    const draw=()=>{
      b.innerHTML=`<p class="mut2">KorTunes — synthesized on-device.</p>`+tracks.map((t,i)=>`<div class="row"><span>${playing===i?"▶ ":"🎵 "}<b>${esc(t.n)}</b></span>${playing===i?'<button class="sbtn" id="st">Stop</button>':`<button class="sbtn" data-p="${i}">Play</button>`}</div>`).join("")+`<pre id="ml" class="log"></pre>`;
      b.querySelectorAll("[data-p]").forEach(x=>x.onclick=()=>play(+x.dataset.p));
      const st=b.querySelector("#st"); if(st) st.onclick=stop;
    }; draw();
  }
  function renderMonitor(b){
    const bytes=JSON.stringify(vm).length;
    b.innerHTML=`<h3 style="margin:0">System Monitor</h3><div class="row"><span>SideOS</span><b>${esc(vm.version)}</b></div>
      <div class="row"><span>Kernel</span><b>KorSandbox${vm.version==="17.9"?" (Flex)":""}</b></div>
      <div class="row"><span>Jailbreak</span><b>${vm.jailbroken?esc(vm.pkgMgr+" via "+(vm.jbName||"?")):"stock"}</b></div>
      <div class="row"><span>TrollStore</span><b>${vm.trollstore?"installed":"—"}</b></div>
      <div class="row"><span>Flex</span><b>${vm.flexReady?(vm.flexOn?"active":"injected"):"not injected"}</b></div>
      <div class="row"><span>VM storage</span><b>${(bytes/1024).toFixed(1)} KB</b></div>
      <div class="row"><span>Files / Tweaks / Apps</span><b>${Object.keys(vm.fs||{}).length} / ${Object.keys(vm.tweaks||{}).length} / ${(vm.installedApps||[]).length}</b></div>
      <div class="row"><span>Cert</span><b>${esc(opts.cert||"—")}</b></div>
      <div class="brow"><button class="sbtn" id="rs">Respring</button></div>`;
    b.querySelector("#rs").onclick=()=>respring(mount,"S",()=>render());
  }
  function renderWidgets(b){
    vm.widgetsOn=!!vm.widgetsOn;
    b.innerHTML=`<p class="mut2">Widgets live on your Home Screen (16.3+).</p><div class="card"><b>Clock + Flex status</b><br><span class="mut2">${now()} · ${vm.flexOn?"flex on":"flex off"}</span></div>
      <div class="card"><b>Storage</b><br><span class="mut2">${(JSON.stringify(vm).length/1024).toFixed(1)} KB used</span></div>
      <div class="card"><b>Now playing</b><br><span class="mut2">KorTunes — Purple Dawn</span></div>
      <button class="sbtn ${vm.widgetsOn?"":"pri"}" id="tg">${vm.widgetsOn?"Remove widgets from Home":"Add widgets to Home"}</button>`;
    b.querySelector("#tg").onclick=()=>{vm.widgetsOn=!vm.widgetsOn;save();notify(mount,vm.widgetsOn?"Widgets on Home ✓":"Widgets removed");render()};
  }
  function renderFlows(b){
    vm.flows=vm.flows||[{name:"Morning respring",do:"respring"},{name:"Party lights",do:"wallpaper"}];
    const draw=()=>{
      b.innerHTML=`<p class="mut2">Automations for SideOS 17.9+.</p>`+vm.flows.map((f,i)=>`<div class="row"><span>⚡ <b>${esc(f.name)}</b><br><span class="mut2">${esc(f.do)}</span></span><span><button class="sbtn pri" data-r="${i}">Run</button><button class="sbtn" data-x="${i}">Del</button></span></div>`).join("")+
        `<div class="brow"><input id="fn2" placeholder="Flow name" style="max-width:130px"><select id="fa"><option value="respring">respring</option><option value="wallpaper">cycle wallpaper</option><option value="notify">send notification</option></select><button class="sbtn pri" id="add2">Add</button></div>`;
      b.querySelectorAll("[data-r]").forEach(x=>x.onclick=()=>{const f=vm.flows[+x.dataset.r];
        if(f.do==="respring") respring(mount,"S",()=>render());
        else if(f.do==="wallpaper"){notify(mount,"Flow: wallpaper cycled");vm.wallpaper=PHOTO_GRADS[Math.floor(Math.random()*PHOTO_GRADS.length)];save()}
        else notify(mount,"⚡ "+f.name+" ran")});
      b.querySelectorAll("[data-x]").forEach(x=>x.onclick=()=>{vm.flows.splice(+x.dataset.x,1);save();draw()});
      b.querySelector("#add2").onclick=()=>{const n=b.querySelector("#fn2").value.trim()||"Flow "+(vm.flows.length+1);vm.flows.push({name:n,do:b.querySelector("#fa").value});save();draw()};
    }; draw();
  }
  function renderGPT(b){
    b.innerHTML=`<p class="mut2">On-device assistant (18.3+). Offline, canned, honest.</p><pre id="gl" class="log">Ask me: "what can you do" / "make an app that …" / "battery".\n</pre><div class="brow"><input id="gi" placeholder="Ask SideGPT…"><button class="sbtn pri" id="gg">Ask</button></div>`;
    const gl=b.querySelector("#gl"), gi=b.querySelector("#gi");
    const ask=q=>{
      gl.textContent+="you: "+q+"\n";
      const s=q.toLowerCase(); let a;
      if(/app/.test(s)) a='Sure — paste this into SideBuild:\napp "Quick" {\n  screen main {\n    text "Made with SideGPT"\n    button "Tap" -> alert("hi")\n  }\n}';
      else if(/jailbreak|jb/.test(s)) a="No jailbreak exists for 18.3 — install TrollStore instead (trollstore.com).";
      else if(/battery|storage/.test(s)) a="VM storage: "+(JSON.stringify(vm).length/1024).toFixed(1)+" KB. Battery: forever — it's a VM. 🔋";
      else if(/who|side/.test(s)) a="I'm SideGPT, running inside SideOS "+vm.version+". I can draft SideScript, explain Flex, and check your VM.";
      else a="Noted (“"+q.slice(0,60)+"”). Try: “make an app that says hi”.";
      gl.textContent+="SideGPT: "+a+"\n"; gl.scrollTop=1e6;
    };
    b.querySelector("#gg").onclick=()=>{if(gi.value.trim()){ask(gi.value.trim());gi.value=""}};
    gi.onkeydown=e=>{if(e.key==="Enter"&&gi.value.trim()){ask(gi.value.trim());gi.value=""}};
  }
  /* ---------- SideBuild ---------- */
  function renderBuild(){
    const b=shell("SideBuild",`<p class="mut2">Paste SideScript (from any AI with <b>aiprompt.txt</b>), Compile, name it, Build <b>.spa</b> (TrollStore) or <b>.jeb</b> (package manager).</p>
      <textarea id="ss" rows="9" style="width:100%" placeholder='app "Hello" { screen main { text "Hi" button "Tap" -> alert("hi") } }'></textarea>
      <div class="brow"><button class="sbtn" id="cmp">Compile</button><input id="an" placeholder="App name" style="max-width:130px"><select id="fmt"><option value=".spa">.spa file</option><option value=".jeb">.jeb file (needs jailbreak)</option></select><button class="sbtn pri" id="bld">Build</button></div><pre id="log" class="log"></pre>`);
    let compiled=null;
    b.querySelector("#cmp").onclick=()=>{ const src=b.querySelector("#ss").value; const err=checkScript(src);
      b.querySelector("#log").textContent=err?("Compile error: "+err):"Compile OK ✓ — "+summScript(src); if(!err)compiled=src; };
    b.querySelector("#bld").onclick=()=>{ if(!compiled){b.querySelector("#log").textContent="Tap Compile first.";return}
      const nm=(b.querySelector("#an").value||"MyApp").replace(/[^\w\- ]/g,"").slice(0,24)||"MyApp";
      const fmt=b.querySelector("#fmt").value;
      if(fmt===".jeb"&&!vm.jailbroken){b.querySelector("#log").textContent="Building .jeb needs a jailbreak first (jailbreak.com).";return}
      vm.fs=vm.fs||{}; vm.fs["/Apps/"+nm+fmt]=compiled; save();
      b.querySelector("#log").textContent=`Built ${nm+fmt} → saved in SideOS files (/Apps). Install it with ${fmt===".spa"?"TrollStore":"your package manager"}.`; };
  }
  function checkScript(src){ if(!/app\s+"[^"]+"\s*\{/.test(src))return 'expected: app "Name" { ... }'; if(!/screen\s+\w+\s*\{/.test(src))return 'expected: screen main { ... }'; return null; }
  function summScript(src){ const n=(src.match(/button\s+"/g)||[]).length,t=(src.match(/text\s+"/g)||[]).length; return `${t} text, ${n} button(s)`; }
  function renderSideScript(el,src){ // tiny interpreter
    const lines=src.split("\n").join(" ");
    const getAll=(re)=>{const o=[];let m;const r=new RegExp(re,"g");while((m=r.exec(src)))o.push(m[1]);return o};
    let h="";
    getAll('text\\s+"([^"]+)"').forEach(t=>h+=`<p>${esc(t)}</p>`);
    getAll('button\\s+"([^"]+)"\\s*->\\s*alert\\("([^"]+)"\\)').forEach((_,i,arr)=>{});
    let m, r2=new RegExp('button\\s+"([^"]+)"\\s*->\\s*alert\\("([^"]+)"\\)',"g");
    while((m=r2.exec(src))) h+=`<button class="sbtn" data-a="${esc(m[2])}">${esc(m[1])}</button> `;
    el.innerHTML=h||"<p>(empty app)</p>";
    el.querySelectorAll("[data-a]").forEach(x=>x.onclick=()=>alert(x.dataset.a));
  }
  /* ---------- KorBrowser ---------- */
  function renderBrowser(){
    const pages={
      home:`<h3>KorBrowser</h3><p class="mut2">Newer SideOS = more features. Current: <b>${esc(vm.version)}</b></p>
        ${link("jailbreak.com","5 jailbreaks (no 18.3 — use TrollStore)")}${link("tweaksrepo.com","10 repos · 30+ visual tweaks each + Filza")}${link("trollstore.com","TrollInstallerX support list")}${link("coruna.net","Flex oasis — 17.9 only")}${link("aiprompt.txt","AI prompt + Copy to real clipboard")}`,
      "jailbreak.com":jbPage(), "tweaksrepo.com":reposPage(), "trollstore.com":trollPage(), "coruna.net":corunaPage(), "aiprompt.txt":aiPage()};
    const b=shell("KorBrowser",`<div class="addr">kor://${esc(browserPage)}</div><div id="pg">${pages[browserPage]||pages.home}</div>`);
    wireBrowser(b);
  }
  function link(id,sub){return `<div class="row site" data-go="${id}"><span><b>${id}</b><br><span class="mut2">${esc(sub)}</span></span><span>›</span></div>`}
  function wireBrowser(b){
    b.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>{browserPage=x.dataset.go;render()});
    b.querySelectorAll("[data-back]").forEach(x=>x.onclick=()=>{browserPage="home";render()});
    const jb=b.querySelectorAll("[data-jb]");
    jb.forEach(btn=>btn.onclick=()=>{
      const spec=JB_SPECS.find(j=>j.name===btn.dataset.jb);
      if(vm.version!==spec.ver){ jblog(b,`Version mismatch: ${spec.name} is for SideOS ${spec.ver}, you run ${vm.version}.`); return; }
      if(vm.version==="18.3"){ jblog(b,"No jailbreak for 18.3. Use TrollStore."); return; }
      jblog(b,`Exploiting with ${spec.exploit}…`,()=>jblog(b,"Escaping KorSandbox… privilege escalation…",()=>{ vm.jailbroken=true; vm.pkgMgr=spec.mgr; vm.jbName=spec.name; save();
        respring(mount,"S",()=>{render();notify(mount,spec.mgr+" installed ♥")}); }));
    });
    const cust=b.querySelector("#cj");
    if(cust) cust.onclick=()=>{
      const ex=(b.querySelector("#cex").value||"").trim(), ch=(b.querySelector("#cch").value||"").trim();
      const log=b.querySelector("#clog");
      if(!ex){log.textContent="Provide a core exploit name first.";return}
      if(!/^[01]{4,16}$/.test(ch)){log.textContent="Provide an exploit chain: 4-16 chars of 0 and 1 (e.g. 010101).";return}
      let roll=""; for(let i=0;i<ch.length;i++) roll+=Math.random()<.5?"0":"1";
      log.textContent=`Trying ${ex} chain ${ch} … rolled ${roll} …\n`;
      setTimeout(()=>{ if(roll===ch){ log.textContent+=`chain POSITIVE — jailbreak succeeded!\nInstalling ${b.querySelector("#cmgr").value}…`;
          vm.jailbroken=true; vm.pkgMgr=b.querySelector("#cmgr").value; vm.jbName=ex+" (custom)"; save();
          setTimeout(()=>respring(mount,"S",()=>{render();notify(mount,"Custom jailbreak installed")}),1200);
        } else log.textContent+=`chain NEGATIVE — pattern mismatch. Try another pattern (some are positive, some negative).`; },900);
    };
    b.querySelectorAll("[data-repo]").forEach(x=>x.onclick=()=>{browserPage="repo:"+x.dataset.repo;render()});
    if(browserPage.startsWith("repo:")){ const repo=browserPage.slice(5);
      b.querySelectorAll("[data-tw]").forEach(t=>t.onclick=()=>{
        if(!vm.jailbroken){b.querySelector("#tlog").textContent="Jailbreak required — install one from jailbreak.com first.";return}
        const name=t.dataset.tw; vm.tweaks=vm.tweaks||{}; vm.tweaks[name]={repo}; save();
        if(name==="Filza") notify(mount,"Filza installed — check Home Screen");
        else { vm.wallpaper=t.dataset.fx||vm.wallpaper; save(); }
        b.querySelector("#tlog").textContent=name+" installed ✓ (visual tweak, active now)"; });
    }
    const ti=b.querySelector("#tinstall");
    if(ti) ti.onclick=()=>{
      if(!TROLL_SUPPORT[vm.version]){b.querySelector("#tlog").textContent=`SideOS ${vm.version} is NOT supported by TrollInstallerX.`;return}
      b.querySelector("#tlog").textContent="Installing TrollInstallerX… signing with your cert…";
      setTimeout(()=>{vm.trollstore=true;save();respring(mount,"S",()=>{render();notify(mount,"TrollStore installed")})},1600);
    };
    const jm=b.querySelector("#cor-jb");
    if(jm) jm.onclick=()=>{
      if(vm.version!=="17.9"){b.querySelector("#clog").textContent="coruna.net supports ONLY SideOS 17.9.";return}
      b.querySelector("#clog").textContent="[1/4] escaping KorSandbox…\n[2/4] mapping Flex region…";
      setTimeout(()=>{b.querySelector("#clog").textContent+="\n[3/4] patching SpringSide…\nAll most done — tap INJECT FLEX."; b.querySelector("#cor-flex").style.display="";},1400);
    };
    const fx=b.querySelector("#cor-flex");
    if(fx) fx.onclick=()=>{ b.querySelector("#clog").textContent+="\n[4/4] injecting Flex… All done!";
      vm.flexReady=true; save(); setTimeout(()=>{back();notify(mount,"Tap the status-bar time to toggle Flex")},900); };
    const cp=b.querySelector("#aicopy");
    if(cp) cp.onclick=async()=>{ const t=b.querySelector("#aitxt").textContent;
      try{await navigator.clipboard.writeText(t);b.querySelector("#alog").textContent="Copied to your REAL iOS clipboard ✓ — paste into ChatGPT/Gemini."}
      catch(e){ const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(_){}ta.remove(); b.querySelector("#alog").textContent="Copied (fallback) ✓"; } };
  }
  function jblog(b,line,cb){ const el=b.querySelector("#jlog"); if(el){el.textContent+=(el.textContent?"\n":"")+line; el.scrollTop=1e6} if(cb)setTimeout(cb,900); }
  function jbPage(){
    let h=`<div class="row" data-go="home"><span>‹ all sites</span></div><h3>jailbreak.com</h3><pre id="jlog" class="log">ready.</pre>`;
    JB_SPECS.forEach(j=>{ h+=`<div class="card"><b>${j.name}</b> <span class="mut2">for SideOS ${j.ver} · ${esc(j.mgr)}</span><br><span class="mut2">${esc(j.desc)} Exploit: ${esc(j.exploit)}</span><br><button class="sbtn" data-jb="${j.name}">Jailbreak ${j.ver}</button></div>`; });
    h+=`<div class="card"><b>No jailbreak for 18.3</b><br><span class="mut2">Use TrollStore instead — it works on 18.3.</span></div>`;
    h+=`<div class="card"><b>Roll your own (AI prompt)</b><br><span class="mut2">Needs core exploit name + 0/1 chain. Random patterns: some positive, some negative.</span><br><input id="cex" placeholder="core exploit, e.g. FogLine"><input id="cch" placeholder="chain e.g. 010101" style="margin-top:6px"><select id="cmgr"><option>Sileo</option><option>Zebra</option><option>SideStore</option></select><br><button class="sbtn pri" id="cj">Try custom jailbreak</button><pre id="clog" class="log"></pre></div>`;
    return h;
  }
  function reposPage(){
    if(browserPage.startsWith("repo:")){ const repo=browserPage.slice(5); const tw=tweaksFor(repo);
      return `<div class="row" data-go="tweaksrepo.com"><span>‹ repos</span></div><h3>${esc(repo)}</h3><pre id="tlog" class="log">${vm.jailbroken?"tap INSTALL on a tweak.":"JAILBREAK REQUIRED."}</pre>`+
      tw.map((t,i)=>`<div class="row"><span><b>${esc(t.name)}</b><br><span class="mut2">${esc(t.desc)}</span></span><button class="sbtn" data-tw="${esc(t.name)}">Install</button></div>`).join("");
    }
    return `<div class="row" data-go="home"><span>‹ all sites</span></div><h3>tweaksrepo.com</h3><p class="mut2">10 repos · 30+ visual tweaks each (every repo different) + Filza file manager.</p>`+
      REPOS.map(r=>`<div class="row site" data-repo="${r}"><span><b>${r}</b><br><span class="mut2">${tweaksFor(r).length} packages · visual only</span></span><span>›</span></div>`).join("");
  }
  function trollPage(){
    const rows=Object.keys(TROLL_SUPPORT).map(v=>`<div class="row"><span>SideOS ${v}</span><b>${TROLL_SUPPORT[v]?"✓ supported":"✕ not supported"}</b></div>`).join("");
    return `<div class="row" data-go="home"><span>‹ all sites</span></div><h3>trollstore.com</h3>${rows}<div class="card"><b>TrollInstallerX</b><br><span class="mut2">13.5 and 11.5 are NOT supported. Others can install TrollStore, then install .spa builds.</span><br><button class="sbtn pri" id="tinstall">Install TrollInstallerX</button><pre id="tlog" class="log"></pre></div>`;
  }
  function corunaPage(){
    return `<div class="row" data-go="home"><span>‹ all sites</span></div><h3>coruna.net — 17.9 only</h3><pre id="clog" class="log">waiting…</pre><button class="sbtn pri" id="cor-jb">Jailbreak me!</button> <button class="sbtn" id="cor-flex" style="display:none">Inject Flex</button>`;
  }
  function aiPage(){
    return `<div class="row" data-go="home"><span>‹ all sites</span></div><h3>aiprompt.txt</h3><pre id="aitxt" class="log" style="white-space:pre-wrap">Loading…</pre><button class="sbtn pri" id="aicopy">Copy (real iOS clipboard)</button><pre id="alog" class="log"></pre>`;
  }
  // async fill aiprompt text
  setTimeout(async()=>{ const el=mount.querySelector("#aitxt"); if(el&&browserPage==="aiprompt.txt"){ try{ el.textContent=await (await fetch("../aiprompt.txt")).text(); }catch(e){ el.textContent="(open /aiprompt.txt on SideRoot)"; } } },50);
  render();
  return {render};
}
window.SideOS={boot,JB_SPECS,TROLL_SUPPORT};
})();
