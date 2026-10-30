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
const yrs=d=>(Math.max(0,d)/365).toFixed(2); /* sea time in decimal years: days ÷ 365 */
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
function adopt(o){S={v:2,example:false,settings:Object.assign({edge:true},o.settings||{}),fy:o.fy||{},contracts:(o.contracts||[]).map(c=>Object.assign({company:"",fleet:"",flag:"",registry:""},c)),deleted:Array.isArray(o.deleted)?o.deleted:[],certs:Array.isArray(o.certs)?o.certs:[],docs:Array.isArray(o.docs)?o.docs:[],updatedAt:+o.updatedAt||0};}
function snapshot(){return {v:2,app:"sea-days-ledger",settings:S.settings,fy:S.fy,contracts:S.contracts,certs:S.certs||[],docs:S.docs||[],deleted:S.deleted||[],updatedAt:S.updatedAt||0};}
let saveQ=Promise.resolve();
function saveLocal(){if(S.example)return;S.updatedAt=Date.now();const j=JSON.stringify(snapshot());saveQ=saveQ.then(()=>storeLedger(j)).catch(()=>{});updateSyncUI();}
/* the ledger is kept on the device only in encrypted form */
async function storeLedger(json){if(!MK)return;lsSet("sdlLedgerEnc",b64(await aesEnc(MK,TE.encode(json))));try{localStorage.removeItem("seaDaysLedger");}catch(e){}}
function loadLocal(){try{const o=JSON.parse(lsGet("seaDaysLedger"));if(o&&Array.isArray(o.contracts))return o;}catch(e){}return null;}
function leaveExample(){if(S.example)S={v:2,example:false,settings:{edge:S.settings.edge!==false},fy:{},contracts:[],certs:[],docs:[],deleted:[],updatedAt:0};}
/* combine another copy into S: newest edit of each contract wins, deletions carry over, nothing is wiped */
function merge(o){
  if(S.example)leaveExample();
  S.certs=S.certs||[];S.docs=S.docs||[];const before=JSON.stringify([S.contracts,S.fy,S.deleted,S.certs,S.docs]);
  const tomb={},tn={};(S.deleted||[]).concat(Array.isArray(o.deleted)?o.deleted:[]).forEach(d=>{if(d&&d.id){tomb[d.id]=Math.max(tomb[d.id]||0,+d.u||0);if(d.n)tn[d.id]=Math.max(tn[d.id]||0,+d.n);}});
  const m={};S.contracts.concat((o.contracts||[]).map(c=>Object.assign({company:"",fleet:"",flag:"",registry:""},c))).forEach(c=>{if(!c||!c.id)return;const p=m[c.id];if(!p||(+c.u||0)>(+p.u||0))m[c.id]=c;});
  S.contracts=Object.values(m).filter(c=>!(tomb[c.id]&&tomb[c.id]>=(+c.u||0)));
  const cm={};S.certs.concat(Array.isArray(o.certs)?o.certs:[]).forEach(c=>{if(!c||!c.id)return;const p=cm[c.id];if(!p||(+c.u||0)>(+p.u||0))cm[c.id]=c;});
  S.certs=Object.values(cm).filter(c=>!(tomb[c.id]&&tomb[c.id]>=(+c.u||0)));
  const dm={};S.docs.concat(Array.isArray(o.docs)?o.docs:[]).forEach(c=>{if(!c||!c.id)return;const p=dm[c.id];if(!p||(+c.u||0)>(+p.u||0)||((+c.u||0)===(+p.u||0)&&(c.chunks||0)>(p.chunks||0)))dm[c.id]=c;});
  S.docs=Object.values(dm).filter(c=>!(tomb[c.id]&&tomb[c.id]>=(+c.u||0)));
  S.deleted=Object.entries(tomb).map(([id,u])=>tn[id]?{id,u,n:tn[id]}:{id,u}).slice(-500);
  const newer=(+o.updatedAt||0)>(+S.updatedAt||0);
  Object.entries(o.fy||{}).forEach(([k,v])=>{S.fy[k]=newer?Object.assign({},S.fy[k],v):Object.assign({},v,S.fy[k]);});
  if(newer&&o.settings)S.settings=Object.assign({},S.settings,o.settings);
  return before!==JSON.stringify([S.contracts,S.fy,S.deleted,S.certs,S.docs]);
}

