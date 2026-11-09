// All joint pivots are expressed in the original sculpture's coordinate frame.
const sin = Math.sin;
const sides = [-1, 1];
const clamp = x => Math.max(0, Math.min(1, x));
const sideJoints = (rig, name, pivot, belongs) => sides.map(s => ({
  s, move: rig.part(name + (s < 0 ? ' left' : ' right'), [s*pivot[0], pivot[1], pivot[2]],
    mesh => s*mesh.x > 0 && belongs(mesh, s))
}));
const strength = (kind, light, heavy, special) =>
  kind === 'light' ? light : kind === 'heavy' ? heavy : kind === 'special' ? special : 0;
const guard = ({kind,wind,strike}) => kind === 'guard' ? Math.max(wind,strike) : 0;

function bulb(id,rig) {
  const plant = rig.part('back plant',[0,1.19,-.34],p=>p.tag==='back plant');
  const head = rig.part('head',[0,.93,.38],p=>p.tag==='ear' || (p.y>.71 && p.z>.4));
  const mass = [0,1,.71,.39][id];
  return a=>{
    const {t,wind,strike,recoil,kind}=a, grow=kind==='special'?strike:0, brace=guard(a);
    const leafSwing=sin(t*(id===1?2.1:1.6));
    plant(-.09*mass*leafSwing+.30*wind-.37*strike, id===2?.13*sin(t*1.1)+.46*grow:.035*sin(t),
      mass*.14*sin(t*1.5)+strength(kind,.14,-.15,.21)*strike, 0, .032*mass*leafSwing,0,
      1+grow*(id===3?.20:.08),1+.11*wind-.08*strike,1+.10*grow);
    head(.075*sin(t*2.1)+.28*wind-.30*strike+.18*recoil+.16*brace,
      (id===1?.14:.07)*sin(t*1.4)+strength(kind,-.20,.24,0)*strike,0,0,-.06*brace,.12*strike);
  };
}
function lizard(id,rig) {
  const elder=id===5;
  const tail=rig.part('flame tail',[0,.65,-.28],p=>p.z<-.30);
  const head=rig.part('head',[0,1.35,.06],p=>p.y>1.32);
  const arms=sideJoints(rig,'claw',[.31,1.17,.02],p=>Math.abs(p.x)>.36&&p.y>.75);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, claw=strength(kind,1,.74,0), fire=kind==='special'?strike:0;
    tail(.11*sin(2.4*t)-.27*wind+.27*fire, (elder?.40:.28)*sin(t*(elder?2.25:2.8))+
      strength(kind,.40,-.67,.19)*strike, .07*sin(t*1.9));
    head(.07*sin(t*2.2)-.38*wind+strength(kind,.28,.42,.44)*strike-.16*recoil,
      (elder?.15:.095)*sin(t*1.4)-.17*wind+.16*strike,0,0,0,.10*fire);
    for(const {s,move} of arms) move(.07*sin(t*2.6+s)+.55*wind-claw*strike*(elder?(s===1?1.03:.35):.76)-.27*fire,
      s*(.18*wind-.18*strike),s*(.06*sin(t*2.2)+.25*guard(a)));
  };
}
function turtle(id,rig) {
  const elder=id===9, mid=id===8, y=elder?1.09:.87, neck=elder?1.66:1.23;
  const cannons=elder ? sideJoints(rig,'cannon',[.44,1.59,-.39],p=>['#805d49','#b8c4c9','#424b58'].includes(p.color)) : [];
  const tail=rig.part('tail',[0,elder?.61:.65,-.45],p=>p.color==='#bdd8ea'||(p.z<-.60 && !['#a97753','#624a40'].includes(p.color)));
  const head=rig.part('head',[0,neck,.25],p=>p.tag==='ear'||(p.y>neck-.16 && p.z>.37 && p.color!=='#b99a68'));
  const arms=sideJoints(rig,'paddle',[elder?.57:.38,y+.22,.17],p=>Math.abs(p.x)>(elder?.59:.42)&&p.z>.2&&p.y>.58);
  return a=>{
    const {t,kind,wind,strike,recoil}=a, brace=guard(a), jet=kind==='special'?strike:0;
    head(.065*sin(t*2)+.21*brace-.23*wind+.23*strike,.10*sin(t*1.55),0,0,-.21*brace,.09*strike-.18*brace);
    tail((mid?.32:.12)*sin(t*2.7)+.33*wind-.46*strike,(mid?.29:.36)*sin(t*2.25)+strength(kind,.32,-.55,.18)*strike,0);
    for(const {s,move} of arms) move(.14*sin(t*2.2+s)+.36*wind-strength(kind,.77,.54,.16)*strike,
      s*(-.23*brace+.29*strike),s*(.30*brace+.19*jet));
    for(const {s,move} of cannons) move(.032*sin(t*1.6)-.24*wind+.20*jet+.09*recoil,s*.04*sin(t*1.2),0,0,-.07*jet,-.12*jet);
  };
}
function grub(id,rig) {
  const green=id===10;
  const head=rig.part('rearing head',[0,.49,.24],p=>p.z>.37);
  const belly=rig.part('middle segments',[0,.29,-.38],p=>p.z>-.56);
  const tail=rig.part('rear segments',[0,.26,-.75],p=>p.z<=-.56);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, crawl=.5+.5*sin(t*(green?4:3.1));
    const shoot=strength(kind,.14,.21,green?.11:.24)*strike;
    head(-.12*crawl-.44*wind+.46*strike+.19*recoil,
      (green?.16:.08)*sin(t*1.9)+(!green?.18*strike:0),0,0,.046*crawl,shoot);
    belly(.06*sin(t*3.3)-.18*wind+.12*strike,0,.055*sin(t*2.3),0,.055*crawl+.065*wind,.035*crawl);
    tail(.12*sin(t*3.3+1.4)+.24*wind-.15*strike,(green?.12:.23)*sin(t*2.2),0,0,.02*(1-crawl),.055*crawl);
  };
}
function cocoon(id,rig) {
  const green=id===11, shell=rig.whole('shell balanced on tip',[0,.09,green?-.35:0]);
  return a=>{
    const {t,kind,wind,strike,recoil}=a;
    const tremor=sin(t*(green?18:24))*(.018+.067*(wind+guard(a)));
    const sway=green?.087*sin(t*2.4):.052*sin(t*3.1);
    shell(green?sway-.34*wind+.52*strike-.14*recoil:tremor-.22*wind+.30*strike,
      (green?.055:.09)*sin(t*1.6)+strength(kind,.08,-.24,.38)*strike,
      green?tremor:sway+.22*wind-.35*strike+.16*recoil,0,
      (green?.08:.16)*strike,0,1+.08*wind-.04*strike,1-.075*wind+.075*strike,1+.04*wind);
  };
}
function butterfly(id,rig) {
  const moth=id===49;
  const wings=sideJoints(rig,'scale wing',[.14,1.03,-.13],p=>p.z<-.115);
  const antenna=sideJoints(rig,'antenna',[.14,1.57,.10],p=>p.y>1.65 && Math.abs(p.x)>.11);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, beat=sin(t*(moth?7.0:5.7)), powder=kind==='special'?strike:0;
    for(const {s,move} of wings) {
      const flutter=moth?.21*beat+.09*sin(t*13):.41*beat;
      move(.05*beat,s*(-flutter-.58*wind+strength(kind,.70,.88,.60)*strike),
        s*(.13*beat+.14*powder-.22*guard(a)-.14*recoil));
    }
    for(const {s,move} of antenna) move(.13*sin(t*3.6+s*.35)-.28*wind+.38*strike,s*.10*sin(t*2.3),s*.12*powder);
  };
}
function bee(rig) {
  const wings=sideJoints(rig,'buzz wing',[.15,1.19,-.18],p=>p.color==='#d6e7e6');
  const drills=sideJoints(rig,'lance',[.24,1.18,.10],p=>p.color==='#474852'||p.color==='#fff1ce'&&p.z>0);
  const abdomen=rig.part('stinging abdomen',[0,1.04,-.1],p=>p.z<-.23);
  return a=>{
    const {t,kind,wind,strike,recoil}=a, beat=sin(t*16), jab=strength(kind,.99,.70,.38);
    for(const {s,move} of wings) move(0,s*(.37*beat+.31*wind-.38*strike),s*.13*beat);
    for(const {s,move} of drills) {
      const lead=kind==='light'&&s===-1?.32:1;
      move(.10*sin(t*3.7+s)+.48*wind-jab*lead*strike+.24*recoil,s*(.17*wind-.10*strike),
        s*.25*guard(a),0,0,lead*.18*strike);
    }
    abdomen(.15*sin(t*4.3)-.26*wind+strength(kind,.10,.53,.70)*strike,0,.055*sin(t*2.6));
  };
}
function bird(id,rig) {
  const fearow=id===22, fierce=id>=21, big=id===18||fearow;
  const headY=fearow?1.89:big?1.54:1.39;
  const wings=sideJoints(rig,'flight feathers',[.28,1.02,-.03],p=>p.tag==='wing');
  const tail=rig.part('tail fan',[0,.76,-.35],p=>p.z<-.30 && p.y<1.13);
  const head=rig.part('head and crest',[0,headY-.26,.15],p=>p.y>headY-.23);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, wingIdle=id===16?.10:id===17?.23:id===18?.29:fearow?.16:.13;
    const peck=fierce?1.0:.62;
    for(const {s,move} of wings) {
      const lift=wingIdle*sin(t*(fierce?3.8:big?2.15:2.8));
      move(.07*sin(t*2),s*(.10*sin(t*1.8)+.25*wind-.39*strike),
        s*(lift+.61*wind-strength(kind,.40,.78,.97)*strike-.29*guard(a)));
    }
    head(.09*sin(t*(fierce?3.7:2.3))-.38*wind+peck*strength(kind,.65,.48,.30)*strike-.19*recoil,
      (id===16?.25:id===17?.18:.12)*sin(t*1.8),0,0,0,(fearow?.28:.12)*strike);
    tail(.085*sin(t*2.9)+.27*wind-.32*strike,.20*sin(t*1.65),0,0,0,0,1+.22*wind+.22*guard(a));
  };
}
function rat(id,rig) {
  const big=id===20;
  const tail=rig.part('tail',[0,.56,-.60],p=>p.z<-.60);
  const head=rig.part('muzzle and incisors',[0,.83,.35],p=>p.y>.62&&p.z>.20);
  return a=>{
    const {t,wind,strike,recoil,kind}=a;
    const sniff=big?.045*sin(4*t):.045*sin(t*6)+.04*sin(t*10);
    head(sniff-.32*wind+strength(kind,.37,.52,.21)*strike+.15*guard(a),.13*sin(t*(big?1.45:2.7)),0,0,.012*sin(t*6),(big?.22:.15)*strike);
    tail((big?.08:.19)*sin(t*3.3)+.22*wind-.31*strike,(big?.24:.38)*sin(t*2.6)-.37*wind+.47*strike+.16*recoil);
  };
}
function snake(id,rig) {
  const cobra=id===24;
  const neck=rig.part('raised forebody',[-.19,.55,-.06],p=>p.y>.62);
  const coil=rig.part('anchored coil',[0,.22,0],p=>p.y<=.62);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, sway=sin(t*(cobra?1.8:2.55));
    neck((cobra?.07:.12)*sin(t*2.2)-.46*wind+strength(kind,.56,.77,.34)*strike-.24*recoil,
      (cobra?.15:.22)*sin(t*1.6)+.17*wind-.20*strike,(cobra?.11:.17)*sway,
      0,.03*wind,(cobra?.14:.18)*strike,1+(cobra?.13:.03)*(wind+guard(a)),1+.07*wind-.045*strike);
    coil(0,.055*sin(t*1.8)-.13*wind+.18*strike,0,0,0,0,1+.042*sway+.08*wind,1-.06*wind,1-.03*sway-.05*wind);
  };
}
function mouse(rig) {
  const tail=rig.part('lightning tail',[0,.53,-.28],p=>p.z<-.40);
  const ears=sideJoints(rig,'ears',[.28,1.71,.04],p=>p.tag==='ear'||p.y>2);
  const arms=sideJoints(rig,'paws',[.37,.96,.15],p=>Math.abs(p.x)>.36&&p.y>.59&&p.y<1&&p.z>.16);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, zap=kind==='special'?strike:0;
    tail(.10*sin(t*2.2)-.42*wind+.47*strike,.30*sin(t*3.0)+.63*wind-strength(kind,.50,.78,1.08)*strike,
      .13*sin(t*2.5)+.11*zap*sin(t*22));
    for(const {s,move} of ears) move(.11*sin(3.6*t+s*.7)-.27*wind+.23*strike+.16*recoil,0,s*(.10*sin(t*2.8)-.24*wind+.17*zap));
    for(const {s,move} of arms) move(.07*sin(t*3+s)+.32*wind-.86*strike,0,s*(.18*guard(a)+.27*zap));
  };
}
function sand(id,rig) {
  const spiny=id===28;
  const arms=sideJoints(rig,'digging claw',[.32,.89,.11],p=>Math.abs(p.x)>.36&&p.z>.17&&p.y>.49&&p.y<.90);
  const roll=rig.whole('rolling body',[0,.53,-.08]);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, sweep=strength(kind,.83,1.07,.53);
    for(const {s,move} of arms) {
      const rake=spiny?.13*sin(t*3.4+s*.9):.12*sin(t*2.6+s*1.5);
      const lead=kind==='light'&&s===-1?.28:1;
      move(rake+.62*wind-sweep*strike*lead,s*(-.21*wind+.26*strike),s*(spiny?.39*strike:.23*guard(a)));
    }
    // Sandshrew curls and rolls once for a heavy attack. End orientation matches rest.
    const spin=!spiny&&kind==='heavy'?2*Math.PI*clamp((a.u-.24)/.63):0;
    roll(spin+(spiny?.03:.065)*sin(t*2.2)-.16*wind+.14*strike-.12*recoil,
      (spiny?.06:.03)*sin(t*1.4)+strength(kind,-.09,.19,.32)*strike,0,0,
      -.08*wind+(spiny?.015:.09)*strike,0,1+.06*wind,1-.10*(wind+guard(a)),1+.05*wind);
  };
}
function nido(id,rig) {
  const female=id<32, stage=id-(female?29:32), big=stage===2;
  const headY=big?1.58:stage?1.04:.86, w=big?.60:stage?.50:.38;
  const tail=rig.part('counterweight tail',[0,big?.69:.49,big?-.41:-.51],p=>p.z<-.58 && p.y<.70);
  const ears=sideJoints(rig,'ears',[w*.55,headY+.16,big?.09:.24],p=>p.tag==='ear');
  const head=rig.part('horned skull',[0,headY-.15,big?.12:.28],p=>p.y>=headY-.24 && p.z>=(big?.15:.30));
  const arms=big?sideJoints(rig,'forearms',[.48,1.13,.03],p=>Math.abs(p.x)>.45&&p.y>.65&&p.z>=0):[];
  return a=>{
    const {t,wind,strike,recoil,kind}=a;
    const jab=strength(kind,female?.28:.48,female?.46:.73,.28);
    const aim=big?.12:stage?.16:.22, pitch=.07*sin(t*2.1)-.27*wind+jab*strike+.14*recoil;
    head(pitch,aim*sin(t*(big?1.35:2.0)),0,0,0,(female?.10:.16)*strike);
    for(const {s,move} of ears) {
      // The ears follow the displaced skull as well as flexing from their own roots.
      move(pitch+.09*sin(t*(stage?3.3:4.4)+s*.3),aim*sin(t*(big?1.35:2.0)),
        s*((female?.21:.14)*sin(2.6*t+s*.45)+(stage?.23:.35)*wind-.20*strike),0,0,(female?.10:.16)*strike+.21*pitch);
    }
    tail(.10*sin(2.2*t)+.25*wind-.28*strike,(big?.33:.19)*sin(2*t)+strength(kind,.22,big?.75:.32,.42)*strike);
    for(const {s,move} of arms) move(.09*sin(2*t+s)+.44*wind-strength(kind,female?.74:.53,.95,.28)*strike,0,s*(.23*guard(a)+.19*strike));
  };
}
function fairy(id,rig) {
  const big=id===36;
  const wings=sideJoints(rig,'scalloped wings',[.24,.98,-.34],p=>p.color==='#d087a0'||p.color==='#e6a2b6');
  const hands=sideJoints(rig,'pointing hands',[.46,.98,.11],p=>Math.abs(p.x)>.46&&p.y>.89&&p.z>.08);
  const curl=rig.part('curled tail',[0,.60,-.27],p=>p.z<-.36);
  return a=>{
    const {t,wind,strike,recoil,kind}=a;
    for(const {s,move} of wings) move(.055*sin(t*2.7),s*((big?.24:.34)*sin(t*(big?3.0:3.9))+.41*wind-.50*strike),
      s*(.12*strike-.17*guard(a)));
    for(const {s,move} of hands) {
      const point=s===1||kind!=='light'?1:.36;
      move(.09*sin(t*3+s)-.35*wind+.32*strike,0,s*((big?.15:.25)*sin(t*3.1+s*.5)+.56*wind-
        strength(kind,.86,.66,1.03)*strike*point+.19*recoil));
    }
    curl(.15*sin(t*2.6)+.22*wind-.31*strike,.18*sin(t*2.1));
  };
}
function fox(id,rig) {
  const nine=id===38, count=nine?9:6;
  const tails=Array.from({length:count},(_,i)=>{
    const fan=sin(-1.32+2.64*i/(count-1));
    return {fan,move:rig.part('tail '+(i+1),[fan*.22,.64,-.44],p=>p.tag==='tail-'+i)};
  });
  const y=nine?1.32:1.14;
  const head=rig.part('head and mane',[0,y-.22,.19],p=>p.y>y-.16);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, spell=kind==='special'?strike:0;
    tails.forEach(({fan,move},i)=>{
      const phase=i*(nine?.48:.73);
      move((nine?.10:.18)*sin(t*(nine?1.9:3.1)+phase)-.25*wind+.24*strike,
        (nine?.16:.24)*sin(2.1*t+phase)+fan*(.43*wind-strength(kind,.24,.56,.85)*strike),
        fan*(.15*sin(t*1.7+phase)-.21*wind+.36*spell));
    });
    head(.07*sin(t*2)-.19*wind+.24*strike+.12*recoil,(nine?.11:.19)*sin(t*1.8)-.22*wind+.22*strike,0,0,0,.10*strike);
  };
}
function puff(id,rig) {
  const tall=id===40, y=tall?.93:.72;
  const ears=sideJoints(rig,'ears',[tall?.26:.32,tall?1.59:1.12,-.015],p=>p.tag==='ear'||p.y>2.0);
  const hands=sideJoints(rig,'hands',[.48,y+.05,.04],p=>Math.abs(p.x)>.50&&p.y<1.14&&p.y>.47);
  const body=rig.whole('balloon body',[0,.06,0]);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, breath=(tall?.022:.035)*sin(t*(tall?2.7:2.0)), sing=kind==='special'?strike:0;
    const swell=breath+.13*wind+sing*(.12+.055*sin(t*14))-.06*(strike-sing);
    body(.03*sin(t*1.9)-.12*wind+.13*strike,0,(tall?.055:.035)*sin(t*2.7)+recoil*.10,0,
      0,0,1+swell,1+.32*swell-.07*guard(a),1+swell);
    for(const {s,move} of ears) move((tall?.17:.09)*sin(t*2.9+s*.4)-.35*wind+.28*strike,0,s*(.10*sin(t*2.1)+.19*sing));
    for(const {s,move} of hands) move(.13*sin(t*3+s)-.4*strike,0,s*(.28*sin(t*2.7+s)+.62*wind-.64*strike));
  };
}
function bat(id,rig) {
  const big=id===42;
  const wings=sideJoints(rig,'wing membrane',[big?.25:.20,big?1.22:1.12,-.05],p=>p.tag==='wing');
  const mouth=rig.part('open mouth',[0,big?1.23:1.01,big?.34:.22],p=>['#443246','#563a50','#d8849c','#fff1ce'].includes(p.color));
  const feet=sideJoints(rig,'trailing feet',[big?.23:.13,big?.65:.76,-.10],p=>p.y<.70);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, beat=sin(t*(big?5.1:7.8)), bite=strength(kind,.20,.48,.31)*strike;
    for(const {s,move} of wings) move(.09*beat,s*(.18*beat+.25*wind-.38*strike),s*((big?.44:.54)*beat+.51*wind-.63*strike-.14*recoil));
    for(const {s,move} of feet) move(.20*sin(t*(big?5.1:7.8)-.60)-.31*wind+.29*strike,s*.10*sin(t*2));
    mouth(0,0,0,0,0,0,1+.08*wind,1+(big?.095:.13)*sin(t*3.5)+.29*wind-bite+.12*recoil,1+.14*strike);
  };
}
function flower(id,rig) {
  const odd=id===43, gloom=id===44;
  const cap=rig.part('leaf or flower crown',[0,odd?.85:1.05,0],p=>p.y>(odd?.84:.85));
  const stem=rig.whole('rooted stem',[0,.10,0]);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, flourish=kind==='special'?strike:0;
    const sway=odd?.14*sin(3.4*t):gloom?.085*sin(1.6*t):.07*sin(2.1*t);
    stem((gloom?.08:.035)*sin(t*2.2)-.15*wind+.17*strike,0,sway+.15*recoil,0,0,0,
      1+.04*wind,1-.075*wind+.07*strike,1+.04*wind);
    cap((gloom?.16:.085)*sin(t*2.2)+.28*wind-.38*strike,
      (id===45?.28:.12)*sin(t*1.9)-.32*wind+strength(kind,.24,.40,odd?.62:gloom?.81:1.48)*strike,
      -1.35*sway,0,.045*flourish,0,1+(odd?.08:.15)*flourish,1+.13*wind,1+.13*flourish);
  };
}
function crab(id,rig) {
  const big=id===47, w=big?.51:.402;
  const claws=sideJoints(rig,'pincer',[w*.74,.55,.22],p=>p.z>.22&&Math.abs(p.x)>w*.85);
  const caps=big?[{s:0,move:rig.part('mushroom',[0,.46,-.20],p=>['#b76652','#e7bd7b','#ebd3a4','#e8c994'].includes(p.color))}]:
    sideJoints(rig,'mushroom',[.18,.69,-.30],p=>['#dc817d','#f0ceaa','#ebd3a4','#e8c994'].includes(p.color));
  return a=>{
    const {t,wind,strike,recoil,kind}=a;
    for(const {s,move} of claws) {
      const lead=kind==='light'&&s===1?.27:1;
      move((big?.08:.15)*sin(t*3+s)+.23*wind-strength(kind,.59,.77,.23)*strike*lead,
        s*(.47*wind-strength(kind,.68,.92,.32)*strike*lead+.18*guard(a)),s*.13*recoil);
    }
    for(const {s,move} of caps) move((big?.053:.13)*sin(t*2.6+s*.5)-.20*wind+.27*strike,
      (big?.11:.15)*sin(t*2.1+s)+.26*strike,(big?.05:.11)*sin(t*2.8+s),0,
      kind==='special'?.07*strike:0);
  };
}
function venonat(rig) {
  const antenna=sideJoints(rig,'feelers',[.17,1.50,0],p=>p.color==='#fff1ce'&&p.y>1.51);
  const feet=sideJoints(rig,'hind feet',[.27,.20,.08],p=>p.color==='#c49984');
  const body=rig.whole('furry body',[0,.10,0]);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, bounce=.5+.5*sin(t*4.2);
    body(-.055*sin(t*2.3)-.25*wind+.28*strike,0,.052*sin(t*2.5)+.12*recoil,0,
      .06*bounce+.15*strike,0,1+.05*wind,1-.10*wind,1+.05*wind);
    for(const {s,move} of antenna) move(.16*sin(4.2*t+s*.4)-.43*wind+strength(kind,.46,.57,.70)*strike,
      s*(.14*sin(3.1*t)+.18*wind-.23*strike),s*.09*sin(4*t));
    for(const {s,move} of feet) move(.08*sin(t*4.2)-.17*wind+.26*strike,0,0,0,-.04*bounce);
  };
}
function diglett(rig) {
  const mole=rig.part('burrowing body',[0,.08,0],p=>p.y>.11);
  const earth=rig.part('displaced earth',[0,.08,0],p=>p.y<=.11);
  return a=>{
    const {t,wind,strike,recoil,kind}=a, sniff=.035*sin(t*3.0), burrow=strength(kind,.25,.42,.50);
    mole(-.065*sin(t*2.8)-.18*wind+.24*strike,.19*sin(t*1.65),-.055*sin(t*2.1)+.11*recoil,
      0,sniff-burrow*wind+.16*strike-.19*guard(a),.08*strike,1+.05*wind,1-.18*wind+.17*strike);
    earth(0,.035*sin(t*3.0)+.13*wind-.12*strike,0,0,.017*strike,0,1+.13*wind+.14*strike,1+.13*strike,1+.13*wind+.14*strike);
  };
}
export function earlyMotion(id,rig) {
  if(id>=1&&id<=3) return bulb(id,rig);
  if(id===4||id===5) return lizard(id,rig);
  if(id>=7&&id<=9) return turtle(id,rig);
  if(id===10||id===13) return grub(id,rig);
  if(id===11||id===14) return cocoon(id,rig);
  if(id===12||id===49) return butterfly(id,rig);
  if(id===15) return bee(rig);
  if((id>=16&&id<=18)||id===21||id===22) return bird(id,rig);
  if(id===19||id===20) return rat(id,rig);
  if(id===23||id===24) return snake(id,rig);
  if(id===26) return mouse(rig);
  if(id===27||id===28) return sand(id,rig);
  if(id>=29&&id<=34) return nido(id,rig);
  if(id===35||id===36) return fairy(id,rig);
  if(id===37||id===38) return fox(id,rig);
  if(id===39||id===40) return puff(id,rig);
  if(id===41||id===42) return bat(id,rig);
  if(id>=43&&id<=45) return flower(id,rig);
  if(id===46||id===47) return crab(id,rig);
  if(id===48) return venonat(rig);
  if(id===50) return diglett(rig);
  throw new RangeError('No early Kanto animation for '+id);
}
