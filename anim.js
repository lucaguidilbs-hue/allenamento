/* Animazioni vettoriali degli esercizi.
   Figura a bastoncino con cinematica: ogni posa indica bacino (P), inclinazione del busto (t, gradi: 180 = dritto in su,
   90 = orizzontale in avanti, -90 = orizzontale indietro, 0 = in giù) e la posizione di mani/caviglie (IK) o gli angoli
   assoluti dei segmenti (Aa/Ba/La/Ma = [segmento1, segmento2]). Vista laterale: la figura guarda a destra. */
const ANIM=(()=>{
const R=Math.PI/180,G=74;
const dir=a=>[Math.sin(a*R),Math.cos(a*R)];
const add=(p,v,k=1)=>[p[0]+v[0]*k,p[1]+v[1]*k];
const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
function ik(root,tgt,l1,l2,s){
  const dx=tgt[0]-root[0],dy=tgt[1]-root[1],d=Math.hypot(dx,dy)||.001;
  const dm=Math.min(l1+l2-.05,Math.max(Math.abs(l1-l2)+.05,d)),ux=dx/d,uy=dy/d;
  const ca=(l1*l1+dm*dm-l2*l2)/(2*l1*dm),a=Math.acos(Math.max(-1,Math.min(1,ca)))*s,c=Math.cos(a),sn=Math.sin(a);
  return [[root[0]+l1*(ux*c-uy*sn),root[1]+l1*(ux*sn+uy*c)],[root[0]+ux*dm,root[1]+uy*dm]];
}
function chain(root,spec,ang,l1,l2,s){
  if(!ang&&!spec)ang=[0,0];
  if(ang)return [add(root,dir(ang[0]),l1),add(add(root,dir(ang[0]),l1),dir(ang[1]),l2)];
  return ik(root,spec,l1,l2,s);
}
/* --- posa -> articolazioni --- */
function solve(p,sp){
  const L=Object.assign({t:24,ua:12,fa:11,th:16,sh:16,ft:5},sp.len||{}),front=sp.view==="front";
  const P=p.P,td=dir(p.t),S=add(P,td,L.t),perp=dir(p.t-90);
  const Sa=front?add(S,perp,5):S,Sb=front?add(S,perp,-5):S,Pa=front?add(P,perp,3.5):P,Pb=front?add(P,perp,-3.5):P;
  const mir=q=>q&&[2*P[0]-q[0],q[1]],nang=q=>q&&[-q[0],-q[1]];
  const A=p.A,Aa=p.Aa,B=p.B||(front?mir(p.A):p.A),Ba=p.Ba||(front?nang(p.Aa):p.Aa)||null;
  const Lt=p.L,La=p.La,M=p.M||(front?mir(p.L):p.L),Ma=p.Ma||(front?nang(p.La):p.La)||null;
  const eA=p.eA??1,eB=p.eB??(front?-eA:eA),kL=p.kL??-1,kM=p.kM??(front?-kL:kL);
  const [Ae,Ah]=chain(Sa,A,Aa,L.ua,L.fa,eA),[Be,Bh]=chain(Sb,B,p.B?null:Ba,L.ua,L.fa,eB);
  const [Lk,Lf]=chain(Pa,Lt,La,L.th,L.sh,kL),[Mk,Mf]=chain(Pb,M,p.M?null:Ma,L.th,L.sh,kM);
  const H=add(add(S,dir(p.h??p.t),7),[p.hx||0,0]);
  const fA=p.fA??(front?0:90),fM=p.fM??fA;
  return {P,S,Sa,Sb,Pa,Pb,Ae,A:Ah,Be,B:Bh,Lk,L:Lf,Mk,M:Mf,H,AB:mid(Ah,Bh),
    Lt:add(Lf,dir(front?(fA+(Lf[0]>=P[0]?40:-40)):fA),L.ft),Mt:add(Mf,dir(front?(fM+(Mf[0]>=P[0]?40:-40)):fM),L.ft)};
}
/* --- interpolazione --- */
function alerp(a,b,k){let d=((b-a)%360+540)%360-180;return a+d*k}
function lerp(a,b,k){if(typeof a==="number"&&typeof b==="number")return a+(b-a)*k;
  if(Array.isArray(a)&&Array.isArray(b))return a.map((v,i)=>lerp(v,b[i],k));return k<.5?a:b}
function norm(sp){if(sp._f)return sp._f;let prev={};sp._f=sp.f.map(fr=>{const o=Object.assign({},prev,fr);
  ["A","B","L","M"].forEach(k=>{if(fr[k+"a"])delete o[k];else if(fr[k])delete o[k+"a"]});prev=o;return o});return sp._f}
function poseAt(sp,time){
  const fs=norm(sp),n=fs.length;if(n===1)return fs[0];
  const d=sp.d||1.1,h=sp.hold??.25,seg=i=>(Array.isArray(d)?d[i%d.length]:d),hd=i=>(Array.isArray(h)?h[i%h.length]:h);
  let tot=0;for(let i=0;i<n;i++)tot+=seg(i)+hd(i);
  let t=time%tot;
  for(let i=0;i<n;i++){
    if(t<hd(i))return fs[i];t-=hd(i);
    if(t<seg(i)){const k=t/seg(i),e=.5-.5*Math.cos(Math.PI*k),a=fs[i],b=fs[(i+1)%n],o={};
      for(const key of new Set([...Object.keys(a),...Object.keys(b)]))o[key]=(a[key]!==undefined&&b[key]!==undefined)?((key==="t"||key==="h")?alerp(a[key],b[key],e):lerp(a[key],b[key],e)):(a[key]??b[key]);
      ["A","B","L","M"].forEach(k=>{if(o[k]&&o[k+"a"]){if(e<.5)delete o[k];else delete o[k+"a"]}});
      return o}
    t-=seg(i);
  }
  return fs[0];
}
/* --- disegno --- */
const f1=n=>Math.round(n*10)/10,pt=p=>f1(p[0])+","+f1(p[1]);
const EQ="#c9ccd3",DK="#343843",BAND="#ff8a5c",CAB="#7d8494";
function draw(sp,p){
  const J=solve(p,sp),front=sp.view==="front";
  const pl=(a,cls)=>`<polyline points="${a.map(pt).join(" ")}"${cls||""}/>`;
  const far=front?"":' opacity=".42"';
  let s="";
  // braccia e gambe lontane
  if(!sp.noLegs)s+=pl([J.Pb,J.Mk,J.M,J.Mt],far);
  if(!sp.oneArm)s+=pl([J.Sb,J.Be,J.B],far);
  // busto
  const c=p.c||0;
  if(front){s+=`<line x1="${f1(J.S[0])}" y1="${f1(J.S[1])}" x2="${f1(J.P[0])}" y2="${f1(J.P[1])}" stroke-width="4.4"/>`+pl([J.Sa,J.Sb])+(sp.noLegs?"":pl([J.Pa,J.Pb]))}
  else{const m=mid(J.P,J.S),q=add(m,dir(p.t+90),c);s+=`<path d="M${pt(J.P)} Q${pt(q)} ${pt(J.S)}" stroke-width="4.4"/>`}
  s+=pl([J.S,add(J.S,dir(p.h??p.t),2.5)]);
  if(!sp.noLegs)s+=pl([J.Pa,J.Lk,J.L,J.Lt]);
  s+=pl([J.Sa,J.Ae,J.A]);
  s+=`<circle cx="${f1(J.H[0])}" cy="${f1(J.H[1])}" r="${sp.r||5}" fill="#15171c"/>`;
  // volto
  if(front){const fr=p.fr||0,hx=J.H[0]+fr*2.6,hy=J.H[1];s+=`<g fill="currentColor" stroke="none"><circle cx="${f1(hx-1.9)}" cy="${f1(hy-.6)}" r=".75"/><circle cx="${f1(hx+1.9)}" cy="${f1(hy-.6)}" r=".75"/><circle cx="${f1(hx)}" cy="${f1(hy+1.6)}" r=".6"/></g>`}
  else{const hd=dir((p.h??p.t)-90),r=sp.r||5;s+=`<line x1="${f1(J.H[0]+hd[0]*r)}" y1="${f1(J.H[1]+hd[1]*r)}" x2="${f1(J.H[0]+hd[0]*(r+1.6))}" y2="${f1(J.H[1]+hd[1]*(r+1.6))}" stroke-width="2"/>`}
  // attrezzi che seguono il corpo
  let pr="";
  const jp=j=>Array.isArray(j)?j:J[j];
  (sp.p||[]).forEach(o=>{
    const at=o.j?add(jp(o.j),o.off||[0,0]):null;
    if(o.k==="db")pr+=front&&!o.side?`<rect x="${f1(at[0]-4.5)}" y="${f1(at[1]-1.6)}" width="9" height="3.2" rx="1.2" fill="${EQ}"/>`:`<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${o.r||3.3}" fill="${EQ}"/><circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="1.1" fill="#15171c"/>`;
    else if(o.k==="bar")pr+=`<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${o.r||6}" fill="none" stroke="${EQ}" stroke-width="2.6"/><circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="1.2" fill="${EQ}"/>`;
    else if(o.k==="pad")pr+=`<rect x="${f1(at[0]-(o.w||7)/2)}" y="${f1(at[1]-(o.h||4)/2)}" width="${o.w||7}" height="${o.h||4}" rx="2" fill="${o.c||"#5b6170"}"/>`;
    else if(o.k==="h")pr+=`<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="1.9" fill="${EQ}"/>`;
    else if(o.k==="pack")pr+=`<rect x="${f1(at[0]-4)}" y="${f1(at[1]-1)}" width="8" height="10" rx="2" fill="#6b7a8f"/>`;
    else if(o.k==="plate"){const d2=dir(o.ang),L2=(o.len||18)/2;pr+=`<line x1="${f1(at[0]-d2[0]*L2)}" y1="${f1(at[1]-d2[1]*L2)}" x2="${f1(at[0]+d2[0]*L2)}" y2="${f1(at[1]+d2[1]*L2)}" stroke="${EQ}" stroke-width="3"/>`}
    else if(o.k==="barline"){const a=add(J.A,o.off||[0,0]),b=add(J.B,o.off||[0,0]),ext=o.ext||6;pr+=`<line x1="${f1(Math.min(a[0],b[0])-ext)}" y1="${f1(b[1])}" x2="${f1(Math.max(a[0],b[0])+ext)}" y2="${f1(a[1])}" stroke="${EQ}" stroke-width="2.4"/>`}
    else if(o.k==="cable"||o.k==="band"){const fr=jp(o.from),to=add(jp(o.to),o.off||[0,0]);pr+=`<line x1="${f1(fr[0])}" y1="${f1(fr[1])}" x2="${f1(to[0])}" y2="${f1(to[1])}" stroke="${o.k==="band"?BAND:CAB}" stroke-width="${o.k==="band"?1.8:1.1}"/>`+(o.k==="cable"&&!o.np?`<circle cx="${f1(fr[0])}" cy="${f1(fr[1])}" r="2.4" fill="${DK}" stroke="${CAB}" stroke-width="1"/>`:"")}
  });
  return `<g stroke="currentColor" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round" fill="none">${s}</g>${pr}`;
}
/* --- scenografia statica --- */
const FL=`<line x1="-20" y1="75.3" x2="160" y2="75.3" stroke="#2a2e38" stroke-width="2.2"/>`;
const RC=(x,y,w,h,c,r)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r??1.5}" fill="${c||DK}"/>`;
const LN=(x1,y1,x2,y2,w,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c||DK}" stroke-width="${w||2.5}" stroke-linecap="round"/>`;
const BENCH=(x,y,w)=>RC(x,y,w,3.6,"#4a505e")+LN(x+4,y+3,x+4,75,2)+LN(x+w-4,y+3,x+w-4,75,2);
const SEAT=(x,y,w,bx,by)=>RC(x,y,w,3.4,"#4a505e")+LN(x+w/2,y+3,x+w/2,75,2.4)+(bx!==undefined?LN(x+1.5,y+1,bx,by,3.2,"#4a505e"):"");
const TOWER=x=>LN(x,0,x,75,3)+LN(x-4,75,x+4,75,3);
const WALL=x=>RC(x-4,-20,4,95,"#2a2e38",0);
const DOOR=x=>RC(x,-20,5,95,"#2a2e38",0);
/* --- pose base --- */
const ST={P:[56,42],t:180,A:[57,41],L:[56,74]};
/* =============== LIBRERIA ANIMAZIONI =============== */
const S={};
// ---- Squat
S.squat_corpo={s:FL,d:1.2,f:[{...ST,P:[52,42],A:[76,19],L:[58,74]},{P:[45,58],t:148,A:[82,38]}]};
S.squat_corpo_tempo={...S.squat_corpo,d:[2.6,.9],hold:[.2,.5]};
S.squat_1e12={s:FL,d:.9,f:[S.squat_corpo.f[0],S.squat_corpo.f[1],{P:[49,50],t:162,A:[79,28]},S.squat_corpo.f[1]]};
S.goblet={s:FL,d:1.3,f:[{P:[53,42],t:180,A:[59,26],L:[58,74]},{P:[47,58],t:160,A:[61,42]}],p:[{k:"db",j:"A",r:3.8}]};
S.squat_tempo_db={s:FL,d:[2.4,1],f:[{P:[53,42],t:180,A:[54,41],L:[58,74]},{P:[46,58],t:152,A:[58,58]}],p:[{k:"db",j:"A"}]};
S.smith_squat={s:LN(30,-10,30,75,3)+LN(30,8,36,8,2)+FL,d:1.3,f:[{P:[53,42],t:180,A:[50,17],L:[58,74],eA:-1},{P:[47,58],t:157,A:[54,35]}],p:[{k:"bar",j:"S",off:[-3,-2],r:6.5}]};
S.hacksquat={s:LN(58.7,73,33,12,4,"#4a505e")+LN(62,75,76,62,3,"#4a505e")+FL,d:1.3,f:[{P:[51,44],t:203,A:[46,23],L:[68,70]},{P:[57,59],t:203,A:[52,38]}],p:[{k:"pad",j:"S",off:[2,-3],w:6,h:4}]};
S.wall_sit={s:WALL(33)+FL,d:1.5,hold:1,f:[{P:[38,57],t:180,A:[52,55],L:[56,74]},{h:183}]};
// ---- Pressa
const LP=LN(24,40,44,62,4,"#4a505e")+LN(44,62,60,62,4,"#4a505e")+LN(52,62,52,75,3)+FL;
S.legpress={s:LP,d:1.4,f:[{P:[44,59],t:232,A:[52,58],L:[65.5,37.5]},{L:[56,47.5]}],p:[{k:"plate",j:"L",ang:45,len:22,off:[1.5,-1.5]}]};
S.legpress_alti={...S.legpress,f:[{P:[44,59],t:232,A:[52,58],L:[63,33]},{L:[53,44]}]};
S.calf_pressa={s:LP,d:1,f:[{P:[44,59],t:232,A:[52,58],L:[65.5,37.5],fA:225},{fA:172}],p:[{k:"plate",j:"Lt",ang:45,len:22,off:[1,-1]}]};
// ---- Stacchi
S.rdl_db={s:FL,d:1.4,f:[{P:[52,42],t:180,A:[53,41],L:[54,74]},{P:[43,45],t:100,A:[66,69]}],p:[{k:"db",j:"A"}]};
S.rdl_el={...S.rdl_db,p:[{k:"band",from:"Lt",to:"A"},{k:"h",j:"A"}]};
S.rdl_1g={s:FL,d:1.5,f:[{P:[56,42],t:180,A:[57,41],L:[57,74],M:[55,74]},{P:[55,45],t:96,A:[78,68],L:[59,74],M:[24,46]}],p:[{k:"db",j:"A"}]};
S.hyper45={s:LN(36,72,58,50,4,"#4a505e")+RC(55,48,8,5,"#5b6170",2)+RC(34,68,6,5,"#5b6170",2)+FL,d:1.4,f:[{P:[58,46],t:135,A:[69,36],L:[36,68],eA:-1},{t:30,A:[66,59]}]};
S.pullthrough={s:TOWER(16)+FL,d:1.3,f:[{P:[58,42],t:180,A:[61,44],L:[56,74]},{P:[50,46],t:108,A:[53,64]}],p:[{k:"cable",from:[18,70],to:"A"},{k:"h",j:"A"}]};
// ---- Affondi
S.affondi_db={s:FL,d:1.3,f:[{...ST,P:[58,42],A:[59,41],L:[58,74],M:[58,74]},{P:[55,56],t:178,A:[57,55],L:[64,74],M:[33,71],fM:60}],p:[{k:"db",j:"A"}]};
S.affondi_corpo={...S.affondi_db,f:[{P:[58,42],t:180,A:[62,40],L:[58,74],M:[58,74]},{P:[55,56],t:178,A:[59,54],L:[64,74],M:[33,71],fM:60}],p:[]};
S.affondi_cam_db={s:FL,d:1.3,f:[{P:[44,42],t:180,A:[45,41],L:[44,74],M:[44,74]},{P:[52,56],t:178,A:[54,55],L:[63,74],M:[30,71],fM:60}],p:[{k:"db",j:"A"}]};
const BNC=RC(22,62,22,4,"#4a505e")+LN(25,64,25,75,2)+LN(41,64,41,75,2);
S.bulgaro_db={s:BNC+FL,d:1.3,f:[{P:[60,43],t:180,A:[61,42],L:[70,74],M:[37,61],fM:-90},{P:[57,57],t:172,A:[61,56]}],p:[{k:"db",j:"A"}]};
S.bulgaro_corpo={...S.bulgaro_db,p:[],f:[{P:[60,43],t:180,A:[66,40],L:[70,74],M:[37,61],fM:-90},{P:[57,57],t:172,A:[63,54]}]};
S.stepup_db={vb:"0 -14 132 88",s:RC(60,62,26,13,"#4a505e")+FL,d:1.3,f:[{P:[48,44],t:176,A:[50,43],L:[67,61],M:[46,74]},{P:[68,32],t:180,A:[69,31],L:[69,61],M:[64,55]}],p:[{k:"db",j:"A"}]};
// ---- Macchine gambe
const SEATR=SEAT(32,53,30,30,24)+FL;
S.legcurl_sed={s:SEATR+RC(52,44,10,4,"#5b6170",2),d:1.2,f:[{P:[40,51],t:186,A:[52,53],La:[90,88]},{La:[90,-22]}],p:[{k:"pad",j:"L",off:[0,-2.5],w:5,h:5}]};
S.legcurl_sdr={s:BENCH(14,53,62)+FL,d:1.2,f:[{P:[60,50],t:-90,h:-80,A:[32,62],La:[90,90],fA:0},{La:[90,205]}],p:[{k:"pad",j:"L",off:[0,-3],w:5,h:5}]};
S.legext={s:SEATR,d:1.2,f:[{P:[40,51],t:188,A:[46,55],La:[91,0]},{La:[91,86]}],p:[{k:"pad",j:"L",off:[0,2.5],w:5,h:5}]};
S.calf_piedi={vb:"0 -12 126 84",s:RC(56,66,18,9,"#4a505e"),d:.9,f:[{P:[58,37.5],t:180,A:[61,13],L:[58.5,68.5],fA:114},{P:[60.5,29],A:[63.5,4.5],L:[61,60],fA:27}],p:[{k:"pad",j:"S",off:[1,-3],w:7,h:4}]};
S.calf_sed={s:SEAT(26,52,24)+RC(58,68,14,7,"#4a505e")+FL,d:.9,f:[{P:[36,50],t:182,A:[56,46],L:[58.5,69.5],fA:114},{L:[60.5,63],fA:40}],p:[{k:"pad",j:"Lk",off:[0,-3],w:9,h:4}]};
S.abductor={view:"front",len:{th:9},s:RC(44,50,32,4,"#4a505e")+RC(46,22,28,28,"#2a2e38",3)+FL,d:1.2,f:[{P:[60,50],t:180,A:[69,52],L:[65,74],fA:0},{L:[74,74]}],p:[{k:"pad",j:"Lk",off:[3,0],w:4,h:8},{k:"pad",j:"Mk",off:[-3,0],w:4,h:8}]};
S.mostro_el={view:"front",s:FL,d:.8,hold:.1,f:[{P:[56,48],t:180,A:[64,46],L:[63,74],M:[46,74]},{P:[61,48],A:[69,46],L:[71,74],M:[50,74]},{P:[64,48],A:[72,46],L:[71,74],M:[57,74]}],p:[{k:"band",from:"Lk",to:"Mk"}]};
// ---- Glutei
const BN2=RC(18,52,24,23,"#4a505e",2)+FL;
S.hipthrust_bil={s:BN2,d:1.3,f:[{P:[55,68],t:220,A:[57,62],L:[73,74]},{P:[62,50],t:-90,A:[63,44]}],p:[{k:"bar",j:"P",off:[1,-6],r:6.5}]};
S.hipthrust_mac={...S.hipthrust_bil,p:[{k:"pad",j:"P",off:[1,-4],w:10,h:4}]};
S.hipthrust_divano={s:RC(14,50,28,25,"#4a505e",6)+FL,d:1.3,f:S.hipthrust_bil.f,p:[{k:"db",j:"P",off:[1,-5],side:1}]};
S.glute_bridge_db={s:FL,d:1.3,f:[{P:[52,71],t:-90,A:[52,66],L:[64,74]},{P:[50,60],t:-63,A:[50,55]}],p:[{k:"db",j:"P",off:[0,-5]}]};
S.glute_bridge_1g={s:FL,d:1.3,f:[{P:[52,71],t:-90,A:[36,73],L:[64,74],M:[72,50]},{P:[50,60],t:-63,A:[34,73],M:[76,44]}]};
// ---- Petto
S.chestpress={s:SEAT(32,53,24,30,20)+LN(76,75,76,26,3)+FL,d:1.2,f:[{P:[42,52],t:182,A:[47,30],L:[60,74]},{A:[63,30]}],p:[{k:"h",j:"A"}]};
S.chestpress_incl={...S.chestpress,f:[{P:[42,52],t:182,A:[47,27],L:[60,74]},{A:[59,13]}]};
S.panca_db={s:BENCH(28,56,52)+FL,d:1.2,f:[{P:[72,53],t:-90,A:[48,31],L:[86,74]},{A:[51,46]}],p:[{k:"db",j:"A"}]};
S.panca_incl_db={s:LN(36,30,60,56,4,"#4a505e")+LN(60,56,72,56,4,"#4a505e")+LN(62,56,62,75,2.4)+FL,d:1.2,f:[{P:[60,54],t:225,A:[45,15],L:[76,74]},{A:[48,31]}],p:[{k:"db",j:"A"}]};
S.pectoral={view:"front",len:{th:9},s:RC(46,8,28,42,"#2a2e38",3)+RC(44,50,32,4,"#4a505e")+FL,d:1.2,f:[{P:[60,50],t:180,A:[82,14],L:[66,74],eA:1},{A:[63,12]}],p:[{k:"pad",j:"Ae",w:4,h:7},{k:"pad",j:"Be",w:4,h:7}]};
S.croci_cavi={view:"front",s:TOWER(6)+TOWER(114)+FL,d:1.3,f:[{P:[60,42],t:180,A:[90,20],L:[65,74]},{A:[63,38]}],p:[{k:"cable",from:[10,6],to:"B"},{k:"cable",from:[110,6],to:"A"},{k:"h",j:"A"},{k:"h",j:"B"}]};
S.croci_db={view:"front",noLegs:1,len:{t:10},s:RC(40,52,40,5,"#4a505e")+LN(48,57,48,75,2)+LN(72,57,72,75,2)+FL,d:1.3,f:[{P:[60,52],t:180,A:[63,20]},{A:[85,47]}],p:[{k:"db",j:"A"},{k:"db",j:"B"}]};
S.pushup={s:FL,d:1.1,f:[{P:[42.4,60.6],t:113.6,A:[69,74],L:[14,73]},{P:[44.7,68.7],t:98,eA:1}]};
S.pushup_stretti=S.pushup;
S.pushup_rialz={s:RC(64,54,18,21,"#4a505e")+FL,d:1.1,f:[{P:[45.9,51.1],t:135,A:[72,54],L:[24,73]},{P:[50.8,57.5],t:120}]};
S.pushup_piedi={s:RC(4,58,22,17,"#4a505e")+FL,d:1.1,f:[{P:[48.8,53.6],t:96.2,A:[76,74],L:[18,57],fA:0},{P:[48.7,61],t:82.6}]};
S.floor_press={s:FL,d:1.2,f:[{P:[72,71],t:-90,A:[48,48],L:[84,74]},{A:[51,62]}],p:[{k:"db",j:"A"}]};
// ---- Spalle
S.shoulder_mac={view:"front",len:{th:9},s:RC(48,4,24,46,"#2a2e38",3)+RC(44,50,32,4,"#4a505e")+FL,d:1.2,f:[{P:[60,50],t:180,A:[72,25],L:[66,74]},{A:[67,4]}],p:[{k:"h",j:"A"},{k:"h",j:"B"}]};
S.lento_db={...S.shoulder_mac,s:RC(48,10,24,40,"#2a2e38",3)+RC(44,50,32,4,"#4a505e")+FL,p:[{k:"db",j:"A"},{k:"db",j:"B"}]};
S.lento_el={view:"front",vb:"-6 -12 132 88",s:FL,d:1.2,f:[{P:[60,42],t:180,A:[71,17],L:[65,74]},{A:[66,-4]}],p:[{k:"band",from:"Lt",to:"A"},{k:"band",from:"Mt",to:"B"},{k:"h",j:"A"},{k:"h",j:"B"}]};
S.pike={s:FL,d:1.2,f:[{P:[64,48],t:-78.7,A:[40,74],L:[82,74],eA:-1},{P:[64,50],t:-63.4}]};
S.alzate_db={view:"front",s:FL,d:1.2,f:[{P:[60,42],t:180,Aa:[8,6],L:[64,74]},{Aa:[84,88]}],p:[{k:"db",j:"A"},{k:"db",j:"B"}]};
S.alzate_el={...S.alzate_db,p:[{k:"band",from:"Lt",to:"A"},{k:"band",from:"Mt",to:"B"},{k:"h",j:"A"},{k:"h",j:"B"}]};
S.alzate_cavo={view:"front",s:TOWER(10)+FL,d:1.2,f:[{P:[62,42],t:180,Aa:[-14,-18],B:[54,40],L:[66,74]},{Aa:[84,88]}],p:[{k:"cable",from:[13,71],to:"A"},{k:"h",j:"A"}]};
S.delts_mac={view:"front",len:{th:9},s:RC(48,8,24,42,"#2a2e38",3)+RC(44,50,32,4,"#4a505e")+FL,d:1.2,f:[{P:[60,50],t:180,Aa:[10,120],L:[66,74]},{Aa:[82,150]}],p:[{k:"pad",j:"Ae",w:4,h:7},{k:"pad",j:"Be",w:4,h:7}]};
S.facepull={s:TOWER(100)+FL,d:1.2,f:[{P:[50,42],t:182,A:[72,22],L:[50,74],M:[42,74]},{A:[57,15],eA:-1}],p:[{k:"cable",from:[98,20],to:"A"},{k:"h",j:"A"}]};
S.facepull_el={...S.facepull,s:DOOR(98)+FL,p:[{k:"band",from:[98,20],to:"A"},{k:"h",j:"A"}]};
S.revfly_mac={view:"front",noLegs:1,len:{t:8},s:RC(48,30,24,6,"#5b6170",3),d:1.2,f:[{P:[60,52],t:180,Aa:[176,176]},{Aa:[93,93]}],p:[{k:"h",j:"A"},{k:"h",j:"B"}]};
S.revfly_db={view:"front",len:{t:14,th:9},s:RC(44,52,32,4,"#4a505e")+FL,d:1.2,f:[{P:[60,52],t:180,Aa:[6,4],L:[66,74]},{Aa:[80,86]}],p:[{k:"db",j:"A"},{k:"db",j:"B"}]};
S.ytw={view:"front",vb:"0 -8 120 80",d:1.2,hold:.4,f:[{P:[60,47],t:180,Aa:[150,150],L:[65,72]},{Aa:[93,93]},{Aa:[120,200]}]};
S.mob_wall={view:"front",vb:"0 -6 120 80",s:RC(30,-10,60,90,"#1d2027",0),d:1.6,f:[{P:[60,46],t:180,Aa:[95,180],L:[64,74]},{Aa:[160,175]}]};
// ---- Schiena
S.lat_neutra={s:SEAT(36,57,24)+RC(58,46,8,4,"#5b6170",2)+TOWER(78)+LN(78,2,60,2,2.5)+FL,d:1.3,f:[{P:[50,56],t:186,A:[57,9],L:[66,74]},{A:[57,33]}],p:[{k:"cable",from:[60,2],to:"A"},{k:"h",j:"A"}]};
S.lat_larga={view:"front",len:{th:9},s:RC(44,54,32,4,"#4a505e")+FL,d:1.3,f:[{P:[60,54],t:180,A:[82,9],L:[66,76]},{A:[77,28]}],p:[{k:"cable",from:[60,-6],to:"AB",np:1},{k:"barline"}]};
S.trazioni_ass={view:"front",vb:"0 -6 120 80",s:LN(34,4,86,4,3,EQ),d:1.3,f:[{P:[60,48],t:180,A:[76,4],L:[63,70]},{P:[60,32],L:[63,54]}],p:[{k:"pad",j:"Lk",off:[0,4],w:16,h:3}]};
S.pulley={s:RC(26,64,34,4,"#4a505e")+RC(74,58,4,14,"#4a505e")+TOWER(100)+FL,d:1.3,f:[{P:[40,62],t:168,A:[67,46],L:[72,66]},{t:182,A:[49,48]}],p:[{k:"cable",from:[98,50],to:"A"},{k:"h",j:"A"}]};
S.rem_petto={s:LN(52,62,72,40,4,"#5b6170")+RC(40,62,18,4,"#4a505e")+FL,d:1.2,f:[{P:[46,58],t:135,A:[66,64],L:[50,74]},{A:[56,53]}],p:[{k:"h",j:"A"}]};
const BN1=RC(26,62,66,4,"#4a505e")+LN(30,64,30,75,2)+LN(88,64,88,75,2)+FL;
S.rem_1b={s:BN1,d:1.2,f:[{P:[46,40],t:100,A:[70,66],B:[86,62],L:[54,74],M:[28,62],fM:-90},{A:[60,50]}],p:[{k:"db",j:"A"}]};
S.rem_zaino={...S.rem_1b,p:[{k:"pack",j:"A",off:[0,0]}]};
S.rem_db_incl={s:FL,d:1.2,f:[{P:[50,40],t:120,A:[72,51],L:[56,74]},{A:[62,40]}],p:[{k:"db",j:"A"}]};
S.rem_largo={...S.rem_db_incl,f:[{P:[50,40],t:120,A:[72,51],L:[56,74]},{A:[66,36],eA:1}]};
S.rem_el={s:FL,d:1.2,f:[{P:[38,68],t:176,A:[62,58],L:[72,73],fA:180},{t:186,A:[46,60]}],p:[{k:"band",from:"Lt",to:"A"},{k:"h",j:"A"}]};
S.lat_el={vb:"0 -6 120 80",s:DOOR(86)+FL,d:1.3,f:[{P:[56,57],t:180,A:[68,14],L:[40,74],fA:-90},{A:[60,48]}],p:[{k:"band",from:[86,-2],to:"A"},{k:"h",j:"A"}]};
S.pullover_db={s:BENCH(24,56,56)+FL,d:1.5,f:[{P:[70,53],t:-90,A:[46,30],L:[84,74]},{A:[24,48]}],p:[{k:"db",j:"A"}]};
S.rem_tavolo={s:LN(50,30,104,30,3,"#4a505e")+LN(56,30,56,75,2.4)+LN(98,30,98,75,2.4)+FL,d:1.2,f:[{P:[44.7,60.4],t:112,A:[58,31],L:[16,72],eA:-1,fA:180},{P:[42.3,55.6],t:122}]};
// ---- Braccia
S.curl_db={s:FL,d:1.1,f:[{...ST,Aa:[0,2]},{Aa:[6,160]}],p:[{k:"db",j:"A"}]};
S.curl_martello=S.curl_db;
S.curl_cavo={s:TOWER(84)+FL,d:1.1,f:S.curl_db.f,p:[{k:"cable",from:[82,71],to:"A"},{k:"h",j:"A"}]};
S.curl_el={s:FL,d:1.1,f:[{...ST,Aa:[0,2],L:[58,74]},{Aa:[6,160]}],p:[{k:"band",from:"Lt",to:"A"},{k:"h",j:"A"}]};
S.pushdown={s:TOWER(80)+FL,d:1.1,f:[{P:[52,42],t:176,Aa:[6,150],L:[52,74]},{Aa:[4,4]}],p:[{k:"cable",from:[78,0],to:"A"},{k:"h",j:"A"}]};
S.pushdown_el={...S.pushdown,s:DOOR(80)+FL,p:[{k:"band",from:[80,0],to:"A"},{k:"h",j:"A"}]};
S.triceps_mac={s:SEAT(30,54,26,30,26)+FL,d:1.1,f:[{P:[42,53],t:182,Aa:[12,150],L:[60,74]},{Aa:[12,20]}],p:[{k:"h",j:"A"}]};
S.french_cavo={s:TOWER(12)+FL,d:1.2,f:[{P:[56,42],t:166,Aa:[160,-20],L:[64,74],M:[48,74]},{Aa:[155,-208]}],p:[{k:"cable",from:[14,70],to:"A"},{k:"h",j:"A"}]};
S.french_db={s:SEAT(36,54,26,38,30)+FL,d:1.3,f:[{P:[46,53],t:182,Aa:[174,-12],L:[64,74]},{Aa:[176,-182]}],p:[{k:"db",j:"A"}]};
S.kickback={s:BN1,d:1.1,f:[{P:[46,42],t:112,Aa:[-78,0],B:[84,62],L:[54,74],M:[28,62],fM:-90},{Aa:[-78,-80]}],p:[{k:"db",j:"A"}]};
// ---- Addome
S.deadbug={s:FL,d:1.1,hold:.3,f:[{P:[66,71],t:-90,Aa:[180,180],Ba:[180,180],La:[180,90],Ma:[180,90]},{Ba:[264,264],La:[86,86]},{Ba:[180,180],La:[180,90]},{Aa:[264,264],Ma:[86,86]}]};
S.plank={s:FL,d:1.6,hold:.6,f:[{P:[46.4,66.8],t:101.5,Aa:[0,90],L:[16,73],fA:0},{P:[46.4,65.8],t:102.5}]};
S.plank_lat={s:FL,d:1.3,hold:.6,f:[{P:[44,70],t:120,Aa:[4,90],B:[48,64],L:[16,73],fA:0},{P:[45.8,64.6],t:105.8,B:[50,58]}]};
S.pallof_cavo={s:LN(30,10,30,75,3,"#2a2e38")+FL,d:1.2,hold:.6,f:[{P:[56,42],t:180,A:[63,30],L:[60,74],M:[50,74]},{A:[78,29]}],p:[{k:"cable",from:[30,30],to:"A"},{k:"h",j:"A"}]};
S.pallof_el={...S.pallof_cavo,p:[{k:"band",from:[30,30],to:"A"},{k:"h",j:"A"}]};
S.burpee_ns={s:FL,d:.9,hold:.15,f:[{P:[56,42],t:180,A:[57,41],L:[58,74]},{P:[50,62],t:115,A:[74,74],L:[60,74]},{P:[51.6,60.9],t:112.9,A:[75,74],L:[23,73],fA:0},{P:[50,62],t:115,A:[74,74],L:[60,74],fA:90}]};
S.mc_lenti={s:FL,d:.7,hold:.1,f:[{P:[51.6,60.9],t:112.9,A:[75,74],L:[23,73],M:[23,73],fA:0},{L:[55,68],fA:90},{L:[23,73],fA:0},{M:[55,68]}]};
// ---- Mobilità e allungamenti
S.mob_chin={vb:"26 18 60 40",r:6,d:1.2,hold:[.4,1.5],f:[{P:[56,70],t:180,A:[57,69],L:[56,100],hx:3},{hx:-2}]};
S.mob_incl={view:"front",vb:"14 0 92 61",d:1.4,hold:[.3,1.6,.3,1.6],f:[{P:[60,50],t:180,A:[73,50],L:[63,80],h:180},{h:146},{h:180},{h:214}]};
S.mob_trap={view:"front",vb:"14 0 92 61",d:1.4,hold:[.3,2],f:[{P:[60,50],t:180,A:[73,50],B:[47,50],L:[63,80],h:180,fr:0},{h:146,fr:.8,B:[64,12]}]};
S.mob_rot={view:"front",vb:"14 0 92 61",d:1.6,hold:.5,f:[{P:[60,50],t:180,A:[73,50],L:[63,80],fr:0},{fr:-1},{fr:0},{fr:1}]};
S.mob_catcow={s:FL,d:1.6,hold:.5,f:[{P:[42,57],t:105,h:105,A:[66,74],L:[26,74],fA:-90,c:0},{c:7,h:45},{c:0,h:105},{c:-6,h:140}]};
S.mob_hip={s:FL,d:1.6,hold:[.3,1.6],f:[{P:[52,55],t:180,A:[57,52],L:[72,74],M:[28,74],fM:-90},{P:[58,57],t:186,A:[63,54]}]};
S.mob_ham={s:FL,d:1.6,hold:[.3,1.6],f:[{P:[60,71],t:-90,A:[56,58],La:[140,140],M:[92,73],fA:90},{La:[172,172],A:[52,56]}],p:[{k:"band",from:"Lt",to:"A"}]};
S.mob_child={s:FL,d:1.8,hold:[.3,1.6],f:[{P:[42,57],t:105,A:[66,74],L:[26,74],fA:-90},{P:[34,66],t:97,A:[82,73],L:[18,74]}]};
S.mob_book={raw:`<line x1="0" y1="62" x2="120" y2="62" stroke="#2a2e38" stroke-width="1"/><g stroke="currentColor" stroke-width="3.3" stroke-linecap="round" fill="none"><line x1="36" y1="46" x2="78" y2="46" stroke-width="4.4"/><polyline points="78,46 90,32 104,40"/><line x1="38" y1="46" x2="38" y2="22" opacity=".42"/><line x1="38" y1="46" x2="38" y2="22"><animateTransform attributeName="transform" type="rotate" values="0 38 46;-165 38 46;-165 38 46;0 38 46" keyTimes="0;.42;.7;1" dur="5s" repeatCount="indefinite"/></line><circle cx="28" cy="46" r="5" fill="#15171c"/></g>`};
S.ytw.s="";
// ---- Riscaldamento
const TREAD=RC(18,75,76,4,"#4a505e",2)+LN(88,75,98,42,3)+RC(92,36,12,5,"#4a505e",2)+`<line x1="-20" y1="79.5" x2="160" y2="79.5" stroke="#2a2e38" stroke-width="2"/>`;
S.wu_tapis={s:TREAD,d:.42,hold:0,f:[{P:[56,42],t:176,A:[63,38],B:[48,40],L:[66,73.5],M:[46,73.5]},{P:[56,40.5],A:[56,41],B:[56,41],L:[58,66],M:[54,74]},{P:[56,42],A:[48,40],B:[63,38],L:[46,73.5],M:[66,73.5]},{P:[56,40.5],A:[56,41],B:[56,41],L:[54,74],M:[58,66]}]};
S.wu_marcia={s:FL,d:.45,hold:.05,f:[{P:[56,42],t:180,A:[64,35],B:[49,40],L:[62,58],M:[56,74]},{A:[56,41],B:[56,41],L:[56,74],M:[56,74]},{A:[49,40],B:[64,35],L:[56,74],M:[62,58]},{A:[56,41],B:[56,41],L:[56,74],M:[56,74]}]};
S.wu_jacks={view:"front",s:FL,d:.55,hold:.08,f:[{P:[60,42],t:180,Aa:[8,6],Ba:[-8,-6],L:[64,74],M:[56,74]},{P:[62,42],Aa:[150,168],Ba:[-150,-168],L:[78,74]},{P:[60,42],Aa:[8,6],Ba:[-8,-6],L:[64,74],M:[56,74]},{P:[58,42],Aa:[150,168],Ba:[-150,-168],M:[42,74]}]};
S.wu_braccia={s:FL,d:[.55,.55,.55,.55,.001],hold:0,f:[{P:[56,42],t:180,Aa:[0,0],L:[56,74]},{Aa:[90,90]},{Aa:[180,180]},{Aa:[270,270]},{Aa:[360,360]}]};
S.wu_anche={view:"front",s:FL,d:.7,hold:0,f:[{P:[64,43],t:187,A:[73,40],B:[56,40],L:[66,74],M:[54,74]},{P:[60,44.5],t:180,A:[69,42],B:[51,42]},{P:[56,43],t:173,A:[64,40],B:[47,40]},{P:[60,41.5],t:180,A:[69,39],B:[51,39]}]};
/* --- motore --- */
const live=new Set();
function svg(id){const sp=S[id];if(!sp)return "";
  const vb=sp.vb||"0 0 120 80",inner=sp.raw||`${sp.s||""}<g class="dyn">${draw(sp,poseAt(sp,0))}</g>`;
  return `<svg class="fig an" viewBox="${vb}" data-an="${id}" preserveAspectRatio="xMidYMid meet"><rect x="-50" y="-50" width="250" height="200" fill="#15171c"/>${inner}</svg>`}
let last=0;
function loop(ts){
  requestAnimationFrame(loop);
  if(document.hidden||ts-last<33)return;last=ts;
  const t=ts/1000;
  document.querySelectorAll("svg[data-an]").forEach(el=>{
    const sp=S[el.dataset.an];if(!sp||sp.raw)return;
    const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||r.width===0)return;
    const g=el.querySelector(".dyn");if(g)g.innerHTML=draw(sp,poseAt(sp,t*(sp.speed||1)));
  });
}
requestAnimationFrame(loop);
return {svg,has:id=>!!S[id],S,poseAt,draw};
})();