/* ======================= day-count engine ======================= */
function shipSpan(c){const on=dn(c.on);if(on==null)return null;const off=dn(c.off);return [on,off!=null?off:Math.max(TODAY,on)];}
function ranges(c,edge){
  const out=[],e1=edge?1:0;const on=dn(c.on),off=dn(c.off),left=dn(c.left),arr=dn(c.arr);
  const shipEnd=on!=null?(off!=null?off:Math.max(TODAY,on)):null;
  /* passport dates, when given, decide the stay; the CDC period still counts for an Indian-port voyage (Rule 126 / Rule 8) or when no passport date is entered */
  const hasPass=left!=null||arr!=null,eligible=!!(c.onIndia||c.offIndia);
  if(on!=null&&!c.coastal&&(!hasPass||eligible))out.push([on,shipEnd]);
  if(left!=null){const e=arr!=null?arr-e1:(off!=null?off:Math.max(TODAY,shipEnd!=null?shipEnd:TODAY));out.push([left+e1,e]);}
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
/* passport dates count NRI days; flag contracts that still need exact dates */
/* back-to-back records on the same ship (e.g. promotion onboard) are one stay: one sign-on, one sign-off */
const PROMO="Onboard – promoted";
function sameShip(a,b){return a.imo&&b.imo?String(a.imo)===String(b.imo):normName(a.vessel)===normName(b.vessel);}
function chainOf(c){
  const on=dn(c.on),off=dn(c.off);
  const next=off==null?null:S.contracts.find(x=>x!==c&&sameShip(x,c)&&dn(x.on)!=null&&dn(x.on)-off>=0&&dn(x.on)-off<=1)||null;
  const prev=on==null?null:S.contracts.find(x=>x!==c&&sameShip(x,c)&&dn(x.off)!=null&&on-dn(x.off)>=0&&on-dn(x.off)<=1)||null;
  return {prev,next};}
function passIssue(c){
  const on=dn(c.on);if(on==null||on>TODAY)return "";
  const est=c.passEst||{},ch=chainOf(c);
  const needLeft=!ch.prev,needArr=!ch.next&&c.off&&dn(c.off)<=TODAY;
  if((needLeft&&!c.left)||(needArr&&!c.arr))return "missing";
  if((needLeft&&est.left)||(needArr&&est.arr))return "estimated";
  return "";
}
function fyPassIssues(f){const s=fyStart(f),e=fyEnd(f);let missing=0,estimated=0;S.contracts.forEach(c=>{const sp=shipSpan(c);if(!sp||!overlap(sp[0],sp[1],s,e))return;const k=passIssue(c);if(k==="missing")missing++;else if(k==="estimated")estimated++;});return {missing,estimated};}
function passNote(f,short){const p=fyPassIssues(f);if(!p.missing&&!p.estimated)return "";
  const parts=[];if(p.missing)parts.push(`${p.missing} contract${p.missing===1?" has":"s have"} no passport dates`);if(p.estimated)parts.push(`${p.estimated} use${p.estimated===1?"s":""} estimated dates`);
  return `<div class="warnline">Exact passport dates needed: ${parts.join(", ")}. ${short?"":"This result is an estimate from CDC dates until you add them. "}<a href="#complete">Pending details</a></div>`;}
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
const VIEWS=["dashboard","years","ships","upload","complete","certs","docs","notices","news","account","help","about"];
let VIEW="dashboard",noticesPrevSeen=0;
function show(v){
  if(!VIEWS.includes(v))v="dashboard";VIEW=v;
  VIEWS.forEach(x=>{$("v-"+x).hidden=x!==v;});
  document.querySelectorAll(".nav a").forEach(a=>{if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  document.title=($("v-"+v).dataset.title)+" · Sea Days Ledger";
  if(v==="notices"){noticesPrevSeen=+(lsGet("sdlNoticesSeen")||0);lsSet("sdlNoticesSeen",String(Date.now()));renderNotices();}
  if(v==="upload")renderUploadState();
  if(v==="complete")renderComplete(true);
  if(v==="certs")renderCerts();
  if(v==="docs")renderDocs();
  if(v==="news"){newsPrevSeen=+(lsGet("sdlNewsSeen")||0);lsSet("sdlNewsSeen",String(Date.now()));renderNews();}
  if(v==="account")renderAccount();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>{const to=location.hash.slice(1);if(VIEW==="complete"&&to!=="complete"&&cdDirty.size){if(!okToLeave()){history.replaceState(null,"","#complete");return;}cdDirty.clear();}show(to);});

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
  if(!S.certs)S.certs=[];
  renderDashboard();renderYears();renderShips();renderHist();renderNotices();renderNews();updateSyncUI();renderCdBadge();renderCertBadge();if(VIEW==="certs")renderCerts();if(!S.docs)S.docs=[];renderDocBadge();if(VIEW==="docs")renderDocs();renderStorage();
  fillSelect($("cdFY"),[["","All years"]].concat(fyOpts),$("cdFY").value);
  $("cdCompany").innerHTML=uniq("company").map(f=>`<option value="${esc(f)}">`).join("");$("cdFleet").innerHTML=uniq("fleet").map(f=>`<option value="${esc(f)}">`).join("");
  if(VIEW==="complete"&&!cdEditing)renderComplete();else renderCdProgress();
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
    const zA=(cx+R*Math.cos(tA)).toFixed(1),zB=(cy-R*Math.sin(tA)).toFixed(1);
    $("bridge").innerHTML=`<div><div class="eyebrow">This year · FY ${fyLabel(f)} · day ${r.elapsed} of ${r.days}</div><div class="big-status" style="color:${stCol}">${st==="UNK"?"—":st}</div><div class="small" style="color:#cfe2ee">${esc(statusName(st))}${r.outPlan?" · includes planned dates":""}</div></div>
    <div class="dialwrap">
    <svg class="dial" viewBox="0 -18 300 193" role="img" aria-label="${out} days outside India this financial year, ${need} needed">
      <path d="${arcH(cx,cy,R,Math.PI,tA)}" stroke="#ff6b5c" stroke-opacity=".35" stroke-width="22" fill="none"/>
      <path d="${arcH(cx,cy,R,tA,0)}" stroke="#55d69d" stroke-opacity=".35" stroke-width="22" fill="none"/>
      ${out>0?`<path d="${arcH(cx,cy,R,Math.PI,ang)}" stroke="${valCol}" stroke-width="22" fill="none"/>`:""}
      <line x1="${tx(R+14)}" y1="${ty(R+14)}" x2="${tx(R-14)}" y2="${ty(R-14)}" stroke="#ffffff" stroke-width="3"/>
      <g transform="translate(${tx(R+28)},${ty(R+28)})"><rect x="-17" y="-10" width="34" height="18" rx="9" fill="#ffffff"/><text x="0" y="3.5" fill="#06182a" font-size="11" font-weight="700" text-anchor="middle">${need}</text></g>
      <circle cx="${(cx+R*Math.cos(ang)).toFixed(1)}" cy="${(cy-R*Math.sin(ang)).toFixed(1)}" r="10" fill="#ffffff" stroke="${valCol}" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy-6}" r="58" fill="#0b2236" stroke="#ffffff22"/>
      <text x="${cx}" y="${cy-14}" fill="${valCol}" font-size="40" text-anchor="middle" font-weight="600">${out}</text>
      <text x="${cx}" y="${cy+4}" fill="#e6f1f7" font-size="10" text-anchor="middle" letter-spacing="1">DAYS OUTSIDE</text>
      <text x="${cx}" y="${cy+18}" fill="#9fc3d4" font-size="10" text-anchor="middle">of ${need} needed</text>
      <text x="${cx-R}" y="${cy+30}" fill="#e6f1f7" font-size="12" text-anchor="middle" font-weight="600">0</text><text x="${cx+R}" y="${cy+30}" fill="#e6f1f7" font-size="12" text-anchor="middle" font-weight="600">${r.days}</text>
    </svg>
    <div class="zone-legend"><span class="z-red">● Below ${need}: resident risk</span><span class="z-green">● ${need} or more: NRI safe</span></div>
    </div>
    <div class="kvs"><div class="kv"><b>${need}</b><span>days outside needed</span></div><div class="kv"><b>${more}</b><span>more days outside to go</span></div><div class="kv"><b>${allow}</b><span>more India days allowed</span></div></div>`;
    const total=S.contracts.reduce((a,c)=>a+shipDaysIn(c,null),0),prop=S.contracts.reduce((a,c)=>a+(+c.propellingDays||0),0),ships=new Set(S.contracts.map(c=>c.imo||c.vessel)).size;
    const msg=more>0?`Stay outside India for <b>${more} more day${more===1?"":"s"}</b> before 31 March ${f+1} to stay NRI this year.`:`You have <b>${out} days</b> outside India this year, ${out-need} more than the ${need} needed. You're on track to stay NRI.`;
    $("nextStep").innerHTML=`<div class="eyebrow">What this means</div><p class="msg">${msg}</p>${passNote(f,true)}
      <div class="tiles"><div class="tile"><b>${yrs(total)} yrs</b><span>${nf(total)} days at sea · ${approx(total)}</span></div><div class="tile"><b>${S.contracts.length}</b><span>contracts on ${ships} ship${ships===1?"":"s"}</span></div><div class="tile"><b>${nf(prop)||"—"}</b><span>propelling days</span></div><div class="tile"><b>${C.order.filter(x=>C.res[x].status==="NR").length}/${C.order.filter(x=>C.res[x].india!=null).length}</b><span>years as NRI</span></div></div>
      <div class="actions"><a class="btn btn-sm" href="#years">See every year</a><a class="btn btn-sm" href="#ships">Sea service</a></div>`;
  }
  renderAlerts();renderRings();renderBars();renderDonuts();renderTimeline();
}
const P=(cx,cy,r,a)=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
function arcP(cx,cy,r,a0,a1){if(a1-a0>=Math.PI*2-1e-4)a1=a0+Math.PI*2-1e-3;const [x0,y0]=P(cx,cy,r,a0),[x1,y1]=P(cx,cy,r,a1);return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1-a0>Math.PI?1:0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;}
function sector(cx,cy,ro,ri,a0,a1){
  if(a1-a0>=Math.PI*2-1e-4)return `M${cx} ${cy-ro} A${ro} ${ro} 0 1 1 ${cx-0.01} ${cy-ro}Z M${cx} ${cy-ri} A${ri} ${ri} 0 1 0 ${cx-0.01} ${cy-ri}Z`;
  const L=a1-a0>Math.PI?1:0,[x0,y0]=P(cx,cy,ro,a0),[x1,y1]=P(cx,cy,ro,a1),[x2,y2]=P(cx,cy,ri,a1),[x3,y3]=P(cx,cy,ri,a0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${ro} ${ro} 0 ${L} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${ri} ${ri} 0 ${L} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;}
function yearsTable(fys){return `<div class="tbl-wrap" style="grid-column:1/-1"><table class="mini"><thead><tr><th>Year</th><th class="n">Outside</th><th class="n">Needed</th><th class="n">In India</th><th>Status</th></tr></thead><tbody>${fys.map(f=>{const r=C.res[f],out=r.inData?r.outside:r.days-r.india,p=fyPassIssues(f);return `<tr><td>FY ${fyLabel(f)}${p.missing||p.estimated?' <span class="estag" title="Passport dates missing or estimated">EST</span>':""}</td><td class="n">${out}</td><td class="n">${r.need}</td><td class="n">${r.india}</td><td><span class="pill ${r.status}">${r.status}</span></td></tr>`;}).join("")}</tbody></table></div>`;}
function renderRings(){
  const fys=C.order.filter(f=>C.res[f].india!=null).slice(-6).reverse();
  if(!fys.length){$("chRings").innerHTML='<div class="empty">Add a contract to see your years.</div>';return;}
  if(CH.years==="table"){$("chRings").innerHTML=yearsTable(C.order.filter(f=>C.res[f].india!=null).slice().reverse());return;}
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
function renderLine(fys){
  const padL=34,padR=14,padT=20,padB=26,H=220,W=Math.max(460,padL+padR+fys.length*64),plotW=W-padL-padR,plotH=H-padT-padB,x=i=>padL+(fys.length<2?plotW/2:i*plotW/(fys.length-1)),y=v=>padT+plotH*(1-v/366);let g="";
  [0,100,200,300].forEach(v=>{g+=`<line x1="${padL}" x2="${W-padR}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL-6}" y="${y(v)+3}" text-anchor="end" font-size="9" fill="var(--muted)">${v}</text>`;});
  g+=`<polyline fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3" points="${fys.map((f,i)=>x(i)+","+y(C.res[f].need)).join(" ")}"/>`;
  g+=`<polyline fill="none" stroke="var(--sea)" stroke-width="2" points="${fys.map((f,i)=>{const r=C.res[f];return x(i)+","+y(r.inData?r.outside:r.days-r.india);}).join(" ")}"/>`;
  fys.forEach((f,i)=>{const r=C.res[f],out=r.inData?r.outside:r.days-r.india;g+=`<g class="mark" data-tip="${esc(`FY ${fyLabel(f)} · ${r.status}
${out} days outside, ${r.need} needed`)}"><circle cx="${x(i)}" cy="${y(out)}" r="12" fill="transparent"/><circle cx="${x(i)}" cy="${y(out)}" r="5.5" fill="${stColor(r.status)}" stroke="var(--paper)" stroke-width="2"/><text x="${x(i)}" y="${y(out)-10}" text-anchor="middle" font-size="10" fill="var(--ink)" font-weight="500">${out}</text><text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${fyLabel(f)}</text></g>`;});
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px" role="img" aria-label="Days outside India per financial year, line">${g}</svg><div class="legend" style="margin-top:4px"><span><i style="background:var(--ok)"></i>NR</span><span><i style="background:var(--warn)"></i>RNOR</span><span><i style="background:var(--bad)"></i>ROR</span><span>– – days needed</span></div>`;}
function renderBars(){
  const fys=C.order.filter(f=>C.res[f].india!=null).slice(-8);
  if(!fys.length){$("chBars").innerHTML='<div class="empty">No years to chart yet.</div>';return;}
  if(CH.outside==="table"){$("chBars").innerHTML=yearsTable(fys.slice().reverse());return;}
  if(CH.outside==="line"){$("chBars").innerHTML=renderLine(fys);return;}
  const slot=70,padL=34,padB=26,padT=18,H=220,W=Math.max(460,padL+fys.length*slot+8),plotH=H-padB-padT,y=v=>padT+plotH*(1-v/366);let g="";
  [0,100,200,300].forEach(v=>{g+=`<line x1="${padL}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL-6}" y="${y(v)+3}" text-anchor="end" font-size="9" fill="var(--muted)">${v}</text>`;});
  fys.forEach((f,i)=>{const r=C.res[f],need=r.need,out=r.inData?r.outside:r.days-r.india,done=r.inData?out-r.outPlan:out,plan=out-done,x=padL+i*slot+16,bw=slot-32,col=stColor(r.status);
    g+=`<g class="mark" data-tip="${esc(`FY ${fyLabel(f)} · ${r.status}\n${out} days outside, ${need} needed\n${out>=need?(out-need)+" to spare":(need-out)+" short"}`)}"><rect x="${x-10}" y="${padT}" width="${bw+20}" height="${plotH}" fill="transparent"/>`;
    if(done>0){const h=y(0)-y(done),k=Math.min(4,h);g+=`<path d="M${x} ${y(0)} V${y(done)+k} Q${x} ${y(done)} ${x+4} ${y(done)} H${x+bw-4} Q${x+bw} ${y(done)} ${x+bw} ${y(done)+k} V${y(0)}Z" fill="${col}"/>`;}
    if(plan>0){const top=y(out),bot=y(done)-2;if(bot>top)g+=`<rect x="${x}" y="${top}" width="${bw}" height="${bot-top}" rx="3" fill="${col}" fill-opacity=".4"/>`;}
    g+=`<line x1="${x-6}" x2="${x+bw+6}" y1="${y(need)}" y2="${y(need)}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x+bw/2}" y="${y(Math.max(out,need))-6}" text-anchor="middle" font-size="10" fill="var(--ink)" font-weight="500">${out}</text><text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${fyLabel(f)}</text></g>`;});
  $("chBars").innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Days outside India per financial year">${g}</svg><div class="legend" style="margin-top:4px"><span><i style="background:var(--ok)"></i>NR</span><span><i style="background:var(--warn)"></i>RNOR</span><span><i style="background:var(--bad)"></i>ROR</span><span><i style="background:var(--sea);opacity:.4"></i>Planned</span><span>– – days needed</span></div>`;
}
function donut(el,rows,label,mode){
  const total=rows.reduce((s,r)=>s+r.v,0);
  if(!total){el.innerHTML='<div class="empty">No sea time for this choice.</div>';return;}
  if(mode==="bars"){const max=Math.max(...rows.map(r=>r.v));el.innerHTML=`<div class="hbars" style="grid-column:1/-1">${rows.map(r=>`<div class="hbar mark" data-tip="${esc(r.l+"\n"+r.v+" days · "+approx(r.v))}"><span class="nm" title="${esc(r.l)}">${esc(r.l)}</span><span class="track"><i style="width:${r.v/max*100}%;background:${r.c}"></i></span><span class="v">${yrs(r.v)} yrs</span></div>`).join("")}<div class="small muted" style="margin-top:6px">Total ${yrs(total)} yrs · ${nf(total)} days</div></div>`;return;}
  if(mode==="table"){el.innerHTML=`<div class="tbl-wrap" style="grid-column:1/-1"><table class="mini"><thead><tr><th></th><th class="n">Years</th><th class="n">Days</th><th class="n">Share</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="tchip" style="--tc:${r.c}">${esc(r.l)}</span></td><td class="n">${yrs(r.v)}</td><td class="n">${nf(r.v)}</td><td class="n">${Math.round(r.v/total*100)}%</td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td class="n">${yrs(total)}</td><td class="n">${nf(total)}</td><td class="n">100%</td></tr></tfoot></table></div>`;return;}
  const cx=110,cy=110,ro=96,ri=64;let a=0,g="";
  rows.forEach(r=>{const a1=a+r.v/total*Math.PI*2;g+=`<path class="mark" d="${sector(cx,cy,ro,ri,a,a1)}" fill="${r.c}" stroke="var(--paper)" stroke-width="2" fill-rule="evenodd" data-tip="${esc(r.l+"\n"+yrs(r.v)+" yrs · "+r.v+" days · "+approx(r.v)+"\n"+Math.round(r.v/total*100)+"%")}"/>`;a=a1;});
  g+=`<text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="24" fill="var(--ink)" font-weight="500">${yrs(total)}</text><text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="9" fill="var(--muted)" letter-spacing="1">YEARS AT SEA</text><text x="${cx}" y="${cy+30}" text-anchor="middle" font-size="9" fill="var(--muted)">${nf(total)} days</text>`;
  el.innerHTML=`<svg viewBox="0 0 220 220" role="img" aria-label="${esc(label)}">${g}</svg><div class="lg">${rows.map(r=>`<div class="li"><span class="sw" style="background:${r.c}"></span><span class="nm" title="${esc(r.l)}">${esc(r.l)}</span><span class="v">${yrs(r.v)} yrs · ${Math.round(r.v/total*100)}%</span></div>`).join("")}</div>`;
}
let mixKey="rank";
function renderDonuts(){
  const fF=$("dFY").value?+$("dFY").value:null;
  document.querySelectorAll(".dScope").forEach(e=>e.textContent=fF!=null?`Days in FY ${fyLabel(fF)}`:"All time");
  const tm={};S.contracts.forEach(c=>{const d=shipDaysIn(c,fF);if(!d)return;const k=TYPE_COL[c.type]?c.type:"Other types";tm[k]=(tm[k]||0)+d;});
  donut($("chType"),Object.entries(tm).map(([l,v])=>({l,v,c:typeColor(l)})).sort((a,b)=>b.v-a.v),"Sea time by ship type",CH.type);
  const all={};S.contracts.forEach(c=>{const k=(c[mixKey]||"").trim()||"Not set";all[k]=(all[k]||0)+shipDaysIn(c,null);});
  const top=Object.entries(all).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,7).map(e=>e[0]);
  const mm={};S.contracts.forEach(c=>{const d=shipDaysIn(c,fF);if(!d)return;let k=(c[mixKey]||"").trim()||"Not set";if(!top.includes(k))k="Other";mm[k]=(mm[k]||0)+d;});
  donut($("chMix"),Object.entries(mm).map(([l,v])=>({l,v,c:l==="Other"?"var(--cx)":`var(--c${top.indexOf(l)})`})).sort((a,b)=>b.v-a.v),"Sea time by "+mixKey,CH.mix);
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
      <div class="stats"><div class="stat hl"><b>${r.inData?r.outside:"—"}</b><span>days outside India</span></div><div class="stat"><b>${ind==null?"—":ind}</b><span>days in India${r.override!=null?" (entered)":(r.current||r.future?" (projected)":"")}</span></div><div class="stat"><b>${r.inData?r.shipD:"—"}</b><span>days on ship (CDC)${r.inData?" · "+yrs(r.shipD)+" yrs":""}</span></div><div class="stat"><b>${need}</b><span>days outside needed</span></div></div>
      ${r.inData?`<div class="meter" title="Days outside India against the ${need}-day target"><div class="fill" style="width:${opct}%;background:var(--${r.outside>=need?"ok":(r.outside>=need-20?"warn":"bad")})"></div><div class="thr" style="left:${need/r.days*100}%"></div></div>
      <div class="small muted" style="margin-top:4px">${r.outside>=need?`${r.outside-need} day${r.outside-need===1?"":"s"} to spare`:`${more} more day${more===1?"":"s"} outside needed`}</div>
      <div class="strip" role="img" aria-label="Each day of the year: outside or in India">${r.cells.map(c=>`<i class="${c}"></i>`).join("")}</div><div class="strip-marks">${"AMJJASONDJFM".split("").map(m=>`<span>${m}</span>`).join("")}</div>
      <div class="legend" style="margin-top:6px"><span><i style="background:var(--sea)"></i>Outside India</span><span><i style="background:var(--plan)"></i>Planned</span><span><i style="background:var(--land)"></i>In India</span></div>`:`<p class="small muted" style="margin-top:10px">${r.override!=null?"Days entered under Earlier years.":"No contracts in this year."}</p>`}
    </div>
    <div class="verdict">${passNote(f)}<b>${esc(t.h)}</b><ul>${t.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>${(r.flags||[]).map(x=>`<div class="warnline">${esc(x)}</div>`).join("")}
      <div class="row-act"><button type="button" class="btn-sm" data-report="${f}">Report for your CA (PDF)</button>${fyDocs(f).length?`<button type="button" class="btn-sm" data-fydocs="${f}">Share this year's documents (${fyDocs(f).length} + report)</button>`:""}</div>
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
  $("shipTiles").innerHTML=`<div class="tile"><b>${list.length}${n?` <small class="muted" style="font-size:.7rem">of ${S.contracts.length}</small>`:""}</b><span>contracts${n?" match":""}</span></div><div class="tile"><b>${yrs(tot)} yrs</b><span>${nf(tot)} days at sea${fF!=null?` in FY ${fyLabel(fF)}`:""} · ${approx(tot)}</span></div><div class="tile"><b>${nf(prop)||"—"}</b><span>propelling days</span></div>`;
  if(!list.length){$("ctable").innerHTML=`<tbody><tr><td class="empty">${S.contracts.length?"No contracts match these filters.":"No contracts yet. Upload your seafarer profile or add a contract."}</td></tr></tbody>`;}
  else{
    const rows=list.map(c=>{const sp=shipSpan(c),d=sp?sp[1]-sp[0]+1:0,planned=["left","on","off","arr"].some(k=>{const v=dn(c[k]);return v!=null&&v>TODAY;}),pass=c.left||c.arr;
      return `<tr><td data-l="Vessel"><b>${esc(c.vessel)}</b>${planned?' <span class="pill plan">planned</span>':""}<span class="sub">${esc(c.rank||"")}${c.imo?" · IMO "+esc(c.imo):""}</span>${c.flag||c.registry?`<span class="sub">${esc(c.flag||"")}${c.flag&&c.registry?" · ":""}${c.registry?"Reg. "+esc(c.registry):""}</span>`:""}<div class="row-act" style="margin-top:6px"><button type="button" class="btn-sm" data-edit="${esc(c.id)}">Edit</button><button type="button" class="btn-sm" data-sdocs="${esc(c.id)}" aria-expanded="${SHIPOPEN.has(c.id)}">📎 Documents${shipDocs(c).length?` (${shipDocs(c).length})`:""}</button><button type="button" class="btn-sm btn-danger" data-del="${esc(c.id)}">Delete</button></div>${shipDocs(c).length?`<span class="dcount">${shipDocSummary(c)}</span>`:""}</td>
      <td data-l="Type · company"><span class="tchip" style="--tc:${typeColor(c.type)}">${esc(c.type)}</span><span class="sub">${esc(c.company||"—")}${c.fleet?" · "+esc(c.fleet):""}</span></td>
      <td data-l="Sign-on" class="mono">${fmt(dn(c.on))}<span class="sub">${chainOf(c).prev?PROMO:(c.onIndia?"Indian port":"Abroad")+(c.onPort?" · "+esc(c.onPort):"")}</span></td>
      <td data-l="Sign-off" class="mono">${c.off?fmt(dn(c.off)):'<span class="pill plan">onboard</span>'}<span class="sub">${c.off?(chainOf(c).next?PROMO:(c.offIndia?"Indian port":"Abroad")+(c.offPort?" · "+esc(c.offPort):"")):""}</span></td>
      <td data-l="Passport" class="mono">${pass?`${chainOf(c).prev?"(same stay)":fmt(dn(c.left))} → ${chainOf(c).next?"(continues)":fmt(dn(c.arr))}`:"—"}<span class="sub">${passIssue(c)==="estimated"?"Estimated dates":pass?"Counted by passport":"Needs passport dates"}</span></td>
      <td data-l="Days on ship" class="n">${d}<span class="sub">${yrs(d)} yrs</span><span class="sub">${sp?ymd(sp[0],sp[1]):""}</span></td>
      ${fF!=null?`<td data-l="In FY ${fyLabel(fF)}" class="n">${shipDaysIn(c,fF)}<span class="sub">${yrs(shipDaysIn(c,fF))} yrs</span></td>`:""}
      <td data-l="Ship particulars" class="wrap">${partLine(c)}${c.propellingDays!==""&&c.propellingDays!=null?`<span class="sub">${esc(c.propellingDays)} propelling days</span>`:""}</td>
</tr>${SHIPOPEN.has(c.id)?`<tr class="docpanel" data-for="${esc(c.id)}"><td colspan="${fF!=null?8:7}">${shipDocsHtml(c)}</td></tr>`:""}`;}).join("");
    $("ctable").innerHTML=`<thead><tr><th>Vessel</th><th>Type · company</th><th>Sign-on</th><th>Sign-off</th><th>Passport</th><th class="n">Days on ship</th>${fF!=null?`<th class="n">In FY ${fyLabel(fF)}</th>`:""}<th>Ship particulars</th></tr></thead><tbody>${rows}</tbody>`;
  }
  const m={};list.forEach(c=>{const k=(c[totKey]||"").trim()||"Not set";m[k]=m[k]||{d:0,n:0,p:0};m[k].d+=shipDaysIn(c,fF);m[k].n++;m[k].p+=(+c.propellingDays||0);});
  const rows=Object.entries(m).sort((a,b)=>b[1].d-a[1].d),max=Math.max(1,...rows.map(r=>r[1].d)),T=rows.reduce((s,r)=>s+r[1].d,0);
  const label={type:"Ship type",rank:"Rank",company:"Company",fleet:"Fleet",flag:"Flag"}[totKey];
  $("totTable").innerHTML=rows.length?`<thead><tr><th>${label}</th><th class="n">Contracts</th><th class="n">Years</th><th class="n">Days</th><th class="n">Y M D</th><th class="n">Propelling</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><td style="min-width:160px">${esc(k)}<div class="bar"><i style="width:${v.d/max*100}%;--tc:${totKey==="type"?typeColor(k):"var(--sea)"}"></i></div></td><td class="n">${v.n}</td><td class="n">${yrs(v.d)}</td><td class="n">${nf(v.d)}</td><td class="n">${approx(v.d)}</td><td class="n">${nf(v.p)||"—"}</td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td class="n">${rows.reduce((s,r)=>s+r[1].n,0)}</td><td class="n">${yrs(T)}</td><td class="n">${nf(T)}</td><td class="n">${approx(T)}</td><td class="n">${nf(rows.reduce((s,r)=>s+r[1].p,0))||"—"}</td></tr></tfoot>`:`<tbody><tr><td class="empty">Nothing to total.</td></tr></tbody>`;
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
  const X=dn(c.off)!=null?dn(c.off):Math.max(TODAY,O),parts=[`<span>On ship: <b class="mono">${X-O+1}</b> days · <b class="mono">${yrs(X-O+1)}</b> yrs (${ymd(O,X)})${c.off?"":" so far"}</span>`],byF={};
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
  if(ex){["source"].forEach(k=>{if(ex[k]!=null)c[k]=ex[k];});if(ex.passEst){const pe={};["left","arr"].forEach(k=>{if(ex.passEst[k]&&ex[k]===c[k])pe[k]=true;});if(Object.keys(pe).length)c.passEst=pe;}S.contracts=S.contracts.map(x=>x.id===c.id?c:x);}else S.contracts.push(c);
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

/* ---------- pending details ---------- */
let cdShow="todo",cdEditing=false;const cdDirty=new Set();
function cdMissing(c){
  const m=[],on=dn(c.on),past=on!=null&&on<=TODAY,offPast=c.off&&dn(c.off)<=TODAY,ch=chainOf(c);
  if(!ch.prev){if(past&&!c.left)m.push("left");if(!c.onPort)m.push("onPort");}
  if(!ch.next){if(offPast&&!c.arr)m.push("arr");if(c.off&&!c.offPort)m.push("offPort");}
  if(!c.company)m.push("company");if(!c.fleet)m.push("fleet");return m;}
function cdState(c){const ch=chainOf(c),est=Object.keys(c.passEst||{}).filter(k=>c.passEst[k]&&!(k==="left"&&ch.prev)&&!(k==="arr"&&ch.next));const m=cdMissing(c);return {m,est,done:!m.length&&!est.length};}
function renderCdBadge(){const n=S.example?0:S.contracts.filter(c=>!cdState(c).done).length;$("cdBadge").hidden=!n;$("cdBadge").textContent=n;}
const LBL={left:"left India",arr:"arrived India",onPort:"sign-on port",offPort:"sign-off port",company:"company",fleet:"fleet"};
function topCompanies(){const m={};S.contracts.forEach(c=>{const k=(c.company||"").trim();if(k)m[k]=(m[k]||0)+1;});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]);}
function cdHead(c,dirty){const st=cdState(c),sp=shipSpan(c),ch=chainOf(c);
  return `<div class="t"><b>${esc(c.vessel)}</b> <span class="small muted">${esc(c.rank||"")}${c.imo?" · IMO "+esc(c.imo):""}</span><div class="small muted mono">CDC ${fmt(dn(c.on))} → ${c.off?fmt(dn(c.off)):"onboard"}${sp?` · ${sp[1]-sp[0]+1} days · ${yrs(sp[1]-sp[0]+1)} yrs`:""}</div>${ch.prev||ch.next?`<div class="small" style="color:var(--sea);margin-top:2px">One stay on this ship${ch.prev?` · continues from ${esc(ch.prev.rank||"previous record")}`:""}${ch.next?` · continues as ${esc(ch.next.rank||"next record")}`:""}</div>`:""}</div>
  <div>${dirty?'<span class="pill RNOR">Unsaved changes</span>':st.done?'<span class="pill NR">Complete</span>':`${st.m.length?`<span class="pill RNOR" title="${esc(st.m.map(k=>LBL[k]).join(", "))}">${st.m.length} missing</span>`:""}${st.est.length?` <span class="pill plan">${st.est.length} estimated</span>`:""}`}</div>`;}
function cdCard(c){const st=cdState(c),est=c.passEst||{},ch=chainOf(c),miss=k=>st.m.includes(k)?"missing":"",na=(c.fleet||"").toUpperCase()==="NA",tc=topCompanies().filter(x=>x!==c.company);
  const fixed=(label,text)=>`<div class="f"><span>${label}</span><input value="${esc(text)}" disabled></div>`;
  return `<article class="card cd ${st.done?"done":"todo"}" data-id="${esc(c.id)}"><div class="cd-h">${cdHead(c,false)}</div>
  <div class="fgrid">
    ${ch.prev?fixed("Left India (passport)","Not needed · same stay"):`<label class="f"><span>Left India (passport)${est.left?'<span class="estag">ESTIMATED</span>':""}</span><input type="date" data-k="left" class="${miss("left")}" value="${esc(c.left||"")}"></label>`}
    ${ch.next?fixed("Arrived India (passport)","Not needed · stay continues"):`<label class="f"><span>Arrived India (passport)${est.arr?'<span class="estag">ESTIMATED</span>':""}</span><input type="date" data-k="arr" class="${miss("arr")}" value="${esc(c.arr||"")}"></label>`}
    ${ch.prev?fixed("Sign-on port",PROMO):`<div class="f"><span>Sign-on port</span><div class="portrow"><input data-k="onPort" class="${miss("onPort")}" value="${esc(c.onPort||"")}" placeholder="e.g. Fujairah" autocomplete="off"><select data-k="onIndia"><option value="abroad" ${c.onIndia?"":"selected"}>Abroad</option><option value="india" ${c.onIndia?"selected":""}>Indian port</option></select></div></div>`}
    ${ch.next?fixed("Sign-off port",PROMO):`<div class="f"><span>Sign-off port</span><div class="portrow"><input data-k="offPort" class="${miss("offPort")}" value="${esc(c.offPort||"")}" placeholder="e.g. Singapore" autocomplete="off"><select data-k="offIndia"><option value="abroad" ${c.offIndia?"":"selected"}>Abroad</option><option value="india" ${c.offIndia?"selected":""}>Indian port</option></select></div></div>`}
    <div class="f"><span>Company</span><input data-k="company" list="cdCompany" class="${miss("company")}" value="${esc(c.company||"")}" placeholder="Type or tap a name below" autocomplete="off">${tc.length?`<div class="fillchips">${tc.map(n=>`<button type="button" class="btn-sm" data-fill="${esc(n)}">${esc(n)}</button>`).join("")}</div>`:""}</div>
    <div class="f"><span>Fleet</span><input data-k="fleet" list="cdFleet" class="${miss("fleet")}" value="${esc(na?"NA":c.fleet||"")}" ${na?"disabled":""} autocomplete="off"><label class="nachk"><input type="checkbox" data-na ${na?"checked":""}> Not known (NA)</label></div>
  </div>
  <div class="actions"><button type="button" class="btn-primary btn-sm" data-act="save" disabled>Save</button><button type="button" class="btn-sm btn-ghost" data-act="cancel" disabled>Cancel</button><button type="button" class="btn-sm" data-act="prev">Same company &amp; fleet as previous contract</button>${(!ch.prev&&!c.left&&c.on)||(!ch.next&&!c.arr&&c.off)?'<button type="button" class="btn-sm" data-act="est">Estimate passport dates</button>':""}</div></article>`;}
function cdList(){
  const fF=$("cdFY").value,q=$("cdQ").value.trim().toLowerCase(),qd=q.replace(/\D/g,"");
  return S.contracts.filter(c=>(cdShow==="all"||!cdState(c).done)&&(!fF||shipDaysIn(c,+fF))&&(!q||(c.vessel||"").toLowerCase().includes(q)||(qd&&String(c.imo||"").includes(qd)))).sort((a,b)=>(dn(b.on)||0)-(dn(a.on)||0));}
function renderCdProgress(){const all=S.example?[]:S.contracts,done=all.filter(c=>cdState(c).done).length,pct=all.length?Math.round(done/all.length*100):0;
  $("cdProgress").innerHTML=`<div class="prog"><div><b>${done} of ${all.length}</b> contract${all.length===1?"":"s"} complete${all.length-done?` · <b>${all.length-done}</b> pending`:""}</div><div class="pbar"><i style="width:${pct}%"></i></div></div>`;}
function renderComplete(force){
  renderCdProgress();$("cdShow").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.s===cdShow)));
  if(cdDirty.size&&!force)return;
  cdDirty.clear();
  if(S.example){$("cdList").innerHTML='<div class="card empty">Upload your seafarer profile first, then complete the pending details here.</div>';return;}
  const list=cdList();
  $("cdList").innerHTML=list.length?list.map(cdCard).join(""):`<div class="card empty">${cdShow==="todo"?"No pending details. Every contract is complete.":"No contracts match these filters."}</div>`;
}
function cdMarkDirty(card){const id=card.dataset.id,c=S.contracts.find(x=>x.id===id);if(!c)return;cdDirty.add(id);card.classList.add("dirty");card.querySelector(".cd-h").innerHTML=cdHead(c,true);card.querySelectorAll('[data-act=save],[data-act=cancel]').forEach(b=>b.disabled=false);}
function okToLeave(){return !cdDirty.size||confirm("You have unsaved changes in Pending details. Leave without saving?");}
function cdSaveCard(card){
  const c=S.contracts.find(x=>x.id===card.dataset.id);if(!c)return;const get=k=>card.querySelector(`[data-k="${k}"]`);
  const L=get("left"),A=get("arr");const lv=L?L.value:c.left,av=A?A.value:c.arr;
  if(lv&&av&&dn(av)<dn(lv)){toast("Arrival in India can't be before leaving India.");return;}
  c.passEst=Object.assign({},c.passEst||{});
  [["left",L],["arr",A]].forEach(([k,el])=>{if(!el)return;if(el.value!==(c[k]||""))delete c.passEst[k];if(el.dataset.est==="1"&&el.value===el.dataset.estv)c.passEst[k]=true;c[k]=el.value;});
  if(!Object.keys(c.passEst).length)delete c.passEst;
  ["onPort","offPort","company"].forEach(k=>{const el=get(k);if(el)c[k]=el.value.trim();});
  ["onIndia","offIndia"].forEach(k=>{const el=get(k);if(el)c[k]=el.value==="india";});
  const na=card.querySelector("[data-na]"),fl=get("fleet");c.fleet=na&&na.checked?"NA":(fl?fl.value.trim():c.fleet);
  c.u=Date.now();saveLocal();cdDirty.delete(c.id);cdEditing=true;try{render();}finally{cdEditing=false;}
  card.outerHTML=cdCard(c);
  /* refresh the other untouched cards so new company names appear as tap-to-fill buttons */
  document.querySelectorAll("#cdList .cd").forEach(el=>{if(cdDirty.has(el.dataset.id)||el.dataset.id===c.id)return;const x=S.contracts.find(y=>y.id===el.dataset.id);if(x)el.outerHTML=cdCard(x);});
  renderCdProgress();toast("Saved",1800);}
$("cdList").addEventListener("input",e=>{const card=e.target.closest(".cd");if(card&&e.target.closest("[data-k],[data-na]"))cdMarkDirty(card);});
$("cdList").addEventListener("change",e=>{const card=e.target.closest(".cd");if(!card)return;
  if(e.target.matches("[data-na]")){const fl=card.querySelector('[data-k="fleet"]');fl.disabled=e.target.checked;fl.value=e.target.checked?"NA":"";}
  if(e.target.closest("[data-k],[data-na]"))cdMarkDirty(card);});
const addDays=(s,n)=>{const d=dn(s);if(d==null)return "";const x=new Date((d+n)*DAY);return x.getUTCFullYear()+"-"+pad(x.getUTCMonth()+1)+"-"+pad(x.getUTCDate());};
function estimate(c){let ch=false;const cc=chainOf(c);c.passEst=c.passEst||{};
  if(!cc.prev&&!c.left&&c.on&&dn(c.on)<=TODAY){c.left=addDays(c.on,-1);c.passEst.left=true;ch=true;}
  if(!cc.next&&!c.arr&&c.off&&dn(c.off)<=TODAY){c.arr=addDays(c.off,1);c.passEst.arr=true;ch=true;}
  if(!Object.keys(c.passEst).length)delete c.passEst;return ch;}
