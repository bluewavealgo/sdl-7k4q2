(function(){
"use strict";
const APP_SRC=(document.currentScript&&document.currentScript.src)||location.href;
let APP_V="";try{APP_V=new URL(APP_SRC).searchParams.get("v")||"";}catch(e){}
/* ======================= config ======================= */
const FB_CONFIG={apiKey:"AIzaSyASOersv1lrvCSOvkk8w-BHsPcWJedCaHY",authDomain:"sea-days-ledger.firebaseapp.com",projectId:"sea-days-ledger",storageBucket:"sea-days-ledger.firebasestorage.app",messagingSenderId:"287279684615",appId:"1:287279684615:web:95ad2623d06f7d3aeedea2"};
const ADMIN_EMAIL="bluewavealgo@gmail.com";

/* ======================= helpers ======================= */
const $=id=>document.getElementById(id);
const DAY=86400000,pad=n=>String(n).padStart(2,"0");
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dn(s){if(!s)return null;const [y,m,d]=String(s).split("-").map(Number);if(!y||!m||!d)return null;return Math.round(Date.UTC(y,m-1,d)/DAY);}
function fmt(n){if(n==null)return "—";const d=new Date(n*DAY);return pad(d.getUTCDate())+" "+MON[d.getUTCMonth()]+" "+d.getUTCFullYear();}
const now0=new Date();const TODAY=Math.round(Date.UTC(now0.getFullYear(),now0.getMonth(),now0.getDate())/DAY);
function fyOf(n){const d=new Date(n*DAY);return d.getUTCMonth()>=3?d.getUTCFullYear():d.getUTCFullYear()-1;}
const fyStart=f=>Math.round(Date.UTC(f,3,1)/DAY),fyEnd=f=>Math.round(Date.UTC(f+1,2,31)/DAY);
const fyLabel=f=>f+"-"+String((f+1)%100).padStart(2,"0");
function span(y,m,d){const p=[];if(y)p.push(y+"y");if(m||y)p.push(m+"m");p.push(d+"d");return p.join(" ");}
function ymd(a,b){const s=new Date(a*DAY),e=new Date((b+1)*DAY);let y=e.getUTCFullYear()-s.getUTCFullYear(),m=e.getUTCMonth()-s.getUTCMonth(),d=e.getUTCDate()-s.getUTCDate();
  if(d<0){m--;d+=new Date(Date.UTC(e.getUTCFullYear(),e.getUTCMonth(),0)).getUTCDate();}if(m<0){y--;m+=12;}return span(y,m,d);}
function approx(days){const y=Math.floor(days/365);const r=days-y*365;const m=Math.floor(r/30);return span(y,m,r-m*30);}
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf=n=>(n===""||n==null||isNaN(+n))?"":Number(n).toLocaleString("en-IN");
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function lsJSON(k,d){try{const v=JSON.parse(lsGet(k));return v==null?d:v;}catch(e){return d;}}
const when=t=>new Date(t).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastT=null;function toast(m,ms){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms||3800);}

/* ======================= reference lists ======================= */
const TYPES=["Oil Tanker (Crude)","Oil/Chem Product Tanker","Product Tanker","Chemical Tanker","LNG Carrier","LPG Carrier","Bulk Carrier","Container Ship","General Cargo","Car Carrier (PCTC)","Offshore / Other"];
const TYPE_COL={"Oil Tanker (Crude)":"var(--c0)","Oil/Chem Product Tanker":"var(--c1)","Product Tanker":"var(--c2)","Chemical Tanker":"var(--c3)","LNG Carrier":"var(--c4)","LPG Carrier":"var(--c5)","Bulk Carrier":"var(--c6)","Container Ship":"var(--c7)"};
const typeColor=t=>TYPE_COL[t]||"var(--cx)";
const RANKS={"Deck":["Master / Captain","Chief Officer","2nd Officer","3rd Officer","Junior Officer (Deck)","Deck Cadet / Trainee","Bosun","AB (Able Seaman)","OS (Ordinary Seaman)","Pumpman","Deck Fitter"],
 "Engine":["Chief Engineer","2nd Engineer","3rd Engineer","4th Engineer","Junior Engineer","Engine Cadet / TME","ETO (Electro-Technical Officer)","Electrical Officer","Gas Engineer","Motorman","Oiler","Wiper","Fitter"],
 "Catering":["Chief Cook","2nd Cook","Messman / Steward"]};
const ALLRANKS=[].concat(...Object.values(RANKS));
const FLAGS=["Panama","Liberia","Marshall Islands","Singapore","Malta","Bahamas","Hong Kong","Greece","Cyprus","Isle of Man","India","Norway","Denmark","United Kingdom","Japan","Portugal","Antigua and Barbuda","Belgium","Netherlands","Saudi Arabia","Qatar","United Arab Emirates"];
const TOPICS=["All","India & Seafarers","Tankers","LNG & Gas","Safety & Security","Markets & Trade","Regulation","General"];
/* news comes straight from public shipping feeds, fetched by this device only when Sync is pressed (no server, no Claude) */
const FEEDS=[
 {name:"Marine Insight",url:"https://www.marineinsight.com/feed/"},
 {name:"gCaptain",url:"https://gcaptain.com/feed/"},
 {name:"Splash247",url:"https://splash247.com/feed/"},
 {name:"SAFETY4SEA",url:"https://safety4sea.com/feed/"},
 {name:"Google News",url:"https://news.google.com/rss/search?q=%22DG+Shipping%22+OR+%22Indian+seafarers%22+OR+%22Indian+seafarer%22+when:14d&hl=en-IN&gl=IN&ceid=IN:en",gn:true},
 {name:"Google News",url:"https://news.google.com/rss/search?q=tanker+OR+%22LNG+carrier%22+OR+%22LPG+carrier%22+shipping+when:7d&hl=en-IN&gl=IN&ceid=IN:en",gn:true}];
const TOPIC_RULES=[["India & Seafarers",/\b(india|indian|dg shipping|dgs|dgma|directorate general of shipping|mumbai|jnpt|kandla|deendayal|chennai|kochi|cochin|vizag|paradip|mundra|seafarers?|crew change|crew welfare)\b/i],
 ["Safety & Security",/\b(pira(cy|tes?)|attack|houthi|hijack|collision|fire|explosion|sank|sink(ing|s)?|grounded|grounding|detain(ed|s)?|detention|spill|rescue|missing|casualt|seized|capsiz|accident|injur|killed|dead)/i],
 ["LNG & Gas",/\b(lng|lpg|gas carrier|ammonia carrier|vlgc)\b/i],
 ["Tankers",/\b(tankers?|vlcc|suezmax|aframax|lr2|mr tanker|crude|product tanker|chemical tanker|shadow fleet)\b/i],
 ["Regulation",/\b(imo|mepc|regulation|marpol|solas|stcw|mlc|eexi|cii|emission|sanction|flag state|port state|psc|rule)\b/i],
 ["Markets & Trade",/\b(rates?|freight|market|demand|charter|earnings|price|orderbook|newbuild|trade|exports?|imports?)\b/i]];
const topicOf=t=>{const hit=TOPIC_RULES.find(([,re])=>re.test(t));return hit?hit[0]:"General";};
const TOPIC_COL={"India & Seafarers":"var(--c1)","Tankers":"var(--c0)","LNG & Gas":"var(--c6)","Safety & Security":"var(--c7)","Markets & Trade":"var(--c2)","Regulation":"var(--c3)","General":"var(--cx)"};

/* ======================= state ======================= */
const EXAMPLE={v:2,example:true,settings:{edge:true},fy:{},deleted:[],updatedAt:0,contracts:[
 {id:"ex1",vessel:"MT Example Horizon",type:"Oil/Chem Product Tanker",company:"Example Shipmanagement",fleet:"Tanker Fleet 1",rank:"2nd Officer",flag:"Marshall Islands",on:"2025-04-14",off:"2025-09-20",left:"2025-04-12",arr:"2025-09-22",notes:"Example"},
 {id:"ex2",vessel:"LNG Example Aurora",type:"LNG Carrier",company:"Example Gas Carriers",fleet:"LNG Fleet",rank:"2nd Officer",flag:"Bahamas",on:"2025-12-06",off:"2026-05-10",left:"2025-12-05",arr:"2026-05-12",notes:"Example"},
 {id:"ex3",vessel:"MT Example Meridian",type:"Chemical Tanker",company:"Example Shipmanagement",fleet:"Tanker Fleet 2",rank:"Chief Officer",flag:"Panama",on:"2026-08-02",onIndia:true,onPort:"Mumbai (JNPT)",off:"2027-01-15",offPort:"Houston",arr:"2027-01-17",notes:"Example · sign-off planned"}]};
let S;
function adopt(o){S={v:2,example:false,settings:Object.assign({edge:true},o.settings||{}),fy:o.fy||{},contracts:(o.contracts||[]).map(c=>Object.assign({company:"",fleet:"",flag:"",registry:""},c)),deleted:Array.isArray(o.deleted)?o.deleted:[],updatedAt:+o.updatedAt||0};}
function snapshot(){return {v:2,app:"sea-days-ledger",settings:S.settings,fy:S.fy,contracts:S.contracts,deleted:S.deleted||[],updatedAt:S.updatedAt||0};}
function saveLocal(){if(S.example)return;S.updatedAt=Date.now();lsSet("seaDaysLedger",JSON.stringify(snapshot()));updateSyncUI();}
function loadLocal(){try{const o=JSON.parse(lsGet("seaDaysLedger"));if(o&&Array.isArray(o.contracts))return o;}catch(e){}return null;}
function leaveExample(){if(S.example)S={v:2,example:false,settings:{edge:S.settings.edge!==false},fy:{},contracts:[],deleted:[],updatedAt:0};}
/* combine another copy into S: newest edit of each contract wins, deletions carry over, nothing is wiped */
function merge(o){
  if(S.example)leaveExample();
  const before=JSON.stringify([S.contracts,S.fy,S.deleted]);
  const tomb={};(S.deleted||[]).concat(Array.isArray(o.deleted)?o.deleted:[]).forEach(d=>{if(d&&d.id)tomb[d.id]=Math.max(tomb[d.id]||0,+d.u||0);});
  const m={};S.contracts.concat((o.contracts||[]).map(c=>Object.assign({company:"",fleet:"",flag:"",registry:""},c))).forEach(c=>{if(!c||!c.id)return;const p=m[c.id];if(!p||(+c.u||0)>(+p.u||0))m[c.id]=c;});
  S.contracts=Object.values(m).filter(c=>!(tomb[c.id]&&tomb[c.id]>=(+c.u||0)));
  S.deleted=Object.entries(tomb).map(([id,u])=>({id,u})).slice(-500);
  const newer=(+o.updatedAt||0)>(+S.updatedAt||0);
  Object.entries(o.fy||{}).forEach(([k,v])=>{S.fy[k]=newer?Object.assign({},S.fy[k],v):Object.assign({},v,S.fy[k]);});
  if(newer&&o.settings)S.settings=Object.assign({},S.settings,o.settings);
  return before!==JSON.stringify([S.contracts,S.fy,S.deleted]);
}

/* ======================= day-count engine ======================= */
function shipSpan(c){const on=dn(c.on);if(on==null)return null;const off=dn(c.off);return [on,off!=null?off:Math.max(TODAY,on)];}
function ranges(c,edge){
  const out=[],e1=edge?1:0;const on=dn(c.on),off=dn(c.off),left=dn(c.left),arr=dn(c.arr);
  const shipEnd=on!=null?(off!=null?off:Math.max(TODAY,on)):null;
  /* passport dates, when given, decide the stay; the CDC period still counts for an Indian-port voyage (Rule 126 / Rule 8) or when no passport date is entered */
  const hasPass=left!=null||arr!=null,eligible=!!(c.onIndia||c.offIndia);
  if(on!=null&&!c.coastal&&(!hasPass||eligible))out.push([on,shipEnd]);
  if(left!=null){let e=arr!=null?arr-e1:(shipEnd!=null?shipEnd:TODAY);if(arr==null&&left<=TODAY&&e<TODAY)e=TODAY;out.push([left+e1,e]);}
  else if(arr!=null){out.push([on!=null?on:arr,arr-e1]);}
  return out.filter(r=>r[1]>=r[0]);
}
function overlap(a,b,s,e){const x=Math.max(a,s),y=Math.min(b,e);return y>=x?y-x+1:0;}
function shipDaysIn(c,f){const sp=shipSpan(c);if(!sp)return 0;return f!=null?overlap(sp[0],sp[1],fyStart(f),fyEnd(f)):sp[1]-sp[0]+1;}
function compute(){
  const edge=S.settings.edge!==false;let minD=Infinity,maxD=TODAY;
  S.contracts.forEach(c=>["left","on","off","arr"].forEach(k=>{const v=dn(c[k]);if(v!=null){minD=Math.min(minD,v);maxD=Math.max(maxD,v);}}));
  const fyset=new Set();let dataFrom=null,dataTo=null;
  if(minD!==Infinity){dataFrom=fyOf(minD);dataTo=Math.max(fyOf(maxD),fyOf(TODAY));for(let f=dataFrom;f<=dataTo;f++)fyset.add(f);}else fyset.add(fyOf(TODAY));
  Object.keys(S.fy).forEach(k=>{if(S.fy[k]&&S.fy[k].india!=null&&S.fy[k].india!=="")fyset.add(+k);});
  const fys=[...fyset].sort((a,b)=>a-b);
  const lo=Math.min(fyStart(fys[0]),minD),hi=fyEnd(fys[fys.length-1]),len=hi-lo+1;
  const out=new Uint8Array(len),ship=new Uint8Array(len);
  S.contracts.forEach(c=>{ranges(c,edge).forEach(([s,e])=>{for(let d=Math.max(s,lo);d<=Math.min(e,hi);d++)out[d-lo]=1;});
    const sp=c.coastal?null:shipSpan(c);if(sp)for(let d=Math.max(sp[0],lo);d<=Math.min(sp[1],hi);d++)ship[d-lo]=1;});
  const res={};
  fys.forEach(f=>{
    const s=fyStart(f),e=fyEnd(f),days=e-s+1,inData=dataFrom!=null&&f>=dataFrom&&f<=dataTo;
    let outside=0,outPlan=0,shipD=0,outToDate=0;const cells=[];
    for(let d=s;d<=e;d++){const o=out[d-lo];if(o){outside++;if(d>TODAY)outPlan++;else outToDate++;}if(ship[d-lo])shipD++;cells.push(o?(d>TODAY?"p":"o"):(d>TODAY?"u":"l"));}
    const elapsed=TODAY<s?0:Math.min(days,TODAY-s+1);
    const ov=S.fy[f]&&S.fy[f].india!=null&&S.fy[f].india!==""?+S.fy[f].india:null;
    res[f]={f,s,e,days,need:days-181,outside,outPlan,outToDate,shipD,elapsed,cells,inData,override:ov,india:ov!=null?ov:(inData?days-outside:null),indiaToDate:elapsed-outToDate,current:TODAY>=s&&TODAY<=e,future:TODAY<s};
  });
  const known=f=>res[f]?res[f].india:null,order=Object.keys(res).map(Number).sort((a,b)=>a-b),stat={};
  order.forEach(f=>{
    const r=res[f],o=S.fy[f]||{},D=r.india,flags=[];
    if(D==null){r.status="UNK";r.flags=[];return;}
    let p4=0,unk4=0;for(let k=1;k<=4;k++){const v=known(f-k);if(v==null){unk4++;p4+=365;}else p4+=v;}
    let route="",resident=false;
    if(D>=182){resident=true;route="182";}
    else if(o.inc15&&!o.leftEmp&&D>=120&&p4>=365){resident=true;route="120";if(unk4)flags.push("Earlier years are missing, so the 365-day test assumed a full year in India for each.");}
    if(resident&&route==="182"){
      let nr=0,unk10=0;for(let k=1;k<=10;k++){const st=stat[f-k];if(st==="NR")nr++;else if(st==null||st==="UNK")unk10++;}
      let d7=0,unk7=0;for(let k=1;k<=7;k++){const v=known(f-k);if(v==null){unk7++;d7+=365;}else d7+=v;}
      if(nr>=9||d7<=729)r.status="RNOR";else{r.status="ROR";if(unk10||unk7)flags.push("The RNOR test used incomplete history. Add earlier years below; you may qualify as RNOR.");}
    }else if(resident)r.status="RNOR";
    else if(o.inc15&&!o.abroadTax){r.status="RNOR";route="deemed";}
    else r.status="NR";
    r.route=route;r.flags=flags;stat[f]=r.status;
  });
  return {res,order,dataFrom};
}
const statusName=s=>({NR:"Non-Resident (NRI)",RNOR:"Resident but Not Ordinarily Resident",ROR:"Resident and Ordinarily Resident",UNK:"Not enough data"}[s]);
const stColor=s=>({NR:"var(--ok)",RNOR:"var(--warn)",ROR:"var(--bad)"}[s]||"var(--unk)");
function taxLine(r){
  if(r.status==="NR")return {h:"Sea salary: not taxable in India",items:["Salary for service on a foreign-going ship is outside your Indian income, even if credited to an NRE account (CBDT Circular 13/2017).","Indian income such as FD/NRO interest, rent and capital gains is still taxable."]};
  if(r.status==="RNOR")return {h:r.route==="deemed"?"Deemed resident (RNOR): sea salary taxable only if received in India":"Sea salary: taxable only if received in India",items:[r.route==="deemed"?"You are below the day limit, but Indian income over ₹15 lakh with no tax residence elsewhere makes you a deemed resident.":(r.route==="120"?"Your Indian income is above ₹15 lakh and you stayed 120+ days, so you are resident (RNOR).":"You crossed 182 days, but your past NRI years keep you RNOR."),"Salary paid into an Indian bank account counts as received in India and becomes taxable.","Check whether your NRE account needs redesignating under FEMA."]};
  if(r.status==="ROR")return {h:"Sea salary: taxable in India",items:["As ROR your worldwide income, including sea wages, is taxable in India.","Claim treaty relief or foreign tax credit if another country taxed the same income."]};
  return {h:"Add dates for this year",items:["Add contracts covering this year, or enter days in India under Earlier years."]};
}
const actLabel=f=>f>=2026?"Income-tax Act, 2025 · Rule 8 (crew)":"Income-tax Act, 1961 · Rule 126 (crew)";

/* ======================= routing ======================= */
const VIEWS=["dashboard","years","ships","upload","notices","news","account","help","about"];
let VIEW="dashboard",noticesPrevSeen=0;
function show(v){
  if(!VIEWS.includes(v))v="dashboard";VIEW=v;
  VIEWS.forEach(x=>{$("v-"+x).hidden=x!==v;});
  document.querySelectorAll(".nav a").forEach(a=>{if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  document.title=($("v-"+v).dataset.title)+" · Sea Days Ledger";
  if(v==="notices"){noticesPrevSeen=+(lsGet("sdlNoticesSeen")||0);lsSet("sdlNoticesSeen",String(Date.now()));renderNotices();}
  if(v==="upload")renderUploadState();
  if(v==="news"){newsPrevSeen=+(lsGet("sdlNewsSeen")||0);lsSet("sdlNewsSeen",String(Date.now()));renderNews();}
  if(v==="account")renderAccount();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>show(location.hash.slice(1)));

/* ======================= rendering ======================= */
function fillSelect(el,opts,keep){el.innerHTML=opts.map(o=>o.group?`<optgroup label="${esc(o.group)}">${o.items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}</optgroup>`:`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("");if(keep!=null&&[...el.options].some(x=>x.value==keep))el.value=keep;}
const uniq=k=>[...new Set(S.contracts.map(c=>(c[k]||"").trim()).filter(Boolean))].sort();
let C=null;
function render(){
  C=compute();
  const fyOpts=C.order.slice().reverse().map(f=>[f,"FY "+fyLabel(f)]);
  fillSelect($("dFY"),[["","All time"]].concat(fyOpts),$("dFY").value);
  fillSelect($("yFY"),[["","All years"]].concat(fyOpts),$("yFY").value);
  fillSelect($("fFY"),[["","All years"]].concat(fyOpts),$("fFY").value);
  fillSelect($("fType"),[["","All types"]].concat([...new Set(TYPES.concat(uniq("type")))].map(t=>[t,t])),$("fType").value);
  fillSelect($("fRank"),[["","All ranks"]].concat(uniq("rank").map(t=>[t,t])),$("fRank").value);
  fillSelect($("fCompany"),[["","All companies"]].concat(uniq("company").map(t=>[t,t])),$("fCompany").value);
  fillSelect($("fFleet"),[["","All fleets"]].concat(uniq("fleet").map(t=>[t,t])),$("fFleet").value);
  fillSelect($("fFlag"),[["","All flags"]].concat(uniq("flag").map(t=>[t,t])),$("fFlag").value);
  $("companyList").innerHTML=uniq("company").map(f=>`<option value="${esc(f)}">`).join("");
  $("fleetList").innerHTML=uniq("fleet").map(f=>`<option value="${esc(f)}">`).join("");
  $("flagList").innerHTML=[...new Set(uniq("flag").concat(FLAGS))].map(f=>`<option value="${esc(f)}">`).join("");
  $("edgeSet").checked=S.settings.edge!==false;
  $("exampleBanner").hidden=!S.example;
  $("exampleBanner").innerHTML=S.example?`<div class="banner example"><div><b>These are example voyages.</b> Upload your seafarer profile or add a contract, and the examples disappear.</div><div class="actions"><a class="btn btn-primary btn-sm" href="#upload">Upload profile</a><a class="btn btn-sm" href="#ships" id="exAdd">Add contract</a></div></div>`:"";
  renderDashboard();renderYears();renderShips();renderHist();renderNotices();renderNews();updateSyncUI();
}

/* ---------- dashboard ---------- */
function arcH(cx,cy,R,a0,a1){const p=a=>[cx+R*Math.cos(a),cy-R*Math.sin(a)];const [x0,y0]=p(a0),[x1,y1]=p(a1);return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;}
function renderDashboard(){
  const f=fyOf(TODAY),r=C.res[f];
  if(r){
    const need=r.need,out=r.outside,more=Math.max(0,need-out),allow=Math.max(0,181-r.indiaToDate),st=r.status||"UNK";
    const A=v=>Math.PI*(1-Math.min(v,r.days)/r.days),cx=150,cy=140,R=110,ang=A(out),tA=A(need);
    const valCol=out>=need?"#55d69d":(out>=need-20?"#ffc23d":"#ff6b5c"),stCol={NR:"#55d69d",RNOR:"#ffc23d",ROR:"#ff6b5c",UNK:"#9fc3d4"}[st];
    const tx=(rr)=>(cx+rr*Math.cos(tA)).toFixed(1),ty=(rr)=>(cy-rr*Math.sin(tA)).toFixed(1);
    $("bridge").innerHTML=`<div><div class="eyebrow">This year · FY ${fyLabel(f)} · day ${r.elapsed} of ${r.days}</div><div class="big-status" style="color:${stCol}">${st==="UNK"?"—":st}</div><div class="small" style="color:var(--rail-dim)">${esc(statusName(st))}${r.outPlan?" · includes planned dates":""}</div></div>
    <svg class="dial" viewBox="0 0 300 160" role="img" aria-label="${out} days outside India this financial year, ${need} needed">
      <path d="${arcH(cx,cy,R,Math.PI,0)}" stroke="#ffffff1f" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="${arcH(cx,cy,R,Math.PI,tA)}" stroke="#ff6b5c55" stroke-width="16" fill="none"/>
      <path d="${arcH(cx,cy,R,tA,0)}" stroke="#55d69d66" stroke-width="16" fill="none"/>
      ${out>0?`<path d="${arcH(cx,cy,R,Math.PI,ang)}" stroke="${valCol}" stroke-width="16" fill="none" stroke-linecap="round"/>`:""}
      <line x1="${tx(R+8)}" y1="${ty(R+8)}" x2="${tx(R-22)}" y2="${ty(R-22)}" stroke="#fff" stroke-width="2.5"/>
      <text x="${tx(R+21)}" y="${ty(R+21)}" fill="#fff" font-size="10" text-anchor="middle">${need}</text>
      <circle cx="${(cx+R*Math.cos(ang)).toFixed(1)}" cy="${(cy-R*Math.sin(ang)).toFixed(1)}" r="9" fill="#fff" stroke="${valCol}" stroke-width="3"/>
      <text x="${cx}" y="${cy-22}" fill="${valCol}" font-size="38" text-anchor="middle" font-weight="500">${out}</text>
      <text x="${cx}" y="${cy-4}" fill="#9fc3d4" font-size="9" text-anchor="middle" letter-spacing="1">DAYS OUTSIDE INDIA</text>
      <text x="${cx-R}" y="${cy+16}" fill="#9fc3d4" font-size="9" text-anchor="middle">0</text><text x="${cx+R}" y="${cy+16}" fill="#9fc3d4" font-size="9" text-anchor="middle">${r.days}</text>
    </svg>
    <div class="dial-legend"><span><i style="background:#ff6b5c"></i>Below ${need}: resident risk</span><span><i style="background:#55d69d"></i>${need}+: NRI safe</span></div>
    <div class="kvs"><div class="kv"><b>${need}</b><span>days outside needed</span></div><div class="kv"><b>${more}</b><span>more days outside to go</span></div><div class="kv"><b>${allow}</b><span>more India days allowed</span></div></div>`;
    const total=S.contracts.reduce((a,c)=>a+shipDaysIn(c,null),0),prop=S.contracts.reduce((a,c)=>a+(+c.propellingDays||0),0),ships=new Set(S.contracts.map(c=>c.imo||c.vessel)).size;
    const msg=more>0?`Stay outside India for <b>${more} more day${more===1?"":"s"}</b> before 31 March ${f+1} to stay NRI this year.`:`You have <b>${out} days</b> outside India this year, ${out-need} more than the ${need} needed. You're on track to stay NRI.`;
    $("nextStep").innerHTML=`<div class="eyebrow">What this means</div><p class="msg">${msg}</p>
      <div class="tiles"><div class="tile"><b>${nf(total)}</b><span>days at sea · ${approx(total)}</span></div><div class="tile"><b>${S.contracts.length}</b><span>contracts on ${ships} ship${ships===1?"":"s"}</span></div><div class="tile"><b>${nf(prop)||"—"}</b><span>propelling days</span></div><div class="tile"><b>${C.order.filter(x=>C.res[x].status==="NR").length}/${C.order.filter(x=>C.res[x].india!=null).length}</b><span>years as NRI</span></div></div>
      <div class="actions"><a class="btn btn-sm" href="#years">See every year</a><a class="btn btn-sm" href="#ships">Sea service</a></div>`;
  }
  renderRings();renderBars();renderDonuts();
}
const P=(cx,cy,r,a)=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
function arcP(cx,cy,r,a0,a1){if(a1-a0>=Math.PI*2-1e-4)a1=a0+Math.PI*2-1e-3;const [x0,y0]=P(cx,cy,r,a0),[x1,y1]=P(cx,cy,r,a1);return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1-a0>Math.PI?1:0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;}
function sector(cx,cy,ro,ri,a0,a1){
  if(a1-a0>=Math.PI*2-1e-4)return `M${cx} ${cy-ro} A${ro} ${ro} 0 1 1 ${cx-0.01} ${cy-ro}Z M${cx} ${cy-ri} A${ri} ${ri} 0 1 0 ${cx-0.01} ${cy-ri}Z`;
  const L=a1-a0>Math.PI?1:0,[x0,y0]=P(cx,cy,ro,a0),[x1,y1]=P(cx,cy,ro,a1),[x2,y2]=P(cx,cy,ri,a1),[x3,y3]=P(cx,cy,ri,a0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${ro} ${ro} 0 ${L} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${ri} ${ri} 0 ${L} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;}
function renderRings(){
  const fys=C.order.filter(f=>C.res[f].india!=null).slice(-6).reverse();
  if(!fys.length){$("chRings").innerHTML='<div class="empty">Add a contract to see your years.</div>';return;}
  const cx=110,cy=110;let g="";const lg=[];
  fys.forEach((f,i)=>{const r=C.res[f],rad=98-i*15,need=r.need,out=r.inData?r.outside:r.days-r.india,done=r.inData?r.outside-r.outPlan:out,col=stColor(r.status);
    const aDone=done/r.days*Math.PI*2,aAll=out/r.days*Math.PI*2,aNeed=need/r.days*Math.PI*2;
    g+=`<g class="mark" data-tip="${esc(`FY ${fyLabel(f)} · ${r.status}\n${out} days outside (${need} needed)${r.outPlan?`\n${r.outPlan} planned`:""}\n${r.india} days in India`)}"><circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="var(--soft)" stroke-width="11"/>`;
    if(aDone>0)g+=`<path d="${arcP(cx,cy,rad,0,aDone)}" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round"/>`;
    if(aAll>aDone+0.001)g+=`<path d="${arcP(cx,cy,rad,aDone,aAll)}" fill="none" stroke="${col}" stroke-opacity=".4" stroke-width="11"/>`;
    const [t0x,t0y]=P(cx,cy,rad-7,aNeed),[t1x,t1y]=P(cx,cy,rad+7,aNeed);
    g+=`<line x1="${t0x.toFixed(1)}" y1="${t0y.toFixed(1)}" x2="${t1x.toFixed(1)}" y2="${t1y.toFixed(1)}" stroke="var(--ink)" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="transparent" stroke-width="15"/></g>`;
    lg.push(`<div class="li"><span class="sw" style="background:${col}"></span><span class="nm">FY ${fyLabel(f)} <span class="pill ${r.status}" style="padding:0 6px;font-size:.64rem">${r.status}</span></span><span class="v">${out} / ${need}</span></div>`);});
  const inner=98-(fys.length-1)*15-12,nr=fys.filter(f=>C.res[f].status==="NR").length;
  if(inner>24)g+=`<text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="${inner>40?22:15}" fill="var(--ink)" font-weight="500">${nr}/${fys.length}</text><text x="${cx}" y="${cy+17}" text-anchor="middle" font-size="8" fill="var(--muted)" letter-spacing="1">NRI YEARS</text>`;
  $("chRings").innerHTML=`<svg viewBox="0 0 220 220" role="img" aria-label="Days outside India per financial year">${g}</svg><div class="lg"><div class="small muted">Outer ring = latest year · days outside / needed</div>${lg.join("")}</div>`;
}
function renderBars(){
  const fys=C.order.filter(f=>C.res[f].india!=null).slice(-8);
  if(!fys.length){$("chBars").innerHTML='<div class="empty">No years to chart yet.</div>';return;}
  const slot=70,padL=34,padB=26,padT=18,H=220,W=Math.max(460,padL+fys.length*slot+8),plotH=H-padB-padT,y=v=>padT+plotH*(1-v/366);let g="";
  [0,100,200,300].forEach(v=>{g+=`<line x1="${padL}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL-6}" y="${y(v)+3}" text-anchor="end" font-size="9" fill="var(--muted)">${v}</text>`;});
  fys.forEach((f,i)=>{const r=C.res[f],need=r.need,out=r.inData?r.outside:r.days-r.india,done=r.inData?out-r.outPlan:out,plan=out-done,x=padL+i*slot+16,bw=slot-32,col=stColor(r.status);
    g+=`<g class="mark" data-tip="${esc(`FY ${fyLabel(f)} · ${r.status}\n${out} days outside, ${need} needed\n${out>=need?(out-need)+" to spare":(need-out)+" short"}`)}"><rect x="${x-10}" y="${padT}" width="${bw+20}" height="${plotH}" fill="transparent"/>`;
    if(done>0){const h=y(0)-y(done),k=Math.min(4,h);g+=`<path d="M${x} ${y(0)} V${y(done)+k} Q${x} ${y(done)} ${x+4} ${y(done)} H${x+bw-4} Q${x+bw} ${y(done)} ${x+bw} ${y(done)+k} V${y(0)}Z" fill="${col}"/>`;}
    if(plan>0){const top=y(out),bot=y(done)-2;if(bot>top)g+=`<rect x="${x}" y="${top}" width="${bw}" height="${bot-top}" rx="3" fill="${col}" fill-opacity=".4"/>`;}
    g+=`<line x1="${x-6}" x2="${x+bw+6}" y1="${y(need)}" y2="${y(need)}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x+bw/2}" y="${y(Math.max(out,need))-6}" text-anchor="middle" font-size="10" fill="var(--ink)" font-weight="500">${out}</text><text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${fyLabel(f)}</text></g>`;});
  $("chBars").innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Days outside India per financial year">${g}</svg><div class="legend" style="margin-top:4px"><span><i style="background:var(--ok)"></i>NR</span><span><i style="background:var(--warn)"></i>RNOR</span><span><i style="background:var(--bad)"></i>ROR</span><span><i style="background:var(--sea);opacity:.4"></i>Planned</span><span>– – days needed</span></div>`;
}
function donut(el,rows,label){
  const total=rows.reduce((s,r)=>s+r.v,0);
  if(!total){el.innerHTML='<div class="empty">No sea time for this choice.</div>';return;}
  const cx=110,cy=110,ro=96,ri=64;let a=0,g="";
  rows.forEach(r=>{const a1=a+r.v/total*Math.PI*2;g+=`<path class="mark" d="${sector(cx,cy,ro,ri,a,a1)}" fill="${r.c}" stroke="var(--paper)" stroke-width="2" fill-rule="evenodd" data-tip="${esc(r.l+"\n"+r.v+" days · "+approx(r.v)+"\n"+Math.round(r.v/total*100)+"%")}"/>`;a=a1;});
  g+=`<text x="${cx}" y="${cy+2}" text-anchor="middle" font-size="24" fill="var(--ink)" font-weight="500">${nf(total)}</text><text x="${cx}" y="${cy+18}" text-anchor="middle" font-size="9" fill="var(--muted)" letter-spacing="1">DAYS AT SEA</text><text x="${cx}" y="${cy+32}" text-anchor="middle" font-size="9" fill="var(--muted)">${approx(total)}</text>`;
  el.innerHTML=`<svg viewBox="0 0 220 220" role="img" aria-label="${esc(label)}">${g}</svg><div class="lg">${rows.map(r=>`<div class="li"><span class="sw" style="background:${r.c}"></span><span class="nm" title="${esc(r.l)}">${esc(r.l)}</span><span class="v">${r.v}d · ${Math.round(r.v/total*100)}%</span></div>`).join("")}</div>`;
}
let mixKey="rank";
function renderDonuts(){
  const fF=$("dFY").value?+$("dFY").value:null;
  document.querySelectorAll(".dScope").forEach(e=>e.textContent=fF!=null?`Days in FY ${fyLabel(fF)}`:"All time");
  const tm={};S.contracts.forEach(c=>{const d=shipDaysIn(c,fF);if(!d)return;const k=TYPE_COL[c.type]?c.type:"Other types";tm[k]=(tm[k]||0)+d;});
  donut($("chType"),Object.entries(tm).map(([l,v])=>({l,v,c:typeColor(l)})).sort((a,b)=>b.v-a.v),"Sea time by ship type");
  const all={};S.contracts.forEach(c=>{const k=(c[mixKey]||"").trim()||"Not set";all[k]=(all[k]||0)+shipDaysIn(c,null);});
  const top=Object.entries(all).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,7).map(e=>e[0]);
  const mm={};S.contracts.forEach(c=>{const d=shipDaysIn(c,fF);if(!d)return;let k=(c[mixKey]||"").trim()||"Not set";if(!top.includes(k))k="Other";mm[k]=(mm[k]||0)+d;});
  donut($("chMix"),Object.entries(mm).map(([l,v])=>({l,v,c:l==="Other"?"var(--cx)":`var(--c${top.indexOf(l)})`})).sort((a,b)=>b.v-a.v),"Sea time by "+mixKey);
  $("chMixTitle").textContent="Sea time by "+mixKey;
}

/* ---------- years ---------- */
let yStatus="";
function renderYears(){
  const fF=$("yFY").value;let list=C.order.slice().reverse();
  if(fF)list=list.filter(f=>String(f)===fF);if(yStatus)list=list.filter(f=>C.res[f].status===yStatus);
  if(!list.length){$("fyList").innerHTML=`<div class="card empty">No financial year matches these filters.</div>`;return;}
  $("fyList").innerHTML=list.map(f=>{
    const r=C.res[f],o=S.fy[f]||{},st=r.status||"UNK",need=r.need,more=Math.max(0,need-r.outside),ind=r.india,t=taxLine(r);
    const opct=Math.min(100,r.outside/r.days*100);
    return `<article class="card fy ${st}" data-fy="${f}">
    <div class="fy-h"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><h3>FY ${fyLabel(f)}</h3><span class="small muted">${fmt(r.s)} – ${fmt(r.e)} · ${r.days} days · ${actLabel(f)}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${r.current?'<span class="pill plan">In progress</span>':""}${r.outPlan?'<span class="pill plan">Includes planned dates</span>':""}<span class="pill ${st}">${st==="UNK"?"No data":st}</span></div></div>
    <div class="fy-b"><div>
      <div class="stats"><div class="stat hl"><b>${r.inData?r.outside:"—"}</b><span>days outside India</span></div><div class="stat"><b>${ind==null?"—":ind}</b><span>days in India${r.override!=null?" (entered)":(r.current||r.future?" (projected)":"")}</span></div><div class="stat"><b>${r.inData?r.shipD:"—"}</b><span>days on ship (CDC)</span></div><div class="stat"><b>${need}</b><span>days outside needed</span></div></div>
      ${r.inData?`<div class="meter" title="Days outside India against the ${need}-day target"><div class="fill" style="width:${opct}%;background:var(--${r.outside>=need?"ok":(r.outside>=need-20?"warn":"bad")})"></div><div class="thr" style="left:${need/r.days*100}%"></div></div>
      <div class="small muted" style="margin-top:4px">${r.outside>=need?`${r.outside-need} day${r.outside-need===1?"":"s"} to spare`:`${more} more day${more===1?"":"s"} outside needed`}</div>
      <div class="strip" role="img" aria-label="Each day of the year: outside or in India">${r.cells.map(c=>`<i class="${c}"></i>`).join("")}</div><div class="strip-marks">${"AMJJASONDJFM".split("").map(m=>`<span>${m}</span>`).join("")}</div>
      <div class="legend" style="margin-top:6px"><span><i style="background:var(--sea)"></i>Outside India</span><span><i style="background:var(--plan)"></i>Planned</span><span><i style="background:var(--land)"></i>In India</span></div>`:`<p class="small muted" style="margin-top:10px">${r.override!=null?"Days entered under Earlier years.":"No contracts in this year."}</p>`}
    </div>
    <div class="verdict"><b>${esc(t.h)}</b><ul>${t.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>${(r.flags||[]).map(x=>`<div class="warnline">${esc(x)}</div>`).join("")}
      <div class="fyopts">
        <label><input type="checkbox" data-o="inc15" ${o.inc15?"checked":""}><span>Indian income (excluding foreign income) above ₹15 lakh</span></label>
        <label><input type="checkbox" data-o="abroadTax" ${o.abroadTax?"checked":""}><span>Tax resident of another country this year</span></label>
        <label><input type="checkbox" data-o="leftEmp" ${o.leftEmp?"checked":""}><span>The year I first left India for employment</span></label>
      </div></div></div></article>`;}).join("");
}
function renderHist(){
  const cur=fyOf(TODAY),opts=[];for(let f=cur;f>=cur-15;f--)opts.push([f,"FY "+fyLabel(f)]);
  fillSelect($("hFY"),opts,$("hFY").value||String((C.dataFrom||cur)-1));
  const ent=Object.entries(S.fy).filter(([k,v])=>v&&v.india!=null&&v.india!=="").sort((a,b)=>b[0]-a[0]);
  $("hList").innerHTML=ent.length?ent.map(([k,v])=>`<span class="pill UNK" style="margin:0 6px 6px 0">FY ${fyLabel(+k)}: ${v.india} days <button type="button" data-hdel="${k}" style="border:0;background:none;padding:0 0 0 4px;color:inherit" aria-label="Remove FY ${fyLabel(+k)}">✕</button></span>`).join(""):'<span class="muted">No earlier years entered.</span>';
}

/* ---------- ships ---------- */
function filtered(){
  const fF=$("fFY").value,fT=$("fType").value,fR=$("fRank").value,fC=$("fCompany").value,fL=$("fFleet").value,fG=$("fFlag").value,q=$("fVessel").value.trim().toLowerCase(),qd=q.replace(/^imo\s*/,"").replace(/\D/g,"");
  return S.contracts.filter(c=>{
    if(fT&&c.type!==fT)return false;if(fR&&(c.rank||"").trim()!==fR)return false;if(fC&&(c.company||"").trim()!==fC)return false;
    if(fL&&(c.fleet||"").trim()!==fL)return false;if(fG&&(c.flag||"").trim()!==fG)return false;
    if(q&&!((c.vessel||"").toLowerCase().includes(q)||(qd&&String(c.imo||"").includes(qd))))return false;
    if(fF&&!shipDaysIn(c,+fF))return false;return true;
  }).sort((a,b)=>(dn(b.on)||0)-(dn(a.on)||0));
}
function partLine(c){const a=[];if(c.officialNo)a.push("Off. No. "+esc(c.officialNo));if(nf(c.gt))a.push("GT "+nf(c.gt));if(nf(c.propulsionKw))a.push(nf(c.propulsionKw)+" kW");if(c.tradeArea)a.push(esc(c.tradeArea));
  return (a.length?a.join(" · "):'<span class="muted">—</span>')+(c.watch?`<span class="sub">${esc(c.watch)}</span>`:"");}
let totKey="type";
function renderShips(){
  const fF=$("fFY").value?+$("fFY").value:null,list=filtered();
  const n=["fFY","fType","fRank","fCompany","fFleet","fFlag"].map(id=>$(id).value).concat($("fVessel").value.trim()).filter(Boolean).length;
  $("sFilterToggle").textContent=n?`Filters (${n})`:"More filters";
  const tot=list.reduce((a,c)=>a+shipDaysIn(c,fF),0),prop=list.reduce((a,c)=>a+(+c.propellingDays||0),0);
  $("shipTiles").innerHTML=`<div class="tile"><b>${list.length}${n?` <small class="muted" style="font-size:.7rem">of ${S.contracts.length}</small>`:""}</b><span>contracts${n?" match":""}</span></div><div class="tile"><b>${nf(tot)}</b><span>days at sea${fF!=null?` in FY ${fyLabel(fF)}`:""} · ${approx(tot)}</span></div><div class="tile"><b>${nf(prop)||"—"}</b><span>propelling days</span></div>`;
  if(!list.length){$("ctable").innerHTML=`<tbody><tr><td class="empty">${S.contracts.length?"No contracts match these filters.":"No contracts yet. Upload your seafarer profile or add a contract."}</td></tr></tbody>`;}
  else{
    const rows=list.map(c=>{const sp=shipSpan(c),d=sp?sp[1]-sp[0]+1:0,planned=["left","on","off","arr"].some(k=>{const v=dn(c[k]);return v!=null&&v>TODAY;}),pass=c.left||c.arr;
      return `<tr><td data-l="Vessel"><b>${esc(c.vessel)}</b>${planned?' <span class="pill plan">planned</span>':""}<span class="sub">${esc(c.rank||"")}${c.imo?" · IMO "+esc(c.imo):""}</span>${c.flag||c.registry?`<span class="sub">${esc(c.flag||"")}${c.flag&&c.registry?" · ":""}${c.registry?"Reg. "+esc(c.registry):""}</span>`:""}<div class="row-act" style="margin-top:6px"><button type="button" class="btn-sm" data-edit="${esc(c.id)}">Edit</button><button type="button" class="btn-sm btn-danger" data-del="${esc(c.id)}">Delete</button></div></td>
      <td data-l="Type · company"><span class="tchip" style="--tc:${typeColor(c.type)}">${esc(c.type)}</span><span class="sub">${esc(c.company||"—")}${c.fleet?" · "+esc(c.fleet):""}</span></td>
      <td data-l="Sign-on" class="mono">${fmt(dn(c.on))}<span class="sub">${c.onIndia?"Indian port":"Abroad"}${c.onPort?" · "+esc(c.onPort):""}</span></td>
      <td data-l="Sign-off" class="mono">${c.off?fmt(dn(c.off)):'<span class="pill plan">onboard</span>'}<span class="sub">${c.off?(c.offIndia?"Indian port":"Abroad")+(c.offPort?" · "+esc(c.offPort):""):""}</span></td>
      <td data-l="Passport" class="mono">${pass?`${fmt(dn(c.left))} → ${fmt(dn(c.arr))}`:"—"}<span class="sub">${pass?"Counted by passport":"Counted by CDC"}</span></td>
      <td data-l="Days on ship" class="n">${d}<span class="sub">${sp?ymd(sp[0],sp[1]):""}</span></td>
      ${fF!=null?`<td data-l="In FY ${fyLabel(fF)}" class="n">${shipDaysIn(c,fF)}</td>`:""}
      <td data-l="Ship particulars" class="wrap">${partLine(c)}${c.propellingDays!==""&&c.propellingDays!=null?`<span class="sub">${esc(c.propellingDays)} propelling days</span>`:""}</td>
</tr>`;}).join("");
    $("ctable").innerHTML=`<thead><tr><th>Vessel</th><th>Type · company</th><th>Sign-on</th><th>Sign-off</th><th>Passport</th><th class="n">Days on ship</th>${fF!=null?`<th class="n">In FY ${fyLabel(fF)}</th>`:""}<th>Ship particulars</th></tr></thead><tbody>${rows}</tbody>`;
  }
  const m={};list.forEach(c=>{const k=(c[totKey]||"").trim()||"Not set";m[k]=m[k]||{d:0,n:0,p:0};m[k].d+=shipDaysIn(c,fF);m[k].n++;m[k].p+=(+c.propellingDays||0);});
  const rows=Object.entries(m).sort((a,b)=>b[1].d-a[1].d),max=Math.max(1,...rows.map(r=>r[1].d)),T=rows.reduce((s,r)=>s+r[1].d,0);
  const label={type:"Ship type",rank:"Rank",company:"Company",fleet:"Fleet",flag:"Flag"}[totKey];
  $("totTable").innerHTML=rows.length?`<thead><tr><th>${label}</th><th class="n">Contracts</th><th class="n">Days</th><th class="n">Y M D</th><th class="n">Propelling</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><td style="min-width:160px">${esc(k)}<div class="bar"><i style="width:${v.d/max*100}%;--tc:${totKey==="type"?typeColor(k):"var(--sea)"}"></i></div></td><td class="n">${v.n}</td><td class="n">${nf(v.d)}</td><td class="n">${approx(v.d)}</td><td class="n">${nf(v.p)||"—"}</td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td class="n">${rows.reduce((s,r)=>s+r[1].n,0)}</td><td class="n">${nf(T)}</td><td class="n">${approx(T)}</td><td class="n">${nf(rows.reduce((s,r)=>s+r[1].p,0))||"—"}</td></tr></tfoot>`:`<tbody><tr><td class="empty">Nothing to total.</td></tr></tbody>`;
}

/* ---------- contract form ---------- */
fillSelect($("c_type"),[["","Select…"]].concat(TYPES.map(t=>[t,t])));
fillSelect($("c_rank"),[["","Select rank…"]].concat(Object.entries(RANKS).map(([g,items])=>({group:g+" department",items}))).concat([["__other","Other (type it)"]]));
const radio=n=>document.querySelector(`input[name=${n}]:checked`).value;
const setRadio=(n,v)=>{document.querySelector(`input[name=${n}][value=${v}]`).checked=true;};
const numOrBlank=id=>$(id).value===""?"":+$(id).value;
function readForm(){return {id:$("c_id").value||uid(),vessel:$("c_vessel").value.trim(),type:$("c_type").value,rank:$("c_rank").value==="__other"?$("c_rankOther").value.trim():$("c_rank").value,
  imo:$("c_imo").value.trim(),company:$("c_company").value.trim(),fleet:$("c_fleet").value.trim(),flag:$("c_flag").value.trim(),registry:$("c_registry").value.trim(),
  officialNo:$("c_officialNo").value.trim(),gt:numOrBlank("c_gt"),propulsionKw:numOrBlank("c_propulsionKw"),propellingDays:numOrBlank("c_propellingDays"),tradeArea:$("c_tradeArea").value,watch:$("c_watch").value.trim(),notes:$("c_notes").value.trim(),
  on:$("c_on").value,off:$("c_off").value,left:$("c_left").value,arr:$("c_arr").value,onIndia:radio("onIn")==="india",offIndia:radio("offIn")==="india",onPort:$("c_onport").value.trim(),offPort:$("c_offport").value.trim(),coastal:$("c_coastal").checked};}
function validate(c){
  if(!c.vessel)return "Enter the vessel name.";if(!c.type)return "Choose the type of ship.";if(!c.rank)return "Choose your rank.";if(!c.on)return "Enter the CDC sign-on date.";
  const L=dn(c.left),O=dn(c.on),X=dn(c.off),A=dn(c.arr);
  if(X!=null&&X<O)return "Sign-off is before sign-on.";if(L!=null&&O<L&&!c.onIndia)return "Sign-on abroad is before the date you left India.";
  if(A!=null&&X!=null&&A<X&&!c.offIndia)return "Arrival in India is before sign-off.";if(A!=null&&L!=null&&A<L)return "Arrival in India is before leaving India.";return "";}
function calcLine(){
  const c=readForm(),O=dn(c.on);if(O==null){$("calcline").innerHTML='<span class="muted">Enter the sign-on date to see days onboard.</span>';return;}
  const X=dn(c.off)!=null?dn(c.off):Math.max(TODAY,O),parts=[`<span>On ship: <b class="mono">${X-O+1}</b> days (${ymd(O,X)})${c.off?"":" so far"}</span>`],byF={};
  for(let d=O;d<=X;d++){const f=fyOf(d);byF[f]=(byF[f]||0)+1;}
  Object.entries(byF).forEach(([f,n])=>parts.push(`<span>FY ${fyLabel(+f)}: <b class="mono">${n}</b></span>`));
  parts.push(`<span class="muted">${c.left||c.arr?"Counted by passport dates":"Counted by CDC dates"}</span>`);
  $("calcline").innerHTML=parts.join("");}
function openForm(c){
  $("cform").reset();$("formErr").textContent="";setRadio("onIn","abroad");setRadio("offIn","abroad");$("rankOtherWrap").hidden=true;$("c_id").value="";
  if(c){["vessel","type","company","fleet","imo","flag","registry","officialNo","gt","propulsionKw","propellingDays","tradeArea","watch","notes","on","off","left","arr"].forEach(k=>{const el=$("c_"+k);if(el)el.value=c[k]==null?"":c[k];});
    $("c_onport").value=c.onPort||"";$("c_offport").value=c.offPort||"";$("c_coastal").checked=!!c.coastal;$("c_id").value=c.id;
    if(!c.rank)$("c_rank").value="";else if(ALLRANKS.includes(c.rank))$("c_rank").value=c.rank;else{$("c_rank").value="__other";$("c_rankOther").value=c.rank;$("rankOtherWrap").hidden=false;}
    setRadio("onIn",c.onIndia?"india":"abroad");setRadio("offIn",c.offIndia?"india":"abroad");}
  $("formTitle").textContent=c?"Edit "+c.vessel:"Add contract";$("saveBtn").textContent=c?"Save changes":"Save contract";
  $("formCard").hidden=false;calcLine();$("formCard").scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});$("c_vessel").focus({preventScroll:true});}
function closeForm(){$("formCard").hidden=true;}
$("c_rank").addEventListener("change",()=>{$("rankOtherWrap").hidden=$("c_rank").value!=="__other";});
$("cform").addEventListener("input",calcLine);$("cform").addEventListener("change",calcLine);
$("cform").addEventListener("submit",e=>{e.preventDefault();const c=readForm(),err=validate(c);if(err){$("formErr").textContent=err;return;}
  if(S.example)leaveExample();c.u=Date.now();const ex=S.contracts.find(x=>x.id===c.id);
  if(ex){["source"].forEach(k=>{if(ex[k]!=null)c[k]=ex[k];});S.contracts=S.contracts.map(x=>x.id===c.id?c:x);}else S.contracts.push(c);
  saveLocal();closeForm();render();toast(ex?"Contract updated":"Contract saved on this device");});
$("addBtn").addEventListener("click",()=>openForm(null));$("formClose").addEventListener("click",closeForm);$("cancelBtn").addEventListener("click",closeForm);
let pendingDel=null;
$("ctable").addEventListener("click",e=>{
  const ed=e.target.closest("[data-edit]");if(ed){openForm(S.contracts.find(x=>x.id===ed.dataset.edit));return;}
  const del=e.target.closest("[data-del]");if(!del)return;
  if(pendingDel===del.dataset.del){if(S.example)leaveExample();else{S.contracts=S.contracts.filter(x=>x.id!==del.dataset.del);(S.deleted=S.deleted||[]).push({id:del.dataset.del,u:Date.now()});}pendingDel=null;saveLocal();render();toast("Contract deleted");}
  else{pendingDel=del.dataset.del;del.textContent="Tap again to delete";setTimeout(()=>{if(pendingDel===del.dataset.del){pendingDel=null;del.textContent="Delete";}},4000);}
});
["fFY","fType","fRank","fCompany","fFleet","fFlag"].forEach(id=>$(id).addEventListener("change",renderShips));
$("fVessel").addEventListener("input",renderShips);
$("fReset").addEventListener("click",()=>{["fFY","fType","fRank","fCompany","fFleet","fFlag"].forEach(id=>$(id).value="");$("fVessel").value="";renderShips();});
$("sFilterToggle").addEventListener("click",()=>{const o=$("sFilters").classList.toggle("open");$("sFilterToggle").setAttribute("aria-expanded",String(o));});
$("totSeg").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(!b)return;totKey=b.dataset.k;$("totSeg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderShips();});
$("dFY").addEventListener("change",renderDonuts);
$("mixSeg").addEventListener("click",e=>{const b=e.target.closest("[data-mix]");if(!b)return;mixKey=b.dataset.mix;$("mixSeg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderDonuts();});
$("yFY").addEventListener("change",renderYears);
$("yStatus").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;yStatus=b.dataset.s;$("yStatus").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderYears();});
$("fyList").addEventListener("change",e=>{const cb=e.target.closest("[data-o]");if(!cb)return;if(S.example)leaveExample();const f=cb.closest("[data-fy]").dataset.fy;S.fy[f]=Object.assign({},S.fy[f],{[cb.dataset.o]:cb.checked});saveLocal();render();});
$("edgeSet").addEventListener("change",e=>{S.settings.edge=e.target.checked;saveLocal();render();});
$("hAdd").addEventListener("click",()=>{const f=$("hFY").value,v=$("hDays").value;if(v===""||+v<0||+v>366){toast("Enter days in India between 0 and 366.");return;}if(S.example)leaveExample();S.fy[f]=Object.assign({},S.fy[f],{india:Math.round(+v)});$("hDays").value="";saveLocal();render();});
$("hList").addEventListener("click",e=>{const b=e.target.closest("[data-hdel]");if(!b)return;if(S.fy[b.dataset.hdel])delete S.fy[b.dataset.hdel].india;saveLocal();render();});

/* ---------- notices ---------- */
let NOTICES=lsJSON("sdlNotices",[]),nLevel="";noticesPrevSeen=+(lsGet("sdlNoticesSeen")||0);
function renderNoticeBadge(){const seen=+(lsGet("sdlNoticesSeen")||0),n=NOTICES.filter(x=>(+x.createdAt||0)>seen).length;$("noticeBadge").hidden=!n;$("noticeBadge").textContent=n;}
function renderNotices(){
  renderNoticeBadge();const admin=isAdmin(),list=NOTICES.filter(n=>!nLevel||n.level===nLevel),seen=noticesPrevSeen;
  $("composerCard").hidden=!admin;
  if(!list.length){$("noticeList").innerHTML=`<div class="empty">${NOTICES.length?"No notices at this level.":(lsGet("sdlSynced")?"No notices yet.":"Press Sync while online to load notices.")}</div>`;return;}
  $("noticeList").innerHTML=list.map(n=>{const lv=["info","important","urgent"].includes(n.level)?n.level:"info";
    return `<div class="notice ${lv}"><div class="lvl"></div><div class="nb"><div class="nt">${esc(n.title||"Update")}</div>${n.body?`<div class="nm">${esc(n.body)}</div>`:""}
    <div class="nd">${(+n.createdAt||0)>seen?'<span class="newtag">NEW</span>':""}<span>${lv==="info"?"Info":lv==="important"?"Important":"Urgent"}</span><span>· ${n.createdAt?when(+n.createdAt):""}</span>${admin?`<button type="button" class="btn-sm btn-danger" data-ndel="${esc(n.id)}">Delete</button>`:""}</div></div></div>`;}).join("");
}
$("nFilter").addEventListener("click",e=>{const b=e.target.closest("[data-l]");if(!b)return;nLevel=b.dataset.l;$("nFilter").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderNotices();});

/* ---------- news ---------- */
let NEWS=lsJSON("sdlNews",{items:[]}),newsTopic="All",newsShow="all",newsPrevSeen=+(lsGet("sdlNewsSeen")||0);
let SAVED=lsJSON("sdlNewsSaved",{}); /* starred headlines, kept on this device even after they leave the 60-day window */
const newsKey=n=>String(n.title||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,70);
function newsNewCount(){const seen=+(lsGet("sdlNewsSeen")||0);return (NEWS.items||[]).filter(n=>(+n.addedAt||0)>seen).length;}
function renderNewsBadge(){const n=newsNewCount();$("newsBadge").hidden=!n;$("newsBadge").textContent=n;}
function relDate(s){const n=dn(s);if(n==null)return "";const d=TODAY-n;return d<=0?"Today":d===1?"Yesterday":d<7?d+" days ago":fmt(n);}
function renderNews(){
  renderNewsBadge();
  $("newsTopics").innerHTML=TOPICS.map(t=>`<button type="button" aria-pressed="${t===newsTopic}" data-topic="${esc(t)}">${esc(t)}</button>`).join("");
  const nSaved=Object.keys(SAVED).length;
  $("newsShow").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.show===newsShow)));
  $("savedCount").textContent=nSaved?` (${nSaved})`:"";
  $("newsUpdated").textContent=NEWS.updatedAt?`Last updated ${when(NEWS.updatedAt)} · keeps the last 60 days (up to 300 headlines). New headlines arrive only when you press Sync.`:"Press Sync while online to load the latest headlines.";
  const q=$("newsSearch").value.trim().toLowerCase(),seen=newsPrevSeen;
  const pool=newsShow==="saved"?Object.values(SAVED):(NEWS.items||[]);
  const items=pool.filter(n=>(newsTopic==="All"||n.topic===newsTopic)&&(newsShow!=="new"||(+n.addedAt||0)>seen)&&(!q||(String(n.title)+" "+String(n.summary||"")+" "+String(n.source||"")).toLowerCase().includes(q))).sort((a,b)=>(+b.ts||0)-(+a.ts||0)||String(b.date).localeCompare(String(a.date)));
  if(!items.length){$("newsList").innerHTML=`<div class="empty">${newsShow==="saved"?(nSaved?"No saved headlines match this topic or search.":"Nothing saved yet. Tap ☆ on a headline to keep it on this device."):(NEWS.items||[]).length?(newsShow==="new"?"No new headlines since you last looked.":"No headlines match this topic or search."):"No headlines yet. Press Sync while online."}</div>`;return;}
  $("newsList").innerHTML=items.map(n=>{const d=dn(n.date),dd=d!=null?new Date(d*DAY):null,safe=/^https:\/\//i.test(String(n.url||""))?n.url:"#",isNew=newsShow!=="saved"&&(+n.addedAt||0)>seen,k=newsKey(n),st=!!SAVED[k];
    return `<div class="news"><div class="dt">${dd?`<b>${dd.getUTCDate()}</b>${MON[dd.getUTCMonth()]}`:""}</div><a class="nlink" href="${esc(safe)}" target="_blank" rel="noopener noreferrer"><div class="hl">${isNew?'<span class="newtag">NEW</span> ':""}${esc(n.title)}</div>${n.summary?`<div class="gist">${esc(n.summary)}</div>`:""}<div class="meta"><span class="tchip" style="--tc:${TOPIC_COL[n.topic]||"var(--cx)"}">${esc(n.topic||"General")}</span><span>${esc(n.source||"")}</span><span>· ${esc(relDate(n.date))}</span><span class="opens">Opens the full article online ↗</span></div></a><button type="button" class="star" data-star="${esc(k)}" aria-pressed="${st}" aria-label="${st?"Remove from saved":"Save for later"}" title="${st?"Remove from saved":"Save for later"}">${st?"★":"☆"}</button></div>`;}).join("");
}
function toggleSave(k){
  if(SAVED[k]){delete SAVED[k];toast("Removed from saved");}
  else{const n=(NEWS.items||[]).find(x=>newsKey(x)===k);if(!n)return;SAVED[k]=Object.assign({},n,{savedAt:Date.now()});toast("Saved on this device");}
  lsSet("sdlNewsSaved",JSON.stringify(SAVED));renderNews();
}
$("newsList").addEventListener("click",e=>{const b=e.target.closest("[data-star]");if(!b)return;e.preventDefault();toggleSave(b.dataset.star);});
$("newsTopics").addEventListener("click",e=>{const b=e.target.closest("[data-topic]");if(!b)return;newsTopic=b.dataset.topic;renderNews();});
$("newsShow").addEventListener("click",e=>{const b=e.target.closest("[data-show]");if(!b)return;newsShow=b.dataset.show;renderNews();});
$("newsSearch").addEventListener("input",renderNews);

