import {onixSpine} from './middle.js';

const sides=[-1,1],sin=Math.sin,cos=Math.cos;
function pair(rig,name,pivot,accept) {
  return sides.map(s=>rig.part(`${name} ${s}`, [s*pivot[0],pivot[1],pivot[2]], m=>accept(m,s)));
}
function tagged(rig,name,pivot) {return rig.part(name,pivot,m=>m.tag===name);}

function dugtrio(rig) {
  const moles=[[-.47,.17],[.04,-.27],[.48,.30]].map(([x,z],i)=>tagged(rig,'mole'+(i-1),[x,.16,z]));
  return ({t,u,w,a,g,r,heavy})=>{
    moles.forEach((m,i)=>{
      const rhythm=(sin(t*2.6+i*2.1)+1)*.055;
      const pulse=heavy?.5+.5*cos(u*7.8-i*1.8):1-i*.19;
      m(.04*sin(t*2+i)+.15*a*pulse,0,.033*sin(t*2.6+i),0,rhythm-.32*w-.25*g+.37*a*pulse-.16*r,0);
    });
  };
}
function cats(rig,id) {
  const big=id===53;
  const tail=rig.part('curled tail',big?[0,.83,-.74]:[0,.49,-.21],m=>big?m.z<-.82:m.z<-.22&&m.y>.38);
  const paws=pair(rig,big?'foreleg':'paw',[big?.26:.23,big?.72:.87,big?.43:.02],(m,s)=>m.x*s>(big?.19:.22)&&m.y<(big?.73:.93)&&m.z>(big?.30:.04));
  const head=rig.part('head',[0,big?.96:1.01,big?.53:.02],m=>m.y>(big?.85:1.012));
  return ({t,w,a,g,r,special,heavy})=>{
    tail(.065*sin(t*2.3),(.20+.09*!big)*sin(t*(big?2.2:3.4))+(big?.59:-.69)*a, .07*cos(t*2.5)+.19*w);
    head(.075*sin(t*1.7)-.20*w+.29*a-.16*r, .12*sin(t*1.3)+(special?.42:.11)*a,big?.035*sin(t*1.7):.09*sin(t*1.7));
    paws.forEach((p,i)=>{const s=sides[i], lead=i===0||heavy||big;
      p(.035*sin(t*2.3+i*2)+(lead?(big?-.58:-.84)*a+.31*w:0)-.12*g, s*(lead?.34*a:0),s*(big?.09:.35)*g,0,lead?.10*a:0,lead?.055*a:0);
    });
  };
}
function ducks(rig,id) {
  const psy=id===54;
  const arms=pair(rig,'wing',[psy?.34:.24,psy?.87:1.04,0],(m,s)=>m.x*s>(psy?.35:.29)&&m.y>.48&&m.y<(psy?1.46:1.06));
  const head=rig.part('head',[0,1.08,.05],m=>m.y>1.06);
  const tail=!psy&&rig.part('swimming tail',[0,.66,-.30],m=>m.z<-.35);
  return ({t,w,a,g,r,heavy})=>{
    head((psy?.035:.07)*cos(t*2)-.25*w+.32*a-.20*r,psy?.09*sin(t*2.4):.13*sin(t*1.4),psy?.13*sin(t*2.6)+.08*g:.025*sin(t));
    arms.forEach((p,i)=>{const s=sides[i];
      if(psy) p(.12*sin(t*3.4+i)-.30*w+.34*a,s*.10*a,s*(.12*sin(t*3.4+i)+.24*w-.55*a+.20*g));
      else p(.16*sin(t*2+i*2.9)+.43*w-.67*a,s*(heavy?.44:.22)*a,s*(.16*cos(t*2+i*2.9)-.28*g));
    });
    if(tail) tail(.10*cos(t*2.8)-.19*w,.23*sin(t*2.8)-.48*a);
  };
}
function monkeys(rig,id) {
  const prime=id===57;
  const arms=sides.map(s=>tagged(rig,'boxing arm'+s,[s*.47,.99,0]));
  const tail=!prime&&rig.part('tail',[0,.68,-.36],m=>m.z<-.37);
  const feet=pair(rig,'leg',[.32,.60,-.02],(m,s)=>m.x*s>.25&&m.y<.55);
  return ({t,u,w,a,g,r,heavy})=>{
    arms.forEach((p,i)=>{const s=sides[i], hook=heavy?(.6+.4*cos(u*7.5+i*2.8)):i===0?1:.30;
      p((prime?.11:.17)*sin(t*(prime?5:3.5)+i*2)-.47*w-.62*a*hook,s*(.35*w-1.07*a*hook),s*(.20*sin(t*3.5+i*2.5)+.42*g+.12*r));
    });
    feet.forEach((p,i)=>p(-.09*Math.max(0,sin(t*4+i*Math.PI))-.26*a*(heavy&&i===1?1:.2),0,0,0,.03*Math.max(0,sin(t*4+i*Math.PI)),0));
    if(tail) tail(-.14*sin(t*3),.37*sin(t*3.5)-.75*a,.20*cos(t*3)+.33*w);
  };
}
function dogs(rig,id) {
  const big=id===59,z=big?.58:.45;
  const tail=rig.part('plume',[0,.82,big?-.76:-.61],m=>m.y>.80&&m.z<-.64);
  const fore=pair(rig,'foreleg',[big?.34:.28,.78,.31],(m,s)=>s*m.x>.19&&m.z>.17&&m.y<.71);
  const head=rig.part('mane and head',[0,.99,z-.10],m=>m.y>.88&&m.z>.09&&m.color!=='#4d4244');
  return ({t,w,a,g,r,heavy})=>{
    tail((big?.09:.14)*cos(t*3.7)+.18*w,(big?.24:.46)*sin(t*(big?2.65:4.35))+.48*a,.08*sin(t*3.5));
    head(.06*sin(t*1.8)-.37*w+(heavy?.57:.32)*a-.22*r,.09*sin(t*1.45)+.12*g,.045*cos(t*1.8));
    fore.forEach((p,i)=>p(-.03*Math.max(0,sin(t*2+i*3))-.33*w-(big?.36:.57)*a*(i===0?1:.50),0,sides[i]*.15*g,0,.055*a,0));
  };
}
function tadpoles(rig,id) {
  const baby=id===60,strong=id===62,w=strong?.65:.55;
  const spiral=rig.part('belly spiral',[0,(baby?.67:.90)-.075,.29],m=>m.color==='#343745');
  const tail=baby&&rig.part('tail fin',[0,.54,-.30],m=>m.z<-.33);
  const gloves=!baby&&pair(rig,'glove',[w*.78,1.03,0],(m,s)=>m.x*s>w*.79&&m.y>.60);
  return ({t,u,w:wind,a,g,r,special,heavy})=>{
    spiral(0,0,.082*sin(t*2.3)+(special?1.75:.43)*a-.36*wind,0,0,.005);
    if(tail) tail(.24*cos(t*3.7)-.31*wind+.32*g,.42*sin(t*3.7)+.82*a,.07*sin(t*2)-.22*r);
    if(gloves)gloves.forEach((p,i)=>{const s=sides[i],pulse=heavy?.65+.35*sin(u*9+i*2):i===0?1:.45;
      p(.09*sin(t*(strong?3.5:2.6)+i*2.5)+.39*wind-(strong?.90:.59)*a*pulse,s*(.22*wind-.84*a*pulse),s*(.15*cos(t*2.6+i)-.32*g+.30*r));
    });
  };
}
function psychics(rig,id) {
  const abra=id===63,alak=id===65;
  const arms=pair(rig,'forearm and implement',[.25,.98,.01],(m,s)=>s*m.x>.23&&m.z>-.01&&((m.y>.41&&m.y<1.035&&s*m.x>(abra?.255:.30))||m.color==='#acb4bd'||m.color==='#d7dcda'));
  const tail=!alak&&rig.part('tail',[0,.54,-.18],m=>m.z<-.24);
  const head=rig.part('head',[0,abra?1.01:1.20,.02],m=>m.y>(abra?1.02:1.13));
  return ({t,w,a,g,r,special})=>{
    head((abra?.12:.05)*cos(t*(abra?1.3:2))-.17*w+.23*a-.16*r,(alak?.15:.07)*sin(t*1.6),.045*sin(t*1.7));
    arms.forEach((p,i)=>{const s=sides[i],armed=alak||(!abra&&i===1);
      p(.09*sin(t*1.9+i*.8)-(.44+armed*.20)*w-(special?.93:.53)*a,s*(.17*sin(t*2+i)-.40*a),s*((armed?.22:.08)*cos(t*2.2+i)+.41*w-.53*a+.23*g));
    });
    if(tail)tail(-.17*cos(t*(abra?1.3:2.1))+.19*w,.22*sin(t*1.8)+(abra?.38:-.46)*a);
  };
}
function fighters(rig,id) {
  const basic=id===66,four=id===68, rows=four?[1.32,1.04]:[1.25];
  const arms=rows.flatMap(y=>sides.map(s=>({s,y,pose:tagged(rig,'arm'+s+'-'+y,[s*(basic?.27:.40),y,.015])})));
  const chest=rig.part('torso',[0,.76,0],m=>m.y>.84);
  return ({t,u,w,a,g,r,heavy,special})=>{
    chest(-.075*w+.115*a-.11*r,.065*sin(t*2)+(basic?.36:.27)*w-(basic?.48:.33)*a,.03*sin(t*2.5));
    arms.forEach(({s,y,pose},i)=>{
      const beat=four?.55+.45*cos(u*(heavy?11:7)+i*1.8):i===0?1:heavy?.76:.32;
      const flex=basic?.22:id===67?.38:y>1.2?.29:.18;
      pose((basic?.13:.08)*sin(t*2.7+i)+.27*w-(special?.91:.58)*a*beat,s*(flex*w-(basic?.81:1.20)*a*beat),s*(flex*cos(t*2.4+i*.9)+.48*g+(four&&y<1.2?-.28:.19)*a));
    });
  };
}
function pitchers(rig,id) {
  const sprout=id===69,large=id===71,c=sprout?'#84ab62':'#648f53';
  const leaves=pair(rig,'leaf',[sprout?0:.35,sprout||large?.94:1.02,-.04],(m,s)=>m.color===c&&s*m.x>0);
  const lid=large&&rig.part('lid',[0,1.68,-.29],m=>m.color==='#84ab62'&&m.z>-.20);
  const upper=sprout?rig.part('flower and top stem',[0,.94,0],m=>m.y>.98):rig.whole('pitcher',[0,.41,0]);
  return ({t,w,a,g,r,special})=>{
    const rocking=sin(t*(sprout?2.3:1.6));
    upper((sprout?.10:.055)*cos(t*1.9)-.31*w+(sprout?.62:.41)*a-.16*r,(sprout?.14:.07)*rocking,(sprout?.21:.085)*rocking-.15*w+.16*a,0,0,0,1+.07*w,1-.08*w+.05*a,1+.07*w);
    leaves.forEach((p,i)=>p(.22*sin(t*2.7+i*2)+.30*w-.44*a,sides[i]*.16*a,sides[i]*(.22*cos(t*2.3+i)+.53*g+(special?.88:.52)*a)));
    if(lid)lid(-.13+.10*cos(t*2.4)-.79*w-1.11*a+.30*g);
  };
}
function jellyfish(rig,id) {
  const large=id===73,n=large?10:2,y=large?1.65:1.19,w=large?.60:.48;
  const limbs=Array.from({length:n},(_,i)=>{const a=large?i*2*Math.PI/n:(i?1:-1)*Math.PI*.5;
    return {a,pose:tagged(rig,'tentacle'+i,[sin(a)*w*.68,y-.35,cos(a)*.22])};});
  const bell=rig.part('bell',[0,y-.31,0],m=>!m.tag);
  return ({t,u,w:wind,a,g,r})=>{
    const pulse=.5+.5*cos(t*(large?2.3:3.2));
    bell(.05*cos(t*2)-.15*wind+.20*a,0,.045*sin(t*2.1),0,0,0,1+.05*pulse+.12*wind,1-.065*pulse-.13*wind+.09*a,1+.05*pulse+.12*wind);
    limbs.forEach(({a:angle,pose})=>{const wave=.19*sin(t*(large?2.6:3.2)+angle);const flare=.43*wind-.55*a*(.75+.25*cos(u*7+angle));
      pose(cos(angle)*(wave+flare)-.34*a, .11*sin(t*2+angle),-sin(angle)*(wave+flare+.27*g)+.1*r);
    });
  };
}
function rocks(rig,id) {
  const geo=id===74,grav=id===75,y=geo?.65:.88, rows=grav?[y+.12,y-.17]:[y+.04];
  const fists=rows.flatMap((sy,j)=>sides.map(s=>({s,j,pose:rig.part('arm '+s+' '+j,[s*(geo?.39:.52),sy,.01],m=>s*m.x>(geo?.49:.55)&&(!grav||(j===0?m.y>.85:m.y<=.85)))})));
  const shell=id===76&&rig.part('plated shell',[0,.88,-.05],m=>['#847a69','#786f61','#938779'].includes(m.color));
  const head=id===76&&rig.part('tortoise head',[0,1.06,.38],m=>m.z>.39&&m.y>.88);
  return ({t,w,a,g,r,special,heavy})=>{
    fists.forEach(({s,j,pose},i)=>{
      const round=id===76, strength=grav?(j?.66:1):1;
      pose((geo?.16:.06)*sin(t*(geo?2.8:1.9)+i)+.46*w-(heavy?.96:.65)*a*strength,s*(.29*w-(round?.37:.64)*a),s*((geo?.17:.07)*cos(t*2+i)+.55*g+(round?.49:0)*a-.31*r));
    });
    if(shell) shell(.025*sin(t*1.8)-.13*w+(special?.58:.28)*a, .05*cos(t*1.6)+.26*a,.03*r);
    if(head)head(.08*cos(t*1.7)-.17*w+.22*a, .12*sin(t*1.3),0,0,-.05*g,-.11*w+.10*a);
  };
}
function horses(rig,id) {
  const rapid=id===78,y=rapid?1.10:.90;
  const legs=[-.51,.34].flatMap((z,j)=>sides.map(s=>({j,s,pose:rig.part('leg '+s+' '+j,[s*.21,y-.03,z],m=>s*m.x>.12&&m.y<y-.16&&(j?m.z>.07:m.z<-.24))})));
  const tail=rig.part('flaming tail',[0,y+.09,-.61],m=>m.z<-.66&&m.y>y-.14);
  const neck=rig.part('neck and mane',[0,y+.11,.28],m=>m.y>y+.13&&m.z>-.35);
  return ({t,w,a,g,r,heavy})=>{
    neck((rapid?.07:.11)*sin(t*2)-.35*w+(rapid?.69:.40)*a-.13*r,.075*cos(t*1.8),.035*sin(t*2.4));
    tail(.15*cos(t*3.5)+.29*w-.34*a,(rapid?.20:.31)*sin(t*3.1)+.45*a,.08*cos(t*3.7));
    legs.forEach(({j,s,pose})=>{const footfall=Math.max(0,sin(t*(rapid?3.1:2.3)+s*(j?1.58:-1.58)));
      const kick=j?(s===-1||heavy?-.93:-.32):.16;
      pose(-.15*footfall+kick*w+(j?.31:-.17)*a,0,s*.055*g,0,.055*footfall+(j?.11:.02)*w,0);
    });
  };
}
function slows(rig,id) {
  const bro=id===80,z=bro?.12:.51;
  const tail=rig.part(bro?'Shellder and tail':'fishing tail',bro?[0,.54,-.35]:[0,.51,-.65],m=>m.z<(bro?-.37:-.70));
  const head=rig.part('head',[0,bro?1.19:.61,z-.085],m=>bro?m.y>1.13:m.y>.56&&m.z>.23);
  const arms=bro&&pair(rig,'arm',[.34,.96,0],(m,s)=>m.x*s>.36&&m.y>.66&&m.y<1.05);
  return ({t,w,a,g,r})=>{
    tail((bro?.07:.16)*sin(t*(bro?1.5:2.4))+.29*w-(bro?.48:.75)*a,.17*sin(t*(bro?1.25:1.7))+.33*a,bro?.09*cos(t*1.4):.07*cos(t*2));
    head(.09*cos(t*(bro?1.3:.95))-.24*w+.29*a-.16*r,.10*sin(t*1.0)+.03*a,(bro?.09:.055)*sin(t*1.33)+.11*g);
    if(arms) arms.forEach((p,i)=>p(.055*sin(t*1.4+i)-.25*w-.57*a,sides[i]*.20*a,sides[i]*.24*g));
  };
}
function magnets(rig,id) {
  if(id===81) {
    const poles=pair(rig,'magnet axle',[.375,.45,-.035],(m,s)=>s*m.x>.31&&m.z<0);
    const rotor=rig.part('screw',[0,.79,0],m=>m.y>.76);
    const cluster=rig.whole('magnetic float',[0,.45,0]);
    return ({t,w,a,g,r,special})=>{
      poles.forEach((p,i)=>p(sides[i]*(t*1.7+(special?4.8:2.2)*a),0,sides[i]*(.15*cos(t*2.3)-.28*w)));
      rotor(0,t*3.1+4.1*a);
      cluster(.045*sin(t*2)-.28*w+.23*a,.10*sin(t*1.5),.075*sin(t*2.5)+.20*r,0,.072+.06*cos(t*2.1)+.06*w-.047*g,.09*a);
    };
  }
  const pivots=[[-.34,.40,.035],[.34,.40,-.06],[0,.94,.008]];
  const units=['left orb','right orb','top orb'].map((n,i)=>tagged(rig,n,pivots[i]));
  return ({t,w,a,g,r,special})=>units.forEach((p,i)=>{
    const x=pivots[i][0],d=i===2?1:-.5,phase=i*2*Math.PI/3;
    p(.12*sin(t*2.4+phase)-.18*w+(special?.39:.24)*a,.16*cos(t*2+phase),.12*sin(t*2.6+phase)+(i-1)*.30*a,x*(.15*cos(t*2+phase)-.24*w+.38*a),.09+.043*sin(t*2.4+phase)+d*(.08*a-.055*g),.035*cos(t*2+phase)+.13*a-.04*r);
  });
}
function farfetch(rig) {
  const sword=rig.part('leek and sword wing',[-.32,.80,.01],m=>['#ebe4bb','#599759','#78a665'].includes(m.color)||(m.x<-.27&&m.y>.65&&m.y<.88));
  const wing=rig.part('balancing wing',[.27,.85,-.01],m=>m.x>.29&&m.y>.66&&m.y<.88);
  const head=rig.part('pecking head',[0,1.04,.05],m=>m.y>1.05&&m.z>-.18);
  return ({t,w,a,g,r,heavy})=>{
    sword(.15*sin(t*2.3)-.59*w+.89*a,.16*cos(t*1.7)-.65*w+1.16*a,.12*sin(t*2.1)+.76*w-(heavy?1.53:.84)*a-.44*g);
    wing(.10*sin(t*1.8)+.35*w-.40*a,-.10*a,.19*cos(t*2.1)+.62*a+.21*g);
    head(.055*cos(t*2.7)-.29*w+.49*a-.17*r,.12*sin(t*1.4)+.20*a);
  };
}
function ostriches(rig,id) {
  const trio=id===85,xs=trio?[-.44,0,.46]:[-.33,.35];
  const necks=xs.map((x,i)=>tagged(rig,'neck'+i,[x*.40,.97,-.04]));
  const legs=pair(rig,'running leg',[.19,.65,0],(m,s)=>s*m.x>.08&&m.y<.56);
  return ({t,u,w,a,g,r,heavy})=>{
    necks.forEach((p,i)=>{const phase=i*(trio?2.1:Math.PI),beat=heavy?.66+.34*cos(u*10+phase):i===0?1:.50;
      p(.12*sin(t*(trio?2.8:2.3)+phase)-.42*w+.87*a*beat-.18*r,.16*cos(t*2+i)-.14*w+.21*a*beat,.075*sin(t*2+phase)+(i-(trio?1:.5))*.21*g);
    });
    legs.forEach((p,i)=>{const v=Math.max(0,sin(t*(trio?4.1:3.1)+i*Math.PI));p(-.21*v-.35*a*(i===0?1:.32),0,0,0,.065*v,0);});
  };
}
function seals(rig,id) {
  const dew=id===87;
  const tail=rig.part('flukes',[0,.53,-.55],m=>m.z<-.60);
  const fins=pair(rig,'flipper',[.26,.44,.015],(m,s)=>s*m.x>.31&&m.y<.51&&m.z>-.11);
  const head=rig.part('head and horn',[0,.61,.25],m=>m.z>.25&&m.y>.57);
  return ({t,w,a,g,r,heavy})=>{
    tail((dew?.39:.27)*sin(t*(dew?2.6:2.1))+.51*w-(heavy?.91:.57)*a,.12*cos(t*2)-.29*a,(dew?.13:.07)*cos(t*2.4));
    fins.forEach((p,i)=>p(.17*cos(t*2.6+i*(dew?.6:2.6))+.27*w-.33*a,sides[i]*(.23*sin(t*2.4+i)+.53*a),sides[i]*(.15*sin(t*2.3+i)-.53*w+.39*g)));
    head(.115*cos(t*(dew?2.6:1.6))-.33*w+.38*a-.22*r,.11*sin(t*1.7));
  };
}
function sludge(rig,id) {
  const muk=id===89,x=muk?-.23:0;
  const hands=sides.map(s=>tagged(rig,'ooze arm'+s,[x+s*.34,.76,0]));
  const crown=rig.part('rising slime',[x,.37,0],m=>m.y>.47);
  return ({t,w,a,g,r,heavy})=>{
    const ripple=.5+.5*sin(t*(muk?1.7:2.5));
    crown(.03*cos(t*2)-.16*w+.22*a-.18*r,.05*sin(t*2),.08*sin(t*1.8),.035*sin(t*1.6),0,0,1+.08*ripple+.17*w,1-.08*ripple-.20*w+.25*a,1+.06*ripple+.15*w);
    hands.forEach((p,i)=>{const s=sides[i],dominant=muk?i===0:i===1;
      p(.17*sin(t*2.5+i*2)-.53*w+(dominant?-.96:-.43)*a,s*(.22*cos(t*1.9+i)-.55*a),s*(.18*sin(t*2.6+i)+.35*g+.42*w),0,0,(heavy?.13:.06)*a,1,1+(dominant?.27:.12)*a,1);
    });
  };
}
function shells(rig,id) {
  if(id===90) {
    const lid=rig.part('upper valve',[0,.53,-.26],m=>['#a299bb','#8b83a4'].includes(m.color)&&m.y>.57);
    const tongue=rig.part('tongue',[0,.42,.27],m=>m.color==='#de92a3'||m.color==='#bc7389');
    return ({t,w,a,g,r})=>{lid(-.09-.10*cos(t*2.1)-.55*w+.36*a+.36*g,.022*sin(t*2),.040*r);tongue(.17*sin(t*2.5)-.19*w+.29*a,0,0,0,0,.15*a-.09*g,1,1,1+.24*a-.20*g);};
  }
  const inner=rig.part('pearl core',[0,.92,.23],m=>m.color==='#4e455e'||m.z>.35);
  const valves=pair(rig,'armored valve',[0,.93,-.22],(m,s)=>s*m.x>.003&&m.z<.34);
  return ({t,w,a,g,r})=>{
    valves.forEach((p,i)=>p(.03*sin(t*1.7+i),sides[i]*(.06+.055*cos(t*1.8)+.38*w-.24*a-.27*g),0));
    inner(.07*sin(t*2.2)-.19*w+.29*a,.14*sin(t*1.5),.08*r,0,.023*cos(t*1.8),-.13*w+.17*a-.12*g);
  };
}
function ghosts(rig,id) {
  if(id===92) {
    const gas=rig.part('gaseous envelope',[0,.79,-.13],m=>m.z<-.07);
    const core=rig.part('levitating core',[0,.79,0],()=>true);
    return ({t,w,a,g,r,special})=>{
      const swell=.08*sin(t*2.4)+.21*w-.09*a;
      gas(.07*cos(t*1.9),.12*sin(t*2),t*.32+(special?1.15:.66)*a, .033*sin(t),.075+.055*sin(t*2.3),0,1+swell,1-swell*.33,1+swell);
      core(.09*sin(t*2)-.25*w+.32*a,.17*cos(t*1.7),.055*cos(t*2.1)-.22*r,0,.075+.048*sin(t*2.3)-.045*g,.15*a);
    };
  }
  const haunter=id===93;
  const hands=pair(rig,haunter?'floating claw':'arm',[haunter?.69:.41,haunter?.66:.96,haunter?.22:0],(m,s)=>s*m.x>(haunter?.49:.45)&&m.y<.99&&m.z>(haunter?.11:-.015));
  const body=rig.part(haunter?'floating head':'spined back',[0,haunter?.97:.54,0],m=>haunter||m.y>.48);
  return ({t,w,a,g,r,heavy,special})=>{
    hands.forEach((p,i)=>{const s=sides[i],reach=(i===0||heavy)?1:.41;
      p(.16*sin(t*2.8+i)-.35*w-.93*a*reach,s*(.21*cos(t*2+i)-.65*a*reach),s*(.23*sin(t*2.4+i)+.33*g),s*(haunter?.042*sin(t*2+i):0),haunter?.065*cos(t*2.3+i)-.06*w:0,(haunter?.46:.045)*a*reach);
    });
    body(.07*sin(t*2.1)-.23*w+.27*a-.14*r,.10*cos(t*1.6)+(special?.34:.15)*a,.045*sin(t*1.9),0,(haunter?.09+.05*sin(t*2.1):.016*cos(t*2.1))-.05*g,haunter?.09*a:0);
  };
}
function onix(rig) {
  const joints=onixSpine.map(([x,y,z],i)=>i===0?rig.part('horned head',[x,y,z],m=>!m.tag):tagged(rig,'stone'+i,[x,y,z]));
  return ({t,w,a,g,r,heavy})=>{
    // The sixth stone bears the neck's weight. Propagate rotations from it to
    // the skull so adjacent boulders retain their spacing throughout the blow.
    let [x,y,z]=onixSpine[6];
    for(let i=5;i>=0;i--){
      const p=onixSpine[i],base=onixSpine[i+1],gain=(6-i)/6;
      const pitch=gain*(.12*sin(t*1.45-i*.19)-.39*w+(heavy?.64:.50)*a-.31*r);
      const roll=gain*(.18*sin(t*1.13-i*.15)+.24*w-.28*a+.10*g);
      const dx=p[0]-base[0],dy=p[1]-base[1],dz=p[2]-base[2];
      const vx=dx*cos(roll)-dy*sin(roll),vy=dx*sin(roll)+dy*cos(roll);
      x+=vx;y+=vy*cos(pitch)-dz*sin(pitch);z+=vy*sin(pitch)+dz*cos(pitch);
      joints[i](pitch,i===0?.12*cos(t*1.2):0,roll,x-p[0],y-p[1],z-p[2]);
    }
    for(let i=6;i<joints.length;i++){
      const gain=(i-6)/9,wave=sin(t*2.5-i*.33);
      joints[i](gain*.07*wave,gain*(.16*wave+.32*a),0,0,gain*(.035+.03*wave+.06*w),gain*(.09*wave-.16*a));
    }
  };
}
function tapirs(rig,id) {
  const hyp=id===97;
  const charm=hyp&&rig.part('pendulum',[.70,1.22,.381],m=>m.color==='#6b6557'||m.color==='#c2c9c9');
  const trunk=rig.part('trunk',[0,1.395,.23],m=>m.z>.28&&Math.abs(m.x)<.07&&m.y<1.410);
  const hands=pair(rig,'hypnotic hand',[.28,1.02,-.01],(m,s)=>m.x*s>.29&&m.y>.60&&m.y<(hyp?1.32:1.05)&&m.color!=='#fff1ce');
  return ({t,w,a,g,r,special})=>{
    const sway=sin(t*(hyp?2.6:1.8));
    trunk((hyp?.12:.25)*cos(t*1.9)-.48*w+.62*a,.20*sway,.09*cos(t*2.3)-.13*r);
    hands.forEach((p,i)=>{
      const s=sides[i],right=hyp&&i===1;
      if(right) {
        // Keep the suspension point on the hand as the shoulder turns.
        const tilt=.11*sway+.18*w-.16*a+.15*g;
        p(0,0,tilt);
        const dx=.70-.28,dy=1.22-1.02;
        charm(.08*cos(t*2.6),.06*cos(t*1.3),tilt+(.58+.28*w+(special?.50:.22)*a)*sway,
          dx*cos(tilt)-dy*sin(tilt)-dx,dx*sin(tilt)+dy*cos(tilt)-dy,0);
      } else p(.14*sin(t*2+i)-.24*w-.59*a,s*(.14*cos(t*2.3+i)-.24*a),s*(.11*sway+.26*g+.43*w));
    });
  };
}
function crabs(rig,id) {
  const king=id===99;
  // Finger joints rotate about the claw itself, leaving the palm and foreleg
  // together. A swinging palm carries both finger pivots through the same arc.
  const clamps=sides.map(s=>{
    const huge=king&&s===-1,mult=huge?1.74:1,x=s*(huge?.95:.78),y=huge?.91:.73;
    const fingers=sides.map(j=>rig.part('pincer '+s+' '+j,[x+j*.10*mult,y+.08*mult,.17],m=>s*m.x>.51&&(m.x-x)*j>0&&m.y>y+.10*mult&&m.z>.12));
    const arm=rig.part('claw '+s,[s*.35,.56,.14],m=>s*m.x>.34&&m.z>.15&&m.y>.48);
    return {s,huge,mult,x,y,fingers,arm};
  });
  const eyes=pair(rig,'eye stalk',[.205,.70,.14],(m,s)=>s*m.x>.13&&s*m.x<.31&&m.y>.75&&m.z>.13);
  return ({t,w,a,g,r,heavy})=>{
    clamps.forEach(({s,huge,mult,x,y,fingers,arm})=>{
      const weight=huge?1.22:king?.57:.86;
      const lift=s*(.07*sin(t*2.3+s)+.40*w-weight*.47*a+.19*g);
      const thrust=.11*sin(t*2.1+s)-.33*w+.64*a*weight;
      arm(thrust,0,lift);
      fingers.forEach((p,i)=>{
        const j=sides[i],dx=x+j*.10*mult-s*.35,dy=y+.08*mult-.56,dz=.03;
        const localX=cos(lift)*dx-sin(lift)*dy,localY=sin(lift)*dx+cos(lift)*dy;
        const gape=j*(.11*sin(t*2.8+s)+.38*w-(heavy?.78:.50)*a-.20*g);
        p(thrust,0,lift+gape,localX-dx,cos(thrust)*localY-sin(thrust)*dz-dy,sin(thrust)*localY+cos(thrust)*dz-dz);
      });
    });
    eyes.forEach((p,i)=>p(.08*cos(t*1.7+i)-.15*w+.21*a,0,sides[i]*(.095*sin(t*2+i)-.12*g+.15*r)));
  };
}
function orbs(rig,id) {
  const electrode=id===101;
  const eyes=pair(rig,electrode?'eyebrow':'eye',[.20,.76,.56],(m,s)=>s*m.x>.04&&m.z>.40&&m.y>.68);
  const ball=rig.whole('rolling body',[0,.64,0]);
  return ({t,w,a,g,r,heavy,special})=>{
    const sway=(electrode?.14:.085)*sin(t*(electrode?3.2:2.3));
    eyes.forEach((p,i)=>p(0,0,sides[i]*(.07*sin(t*2.2)+.26*w-.18*a),0,-.025*g,0));
    ball(-.10*cos(t*2.3)-.48*w+(heavy?2.1:special?.58:1.64)*a,.08*sin(t*1.6)+(electrode?.38:.19)*a,sway+.19*r,sway*.25, .024*cos(t*2.6)+.11*a-.07*g,.19*a-.06*w,1+.09*w+.08*g,1-.11*w-.09*g,1+.05*w);
  };
}
export function middleMotion(id,rig) {
  if(!Number.isInteger(id)||id<51||id>101)throw new RangeError('Unknown middle motion '+id);
  const families=[[51,dugtrio],[53,cats],[55,ducks],[57,monkeys],[59,dogs],[62,tadpoles],[65,psychics],[68,fighters],[71,pitchers],[73,jellyfish],[76,rocks],[78,horses],[80,slows],[82,magnets],[83,farfetch],[85,ostriches],[87,seals],[89,sludge],[91,shells],[94,ghosts],[95,onix],[97,tapirs],[99,crabs],[101,orbs]];
  const pose=families.find(([upper])=>id<=upper)[1](rig,id);
  return ({t,u,wind,strike,recoil,kind})=>{
    const guard=kind==='guard';
    pose({t,u,w:guard?wind*.35:wind,a:guard?0:strike,g:guard?Math.max(wind,strike):0,r:recoil,heavy:kind==='heavy',special:kind==='special'});
  };
}