$("cdList").addEventListener("click",e=>{
  const fill=e.target.closest("[data-fill]");if(fill){const card=fill.closest(".cd");card.querySelector('[data-k="company"]').value=fill.dataset.fill;cdMarkDirty(card);return;}
  const b=e.target.closest("[data-act]");if(!b)return;const card=b.closest(".cd"),c=S.contracts.find(x=>x.id===card.dataset.id);if(!c)return;
  if(b.dataset.act==="save"){cdSaveCard(card);return;}
  if(b.dataset.act==="cancel"){cdDirty.delete(c.id);card.outerHTML=cdCard(c);return;}
  if(b.dataset.act==="est"){const cc=chainOf(c);let n=0;
    const L=card.querySelector('[data-k="left"]'),A=card.querySelector('[data-k="arr"]');
    if(L&&!L.value&&c.on&&dn(c.on)<=TODAY){L.value=addDays(c.on,-1);L.dataset.est="1";L.dataset.estv=L.value;n++;}
    if(A&&!A.value&&c.off&&dn(c.off)<=TODAY){A.value=addDays(c.off,1);A.dataset.est="1";A.dataset.estv=A.value;n++;}
    if(n){cdMarkDirty(card);toast("Estimated dates filled in. Press Save to keep them.",3500);}else toast("No blank passport dates to estimate.");return;}
  if(b.dataset.act==="prev"){const o=dn(c.on)||0,cands=S.contracts.filter(x=>x!==c&&(x.company||x.fleet));
    const prev=cands.filter(x=>(dn(x.on)||0)<o).sort((a,b2)=>(dn(b2.on)||0)-(dn(a.on)||0))[0]||cands.filter(x=>(dn(x.on)||0)>=o).sort((a,b2)=>(dn(a.on)||0)-(dn(b2.on)||0))[0];
    if(!prev){toast("No other contract has a company or fleet yet.");return;}
    const co=card.querySelector('[data-k="company"]'),fl=card.querySelector('[data-k="fleet"]'),na=card.querySelector("[data-na]");
    if(prev.company)co.value=prev.company;
    if(prev.fleet){if(prev.fleet.toUpperCase()==="NA"){na.checked=true;fl.disabled=true;fl.value="NA";}else{na.checked=false;fl.disabled=false;fl.value=prev.fleet;}}
    cdMarkDirty(card);toast("Copied from "+prev.vessel+". Press Save to keep it.",3000);}
});
$("cdEstAll").addEventListener("click",()=>{if(S.example)return;if(cdDirty.size){toast("Save or cancel your open changes first.");return;}let n=0;S.contracts.forEach(c=>{if(estimate(c)){c.u=Date.now();n++;}});if(!n){toast("No blank passport dates to estimate.");return;}saveLocal();render();renderComplete(true);toast(`Estimated passport dates for ${n} contract${n===1?"":"s"}. They're marked ESTIMATED until you correct them.`,5000);});
$("cdShow").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;if(!okToLeave())return;cdShow=b.dataset.s;renderComplete(true);});
$("cdFY").addEventListener("change",()=>{if(okToLeave())renderComplete(true);});$("cdQ").addEventListener("input",()=>{if(!cdDirty.size)renderComplete(true);});
addEventListener("beforeunload",e=>{if(cdDirty.size){e.preventDefault();e.returnValue="";}});

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
  const card=n=>{const d=dn(n.date),dd=d!=null?new Date(d*DAY):null,safe=/^https:\/\//i.test(String(n.url||""))?n.url:"#",isNew=newsShow!=="saved"&&(+n.addedAt||0)>seen,k=newsKey(n),st=!!SAVED[k];
    return `<div class="news"><div class="dt">${dd?`<b>${dd.getUTCDate()}</b>${MON[dd.getUTCMonth()]}`:""}</div><a class="nlink" href="${esc(safe)}" target="_blank" rel="noopener noreferrer"><div class="hl">${isNew?'<span class="newtag">NEW</span> ':""}${esc(n.title)}</div>${n.summary?`<div class="gist">${esc(n.summary)}</div>`:""}<div class="meta"><span class="tchip" style="--tc:${TOPIC_COL[n.topic]||"var(--cx)"}">${esc(n.topic||"General")}</span><span>${esc(n.source||"")}</span><span>· ${esc(relDate(n.date))}</span><span class="opens">Opens the full article online ↗</span></div></a><button type="button" class="star" data-star="${esc(k)}" aria-pressed="${st}" aria-label="${st?"Remove from saved":"Save for later"}" title="${st?"Remove from saved":"Save for later"}">${st?"★":"☆"}</button></div>`;};
  /* month folders, each with day folders; the newest month and day are open */
  const months=[],byM={};items.forEach(n=>{const k=String(n.date||"").slice(0,7)||"Undated";if(!byM[k]){byM[k]=[];months.push(k);}byM[k].push(n);});
  const searching=!!q,openM=k=>searching||NOPEN.has(k)||(!NOPEN.size&&k===months[0]),isNewN=n=>newsShow!=="saved"&&(+n.addedAt||0)>seen;
  $("newsList").innerHTML=months.map(k=>{const list=byM[k],days=[],byD={};list.forEach(n=>{const dk=String(n.date||"").slice(0,10)||"Undated";if(!byD[dk]){byD[dk]=[];days.push(dk);}byD[dk].push(n);});
    const nn=list.filter(isNewN).length,ml=/^\d{4}-\d{2}$/.test(k)?monthLbl(k).replace(/^(\w+)/,m=>({Jan:"January",Feb:"February",Mar:"March",Apr:"April",May:"May",Jun:"June",Jul:"July",Aug:"August",Sep:"September",Oct:"October",Nov:"November",Dec:"December"})[m]||m):k;
    return `<details class="nmonth" data-m="${esc(k)}" ${openM(k)?"open":""}><summary><span>📁 ${esc(ml)}</span>${nn?`<span class="nnew">${nn} new</span>`:""}<span class="cnt">${list.length} headline${list.length===1?"":"s"}</span></summary>
      ${days.map((dk,i)=>{const dd=dn(dk),lbl=dd!=null?(TODAY-dd===0?"Today":TODAY-dd===1?"Yesterday":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(dd*DAY).getUTCDay()]+" "+fmt(dd)):dk,dOpen=searching||DOPEN.has(dk)||(i===0&&!DCLOSED.has(dk));
        return `<details class="nday" data-d="${esc(dk)}" ${dOpen?"open":""}><summary><b>${esc(lbl)}</b> · ${byD[dk].length}</summary>${byD[dk].map(card).join("")}</details>`;}).join("")}</details>`;}).join("");
}
const NOPEN=new Set(),DOPEN=new Set(),DCLOSED=new Set();
$("newsList").addEventListener("toggle",e=>{const el=e.target;if(el.classList.contains("nmonth")){if(!NOPEN.size){const first=$("newsList").querySelector(".nmonth");if(first&&first!==el&&first.open)NOPEN.add(first.dataset.m);}el.open?NOPEN.add(el.dataset.m):NOPEN.delete(el.dataset.m);if(!NOPEN.size&&!el.open)NOPEN.add("__none");}
  if(el.classList.contains("nday")){const k=el.dataset.d;if(el.open){DOPEN.add(k);DCLOSED.delete(k);}else{DOPEN.delete(k);DCLOSED.add(k);}}},true);
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
function authMsg(e){const c=(e&&e.code)||"";return ({"auth/admin-restricted-operation":"New accounts are closed. This app is private.","auth/invalid-credential":"Email or password isn't right.","auth/invalid-email":"That email address doesn't look right.","auth/missing-password":"Enter your password.","auth/weak-password":"Use a password of at least 6 characters.","auth/email-already-in-use":"An account with this email already exists. Sign in instead.","auth/invalid-credential":"Email or password isn't right.","auth/wrong-password":"Email or password is wrong.","auth/user-not-found":"No account with this email. Create one first.","auth/too-many-requests":"Too many tries. Wait a few minutes and try again.","auth/network-request-failed":"No internet connection. Try again when you're online.","offline":"You're offline. Connect to the internet and try again."})[c]||"Something went wrong. Please try again.";}

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
      <div class="actions"><button type="submit" class="btn-primary" id="aIn">Sign in</button>${PRIVATE?"":'<button type="button" id="aUp">Create account</button>'}<button type="button" class="btn-ghost" id="aReset">Forgot password?</button></div>
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
  if($("aUp"))$("aUp").onclick=()=>go("up");$("aReset").onclick=()=>go("reset");
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
          const cd=snap.exists?snap.data():{};
          if(cd.vault&&VAULT&&(+cd.vault.u||0)>(+VAULT.u||0)){VAULT=cd.vault;saveVault();}
          if(cd.enc){let o=null;try{o=await decJSON(cd.enc);}catch(e){}if(o)merge(o);else throw new Error("key");}
          if(cd.ledger){try{merge(JSON.parse(cd.ledger));}catch(e){}}
          let docNote="";try{docNote=await docsUpload(f,u);}catch(e){docNote="docs";}if(docNote)notes.push(docNote==="docs"?"some documents":docNote);
          if(!S.example){S.updatedAt=Date.now();await storeLedger(JSON.stringify(snapshot()));await ref.set({enc:await encJSON(snapshot()),vault:VAULT,updatedAt:S.updatedAt,email:u.email||""});}
          try{const dn2=await docsDownload(f,u);if(dn2)notes.push(dn2);}catch(e){notes.push("some documents");}
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