/* ======================= Firebase (loaded only when needed, online) ======================= */
let fb=null,fbUser=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("load"));document.head.appendChild(s);});}
async function fbReady(){
  if(fb)return fb;
  if(!navigator.onLine)throw Object.assign(new Error("offline"),{code:"offline"});
  if(!window.firebase){await loadScript("vendor/firebase-app-compat.js");await loadScript("vendor/firebase-auth-compat.js");await loadScript("vendor/firebase-firestore-compat.js");}
  const app=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(FB_CONFIG);
  const auth=app.auth(),db=app.firestore();
  await new Promise(r=>{const un=auth.onAuthStateChanged(u=>{un();r(u);});});
  auth.onAuthStateChanged(u=>{const changed=(u&&u.uid)!==(fbUser&&fbUser.uid);fbUser=u;rememberUser(u);if(changed){renderAccount();renderNotices();updateSyncUI();}});
  fbUser=auth.currentUser;rememberUser(fbUser);fb={auth,db};return fb;
}
function rememberUser(u){if(u){lsSet("sdlUser",JSON.stringify({email:u.email,verified:!!u.emailVerified,uid:u.uid}));}else lsSet("sdlUser","");}
const savedUser=()=>lsJSON("sdlUser",null);
const isAdmin=()=>{const u=fbUser||savedUser();return !!(u&&u.email&&u.email.toLowerCase()===ADMIN_EMAIL&&(u.emailVerified||u.verified));};
function authMsg(e){const c=(e&&e.code)||"";return ({"auth/invalid-email":"That email address doesn't look right.","auth/missing-password":"Enter your password.","auth/weak-password":"Use a password of at least 6 characters.","auth/email-already-in-use":"An account with this email already exists. Sign in instead.","auth/invalid-credential":"Email or password is wrong. First time here? Tap Create account instead.","auth/wrong-password":"Email or password is wrong.","auth/user-not-found":"No account with this email. Create one first.","auth/too-many-requests":"Too many tries. Wait a few minutes and try again.","auth/network-request-failed":"No internet connection. Try again when you're online.","offline":"You're offline. Connect to the internet and try again."})[c]||"Something went wrong. Please try again.";}

