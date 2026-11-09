// Joint pivots stay in the original sculpt coordinates, before metre normalization.
const sin = Math.sin, sides = [-1, 1];
const tagged = name => record => record.tag === name;
function paired(rig, name, [x,y,z], matches) {
  return sides.map(s => [s, rig.part(name+s, [s*x,y,z], v => matches(v,s))]);
}
function taggedPair(rig, name, pivot) {
  return paired(rig,name,pivot,(v,s)=>v.tag===name+s);
}
function eggs(r) {
  const centers=[[-.62,.1,.1],[.66,.06,.12],[-.4,.04,-.45],[.26,.13,-.52],[.1,.03,.51],[-.06,.16,-.02]];
  const shells=centers.map((p,i)=>r.part('shell'+i,p,tagged('egg'+i)));
  return ({t,w,a,h,g})=>shells.forEach((set,i)=>{
    const rock=sin(t*2.4+i*1.7), delay=.55+.45*sin(i*1.6);
    set(.055*rock-.23*w+.35*a,.055*sin(t+i),.09*rock+.16*h,0,.035*Math.max(0,rock)+a*delay*.30,delay*a*.21,1+.04*g,1-.07*(w+g),1);
  });
}
function palm(r) {
  const leaves=r.part('fronds',[0,2.16,0],v=>v.color==='#46834b');
  const heads=r.part('fruit',[0,1.75,0],v=>v.y>1.55);
  const trunk=r.part('trunk',[0,.43,0],v=>v.y>.43);
  return ({t,w,a,h,g})=>{
    const roll=.035*sin(t*1.4); trunk(.03*sin(t)-.085*w+.1*a,0,roll);
    heads(.07*sin(t*1.4-.25)-.18*w+.24*a,0,roll*1.7,.07*sin(t*1.4),-.04*g,.08*a);
    leaves(.14*sin(t*1.4-.7)-.26*w+.29*a,.07*sin(t),roll*2+.09*h,.07*sin(t*1.4),-.05*g,.10*a);
  };
}
function bone(r,evolved) {
  const club=r.part('bone club',[.57,.70,.25],tagged('club'));
  const skull=r.part('skull',[0,evolved?1.10:.98,.01],v=>v.y>(evolved?1.14:1.00));
  const tail=r.part('tail',[0,.45,-.24],v=>v.z<-.33);
  return ({t,w,a,h,g,special})=>{
    club(-.1+.10*sin(t*2.2)-.88*w+1.23*a,-.12+w*(evolved?.72:.28)-a*(evolved?1.18:.40),.07*sin(t*1.5)+.31*w-.35*a+.4*g);
    skull(.075*sin(t*1.9)+.23*w-.20*a+.17*g,evolved?.15*sin(t)-.27*w+.34*a:.08*sin(t),.075*sin(t*1.3)+.18*h);
    tail(-.06*sin(t*1.8),.20*sin(t*2.4)+.43*w-(special?.79:.35)*a);
  };
}
function kickboxer(r) {
  const leg=r.part('spring leg',[.24,.98,0],v=>v.x>.05&&v.y<1);
  const guards=paired(r,'guard',[.40,1.43,0],(v,s)=>v.x*s>.46&&v.y>1);
  return ({t,w,a,h,g})=>{
    leg(-.13+.11*sin(t*2.9)+.39*w-1.05*a,.18*w-.28*a,.09+.13*sin(t*1.4),0,0,0,1,1-.18*w+.28*a,1+.50*a);
    for(const [s,arm] of guards) arm(.12*sin(t*3+s)-.32*g-.22*w,-s*(.09*sin(t*2)+.32*a),s*.14*a+s*.13*h);
  };
}
function boxer(r) {
  const arms=paired(r,'glove',[.38,1.18,0],(v,s)=>v.x*s>.39&&v.y>.80);
  const head=r.part('head',[0,1.33,0],v=>v.y>1.32);
  return ({t,w,a,h,g,special})=>{
    for(const [s,arm] of arms){
      const leading=s>0||special;
      arm(.12*sin(3.8*t+s)-.40*g+(leading?.48*w-.92*a:-.31*w+.29*a),
        s*(.17*sin(2.9*t+s)+(leading?.59*w-.72*a:.18*a)),s*(.16*g+.10*h),0,0,leading?.15*a:0);
    }
    head(.055*sin(3.8*t)+.10*g,-.12*sin(2.9*t)-.18*w+.24*a,.11*sin(2.9*t)+.10*h);
  };
}
function tongue(r) {
  const tongue=r.part('tongue',[0,1.11,.54],v=>v.color==='#eb8598');
  const tail=r.part('counterweight',[0,.56,-.20],v=>v.z<-.28);
  return ({t,w,a,h,g})=>{
    tongue(-.06*sin(2.8*t)+.48*w-1.04*a+.20*g,.16*sin(2.1*t)+.27*h,.04*sin(3.4*t),0,0,0,1-.17*a,1-.24*w+.37*a,1-.27*w+.64*a);
    tail(-.06*sin(2*t)+.27*w-.34*a,.15*sin(1.7*t)-.27*h);
  };
}
function gas(r,evolved) {
  const main=r.part('gas globe',evolved?[-.32,1.04,0]:[0,.79,0],tagged('globe'));
  const small=evolved?r.part('small chamber',[.22,.79,.03],tagged('satellite')):null;
  return ({t,w,a,h,g})=>{
    const breath=.025*sin(2.6*t), size=1+breath+.15*w-.12*a+.055*g;
    main(.06*sin(1.8*t)+.16*a,.17*sin(t*1.4),.08*sin(1.5*t)+.20*h,0,.045*sin(1.8*t),-.08*w+.10*a,size,size,size);
    if(small) small(-.13*sin(t*1.8)-.22*w,-.13*sin(t),.15*sin(t*1.8-.6)-.31*w+.47*a,0,.035*sin(t*1.8),-.06*w,1-breath+.09*a,1-breath+.12*a,1-breath+.09*a);
  };
}
function rhino(r,evolved) {
  const head=r.part('armored head',evolved?[0,1.57,.04]:[0,.78,.34],v=>evolved?v.y>1.52:v.y>.56&&v.z>.28);
  const action=evolved?paired(r,'forearm',[.41,1.40,0],(v,s)=>v.x*s>.40&&v.y>.75):
    paired(r,'front paw',[.35,.60,.48],(v,s)=>v.x*s>.26&&v.z>.28&&v.y<.55);
  return ({t,w,a,h,g,special})=>{
    head(.045*sin(t*1.7)+.39*w-.36*a+.16*g,(evolved?.12:.045)*sin(t)-.17*w+.21*a,.07*h);
    for (const [s,p] of action) {
      if(evolved) p(.08*sin(t*1.8+s)+.46*w-(s>0||special?.74:.27)*a,-s*.19*g,s*.12*a);
      else p((s>0?.13:.025)*Math.max(0,sin(t*2.3+s))-.46*w+.28*a,0,0,0,(s>0?.052:0)*Math.max(0,sin(t*2.3+s)),0);
    }
  };
}
function chansey(r) {
  const egg=r.part('pouch egg',[0,.58,.47],v=>v.color==='#f9eed1');
  const arms=paired(r,'embrace',[.42,.83,.10],(v,s)=>v.x*s>.42&&v.y>.65&&v.y<.95);
  const locks=paired(r,'head tassels',[.46,1.30,0],(v,s)=>v.x*s>.43&&v.y>.95);
  return ({t,w,a,h,g})=>{
    egg(.04*sin(t*1.5)-.18*w+.25*a,0,.06*sin(t*2),0,.013*sin(t*2.8)+.22*a-.06*(w+g),.08*a);
    for(const [s,arm] of arms) arm(-.12*sin(t*2.4+s)-.46*w-.58*g+.5*a,-s*(.12+.55*g+.31*w),s*.17*a);
    for(const [s,l] of locks) l(0,.07*sin(t+s),s*(.10*sin(t*2.4)-.18*w+.35*a+.16*h));
  };
}
function vines(r) {
  const ropes=Array.from({length:12},(_,i)=>r.part('vine'+i,[0,1.15,0],tagged('vine'+i)));
  return ({t,w,a,h,g})=>ropes.forEach((move,i)=>{
    const angle=i*Math.PI/6, front=Math.max(0,Math.cos(angle));
    move(.045*sin(2.6*t+i)+front*(.30*w-.56*a),.065*sin(2.1*t+i*.7)+.19*w-.21*a,.042*sin(t*2.9+i)+h*.10,
      0,0,front*.14*a,1+.035*g,1-.08*w+.15*front*a,1+.30*front*a);
  });
}
function kangaroo(r) {
  const baby=r.part('joey',[0,.87,.53],v=>v.z>.45&&v.y>.88&&v.y<1.28);
  const tail=r.part('tail',[0,.75,-.23],v=>v.z<-.32);
  const claws=paired(r,'forepaw',[.45,1.39,0],(v,s)=>v.x*s>.46&&v.y>.85&&v.y<1.44);
  return ({t,w,a,h,g})=>{
    baby(-.10*sin(t*2.7)+.21*w,.23*sin(t*1.8),.055*sin(t),0,.034*sin(t*2.7)-.13*(w+g)+.07*a);
    tail(-.07*sin(t*1.6)-.33*w+.42*a,.15*sin(t*1.4));
    for(const [s,p] of claws) p(.07*sin(t*1.6+s)+.36*w-(s>0?.94:.48)*a-.48*g,-s*.30*g,s*.12*h);
  };
}
function seahorse(r,evolved) {
  const snout=r.part('nozzle',[0,1.42,.26],v=>v.z>.45&&v.y>1.32);
  const fins=paired(r,'pectoral fin',[.18,1.00,-.14],(v,s)=>v.color==='#eddb99'&&s*v.x>0);
  const curl=r.part('coiled tail',[0,.68,-.06],v=>v.y<.64&&v.z<-.07);
  return ({t,w,a,h,g})=>{
    snout(.08*sin(t*1.8)+.24*w-.22*a,.06*sin(t*1.4),0,0,0,0,1+.11*w,1+.11*w,1-.24*w+(evolved?.53:.33)*a);
    curl(.18*sin(t*2.1)+.44*w-.49*a,.15*sin(t*1.6),.10*h);
    for (const [s,f] of fins) f(.13*sin(t*5.2+s),s*(.32*sin((evolved?6.1:5.2)*t)+.50*w-.62*a+.24*g));
  };
}
function fish(r,evolved,karp=false) {
  const tail=r.part('tail fin',[0,.89,-.53],v=>v.z<-.55);
  const fins=paired(r,'pectoral',[.25,.86,.09],(v,s)=>v.x*s>.27&&v.z<.2&&v.y>.58&&v.mesh.geometry.type==='BufferGeometry');
  const body=r.whole('swimmer',[0,.89,0]);
  return ({t,w,a,h,g})=>{
    tail(.075*sin(t*2),(.25+.06*Number(evolved))*sin(t*(karp?4.8:3.2))-.54*w+.77*a,.07*h);
    for(const [s,f] of fins) f(.13*sin(3*t+s),s*.20*sin(3.5*t+s),s*(.21*sin(2.8*t)+.45*w-.67*a+.21*g));
    if(karp) body(-.15*sin(3*t)-.54*w+.69*a,0,.19*sin(4.4*t)+1.13*a,.03*sin(t),.06*Math.abs(sin(3*t))+.36*a,.22*a);
    else body(.055*sin(t*1.8)+(evolved?.33:.20)*w-(evolved?.43:.24)*a,.07*sin(t*2.3)+.16*w-.21*a,.06*sin(t)+.17*h,0,0,.20*a-.11*w);
  };
}
function starfish(r,evolved) {
  const front=r.part('front star',[0,1,.08],v=>v.color===(evolved?'#8a7cb9':'#bc915f'));
  const rear=evolved?r.part('rear star',[0,1,-.13],v=>v.color==='#6d659d'):null;
  const gem=r.part('core',[0,1,.29],v=>v.color==='#d95267'||v.color==='#ffd2bf');
  return ({t,w,a,h,g})=>{
    front(.08*sin(t*1.4),.08*sin(t),.13*sin(1.9*t)-.58*w+a*(evolved?2.24:1.76));
    if(rear) rear(0,0,-.18*sin(1.9*t)+.73*w-2.17*a);
    const pulse=1+.055*sin(t*3)+.24*w+.33*a+.12*g;
    gem(0,0,.14*h,0,0,.048*a,pulse,pulse,pulse);
  };
}
function mime(r) {
  const arms=paired(r,'barrier hands',[.40,1.14,0],(v,s)=>v.x*s>.39&&v.y<1.66&&v.y>.90);
  return ({t,w,a,h,g})=>{
    for(const [s,p] of arms) p(.20*sin(t*1.9+s)-.41*w-.62*g+.44*a,
      s*(.23*sin(t*1.7+s)+.58*w-.76*a-.27*g),s*(.15*sin(t*2.2+s)+.22*a+.16*h),0,.035*sin(t*2+s),.13*a);
  };
}
function mantis(r,fossil) {
  const blades=taggedPair(r,'arm',fossil?[.27,1.39,0]:[.27,1.47,0]);
  const wings=fossil?[]:paired(r,'wing',[.19,1.38,-.23],(v,s)=>s*v.x>0&&(v.color==='#e1e6cd'||v.color==='#bcd9bd'));
  const tail=fossil?r.part('tail',[0,.95,-.20],v=>v.z<-.31):null;
  return ({t,w,a,h,g,special})=>{
    for(const [s,p] of blades) {
      const reach=s>0||special||!fossil?1:.50;
      p(.075*sin(t*2.2+s)+(fossil?-.67:.55)*w+(fossil?.92:-.89)*reach*a-.23*g,
        s*(.12*sin(t*1.9+s)-.69*w+1.13*reach*a+.27*g),s*(.09*sin(t+s)+.39*w-.49*a+.15*h));
    }
    for(const [s,f] of wings) f(0,s*.16*sin(t*8),s*(.17*sin(t*8)+.38*w-.61*a));
    if(tail)tail(.08*sin(t*1.4)+.28*a,.19*sin(t*1.9)-.43*w+.55*a);
  };
}
function dancer(r) {
  const arms=paired(r,'casting hands',[.32,1.16,0],(v,s)=>s*v.x>.40&&v.y<1.45);
  const hair=r.part('hair and face',[0,1.37,.02],v=>v.y>=1.45);
  return ({t,w,a,h,g})=>{
    hair(.055*sin(t*2)-.19*w+.21*a,.16*sin(t*1.6)-.34*w+.48*a,.08*sin(t*1.6)+.11*h);
    for(const [s,p] of arms) p(.19*sin(t*2.3+s)+.43*w-.72*a-.29*g,
      s*(.15*sin(t*1.7+s)-.37*w+.76*a),s*(.22*sin(t*1.9+s)+.42*w-.27*a+.15*g));
  };
}
function electric(r) {
  const aerials=paired(r,'antenna',[.16,1.84,-.04],(v,s)=>s*v.x>0&&v.y>1.88);
  const arms=paired(r,'fist',[.37,1.13,0],(v,s)=>s*v.x>.41&&v.y>.67&&v.y<1.24&&v.z>-.17);
  const tail=r.part('striped tail',[0,.65,-.20],v=>v.z<-.32);
  return ({t,w,a,h,g,special})=>{
    for(const [s,f] of aerials) f(.06*sin(5*t+s),s*.18*w,s*(.09*sin(5*t+s)+.25*w-.38*a));
    for(const [s,p] of arms) p(.12*sin(t*2.4+s)+.59*w-(s>0||special?.94:.41)*a-.40*g,-s*(.32*w-.55*a+.23*g),s*.12*h);
    tail(.10*sin(t*2.3),.24*sin(t*2.5)-.44*w+.68*a);
  };
}
function fireDuck(r) {
  const tail=r.part('flaming tail',[0,.66,-.22],v=>v.z<-.34);
  const crests=paired(r,'fire crest',[.21,1.85,-.05],(v,s)=>v.x*s>0&&v.y>1.85);
  const beak=r.part('bill',[0,1.56,.21],v=>v.z>.35&&v.y>1.40);
  return ({t,w,a,h,g})=>{
    tail(.12*sin(2.3*t)+.34*w-.48*a,.22*sin(t*1.8)+.24*h);
    beak(.06*sin(1.8*t)-.47*w+.28*a,0,0,0,0,.07*a,1,1+.17*w,1+.18*a);
    for(const [s,f] of crests) f(.12*sin(t*5.3+s)-.28*w+.39*a,0,s*.11*sin(6.7*t+s),0,0,0,1+.10*w,1+.12*sin(t*6+s)+.42*w+.24*a+.08*g,1);
  };
}
function stag(r) {
  const horns=paired(r,'pincer',[.29,1.60,0],(v,s)=>v.x*s>0&&v.y>1.60);
  const arms=paired(r,'claw',[.40,1.15,0],(v,s)=>s*v.x>.44&&v.y<1.18&&v.y>.56);
  return ({t,w,a,h,g})=>{
    for(const [s,p] of horns) p(.04*sin(t*1.7)+.19*w-.31*a,-s*.1*h,s*(.06*sin(t*1.9)+.37*a-.31*w+.15*g));
    for(const [s,p] of arms) p(.11*sin(t*2.2+s)+.21*w-.47*a-.28*g,s*.15*a,s*.12*w);
  };
}
function bull(r) {
  const tails=[-1,0,1].map(i=>r.part('tail'+i,[0,.91,-.73],tagged('tail'+i)));
  const head=r.part('mane and horns',[0,1.0,.31],v=>v.z>.32&&v.y>.75);
  const hoof=r.part('pawing hoof',[.34,.80,.38],v=>v.x>.18&&v.z>.25&&v.y<.70);
  return ({t,w,a,h,g})=>{
    head(.05*sin(t*1.5)+.53*w-.38*a+.17*g,.07*sin(t*1.1)-.13*w+.21*a, .09*h);
    hoof(-.23*Math.max(0,sin(t*2.2))-.44*w+.32*a,0,0,0,.047*Math.max(0,sin(t*2.2)),0);
    tails.forEach((p,i)=>p(.16*sin(t*3.1+i)+.45*w-.24*a,.28*sin(t*2.5+i*1.6)-.35*w+.54*a,.1*sin(t*2+i)));
  };
}
function seaDragon(r) {
  const neck=r.part('rising neck',[-.21,.91,-.45],v=>v.z>-.43&&v.y>1.01);
  const fin=r.part('tail fan',[.60,.64,-1.07],v=>v.z<-1.08);
  return ({t,w,a,h,g})=>{
    neck(.08*sin(t*1.2)-.34*w+.56*a+.16*g,.14*sin(t*1.65)-.42*w+.55*a,.12*sin(t*1.35)+.12*h);
    fin(.16*sin(t*1.65)+.52*w-.66*a,.24*sin(t*1.65-.6)-.45*w+.49*a);
  };
}
function plesiosaur(r) {
  const neck=r.part('neck',[0,.70,.37],v=>v.y>.79&&v.z>.38);
  const flippers=paired(r,'flipper',[.37,.57,.02],(v,s)=>s*v.x>.32&&v.y<.65);
  return ({t,w,a,h,g})=>{
    neck(.10*sin(t*1.5)-.27*w+.46*a+.12*g,.17*sin(t*1.1)-.18*w+.25*a,.06*sin(t*1.3)+.09*h);
    for(const [s,f] of flippers) f(.17*sin(t*1.8+s),s*(.22*sin(t*1.8+s)+.40*w-.51*a),s*(.19*sin(t*1.8)-.31*w+.4*a));
  };
}
function blob(r) {
  const skin=r.whole('elastic body',[0,.01,0]);
  return ({t,w,a,h,g})=>{
    const jelly=.040*sin(t*3.5)+.018*sin(t*6.8), flat=.24*w+.20*g-.29*a;
    skin(-.16*w+.32*a,.08*sin(t*1.8),.06*sin(t*2.3)+.26*h,0,0,.10*a,1+jelly+flat,1-jelly-flat,1+.52*flat+.42*a);
  };
}
function fox(r,id) {
  const ears=paired(r,'ear',[.25,1.24,.30],(v,s)=>s*v.x>.1&&v.y>1.19&&v.z>.10);
  const plume=r.part('tail',[0,.59,-.46],v=>v.z<-.50);
  const chest=r.part('ruff',[0,.85,.28],v=>id===134?v.color==='#f3e4bc':v.color===(id===136?'#f2d994':'#f3e4bc')&&v.y<1.17);
  const paws=paired(r,'foreleg',[.22,.60,.24],(v,s)=>s*v.x>.10&&v.y<.51&&v.z>.05);
  return ({t,w,a,h,g})=>{
    for(const [s,ear] of ears) {
      const twitch=id===135?.16*sin(t*5.6+s):.08*sin(t*2.7+s)+.06*sin(t*1.1);
      ear(twitch+.32*w-.30*a+.31*g,s*.10*sin(t*1.9+s),s*(.12*sin(t*2.4+s)+.33*w-.30*a+.14*h));
    }
    if(id===133) {
      plume(.13*sin(t*2.8)-.33*w+.40*a,.30*sin(t*2.5)+.56*a,.10*sin(t));
      chest(.07*sin(t*1.8)+.14*w-.21*a,0,.065*sin(t),0,.014*sin(t*1.8));
    } else if(id===134) {
      plume(.13*sin(t*1.8)+.47*w-.57*a,.48*sin(t*2.1)-.67*w+1.06*a);
      chest(.08*sin(t*2.3),0,0,0,0,0,1+.18*w,1+.12*w-.08*a,1+.15*w);
    } else if(id===135){
      plume(.12*sin(t*4.9)+.27*w-.38*a,.17*sin(t*3.2)+.27*h);
      const flare=1+.04*sin(t*4.6)+.27*w+.18*a;
      chest(0,0,.035*sin(t*5),0,0,0,flare,flare,flare);
    } else {
      plume(.16*sin(t*1.8)+.65*w-.72*a,.32*sin(t*2.0)-.40*w+.54*a,0,0,0,0,1+.09*w,1+.14*w,1+.10*w);
      const breath=1+.04*sin(t*2.4)+.24*w+.15*a; chest(-.13*w+.26*a,0,0,0,0,0,breath,breath,breath);
    }
    for(const [s,p] of paws) p(.045*sin(t*2.1+s)+.22*w-(s>0?.72:.34)*a,0,0,0,.036*a,0);
  };
}
function polygon(r) {
  const tail=r.part('tail hull',[0,.73,-.44],tagged('tail'));
  const head=r.part('head hull',[0,.83,.20],tagged('head'));
  const feet=taggedPair(r,'foot',[.21,.35,.04]);
  const step=t=>Math.round(sin(t)*3)/3;
  return ({t,w,a,h,g})=>{
    head(.10*step(t*2.0)-.31*w+.45*a,.27*step(t*1.6)-.53*w+.71*a,.14*h);
    tail(-.12*step(t*2.0)+.52*w-.58*a,.21*step(t*2.4)+.28*h);
    for(const [s,f] of feet) f(s*.14*step(t*2.1)+.31*w-.43*a,0,s*.22*g,0,.025*(1+s*step(t*2.1)),0);
  };
}
function ammonite(r,evolved) {
  const limbs=Array.from({length:10},(_,i)=>{
    const a=i*Math.PI/5;return r.part('tentacle'+i,[Math.sin(a)*.2,.44,.34+Math.cos(a)*.13],tagged('tentacle'+i));
  });
  const shell=r.part('shell',[0,.58,-.02],v=>v.color==='#dec59b'||v.color==='#ab906d');
  return ({t,w,a,h,g})=>{
    shell(.07*sin(t*1.7)+.24*w-.29*a+.21*g, .08*sin(t*1.4),.085*sin(t*1.9)+.09*h);
    limbs.forEach((p,i)=>{
      const phase=i*Math.PI/5, front=Math.cos(phase);
      p(.15*sin(t*2.8+phase)+front*.48*w-(evolved?.84:.56)*front*a,
        .15*sin(t*2.3+phase)+.23*w-.31*a,Math.sin(phase)*(.16*sin(t*2.5+phase)-.33*w+.46*a+.24*g));
    });
  };
}
function horseshoe(r) {
  const legs=paired(r,'legs',[.32,.34,0],(v,s)=>s*v.x>0&&v.color==='#ccba83');
  const shell=r.part('shield',[0,.35,0],v=>v.y>.42);
  return ({t,w,a,h,g})=>{
    for (const [s,l] of legs) l(s*.20*sin(t*3.9)+.45*w-.58*a,0,s*(.18*sin(t*3+s)+.35*w-.48*a+.36*g));
    shell(.040*sin(t*2.6)+.23*w-.32*a+.17*g,0,.037*sin(t*3.9)+.12*h,0,-.065*g,.065*a);
  };
}
function pterosaur(r) {
  const wings=taggedPair(r,'wing',[.21,1.28,-.06]);
  const jaw=r.part('jaw',[0,1.49,.57],v=>v.z>.69&&v.y<1.54);
  const tail=r.part('rudder',[0,.95,-.32],v=>v.z<-.45);
  const flight=r.whole('flight',[0,1.08,0]);
  return ({t,w,a,h,g})=>{
    for(const [s,f] of wings) f(.07*sin(t*2.1),s*(.09*sin(t*2.6)-.45*w+.67*a),s*(.32*sin(t*2.6)+.64*w-.89*a+.28*g));
    jaw(.06*sin(t*1.7)+.34*w-.31*a);
    tail(.09*sin(t*2.5)+.25*w-.40*a,.20*sin(t*2.0)+.31*h);
    flight(.07*sin(t*2.6)-.24*w+.48*a,0,.095*sin(t*1.3)+.19*h,0,.06*sin(t*2.6-.6),.17*a);
  };
}
function sleeper(r) {
  const belly=r.part('belly',[0,.33,.10],v=>v.i<2);
  const paws=paired(r,'paw',[.53,1.15,0],(v,s)=>s*v.x>.56&&v.y>.63&&v.y<1.25);
  const head=r.part('head',[0,1.37,0],v=>v.y>1.37);
  return ({t,w,a,h,g})=>{
    const breath=.047*sin(t*1.55), swell=breath+.15*w+.10*g;
    belly(-.11*w+.30*a,0,.035*sin(t*1.4)+.10*h,0,0,0,1+swell,1+swell*.7-.10*a,1+swell+.17*a);
    head(.10+.08*sin(t*1.55-.5)-.20*w+.33*a,-.075*sin(t*1.1),.10*sin(t*.9)+.12*h);
    for(const [s,p] of paws)p(.08*sin(t*1.55+s)+.47*w-.77*a-.38*g,-s*.21*g,s*.24*w);
  };
}
function legendary(r,id) {
  const wings=taggedPair(r,'wing',[.20,1.29,-.06]);
  const tail=r.part('tail fan',[0,.99,-.33],v=>v.z<-.33);
  const head=r.part('crest and beak',[0,1.42,.25],v=>v.y>1.43);
  const flight=r.whole('flight',[0,1.05,0]);
  return ({t,w,a,h,g})=>{
    const ice=id===144,zap=id===145;
    const beat=ice?.23*sin(t*1.65):zap?.19*sin(t*3.7)+.06*sin(t*7.4):.34*sin(t*2.07);
    for(const [s,f] of wings) f(.07*sin(t*2+s),s*(.09*sin(t*1.7)-(ice?.32:.53)*w+(zap?.70:.45)*a),s*(beat+(ice?.67:zap?.53:.86)*w-(ice?.66:zap?.98:1.05)*a+.23*g));
    tail(ice?.20*sin(t*1.8)+.37*w-.52*a:.11*sin(t*2.8)+.52*w-.58*a,
      (ice?.33:zap?.16:.26)*sin(t*(zap?3.8:1.7))+.34*h);
    head(.07*sin(t*1.9)+(ice?-.26:.32)*w+(ice?.37:-.42)*a,.10*sin(t*1.3)+.18*h);
    flight(-.16*w+(zap?.46:ice?.20:.33)*a,0,.065*sin(t*1.2)+.17*h,0,.055*sin(t*(zap?3.7:1.8))+.13*w,.14*a);
  };
}
function serpent(r,evolved) {
  const neck=r.part('neck',evolved?[-.23,.86,.10]:[-.20,.56,.06],v=>v.x<.36&&v.y>(evolved?.89:.57));
  const tail=r.part('tail curl',evolved?[.17,.26,-.60]:[-.04,.22,-.38],v=>v.x>(evolved?.21:.06));
  return ({t,w,a,h,g})=>{
    neck(.10*sin(t*1.4)-.34*w+(evolved?.59:.45)*a,(evolved?.22:.15)*sin(t*1.9)-.38*w+.62*a,.12*sin(t*1.5)+.13*h+.11*g);
    tail(.20*sin(t*1.9-.8)+.43*w-.57*a,.29*sin(t*1.9-1.3)-(evolved?.78:.51)*w+(evolved?.92:.67)*a,.11*sin(t*1.6));
  };
}
function dragon(r) {
  const wings=taggedPair(r,'wing',[.31,1.52,-.24]);
  const arms=paired(r,'arm',[.40,1.42,.05],(v,s)=>s*v.x>.43&&v.y>.94&&v.z>0);
  const tail=r.part('tail',[0,.72,-.30],v=>v.z<-.4);
  return ({t,w,a,h,g,special})=>{
    for(const [s,f] of wings) f(0,s*(.15*sin(t*3.1)-.33*w+.42*a),s*(.22*sin(t*3.1)+.60*w-.87*a));
    for(const [s,p] of arms) p(.09*sin(t*1.7+s)+.47*w-(s>0||special?.96:.39)*a-.43*g,s*.26*a,s*.15*h);
    tail(.10*sin(t*1.7)+.23*w-.38*a,.21*sin(t*1.6)-.47*w+.62*a);
  };
}
function psychic(r) {
  const tail=r.part('tail',[0,1.08,-.18],v=>v.color==='#9b77a9'&&v.z<-.18);
  const arms=paired(r,'channeling hand',[.28,1.64,0],(v,s)=>v.x*s>.32&&v.y>1.25&&v.y<1.70);
  const gaze=r.part('gaze',[0,1.96,.09],v=>v.y>1.96);
  return ({t,w,a,h,g,special})=>{
    gaze(.045*sin(t*1.4)+.22*w-.22*a+.10*g,.13*sin(t*1.1)-.18*w+.29*a,.09*h);
    tail(.12*sin(t*1.65)-.39*w+.52*a,.28*sin(t*1.4)-.57*w+.66*a,.15*sin(t*1.2)+.14*h);
    for(const [s,p] of arms) p(.10*sin(t*1.9+s)-.66*w-(s>0||special?.92:.25)*a-.48*g,
      s*(.13*sin(t*1.4+s)+.56*w-.94*a-.31*g),s*(.10*sin(t*1.7+s)+.29*w-.34*a));
  };
}
function mew(r) {
  const tail=r.part('long tail',[0,.66,-.15],v=>v.z<-.20);
  const feet=paired(r,'float feet',[.20,.60,0],(v,s)=>s*v.x>.1&&v.y<.60);
  const float=r.whole('somersault',[0,.91,0]);
  return ({t,w,a,h,g,special})=>{
    tail(.21*sin(t*1.9)+.52*w-.64*a,.42*sin(t*1.7)-.63*w+.96*a,.14*sin(t*2.1)+.17*h);
    for(const [s,p] of feet) p(.24*sin(t*2.6+s)+.59*w-.42*a-.31*g,0,s*.12*sin(t*1.9));
    float(.12*sin(t*1.7)-.57*w+(special?1.34:.89)*a,.13*sin(t*1.2)+.42*a,.13*sin(t*1.5)+.29*h,
      .04*sin(t*1.3),.09*sin(t*2)+.25*w+.15*a,.21*a);
  };
}
const motions=[
  eggs,palm,r=>bone(r,false),r=>bone(r,true),kickboxer,boxer,tongue,r=>gas(r,false),r=>gas(r,true),
  r=>rhino(r,false),r=>rhino(r,true),chansey,vines,kangaroo,r=>seahorse(r,false),r=>seahorse(r,true),
  r=>fish(r,false),r=>fish(r,true),r=>starfish(r,false),r=>starfish(r,true),mime,r=>mantis(r,false),
  dancer,electric,fireDuck,stag,bull,r=>fish(r,false,true),seaDragon,plesiosaur,blob,
  r=>fox(r,133),r=>fox(r,134),r=>fox(r,135),r=>fox(r,136),polygon,r=>ammonite(r,false),r=>ammonite(r,true),
  horseshoe,r=>mantis(r,true),pterosaur,sleeper,r=>legendary(r,144),r=>legendary(r,145),r=>legendary(r,146),
  r=>serpent(r,false),r=>serpent(r,true),dragon,psychic,mew,
];
export function lateMotion(id,rig) {
  const build=motions[id-102];
  if(!build) throw new RangeError('Unknown Kanto motion ID '+id);
  const pose=build(rig);
  return ({t,u,wind,strike,recoil,kind})=>{
    const guard=kind==='guard',hurt=kind==='hurt', idle=kind==='idle';
    const power=kind==='light'?.74:kind==='heavy'?1.15:1;
    pose({t,u,w:guard||hurt||idle?0:wind*power,a:guard||hurt||idle?0:strike*power,
      g:guard?Math.max(wind,strike):0,h:recoil,special:kind==='special'});
  };
}