/* certificates, courses, endorsements, CoC and authorised documents (no personal details) */
function sdlParseCerts(text){
  const t=text.replace(/\r/g,"");
  const iso=d=>{const m=String(d||"").match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:"";};
  const out=[];
  /* keys: [canonical name, regex] */
  const grab=(chunk,keys)=>{const re=new RegExp("("+keys.map(k=>k[1]).join("|")+")\\s*:","gi");const hits=[];let m;
    while((m=re.exec(chunk))){const k=keys.find(x=>new RegExp("^"+x[1]+"$","i").test(m[1].trim()));if(k)hits.push({name:k[0],s:m.index,e:re.lastIndex});}
    const f={};hits.forEach((h,j)=>{if(f[h.name]!=null)return;let stop=j+1<hits.length?hits[j+1].s:chunk.length;const cut=chunk.slice(h.e,stop).search(/Report generated on|Total no of record|Page \d+ of \d+|Remarks\s*:|Suspended/i);if(cut>=0)stop=h.e+cut;f[h.name]=chunk.slice(h.e,stop).replace(/\s+/g," ").trim();});return f;};
  const sec=(name,next)=>{const a=t.indexOf(name);if(a<0)return "";let b=t.length;next.forEach(n=>{const i=t.indexOf(n,a+name.length);if(i>=0&&i<b)b=i;});return t.slice(a,b);};
  const split=(s,key)=>{const re=new RegExp("\\d+\\s*\\.\\s*"+key+"\\s*:","g");const idx=[];let m;while((m=re.exec(s)))idx.push(m.index);return idx.map((v,i)=>s.slice(v,i+1<idx.length?idx[i+1]:s.length));};
  split(sec("Modular Course Details",["Sea Going Service","Post Sea Training","Certificate of Endorsement","Certificate of Competency","Authorised Documents"]),"Course Name").forEach(ch=>{
    const f=grab(ch,[["name","Course Name"],["issuer","Training Institute"],["code","STCW Code"],["number","Certificate No\\.?"],["from","Attended From"],["to","Attended To"],["issued","Date of Issue"],["expires","Valid Upto"]]);if(!f.name)return;
    out.push({kind:"course",name:f.name,issuer:f.issuer||"",code:f.code||"",number:f.number||"",issued:iso(f.issued),expires:iso(f.expires)});});
  split(sec("Certificate of Endorsement",["Certificate of Competency","Authorised Documents","DECLARATION"]),"Endorsement").forEach(ch=>{
    const f=grab(ch,[["type","Endorsement Type"],["level","Level"],["number","Certificate No\\.?"],["issuer","Issued At"],["issued","Date of Issue"],["expires","Valid Upto \\(Date\\)"]]);if(!f.type)return;
    out.push({kind:"endorsement",name:titleCaseS(f.type)+(f.level?" · "+f.level:""),number:f.number||"",issuer:f.issuer||"",issued:iso(f.issued),expires:iso(f.expires)});});
  split(sec("Certificate of Competency",["Authorised Documents","DECLARATION"]),"Grade").forEach(ch=>{
    const f=grab(ch,[["grade","Grade"],["number","Certificate Number"],["ctype","Certificate Type"],["issuer","Issue At"],["country","Issuing Country"],["place","Place of Examination"],["issued","Issue Date"],["delivered","Certificate delivered"],["expires","Valid Upto \\(Date\\)"]]);if(!f.grade||!f.number)return;
    out.push({kind:"coc",name:"CoC · "+f.grade,number:f.number,issuer:f.issuer||"",issued:iso(f.issued),expires:iso(f.expires),note:f.ctype||""});});
  split(sec("Authorised Documents",["DECLARATION"]),"Document Type").forEach(ch=>{
    const f=grab(ch,[["type","Document Type"],["number","Document Number"],["issued","Issued Date"],["expires","Valid Upto"],["issuer","Issued At"]]);if(!f.type)return;
    out.push({kind:"document",name:f.type.replace(/\s*No\.?$/,""),number:f.number||"",issued:iso(f.issued),expires:iso(f.expires),issuer:f.issuer||""});});
  const seen=new Set();return out.filter(c=>{const k=[c.kind,c.name,c.number,c.issued].join("|");if(seen.has(k))return false;seen.add(k);return true;});
}
function titleCaseS(v){return String(v||"").toLowerCase().replace(/(^|\s)([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\bDc\b/,"DC");}

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
  const plan=planImport(),nCert=(PIMP.certs||[]).filter(x=>!(S.certs||[]).some(y=>y.id===certId(x))).length,nNew=plan.filter(p=>p.status==="new").length,nUp=plan.filter(p=>p.status==="update").length,ranks=[...new Set(PIMP.recs.map(r=>r.rank).filter(Boolean))];
  const opts=v=>`<option value="">(keep as written)</option>`+Object.entries(RANKS).map(([g,items])=>`<optgroup label="${g}">${items.map(i=>`<option ${i===v?"selected":""}>${esc(i)}</option>`).join("")}</optgroup>`).join("");
  body.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px">
    <div><b>${PIMP.recs.length} sea-service record${PIMP.recs.length===1?"":"s"} found</b> in ${esc(PIMP.name)}.</div>
    <div class="chips"><span class="pill NR">${nNew} new</span><span class="pill RNOR">${nUp} to fill in</span><span class="pill UNK">${plan.length-nNew-nUp} already up to date</span></div>
    ${ranks.length?`<div><div class="eyebrow" style="margin-bottom:6px">Rank in the PDF → rank in the app</div><div class="fgrid">${ranks.map((rk,i)=>`<label class="f"><span>${esc(rk)}</span><select data-rk="${i}">${opts(PIMP.map[rk]!=null?PIMP.map[rk]:(ALLRANKS.includes(defaultRank(rk))?defaultRank(rk):""))}</select></label>`).join("")}</div></div>`:""}
    <div class="tbl-wrap"><table><thead><tr><th>Vessel</th><th>Type</th><th>Rank</th><th>Sign-on</th><th>Sign-off</th><th>Result</th></tr></thead><tbody>${plan.map(p=>`<tr><td><b>${esc(p.cand.vessel)}</b><span class="sub">${p.cand.imo?"IMO "+esc(p.cand.imo):""}</span></td><td>${esc(p.cand.type)}</td><td>${esc(p.cand.rank||"—")}</td><td class="mono">${fmt(dn(p.cand.on))}</td><td class="mono">${fmt(dn(p.cand.off))}</td><td>${p.status==="new"?'<span class="pill NR">New ship</span>':p.status==="update"?`<span class="pill RNOR">Fill ${p.fill.length} detail${p.fill.length===1?"":"s"}</span>`:'<span class="pill UNK">Up to date</span>'}</td></tr>`).join("")}</tbody></table></div>
    ${nCert?`<div><b>${nCert} new certificate${nCert===1?"":"s"}</b> found too. They'll be added to the Certificates tab.</div>`:`<div class="small muted">Certificates: all ${(PIMP.certs||[]).length} are already in the Certificates tab.</div>`}
    <label class="chk"><input type="checkbox" id="pKeep" checked> <span>Also keep this profile PDF in My documents (category "Seafarer profile")</span></label>
    <div class="actions"><button type="button" class="btn-primary" id="pImpGo">${nNew+nUp+nCert?[nNew?`Add ${nNew} new ship${nNew===1?"":"s"}`:"",nUp?`update ${nUp}`:"",nCert?`add ${nCert} certificate${nCert===1?"":"s"}`:""].filter(Boolean).join(", ").replace(/^./,m=>m.toUpperCase()):"Save the PDF only"}</button><button type="button" class="btn-ghost" id="pImpCancel">Close</button></div></div>`;
  body.querySelectorAll("[data-rk]").forEach(sel=>sel.addEventListener("change",()=>{PIMP.map[ranks[+sel.dataset.rk]]=sel.value||ranks[+sel.dataset.rk];renderImport();}));
  $("pImpCancel").onclick=()=>{PIMP=null;renderImport();};
  $("pImpGo").onclick=async()=>{if(S.example)leaveExample();const now=Date.now();let added=0,updated=0;const keep=$("pKeep").checked&&PIMP.file,pf=PIMP.file;
    planImport().forEach(p=>{if(p.status==="new"){S.contracts.push(Object.assign({id:"dgs-"+(p.cand.imo||normName(p.cand.vessel))+"-"+p.cand.on,company:"",fleet:"",left:"",arr:"",onIndia:false,offIndia:false,onPort:"",offPort:"",coastal:false,notes:"From DG Shipping profile",source:"DGS profile",u:now},p.cand));added++;}
      else if(p.status==="update"){p.fill.forEach(k=>p.ex[k]=p.cand[k]);p.ex.u=now;updated++;}});
    S.certs=S.certs||[];let certAdded=0;(PIMP.certs||[]).forEach(x=>{const id=certId(x);if(S.certs.some(y=>y.id===id))return;S.certs.push(Object.assign({id,source:"DGS profile",u:now},x));certAdded++;});
    if(certAdded)toast(`${certAdded} certificate${certAdded===1?"":"s"} added too.`,3000);
    S.settings.rankMap=Object.assign({},S.settings.rankMap||{},PIMP.map);PIMP=null;
    if(keep){try{const c=await compressPdf(pf);const d={id:"doc-"+uid(),name:"Seafarer profile – "+fmt(TODAY),cat:"Seafarer profile",type:"application/pdf",size:c.blob.size,pages:c.pages,added:new Date().toISOString().slice(0,10),u:Date.now(),chunks:0,enc:1,cz:1,cert:"",ship:"",notes:""};
      await blobPut(d.id,c.blob);S.docs=S.docs||[];S.docs.push(d);LOCAL.add(d.id);}catch(e){toast("Couldn't keep the PDF copy, but your ships and certificates were added.",5000);}}
    saveLocal();render();renderImport();
    const todo=S.contracts.filter(c=>!cdState(c).done).length;
    toast(`${added} ship${added===1?"":"s"} added, ${updated} updated.${todo?` ${todo} have pending details: fill them in here.`:""} Press Sync to save to your account.`,7000);location.hash=todo?"complete":"ships";};
}
$("profilePdf").addEventListener("change",async e=>{
  const file=e.target.files[0];e.target.value="";if(!file)return;
  if(!navigator.onLine){toast("You're offline. Connect to upload your profile.");return;}
  const body=$("pImpBody");body.hidden=false;body.innerHTML='<div class="muted">Reading your profile…</div>';
  try{
    if(!window.pdfjsLib){await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";}
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let lines=[];
    for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();lines=lines.concat(sdlLinesFromItems(tc.items));}
    const recs=sdlParseProfile(lines.join("\n")),certs=sdlParseCerts(lines.join("\n"));
    if(!recs.length&&!certs.length){body.innerHTML='<div class="err">No sea-service records were found. Use the “Seafarer Profile” PDF from the DG Shipping e-Governance portal; scanned or photographed copies can\'t be read.</div>';return;}
    const map={},saved=S.settings.rankMap||{};recs.forEach(r=>{if(r.rank&&map[r.rank]==null&&saved[r.rank]!=null)map[r.rank]=saved[r.rank];});
    PIMP={name:file.name,recs,map,certs,file};renderImport();
  }catch(err){body.innerHTML='<div class="err">This file couldn\'t be read. Check that it is the DG Shipping Seafarer Profile PDF and that you\'re online.</div>';}
});


/* ======================= chart style choices ======================= */
const CH=Object.assign({years:"rings",outside:"bars",type:"donut",mix:"donut"},lsJSON("sdlCharts",{}));
function syncSegs(){[["segYears","years"],["segOutside","outside"],["segType","type"],["segMix","mix"]].forEach(([id,k])=>$(id).querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===CH[k]))));}
[["segYears","years"],["segOutside","outside"],["segType","type"],["segMix","mix"]].forEach(([id,k])=>$(id).addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;CH[k]=b.dataset.m;lsSet("sdlCharts",JSON.stringify(CH));syncSegs();renderRings();renderBars();renderDonuts();}));

/* ======================= things to check ======================= */
function leaveByInfo(){
  const f=fyOf(TODAY),r=C.res[f];if(!r||r.india==null)return null;
  const more=Math.max(0,r.need-r.outside),edge=S.settings.edge!==false,e=fyEnd(f);
  const todayOutside=r.cells[TODAY-r.s]==="o";
  if(!more)return {kind:"ok",f,text:`NRI target met for FY ${fyLabel(f)}: ${r.outside} days outside India (${r.need} needed).`};
  if(todayOutside){const until=TODAY+more;return until<=e?{kind:"warn",f,text:`Stay outside India until at least <b>${fmt(until)}</b> to reach ${r.need} days outside in FY ${fyLabel(f)} (${more} more days).`}:{kind:"bad",f,text:`FY ${fyLabel(f)} can no longer reach ${r.need} days outside India.`};}
  const L=e-more+(edge?0:1);
  if(L>=TODAY)return {kind:"warn",f,text:`To stay NRI in FY ${fyLabel(f)}, leave India by <b>${fmt(L)}</b> and stay outside until 31 March ${f+1} (${more} more days outside needed).`};
  return {kind:"bad",f,text:`Not enough days left to reach ${r.need} days outside India in FY ${fyLabel(f)}. This year will count as resident unless your dates change.`};
}
function renderAlerts(){
  const items=[];
  if(S.example){$("alerts").innerHTML=`<div class="alerts-h"><h2>Things to check</h2></div><div class="alert info"><span class="ai">i</span><p>Upload your seafarer profile to replace the example voyages with your own.</p><a class="btn btn-sm" href="#upload">Upload</a></div>`;return;}
  const lb=leaveByInfo();if(lb)items.push({k:lb.kind,t:lb.text,a:["#years","Year results"]});
  const miss=S.contracts.filter(c=>passIssue(c)==="missing").length,est=S.contracts.filter(c=>passIssue(c)==="estimated").length;
  if(miss)items.push({k:"warn",t:`${miss} contract${miss===1?" has":"s have"} no passport dates. NRI days are estimated from CDC dates until you add them.`,a:["#complete","Pending details"]});
  if(est)items.push({k:"info",t:`${est} contract${est===1?" uses":"s use"} estimated passport dates. Replace them with the real dates when you can.`,a:["#complete","Pending details"]});
  const pend=S.contracts.filter(c=>!cdState(c).done).length-est;if(pend>0&&!miss)items.push({k:"info",t:`${pend} contract${pend===1?" has":"s have"} other pending details (ports, company or fleet).`,a:["#complete","Pending details"]});
  const ca=certAttention();if(ca.expired)items.push({k:"bad",t:`${ca.expired} important certificate${ca.expired===1?" has":"s have"} expired.`,a:["#certs","Certificates"]});
  if(ca.soon)items.push({k:"warn",t:`${ca.soon} important certificate${ca.soon===1?" expires":"s expire"} within 6 months.`,a:["#certs","Certificates"]});
  const last=+(lsGet("sdlSynced")||0);if((+S.updatedAt||0)>last)items.push({k:"info",t:savedUser()?"You have changes that aren't in your account yet. Press Sync when you're online.":"Your data is only on this device. Create an account and press Sync to keep it safe.",a:savedUser()?null:["#account","Account"]});
  $("alerts").innerHTML=`<div class="alerts-h"><h2>Things to check</h2><span class="small muted">${items.filter(i=>i.k!=="ok").length||"All clear"}${items.filter(i=>i.k!=="ok").length?" to look at":""}</span></div>`+(items.length?items.map(i=>`<div class="alert ${i.k}"><span class="ai">${i.k==="ok"?"✓":i.k==="bad"?"!":i.k==="warn"?"!":"i"}</span><p>${i.t}</p>${i.a?`<a class="btn btn-sm" href="${i.a[0]}">${i.a[1]}</a>`:"<span></span>"}</div>`).join(""):`<div class="alert ok"><span class="ai">✓</span><p>Nothing needs your attention right now.</p><span></span></div>`);
}

/* ======================= timeline ======================= */
function renderTimeline(){
  const n=+$("tlYears").value||6,fys=C.order.filter(f=>C.res[f].inData).slice(-n).reverse();
  if(!fys.length){$("chTimeline").innerHTML='<div class="empty">Add a contract to see your timeline.</div>';return;}
  const padL=70,padR=10,rowH=46,W=Math.max(640,padL+padR+365*1.6),dw=(W-padL-padR)/366,H=fys.length*rowH+30;let g="";
  "AMJJASONDJFM".split("").forEach((m,i)=>{const d=[0,30,61,91,122,153,183,214,244,275,306,334][i],x=padL+d*dw;g+=`<line x1="${x}" x2="${x}" y1="4" y2="${H-24}" stroke="var(--line)"/><text x="${x+3}" y="${H-10}" font-size="9" fill="var(--muted)">${"Apr May Jun Jul Aug Sep Oct Nov Dec Jan Feb Mar".split(" ")[i]}</text>`;});
  fys.forEach((f,i)=>{const r=C.res[f],y0=8+i*rowH;
    g+=`<g class="tl-row"><text x="${padL-8}" y="${y0+16}" text-anchor="end" font-size="11" fill="var(--ink)" font-weight="500">${fyLabel(f)}</text><text x="${padL-8}" y="${y0+30}" text-anchor="end" font-size="9" fill="${stColor(r.status)}">${r.status} · ${r.outside}d</text>`;
    let run=null;const flush=(end)=>{if(run){const col=run.c==="o"?"var(--sea)":run.c==="p"?"var(--plan)":run.c==="l"?"var(--land)":"var(--unk-bg)";g+=`<rect x="${padL+run.s*dw}" y="${y0+24}" width="${Math.max(1,(end-run.s)*dw)}" height="9" fill="${col}"/>`;}};
    r.cells.forEach((c,d)=>{if(!run||run.c!==c){flush(d);run={c,s:d};}});flush(r.cells.length);
    S.contracts.forEach(c=>{const sp=shipSpan(c);if(!sp)return;const a=Math.max(sp[0],r.s),b=Math.min(sp[1],r.e);if(b<a)return;const x=padL+(a-r.s)*dw,w=Math.max(2,(b-a+1)*dw);
      g+=`<g class="mark" data-tip="${esc(`${c.vessel} · ${c.rank||""}\nCDC ${fmt(dn(c.on))} → ${c.off?fmt(dn(c.off)):"onboard"}\n${b-a+1} days in this year`)}"><rect x="${x}" y="${y0+6}" width="${w}" height="14" rx="3" fill="${typeColor(c.type)}"/>${w>70?`<text x="${x+4}" y="${y0+16}" font-size="9" fill="#fff">${esc(String(c.vessel).slice(0,Math.floor(w/6)))}</text>`:""}</g>`;});
    g+=`</g>`;});
  const T=TODAY;fys.forEach((f,i)=>{const r=C.res[f];if(T>=r.s&&T<=r.e){const x=padL+(T-r.s)*dw;g+=`<line x1="${x}" x2="${x}" y1="${8+i*rowH}" y2="${8+i*rowH+36}" stroke="var(--accent)" stroke-width="2"/><text x="${x+3}" y="${8+i*rowH+4}" font-size="8.5" fill="var(--accent)">today</text>`;}});
  $("chTimeline").innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:600px" role="img" aria-label="Timeline of contracts by financial year">${g}</svg><div class="legend" style="margin-top:6px"><span><i style="background:var(--sea)"></i>Outside India</span><span><i style="background:var(--plan)"></i>Planned outside</span><span><i style="background:var(--land)"></i>In India</span><span>Bars above = contracts, coloured by ship type</span></div>`;
}
$("tlYears").addEventListener("change",renderTimeline);

/* ======================= next-contract planner ======================= */
function planDefaults(){if(!$("pLeft").value){const d=TODAY+30,x=new Date(d*DAY);$("pLeft").value=x.getUTCFullYear()+"-"+pad(x.getUTCMonth()+1)+"-"+pad(x.getUTCDate());}}
$("pLeft").addEventListener("change",()=>{if($("pLeft").value&&!$("pOn").value)$("pOn").value=addDays($("pLeft").value,1);});
$("planForm").addEventListener("submit",e=>{e.preventDefault();
  const L=$("pLeft").value,On=$("pOn").value||(L?addDays(L,1):""),mo=+$("pMonths").value||0;
  if(!L||!On||!mo){$("planOut").innerHTML='<div class="err">Enter the date you leave India, the sign-on date and the contract length.</div>';return;}
  if(dn(On)<dn(L)){$("planOut").innerHTML='<div class="err">Sign-on can\'t be before you leave India.</div>';return;}
  const Off=addDays(On,Math.round(mo*30.44)-1),Arr=$("pArr").value||addDays(Off,1);
  if(dn(Arr)<dn(Off)){$("planOut").innerHTML='<div class="err">Back in India can\'t be before sign-off.</div>';return;}
  const before=C,tmp={id:"__plan",vessel:"Planned contract",type:"Offshore / Other",rank:"",on:On,off:Off,left:L,arr:Arr};
  S.contracts.push(tmp);let P;try{P=compute();}finally{S.contracts=S.contracts.filter(x=>x.id!=="__plan");}
  const fys=[...new Set([fyOf(dn(L)),fyOf(dn(Arr))])].sort();
  $("planOut").innerHTML=`<div class="plan-res"><div class="small muted">Leave India ${fmt(dn(L))} · sign on ${fmt(dn(On))} · sign off about ${fmt(dn(Off))} · back in India ${fmt(dn(Arr))}</div>${fys.map(f=>{const r=P.res[f];if(!r)return "";const diff=r.outside-r.need;
    return `<div class="pr"><div><b>FY ${fyLabel(f)}</b> · ${r.outside} days outside India (${r.need} needed)<div class="small muted">${diff>=0?`${diff} day${diff===1?"":"s"} to spare`:`${-diff} day${diff===-1?"":"s"} short`}</div></div><span class="pill ${r.status}">${r.status==="NR"?"NRI ✓":r.status}</span></div>`;}).join("")}<div class="small muted">Assumes you stay outside India from leaving until you're back, and that you're in India for the rest of each year unless other contracts are already entered. Change the dates and check again.</div></div>`;
});
$("pClear").addEventListener("click",()=>{["pLeft","pOn","pArr"].forEach(id=>$(id).value="");$("pMonths").value="6";$("planOut").innerHTML="";});

/* ======================= certificates ======================= */
const CERT_KIND={document:"ID document",coc:"CoC",endorsement:"Endorsement",course:"STCW course",medical:"Medical",other:"Other"};
const FAMILY=[["pst",/personal survival|\bpst\b/i],["fpff",/fire prevention|\bfpff\b/i],["aff",/advanced (training in )?fire fighting|\baff\b/i],["mfa",/medical first aid|\bmfa\b/i],["mc",/medical care/i],["pscrb",/survival craft|\bpscrb\b/i],["engref",/refresher and updating/i],["pssr",/personal safety/i],["efa",/elementary first aid/i]];
const KEY_FAMILIES=new Set(["pst","fpff","aff","mfa","mc","pscrb","engref","passport","cdc","coc"]);
function certFamily(c){const n=String(c.name||"");if(c.kind==="document")return n.toLowerCase().replace(/[^a-z]/g,"");if(c.kind==="coc")return "coc";if(c.kind==="endorsement")return "end-"+(n.split("·")[1]||"").trim().toLowerCase();if(c.kind==="medical")return "medical";const hit=FAMILY.find(([,re])=>re.test(n));return hit?hit[0]:n.toLowerCase();}
function certStatus(c){
  if(c.hidden)return "hiddenc";
  const fam=certFamily(c),newer=(S.certs||[]).some(x=>x!==c&&!x.hidden&&certFamily(x)===fam&&(x.issued||"")>(c.issued||""));
  if(newer)return "replaced";
  if(!c.expires)return "noexp";const d=dn(c.expires)-TODAY;return d<0?"expired":d<=183?"soon":"valid";}
function isKeyCert(c){const f=certFamily(c);return KEY_FAMILIES.has(f)||c.kind==="endorsement"||c.kind==="medical";}
function certAttention(){let expired=0,soon=0;(S.certs||[]).forEach(c=>{if(!isKeyCert(c))return;const s=certStatus(c);if(s==="expired")expired++;else if(s==="soon")soon++;});return {expired,soon};}
function renderCertBadge(){const a=S.example?{expired:0,soon:0}:certAttention(),n=a.expired+a.soon;$("certBadge").hidden=!n;$("certBadge").textContent=n;}
let certType="",certShow="current";
const STLBL={valid:"Valid",soon:"Expires soon",expired:"Expired",noexp:"No expiry date",replaced:"Replaced by newer",hiddenc:"Hidden"};
function relDays(d){const n=d-TODAY,a=Math.abs(n);const t=a<45?a+" day"+(a===1?"":"s"):a<730?Math.round(a/30.44)+" months":(a/365).toFixed(1)+" years";return n>=0?"in "+t:t+" ago";}
function maskNo(n){n=String(n||"");return n.length>4?"•••• "+n.slice(-4):n;}
function renderCerts(){
  const all=S.example?[]:(S.certs||[]);const cnt={valid:0,soon:0,expired:0,noexp:0};all.forEach(c=>{const s=certStatus(c);if(cnt[s]!=null)cnt[s]++;});
  $("certTiles").innerHTML=`<div class="tile"><b style="color:var(--ok)">${cnt.valid}</b><span>valid</span></div><div class="tile"><b style="color:var(--warn)">${cnt.soon}</b><span>expire within 6 months</span></div><div class="tile"><b style="color:var(--bad)">${cnt.expired}</b><span>expired</span></div><div class="tile"><b>${cnt.noexp}</b><span>no expiry date</span></div>`;
  const noScan=all.filter(c=>{const s=certStatus(c);return s!=="replaced"&&s!=="hiddenc"&&!hasScan(c);}).length;$("certNoScan").textContent=`Missing scan (${noScan})`;
  $("certType").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===certType)));$("certShow").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.s===certShow)));
  const q=$("certQ").value.trim().toLowerCase();
  const list=all.filter(c=>{const s=certStatus(c);
    if(certType==="coc"&&!(c.kind==="coc"||c.kind==="endorsement"))return false;if(certType==="other"&&!(c.kind==="medical"||c.kind==="other"))return false;if(certType&&certType!=="coc"&&certType!=="other"&&c.kind!==certType)return false;
    if(certShow==="current"&&(s==="replaced"||s==="hiddenc"))return false;if(certShow==="attention"&&!(s==="expired"||s==="soon"))return false;if(certShow==="noscan"&&(s==="replaced"||s==="hiddenc"||hasScan(c)))return false;
    if(q&&!(String(c.name)+" "+String(c.issuer||"")+" "+String(c.number||"")).toLowerCase().includes(q))return false;return true;})
   .sort((a,b)=>{const o={expired:0,soon:1,valid:2,noexp:3,replaced:4,hiddenc:5};const sa=o[certStatus(a)],sb=o[certStatus(b)];return sa-sb||String(a.expires||"9").localeCompare(String(b.expires||"9"))||String(a.name).localeCompare(String(b.name));});
  if(!all.length){$("certList").innerHTML='<div class="empty">No certificates yet. Upload your seafarer profile or add one.</div>';return;}
  if(!list.length){$("certList").innerHTML=`<div class="empty">${certShow==="attention"?"Nothing has expired or is expiring soon.":"No certificates match these filters."}</div>`;return;}
  $("certList").innerHTML=list.map(c=>{const s=certStatus(c),e=dn(c.expires);
    return `<div class="cert ${s}" data-id="${esc(c.id)}"><span class="stripe"></span><div><div class="cn">${esc(c.name)}${hasScan(c)?` <span class="clip">📎 ${scansOf(c).length>1?scansOf(c).length+" scans":"scan"}</span>`:""}</div>
      <div class="meta"><span class="tchip" style="--tc:${{document:"var(--c0)",coc:"var(--c6)",endorsement:"var(--c6)",course:"var(--c2)",medical:"var(--c7)",other:"var(--cx)"}[c.kind]||"var(--cx)"}">${esc(CERT_KIND[c.kind]||"Other")}</span>${c.number?`<span>No. <span class="num" data-num="${esc(c.number)}">${esc(c.kind==="document"?maskNo(c.number):c.number)}</span>${c.kind==="document"&&String(c.number).length>4?'<button type="button" class="reveal" data-reveal>Show</button>':""}</span>`:""}${c.issuer?`<span>${esc(c.issuer)}</span>`:""}${c.issued?`<span>Issued ${fmt(dn(c.issued))}</span>`:""}</div>${c.notes?`<div class="small muted" style="margin-top:3px">${esc(c.notes)}</div>`:""}</div>
      <div class="right">${hasScan(c)?`<button type="button" class="cthumb" data-cscan aria-label="View scan of ${esc(c.name)}" data-th="${esc(scansOf(c)[0].id)}">📎</button>`:""}<span class="pill ${{valid:"NR",soon:"RNOR",expired:"ROR"}[s]||"UNK"}">${STLBL[s]}</span>${e!=null?`<span class="exp">${s==="expired"?"Expired":"Expires"} ${fmt(e)}<br><span class="muted">${relDays(e)}</span></span>`:""}
      <div class="row-act">${hasScan(c)?'<button type="button" class="btn-sm btn-primary scan" data-cscan>View scan</button>':""}<button type="button" class="btn-sm" data-cattach>${hasScan(c)?"Add scan":"Attach scan"}</button><button type="button" class="btn-sm" data-cedit>Edit</button><button type="button" class="btn-sm" data-chide>${c.hidden?"Unhide":"Hide"}</button><button type="button" class="btn-sm btn-danger" data-cdel>Delete</button></div></div></div>`;}).join("");
  fillCertThumbs();
}
function scansOf(c){return (S.docs||[]).filter(d=>d.cert===c.id);}
function hasScan(c){return (S.docs||[]).some(d=>d.cert===c.id);}
async function fillCertThumbs(){await refreshLocal();for(const b of [...$("certList").querySelectorAll("[data-th]")]){const d=(S.docs||[]).find(x=>x.id===b.dataset.th);if(!d||!LOCAL.has(d.id))continue;try{const t=await thumbFor(d);if(t&&b.isConnected)b.innerHTML=`<img src="${t}" alt="">`;}catch(e){}}}
function certId(c){const s=[c.kind,c.name,c.number||"",c.issued||""].join("|");let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return "cert-"+(h>>>0).toString(36);}
function openCertForm(c){$("certForm").reset();$("ceErr").textContent="";$("ce_id").value=c?c.id:"";["name","kind","number","issuer","issued","expires","notes"].forEach(k=>{if(c)$("ce_"+k).value=c[k]||(k==="kind"?"other":"");});
  $("certFormTitle").textContent=c?"Edit certificate":"Add certificate";$("certFormCard").hidden=false;$("certFormCard").scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});$("ce_name").focus({preventScroll:true});}
$("certAdd").addEventListener("click",()=>openCertForm(null));$("certFormClose").addEventListener("click",()=>$("certFormCard").hidden=true);$("ceCancel").addEventListener("click",()=>$("certFormCard").hidden=true);
$("certForm").addEventListener("submit",e=>{e.preventDefault();const name=$("ce_name").value.trim();if(!name){$("ceErr").textContent="Enter the certificate name.";return;}
  const iss=$("ce_issued").value,exp=$("ce_expires").value;if(iss&&exp&&exp<iss){$("ceErr").textContent="Expiry can't be before the issue date.";return;}
  if(S.example)leaveExample();S.certs=S.certs||[];const id=$("ce_id").value,ex=S.certs.find(x=>x.id===id);
  const c=Object.assign(ex||{source:"manual"},{name,kind:$("ce_kind").value,number:$("ce_number").value.trim(),issuer:$("ce_issuer").value.trim(),issued:iss,expires:exp,notes:$("ce_notes").value.trim(),u:Date.now()});
  if(!ex){c.id="cert-m"+uid();S.certs.push(c);}saveLocal();$("certFormCard").hidden=true;render();renderCerts();toast(ex?"Certificate updated":"Certificate added");});
let pendingCDel=null;
$("certList").addEventListener("click",e=>{const row=e.target.closest(".cert");if(!row)return;const c=(S.certs||[]).find(x=>x.id===row.dataset.id);if(!c)return;
  if(e.target.closest("[data-reveal]")){const n=row.querySelector("[data-num]"),b=e.target.closest("[data-reveal]");const shown=b.textContent==="Hide";n.textContent=shown?maskNo(n.dataset.num):n.dataset.num;b.textContent=shown?"Show":"Hide";return;}
  if(e.target.closest("[data-cedit]")){openCertForm(c);return;}
  if(e.target.closest("[data-cattach]")){ATTACH=c;$("certFile").click();return;}
  if(e.target.closest("[data-cscan]")){const l=S.docs.filter(x=>x.cert===c.id);if(l.length)refreshLocal().then(()=>viewList(l.filter(x=>LOCAL.has(x.id)),l[0]));return;}
  if(e.target.closest("[data-chide]")){c.hidden=!c.hidden;c.u=Date.now();saveLocal();render();renderCerts();return;}
  const d=e.target.closest("[data-cdel]");if(d){if(pendingCDel!==c.id){pendingCDel=c.id;d.textContent="Tap again to delete";setTimeout(()=>{if(pendingCDel===c.id){pendingCDel=null;d.textContent="Delete";}},4000);return;}
    pendingCDel=null;S.certs=S.certs.filter(x=>x.id!==c.id);(S.deleted=S.deleted||[]).push({id:c.id,u:Date.now()});saveLocal();render();renderCerts();toast("Certificate deleted");}});
$("certType").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;certType=b.dataset.t;renderCerts();});
$("certShow").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;certShow=b.dataset.s;renderCerts();});
$("certQ").addEventListener("input",renderCerts);


/* ======================= my documents (scans) ======================= */
/* files live in IndexedDB on the device; metadata travels with the ledger; the file itself is stored in the
   user's private Firestore area in pieces of up to 700 KB (users/{uid}/files/{docId}_{n}) when Sync is pressed */