/* ---------- account view ---------- */
function renderAccount(){
  const u=fbUser?{email:fbUser.email,verified:fbUser.emailVerified}:savedUser(),box=$("acctBox"),last=+(lsGet("sdlSynced")||0);
  if(u&&u.email){
    box.innerHTML=`<div class="eyebrow">Signed in</div><div style="font-size:1.1rem;font-weight:600">${esc(u.email)}</div>
      ${u.verified?'<span class="pill NR" style="align-self:flex-start">Email verified</span>':`<div class="banner warn"><div>Your email isn't verified yet. Open the link we emailed you${u.email.toLowerCase()===ADMIN_EMAIL?" (needed to post notices)":""}, then press Sync.</div></div><div class="actions"><button type="button" id="resendV" class="btn-sm">Send the link again</button></div>`}
      <p class="small muted">Last synced: ${last?when(last):"never"}. Press <b>Sync</b> on the left to combine this device's data with your account.</p>
      <div class="actions"><button type="button" id="acctSync" class="btn-primary">Sync now</button><button type="button" id="signOut" class="btn-ghost">Sign out</button></div>
      <p class="small muted">Signing out keeps your data on this device.</p>`;
    $("acctSync").onclick=syncAll;
    $("signOut").onclick=async()=>{try{const f=await fbReady();await f.auth.signOut();}catch(e){}fbUser=null;rememberUser(null);renderAccount();renderNotices();updateSyncUI();toast("Signed out. Your data stays on this device.");};
    const rv=$("resendV");if(rv)rv.onclick=async()=>{try{const f=await fbReady();if(f.auth.currentUser){await f.auth.currentUser.sendEmailVerification();toast("Verification email sent.");}}catch(e){toast(authMsg(e));}};
    return;
  }
  box.innerHTML=`<p class="small muted">Without signing in, your data is saved on this device only. Sign in to sync it to your phone, iPad and computer.</p>
    <form id="authForm" class="acct" novalidate>
      <label class="f"><span>Email</span><input id="aEmail" type="email" autocomplete="email" inputmode="email"></label>
      <label class="f"><span>Password</span><input id="aPass" type="password" autocomplete="current-password" minlength="6"></label>
      <div class="actions"><button type="submit" class="btn-primary" id="aIn">Sign in</button><button type="button" id="aUp">Create account</button><button type="button" class="btn-ghost" id="aReset">Forgot password?</button></div>
      <span class="err" id="aErr"></span>
      <p class="small muted">${navigator.onLine?"":"You're offline. Signing in needs internet."}</p>
    </form>`;
  const go=async(kind)=>{const em=$("aEmail").value.trim(),pw=$("aPass").value;$("aErr").textContent="";
    if(!em){$("aErr").textContent="Enter your email.";return;}
    try{const f=await fbReady();
      if(kind==="reset"){await f.auth.sendPasswordResetEmail(em);$("aErr").textContent="";toast("Password reset email sent to "+em);return;}
      if(!pw){$("aErr").textContent="Enter your password.";return;}
      if(kind==="up"){const cr=await f.auth.createUserWithEmailAndPassword(em,pw);try{await cr.user.sendEmailVerification();}catch(e){}toast("Account created. We've emailed you a link to verify your address.",6000);}
      else{await f.auth.signInWithEmailAndPassword(em,pw);toast("Signed in. Press Sync to bring in your data.",5000);}
      fbUser=f.auth.currentUser;rememberUser(fbUser);renderAccount();renderNotices();updateSyncUI();
    }catch(e){$("aErr").textContent=authMsg(e);}};
  $("authForm").addEventListener("submit",e=>{e.preventDefault();go("in");});
  $("aUp").onclick=()=>go("up");$("aReset").onclick=()=>go("reset");
}

/* ---------- notices: post / delete (author only) ---------- */
$("composer").addEventListener("submit",async e=>{e.preventDefault();const t=$("nTitle").value.trim(),b=$("nBody").value.trim();
  if(!t&&!b){$("nErr").textContent="Write a title or message first.";return;}
  $("nErr").textContent="Posting…";
  try{const f=await fbReady();const u=f.auth.currentUser;if(!u)throw {code:"x"};await u.reload();await u.getIdToken(true);
    await f.db.collection("notices").add({title:t||"Update",body:b,level:$("nLevel").value,createdAt:Date.now()});
    $("nTitle").value="";$("nBody").value="";$("nErr").textContent="Posted";await fetchNotices();lsSet("sdlNoticesSeen",String(Date.now()));renderNotices();setTimeout(()=>$("nErr").textContent="",2500);}
  catch(err){$("nErr").textContent=err&&err.code==="offline"?"You're offline.":"Couldn't post. Check you're signed in with a verified email.";}
});
let pendingN=null;
$("noticeList").addEventListener("click",async e=>{const b=e.target.closest("[data-ndel]");if(!b)return;
  if(pendingN!==b.dataset.ndel){pendingN=b.dataset.ndel;b.textContent="Tap again to delete";setTimeout(()=>{if(pendingN===b.dataset.ndel){pendingN=null;b.textContent="Delete";}},4000);return;}
  pendingN=null;b.textContent="Deleting…";
  try{const f=await fbReady();await f.db.collection("notices").doc(b.dataset.ndel).delete();await fetchNotices();renderNotices();toast("Notice deleted");}catch(err){b.textContent="Couldn't delete";}
});
async function fetchNotices(){const f=await fbReady();const q=await f.db.collection("notices").orderBy("createdAt","desc").limit(40).get();NOTICES=q.docs.map(d=>Object.assign({id:d.id},d.data()));lsSet("sdlNotices",JSON.stringify(NOTICES));}
function timed(url,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||12000);return fetch(url,{signal:c.signal,cache:"no-store"}).finally(()=>clearTimeout(t));}
const plain=h=>{try{return (new DOMParser().parseFromString(String(h||""),"text/html").body.textContent||"").replace(/\s+/g," ").trim();}catch(e){return "";}};
const words=(t,n)=>{const w=t.split(" ");return w.length>n?w.slice(0,n).join(" ")+"…":t;};
async function readFeed(f){
  let raw=[];
  try{const r=await timed("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(f.url));const j=await r.json();
    if(j&&j.status==="ok"&&Array.isArray(j.items))raw=j.items.map(i=>({title:i.title,link:i.link,date:i.pubDate?i.pubDate.replace(" ","T")+"Z":"",desc:i.description||i.content||""}));else throw 0;}
  catch(e){const r=await timed("https://api.allorigins.win/raw?url="+encodeURIComponent(f.url));if(!r.ok)throw new Error("feed");
    const x=new DOMParser().parseFromString(await r.text(),"text/xml");
    raw=[...x.querySelectorAll("item")].slice(0,20).map(i=>({title:i.querySelector("title")?.textContent||"",link:i.querySelector("link")?.textContent||"",date:i.querySelector("pubDate")?.textContent||"",desc:i.querySelector("description")?.textContent||"",src:i.querySelector("source")?.textContent||""}));}
  return raw.map(i=>{let title=plain(i.title),source=f.name;
    if(f.gn){const m=title.match(/^(.*) - ([^-]{2,60})$/);if(m){title=m[1].trim();source=m[2].trim();}else if(i.src)source=i.src;}
    const ts=Date.parse(i.date)||0,d=ts?new Date(ts):null;
    return {title,source,url:String(i.link||"").trim(),ts,date:d?d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()):"",summary:f.gn?"":words(plain(i.desc).replace(/The post .*? appeared first on .*$/i,"").trim(),28),topic:topicOf(title+" "+(f.gn?"":plain(i.desc)))};
  }).filter(n=>n.title&&/^https:\/\//i.test(n.url));
}
/* built every few hours by a free GitHub job; read only when Sync is pressed.
   If this device synced news in the last 2.5 days, only the small "recent" file (headlines added in the last 3 days) is downloaded. */
async function getJSON(name){
  for(const u of ["https://raw.githubusercontent.com/bluewavealgo/sdl-7k4q2/main/"+name,name]){
    try{const r=await timed(u+"?ts="+Date.now(),10000);if(!r.ok)continue;const j=await r.json();if(j&&Array.isArray(j.items))return j;}catch(e){}
  }
  return null;
}
async function readNewsFile(){
  const last=+(lsGet("sdlNewsServerAt")||0),haveSome=(NEWS.items||[]).length>0;
  let j=null;
  if(haveSome&&last&&Date.now()-last<2.5*DAY)j=await getJSON("news-recent.json");
  if(!j||(!j.items.length&&!haveSome))j=await getJSON("news.json");
  if(!j)return [];
  if(j.updatedAt)lsSet("sdlNewsServerAt",String(j.updatedAt));
  return j.items.length?j.items:[{__empty:true}];
}
async function fetchNews(){
  let fresh=await readNewsFile(),res=[];
  if(!fresh.length){res=await Promise.allSettled(FEEDS.map(readFeed));fresh=[].concat(...res.filter(r=>r.status==="fulfilled").map(r=>r.value));}
  if(!fresh.length)throw new Error("news");
  fresh=fresh.filter(n=>!n.__empty);
  const key=newsKey,now=Date.now(),have=new Map((NEWS.items||[]).map(n=>[key(n),n])),urls=new Set((NEWS.items||[]).map(n=>n.url));
  fresh.forEach(n=>{if(!n||!n.title||!/^https:\/\//i.test(String(n.url||"")))return;const k=key(n);if(!have.has(k)&&!urls.has(n.url)){n=Object.assign({},n,{addedAt:now});have.set(k,n);urls.add(n.url);}});
  const cutoff=now-60*DAY;
  NEWS={updatedAt:now,items:[...have.values()].filter(n=>(+n.ts||Date.parse(n.date)||now)>=cutoff).sort((a,b)=>(+b.ts||0)-(+a.ts||0)).slice(0,300),failed:res.filter(r=>r.status==="rejected").length};
  lsSet("sdlNews",JSON.stringify(NEWS));
}

/* ======================= Sync (only when pressed) ======================= */
let syncing=false;
function updateSyncUI(){
  const on=navigator.onLine,last=+(lsGet("sdlSynced")||0),btn=$("syncBtn"),pending=!S.example&&(+S.updatedAt||0)>last;
  $("netState").classList.toggle("on",on);$("netState").querySelector("span").textContent=on?"Online":"Offline";
  btn.classList.toggle("off",!on);btn.classList.toggle("spin",syncing);
  $("syncLbl").textContent=syncing?"Syncing…":(window.sdlUpdateReady&&on?"Sync · update ready":"Sync");
  $("syncWhen").textContent=!on?"Offline · saved on device":(last?"Last synced "+when(last):"Not synced yet");
  $("syncDot").hidden=!(pending||window.sdlUpdateReady);
  btn.title=pending?"You have changes on this device that aren't synced yet":"";
}
async function syncAll(){
  if(syncing)return;
  if(!navigator.onLine){toast("You're offline. Your data is saved on this device; press Sync when you're connected.");return;}
  syncing=true;updateSyncUI();const notes=[];
  try{
    try{await fetchNews();}catch(e){notes.push("news");}
    try{await fetchNotices();}catch(e){notes.push("notices");}
    let dataMsg="";
    if(fbUser||savedUser()){
      try{const f=await fbReady();const u=f.auth.currentUser;
        if(u){try{await u.reload();}catch(e){}rememberUser(f.auth.currentUser);}
        if(!u){dataMsg="Sign in again to sync your data.";}
        else{const ref=f.db.collection("users").doc(u.uid);const snap=await ref.get({source:"server"});
          if(snap.exists&&snap.data().ledger){merge(JSON.parse(snap.data().ledger));}
          if(!S.example){S.updatedAt=Date.now();lsSet("seaDaysLedger",JSON.stringify(snapshot()));await ref.set({ledger:JSON.stringify(snapshot()),updatedAt:S.updatedAt,email:u.email||""});}
          dataMsg="Your data is synced.";}
      }catch(e){notes.push("your data");}
    }else dataMsg="Sign in under Account to sync your data between devices.";
    lsSet("sdlSynced",String(Date.now()));
    render();
    if(typeof window.sdlAppUpdate==="function"&&await window.sdlAppUpdate()){return;}
    /* safety net: if this device is still on an older version (no service worker, or a stuck one), clear the stored app files and load the new version; your data is kept */
    try{const vr=await timed("version.json?ts="+Date.now(),8000);const vj=vr.ok?await vr.json():null;
      if(vj&&vj.v&&APP_V&&vj.v>APP_V){toast("Installing the new version…",4000);
        try{if(navigator.serviceWorker){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(x=>x.unregister()));}}catch(e){}
        try{if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));}}catch(e){}
        location.replace(location.pathname+"?v="+vj.v+"#"+VIEW);return;}}catch(e){}
    toast(notes.length?`Synced, but ${notes.join(" and ")} couldn't load. Try again shortly.`:("Up to date. "+dataMsg),5000);
  }finally{syncing=false;updateSyncUI();}
}
$("syncBtn").addEventListener("click",syncAll);
addEventListener("online",()=>{updateSyncUI();renderUploadState();});addEventListener("offline",()=>{updateSyncUI();renderUploadState();});
document.addEventListener("sdl-update",updateSyncUI);

