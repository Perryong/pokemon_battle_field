const sides = [-1, 1];
const ink = '#262535', ivory = '#fff1ce', rose = '#e688a0';

// Connect points with a continuous change in radius for tails, limbs and vines.
function chain(k, color, points, radii) {
  for (let i = 1; i < points.length; i++) {
    k.r(color, points[i - 1], points[i], radii[i - 1], radii[i]);
  }
}
function eyes(k, x, y, z, size) {
  for (const s of sides) k.eye(s * x, y, z, size);
}
function rotate(mesh, axis, radians) {
  mesh.rotation[axis] = radians;
  return mesh;
}
function ears(k, color, inner, x, y, z, h, w) {
  for (const s of sides) {
    k.r(color, [s*x,y,z], [s*(x+w*.45),y+h,z-.07], w, .012);
    k.tri(inner, [s*(x-w*.56),y,z+w*.88], [s*(x+w*.49),y+h*.83,z-.01], [s*(x+w*.57),y,z+w*.85]);
  }
}
// A folded diamond leaf has a raised midrib and reads from both sides.
function leaf(k, color, base, tip, halfWidth, lift=.09) {
  const mid = base.map((v,i)=>(v+tip[i])*.5);
  const dx=tip[0]-base[0], dy=tip[1]-base[1], len=Math.hypot(dx,dy)||1;
  const left=[mid[0]-dy*halfWidth/len,mid[1]+dx*halfWidth/len,mid[2]];
  const right=[mid[0]+dy*halfWidth/len,mid[1]-dx*halfWidth/len,mid[2]];
  const ridge=[mid[0],mid[1],mid[2]+lift];
  for (const edge of [left,right]) {k.tri(color,base,edge,ridge);k.tri(color,ridge,edge,tip);}
}
function feet(k,c,x,y,z,w=.18,h=.12,d=.25) {
  for(const s of sides) k.e(c,s*x,y,z,w,h,d);
}
function quadruped(k,fur,x,top,front,back,footColor=fur) {
  for (const s of sides) for(const z of [back,front]) {
    const hip=[s*x,top,z], ankle=[s*(x+.045),.17,z+.035];
    k.r(fur,hip,ankle,.145,.092); k.e(footColor,ankle[0],.11,ankle[2]+.07,.14,.11,.19);
  }
}
function dugtrio(k) {
  k.e('#866447',0,.17,-.03,1.02,.22,.68);
  for(let i=0;i<14;i++) {
    const a=i*Math.PI*2/14; k.e(i%2?'#ae8050':'#916b49',Math.sin(a)*.86,.14,Math.cos(a)*.54,.20,.12+.03*(i%3),.17);
  }
  for(const [x,y,z,h] of [[-.47,.70,.17,.57],[.04,1,-.27,.84],[.48,.60,.30,.52]]) {
    k.tag('mole'+Math.round(x*2),()=>{
      k.e('#ac7957',x,y-.19,z,.36,h,.35);
      for(const s of sides) k.eye(x+s*.116,y+h*.36,z+.292,.046);
      k.e('#ea9baa',x,y+h*.12,z+.345,.155,.084,.08);
    });
  }
}
function cats(k,id) {
  const persian=id===53, coat=persian?'#e9cb92':'#f1d8a3', dark='#915c45';
  const y=persian?1.16:1.26,z=persian?.61:.07;
  if(persian) {
    k.e(coat,0,.73,-.13,.40,.41,.86);quadruped(k,coat,.26,.72,.43,-.64);
    chain(k,coat,[[0,.83,-.74],[.12,1.12,-1.05],[.27,1.52,-1.17],[.48,1.65,-1.06],[.59,1.47,-.98]],[.14,.115,.095,.095,.07]);
  } else {
    k.e(coat,0,.67,-.06,.34,.46,.32);feet(k,dark,.20,.14,.16,.16,.12,.25);
    for(const s of sides) chain(k,coat,[[s*.23,.87,.02],[s*.40,.69,.20],[s*.43,.68,.32]],[.10,.093,.081]);
    chain(k,coat,[[0,.49,-.21],[.29,.49,-.60],[.50,.75,-.63],[.62,1,-.51]],[.12,.11,.10,.095]);
    chain(k,dark,[[.62,1,-.51],[.72,1.14,-.40],[.80,1.12,-.31],[.82,.99,-.28]],[.096,.093,.078,.043]);
  }
  k.e(coat,0,y,z,.47,.405,.36);ears(k,persian?coat:dark,'#eaa49d',.29,y+.25,z-.04,.36,.19);
  for(const s of sides) {
    k.e(coat,s*.14,y-.09,z+.29,.20,.12,.13);
    for(let j=0;j<2;j++) k.r(persian?dark:coat,[s*.34,y-.04+j*.07,z+.18],[s*(.75-j*.06),y-.07+j*.19,z+.14],persian?.014:.042,.009);
  }
  eyes(k,.19,y+.045,z+.318,.067); k.e(persian?'#bb766b':dark,0,y-.053,z+.407,.065,.047,.05);
  if(persian) k.e('#c84250',0,y+.21,z+.306,.078,.098,.043);
  else {
    k.e('#da9a33',0,y+.31,z+.27,.12,.224,.054);k.e('#ffdb67',0,y+.32,z+.315,.095,.195,.027);
    k.r('#b78331',[0,y+.18,z+.342],[0,y+.45,z+.342],.012);
    for(const s of sides) k.r(ivory,[s*.13,y-.16,z+.355],[s*.13,y-.25,z+.37],.044,0);
  }
}
function ducks(k,id) {
  const gold=id===54, c=gold?'#f2c34b':'#358db2', bill=gold?'#efcc8e':'#e5d4a0';
  k.e(c,0,.69,-.05,gold?.49:.37,gold?.56:.61,.40); k.e(c,0,1.34,.035,gold?.52:.40,gold?.47:.37,.40);
  k.e(bill,0,1.19,.40,gold?.36:.26,.11,gold?.33:.30); k.e(ink,0,1.167,.52,gold?.32:.22,.016,.21);
  k.e(bill,0,1.21,.49,gold?.34:.24,.072,.255);
  for(const s of sides) {
    const x=s*.21;k.e(ivory,x,1.40,.371,gold?.125:.10,.105,.052); k.e(ink,x,1.40,.419,gold?.035:.050,.06,.023);
    k.e(bill,s*.26,.14,.10,.18,.08,.22);
    for(let t=-1;t<=1;t++) k.r(bill,[s*.26+t*.06,.14,.15],[s*.26+t*.12,.08,.41],.067,.017);
    if(gold) {
      chain(k,c,[[s*.34,.87,0],[s*.55,1.02,.08],[s*.45,1.36,.15]],[.14,.14,.11]);
      for(let t=0;t<3;t++) k.r(c,[s*.47,1.30,.13+t*.06],[s*.42,1.43,.13+t*.06],.046,.024);
    } else {
      chain(k,c,[[s*.24,1.04,0],[s*.44,.79,.02],[s*.57,.68,.22]],[.14,.105,.09]);
      for(let t=-1;t<=1;t++) k.r(ivory,[s*.57+t*.048,.69,.22],[s*.57+t*.080,.62,.36],.04,.005);
    }
  }
  if(gold) for(let i=-1;i<=1;i++) k.r(ink,[i*.045,1.74,-.02],[i*.17,1.96,-.11-Math.abs(i)*.05],.035,.013);
  else {
    for(const s of sides) for(let j=0;j<2;j++) k.r(c,[s*(.11+j*.13),1.56,.01],[s*(.17+j*.24),1.96-j*.13,-.12],.108,.007);
    k.e('#c4474f',0,1.53,.384,.067,.088,.044);
    chain(k,c,[[0,.66,-.30],[.04,.60,-.70],[.23,.74,-1.18]],[.23,.16,.008]);
  }
}
function monkeys(k,id) {
  const prime=id===57,c=prime?'#ead4a8':'#f0dbc2',paw='#a96f53';
  k.e(c,0,.98,0,.64,.61,.49);
  for(let i=0;i<15;i++) {
    const a=i*2*Math.PI/15, x=Math.sin(a),y=Math.cos(a);
    k.r(c,[x*.51,.98+y*.48,0],[x*(.72+.07*(i%2)),.98+y*(.67+.05*(i%3)),(i%3-1)*.09],.13,0);
  }
  for(const s of sides) {
    k.r(c,[s*.43,1.29,-.05],[s*.61,1.58,-.06],.18,.018);
    k.e(ivory,s*.205,1.09,.433,.143,.10,.061); k.e(ink,s*.175,1.07,.485,.044,.063,.018);
    k.r(prime?'#755c48':c,[s*.07,1.10,.474],[s*.34,1.25,.405],.047,.06);
    k.tag('boxing arm'+s,()=>{
      chain(k,c,[[s*.47,.99,0],[s*.72,.90,.045],[s*.81,prime?1.15:.70,.27]],[.135,.105,.115]);
      k.e(prime?paw:c,s*.81,prime?1.18:.64,.30,prime?.19:.12,prime?.18:.15,.15);
      if(prime) k.r('#50505a',[s*.75,1.01,.14],[s*.78,1.10,.22],.155);
    });
    chain(k,c,[[s*.32,.60,-.02],[s*.48,.38,.01],[s*.45,.16,.16]],[.135,.10,.09]);
    k.e(paw,s*.45,.135,.20,.14,.10,.19);
    if(prime) k.r('#50505a',[s*.46,.21,.13],[s*.46,.29,.095],.122);
  }
  k.e(rose,0,.95,.487,.21,.13,.097);for(const s of sides) k.e('#a95268',s*.088,.955,.573,.037,.054,.012);
  if(prime) {
    k.r('#a74f49',[.31,1.41,.28],[.37,1.31,.36],.021);k.r('#a74f49',[.37,1.31,.36],[.48,1.34,.30],.019);
  } else chain(k,paw,[[0,.68,-.36],[.27,.68,-.68],[.63,.91,-.79],[.79,1.18,-.68],[.64,1.28,-.59],[.55,1.17,-.58]],[.10,.09,.077,.066,.057,.03]);
}
function dogs(k,id) {
  const big=id===59,c='#e9904b',ruff='#f6dfa9',stripes='#4d4244';
  k.e(c,0,.77,-.14,big?.47:.39,.47,big?.80:.63);quadruped(k,c,big?.34:.28,.78,.31,big?-.67:-.52,ruff);
  const z=big?.58:.45;
  k.e(ruff,0,1.03,z-.11,.46,.44,.40);k.e(c,0,1.42,z,.42,.37,.37);
  ears(k,c,'#8e5545',.245,1.60,z-.035,big?.32:.24,.145);
  k.e(ruff,0,1.32,z+.28,.32,.16,.24); k.e(ink,0,1.37,z+.49,.105,.071,.060); eyes(k,.20,1.49,z+.286,.062);
  for(const s of sides) {
    for(let i=0;i<3;i++) {
      const zz=-.53+i*.25,w=big?.47:.39, len=big?.80:.63;
      const mark=(a,z)=>{
        const scale=1.026*Math.sqrt(1-((z+.14)/len)**2);
        return [s*w*scale*Math.sin(a),.77+.47*scale*Math.cos(a),z];
      };
      const upper=mark(.12,zz-.062), lower=mark(.16,zz+.079),sideA=mark(.93,zz-.085),sideB=mark(.95,zz+.026),end=mark(1.68,zz+.043);
      k.tri(stripes,upper,lower,sideA);k.tri(stripes,lower,sideB,sideA);k.tri(stripes,sideA,sideB,end);
      if(big) k.r(ruff,[s*.27,1.17,z-.13+i*.09],[s*(.55+(i%2)*.07),.94+i*.11,z-.22+i*.07],.165,.008);
    }
    if(big) {
      k.r(ruff,[s*.23,.60,.32],[s*.39,.35,.22],.15,.015);
      k.r(ruff,[s*.245,1.49,z+.07],[s*.56,1.33,z+.07],.139,.013);
      k.r(ruff,[s*.21,1.35,z+.18],[s*.45,1.10,z+.19],.162,.015);
      k.e(ruff,s*.135,1.72,z+.115,.143,.115,.122);
      k.r(ruff,[s*.112,1.68,z+.19],[s*.25,1.87,z+.18],.097,.006);
    }
  }
  for(let i=-1;i<=1;i++) k.r(ruff,[i*.105,1.68,z-.05],[i*.16,1.96-Math.abs(i)*.10,z-.12],.115,.012);
  const tail=[[0,.82,big?-.76:-.61],[.02,1.04,-.99],[.10,1.34,-1.10],[.18,1.53,-.94],[.22,1.56,-.73]];
  chain(k,ruff,tail,big?[.20,.24,.24,.18,.05]:[.15,.18,.16,.12,.025]);
  if(big) for(let i=0;i<3;i++) k.r(ruff,[.08,1.17+i*.10,-1.02],[.16,1.29+i*.12,-1.30+i*.07],.13,.015);
}
function tadpoles(k,id) {
  const baby=id===60, strong=id===62,c=baby?'#769fc7':strong?'#447fb4':'#548fbd';
  const y=baby?.67:.90, w=baby?.48:strong?.65:.55, h=baby?.49:strong?.62:.56;
  k.e(c,0,y,0,w,h,.46);
  const bellyY=y-.075, bellyW=w*.82, bellyH=h*.72;
  k.e('#faf4df',0,bellyY,.285,bellyW,bellyH,.213);
  const points=[];
  for(let i=0;i<=37;i++) {
    const t=i/37,a=t*Math.PI*4.6*(baby?1:-1),px=t*.87*Math.cos(a),py=t*.87*Math.sin(a);
    points.push([px*bellyW,bellyY+py*bellyH,.291+.213*Math.sqrt(1-px*px-py*py)]);
  }
  chain(k,'#343745',points,points.map(()=>baby?.020:.025));
  for(const s of sides) {
    k.e(c,s*w*.55,y+h*.69,.12,.165,.19,.15);
    k.e('#fff1d5',s*w*.55,y+h*.72,.235,.115,.13,.058);k.eye(s*w*.55,y+h*.72,.284,.052);
    if(strong) k.r(c,[s*w*.32,y+h*.74,.28],[s*w*.78,y+h*.99,.21],.048,.068);
    chain(k,c,[[s*w*.49,y-h*.59,0],[s*w*.64,.21,.02],[s*w*.65,.11,.13]],[baby?.078:.14,baby?.064:.11,.07]);
    k.e(c,s*w*.68,.10,.19,baby?.128:.175,.091,.20);
    if(!baby) {
      const elbow=[s*(w+.17),y-.07,.01], wrist=[s*(w+.31),strong?y+.15:y-.19,.13];
      chain(k,c,[[s*w*.78,y+.13,0],elbow,wrist],[strong?.20:.119,strong?.18:.10,strong?.14:.10]);
      k.e('#fcf3df',wrist[0],wrist[1],wrist[2]+.06,strong?.215:.19,.185,.18);
      k.e('#ece7d7',wrist[0]-s*.12,wrist[1]+.03,wrist[2]+.13,.085,.10,.09);
    }
  }
  if(baby) {
    k.e(rose,0,y+.23,.397,.10,.064,.057);
    chain(k,c,[[0,.54,-.30],[.14,.55,-.62],[.30,.76,-.83]],[.14,.12,.075]);
    leaf(k,'#e8f2fa',[.27,.71,-.80],[.63,1.27,-1.22],.22,.05);
  }
}
function spoon(k,x,y,z) {
  k.r('#acb4bd',[x,y,z],[x+.06,y+.42,z-.035],.026,.021);
  rotate(k.e('#d7dcda',x+.064,y+.48,z-.04,.074,.123,.041),'z',-.14);
}
function psychics(k,id) {
  const abra=id===63, alak=id===65, c='#e9c451',armor='#9f7049',y=abra?1.17:1.44;
  k.e(c,0,.75,0,.28,.44,.25);k.e(armor,0,.95,-.01,.34,.24,.26);
  k.e(c,0,y,.02,.38,.32,.315);
  ears(k,c,'#977344',.249,y+.16,-.015,abra?.39:.55,.162);
  k.e(c,0,y-.085,.28,.20,.14,.25);k.r(c,[0,y-.10,.36],[0,y-.19,.51],.12,.018);
  for(const s of sides) {
    if(abra) k.r(ink,[s*.115,y+.01,.322],[s*.26,y+.049,.255],.019,.018);
    else {
      k.e('#fff1d5',s*.183,y+.045,.293,.097,.069,.042);k.e(ink,s*.17,y+.053,.330,.039,.046,.018);
      k.r(c,[s*.09,y+.065,.337],[s*.29,y+.15,.23],.054,.020);
      chain(k,'#e1c874',[[s*.13,y-.089,.38],[s*.31,y-.137,.39],[s*(alak?.56:.46),y-(alak?.02:.22),.34]],[.04,.065,.003]);
    }
    k.e(armor,s*.265,.99,-.01,.16,.14,.195);
    const elbow=[s*.40,abra?.62:.78,.04],hand=[s*(abra?.29:.54),abra?.46:.89,.23];
    chain(k,c,[[s*.25,.98,.01],elbow,hand],[.10,.085,.082]);k.e(c,...hand,.105,.082,.106);
    const knee=[s*.34,abra?.39:.49,abra?.25:.02],foot=[s*.34,.13,.18];
    chain(k,c,[[s*.185,.57,-.02],knee,foot],[.14,.13,.088]);k.e(c,foot[0],foot[1],foot[2],.16,.11,.23);
    for(const j of [-1,1]) k.r(ivory,[s*.34+j*.055,.12,.28],[s*.34+j*.091,.09,.42],.037,.006);
    if(!abra && (alak||s===1)) spoon(k,hand[0]+s*.035,hand[1]-.06,hand[2]+.07);
  }
  if(!alak) {
    const tail=[[0,.54,-.18],[.14,.39,-.52],[.35,.35,-.78],[.53,.51,-.89],[.61,.72,-.88]];
    chain(k,c,tail,[.22,.22,.19,.16,.055]);
    if(!abra) k.r(armor,[.18,.387,-.55],[.26,.37,-.66],.223,.21);
  }
  if(id===64) {
    const cy=y+.175,cz=.301;
    for(let i=0;i<5;i++) {
      const a=Math.PI*.5+i*2*Math.PI/5;
      k.tri('#ae5255',[Math.cos(a)*.085,cy+Math.sin(a)*.085,cz], [Math.cos(a+2.5)*.044,cy+Math.sin(a+2.5)*.044,cz],[Math.cos(a-2.5)*.044,cy+Math.sin(a-2.5)*.044,cz]);
    }
    for(let i=0;i<2;i++) k.r('#a35951',[-.14,.81-i*.10,.229],[.14,.81-i*.10,.229],.021);
  }
}
function fighters(k,id) {
  const basic=id===66, four=id===68,c=basic?'#82a7aa':four?'#7695a3':'#9e91ac';
  k.e(c,0,.91,0,basic?.32:.42,.43,.25);k.e(c,0,1.21,.015,basic?.36:.56,.32,.30);
  if(!basic) {
    k.e('#373444',0,.68,0,.36,.22,.259); k.e('#5b4f42',0,.82,.012,.376,.091,.257);
    k.e('#e1ae48',0,.823,.255,.134,.093,.034);k.e('#876137',0,.823,.287,.064,.047,.015);
    for(const s of sides) k.e(c,s*.22,1.25,.205,.245,.157,.126);
  }
  const hy=1.75;k.e(c,0,hy,.035,.32,.299,.27);
  for(let i=-1;i<=1;i++) {
    const rc=basic?'#a59770':four?'#b3a277':'#a591a5';
    k.r(rc,[i*.138,hy+.215,.10],[i*.15,hy+.40-Math.abs(i)*.055,-.14],.081,.032);
  }
  if(four) { k.e('#d0b7a0',0,hy-.08,.248,.27,.13,.116);k.r('#806b6b',[-.14,hy-.095,.343],[.14,hy-.095,.343],.014); }
  else k.e(c,0,hy-.10,.228,.255,.112,.093);
  for(const s of sides) {
    k.e('#f8edd7',s*.13,hy+.023,.278,.091,.063,.025);k.e('#aa444d',s*.116,hy+.02,.303,.037,.045,.014);
    k.r(c,[s*.05,hy+.043,.31],[s*.233,hy+.112,.23],.046,.027);
    const arms=four?[[1.32,.83,1.60],[1.04,.78,.67]]:[[1.25,basic?.52:.73,basic?.80:1.09]];
    for(const [shoulder,reach,fistY] of arms) {
      const flex=fistY>shoulder, elbow=[s*(reach-.03),shoulder+(flex?.085:-.17),.01],hand=[s*reach,fistY,.22];
      k.tag('arm'+s+'-'+shoulder,()=>{
        chain(k,c,[[s*(basic?.27:.40),shoulder,.015],elbow,hand],[basic?.123:.162,basic?.117:.15,basic?.082:.11]);
        k.e(c,...elbow,basic?.135:.176,basic?.14:.18,.157);k.e(c,...hand,basic?.128:.154,.139,.132);
        if(id===67) for(let i=0;i<2;i++) k.r('#a76c70',[s*(reach-.19+i*.046),shoulder+.037-i*.018,.13],[s*(reach-.15+i*.046),shoulder-.066-i*.018,.14],.020);
      });
    }
    chain(k,c,[[s*.18,.68,0],[s*.30,.44,.016],[s*.30,.145,.02]],[basic?.12:.17,basic?.106:.14,.091]);
    k.e(c,s*.31,.12,.12,basic?.155:.183,.11,.22);
  }
  if(basic) chain(k,c,[[0,.61,-.18],[.10,.48,-.41],[.19,.55,-.54]],[.126,.086,.008]);
}
function pitchers(k,id) {
  const green='#648f53',light='#84ab62',yellow='#e4c64c',lip='#e59c99',brown='#966c47';
  if(id===69) {
    chain(k,brown,[[0,.30,0],[-.11,.64,0],[.035,1.01,0],[.125,1.31,.05]],[.068,.063,.058,.061]);
    k.e(yellow,.11,1.43,.07,.305,.27,.26); k.e(lip,.11,1.36,.291,.21,.12,.082);k.e('#754d51',.11,1.36,.36,.136,.077,.027);
    for(const s of sides) {k.eye(.11+s*.17,1.48,.261,.041);leaf(k,light,[0,.94,0],[s*.54,.86,.04],.15);chain(k,brown,[[0,.33,0],[s*.22,.17,-.04],[s*.39,.075,.08],[s*.46,.07,.18]],[.064,.051,.036,.013]);}
    return;
  }
  const large=id===71;
  k.e(yellow,0,.89,0,large?.51:.44,large?.76:.60,.40);
  for(const s of sides) {
    leaf(k,green,[s*.35,large?.94:1.02,-.06],[s*(large?.94:.82),large?1.19:1.38,-.035],large?.20:.15);
    for(let i=0;i<2;i++) k.e('#bb9444',s*(.32+i*.015),.66+i*.32,-.212,.087,.127,.075);
  }
  if(large) {
    k.e(lip,0,1.51,.055,.53,.19,.43);k.e('#704e57',0,1.64,.09,.406,.065,.32);
    for(const s of sides) { k.r(ivory,[s*.27,1.66,.27],[s*.25,1.45,.33],.076,.013);k.eye(s*.29,1.19,.323,.062);}
    const stem=[0,1.68,-.29],tip=[.065,1.77,.48],ridge=[.03,1.96,.05];
    for(const s of sides) {
      const edge=[s*.35,1.76,.06];k.tri(light,stem,edge,ridge);k.tri(light,ridge,edge,tip);
    }
    chain(k,brown,[[0,1.71,-.25],[.19,1.98,-.41],[.51,2.04,-.38],[.70,1.77,-.28],[.64,1.62,-.25]],[.075,.056,.045,.036,.018]);
    k.e(light,.65,1.62,-.25,.081,.086,.068);
  } else {
    k.e(lip,0,.64,.322,.40,.26,.175);k.e('#72545a',0,.63,.470,.303,.18,.046);
    for(const s of sides) {k.e(ivory,s*.174,1.05,.336,.108,.141,.069);k.eye(s*.174,1.055,.391,.051);}
    chain(k,brown,[[0,1.40,-.08],[.04,1.63,-.16],[.22,1.76,-.15],[.35,1.69,-.10]],[.076,.065,.049,.022]);
    k.e('#a58151',.34,1.69,-.10,.062,.058,.055);
  }
}
function jellyfish(k,id) {
  const large=id===73,c=large?'#629fb9':'#74adbd',gem='#df5659',tent=large?'#8d98a5':'#aaaba9';
  const y=large?1.65:1.19,w=large?.60:.48, h=large?.49:.49;
  k.e(c,0,y,0,w,h,.43); k.e('#40546a',0,y-.31,.02,w*.79,.27,.34);
  for(const s of sides) {
    k.e(gem,s*w*.56,y+.24,.26,large?.202:.153,large?.183:.16,.101);k.e('#ff9990',s*w*.56-.025,y+.30,.343,.060,.047,.022);
    k.e('#fff4de',s*w*.43,y-.29,.332,.118,.059,.035);k.e(ink,s*w*.41,y-.295,.358,.047,.041,.017);
    if(large) {
      chain(k,'#497d99',[[s*.19,y-.05,.25],[s*.32,y-.27,.34],[s*.38,y-.52,.27],[s*.24,y-.64,.29]],[.12,.105,.079,.022]);
      k.r('#669cb5',[s*.37,y+.12,-.12],[s*.69,y+.40,-.20],.15,.01);
    }
  }
  k.e(gem,0,y+.045,.415,large?.12:.084,large?.112:.079,.050);
  const count=large?10:2;
  for(let i=0;i<count;i++) {
    const a=large?i*2*Math.PI/count:(i?Math.PI*.5:-Math.PI*.5),x=Math.sin(a),z=Math.cos(a);
    const endX=x*(large?.88:.54)+Math.sin(a*2+.4)*.09;
    const root=[x*w*.68,y-.35,z*.22];
    k.tag('tentacle'+i,()=>{
      chain(k,tent,[root,[x*w*.90,y-.60,z*.30],[x*.57,.40+.07*Math.cos(a),z*.42],[endX,.12+.06*Math.sin(a*3),z*.54+.03],[endX+.11,.18+.07*Math.sin(a*3),z*.59+.03]],[large?.083:.092,.071,.055,.033,.009]);
    });
  }
}
function rocks(k,id) {
  const geo=id===74,golem=id===76,c=golem?'#847a69':geo?'#9a9480':'#958c7d';
  const y=geo?.65:.88,w=geo?.49:.66;
  k.e(c,0,y,0,w,geo?.37:.61,geo?.39:.54);
  if(golem) {
    // Armor plates sit tangent to the shell around its entire circumference.
    for(let row=0;row<3;row++) for(let i=0;i<7;i++) {
      const a=(i+row*.44)*2*Math.PI/7,lat=(row-1)*.70,s=Math.cos(lat);
      const p=[Math.cos(a)*s*.61,y+Math.sin(lat)*.57,Math.sin(a)*s*.50];
      const plate=k.e((i+row)%3?'#786f61':'#938779',...p,.244,.23,.132);plate.rotation.y=Math.PI/2-a;plate.rotation.x=-lat;
    }
    k.e('#a2a584',0,1.14,.46,.335,.30,.32); k.e('#a7a485',0,1.04,.68,.29,.142,.189);
    eyes(k,.15,1.20,.719,.049);
    for(const s of sides) k.r(ivory,[s*.17,1.04,.795],[s*.18,.94,.80],.045,.005);
  } else {
    for(let i=0;i<(geo?6:12);i++) {
      const a=i*2.40, yy=geo?.77+.09*(i%2):.90+.22*(i%3),rr=geo?.42:.51;
      const x=Math.sin(a)*rr,z=Math.cos(a)*rr*.80;
      const b=k.b(i%3?'#a49c88':'#8c8574',x,yy,z,.22+.08*(i%2),.18+.05*(i%3),.22);b.rotation.set(.19,a,.24*Math.sin(a));
    }
    for(const s of sides) {
      k.e(ivory,s*.195,y+.08,geo?.344:.494,.115,.081,.04);k.e(ink,s*.175,y+.071,geo?.38:.523,.048,.062,.019);
      k.r(c,[s*.07,y+.085,geo?.388:.54],[s*.33,y+.18,geo?.29:.43],.067,.082);
    }
    k.r('#675e56',[-.18,y-.105,geo?.37:.53],[.18,y-.105,geo?.37:.53],.021);
    if(!geo) k.e(c,0,y-.18,.442,.29,.15,.118);
  }
  for(const s of sides) {
    const armRows=id===75?[y+.12,y-.17]:[y+.04];
    for(const [j,sy] of armRows.entries()) {
      const elbow=[s*(geo?.79:.85),sy+(j?-.19:.02),-.03],fist=[s*(geo?.83:.94),sy+(j?-.25:geo?.43:.19),.08];
      chain(k,golem?'#a2a584':c,[[s*w*.79,sy,.01],elbow,fist],[geo?.135:.157,.12,.11]);
      k.e(golem?'#a2a584':c,...fist,.16,.16,.145);
      for(let t=-1;t<=1;t++)k.e(c,fist[0]+t*.073,fist[1]+.06,fist[2]+.085,.052,.077,.056);
    }
    if(!geo) {
      k.e(golem?'#a2a584':c,s*.37,.41,0,.20,.29,.19);k.e(golem?'#a2a584':c,s*.39,.15,.105,.21,.14,.254);
      if(golem) for(let i=-1;i<=1;i++) k.r(ivory,[s*.39+i*.081,.14,.25],[s*.39+i*.105,.09,.43],.066,.007);
    }
  }
}
function flame(k,x,y,z,h,w,lean,back) {
  const base=[x,y,z],mid=[x+lean*.27,y+h*.42,z+back*.28],tip=[x+lean,y+h,z+back];
  chain(k,'#e65e39',[base,mid,tip],[w,w*.79,.005]);
  chain(k,'#ffac3d',[[x,y+.008,z+w*.27],[mid[0],y+h*.31,mid[2]+w*.38],[x+lean*.78,y+h*.81,z+back*.78+w*.17]],[w*.76,w*.62,.003]);
}
function horses(k,id) {
  const rapid=id===78,c='#f2dfad',hoof='#a78c78', y=rapid?1.10:.90;
  k.e(c,0,y,-.09,.33,.37,.65);k.r(c,[0,y+.09,.29],[0,y+.64,.51],.25,.168);
  k.e(c,0,y+.72,.53,.225,.236,.255); k.e(c,0,y+.64,.72,.174,.133,.233);eyes(k,.145,y+.762,.710,.044);
  for(const s of sides) {
    k.r(c,[s*.122,y+.88,.47],[s*.158,y+1.11,.432],.084,.014);
    k.e('#a5866b',s*.086,y+.69,.906,.023,.017,.013);
    for(const z of [-.51,.34]) {
      const knee=[s*.235,y*.52,z+(z<0?.06:-.04)],ankle=[s*.24,.19,z+.02];
      chain(k,c,[[s*.21,y-.03,z],knee,ankle],[.127,.093,.069]);
      k.e(hoof,ankle[0],.105,ankle[2]+.04,.101,.092,.139);
      flame(k,s*.25,.26,z-.02,rapid?.35:.245,.086,s*.039,-.13);
    }
  }
  for(let i=0;i<5;i++) {
    const t=i/4;
    flame(k,0,y+.21+t*.71,.22+t*.24,rapid?.36:.255,.105+.026*t,.022*(i%2),-.25-.088*t);
  }
  chain(k,'#e65e39',[[0,y+.09,-.61],[0,y+.20,-.88],[.07,y+.23,-1.13],[.10,y+.39,-1.28]],[.129,.147,.114,.026]);
  for(let i=0;i<4;i++) flame(k,.03,y+.11+i*.025,-.82-i*.132,.29+i*.056,.13-i*.009,.03,-.19);
  for(const s of sides) {
    for(let i=0;i<3;i++) flame(k,s*.14,y+.32+i*.13,.24+i*.064,.22+i*.025,.082,s*(rapid?.17:.11),-.19);
  }
  flame(k,-.05,y+.88,.52,rapid?.32:.23,.093,-.102,-.11);
  if(rapid) k.r('#d3ad7d',[0,y+.865,.661],[0,y+1.39,.86],.083,.004);
}
function spiralShell(k,x,y,z,scale) {
  const sh='#a29a9e';
  for(let i=0;i<4;i++) k.e(i%2?sh:'#b9acaf',x,y+i*.112*scale,z-i*.10*scale,(.36-i*.066)*scale,(.27-i*.045)*scale,(.29-i*.054)*scale);
  for(const s of sides) for(let j=0;j<2;j++)k.r(sh,[x+s*(.25-j*.16)*scale,y+.13*scale,z-j*.14*scale],[x+s*(.46-j*.21)*scale,y+(.39+j*.16)*scale,z-(.05+j*.19)*scale],.10*scale,.004);
  for(const s of sides) {k.e('#ffedd8',x+s*.155*scale,y+.02*scale,z+.247*scale,.074*scale,.072*scale,.044*scale);k.e(ink,x+s*.145*scale,y+.02*scale,z+.28*scale,.032*scale,.048*scale,.018*scale);}
  k.e('#5f5363',x,y-.113*scale,z+.243*scale,.24*scale,.086*scale,.042*scale);
  for(const s of sides) k.r(ivory,[x+s*.145*scale,y-.078*scale,z+.285*scale],[x+s*.14*scale,y-.16*scale,z+.30*scale],.037*scale,.002);
}
function slows(k,id) {
  const bro=id===80,c='#e8a1a9',muzzle='#e9ca9e';
  const y=bro?1.40:.77,z=bro?.12:.51;
  if(bro) {
    k.e(c,0,.77,-.02,.48,.62,.425);k.e(muzzle,0,.76,.273,.367,.433,.191);
    for(const s of sides) {
      k.e(c,s*.32,.24,.06,.22,.22,.26);k.e(c,s*.34,.15,.16,.209,.128,.259);
      chain(k,c,[[s*.34,.96,0],[s*.50,.81,.026],[s*.52,.76,.20]],[.145,.13,.11]);
      for(let j=-1;j<=1;j++)k.r(ivory,[s*.52+j*.045,.78,.20],[s*.52+j*.066,.77,.286],.032,.003);
    }
    chain(k,c,[[0,.54,-.35],[.22,.47,-.69],[.35,.68,-.91],[.37,1.00,-.88]],[.19,.166,.14,.113]);spiralShell(k,.35,1.08,-.86,1.18);
  } else {
    k.e(c,0,.49,-.12,.405,.34,.68);quadruped(k,c,.255,.48,.27,-.55);
    chain(k,c,[[0,.51,-.65],[.06,.51,-.95],[.20,.68,-1.17],[.27,.90,-1.25],[.30,1.09,-1.18]],[.19,.16,.141,.121,.100]);
    chain(k,'#f5dfa9',[[.30,1.09,-1.18],[.31,1.19,-1.12],[.32,1.23,-1.06]],[.101,.075,.038]);
  }
  k.e(c,0,y,z,.43,.34,.34); k.e(muzzle,0,y-.111,z+.281,.39,.175,.21);
  for(const s of sides) {
    k.e(c,s*.345,y+.197,z-.07,.123,.118,.098); k.e('#c57c8a',s*.36,y+.206,z+.01,.061,.058,.035);
    k.e('#fff1da',s*.178,y+.055,z+.279,.119,.115,.060);k.e(ink,s*.180,y+.059,z+.335,.027,.035,.013);
    k.e('#ad8b75',s*.110,y-.07,z+.466,.027,.012,.016);
  }
  k.r('#967a73',[-.22,y-.156,z+.457],[.22,y-.156,z+.457],.014);
}
function magnet(k,x,y,z,factor) {
  const p=(dx,dy,dz)=>[x+dx*factor,y+dy*factor,z+dz*factor];
  const metal='#aabcc6';k.e(metal,x,y,z,.36*factor,.35*factor,.31*factor);
  k.e('#fcf1d7',...p(0,.025,.279),.18*factor,.171*factor,.058*factor);k.eye(x,y+.028*factor,z+.333*factor,.063*factor);
  for(const s of sides) {
    k.b('#6f7f91',...p(s*.375,0,-.035),.14*factor,.32*factor,.16*factor);
    for(const j of sides) {
      k.b('#8398a8',...p(s*.479,j*.117,-.035),.24*factor,.10*factor,.16*factor);
      k.b(j*s===1?'#da5b56':'#5884c2',...p(s*.606,j*.117,-.035),.102*factor,.108*factor,.17*factor);
    }
    k.r('#8e9eac',p(s*.16,-.22,.12),p(s*.23,-.29,.20),.048*factor);
    k.e('#cdd6d5',...p(s*.23,-.29,.20),.081*factor,.078*factor,.040*factor);
    k.r('#6c7680',p(s*.23-.043,-.30,.235),p(s*.23+.043,-.278,.235),.012*factor);
  }
  k.r('#919da5',p(0,.28,0),p(0,.41,0),.055*factor); k.r('#c6ccca',p(0,.39,0),p(0,.46,0),.12*factor);
  k.b('#78818c',...p(0,.461,0),.156*factor,.009*factor,.024*factor);
}
function magnets(k,id) {
  if(id===81) magnet(k,0,.45,0,1);
  else {
    k.tag('left orb',()=>magnet(k,-.34,.40,.035,.82));
    k.tag('right orb',()=>magnet(k,.34,.40,-.06,.82));
    k.tag('top orb',()=>magnet(k,0,.94,.008,.93));
  }
}
function farfetch(k) {
  const coat='#a88c6b',cream='#e5cc9f',beak='#e9b952';
  k.e(coat,0,.68,-.04,.38,.40,.44);k.e(cream,0,.63,.20,.31,.28,.25);k.e(coat,0,1.24,.08,.365,.335,.33);
  k.e(beak,0,1.14,.395,.211,.073,.207);eyes(k,.16,1.28,.363,.049);
  for(const s of sides) {
    k.r('#4c4141',[s*.037,1.277,.411],[s*.236,1.42,.30],.047,.030);
    k.e(coat,s*.32,.77,-.01,.14,.258,.295);k.r(beak,[s*.14,.39,0],[s*.16,.126,.03],.050);
    for(let j=-1;j<=1;j++) k.r(beak,[s*.16,.10,.08],[s*.16+j*.095,.07,.25],.045,.018);
  }
  for(let i=-1;i<=1;i++) {
    k.r(coat,[i*.097,1.47,.01],[i*.175,1.73-Math.abs(i)*.044,-.10],.075,.002);
    leaf(k,coat,[i*.11,.69,-.31],[i*.26,1.02,-.66],.096,.04);
  }
  const butt=[-.59,.36,.06],middle=[-.39,.90,.15],top=[-.30,1.17,.19];
  chain(k,'#ebe4bb',[butt,middle,top],[.080,.063,.056]);
  for(let i=-1;i<=1;i++) leaf(k,i===0?'#599759':'#78a665',top,[-.30+i*.23,1.67-Math.abs(i)*.10,.17+i*.06],.071,.035);
}
function ostriches(k,id) {
  const trio=id===85,fur=trio?'#a46e4b':'#b08660',legs='#b89876',bill='#c8a779';
  k.e(fur,0,.79,-.075,.42,.39,.42);
  for(let i=0;i<8;i++) {const a=i*Math.PI/4;k.r(fur,[Math.sin(a)*.315,.76,Math.cos(a)*.31-.075],[Math.sin(a)*.42,.59+(i%2)*.055,Math.cos(a)*.41-.075],.114,.014);}
  for(const s of sides) {
    chain(k,legs,[[s*.19,.65,0],[s*.22,.40,-.055],[s*.22,.13,.004]],[.069,.050,.041]);
    for(let j=-1;j<=1;j++) k.r(legs,[s*.22,.10,.045],[s*.22+j*.092,.073,.248],.039,.007);
  }
  const necks=trio?[[-.44,1.59,.02,0],[0,1.89,-.15,1],[.46,1.71,.12,2]]:[[-.33,1.69,.14,0],[.35,1.56,-.085,1]];
  for(const [x,y,z,mood] of necks) {
    k.tag('neck'+mood,()=>{
      chain(k,trio?'#39333a':legs,[[x*.40,.97,-.04],[x*.75,1.22,z*.53],[x,y-.11,z]],[.082,.068,.074]);
      k.e(fur,x,y,z,.226,.216,.214);k.r(bill,[x,y-.016,z+.145],[x+(mood-1)*.03,y-(mood===1?.066:.026),z+.447],.086,.006);
      for(const s of sides) {
        k.eye(x+s*.101,y+.047,z+.18,.040);
        if(trio&&mood===0)k.r('#4a3835',[x+s*.036,y+.049,z+.206],[x+s*.143,y+.102,z+.153],.023);
        if(trio) k.r('#3e3437',[x+s*.057,y+.15,z-.04],[x+s*.115,y+.35-Math.abs(x)*.11,z-.12],.050,.004);
      }
      if(trio&&mood===2) k.r(bill,[x,y-.05,z+.13],[x,y-.12,z+.38],.067,.006);
    });
  }
  if(trio) for(let i=-1;i<=1;i++) leaf(k,'#b77683',[i*.095,.82,-.35],[i*.273,1.27,-.85+Math.abs(i)*.12],.115,.065);
}
function seals(k,id) {
  const dew=id===87,c=dew?'#d7e7e9':'#dce6e5',shadow='#bccdd2';
  k.e(c,0,.56,-.14,.40,.34,dew?.80:.63);
  k.r(c,[0,.59,.22],[0,.87,.47],.293,.235); k.e(c,0,.91,.48,.321,.29,.31);
  k.e(c,0,.82,.707,.235,.141,.174);eyes(k,.142,.99,.729,.049);k.e('#595864',0,.884,.87,.069,.042,.030);
  k.r(c,[0,1.12,.51],[0,1.39,.57],.087,.007);
  for(const s of sides) {
    const fin=k.e(c,s*.40,.43,.015,.281,.073,.218);fin.rotation.z=s*-.23;fin.rotation.y=s*-.45;
    if(!dew) {k.r(ivory,[s*.14,.795,.837],[s*.125,.64,.87],.052,.008);k.e(shadow,s*.16,.868,.797,.087,.052,.058);}
  }
  if(!dew) k.e('#e3a0ab',0,.744,.855,.096,.075,.064);
  const tail=[[0,.53,-.55],[.06,.56,-.87],[.13,.72,-1.09],[.16,.91,-1.18]];
  chain(k,c,tail,[.26,.195,.123,.075]);
  for(const s of sides) {
    const tip=[.16+s*(dew?.36:.27),1.14,-1.26];
    const fin=k.e(c,(.16+tip[0])*.5,1.04,-1.215,.125,.217,.073);fin.rotation.z=-s*.72;
    leaf(k,c,tail[3],tip,.110,.043);
  }
  if(dew) k.lengthPath=[[0,.82,.88],[0,.90,.53],[0,.62,.25],[0,.56,-.15],...tail,[.48,1.13,-1.26]];
}
function sludge(k,id) {
  const muk=id===89,c=muk?'#9b7da6':'#a889b4',ridge=muk?'#886b94':'#93779f';
  const x=muk?-.23:0;
  k.e(c,0,.18,0,muk?.80:.64,.187,muk?.58:.48);
  for(let i=0;i<10;i++) {const a=i*Math.PI/5;k.e(i%3?c:ridge,Math.sin(a)*.53,.14,Math.cos(a)*.39,.209,.135,.19);}
  for(let i=0;i<3;i++)k.e(i%2?ridge:c,x*(i+1)*.45,.39+i*.18,-i*.012,(muk?.70:.55)-i*(muk?.077:.048),.21+i*.016,(muk?.51:.41)-i*.022);
  if(muk) {
    k.e(c,.53,.28,-.09,.43,.23,.30);k.e(c,.72,.15,.12,.27,.12,.22);
    for(let i=0;i<4;i++)k.e(ridge,-.42+i*.23,.32+Math.sin(i*2)*.047,.35,.19,.080,.15);
  }
  k.e(c,x,.91,-.015,.44,.35,.35);
  for(const s of sides) {
    k.e('#fff4df',x+s*.185,1.018,.276,.118,.089,.051);k.e(ink,x+s*.17,1.019,.322,.038,.045,.017);
    if(muk) k.r(c,[x+s*.06,1.015,.333],[x+s*.31,1.119,.239],.057,.045);
    const high=muk?s<0:s>0,endX=x+s*(high?.75:muk?1.04:.72),endY=high?1.23:muk?.28:.67;
    k.tag('ooze arm'+s,()=>{
      chain(k,c,[[x+s*.34,.76,0],[x+s*.55,.77,.024],[endX,endY-.10,.10]],[.185,.156,.122]);
      k.e(c,endX,endY,.10,.162,.148,.123);
      for(let i=-1;i<=1;i++) chain(k,c,[[endX+i*.064,endY,.10],[endX+i*.097,endY+.11,.116],[endX+i*.121,endY+.18-Math.abs(i)*.025,.154]],[.061,.047,.017]);
    });
    if(muk) k.e(ridge,x+s*.33,.65,.27,.14,.055,.074);
  }
  k.e('#413447',x,.855,.317,.284,.108,.061);k.e('#c58fa8',x-.018,.817,.363,.16,.046,.021);
  if(!muk) k.r(c,[x-.25,.906,.336],[x+.23,.906,.336],.026,.02);
}
function shells(k,id) {
  const cloyster=id===91,c=cloyster?'#8a81a3':'#a299bb',dark='#453e59';
  if(!cloyster) {
    k.e(c,0,.37,-.04,.50,.235,.43);k.e(dark,0,.54,.055,.415,.244,.35);
    k.e(c,0,.75,-.08,.51,.34,.43);
    for(let j=-2;j<=2;j++) {
      const x=j*.143; k.r('#8b83a4',[x*.39,1.012,-.18],[x,.68,.266-Math.abs(j)*.027],.028,.052);
      k.r(c,[x,.711,.23],[x,.62+Math.abs(j)*.025,.37-Math.abs(j)*.035],.087,.016);
    }
    for(const s of sides) {k.e(ivory,s*.153,.574,.35,.099,.099,.041);k.eye(s*.145,.58,.39,.045);}
    k.e('#de92a3',0,.414,.379,.173,.082,.25);k.r('#bc7389',[0,.484,.383],[0,.464,.548],.011);
    return;
  }
  k.e('#756d8f',0,.91,-.17,.58,.69,.42);k.e(dark,0,.92,.094,.49,.56,.32);
  const n=16, outer=[], inner=[],back=[];
  for(let i=0;i<n;i++) {
    const a=i*2*Math.PI/n,rx=i%2?.55:.72,ry=i%2?.68:.92;
    outer.push([Math.cos(a)*rx,.93+Math.sin(a)*ry,-.005+(i%2)*.06]);
    inner.push([Math.cos(a)*.364,.93+Math.sin(a)*.397,.31+.025*(i%2)]);
    back.push([Math.cos(a)*.49,.93+Math.sin(a)*.61,-.34]);
  }
  for(let i=0;i<n;i++) {
    const j=(i+1)%n;
    k.tri(i%2?'#b7a9c3':c,inner[i],outer[i],outer[j]);k.tri(i%2?c:'#aaa0bb',inner[i],outer[j],inner[j]);
    k.tri('#817791',outer[i],back[i],back[j]);k.tri(c,outer[i],back[j],outer[j]);
    if(i%2===0) {
      const a=i*2*Math.PI/n;
      k.r(c,[outer[i][0]*.78,.93+(outer[i][1]-.93)*.78,-.05],[Math.cos(a)*(Math.abs(Math.sin(a))<.2?.93:.84),.93+Math.sin(a)*1.10,.14],.124,.003);
    }
  }
  k.e('#4e455e',0,.916,.23,.327,.36,.242);
  for(const s of sides) {
    k.e('#f7eddf',s*.122,.985,.444,.105,.075,.041);k.e(ink,s*.115,.982,.482,.036,.047,.013);
    k.r(dark,[s*.035,.995,.484],[s*.219,1.07,.399],.033,.032);
  }
  k.r('#d6c9d1',[-.14,.835,.444],[.13,.86,.455],.012);
  k.r(c,[0,1.34,-.26],[.07,2.03,-.53],.18,.006);
}
function haunterFace(k,y,z,x,size) {
  for(const s of sides) {
    const face=k.e('#eee8df',s*x,y,z,.14*size,.096*size,.051*size);face.rotation.z=s*.30;
    k.e('#b85365',s*(x-.015),y-.004,z+.044*size,.040*size,.069*size,.014*size);
  }
  const br=.27*size, low=y-.20*size;
  k.e('#403448',0,low,z+.002,br,.087*size,.048*size);
  for(const s of sides) k.r('#403448',[s*br*.56,low,z+.014],[s*br*1.15,low+.065*size,z-.038],.048*size,.009);
  for(const s of sides) k.r(ivory,[s*br*.62,low+.062*size,z+.030],[s*br*.62,low-.035*size,z+.055],.045*size,.002);
}
function ghosts(k,id) {
  if(id===92) {
    for(let i=0;i<15;i++) {
      const a=i*2*Math.PI/15,r=.49+.048*(i%3),x=Math.sin(a)*r,y=.79+Math.cos(a)*r;
      k.e(i%3?'#9d79ab':'#816c9f',x,y,-.11-(i%2)*.055,.155+.025*(i%3),.18-.016*(i%2),.16);
      if(i%2===0) k.r('#9f81ae',[x,y,-.135],[x+Math.sin(a)*.17+.105,y+Math.cos(a)*.19+.068,-.215],.114,.008);
    }
    k.e('#483a51',0,.79,0,.49,.49,.46);
    for(const s of sides) {const eye=k.e('#fff0d9',s*.19,.88,.373,.194,.162,.083);eye.rotation.z=s*.37;k.e(ink,s*.156,.88,.452,.052,.073,.014);}
    k.e('#ad728a',0,.633,.425,.20,.055,.026);
    for(const s of sides)k.r(ivory,[s*.145,.672,.424],[s*.147,.54,.436],.041,.006);
  } else if(id===93) {
    const c='#877aa6';k.e(c,0,1.01,0,.52,.42,.35); k.e('#756993',0,.81,-.11,.38,.29,.30);
    for(const s of sides) {
      k.r(c,[s*.288,1.20,-.05],[s*.55,1.63,-.18],.19,.008);
      for(let j=0;j<2;j++) k.r(c,[s*.37,.96+j*.10,-.035],[s*(.61+j*.12),.84+j*.23,-.12],.102,.006);
      k.e(c,s*.69,.66,.22,.181,.127,.173);
      for(let i=-1;i<=1;i++) chain(k,c,[[s*.69+i*.072,.67,.26],[s*.69+i*.12,.70,.40],[s*.69+i*.141,.59,.50]],[.067,.050,.005]);
    }
    chain(k,'#756993',[[0,.83,-.21],[.10,.69,-.46],[.22,.79,-.72]],[.21,.12,.002]);
    haunterFace(k,1.07,.31,.185,1.05);
  } else {
    const c='#746491';k.e(c,0,.86,0,.59,.69,.48); k.e(c,0,1.22,.025,.53,.40,.429);
    ears(k,c,'#645979',.33,1.45,-.03,.42,.176);
    for(const s of sides) {
      chain(k,c,[[s*.41,.96,0],[s*.60,.82,.01],[s*.69,.72,.115]],[.167,.147,.104]);
      for(let i=-1;i<=1;i++) k.r(c,[s*.67+i*.045,.73,.11],[s*.69+i*.071,.64,.21],.046,.005);
      k.e(c,s*.31,.25,0,.222,.23,.21);k.e(c,s*.36,.14,.10,.224,.127,.24);
      for(let j=0;j<3;j++) k.r(c,[s*.25,1.11+j*.15,-.30],[s*(.41-j*.045),1.26+j*.15,-.49+j*.02],.104,.003);
    }
    for(let j=0;j<4;j++)k.r(c,[(j-1.5)*.127,1.48,-.12],[(j-1.5)*.148,1.66-Math.abs(j-1.5)*.035,-.19],.075,.004);
    k.r(c,[0,.66,-.34],[.05,.54,-.72],.16,.004);
    for(const s of sides) {
      const eye=k.e('#cf6774',s*.201,1.282,.402,.14,.082,.052);eye.rotation.z=s*.33;k.e('#463447',s*.175,1.279,.452,.032,.053,.016);
      k.r(c,[s*.053,1.305,.448],[s*.343,1.398,.338],.050,.059);
    }
    const smile=k.e('#eaddcc',0,1.047,.414,.319,.120,.067);smile.rotation.x=-.07;
    for(let i=-2;i<=2;i++) {
      const x=i*.099,z=.414+.064*Math.sqrt(1-(x/.319)**2);
      k.r('#8a7288',[x,1.13,z-.008],[x,1.00,z+.001],.010);
    }
  }
}
export const onixSpine=[
    [0,1.99,.48,.35],[-.11,1.61,.32,.31],[-.27,1.30,.19,.30],[-.46,1.01,.07,.29],
    [-.63,.74,-.08,.27],[-.70,.49,-.31,.25],[-.64,.32,-.60,.23],[-.41,.26,-.84,.21],
    [-.104,.23,-.91,.19],[.17,.22,-.84,.175],[.40,.24,-.71,.154],[.59,.28,-.57,.133],
    [.76,.32,-.47,.11],[.92,.38,-.45,.086],[1.04,.44,-.48,.062],[1.13,.51,-.51,.038]
  ];