const DOC_CATS=["Passport","CDC","CoC","Endorsement","STCW course","Medical","Visa","Contract letter","Salary slip","Seafarer profile","Other"];
const SHIPCATS=["Contract letter","Salary slip"];
const CHUNK=700000,PDF_MAX=8*1024*1024,PDF_IN_MAX=40*1024*1024;
let idbP=null;
function idb(){if(!idbP)idbP=new Promise((res,rej)=>{const q=indexedDB.open("sdl-docs",1);q.onupgradeneeded=()=>q.result.createObjectStore("files");q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});return idbP;}
async function idbDo(mode,fn){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction("files",mode),st=tx.objectStore("files");const q=fn(st);tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error);});}
const rawGet=id=>idbDo("readonly",st=>st.get(id)),rawPut=(id,b)=>idbDo("readwrite",st=>st.put(b,id)),blobDel=id=>idbDo("readwrite",st=>st.delete(id)),blobKeys=()=>idbDo("readonly",st=>st.getAllKeys());
/* files are stored encrypted; these two give back / take the readable file */
async function blobGet(id){const raw=await rawGet(id);if(!raw)return null;const d=(S.docs||[]).find(x=>x.id===id);if(!d||!d.enc)return raw;
  return new Blob([await aesDec(MK,new Uint8Array(await raw.arrayBuffer()))],{type:d.type});}
async function blobPut(id,b){await rawPut(id,new Blob([await aesEnc(MK,new Uint8Array(await b.arrayBuffer()))],{type:"application/octet-stream"}));}
/* older, unencrypted files on this device are encrypted and given a new id; the old copy in the account is removed on the next Sync */
async function migrateDocs(){if(!MK)return 0;let n=0;const now=Date.now();
  for(const d of (S.docs||[])){if(d.enc)continue;const raw=await rawGet(d.id);if(!raw)continue;
    const nid="doc-"+uid();await rawPut(nid,new Blob([await aesEnc(MK,new Uint8Array(await raw.arrayBuffer()))],{type:"application/octet-stream"}));await blobDel(d.id);
    (S.deleted=S.deleted||[]).push({id:d.id,u:now,n:d.chunks||0});if(THUMBS[d.id])delete THUMBS[d.id];d.id=nid;d.enc=1;d.chunks=0;d.u=now;n++;}
  if(n){S.updatedAt=now;await storeLedger(JSON.stringify(snapshot()));}return n;}
let LOCAL=new Set();async function refreshLocal(){try{LOCAL=new Set(await blobKeys());}catch(e){LOCAL=new Set();}}
const mb=n=>!n?"0 KB":n>=1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";
function renderDocBadge(){const n=S.example?0:(S.docs||[]).filter(d=>!d.chunks).length;$("docBadge").hidden=!n||!savedUser();$("docBadge").textContent=n;$("docBadge").title="Waiting to sync";}
/* ---------- compression: every file is made as small as possible while staying sharp ---------- */
const IMG_MAX=2400,IMG_TARGET=850000,PDF_DPI=200;
async function imgToJpeg(file,max){
  const url=URL.createObjectURL(file);try{const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
    let side=Math.min(max||IMG_MAX,Math.max(im.naturalWidth,im.naturalHeight)),b,w,h;
    for(let pass=0;pass<4;pass++){const k=side/Math.max(im.naturalWidth,im.naturalHeight);w=Math.round(im.naturalWidth*k);h=Math.round(im.naturalHeight*k);
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,w,h);cx.imageSmoothingQuality="high";cx.drawImage(im,0,0,w,h);
      let q=.86;do{b=await new Promise(r=>cv.toBlob(r,"image/jpeg",q));q-=.06;}while(b&&b.size>IMG_TARGET&&q>.66);cv.width=cv.height=0;
      if(b.size<=IMG_TARGET*1.4)break;side=Math.round(side*.85);}
    if(file.type==="image/jpeg"&&file.size<=b.size)return {blob:file,w,h,kept:true}; /* already smaller than we could make it */
    return {blob:b,w,h};}
  finally{URL.revokeObjectURL(url);}
}
async function pdfLib(){if(!window.pdfjsLib){await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";}if(!window.jspdf)await loadScript("vendor/jspdf.umd.min.js");}
/* a scanned PDF is rebuilt page by page at print quality; if that isn't clearly smaller (text PDFs usually are small already) the original is kept */
async function compressPdf(file,onp){
  await pdfLib();const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const {jsPDF}=window.jspdf;let out=null;
  try{for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i),v1=pg.getViewport({scale:1}),k=Math.min(PDF_DPI/72,IMG_MAX/Math.max(v1.width,v1.height)),vp=pg.getViewport({scale:k});
      const cv=document.createElement("canvas");cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);
      await pg.render({canvasContext:cx,viewport:vp}).promise;const jpg=await new Promise(r=>cv.toBlob(r,"image/jpeg",.8));cv.width=cv.height=0;
      const o=v1.width>v1.height?"l":"p";if(!out)out=new jsPDF({unit:"pt",format:[v1.width,v1.height],orientation:o,compress:true});else out.addPage([v1.width,v1.height],o);
      out.addImage(new Uint8Array(await jpg.arrayBuffer()),"JPEG",0,0,v1.width,v1.height,undefined,"NONE");pg.cleanup();if(onp)onp(i,pdf.numPages);}
    const pages=pdf.numPages,b=out.output("blob");return b.size<file.size*.9?{blob:b,pages}:{blob:file,pages,kept:true};}
  finally{try{pdf.destroy();}catch(e){}}
}
async function photosToPdf(files,onp){await pdfLib();const {jsPDF}=window.jspdf;let pdf=null,i=0;
  for(const f of files){const {blob,w,h}=await imgToJpeg(f,2000);const o=w>h?"l":"p",W=w*.75,H=h*.75; /* 96 dpi px → pt */
    if(!pdf)pdf=new jsPDF({unit:"pt",format:[W,H],orientation:o,compress:true});else pdf.addPage([W,H],o);pdf.addImage(new Uint8Array(await blob.arrayBuffer()),"JPEG",0,0,W,H,undefined,"NONE");if(onp)onp(++i,files.length);}
  return pdf.output("blob");}
let PEND=[];
/* ---------- which certificate does a document belong to? ---------- */
const CABBR=[["pst",/personal survival/i],["fpff",/fire prevention/i],["aff",/advanced (training in )?fire|advanced fire/i],["mfa",/medical first aid/i],["mc",/medical care/i],["pscrb",/survival craft|proficiency in survival/i],["pssr",/personal safety/i],["efa",/elementary first aid/i],["stsdsd",/security duties|security awareness/i],["erm",/engine ?room resource/i],["hv",/high voltage/i],["bst",/basic safety/i],["tasco",/tanker|oil.*chemical|chemical tanker|oil tanker/i],["gmdss",/gmdss/i]];
function suggestCert(name,cat){
  const cs=(S.certs||[]).filter(c=>!c.hidden&&certStatus(c)!=="replaced"),n=String(name||"").toLowerCase();
  const pick=l=>l.slice().sort((a,b)=>String(b.issued||"").localeCompare(String(a.issued||"")))[0]||null;
  const by=(re,kind)=>pick(cs.filter(c=>(!kind||c.kind===kind)&&re.test(c.name)));
  if(/passport/.test(n)||(cat==="Passport"&&!n.trim()))return by(/passport/i,"document");
  if(/\bcdc\b|discharge/.test(n))return by(/cdc|discharge/i,"document");
  if(/indos/.test(n))return by(/indos/i);
  if(/\bcoc\b|competen/.test(n))return pick(cs.filter(c=>c.kind==="coc"));
  if(/endorse|\bdce\b|dangerous cargo/.test(n))return pick(cs.filter(c=>c.kind==="endorsement"));
  for(const [ab,re] of CABBR)if(new RegExp("\\b"+ab+"\\b").test(n)||re.test(n)){const m=by(new RegExp(re.source+"|\\b"+ab+"\\b","i"));if(m)return m;}
  const stop=new Set(["certificate","certificates","scan","scanned","copy","page","pages","front","back","training","course","document","photo","image","valid","with","from"]);
  const words=n.split(/[^a-z0-9]+/).filter(w=>w.length>3&&!stop.has(w));
  if(words.length){let best=null,bs=0;cs.forEach(c=>{const cn=String(c.name).toLowerCase(),sc=words.filter(w=>cn.includes(w)).length/words.length;if(sc>bs){bs=sc;best=c;}});if(bs>=0.5)return best;}
  if(cat==="Passport")return by(/passport/i,"document");if(cat==="CDC")return by(/cdc|discharge/i,"document");if(cat==="CoC")return pick(cs.filter(c=>c.kind==="coc"));if(cat==="Endorsement")return pick(cs.filter(c=>c.kind==="endorsement"));
  if(cat==="Medical")return pick(cs.filter(c=>c.kind==="medical"));
  return null;
}
function catForCert(c){if(!c)return "Other";if(c.kind==="document")return /passport/i.test(c.name)?"Passport":/cdc|discharge/i.test(c.name)?"CDC":"Other";return {coc:"CoC",endorsement:"Endorsement",course:"STCW course",medical:"Medical"}[c.kind]||"Other";}
let certTouched=false,nameAuto=false;
function shipOpts(sel){return `<option value="">— none —</option>`+S.contracts.slice().sort((a,b)=>(dn(b.on)||0)-(dn(a.on)||0)).map(c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""}>${esc(c.vessel)} · ${fmt(dn(c.on))}</option>`).join("");}
const monthLbl=m=>{if(!/^\d{4}-\d{2}$/.test(m||""))return "";const [y,mo]=m.split("-").map(Number);return MON[mo-1]+" "+y;};
function slipName(){const c=S.contracts.find(x=>x.id===$("dc_ship").value),m=monthLbl($("dc_month").value);return "Salary slip"+(m?" "+m:"")+(c?" – "+c.vessel:"");}
function syncFormBits(){const slip=$("dc_cat").value==="Salary slip";$("dcMonthRow").hidden=!slip;
  if(nameAuto||!$("dc_name").value.trim()){if(slip){$("dc_name").value=slipName();nameAuto=true;}else if($("dc_cat").value==="Contract letter"){const c=S.contracts.find(x=>x.id===$("dc_ship").value);if(c){$("dc_name").value="Contract letter – "+c.vessel;nameAuto=true;}}}}
$("dc_cat").addEventListener("change",syncFormBits);$("dc_ship").addEventListener("change",syncFormBits);$("dc_month").addEventListener("change",syncFormBits);
$("dc_name").addEventListener("input",()=>{nameAuto=false;});
function suggestInForm(){if(certTouched||$("dc_id").value)return;const c=suggestCert($("dc_name").value,$("dc_cat").value);$("dc_cert").innerHTML=docCertOpts(c?c.id:"");$("dcHint").textContent=c?"Suggested from the name. Change it if it's not right.":"";}
$("dc_name").addEventListener("input",suggestInForm);$("dc_cat").addEventListener("change",suggestInForm);
$("dc_cert").addEventListener("change",()=>{certTouched=true;$("dcHint").textContent="";});
/* attach a scan straight from a certificate: the add form opens inside the Certificates tab, already linked */
let ATTACH=null,SHIPATTACH=null;const formHome=$("docFormCard").parentNode,formNext=$("docFormCard").nextSibling;
function formBackHome(){if($("docFormCard").parentNode!==formHome)formHome.insertBefore($("docFormCard"),formNext);ATTACH=null;SHIPATTACH=null;}
$("certFile").addEventListener("change",()=>{const files=[...$("certFile").files];$("certFile").value="";if(!files.length||!ATTACH)return;
  const c=ATTACH,row=$("certList").querySelector(`.cert[data-id="${CSS.escape(c.id)}"]`);(row||$("certList")).after($("docFormCard"));
  startDocAdd(files,{name:c.name,cat:catForCert(c),cert:c.id});});

const docCertOpts=sel=>{const cs=(S.certs||[]).filter(c=>!c.hidden),cur=cs.filter(c=>certStatus(c)!=="replaced"),old=cs.filter(c=>certStatus(c)==="replaced"),o=c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""}>${esc(c.name)}${c.expires?" · exp "+fmt(dn(c.expires)):""}</option>`,srt=l=>l.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return `<option value="">— none —</option><optgroup label="Current">${srt(cur).map(o).join("")}</optgroup>${old.length?`<optgroup label="Older (replaced)">${srt(old).map(o).join("")}</optgroup>`:""}`;};
function normCat(c){return c==="Contract / letter"?"Contract letter":DOC_CATS.includes(c)?c:"Other";}
function guessCat(n){n=n.toLowerCase();if(/salary|pay ?slip|wage/.test(n))return "Salary slip";if(/contract|appointment|offer letter/.test(n))return "Contract letter";if(/seafarer.?profile|dgs/.test(n))return "Seafarer profile";return /passport/.test(n)?"Passport":/cdc|discharge/.test(n)?"CDC":/coc|competency/.test(n)?"CoC":/endorse/.test(n)?"Endorsement":/medical|fitness/.test(n)?"Medical":/visa/.test(n)?"Visa":/stcw|course|fire|survival|first aid/.test(n)?"STCW course":"Other";}
$("docAddLbl").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("docFile").click();}});
$("docFile").addEventListener("change",()=>{const files=[...$("docFile").files];$("docFile").value="";if(files.length){formBackHome();startDocAdd(files);}});
function startDocAdd(files,preset){
  const bad=files.filter(f=>!(/^image\//.test(f.type)||f.type==="application/pdf"));if(bad.length){toast("Only photos and PDF files can be added.");return;}
  const big=files.find(f=>f.type==="application/pdf"&&f.size>PDF_IN_MAX);if(big){toast(`${big.name} is larger than 40 MB. Please use a smaller PDF.`,5000);return;}
  PEND=files;$("docForm").reset();$("dc_id").value="";$("dcErr").textContent="";$("docFormTitle").textContent=files.length>1?`Add ${files.length} files`:"Add document";
  const imgs=files.filter(f=>/^image\//.test(f.type));$("dcCombineRow").hidden=!(imgs.length>1&&imgs.length===files.length);
  const base=files[0].name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();certTouched=false;nameAuto=false;$("dcHint").textContent="";$("dc_ship").innerHTML=shipOpts(preset&&preset.ship||"");$("dc_month").value=preset&&preset.month||"";
  if(preset&&preset.ship){$("dc_cat").value=preset.cat;$("dc_cert").innerHTML=docCertOpts("");certTouched=true;$("dc_name").value=preset.name||"";nameAuto=true;$("docFormTitle").textContent="Add "+preset.cat.toLowerCase();syncFormBits();}
  else if(preset){$("dc_name").value=preset.name;$("dc_cat").value=preset.cat;$("dc_cert").innerHTML=docCertOpts(preset.cert);certTouched=true;$("docFormTitle").textContent="Attach scan";$("dcHint").textContent="Linked to this certificate.";}
  else{$("dc_name").value=files.length>1&&$("dcCombineRow").hidden?"":base;$("dc_cat").value=guessCat(base);suggestInForm();}
  if(!(preset&&preset.ship))syncFormBits();
  $("docPrev").innerHTML=files.map((f,i)=>`<div class="pv" data-i="${i}">${/^image\//.test(f.type)?"":"PDF<br>"+esc(f.name.slice(0,24))}</div>`).join("");
  files.forEach((f,i)=>{if(/^image\//.test(f.type)){const u=URL.createObjectURL(f),im=new Image();im.onload=()=>setTimeout(()=>URL.revokeObjectURL(u),1000);im.src=u;$("docPrev").querySelector(`[data-i="${i}"]`).appendChild(im);}});
  $("docFormCard").hidden=false;$("docFormCard").scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});
}
function openDocForm(d){formBackHome();PEND=[];$("dcHint").textContent="";certTouched=true;$("docForm").reset();$("dcErr").textContent="";$("dc_id").value=d.id;$("docFormTitle").textContent="Edit document";$("dcCombineRow").hidden=true;$("docPrev").innerHTML="";
  $("dc_name").value=d.name;$("dc_cat").value=normCat(d.cat);$("dc_ship").innerHTML=shipOpts(d.ship||"");$("dc_month").value=d.month||"";nameAuto=false;$("dcMonthRow").hidden=$("dc_cat").value!=="Salary slip";$("dc_cert").innerHTML=docCertOpts(d.cert||"");$("dc_notes").value=d.notes||"";$("docFormCard").hidden=false;$("docFormCard").scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});}
const closeDocForm=()=>{$("docFormCard").hidden=true;PEND=[];formBackHome();};
$("docFormClose").addEventListener("click",closeDocForm);$("dcCancel").addEventListener("click",closeDocForm);
$("docForm").addEventListener("submit",async e=>{e.preventDefault();
  const name=$("dc_name").value.trim(),meta={cat:$("dc_cat").value,cert:$("dc_cert").value,ship:$("dc_ship").value,month:$("dc_cat").value==="Salary slip"?$("dc_month").value:"",notes:$("dc_notes").value.trim()};
  if(!name&&!(PEND.length>1&&$("dcCombineRow").hidden)){$("dcErr").textContent="Enter a name for the document.";return;}
  const id=$("dc_id").value;
  if(id){const d=S.docs.find(x=>x.id===id);if(d){Object.assign(d,meta,{name,u:Date.now()});saveLocal();render();renderDocs();}closeDocForm();toast("Document updated");return;}
  const addSize=PEND.reduce((a,f)=>a+(/^image\//.test(f.type)?500000:f.size),0);
  if(storageInfo().used+addSize*4/3>docLimit()){$("dcErr").textContent=`This would go over the ${mb(docLimit())} document space for your account. Delete old or replaced documents first.`;return;}
  $("dcSave").disabled=true;$("dcSave").textContent="Compressing…";const prog=m=>$("dcProg").textContent=m;
  try{
    if(S.example)leaveExample();S.docs=S.docs||[];
    let items=[];
    if(PEND.length>1&&!$("dcCombineRow").hidden&&$("dc_combine").checked){
      const before=PEND.reduce((a,f)=>a+f.size,0),blob=await photosToPdf(PEND,(i,n)=>prog(`Compressing photo ${i} of ${n}…`));
      items.push({name,blob,type:"application/pdf",pages:PEND.length,before});
    }else{
      for(let i=0;i<PEND.length;i++){const f=PEND[i];const nm=name?(PEND.length>1?`${name} (${i+1})`:name):f.name.replace(/\.[^.]+$/,"");
        prog(PEND.length>1?`Compressing file ${i+1} of ${PEND.length}…`:"Compressing…");
        if(/^image\//.test(f.type)){const {blob}=await imgToJpeg(f,IMG_MAX);items.push({name:nm,blob,type:"image/jpeg",before:f.size});}
        else{const c=await compressPdf(f,(p,n)=>prog(`Compressing page ${p} of ${n}…`));if(c.blob.size>PDF_MAX)throw Object.assign(new Error("big"),{code:"big",nm:f.name});items.push({name:nm,blob:c.blob,type:"application/pdf",pages:c.pages,before:f.size});}}
    }
    for(const it of items){const d=Object.assign({id:"doc-"+uid(),name:it.name,type:it.type,size:it.blob.size,added:new Date().toISOString().slice(0,10),u:Date.now(),chunks:0,enc:1,cz:1},meta);if(it.pages)d.pages=it.pages;
      await blobPut(d.id,it.blob);LOCAL.add(d.id);S.docs.push(d);}
    const fromCert=!!ATTACH,fromShip=!!SHIPATTACH;saveLocal();closeDocForm();render();renderDocs();if(fromCert)renderCerts();
    const b0=items.reduce((a,it)=>a+(it.before||it.blob.size),0),b1=items.reduce((a,it)=>a+it.blob.size,0),saved=b0>b1?` Compressed ${mb(b0)} → ${mb(b1)}.`:"";
    toast((items.length===1?"Document saved.":`${items.length} documents saved.`)+saved+(savedUser()?" Press Sync to keep it in your account.":""),6000);
  }catch(err){$("dcErr").textContent=err&&err.code==="big"?`${err.nm} is still larger than 8 MB after compressing. Split it into smaller PDFs.`:"Couldn't save this file. "+(err&&err.name==="QuotaExceededError"?"This device is out of storage.":"Please try again.");}
  finally{$("dcSave").disabled=false;$("dcSave").textContent="Save";$("dcProg").textContent="";}
});
let docCat="",THUMBS={};
async function thumbFor(d){
  if(THUMBS[d.id])return THUMBS[d.id];const b=await blobGet(d.id);if(!b)return null;
  if(d.type!=="application/pdf"){THUMBS[d.id]=URL.createObjectURL(b);return THUMBS[d.id];}
  try{if(!window.pdfjsLib){await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";}
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise,pg=await pdf.getPage(1),vp0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:320/vp0.width});
    const cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;if(!d.pages){d.pages=pdf.numPages;}
    THUMBS[d.id]=cv.toDataURL("image/jpeg",.7);pdf.destroy&&pdf.destroy();return THUMBS[d.id];}catch(e){return null;}
}
async function renderDocs(){
  await refreshLocal();
  const all=S.example?[]:(S.docs||[]),total=all.reduce((a,d)=>a+(d.size||0),0),waiting=all.filter(d=>!d.chunks).length,away=all.filter(d=>!LOCAL.has(d.id)).length;
  $("docTiles").innerHTML=`<div class="tile"><b>${all.length}</b><span>documents</span></div><div class="tile"><b>${mb(storageInfo().used)}</b><span>of ${mb(docLimit())} cloud space used</span></div><div class="tile"><b style="color:${waiting?"var(--warn)":"var(--ok)"}">${savedUser()?waiting:"—"}</b><span>${savedUser()?"waiting to sync":"sign in to back up"}</span></div>${away?`<div class="tile"><b>${away}</b><span>in your account, not on this device yet</span></div>`:""}`;
  all.forEach(d=>{if(d.cat==="Contract / letter")d.cat="Contract letter";});
  const cats=DOC_CATS.filter(c=>all.some(d=>d.cat===c));if(docCat&&!cats.includes(docCat))docCat="";
  $("docCat").innerHTML=`<button type="button" data-c="" aria-pressed="${!docCat}">All</button>`+cats.map(c=>`<button type="button" data-c="${esc(c)}" aria-pressed="${docCat===c}">${esc(c)}</button>`).join("");
  const q=$("docQ").value.trim().toLowerCase();
  const shipName=d=>{const c=d.ship&&S.contracts.find(x=>x.id===d.ship);return c?c.vessel:"";};
  const list=all.filter(d=>(!docCat||d.cat===docCat)&&(!q||(d.name+" "+d.cat+" "+(d.notes||"")+" "+shipName(d)).toLowerCase().includes(q))).sort((a,b)=>DOC_CATS.indexOf(a.cat)-DOC_CATS.indexOf(b.cat)||String(a.name).localeCompare(String(b.name)));
  if(!all.length){$("docList").innerHTML='<div class="card empty" style="grid-column:1/-1">No documents yet. Tap <b>+ Add document</b> to take a photo or choose a scan or PDF.</div>';renderDocBadge();return;}
  if(!list.length){$("docList").innerHTML='<div class="card empty" style="grid-column:1/-1">No documents match.</div>';return;}
  $("docList").classList.toggle("selecting",SELECTING);
  $("docList").innerHTML=list.map(d=>{const here=LOCAL.has(d.id),cert=d.cert&&(S.certs||[]).find(c=>c.id===d.cert),xs=cert?docExp(cert):null,cs=!here?["away","In account · download on Sync"]:d.chunks?["ok","✓ In your account"]:savedUser()?["wait","Waiting to sync"]:["away","On this device only"];
    return `<div class="doc ${xs?xs.k:""} ${PICKED.has(d.id)?"picked":""}" data-id="${esc(d.id)}"><span class="pick" aria-hidden="true">✓</span><button type="button" class="thumb" data-open aria-label="Open ${esc(d.name)}"><span class="ph">${here?"…":"Not on this device yet"}</span></button>
    <div class="db"><div class="dn">${esc(d.name)}</div><div class="dm"><span class="ftype">${d.type==="application/pdf"?"PDF":"JPG"}</span><span>${esc(d.cat||"Other")}</span><span>${mb(d.size||0)}</span>${d.pages>1?`<span>${d.pages} pages</span>`:""}</div>
    ${cert?`<div class="dm">Linked: ${esc(cert.name)}</div>`:""}${shipName(d)?`<div class="dm">🚢 ${esc(shipName(d))}${d.month?" · "+monthLbl(d.month):""}</div>`:""}${xs?`<div class="dm"><span class="xs ${xs.k}">${xs.t}</span></div>`:""}${d.notes?`<div class="dm">${esc(d.notes)}</div>`:""}
    <div class="dm"><span class="cs ${cs[0]}">${cs[1]}</span></div>
    <div class="row-act">${here?'<button type="button" class="btn-sm btn-primary" data-open>View</button><button type="button" class="btn-sm" data-share>Share</button><button type="button" class="btn-sm" data-save>Save</button>':""}<button type="button" class="btn-sm" data-dedit>Edit</button><button type="button" class="btn-sm btn-danger" data-ddel>Delete</button></div></div></div>`;}).join("");
  renderDocBadge();renderSelBar();renderLinkBtn();$("docShrink").hidden=!all.some(d=>!d.cz&&LOCAL.has(d.id));
  for(const d of list){if(!LOCAL.has(d.id))continue;const t=await thumbFor(d);const el=$("docList").querySelector(`.doc[data-id="${CSS.escape(d.id)}"] .thumb`);if(el)el.innerHTML=t?`<img src="${t}" alt="">`:'<span class="ph">PDF</span>';}
}
$("docCat").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;docCat=b.dataset.c;renderDocs();});
$("docQ").addEventListener("input",renderDocs);
function fileName(d){const ext=d.type==="application/pdf"?".pdf":".jpg";return (String(d.name).normalize("NFKD").replace(/[\u2010-\u2015]/g,"-").replace(/[^\x20-\x7E]/g,"").replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim()||"document")+ext;}
async function docFile(d){const b=await blobGet(d.id);if(!b)throw new Error("missing");return new File([b],fileName(d),{type:d.type});}
async function shareDoc(d){
  let f;try{f=await docFile(d);}catch(e){toast("This file isn't on this device yet. Press Sync while online.");return;}
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:d.name});}catch(e){if(!(e&&e.name==="AbortError"))saveDoc(d,f);}return;}
  saveDoc(d,f,true);
}
async function saveDoc(d,f,fromShare){
  try{f=f||await docFile(d);}catch(e){toast("This file isn't on this device yet. Press Sync while online.");return;}
  const url=URL.createObjectURL(f),a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);
  toast(fromShare?`This browser can't share files directly, so ${f.name} was saved. Attach it in WhatsApp or your email.`:`Saved: ${f.name}`,6000);
}
let VIEWING=null,VLIST=[],VIDX=0;
function shownDocs(){return [...$("docList").querySelectorAll(".doc")].map(c=>(S.docs||[]).find(x=>x.id===c.dataset.id)).filter(d=>d&&LOCAL.has(d.id));}
function viewList(list,d){VLIST=list.length?list:[d];VIDX=Math.max(0,VLIST.indexOf(d));openDoc(VLIST[VIDX],true);}
function stepView(n){if(VLIST.length<2)return;VIDX=(VIDX+n+VLIST.length)%VLIST.length;openDoc(VLIST[VIDX],true);}
$("dvPrev").addEventListener("click",()=>stepView(-1));$("dvNext").addEventListener("click",()=>stepView(1));
document.addEventListener("keydown",e=>{if($("docViewer").hidden)return;if(e.key==="ArrowLeft")stepView(-1);if(e.key==="ArrowRight")stepView(1);});
let tx0=null;$("dvBody").addEventListener("touchstart",e=>{tx0=e.touches.length===1?e.touches[0].clientX:null;},{passive:true});
$("dvBody").addEventListener("touchend",e=>{if(tx0==null)return;const dx=e.changedTouches[0].clientX-tx0;tx0=null;if(Math.abs(dx)>70&&$("dvBody").scrollWidth<=$("dvBody").clientWidth+4)stepView(dx<0?1:-1);},{passive:true});
$("docViewAll").addEventListener("click",()=>{const l=shownDocs();if(!l.length){toast("No documents on this device to view yet. Press Sync while online.");return;}viewList(l,l[0]);});
async function openDoc(d,inList){if(!inList){VLIST=[d];VIDX=0;}
  const b=await blobGet(d.id);if(!b){toast("This file isn't on this device yet. Press Sync while online.");return;}
  $("dvBody").querySelectorAll("img").forEach(i=>URL.revokeObjectURL(i.src));
  VIEWING=d;$("dvTitle").textContent=d.name;const many=VLIST.length>1;$("dvPrev").hidden=$("dvNext").hidden=!many;$("dvCount").textContent=many?`${VIDX+1} / ${VLIST.length}`:"";$("dvBody").innerHTML='<div class="empty" style="color:#fff">Opening…</div>';$("docViewer").hidden=false;document.body.style.overflow="hidden";$("dvClose").focus();
  if(d.type!=="application/pdf"){const u=URL.createObjectURL(b);$("dvBody").innerHTML=`<img src="${u}" alt="${esc(d.name)}">`;return;}
  try{if(!window.pdfjsLib){await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";}
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise,wrap=document.createElement("div");wrap.className="pg";$("dvBody").innerHTML="";$("dvBody").appendChild(wrap);
    const W=Math.min(900,$("dvBody").clientWidth-20)*(devicePixelRatio||1);
    for(let i=1;i<=pdf.numPages&&VIEWING===d;i++){const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:W/v0.width}),cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;wrap.appendChild(cv);await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;}
  }catch(e){$("dvBody").innerHTML='<div class="empty" style="color:#fff">Couldn\'t show this PDF here. Use Save to device to open it.</div>';}
}
function closeViewer(){$("docViewer").hidden=true;document.body.style.overflow="";$("dvBody").querySelectorAll("img").forEach(i=>URL.revokeObjectURL(i.src));$("dvBody").innerHTML="";VIEWING=null;}
$("dvClose").addEventListener("click",closeViewer);$("dvShare").addEventListener("click",()=>VIEWING&&shareDoc(VIEWING));$("dvSave").addEventListener("click",()=>VIEWING&&saveDoc(VIEWING));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("docViewer").hidden)closeViewer();});
let pendingDDel=null;
$("docList").addEventListener("click",async e=>{const card=e.target.closest(".doc");if(!card)return;const d=(S.docs||[]).find(x=>x.id===card.dataset.id);if(!d)return;
  if(SELECTING){e.preventDefault();if(!LOCAL.has(d.id)){toast("This file isn't on this device yet. Press Sync while online.");return;}PICKED.has(d.id)?PICKED.delete(d.id):PICKED.add(d.id);card.classList.toggle("picked",PICKED.has(d.id));renderSelBar();return;}
  if(e.target.closest("[data-open]")){viewList(shownDocs(),d);return;}
  if(e.target.closest("[data-share]")){shareDoc(d);return;}
  if(e.target.closest("[data-save]")){saveDoc(d);return;}
  if(e.target.closest("[data-dedit]")){openDocForm(d);return;}
  const b=e.target.closest("[data-ddel]");if(b){if(pendingDDel!==d.id){pendingDDel=d.id;b.textContent="Tap again to delete";setTimeout(()=>{if(pendingDDel===d.id){pendingDDel=null;b.textContent="Delete";}},4000);return;}
    pendingDDel=null;S.docs=S.docs.filter(x=>x.id!==d.id);(S.deleted=S.deleted||[]).push({id:d.id,u:Date.now(),n:d.chunks||0});try{await blobDel(d.id);}catch(err){}if(THUMBS[d.id]&&THUMBS[d.id].startsWith("blob:"))URL.revokeObjectURL(THUMBS[d.id]);delete THUMBS[d.id];
    saveLocal();render();renderDocs();toast(d.chunks?"Document deleted. It will be removed from your account on the next Sync.":"Document deleted");}});