/* ======================= theme ======================= */
const mq=matchMedia("(prefers-color-scheme: dark)");
function applyTheme(){const t=lsGet("sdlTheme"),dark=t?t==="dark":mq.matches;if(t)document.documentElement.setAttribute("data-theme",t);$("themeBtn").textContent=dark?"☾ Night":"☀ Day";$("themeBtn").setAttribute("aria-label",dark?"Switch to day mode":"Switch to night mode");}
$("themeBtn").addEventListener("click",()=>{const dark=$("themeBtn").textContent.includes("Night");lsSet("sdlTheme",dark?"light":"dark");applyTheme();});
if(mq.addEventListener)mq.addEventListener("change",()=>{if(!lsGet("sdlTheme"))applyTheme();});

/* ======================= DG Shipping profile upload ======================= */
/* shared DG Shipping profile parser (copied verbatim into the page) */
function sdlLinesFromItems(items){
  const rows=[];
  items.forEach(it=>{if(!it.str||!it.str.trim())return;const y=Math.round(it.transform[5]),x=it.transform[4];
    let row=rows.find(r=>Math.abs(r.y-y)<=2);if(!row){row={y,parts:[]};rows.push(row);}row.parts.push({x,s:it.str});});
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>r.parts.sort((a,b)=>a.x-b.x).map(p=>p.s).join(" ").replace(/\s+/g," ").trim());
}
const SDL_KEYS=[["vessel","Ship Name"],["flag","Flag"],["officialNo","Official No\\.?"],["registry","Port of Registry"],["imo","IMO Number"],["ptype","Ship Type"],["gt","\\bGT"],["tradeArea","Trade Area"],["rank","Rank"],["watch","Nature of watch ?keeping"],["on","Service From \\(Date\\)"],["off","Service To \\(Date\\)"],["artM","Article of Months"],["artD","Article Days"],["propulsionKw","Propulsion power ?\\(KW\\)"],["ptypeProp","Propulsion Type"],["propellingDays","Propelling days"],["remarks","Remarks"]];
function sdlParseProfile(text){
  const t=text.replace(/\r/g,"");
  const keyRe=new RegExp("("+SDL_KEYS.map(k=>k[1]).join("|")+")\\s*:","gi");
  const starts=[];const startRe=/\d+\s*\.\s*Ship Name\s*:/gi;let m;
  while((m=startRe.exec(t)))starts.push(m.index);
  const recs=[];
  starts.forEach((s,i)=>{
    let chunk=t.slice(s,i+1<starts.length?starts[i+1]:t.length);
    chunk=chunk.replace(/^\d+\s*\.\s*/,"");
    const cut=chunk.search(/Report generated on|Total no of record|Post Sea Training|Page \d+ of \d+/i);
    const hits=[];let k;keyRe.lastIndex=0;
    while((k=keyRe.exec(chunk)))hits.push({name:k[1],start:k.index,end:keyRe.lastIndex});
    const f={};
    hits.forEach((h,j)=>{
      const key=SDL_KEYS.find(x=>new RegExp("^"+x[1]+"$","i").test(h.name.trim()));if(!key||f[key[0]]!=null)return;
      let stop=j+1<hits.length?hits[j+1].start:chunk.length;
      if(cut>h.end&&cut<stop)stop=cut;
      f[key[0]]=chunk.slice(h.end,stop).replace(/\s+/g," ").trim();
    });
    if(!f.vessel||!f.on)return;
    const iso=d=>{const mm=String(d||"").match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);return mm?`${mm[3]}-${mm[2].padStart(2,"0")}-${mm[1].padStart(2,"0")}`:"";};
    const num=v=>{const n=parseFloat(String(v||"").replace(/,/g,""));return isNaN(n)?"":n;};
    recs.push({vessel:f.vessel,flag:f.flag||"",officialNo:f.officialNo||"",registry:f.registry||"",imo:(String(f.imo||"").match(/\d{7}/)||[""])[0],
      ptype:f.ptype||"",gt:num(f.gt),tradeArea:f.tradeArea||"",rank:f.rank||"",watch:f.watch||"",on:iso(f.on),off:iso(f.off),
      propulsionKw:num(f.propulsionKw),propellingDays:num(f.propellingDays)});
  });
  return recs.filter(r=>r.on);
}