function onix(k) {
  const gray=['#93959a','#85898f','#9b9e9f','#8c9097'];
  const segments=onixSpine;
  for(let i=1;i<segments.length;i++) {
    k.tag('stone'+i,()=>{
      const [x,y,z,r]=segments[i], rock=k.e(gray[i%4],x,y,z,r*1.12,r*1.03,r*.96);
      rock.rotation.set((i%3)*.24,i*.78,(i%4-2)*.17);
      if(i<7) {const face=k.b(gray[(i+2)%4],x-r*.13,y+r*.30,z+r*.23,r*1.28,r*.71,r*.98);face.rotation.set(.26,i*.54,.17);}
    });
  }
  k.e(gray[2],0,2.035,.49,.366,.348,.358);k.e(gray[0],0,1.925,.683,.331,.18,.226);
  k.r(gray[1],[.012,2.275,.435],[.095,2.72,.32],.143,.004);
  for(const s of sides) {
    k.e('#f4ead2',s*.169,2.08,.773,.111,.085,.041);k.e(ink,s*.15,2.074,.81,.04,.063,.016);
    k.r(gray[1],[s*.043,2.087,.825],[s*.279,2.19,.69],.067,.072);
  }
  k.r('#5b606a',[-.201,1.887,.859],[.201,1.887,.859],.016);
  k.lengthPath=[[0,1.96,.905],...segments.map(s=>s.slice(0,3)),[1.16,.54,-.52]];
}
function tapirs(k,id) {
  const hyp=id===97,c=hyp?'#e8c350':'#dec15c',brown='#986f59';
  k.e(hyp?c:brown,0,.63,0,.395,.44,.313);k.e(c,0,.93,.018,.384,.34,.316);
  if(!hyp) for(let i=-2;i<=2;i++)k.e(c,i*.132,.76+.045*Math.cos(i*1.8),.20,.129,.112,.134);
  k.e(c,0,1.41,.02,.354,.313,.301);
  if(hyp) ears(k,c,'#bd9756',.237,1.57,-.025,.33,.14);
  else for(const s of sides){k.e(c,s*.277,1.59,-.018,.132,.142,.095);k.e('#bd925b',s*.289,1.60,.052,.073,.079,.038);}
  chain(k,c,[[0,1.395,.23],[0,1.305,.396],[.021,1.172,.50],[.037,1.126,.486]],[.157,.125,.084,.063]);
  for(const s of sides) {
    if(hyp) {k.e(ivory,s*.139,1.474,.272,.087,.06,.035);k.e(ink,s*.126,1.47,.302,.032,.043,.014);}
    else k.r(ink,[s*.085,1.459,.317],[s*.231,1.489,.229],.020);
    k.r(c,[s*.073,1.49,.315],[s*.228,1.544,.226],.038,.034);
    const high=hyp&&s>0,hand=[s*(high?.69:.48),high?1.21:.72,high?.28:.16];
    chain(k,c,[[s*.28,1.02,-.01],[s*.43,high?1.01:.84,.01],hand],[.121,.10,.078]); k.e(c,...hand,.102,.083,.095);
    for(let j=-1;j<=1;j++) k.r(c,[hand[0]+j*.042,hand[1],hand[2]+.058],[hand[0]+j*.079,hand[1]+(high?.048:-.057),hand[2]+.144],.033,.015);
    k.e(hyp?c:brown,s*.232,.313,.01,.158,.23,.153);k.e(hyp?c:brown,s*.243,.133,.102,.165,.125,.20);
    for(let j of sides) k.r(ivory,[s*.243+j*.062,.14,.222],[s*.243+j*.078,.11,.32],.042,.003);
  }
  if(hyp) {
    for(let i=0;i<9;i++) {
      const a=i*2*Math.PI/9,x=Math.sin(a),z=Math.cos(a);
      k.r(ivory,[x*.23,1.20,z*.20],[x*.45,.99+(i%2)*.075,z*.31],.126,.008);
    }
    k.r('#6b6557',[.70,1.22,.381],[.70,.884,.397],.018);
    const pts=[]; for(let i=0;i<=14;i++){const a=i*2*Math.PI/14;pts.push([.70+.105*Math.sin(a),.773+.112*Math.cos(a),.397]);}
    chain(k,'#c2c9c9',pts,pts.map(()=>.025));
  }
}
function crabs(k,id) {
  const king=id===99,c=king?'#cd7847':'#dd8560',pale='#e9c398';
  k.e(pale,0,.47,0,.48,.265,.36);k.e(c,0,.59,-.055,.52,.248,.383);
  k.e(pale,0,.45,.234,.42,.184,.163); k.r('#9e7665',[-.212,.418,.378],[.212,.418,.378],.019);
  for(const s of sides) {
    k.r(pale,[s*.205,.70,.14],[s*.236,.88,.204],.076,.061);k.e('#fff0d7',s*.236,.875,.204,.091,.108,.085);k.eye(s*.236,.893,.273,.049);
    for(let i=0;i<3;i++) {
      const z=.11-i*.21, knee=[s*(.62+i*.037),.43-i*.025,z-.075],tip=[s*(.67+i*.067),.100,z-.20];
      chain(k,c,[[s*.35,.49,z],knee,tip],[.075,.060,.018]);
    }
    const huge=king&&s===-1, mult=huge?1.74:1;
    const px=s*(huge?.95:.78),py=huge?.91:.73,pz=.17;
    chain(k,c,[[s*.35,.56,.14],[s*.55,.49,.25],[px,py-.09,.18]],[.111,.093,huge?.128:.10]);
    k.e(c,px,py,pz,.203*mult,.17*mult,.16*mult);
    for(const j of sides) {
      const root=[px+j*.10*mult,py+.08*mult,pz],joint=[px+j*.16*mult,py+.25*mult,pz+.018],tip=[px+j*.049*mult,py+(.40+(j<0?.027:0))*mult,pz+.048];
      chain(k,c,[root,joint,tip],[.10*mult,.074*mult,.007]);
      if(huge) k.r(pale,[joint[0],joint[1]-.02,pz+.085],[joint[0]-j*.084,joint[1]+.024,pz+.076],.046,.004);
    }
  }
  const num=king?5:2;
  for(let i=0;i<num;i++){const x=(i-(num-1)*.5)*(king?.15:.36);k.r(c,[x,.748,-.06],[x*1.20,.92+(king?.07*(i%2):0),-.07],king?.095:.074,.005);}
}
function orbs(k,id) {
  const electrode=id===101,red='#d86154',white='#ebe7dc',rad=.62,cy=.64,n=12;
  for(let i=0;i<n;i++) {
    const a=-Math.PI/2+i*Math.PI/n, b=a+Math.PI/n;
    k.r((i<n/2)===electrode?red:white,[0,cy+rad*Math.sin(a),0],[0,cy+rad*Math.sin(b),0],rad*Math.cos(a),rad*Math.cos(b));
  }
  for(const s of sides) {
    const x=s*.231,y=cy+.12,z=.561;
    if(electrode){k.r(ink,[x-s*.075,y+.044,z+.019],[x+s*.096,y+.103,z-.024],.026,.026);k.e(ink,x,y-.032,z+.003,.039,.063,.026);}
    else {
      k.tri('#fff6df',[s*.073,y-.019,.613],[s*.374,y+.150,.435],[s*.294,y-.017,.532]);
      k.e(ink,s*.145,y+.002,.588,.036,.046,.023);
      k.r('#914c43',[s*.061,y-.012,.614],[s*.35,y+.162,.444],.017,.021);
    }
  }
  if(electrode) {
    const corners=[[-.35,cy-.075,.492],[-.19,cy-.137,.570],[0,cy-.166,.600],[.19,cy-.137,.57],[.35,cy-.075,.492]];
    const lower=[[-.35,cy-.075,.492],[-.19,cy-.243,.533],[0,cy-.284,.550],[.19,cy-.243,.533],[.35,cy-.075,.492]];
    for(let i=0;i<4;i++){k.tri(ivory,corners[i],lower[i],corners[i+1]);k.tri(ivory,corners[i+1],lower[i],lower[i+1]);}
    chain(k,ink,corners,corners.map(()=>.014));
  }
}
export function middle(id,kit) {
  if(!Number.isInteger(id)||id<51||id>101) throw new RangeError(`Unknown middle Kanto species ${id}`);
  if(id===51)return dugtrio(kit);
  if(id<=53)return cats(kit,id);
  if(id<=55)return ducks(kit,id);
  if(id<=57)return monkeys(kit,id);
  if(id<=59)return dogs(kit,id);
  if(id<=62)return tadpoles(kit,id);
  if(id<=65)return psychics(kit,id);
  if(id<=68)return fighters(kit,id);
  if(id<=71)return pitchers(kit,id);
  if(id<=73)return jellyfish(kit,id);
  if(id<=76)return rocks(kit,id);
  if(id<=78)return horses(kit,id);
  if(id<=80)return slows(kit,id);
  if(id<=82)return magnets(kit,id);
  if(id===83)return farfetch(kit);
  if(id<=85)return ostriches(kit,id);
  if(id<=87)return seals(kit,id);
  if(id<=89)return sludge(kit,id);
  if(id<=91)return shells(kit,id);
  if(id<=94)return ghosts(kit,id);
  if(id===95)return onix(kit);
  if(id<=97)return tapirs(kit,id);
  if(id<=99)return crabs(kit,id);
  return orbs(kit,id);
}