function b64(buf){let s="";const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);}
function unb64(s){const bin=atob(s),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a;}
/* during Sync: send new files, remove deleted ones */
async function docsUpload(f,u){
  await migrateDocs();
  const col=f.db.collection("users").doc(u.uid).collection("files");let failed=0;
  for(const d of (S.docs||[])){if(d.chunks||!d.enc)continue;const b=await rawGet(d.id);if(!b)continue;
    try{const buf=await b.arrayBuffer(),n=Math.max(1,Math.ceil(buf.byteLength/CHUNK));
      for(let i=0;i<n;i++)await col.doc(d.id+"_"+i).set({d:b64(buf.slice(i*CHUNK,(i+1)*CHUNK)),i,n,e:true});
      d.chunks=n;}catch(e){failed++;}}
  const done=new Set(lsJSON("sdlDocPurged",[]));
  for(const t of (S.deleted||[])){if(!String(t.id).startsWith("doc-")||!t.n||done.has(t.id))continue;
    try{for(let i=0;i<t.n;i++)await col.doc(t.id+"_"+i).delete();done.add(t.id);}catch(e){}}
  lsSet("sdlDocPurged",JSON.stringify([...done]));
  if(failed)return failed===1?"one document":failed+" documents";return "";
}
/* during Sync: fetch files added on other devices; tidy files deleted elsewhere */
async function docsDownload(f,u){
  await refreshLocal();const col=f.db.collection("users").doc(u.uid).collection("files"),ids=new Set((S.docs||[]).map(d=>d.id));let failed=0;
  for(const k of LOCAL){if(!ids.has(k)){try{await blobDel(k);}catch(e){}}}
  for(const d of (S.docs||[])){if(LOCAL.has(d.id)||!d.chunks)continue;
    try{const parts=[];for(let i=0;i<d.chunks;i++){const sn=await col.doc(d.id+"_"+i).get();if(!sn.exists)throw new Error("part");parts.push(unb64(sn.data().d));}
      await rawPut(d.id,new Blob(parts,{type:d.enc?"application/octet-stream":d.type}));LOCAL.add(d.id);}catch(e){failed++;}}
  await migrateDocs();
  if(VIEW==="docs")renderDocs();
  return failed?(failed===1?"one document":failed+" documents"):"";
}




/* ======================= documents for each ship ======================= */
const SHIPOPEN=new Set();
function shipDocs(c){return (S.docs||[]).filter(d=>d.ship===c.id);}
function shipDocSummary(c){const l=shipDocs(c),n=k=>l.filter(d=>d.cat===k).length,a=n("Contract letter"),b=n("Salary slip"),o=l.length-a-b;
  return "📎 "+[a?a+" contract"+(a>1?"s":""):"",b?b+" salary slip"+(b>1?"s":""):"",o?o+" other":""].filter(Boolean).join(" · ");}
function shipMonths(c){const s=dn(c.on),e=c.off?dn(c.off):TODAY;if(s==null)return [];const out=[];let d=new Date(s*DAY);d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1));
  while(d.getTime()/DAY<=e&&out.length<60){out.push(d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1));d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));}return out;}
function nextSlipMonth(c){const have=new Set(shipDocs(c).filter(d=>d.cat==="Salary slip").map(d=>d.month)),ms=shipMonths(c);return ms.find(m=>!have.has(m))||ms[ms.length-1]||"";}
function shipDocsHtml(c){
  const l=shipDocs(c),grp=(t,list)=>list.length?`<div class="sd-group"><h4>${t} (${list.length})</h4><div class="sd-items">${list.map(d=>`<div class="sd-item" data-doc="${esc(d.id)}"><span class="nm" title="${esc(d.name)}">${esc(d.name)}</span><span class="sz">${mb(d.size||0)}</span><button type="button" class="btn-sm btn-primary" data-sview>View</button><button type="button" class="btn-sm" data-sshare>Share</button></div>`).join("")}</div></div>`:"";
  const slips=l.filter(d=>d.cat==="Salary slip").sort((a,b)=>String(a.month||"").localeCompare(String(b.month||""))),ms=shipMonths(c),missing=ms.filter(m=>!slips.some(d=>d.month===m));
  return `<div class="shipdocs"><div class="sd-head"><b>Documents for ${esc(c.vessel)}</b><span class="sp" style="flex:1"></span>
    <button type="button" class="btn-sm" data-sadd="Contract letter">+ Contract letter</button><button type="button" class="btn-sm" data-sadd="Salary slip">+ Salary slip</button><button type="button" class="btn-sm" data-sadd="Other">+ Other document</button>${l.length?'<button type="button" class="btn-sm" data-sall>Share all</button>':""}</div>
    ${l.length?"":'<div class="small muted">No documents for this ship yet. Add the contract letter, salary slips, or anything else for this contract.</div>'}
    ${grp("Contract letter",l.filter(d=>d.cat==="Contract letter"))}${grp("Salary slips",slips)}${grp("Other",l.filter(d=>!SHIPCATS.includes(d.cat)))}
    ${slips.length&&missing.length?`<div class="small muted">Salary slips not added yet: ${missing.slice(0,6).map(monthLbl).join(", ")}${missing.length>6?` and ${missing.length-6} more`:""}</div>`:""}<div class="sd-form"></div></div>`;}
async function filesOfDocs(list){await refreshLocal();const out=[];for(const d of list){if(!LOCAL.has(d.id))continue;try{out.push(await docFile(d));}catch(e){}}return out;}
async function shareFiles(files,title){if(!files.length){toast("These files aren't on this device yet. Press Sync while online.");return;}
  if(navigator.canShare&&navigator.canShare({files})){try{await navigator.share({files,title});}catch(e){if(!(e&&e.name==="AbortError"))saveFiles(files);}return;}saveFiles(files,true);}
$("ctable").addEventListener("click",async e=>{
  const t=e.target.closest("[data-sdocs]");if(t){const id=t.dataset.sdocs;SHIPOPEN.has(id)?SHIPOPEN.delete(id):SHIPOPEN.add(id);formBackHome();$("docFormCard").hidden=true;renderShips();return;}
  const panel=e.target.closest("tr.docpanel");if(!panel)return;const c=S.contracts.find(x=>x.id===panel.dataset.for);if(!c)return;
  const add=e.target.closest("[data-sadd]");if(add){SHIPATTACH={ship:c.id,cat:add.dataset.sadd};$("shipFile").click();return;}
  if(e.target.closest("[data-sall]")){shareFiles(await filesOfDocs(shipDocs(c)),"Documents – "+c.vessel);return;}
  const it=e.target.closest(".sd-item");if(!it)return;const d=(S.docs||[]).find(x=>x.id===it.dataset.doc);if(!d)return;
  if(e.target.closest("[data-sview]")){await refreshLocal();viewList(shipDocs(c).filter(x=>LOCAL.has(x.id)),d);return;}
  if(e.target.closest("[data-sshare]")){shareDoc(d);return;}
});
$("shipFile").addEventListener("change",()=>{const files=[...$("shipFile").files];$("shipFile").value="";if(!files.length||!SHIPATTACH)return;const a=SHIPATTACH,c=S.contracts.find(x=>x.id===a.ship);if(!c)return;
  const slot=$("ctable").querySelector(`tr.docpanel[data-for="${CSS.escape(c.id)}"] .sd-form`);if(slot)slot.appendChild($("docFormCard"));SHIPATTACH=a;
  const base=files[0].name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();
  startDocAdd(files,{ship:c.id,cat:a.cat,month:a.cat==="Salary slip"?nextSlipMonth(c):"",name:a.cat==="Contract letter"?"Contract letter – "+c.vessel:a.cat==="Other"?base+" – "+c.vessel:""});});

/* ---------- compress documents added before compression was stronger ---------- */
async function shrinkAll(btn){
  await refreshLocal();const list=(S.docs||[]).filter(d=>LOCAL.has(d.id)&&!d.cz);if(!list.length){toast("All documents are already compressed.");renderDocs();return;}
  btn.disabled=true;let b0=0,b1=0,changed=0,i=0;const now=Date.now();
  try{for(const d of list){i++;btn.textContent=`Compressing ${i} of ${list.length}…`;
      let plain;try{plain=await blobGet(d.id);}catch(e){continue;}if(!plain)continue;const f=new File([plain],fileName(d),{type:d.type});let nb=null;
      try{if(d.type==="application/pdf"){const c=await compressPdf(f);if(!c.kept)nb=c.blob;d.pages=c.pages;}else{const c=await imgToJpeg(f,IMG_MAX);if(!c.kept&&c.blob.size<f.size*.9)nb=c.blob;}}catch(e){}
      b0+=f.size;
      if(nb){const nid="doc-"+uid();await blobPut(nid,nb);await blobDel(d.id);(S.deleted=S.deleted||[]).push({id:d.id,u:now,n:d.chunks||0});if(THUMBS[d.id])delete THUMBS[d.id];
        d.id=nid;d.size=nb.size;d.chunks=0;d.type=d.type==="application/pdf"?"application/pdf":"image/jpeg";changed++;b1+=nb.size;}else b1+=f.size;
      d.cz=1;d.u=now;}
    saveLocal();render();renderDocs();
    toast(changed?`${changed} document${changed===1?"":"s"} compressed: ${mb(b0)} → ${mb(b1)}. Press Sync to replace the copies in your account.`:"Your documents were already as small as they can be without losing quality.",8000);
  }finally{btn.disabled=false;btn.textContent="Compress my documents";}
}
$("docShrink").addEventListener("click",e=>shrinkAll(e.currentTarget));

/* ---------- link documents you already have ---------- */
function linkCandidates(){return (S.example?[]:(S.docs||[])).filter(d=>!d.cert||!(S.certs||[]).some(c=>c.id===d.cert)).map(d=>({d,c:suggestCert(d.name,d.cat)}));}
function renderLinkBtn(){const l=linkCandidates(),n=l.filter(x=>x.c).length;$("docLinkBtn").hidden=!l.length||!(S.certs||[]).length;$("docLinkBtn").textContent=n?`Link to certificates (${n} suggested)`:"Link to certificates";}
function renderLinkCard(){const l=linkCandidates();
  if(!l.length){$("linkCard").innerHTML=`<div class="card-h"><h2>Link to certificates</h2><button type="button" class="btn-ghost btn-sm" data-lclose>Close</button></div><div class="card-b small muted">All your documents are linked.</div>`;return;}
  $("linkCard").innerHTML=`<div class="card-h"><h2>Link to certificates</h2><button type="button" class="btn-ghost btn-sm" data-lclose>Close</button></div>
   <div class="card-b small muted" style="padding-bottom:6px">Ticked rows have a suggested certificate. Check each one, change it if needed, then tap Link.</div>
   ${l.map(({d,c})=>`<div class="link-row" data-id="${esc(d.id)}"><input type="checkbox" ${c?"checked":""} aria-label="Link ${esc(d.name)}"><div><div class="nm">${esc(d.name)}</div><div class="small muted">${esc(d.cat||"Other")}</div></div><select aria-label="Certificate for ${esc(d.name)}">${docCertOpts(c?c.id:"")}</select></div>`).join("")}
   <div class="card-b actions" style="border-top:1px solid var(--line)"><button type="button" class="btn-primary" data-ldo>Link ticked documents</button><button type="button" class="btn-ghost" data-lclose>Cancel</button></div>`;}
$("docLinkBtn").addEventListener("click",()=>{renderLinkCard();$("linkCard").hidden=false;$("linkCard").scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});});
$("linkCard").addEventListener("change",e=>{if(e.target.tagName==="SELECT"){const cb=e.target.closest(".link-row").querySelector("input");cb.checked=!!e.target.value;}});
$("linkCard").addEventListener("click",e=>{if(e.target.closest("[data-lclose]")){$("linkCard").hidden=true;return;}
  if(e.target.closest("[data-ldo]")){let n=0;$("linkCard").querySelectorAll(".link-row").forEach(row=>{const cb=row.querySelector("input"),sel=row.querySelector("select");if(!cb.checked||!sel.value)return;const d=S.docs.find(x=>x.id===row.dataset.id);if(d){d.cert=sel.value;d.u=Date.now();n++;}});
    if(n){saveLocal();render();renderDocs();}$("linkCard").hidden=true;toast(n?`${n} document${n===1?"":"s"} linked. Open Certificates to see them.`:"Nothing was ticked.",5000);}});

/* expiry of the linked certificate, shown on the document card */
function docExp(c){if(!c||!c.expires)return null;const e=dn(c.expires),n=e-TODAY;
  if(n<0)return {k:"expired",t:"Expired "+fmt(e)};if(n<=183)return {k:"soon",t:"Expires "+fmt(e)+" · "+relDays(e)};return {k:"valid",t:"Valid until "+fmt(e)};}