const titleCase=v=>String(v||"").toLowerCase().replace(/(^|[\s\-\/(])([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\bOf\b/g,"of").replace(/\bAnd\b/g,"and");
function normFlag(f){let v=titleCase(f.trim());if(/^marshall island$/i.test(v))v="Marshall Islands";if(/^isle of man$/i.test(v))v="Isle of Man";return v;}
function mapType(t){const x=String(t||"").toLowerCase();
  if(/lng/.test(x))return "LNG Carrier";if(/lpg|gas carrier/.test(x))return "LPG Carrier";if(/oil.*chem|chem.*oil/.test(x))return "Oil/Chem Product Tanker";if(/chemical/.test(x))return "Chemical Tanker";if(/product/.test(x))return "Product Tanker";
  if(/crude|oil tanker|^tanker/.test(x))return "Oil Tanker (Crude)";if(/bulk|ore/.test(x))return "Bulk Carrier";if(/container/.test(x))return "Container Ship";if(/general cargo|multi.?purpose/.test(x))return "General Cargo";if(/car carrier|pctc|pcc|ro.?ro/.test(x))return "Car Carrier (PCTC)";return "Offshore / Other";}
function defaultRank(r){const x=String(r||"").toLowerCase();if(ALLRANKS.some(a=>a.toLowerCase()===x))return ALLRANKS.find(a=>a.toLowerCase()===x);
  const R=[[/trainee marine engineer|\btme\b/,"Junior Engineer"],[/oicew|watch ?keeping engineer/,"4th Engineer"],[/chief engineer/,"Chief Engineer"],[/(2nd|second) engineer/,"2nd Engineer"],[/(3rd|third) engineer/,"3rd Engineer"],[/(4th|fourth) engineer/,"4th Engineer"],[/junior engineer/,"Junior Engineer"],[/electro|\beto\b/,"ETO (Electro-Technical Officer)"],[/electrical officer/,"Electrical Officer"],[/gas engineer/,"Gas Engineer"],[/master|captain/,"Master / Captain"],[/chief (mate|officer)/,"Chief Officer"],[/(2nd|second) (mate|officer)/,"2nd Officer"],[/(3rd|third) (mate|officer)|oicnw|navigational watch/,"3rd Officer"],[/deck cadet|trainee (navigat|deck)/,"Deck Cadet / Trainee"],[/engine cadet/,"Engine Cadet / TME"],[/bosun|boatswain/,"Bosun"],[/able|\bab\b/,"AB (Able Seaman)"],[/ordinary|\bos\b/,"OS (Ordinary Seaman)"],[/pump/,"Pumpman"],[/motorman/,"Motorman"],[/oiler/,"Oiler"],[/wiper/,"Wiper"],[/fitter/,"Fitter"],[/chief cook/,"Chief Cook"],[/cook/,"2nd Cook"],[/steward|messman/,"Messman / Steward"]];
  const hit=R.find(([re])=>re.test(x));return hit?hit[1]:r;}
const normName=v=>String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/^(MV|MT|MS|LNGC|LPGC|SS)/,"");
let PIMP=null;
function findExisting(r){if(S.example)return null;const id="dgs-"+(r.imo||normName(r.vessel))+"-"+r.on;return S.contracts.find(c=>c.id===id||(r.imo&&c.imo===r.imo&&c.on===r.on)||(normName(c.vessel)===normName(r.vessel)&&c.on===r.on));}
const blank=v=>v===""||v==null;
function candidate(r){return {vessel:r.vessel,type:mapType(r.ptype),rank:PIMP.map[r.rank]!=null?PIMP.map[r.rank]:defaultRank(r.rank),imo:r.imo,flag:r.flag?normFlag(r.flag):"",registry:r.registry?titleCase(r.registry):"",officialNo:r.officialNo,gt:r.gt,tradeArea:r.tradeArea?titleCase(r.tradeArea):"",propulsionKw:r.propulsionKw,propellingDays:r.propellingDays,watch:r.watch,on:r.on,off:r.off};}
function planImport(){return PIMP.recs.map(r=>{const cand=candidate(r),ex=findExisting(r);if(!ex)return {cand,ex:null,fill:[],status:"new"};const fill=Object.keys(cand).filter(k=>blank(ex[k])&&!blank(cand[k]));return {cand,ex,fill,status:fill.length?"update":"same"};});}
function renderUploadState(){const on=navigator.onLine;$("upOnline").className="banner "+(on?"info":"warn");$("profilePdf").disabled=!on;$("pickLbl").style.opacity=on?"":"0.5";$("pickLbl").style.pointerEvents=on?"":"none";$("upState").textContent=on?"":"You're offline. Connect to the internet to upload your profile.";}
function renderImport(){
  const body=$("pImpBody");if(!PIMP){body.hidden=true;return;}body.hidden=false;
  const plan=planImport(),nNew=plan.filter(p=>p.status==="new").length,nUp=plan.filter(p=>p.status==="update").length,ranks=[...new Set(PIMP.recs.map(r=>r.rank).filter(Boolean))];
  const opts=v=>`<option value="">(keep as written)</option>`+Object.entries(RANKS).map(([g,items])=>`<optgroup label="${g}">${items.map(i=>`<option ${i===v?"selected":""}>${esc(i)}</option>`).join("")}</optgroup>`).join("");
  body.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px">
    <div><b>${PIMP.recs.length} sea-service record${PIMP.recs.length===1?"":"s"} found</b> in ${esc(PIMP.name)}.</div>
    <div class="chips"><span class="pill NR">${nNew} new</span><span class="pill RNOR">${nUp} to fill in</span><span class="pill UNK">${plan.length-nNew-nUp} already up to date</span></div>
    ${ranks.length?`<div><div class="eyebrow" style="margin-bottom:6px">Rank in the PDF → rank in the app</div><div class="fgrid">${ranks.map((rk,i)=>`<label class="f"><span>${esc(rk)}</span><select data-rk="${i}">${opts(PIMP.map[rk]!=null?PIMP.map[rk]:(ALLRANKS.includes(defaultRank(rk))?defaultRank(rk):""))}</select></label>`).join("")}</div></div>`:""}
    <div class="tbl-wrap"><table><thead><tr><th>Vessel</th><th>Type</th><th>Rank</th><th>Sign-on</th><th>Sign-off</th><th>Result</th></tr></thead><tbody>${plan.map(p=>`<tr><td><b>${esc(p.cand.vessel)}</b><span class="sub">${p.cand.imo?"IMO "+esc(p.cand.imo):""}</span></td><td>${esc(p.cand.type)}</td><td>${esc(p.cand.rank||"—")}</td><td class="mono">${fmt(dn(p.cand.on))}</td><td class="mono">${fmt(dn(p.cand.off))}</td><td>${p.status==="new"?'<span class="pill NR">New ship</span>':p.status==="update"?`<span class="pill RNOR">Fill ${p.fill.length} detail${p.fill.length===1?"":"s"}</span>`:'<span class="pill UNK">Up to date</span>'}</td></tr>`).join("")}</tbody></table></div>
    <div class="actions"><button type="button" class="btn-primary" id="pImpGo" ${nNew+nUp?"":"disabled"}>${nNew+nUp?`Add ${nNew} new ship${nNew===1?"":"s"}${nUp?` and update ${nUp}`:""}`:"Nothing new to add"}</button><button type="button" class="btn-ghost" id="pImpCancel">Close</button></div></div>`;
  body.querySelectorAll("[data-rk]").forEach(sel=>sel.addEventListener("change",()=>{PIMP.map[ranks[+sel.dataset.rk]]=sel.value||ranks[+sel.dataset.rk];renderImport();}));
  $("pImpCancel").onclick=()=>{PIMP=null;renderImport();};
  $("pImpGo").onclick=()=>{if(S.example)leaveExample();const now=Date.now();let added=0,updated=0;
    planImport().forEach(p=>{if(p.status==="new"){S.contracts.push(Object.assign({id:"dgs-"+(p.cand.imo||normName(p.cand.vessel))+"-"+p.cand.on,company:"",fleet:"",left:"",arr:"",onIndia:false,offIndia:false,onPort:"",offPort:"",coastal:false,notes:"From DG Shipping profile",source:"DGS profile",u:now},p.cand));added++;}
      else if(p.status==="update"){p.fill.forEach(k=>p.ex[k]=p.cand[k]);p.ex.u=now;updated++;}});
    S.settings.rankMap=Object.assign({},S.settings.rankMap||{},PIMP.map);PIMP=null;saveLocal();render();renderImport();
    toast(`${added} ship${added===1?"":"s"} added, ${updated} updated. Press Sync to save them to your account.`,6000);location.hash="ships";};
}
$("profilePdf").addEventListener("change",async e=>{
  const file=e.target.files[0];e.target.value="";if(!file)return;
  if(!navigator.onLine){toast("You're offline. Connect to upload your profile.");return;}
  const body=$("pImpBody");body.hidden=false;body.innerHTML='<div class="muted">Reading your profile…</div>';
  try{
    if(!window.pdfjsLib){await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";}
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let lines=[];
    for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();lines=lines.concat(sdlLinesFromItems(tc.items));}
    const recs=sdlParseProfile(lines.join("\n"));
    if(!recs.length){body.innerHTML='<div class="err">No sea-service records were found. Use the “Seafarer Profile” PDF from the DG Shipping e-Governance portal; scanned or photographed copies can\'t be read.</div>';return;}
    const map={},saved=S.settings.rankMap||{};recs.forEach(r=>{if(r.rank&&map[r.rank]==null&&saved[r.rank]!=null)map[r.rank]=saved[r.rank];});
    PIMP={name:file.name,recs,map};renderImport();
  }catch(err){body.innerHTML='<div class="err">This file couldn\'t be read. Check that it is the DG Shipping Seafarer Profile PDF and that you\'re online.</div>';}
});

/* ======================= tooltip ======================= */
const tip=document.createElement("div");tip.id="tip";tip.hidden=true;document.body.appendChild(tip);
document.addEventListener("pointerover",e=>{const t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tip.hidden=true;return;}tip.textContent=t.getAttribute("data-tip");tip.hidden=false;});
document.addEventListener("pointermove",e=>{if(tip.hidden)return;const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;tip.style.left=Math.max(8,x)+"px";tip.style.top=Math.max(8,y)+"px";});
document.addEventListener("pointerdown",e=>{if(!(e.target.closest&&e.target.closest("[data-tip]")))tip.hidden=true;});

/* ======================= one-time carry-over from the Claude page ======================= */
function takeCarry(){
  const h=location.hash;if(!h.startsWith("#carry="))return false;
  try{const b64=h.slice(7).replace(/-/g,"+").replace(/_/g,"/");const json=decodeURIComponent(escape(atob(b64)));const o=JSON.parse(json);
    if(o&&Array.isArray(o.contracts)){const n0=S.example?0:S.contracts.length;merge(o);saveLocal();history.replaceState(null,"",location.pathname+"#ships");
      setTimeout(()=>toast(`${Math.max(0,S.contracts.length-n0)} contracts brought over from your Claude page. Sign in and press Sync to save them to your account.`,7000),400);return true;}}catch(e){}
  history.replaceState(null,"",location.pathname+"#dashboard");return false;
}

/* ======================= start ======================= */
const local=loadLocal();if(local)adopt(local);else S=JSON.parse(JSON.stringify(EXAMPLE));
takeCarry();
applyTheme();render();renderAccount();renderUploadState();
show(location.hash.slice(1)||"dashboard");
if(APP_V){const t="Version "+APP_V.slice(0,8)+"."+APP_V.slice(8);if($("appVer"))$("appVer").textContent="App "+t;if($("railVer"))$("railVer").textContent=t;}
if(/[?&]v=/.test(location.search))history.replaceState(null,"",location.pathname+location.hash);
window.__sdl={get S(){return S;},get C(){return C;},merge,compute,syncAll};
})();