/* choose several documents and share or save them together */
let SELECTING=false;const PICKED=new Set();
function renderSelBar(){const n=PICKED.size,all=(S.docs||[]).length;$("docSelBar").hidden=!all||S.example;$("docSelBar").classList.toggle("on",SELECTING);
  $("docSelToggle").textContent=SELECTING?"Done":"Select several";["docSelAll","docSelShare","docSelSave"].forEach(id=>$(id).hidden=!SELECTING);
  $("docSelShare").disabled=$("docSelSave").disabled=!n;$("docSelShare").textContent=n?`Share ${n}`:"Share";$("docSelSave").textContent=n?`Save ${n}`:"Save";
  const size=[...PICKED].reduce((a,id)=>{const d=S.docs.find(x=>x.id===id);return a+(d?d.size||0:0);},0);
  $("docSelInfo").textContent=SELECTING?(n?`${n} selected · ${mb(size)}`:"Tap documents to select them"):"";}
$("docSelToggle").addEventListener("click",()=>{SELECTING=!SELECTING;PICKED.clear();renderDocs();});
$("docSelAll").addEventListener("click",()=>{const cards=[...$("docList").querySelectorAll(".doc")].map(c=>c.dataset.id).filter(id=>LOCAL.has(id));const allOn=cards.every(id=>PICKED.has(id));cards.forEach(id=>allOn?PICKED.delete(id):PICKED.add(id));renderDocs();});
async function pickedFiles(){const out=[];for(const id of PICKED){const d=S.docs.find(x=>x.id===id);if(!d)continue;try{out.push(await docFile(d));}catch(e){}}
  const seen={};out.forEach((f,i)=>{const k=f.name.toLowerCase();if(seen[k]){const n=++seen[k];out[i]=new File([f],f.name.replace(/(\.[^.]+)$/,` (${n})$1`),{type:f.type});}else seen[k]=1;});return out;}
async function saveFiles(files,fromShare){for(const f of files){const url=URL.createObjectURL(f),a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);await new Promise(r=>setTimeout(r,350));}
  toast(fromShare?`This browser can't share files directly, so ${files.length} file${files.length===1?" was":"s were"} saved. Attach them in WhatsApp or your email.`:`${files.length} file${files.length===1?"":"s"} saved.`,6000);}
$("docSelShare").addEventListener("click",async()=>{const files=await pickedFiles();if(!files.length)return;
  if(navigator.canShare&&navigator.canShare({files})){try{await navigator.share({files,title:files.length+" documents"});}catch(e){if(!(e&&e.name==="AbortError"))saveFiles(files);}return;}
  saveFiles(files,true);});
$("docSelSave").addEventListener("click",async()=>{const files=await pickedFiles();if(files.length)saveFiles(files);});
/* storage used: the cloud copy is about a third bigger than the file itself */
/* the owner account can use the whole free space (kept a little under 1 GB for the ledger and notices); other accounts get a fair share */
const OWNER_SPACE=900*1048576,USER_SPACE=50*1048576;
function docLimit(){const u=fbUser||savedUser();return u&&u.email&&u.email.toLowerCase()===ADMIN_EMAIL?OWNER_SPACE:USER_SPACE;}
function storageInfo(){const docs=S.example?[]:(S.docs||[]),file=docs.reduce((a,d)=>a+(d.size||0),0),cloud=docs.filter(d=>d.chunks).reduce((a,d)=>a+Math.ceil((d.size||0)*4/3)+200*(d.chunks||1),0),pend=docs.filter(d=>!d.chunks).reduce((a,d)=>a+Math.ceil((d.size||0)*4/3),0);return {n:docs.length,file,cloud,pend,used:cloud+pend};}
function renderStorage(){const s=storageInfo(),pct=Math.min(100,s.used/docLimit()*100),col=pct>=90?"var(--bad)":pct>=70?"var(--warn)":"var(--ok)";
  $("storeCard").innerHTML=`<h2 style="margin-bottom:4px">Document storage</h2><p class="small muted">${docLimit()===OWNER_SPACE?"Your account can use the whole free document space.":`Each account can keep up to ${mb(docLimit())} of documents in the cloud, so the free space is shared fairly between all seafarers using the app.`}</p>
   <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="${docLimit()}" aria-valuenow="${s.used}" aria-label="Document storage used"><i style="width:${Math.max(pct,s.used?2:0)}%;background:${col}"></i></div>
   <div class="small"><b>${mb(s.used)}</b> of ${mb(docLimit())} used · ${s.n} document${s.n===1?"":"s"}${s.pend?` · ${mb(s.pend)} waiting to sync`:""}</div>
   ${pct>=90?'<p class="small" style="color:var(--bad);margin-top:6px">Almost full. Delete old or replaced documents to make room.</p>':""}<p class="small muted" style="margin-top:6px">On this device: ${mb(s.file)}. Photos are made smaller when you add them.</p><div style="margin-top:8px"><a class="btn btn-sm" href="#docs">Open My documents</a></div>`;}

/* ======================= report for your CA (PDF) ======================= */
function fyDocs(f){const s0=fyStart(f),e0=fyEnd(f);return (S.docs||[]).filter(d=>{if(!d.ship)return false;const c=S.contracts.find(x=>x.id===d.ship);if(!c)return false;
  if(d.cat==="Salary slip"&&/^\d{4}-\d{2}$/.test(d.month||"")){const m=dn(d.month+"-01");return m>=s0&&m<=e0;}return shipDaysIn(c,f)>0;})
  .sort((a,b)=>String(a.cat).localeCompare(String(b.cat))||String(a.month||"").localeCompare(String(b.month||"")));}
async function makeReport(f,asFile){
  try{
    if(!window.jspdf)await loadScript("vendor/jspdf.umd.min.js");
    const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"}),r=C.res[f],W=210,M=16;let y=18;
    const line=(t,size,style,col)=>{doc.setFont("helvetica",style||"normal");doc.setFontSize(size||10);doc.setTextColor(...(col||[20,32,50]));const parts=doc.splitTextToSize(String(t),W-2*M);parts.forEach(p=>{if(y>282){doc.addPage();y=18;}doc.text(p,M,y);y+=size?size*0.45+1.5:6;});};
    const yearLbl=f>=2026?`Tax year ${fyLabel(f)}`:`Financial year ${fyLabel(f)} (assessment year ${f+1}-${String((f+2)%100).padStart(2,"0")})`;
    doc.setFillColor(6,24,42);doc.rect(0,0,W,30,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("Residential status summary",M,14);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.text(`${yearLbl} · 1 Apr ${f} to 31 Mar ${f+1}`,M,22);y=40;
    if(S.settings.reportName)line("Seafarer: "+S.settings.reportName,11,"bold");
    const p=fyPassIssues(f),stName={NR:"Non-resident (NRI)",RNOR:"Resident but not ordinarily resident (RNOR)",ROR:"Resident and ordinarily resident (ROR)"}[r.status]||"Not enough data";
    const rows=[["Days in the year",String(r.days)],["Days outside India",String(r.outside)],["Days in India",String(r.india)],["Days outside India needed to stay NRI",`${r.need} (182+ days in India makes you resident)`],["Residential status",stName]];
    doc.setFontSize(10);rows.forEach(([k,v],i)=>{if(i%2===0){doc.setFillColor(237,242,246);doc.rect(M,y-4.5,W-2*M,7,"F");}doc.setFont("helvetica","normal");doc.setTextColor(80,95,110);doc.text(k,M+2,y);doc.setFont("helvetica","bold");doc.setTextColor(20,32,50);doc.text(v,M+92,y);y+=7;});
    y+=3;
    line(p.missing||p.estimated?`Basis: passport dates where entered; ${p.missing?p.missing+" contract(s) without passport dates were counted from CDC dates":""}${p.missing&&p.estimated?"; ":""}${p.estimated?p.estimated+" contract(s) use estimated passport dates":""}.`:"Basis: days outside India counted from passport exit and entry dates.",9,"normal",[80,95,110]);
    const o=S.fy[f]||{};if(o.inc15||o.abroadTax||o.leftEmp)line(`Also noted: ${[o.inc15?"Indian income (excluding foreign income) above Rs 15 lakh":"",o.abroadTax?"tax resident of another country":"",o.leftEmp?"first year leaving India for employment":""].filter(Boolean).join("; ")}.`,9,"normal",[80,95,110]);
    y+=3;line("Contracts in this year",12,"bold");y+=1;
    const cs=S.contracts.filter(c=>shipDaysIn(c,f)).sort((a,b)=>(dn(a.on)||0)-(dn(b.on)||0));
    const cols=[["Vessel / rank",M,46],["CDC sign-on",M+48,28],["CDC sign-off",M+78,28],["Left India",M+108,24],["Arrived India",M+134,24],["Days",M+160,18]];
    doc.setFillColor(6,24,42);doc.rect(M,y-4.5,W-2*M,7,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(8.5);cols.forEach(([t,x])=>doc.text(t,x+1,y));y+=7;
    doc.setFont("helvetica","normal");
    cs.forEach((c,i)=>{if(y>270){doc.addPage();y=18;}const ch=chainOf(c),est=c.passEst||{};
      const cell=[[c.vessel+(c.imo?" ("+c.imo+")":""),c.rank||""],[fmt(dn(c.on)),ch.prev?"Onboard – promoted":(c.onIndia?"Indian port":"Abroad")+(c.onPort?", "+c.onPort:"")],[c.off?fmt(dn(c.off)):"onboard",c.off?(ch.next?"Onboard – promoted":(c.offIndia?"Indian port":"Abroad")+(c.offPort?", "+c.offPort:"")):""],[ch.prev?"same stay":c.left?fmt(dn(c.left)):"not entered",est.left&&!ch.prev?"estimated":""],[ch.next?"stay continues":c.arr?fmt(dn(c.arr)):"not entered",est.arr&&!ch.next?"estimated":""],[String(shipDaysIn(c,f)),"on ship"]];
      if(i%2===0){doc.setFillColor(237,242,246);doc.rect(M,y-4.2,W-2*M,10,"F");}
      cell.forEach(([a,b],j)=>{const x=cols[j][1]+1,w=cols[j][2]-1;doc.setTextColor(20,32,50);doc.setFontSize(8.5);doc.text(doc.splitTextToSize(a,w)[0],x,y);doc.setTextColor(100,115,130);doc.setFontSize(7.5);if(b)doc.text(doc.splitTextToSize(b,w)[0],x,y+4);});y+=10;});
    if(!cs.length)line("No contracts in this year.",9);
    y+=4;line("How the days are counted",11,"bold");
    line("Days outside India are counted from passport exit and entry dates. For a voyage that starts or ends at an Indian port, the period from CDC sign-on to sign-off is excluded from the stay in India (Rule 126 of the Income-tax Rules, 1962, and Rule 8 of the Income-tax Rules, 2026). An Indian citizen leaving India for employment, or as a member of the crew of an Indian ship, is resident only if in India for 182 days or more in the year.",8.5,"normal",[80,95,110]);
    y+=3;line(`Prepared with Sea Days Ledger by BlueWave Algo on ${fmt(TODAY)}. Figures are calculated from the dates entered by the seafarer; please verify them against the passport and CDC. This summary is not tax advice.`,8,"italic",[110,120,130]);
    const name=`Sea-Days-${fyLabel(f)}-residential-status.pdf`,blob=doc.output("blob"),file=new File([blob],name,{type:"application/pdf"});
    if(asFile)return file;
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:`Residential status FY ${fyLabel(f)}`});return;}catch(e){if(e&&e.name==="AbortError")return;}}
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast("Report saved: "+name,4000);
  }catch(e){toast(navigator.onLine===false&&!window.jspdf?"The report maker needs internet the first time. Connect once and try again.":"Couldn't make the report. Please try again.",5000);}
}
$("fyList").addEventListener("click",async e=>{const b=e.target.closest("[data-report]");if(b)makeReport(+b.dataset.report);
  const y=e.target.closest("[data-fydocs]");if(y){const f=+y.dataset.fydocs;y.disabled=true;const lbl=y.textContent;y.textContent="Preparing…";
    try{const files=await filesOfDocs(fyDocs(f)),rep=await makeReport(f,true);if(rep)files.unshift(rep);await shareFiles(files,`FY ${fyLabel(f)} documents`);}finally{y.disabled=false;y.textContent=lbl;}}});

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

/* ======================= privacy: lock screen and encryption ======================= */
/* One random master key encrypts the ledger and every document. It is stored only in wrapped (encrypted) form:
   by the passphrase and by the recovery key in the account (so a new device can be set up), and by the PIN
   (or Face ID / fingerprint, where the browser supports it) on each device. Nothing readable leaves the device. */
const PRIVATE=true;
const TE=new TextEncoder(),TD=new TextDecoder(),rnd=n=>crypto.getRandomValues(new Uint8Array(n));
const ITER_P=600000,ITER_R=300000,ITER_PIN=400000,PRF_SALT=TE.encode("sea-days-ledger/unlock/v1");
let MK=null,MKraw=null,VAULT=lsJSON("sdlVault",null),DEV=lsJSON("sdlDevLock",null)||{},UNLOCKED=false;
async function kdf(secret,salt,iter){const base=await crypto.subtle.importKey("raw",TE.encode(secret),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);}
async function aesEnc(key,data){const iv=rnd(12),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data)),o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o;}
async function aesDec(key,data){data=new Uint8Array(data);return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:data.slice(0,12)},key,data.slice(12)));}
async function setMK(raw){MKraw=new Uint8Array(raw);MK=await crypto.subtle.importKey("raw",MKraw,"AES-GCM",false,["encrypt","decrypt"]);}
async function wrapMK(secret,iter){const salt=rnd(16);return {s:b64(salt),i:iter,w:b64(await aesEnc(await kdf(secret,salt,iter),MKraw))};}
async function unwrapMK(secret,w){return aesDec(await kdf(secret,unb64(w.s),w.i),unb64(w.w));}
const encJSON=async o=>b64(await aesEnc(MK,TE.encode(JSON.stringify(o)))),decJSON=async t=>JSON.parse(TD.decode(await aesDec(MK,unb64(t))));
const saveVault=()=>lsSet("sdlVault",JSON.stringify(VAULT)),saveDev=()=>lsSet("sdlDevLock",JSON.stringify(DEV));
const B32="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newRecovery(){let bits=0,val=0,out="";for(const x of rnd(20)){val=((val<<8)|x)&0xffff;bits+=8;while(bits>=5){out+=B32[(val>>>(bits-5))&31];bits-=5;}}return out.match(/.{4}/g).join("-");}
const rkNorm=t=>String(t||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const looksLikeRK=t=>rkNorm(t).length===32&&/^[A-HJ-NP-Z2-9]+$/.test(rkNorm(t));

/* ---------- Face ID / fingerprint (only where the key itself can be protected by it) ---------- */
async function bioAvailable(){try{return !!(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());}catch(e){return false;}}
async function bioSecret(rawId){const a=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:"public-key",id:rawId}],userVerification:"required",timeout:60000,extensions:{prf:{eval:{first:PRF_SALT}}}}});
  const e=a.getClientExtensionResults&&a.getClientExtensionResults(),o=e&&e.prf&&e.prf.results&&e.prf.results.first;if(!o)throw Object.assign(new Error("noprf"),{code:"noprf"});
  return crypto.subtle.importKey("raw",await crypto.subtle.digest("SHA-256",o),"AES-GCM",false,["encrypt","decrypt"]);}
async function bioEnable(){
  const u=savedUser()||{},cred=await navigator.credentials.create({publicKey:{rp:{name:"Sea Days Ledger"},user:{id:rnd(16),name:u.email||"Sea Days Ledger",displayName:"Sea Days Ledger"},challenge:rnd(32),
    pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"required"},timeout:60000,extensions:{prf:{eval:{first:PRF_SALT}}}}});
  const ext=cred.getClientExtensionResults&&cred.getClientExtensionResults();if(!ext||!ext.prf||ext.prf.enabled===false)throw Object.assign(new Error("noprf"),{code:"noprf"});
  let key;const o=ext.prf.results&&ext.prf.results.first;
  if(o)key=await crypto.subtle.importKey("raw",await crypto.subtle.digest("SHA-256",o),"AES-GCM",false,["encrypt","decrypt"]);else key=await bioSecret(cred.rawId);
  DEV.bio={id:b64(cred.rawId),w:b64(await aesEnc(key,MKraw))};saveDev();}
async function bioUnlock(){const key=await bioSecret(unb64(DEV.bio.id));await setMK(await aesDec(key,unb64(DEV.bio.w)));}
const bioMsg=e=>e&&e.code==="noprf"?"Face ID / fingerprint unlock isn't supported in this browser yet. Your PIN works as normal.":e&&e.name==="NotAllowedError"?"Face ID / fingerprint was cancelled.":"Face ID / fingerprint didn't work. Use your PIN.";

/* ---------- lock screen ---------- */
const LB=()=>$("lockBody");
function lockView(title,html,focus){$("lockTitle").textContent=title;LB().innerHTML=html;const f=focus&&LB().querySelector(focus);if(f)setTimeout(()=>f.focus(),60);}
function lockErr(m){const e=LB().querySelector(".err");if(e)e.textContent=m||"";}
function busy(btn,on,label){if(!btn)return;btn.disabled=on;if(on){btn.dataset.l=btn.textContent;btn.textContent=label||"Please wait…";}else if(btn.dataset.l)btn.textContent=btn.dataset.l;}
const dots=(n,of)=>`<div class="steps-dots" aria-hidden="true">${Array.from({length:of},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div>`;
const pinOk=p=>/^\d{6,12}$/.test(p);
function lockStart(){
  if(VAULT&&DEV.pin)return showUnlock();
  if(VAULT)return showPassUnlock("");
  return showFirst();
}
/* first time on this device: sign in with the owner account, then set up or restore the lock */
async function showFirst(msg){
  if(!navigator.onLine){lockView("Connect to the internet",`<p class="muted">This app is private. The first time on a new device you need to sign in, so connect to the internet once.</p><span class="err">${esc(msg||"")}</span><div class="lbtns"><button type="button" class="btn-primary" id="lkRetry">Try again</button></div>`,"#lkRetry");
    $("lkRetry").onclick=()=>showFirst();return;}
  lockView("Checking…",`<p class="muted">One moment.</p>`);
  let f;try{f=await fbReady();}catch(e){lockView("Can't reach the server",`<p class="muted">Check your connection and try again.</p><div class="lbtns"><button type="button" class="btn-primary" id="lkRetry">Try again</button></div>`,"#lkRetry");$("lkRetry").onclick=()=>showFirst();return;}
  const u=f.auth.currentUser;if(u)return ownerGate(f,u);
  lockView("Private app",`<p class="muted">Sign in with the owner account to open Sea Days Ledger on this device.</p>
    <form id="lkIn" novalidate><label class="f"><span>Email</span><input id="lkEm" type="email" autocomplete="username" inputmode="email"></label>
    <label class="f"><span>Password</span><input id="lkPw" type="password" autocomplete="current-password"></label><span class="err">${esc(msg||"")}</span>
    <div class="lbtns"><button type="submit" class="btn-primary">Sign in</button><button type="button" class="linky" id="lkReset">Forgot password?</button></div></form>`,"#lkEm");
  $("lkReset").onclick=async()=>{const em=$("lkEm").value.trim();if(!em){lockErr("Enter your email first.");return;}try{await f.auth.sendPasswordResetEmail(em);lockErr("Password reset email sent.");}catch(e){lockErr(authMsg(e));}};
  $("lkIn").onsubmit=async e=>{e.preventDefault();const b=e.submitter||$("lkIn").querySelector("button[type=submit]");busy(b,true,"Signing in…");
    try{const cr=await f.auth.signInWithEmailAndPassword($("lkEm").value.trim(),$("lkPw").value);fbUser=cr.user;rememberUser(cr.user);await ownerGate(f,cr.user);}catch(err){busy(b,false);lockErr(authMsg(err));}};
}
async function ownerGate(f,u){
  try{await u.reload();}catch(e){}u=f.auth.currentUser||u;
  if(String(u.email||"").toLowerCase()!==ADMIN_EMAIL){lockView("This app is private",`<p class="muted">${esc(u.email||"This account")} can't open this app.</p><div class="lbtns"><button type="button" class="btn-primary" id="lkOut">Sign out</button></div>`);
    $("lkOut").onclick=async()=>{try{await f.auth.signOut();}catch(e){}rememberUser(null);showFirst();};return;}
  if(!u.emailVerified){lockView("Verify your email",`<p class="muted">Open the link we emailed to ${esc(u.email)}, then tap Continue.</p><span class="err"></span><div class="lbtns"><button type="button" class="btn-primary" id="lkGo">Continue</button><button type="button" class="ghost" id="lkSend">Send the link again</button></div>`);
    $("lkGo").onclick=()=>ownerGate(f,f.auth.currentUser);$("lkSend").onclick=async()=>{try{await u.sendEmailVerification();lockErr("Link sent.");}catch(e){lockErr(authMsg(e));}};return;}
  lockView("Checking your account…",`<p class="muted">One moment.</p>`);
  let cd={};try{const sn=await f.db.collection("users").doc(u.uid).get({source:"server"});cd=sn.exists?sn.data():{};}catch(e){lockView("Can't reach your account",`<p class="muted">Check your connection and try again.</p><div class="lbtns"><button type="button" class="btn-primary" id="lkRetry">Try again</button></div>`,"#lkRetry");$("lkRetry").onclick=()=>ownerGate(f,u);return;}
  if(cd.vault)showRestore(f,u,cd);else showSetup(f,u,cd);
}
/* set up: passphrase → recovery key → PIN → Face ID */
function showSetup(f,u,cd){
  lockView("Set up your lock",`${dots(1,4)}<p class="muted">Choose a <b>passphrase</b>. It protects your data and documents, and you'll need it once on each new device. Use at least 10 characters, for example three or four words you'll remember.</p>
    <form id="lkP" novalidate><label class="f"><span>Passphrase</span><input id="lkP1" type="password" autocomplete="new-password"></label><label class="f"><span>Type it again</span><input id="lkP2" type="password" autocomplete="new-password"></label>
    <label class="chk"><input type="checkbox" id="lkShow"> <span>Show passphrase</span></label><span class="err"></span><div class="lbtns"><button type="submit" class="btn-primary">Next</button></div></form>`,"#lkP1");
  $("lkShow").onchange=()=>["lkP1","lkP2"].forEach(i=>$(i).type=$("lkShow").checked?"text":"password");
  $("lkP").onsubmit=async e=>{e.preventDefault();const p=$("lkP1").value;
    if(p.length<10){lockErr("Use at least 10 characters.");return;}if(p!==$("lkP2").value){lockErr("The two passphrases don't match.");return;}if(/^\d+$/.test(p)){lockErr("Use words, not only numbers.");return;}
    const b=e.submitter;busy(b,true,"Creating your key…");
    await setMK(rnd(32));const rk=newRecovery();VAULT={v:1,p:await wrapMK(p,ITER_P),r:await wrapMK(rkNorm(rk),ITER_R),u:Date.now()};showRecovery(rk,()=>showNewPin(()=>finishSetup(f,u,cd),2,4));};
}
function showRecovery(rk,next,inApp){
  const html=`${inApp?"":dots(2,4)}<p class="muted">This is your <b>recovery key</b>. If you forget your passphrase, it's the only way to open your documents. Write it down or save it, and keep it somewhere safe at home, not on this device only.</p>
    <div class="rk" id="lkRK">${rk}</div><div class="row2" style="margin-bottom:10px"><button type="button" class="ghost" id="lkCopy">Copy</button><button type="button" class="ghost" id="lkSave">Save as file</button></div>
    <label class="chk"><input type="checkbox" id="lkOk"> <span>I've saved my recovery key somewhere safe.</span></label><span class="err"></span><div class="lbtns"><button type="button" class="btn-primary" id="lkNext">${inApp?"Done":"Next"}</button></div>`;
  return {html,bind:()=>{
    $("lkCopy").onclick=async()=>{try{await navigator.clipboard.writeText(rk);$("lkCopy").textContent="Copied";}catch(e){$("lkCopy").textContent="Select and copy it";}};
    $("lkSave").onclick=()=>{const t=`Sea Days Ledger - recovery key\n\n${rk}\n\nKeep this somewhere safe. With it, anyone who can sign in to your account could open your documents.\nCreated ${new Date().toDateString()}\n`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"}));a.download="Sea-Days-Ledger-recovery-key.txt";document.body.appendChild(a);a.click();a.remove();};
    $("lkNext").onclick=()=>{if(!$("lkOk").checked){lockErr("Tick the box once you've saved it.");return;}next();};}};
}
const _showRecovery=showRecovery;
showRecovery=function(rk,next,inApp){const v=_showRecovery(rk,next,inApp);if(inApp)return v;lockView("Save your recovery key",v.html,"#lkCopy");v.bind();};
function showNewPin(next,step,of,msg){
  lockView("Choose a PIN for this device",`${step?dots(step+1,of):""}<p class="muted">You'll use this PIN to unlock the app on this device. Use 6 to 12 digits, not your bank PIN.</p>
    <form id="lkN" novalidate><label class="f"><span>New PIN</span><input id="lkN1" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12"></label><label class="f"><span>Type it again</span><input id="lkN2" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12"></label>
    <span class="err">${esc(msg||"")}</span><div class="lbtns"><button type="submit" class="btn-primary">Next</button></div></form>`,"#lkN1");
  $("lkN").onsubmit=async e=>{e.preventDefault();const p=$("lkN1").value;if(!pinOk(p)){lockErr("Use 6 to 12 digits.");return;}if(/^(\d)\1+$/.test(p)||"0123456789012".includes(p)||"9876543210987".includes(p)){lockErr("That PIN is too easy to guess.");return;}if(p!==$("lkN2").value){lockErr("The two PINs don't match.");return;}
    busy(e.submitter,true,"Saving…");DEV={pin:await wrapMK(p,ITER_PIN),fails:0};saveDev();await offerBio(next);};
}
async function offerBio(next){
  if(!(await bioAvailable()))return next();
  lockView("Use Face ID or fingerprint?",`<p class="muted">Unlock with Face ID, Touch ID, fingerprint or Windows Hello instead of typing your PIN. Your PIN still works.</p><span class="err"></span><div class="lbtns"><button type="button" class="btn-primary" id="lkBio">Turn on</button><button type="button" class="ghost" id="lkSkip">Not now</button></div>`);
  $("lkSkip").onclick=()=>next();
  $("lkBio").onclick=async()=>{busy($("lkBio"),true,"Waiting…");try{await bioEnable();next();}catch(e){busy($("lkBio"),false);lockErr(bioMsg(e));$("lkBio").hidden=e&&e.code==="noprf";$("lkSkip").textContent="Continue";}};
}
async function loadLedgerLocal(){
  const t=lsGet("sdlLedgerEnc");if(t){try{return await decJSON(t);}catch(e){}}
  return loadLocal(); /* an older version kept it readable; it is encrypted below and the readable copy removed */
}
async function finishSetup(f,u,cd){
  lockView("Encrypting your data…",`<p class="muted">Please keep the app open.</p>`);
  const local=await loadLedgerLocal();if(local)adopt(local);else S=JSON.parse(JSON.stringify(EXAMPLE));
  if(cd.ledger){try{merge(JSON.parse(cd.ledger));}catch(e){}}
  await migrateDocs();saveVault();if(!S.example)S.updatedAt=Date.now();await storeLedger(JSON.stringify(snapshot()));
  try{await f.db.collection("users").doc(u.uid).set({enc:await encJSON(snapshot()),vault:VAULT,updatedAt:S.updatedAt||Date.now(),email:u.email||""});}catch(e){}
  enterApp("Your lock is set up. Press Sync to replace the copies in your account with encrypted ones.");
}
/* new device: the account already has a lock */
function showRestore(f,u,cd,useRK){
  lockView("Unlock on this device",`${dots(1,3)}<p class="muted">${useRK?"Enter your recovery key.":"Enter the passphrase you chose when you set up the lock."}</p>
    <form id="lkR" novalidate><label class="f"><span>${useRK?"Recovery key":"Passphrase"}</span><input id="lkR1" type="password" autocomplete="${useRK?"off":"current-password"}" ${useRK?'style="text-transform:uppercase;font-family:var(--f-mono)"':""}></label><span class="err"></span>
    <div class="lbtns"><button type="submit" class="btn-primary">Unlock</button><button type="button" class="linky" id="lkAlt">${useRK?"Use passphrase instead":"Forgot passphrase? Use recovery key"}</button></div></form>`,"#lkR1");
  $("lkAlt").onclick=()=>showRestore(f,u,cd,!useRK);
  $("lkR").onsubmit=async e=>{e.preventDefault();const v=$("lkR1").value;if(!v){lockErr("Enter it first.");return;}busy(e.submitter,true,"Checking…");
    try{await setMK(useRK?await unwrapMK(rkNorm(v),cd.vault.r):await unwrapMK(v,cd.vault.p));}catch(err){busy(e.submitter,false);lockErr(useRK?"That recovery key isn't right.":"That passphrase isn't right.");return;}
    VAULT=cd.vault;showNewPin(()=>finishRestore(cd,useRK),1,3);};
}
async function finishRestore(cd,usedRK){try{await _finishRestore(cd,usedRK);}catch(e){lockView("Something went wrong",`<p class="muted">${esc(String(e&&e.message||e))}</p><div class="lbtns"><button type="button" class="btn-primary" onclick="location.reload()">Try again</button></div>`);}}
async function _finishRestore(cd,usedRK){
  lockView("Opening your data…",`<p class="muted">Please keep the app open.</p>`);
  const local=await loadLedgerLocal();if(local)adopt(local);else S=JSON.parse(JSON.stringify(EXAMPLE));
  if(cd.enc){try{merge(await decJSON(cd.enc));}catch(e){}}if(cd.ledger){try{merge(JSON.parse(cd.ledger));}catch(e){}}
  try{await migrateDocs();}catch(e){}saveVault();await storeLedger(JSON.stringify(snapshot()));
  enterApp(usedRK?"Unlocked with your recovery key. Set a new passphrase under Account → Security.":"Unlocked. Press Sync to bring your documents to this device.");
}
/* every day: PIN or Face ID */
function showUnlock(msg){
  const wait=Math.max(0,(DEV.until||0)-Date.now());
  lockView("Locked",`<form id="lkU" novalidate><label class="f"><span>PIN</span><input id="lkPin" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" ${wait?"disabled":""}></label>
    <span class="err">${esc(msg||"")}</span><div class="lbtns"><button type="submit" class="btn-primary" ${wait?"disabled":""}>Unlock</button>${DEV.bio?'<button type="button" class="ghost" id="lkBioU">Use Face ID / fingerprint</button>':""}
    <button type="button" class="linky" id="lkForgot">Forgot PIN? Use passphrase or recovery key</button><button type="button" class="linky" id="lkErase">Erase this device</button></div></form>`,wait?null:"#lkPin");
  if(wait){const t=setInterval(()=>{const w=Math.ceil(((DEV.until||0)-Date.now())/1000);if(w<=0){clearInterval(t);showUnlock();}else lockErr(`Too many wrong PINs. Try again in ${w} s.`);},500);}
  $("lkForgot").onclick=()=>showPassUnlock("");$("lkErase").onclick=()=>showErase(()=>showUnlock());
  if($("lkBioU"))$("lkBioU").onclick=async()=>{try{await bioUnlock();DEV.fails=0;DEV.until=0;saveDev();await openApp();}catch(e){lockErr(bioMsg(e));}};
  $("lkPin").addEventListener("input",()=>{if($("lkPin").value.length>=12)$("lkU").requestSubmit();});
  $("lkU").onsubmit=async e=>{e.preventDefault();const p=$("lkPin").value;if(!p)return;const b=$("lkU").querySelector("button[type=submit]");busy(b,true,"Checking…");
    try{await setMK(await unwrapMK(p,DEV.pin));DEV.fails=0;DEV.until=0;saveDev();await openApp();}
    catch(err){DEV.fails=(DEV.fails||0)+1;
      if(DEV.fails>=10){delete DEV.pin;delete DEV.bio;DEV.fails=0;saveDev();return showPassUnlock("Too many wrong PINs. Unlock with your passphrase or recovery key, then choose a new PIN.");}
      if(DEV.fails>=5)DEV.until=Date.now()+30000*Math.pow(2,DEV.fails-5);saveDev();showUnlock(DEV.fails>=5?"":`Wrong PIN. ${10-DEV.fails} tries left before the PIN is turned off.`);}};
}
function showPassUnlock(msg,useRK){
  lockView(useRK?"Use your recovery key":"Use your passphrase",`<form id="lkPP" novalidate><label class="f"><span>${useRK?"Recovery key":"Passphrase"}</span><input id="lkPP1" type="password" autocomplete="off" ${useRK?'style="text-transform:uppercase;font-family:var(--f-mono)"':""}></label><span class="err">${esc(msg||"")}</span>
    <div class="lbtns"><button type="submit" class="btn-primary">Unlock</button><button type="button" class="linky" id="lkAlt">${useRK?"Use passphrase instead":"Use recovery key instead"}</button>${DEV.pin?'<button type="button" class="linky" id="lkBack">Back to PIN</button>':""}<button type="button" class="linky" id="lkErase">Erase this device</button></div></form>`,"#lkPP1");
  $("lkAlt").onclick=()=>showPassUnlock("",!useRK);if($("lkBack"))$("lkBack").onclick=()=>showUnlock();$("lkErase").onclick=()=>showErase(()=>showPassUnlock("",useRK));
  $("lkPP").onsubmit=async e=>{e.preventDefault();const v=$("lkPP1").value;if(!v)return;busy(e.submitter,true,"Checking…");
    try{await setMK(useRK?await unwrapMK(rkNorm(v),VAULT.r):await unwrapMK(v,VAULT.p));}catch(err){busy(e.submitter,false);lockErr(useRK?"That recovery key isn't right.":"That passphrase isn't right.");return;}
    showNewPin(()=>openApp(useRK?"Unlocked with your recovery key. Set a new passphrase under Account → Security.":""));};
}
function showErase(back){
  lockView("Erase this device?",`<p class="muted">This removes your data, documents, PIN and sign-in from this device only. The encrypted copy in your account stays, so after signing in again with your passphrase you get back everything you had synced.</p><p class="muted">Anything you haven't synced from this device will be lost.</p><span class="err"></span>
    <div class="lbtns"><button type="button" class="btn-primary" id="lkEr" style="background:#c0392b;border-color:#c0392b">Erase this device</button><button type="button" class="ghost" id="lkNo">Cancel</button></div>`,"#lkNo");
  $("lkNo").onclick=back;$("lkEr").onclick=()=>eraseDevice();
}
async function eraseDevice(){
  try{if(fb)await fb.auth.signOut();}catch(e){}
  try{Object.keys(localStorage).filter(k=>/^(sdl|seaDays)/.test(k)&&k!=="sdlTheme").forEach(k=>localStorage.removeItem(k));}catch(e){}
  const del=n=>new Promise(r=>{try{const q=indexedDB.deleteDatabase(n);q.onsuccess=q.onerror=q.onblocked=()=>r();}catch(e){r();}});
  try{if(idbP)(await idbP).close();}catch(e){}await del("sdl-docs");await del("firebaseLocalStorageDb");
  try{sessionStorage.clear();}catch(e){}location.replace(location.pathname);
}
async function openApp(msg){
  lockView("Opening…",`<p class="muted">One moment.</p>`);
  const local=await loadLedgerLocal();if(local)adopt(local);else S=JSON.parse(JSON.stringify(EXAMPLE));
  if(!lsGet("sdlLedgerEnc")&&local)await storeLedger(JSON.stringify(snapshot()));
  await migrateDocs();enterApp(msg);
}
function enterApp(msg){UNLOCKED=true;document.body.classList.remove("locked");$("lock").setAttribute("aria-hidden","true");LB().innerHTML="";boot();if(msg)setTimeout(()=>toast(msg,7000),300);}

/* ---------- lock again: button, away from the app, idle ---------- */
let lastAct=Date.now(),hiddenAt=0;const lockMin=()=>+(lsGet("sdlLockMin")||3);
["pointerdown","keydown","touchstart","wheel"].forEach(ev=>addEventListener(ev,()=>{lastAct=Date.now();},{passive:true,capture:true}));
document.addEventListener("visibilitychange",()=>{if(!UNLOCKED)return;if(document.hidden)hiddenAt=Date.now();else{if(hiddenAt&&Date.now()-hiddenAt>lockMin()*60000)lockNow();hiddenAt=0;lastAct=Date.now();}});
setInterval(()=>{if(UNLOCKED&&!syncing&&!document.hidden&&Date.now()-lastAct>Math.max(5,lockMin())*60000)lockNow();},15000);
async function lockNow(){if(!UNLOCKED)return;UNLOCKED=false;try{await saveQ;}catch(e){}MK=null;MKraw=null;document.body.classList.add("locked");location.reload();}
$("lockBtn").addEventListener("click",lockNow);

/* ---------- Account → Security ---------- */
let secOpen="";
function renderSecurity(){
  const el=$("secCard");if(!el)return;const bio=!!DEV.bio;
  const form=(k,inner)=>secOpen===k?`<form class="sec-form" data-sf="${k}" novalidate>${inner}<div class="actions"><button type="submit" class="btn-primary btn-sm">Save</button><button type="button" class="btn-ghost btn-sm" data-scancel>Cancel</button><span class="err" id="sfErr"></span></div></form>`:"";
  const pw=(id,l,ac)=>`<label class="f"><span>${l}</span><input id="${id}" type="password" autocomplete="${ac||"off"}"></label>`;
  const pn=(id,l)=>`<label class="f"><span>${l}</span><input id="${id}" type="password" inputmode="numeric" maxlength="12" autocomplete="off"></label>`;
  el.innerHTML=`<h2 style="margin-bottom:4px">Security</h2><p class="small muted" style="margin-bottom:6px">Your ledger and documents are encrypted with your own key, on this device and in your account. Only your passphrase, recovery key, or this device's PIN${bio?" or Face ID / fingerprint":""} can open them.</p>
   <div class="sec-row"><div><b>Lock now</b><div class="small muted">Locks the app until you enter your PIN.</div></div><button type="button" class="btn-sm" data-s="lock">Lock now</button></div>
   <div class="sec-row"><div><b>Auto-lock</b><div class="small muted">Locks when you leave the app for this long (and after 5 minutes without use).</div></div><select id="secLockMin" class="btn-sm">${[1,3,5,10].map(m=>`<option value="${m}" ${lockMin()===m?"selected":""}>After ${m} min</option>`).join("")}</select></div>
   <div class="sec-row"><div><b>PIN</b><div class="small muted">Used on this device only.</div></div><button type="button" class="btn-sm" data-s="pin">Change PIN</button></div>${form("pin",pw("sfCur","Current passphrase","current-password")+pn("sfN1","New PIN (6–12 digits)")+pn("sfN2","Type it again"))}
   <div class="sec-row"><div><b>Face ID / fingerprint</b><div class="small muted">${bio?"On for this device.":"Off on this device."}</div></div><button type="button" class="btn-sm" data-s="bio">${bio?"Turn off":"Turn on"}</button></div>
   <div class="sec-row"><div><b>Passphrase</b><div class="small muted">Needed once on each new device. Press Sync after changing it.</div></div><button type="button" class="btn-sm" data-s="pass">Change passphrase</button></div>${form("pass",pw("sfCur","Current passphrase or recovery key","current-password")+pw("sfP1","New passphrase (10+ characters)","new-password")+pw("sfP2","Type it again","new-password"))}
   <div class="sec-row"><div><b>Recovery key</b><div class="small muted">Lost it? Make a new one; the old one stops working after Sync.</div></div><button type="button" class="btn-sm" data-s="rk">New recovery key</button></div>${form("rk",pw("sfCur","Current passphrase","current-password"))}
   <div class="sec-row"><div><b>Erase this device</b><div class="small muted">Removes everything from this device. Your encrypted copy in your account stays.</div></div><button type="button" class="btn-sm btn-danger" data-s="erase">Erase…</button></div>
   <div id="secRK"></div>`;
}
async function checkCur(v){try{return !!await unwrapMK(v,VAULT.p);}catch(e){}try{return looksLikeRK(v)&&!!await unwrapMK(rkNorm(v),VAULT.r);}catch(e){}return false;}
$("secCard").addEventListener("change",e=>{if(e.target.id==="secLockMin"){lsSet("sdlLockMin",e.target.value);toast("Auto-lock updated.");}});
$("secCard").addEventListener("click",async e=>{
  if(e.target.closest("[data-scancel]")){secOpen="";renderSecurity();return;}
  const b=e.target.closest("[data-s]");if(!b)return;const k=b.dataset.s;
  if(k==="lock")return lockNow();
  if(k==="erase"){if(b.dataset.c){await saveQ;return eraseDevice();}b.dataset.c="1";b.textContent="Tap again to erase";setTimeout(()=>{if(b.isConnected){delete b.dataset.c;b.textContent="Erase…";}},5000);return;}
  if(k==="bio"){if(DEV.bio){delete DEV.bio;saveDev();renderSecurity();toast("Face ID / fingerprint turned off on this device.");return;}
    if(!(await bioAvailable())){toast("This device or browser doesn't offer Face ID / fingerprint unlock.",5000);return;}
    try{await bioEnable();renderSecurity();toast("Face ID / fingerprint turned on.");}catch(err){toast(bioMsg(err),6000);}return;}
  secOpen=secOpen===k?"":k;renderSecurity();const i=$("secCard").querySelector("input");if(i)i.focus();
});
$("secCard").addEventListener("submit",async e=>{e.preventDefault();const k=e.target.dataset.sf,err=m=>$("sfErr").textContent=m,btn=e.target.querySelector("button[type=submit]");
  busy(btn,true,"Checking…");const ok=await checkCur($("sfCur").value);busy(btn,false);if(!ok){err("That passphrase isn't right.");return;}
  if(k==="pin"){const p=$("sfN1").value;if(!pinOk(p)){err("Use 6 to 12 digits.");return;}if(p!==$("sfN2").value){err("The two PINs don't match.");return;}
    busy(btn,true,"Saving…");DEV.pin=await wrapMK(p,ITER_PIN);DEV.fails=0;saveDev();secOpen="";renderSecurity();toast("PIN changed.");return;}
  if(k==="pass"){const p=$("sfP1").value;if(p.length<10){err("Use at least 10 characters.");return;}if(p!==$("sfP2").value){err("The two passphrases don't match.");return;}
    busy(btn,true,"Saving…");VAULT=Object.assign({},VAULT,{p:await wrapMK(p,ITER_P),u:Date.now()});saveVault();S.updatedAt=Date.now();await storeLedger(JSON.stringify(snapshot()));updateSyncUI();secOpen="";renderSecurity();toast("Passphrase changed. Press Sync so your account uses it too.",6000);return;}
  if(k==="rk"){busy(btn,true,"Saving…");const rk=newRecovery();VAULT=Object.assign({},VAULT,{r:await wrapMK(rkNorm(rk),ITER_R),u:Date.now()});saveVault();S.updatedAt=Date.now();await storeLedger(JSON.stringify(snapshot()));updateSyncUI();secOpen="";renderSecurity();
    const v=_showRecovery(rk,()=>{$("secRK").innerHTML="";toast("Press Sync so the new recovery key works for your account.",6000);},true);$("secRK").innerHTML=`<div class="lock" style="position:static;background:none;padding:10px 0"><div class="lock-card" style="max-width:none"><h3 style="color:#fff;margin:0 0 8px">Your new recovery key</h3>${v.html}</div></div>`;v.bind();}
});

/* ======================= start ======================= */
S=JSON.parse(JSON.stringify(EXAMPLE)); /* placeholder until unlocked; nothing is shown before then */
applyTheme();
if(APP_V){const t="Version "+APP_V.slice(0,8)+"."+APP_V.slice(8);if($("appVer"))$("appVer").textContent="App "+t;if($("railVer"))$("railVer").textContent=t;}
if(/[?&]v=/.test(location.search))history.replaceState(null,"",location.pathname+location.hash);
function boot(){takeCarry();syncSegs();render();renderAccount();renderUploadState();planDefaults();renderSecurity();show(location.hash.slice(1)||"dashboard");}
lockStart();
})();
