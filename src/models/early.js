// Front is +Z. Each family is sculpted around its own resting pose.
const ivory = '#fff1ce', ink = '#302d39', gold = '#edb84c';
const sides = [-1, 1];
const mix = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);
const shift = (a, x, y, z) => [a[0] + x, a[1] + y, a[2] + z];

// A folded leaf, ear or feather. The raised central ridge gives the surface volume.
function blade(k, color, base, tip, width, ridge) {
  const middle = mix(base, tip, .49);
  const left = middle.map((n, i) => n - width[i]);
  const right = middle.map((n, i) => n + width[i]);
  const peak = middle.map((n, i) => n + ridge[i]);
  const back = middle.map((n, i) => n - ridge[i] * .5);
  for (const [a, b] of [[base, left], [left, tip], [tip, right], [right, base]]) {
    k.tri(color, a, b, peak);
    k.tri(color, b, a, back);
  }
}
function leaf(k, color, base, angle, radius, rise, width) {
  const x = Math.cos(angle), z = Math.sin(angle);
  blade(k, color, base, shift(base, radius*x, rise, radius*z), [-z*width, 0, x*width], [0, .12, 0]);
}
function tagged(k,name,build) {
  return k.tag ? k.tag(name,build) : build();
}
function ear(k, s, base, tip, width, color, inner) {
  tagged(k,'ear',()=>{
    blade(k, color, base, tip, [s*width, 0, 0], [0, 0, .11]);
    if (inner) {
      const low = shift(mix(base, tip, .19), 0, 0, .085);
      const high = shift(mix(base, tip, .85), 0, 0, .055);
      blade(k, inner, low, high, [s*width*.62, 0, 0], [0, 0, .055]);
    }
  });
}
function eyes(k, x, y, z, size) {
  for (const s of sides) k.eye(s*x, y, z, size);
}
function line(k, color, points, radii) {
  for (let i = 1; i < points.length; i++) {
    k.r(color, points[i-1], points[i], radii[i-1], radii[i]);
    if (i < points.length-1) k.e(color, ...points[i], radii[i], radii[i], radii[i]);
  }
}
function feet(k, s, x, z, color, size, claws = 0) {
  k.e(color, s*x, size*.65, z, size*.78, size*.65, size);
  for (let i=0; i<claws; i++) {
    const xx = s*x + (i-(claws-1)*.5)*size*.42;
    k.r(ivory, [xx, size*.32, z+size*.60], [xx, size*.2, z+size*1.02], size*.15, .005);
  }
}
function smile(k, y, z, width, color=ink) {
  line(k, color, [[-width,y,z-.025],[0,y-.035,z],[width,y,z-.025]], [.014,.019,.014]);
}
function bulb(k, id) {
  const mature = id === 3, skin = ['','#73bda6','#61adad','#539b96'][id];
  const spot = mature ? '#377d77' : '#3a8c80';
  const broad = mature ? 1.17 : 1;
  k.e(skin, 0,.72,-.08, .69*broad,.52,.86);
  k.e(skin, 0,.98,.63, .70*broad,.52,.58);
  for (const s of sides) {
    ear(k,s,[s*.43*broad,1.26,.46],[s*.69*broad,1.61,.39],.18,skin,mature ? '#a47877' : null);
    for (const z of [-.55,.48]) {
      k.e(skin,s*.49*broad,.43,z,.23,.34,.24);
      feet(k,s,.49*broad,z+.07,skin,.27,3);
    }
    k.e('#e87478',s*.39*broad,1.09,1.088,.15,.16,.065);
    k.e('#793f4d',s*.39*broad,1.09,1.145,.055,.095,.023);
    k.e('#fff7e0',s*.39*broad+.035,1.145,1.143,.047,.057,.023);
    if(mature) k.r(skin,[s*.27*broad,1.16,1.146],[s*.52*broad,1.26,1.033],.072,.058);
    k.e(spot,s*.44*broad,1.27,.93,.12,.065,.06);
    k.e(spot,s*.64*broad,.85,-.16,.07,.12,.19);
    k.e(ink,s*.11,.99,1.207,.024,.02,.012);
  }
  smile(k,.85,1.205,.25);
  tagged(k,'back plant',()=>{
    if (id === 1) {
      k.e('#5eaa6b',0,1.28,-.37,.50,.49,.5);
      for (let i=0;i<6;i++) {
        const a = i*Math.PI/3;
        blade(k, i%2 ? '#70b469' : '#528f59',
          [.39*Math.cos(a),1.16,-.37+.39*Math.sin(a)], [0,1.95,-.39],
          [-.22*Math.sin(a),0,.22*Math.cos(a)],[.15*Math.cos(a),0,.15*Math.sin(a)]);
      }
    } else {
      const base = [0,1.33,-.30];
      for (let i=0;i<(mature?9:6);i++) leaf(k,i%2?'#408954':'#62a458',base,i*2*Math.PI/(mature?9:6),mature?1.15:.91,-.27,mature?.38:.26);
      if (!mature) {
        k.e('#de657f',0,1.70,-.30,.41,.51,.39);
        for (let i=0;i<5;i++) {
          const a=i*1.257;
          blade(k,'#e9778d',[.27*Math.cos(a),1.53,-.30+.27*Math.sin(a)],[.12*Math.cos(a),2.27,-.30+.12*Math.sin(a)],[-.18*Math.sin(a),0,.18*Math.cos(a)],[.16*Math.cos(a),0,.16*Math.sin(a)]);
        }
      } else {
        k.r('#855d49',base,[0,1.94,-.30],.29,.20);
        for (let i=0;i<6;i++) {
          const a=i*Math.PI/3, x=Math.cos(a), z=Math.sin(a);
          const petal=k.e(i%2?'#e1818a':'#d9747f',.54*x,1.97,-.30+.54*z,.59,.13,.34);
          petal.rotation.y=-a;
          k.e('#f4c4ab',.69*x,2.085,-.30+.69*z,.085,.025,.085);
          k.e('#f4c4ab',.85*x+.09*z,2.066,-.30+.85*z-.09*x,.052,.019,.052);
        }
        k.e('#dda447',0,2.09,-.30,.27,.22,.26);
      }
    }
  });
}
function lizard(k,id) {
  const elder=id===5, skin=elder?'#ce5e4e':'#f39852';
  k.e(skin,0,.88,0,.46,.66,.44);
  k.e('#f6d79c',0,.83,.26,.34,.53,.23);
  k.e(skin,0,1.69,.10,.47,.43,.45);
  k.e(skin,0,1.53,.42,.40,.22,.35);
  k.e('#f7dba8',0,1.445,.46,.33,.12,.29);
  for (const s of sides) {
    k.e(skin,s*.34,.4,.02,.23,.30,.29); feet(k,s,.36,.15,skin,.30,3);
    k.r(skin,[s*.31,1.17,.02],[s*.59,.92,.24],.15,.10);
    k.e(skin,s*.60,.90,.25,.135,.10,.14);
    for (let i=0;i<3;i++) k.r(ivory,[s*(.54+i*.055),.89,.33],[s*(.55+i*.062),.84,.41],.03,.006);
    k.eye(s*.30,1.77,.432,.093);
    if(elder) k.r(skin,[s*.22,1.82,.49],[s*.40,1.92,.37],.056,.042);
    k.e(ink,s*.12,1.625,.715,.021,.02,.014);
  }
  if(elder) k.r(skin,[0,1.92,-.07],[0,2.32,-.29],.23,.015);
  const tail=[[0,.67,-.24],[.08,.41,-.70],[.16,.36,-1.04],[.22,.64,-1.35],[.20,.94,-1.44]];
  line(k,skin,tail,[.24,.19,.13,.075,.05]);
  k.e('#f77f33',.20,1.05,-1.44,.17,.25,.15);
  k.r('#f77f33',[.2,1.1,-1.44],[.11,1.53,-1.45],.15,.008);
  k.r('#ffd056',[.20,.92,-1.30],[.25,1.30,-1.36],.10,.005);
}
function turtle(k,id) {
  const elder=id===9, mid=id===8, skin=elder?'#5386ae':mid?'#7faacb':'#70b8c4';
  const w=elder?.80:.52, h=elder?.87:.57, y=elder?1.09:.87;
  k.e('#f2dcb8',0,y,-.13,w+.06,h+.04,.43);
  k.e('#8e6148',0,y,-.25,w,h,.44);
  k.e('#a97753',0,y,-.575,w*.68,h*.69,.14);
  for (const s of sides) {
    line(k,'#624a40',[[0,y+.38*h,-.653],[s*w*.54,y+.21*h,-.63],[s*w*.82,y+.33*h,-.49]],[.029,.027,.02]);
    line(k,'#624a40',[[s*w*.54,y+.21*h,-.63],[s*w*.53,y-.30*h,-.63],[0,y-.48*h,-.65]],[.027,.027,.023]);
  }
  k.e(skin,0,y,.13,w*.9,h*.95,.39);
  k.e('#ddbd84',0,y,.36,w*.83,h*.93,.23);
  for (let i=-1;i<=1;i++) {
    const yy=y+i*h*.4;
    line(k,'#b99a68',[[-w*.57,yy,.50],[0,yy-.045,.595-Math.abs(i)*.03],[w*.57,yy,.50]],[.018,.021,.018]);
  }
  const head=y+h*.81;
  k.e(skin,0,head,.40,w*.89,w*.80,w*.84);
  k.e(skin,0,head-.12,.62,w*.80,w*.47,w*.69);
  eyes(k,w*.55,head+.095,.40+w*.62,w*.15);
  smile(k,head-.17,.64+w*.65,w*.37);
  for(const s of sides) {
    k.e(skin,s*w*.68,.38,.05,w*.43,.32,w*.51);
    feet(k,s,w*.70,.18,skin,w*.55,elder?3:0);
    k.r(skin,[s*w*.72,y+.22,.17],[s*(w+.21),y-.13,.39],w*.31,w*.23);
    k.e(skin,s*(w+.21),y-.13,.39,w*.29,w*.28,w*.31);
    if(mid) ear(k,s,[s*.28,head+.19,.29],[s*.77,head+.78,.0],.17,'#b6d9ec',null);
    if(elder) {
      const a=[s*.44,y+.50,-.39], end=[s*.64,y+1.0,.06];
      k.e('#805d49',...a,.27,.28,.27);
      k.r('#b8c4c9',a,end,.17,.19);
      k.r('#424b58',end,shift(end,.004*s,.024,.022),.13,.13);
    }
  }
  if(mid) {
    line(k,'#bdd8ea',[[0,.66,-.5],[.18,.85,-.88],[.22,1.13,-1.04],[.14,1.32,-.94],[.05,1.24,-.80]],[.15,.24,.27,.19,.08]);
  } else if(!elder) {
    line(k,skin,[[0,.63,-.46],[0,.57,-.78],[0,.74,-.98],[0,.87,-.87],[0,.78,-.78]],[.12,.18,.19,.13,.06]);
  } else k.r(skin,[0,.61,-.42],[0,.47,-.94],.18,.03);
}
function grub(k,id) {
  const green=id===10, main=green?'#91c453':'#cda06b';
  const seg=[[0,.25,-1.10],[0,.30,-.76],[0,.34,-.40],[0,.37,-.04],[0,.54,.28],[0,.79,.48]];
  for (let i=0;i<seg.length;i++) {
    const [x,y,z]=seg[i], w=[.20,.29,.33,.36,.41,.45][i];
    k.e(main,x,y,z,w,w*(i===5?1.02:.90),w*.98);
    if(i>0 && i<5) for (const s of sides) {
      k.e(green?'#eccb69':'#d88c98',s*w*.68,y*.49,z,.12,.12,.14);
      if(green && i%2===0) {
        k.e('#eddd98',s*w*.94,y+.042,z,.045,.13,.13);
        k.e('#6d9962',s*w*.985,y+.045,z,.026,.065,.068);
      }
    }
  }
  if(green) {
    for(const s of sides) {
      k.e('#f8d98c',s*.285,.86,.79,.146,.163,.092);
      k.eye(s*.285,.87,.857,.111);
      k.r('#e66b76',[0,1.13,.46],[s*.28,1.43,.48],.082,.06);
      k.e('#e66b76',s*.28,1.43,.48,.06,.07,.06);
    }
    k.e('#f2cd74',0,.24,-1.16,.13,.13,.23);
  } else {
    eyes(k,.23,.88,.84,.069);
    k.e('#d98193',0,.69,.88,.22,.17,.17);
    k.r(ivory,[0,1.17,.48],[0,1.69,.48],.13,.008);
    k.r(ivory,[0,.32,-1.19],[0,.47,-1.59],.11,.008);
  }
  k.lengthPath=[[0,.26,green?-1.39:-1.59],...seg,[0,.77,green?.92:1.05]];
}
function cocoon(k,id) {
  const green=id===11, base=green?'#83b953':'#d9b344', stripe=green?'#548c48':'#a17c33';
  if(green) {
    line(k,base,[[0,.06,-.35],[0,.52,-.20],[0,.95,.03],[0,1.18,.0],[0,1.68,-.23]],[.055,.28,.39,.36,.045]);
    k.r(base,[0,.88,.17],[0,1.06,.78],.32,.012);
    for(const s of sides) {
      blade(k, stripe,[s*.31,1.12,-.09],[s*.28,.50,-.13],[0,.0,.15],[s*.035,.0,0]);
      k.e(ivory,s*.29,1.075,.255,.092,.097,.055);
      k.e(ink,s*.31,1.087,.299,.042,.056,.031);
      k.r(base,[s*.18,1.17,.39],[s*.38,1.15,.20],.058,.046);
    }
  } else {
    line(k,base,[[0,.02,-.03],[0,.42,0],[0,.78,.03],[0,1.08,0],[0,1.44,-.02],[0,1.69,-.02]],[.05,.27,.37,.33,.32,.06]);
    for(const s of sides) {
      k.e(ink,s*.18,1.28,.255,.088,.09,.051);
      k.r(base,[s*.09,1.33,.31],[s*.29,1.40,.24],.061,.053);
      blade(k,'#ecca57',[s*.31,1.10,.05],[s*.14,.65,.36],[s*.11,0,0],[0,0,.10]);
      line(k,stripe,[[s*.27,.64,.14],[s*.16,.58,.28],[0,.55,.31]],[.018,.025,.018]);
    }
  }
}
// A shallow faceted wing with a contiguous inset panel and contrasting rim.
function wingPanel(k, edge, fill, outline, center) {
  const inner=outline.map(p=>mix(center,p,.84));
  const back=shift(center,0,0,-.07);
  for (let i=0;i<outline.length;i++) {
    const j=(i+1)%outline.length;
    k.tri(edge,outline[i],outline[j],inner[j]);
    k.tri(edge,outline[i],inner[j],inner[i]);
    k.tri(fill,inner[i],inner[j],center);
    k.tri(fill,outline[j],outline[i],back);
  }
}
function butterfly(k,id) {
  const moth=id===49, body=moth?'#ac8cc2':'#8882b3', wing=moth?'#c7b3d7':'#eee9eb';
  k.e(body,0,.81,.05,.23,.50,.24);
  k.e(moth?'#b399c4':'#9691bd',0,1.33,.11,.36,.34,.31);
  k.e(moth?'#e4cedc':'#9cced1',0,.80,.234,.14,.38,.12);
  for(const s of sides) {
    const front=(x,y,z)=>[s*x,y,z];
    wingPanel(k,moth?'#a68ab8':'#404251',wing,[
      front(.13,1.02,-.12),front(.45,1.60,-.24),front(1.10,1.96,-.49),
      front(1.47,1.85,-.55),front(1.48,1.55,-.50),front(1.18,1.16,-.40),front(.51,.96,-.20)
    ],front(.79,1.40,-.22));
    wingPanel(k,moth?'#a68ab8':'#41434e',wing,[
      front(.17,.98,-.20),front(.71,1.13,-.41),front(1.21,.90,-.49),
      front(1.14,.60,-.50),front(.73,.41,-.42),front(.38,.52,-.32)
    ],front(.66,.79,-.25));
    if(!moth) {
      for(const [x,y,z] of [[1.30,1.73,-.46],[1.15,1.31,-.37],[.92,.53,-.39]]) {
        line(k,'#5b5a65',[front(.35,1.04,-.15),front(.75,1.18,-.22),front(x,y,z)],[.026,.03,.016]);
      }
      k.e('#db687b',s*.235,1.38,.33,.144,.170,.094);
      k.e('#a6d1d7',s*.22,.44,.16,.12,.13,.15);
    } else {
      k.e('#f3ebd6',s*.232,1.38,.33,.124,.15,.08);
      k.e(ink,s*.245,1.38,.395,.038,.07,.029);
      for (let i=0;i<2;i++) k.r('#a58ab5',front(.49,1.45-i*.21,-.22),front(1.27,1.68-i*.31,-.43),.036,.018);
    }
    line(k,body,[front(.14,1.57,.10),front(.25,1.85,.12),front(.40,1.95,.14)],[.045,.035,.055]);
    for(let i=0;i<2;i++) k.r(body,front(.14,.97-i*.14,.15),front(.34,.77-i*.16,.28),.055,.031);
  }
  if(moth) k.r(body,[0,1.55,.04],[0,1.94,.11],.11,.01);
  else k.e('#78acb7',0,1.15,.37,.094,.076,.08);
}
function bee(k) {
  k.e('#efc65a',0,.74,-.28,.38,.53,.40);
  for(const [y,z,size] of [[.70,-.30,.405],[.48,-.36,.308]]) k.e(ink,0,y,z,size,.094,size);
  k.r(ivory,[0,.42,-.40],[0,.06,-.62],.13,.004);
  k.e('#e3b24b',0,1.19,.01,.32,.35,.31);
  k.e('#efc556',0,1.60,.21,.41,.37,.37);
  for(const s of sides) {
    k.e('#d55c6d',s*.255,1.64,.475,.16,.18,.095);
    line(k,ink,[[s*.14,1.87,.18],[s*.21,2.08,.15],[s*.37,2.11,.15]],[.04,.035,.025]);
    for(const [rise,span] of [[.86,.91],[.35,.81]]) {
      blade(k,'#d6e7e6',[s*.15,1.19,-.18],[s*span,1.19+rise,-.65],[s*.16,-.12,.015],[0,.04,.07]);
    }
    line(k,'#474852',[[s*.24,1.18,.10],[s*.55,1.05,.14],[s*.67,1.09,.48]],[.095,.073,.086]);
    k.r(ivory,[s*.67,1.09,.39],[s*.90,1.03,1.08],.176,.004);
    line(k,ink,[[s*.21,.86,-.01],[s*.48,.57,.10],[s*.43,.31,.29]],[.05,.052,.029]);
    k.e('#d8b756',s*.43,.30,.30,.08,.054,.11);
  }
}
function bird(k,id) {
  const fierce=id>=21, elder=id===18||id===22, mid=id===17;
  const plum=fierce?'#ac7652':elder?'#bf985e':'#bb976e';
  const wing=fierce?'#a6574c':mid||elder?'#b68859':'#947751';
  const face=fierce?'#bd8b5d':'#ebc996', scale=elder?1.27:1;
  const headY=fierce&&elder?1.89:elder?1.54:1.39;
  k.e(plum,0,.81,-.09,.45*scale,.51,.53*scale);
  k.e(face,0,.79,.26,.37*scale,.41,.32);
  if(fierce&&elder) k.r('#b68a5b',[0,.90,.12],[0,headY,.25],.24,.16);
  k.e(face,0,headY,.23,.37,.35,.36);
  k.e(plum,0,headY+.16,.14,.37,.23,.33);
  const beak=fierce&&elder?.95:fierce?.42:.31;
  k.r(fierce?'#d59b72':'#dbab75',[0,headY-.06,.48],[0,headY-(fierce&&elder?.21:.12),.52+beak],.13,.005);
  for(const s of sides) {
    if(!fierce) k.e('#644c40',s*.249,headY+.025,.472,.126,.095,.068);
    k.eye(s*.25,headY+.055,.509,.065);
    k.r(fierce?'#975548':plum,[s*.17,headY+.10,.52],[s*.34,headY+.16,.38],.046,.053);
    line(k,'#c59373',[[s*.19,.48,.055],[s*.21,.15,.10],[s*.21,.065,.21]],[.072,.050,.055]);
    for(let i=-1;i<=1;i++) k.r('#c99873',[s*.21,.06,.18],[s*.21+i*.10,.04,.36-Math.abs(i)*.025],.038,.011);
    tagged(k,'wing',()=>{
      // Three vanes nest behind the wing coverts on each shoulder.
      const span=elder?1.24:mid?.94:.57;
      const wingtip=elder?.95:mid?.50:.05;
      if(mid||elder) {
        const tip=.39+span;
        const plan=[[.27,.98,.11],[.56,1.14,.09],[.90,1.26+wingtip*.25,-.04],
          [tip,.82+wingtip,-.36],[tip-.13,.58+wingtip,-.64],
          [tip-.28,.58+wingtip,-.54],[tip-.35,.48+wingtip,-.78],
          [tip-.48,.52+wingtip,-.65],[tip-.63,.45+wingtip,-.82],
          [.56,.77,-.59],[.28,.81,-.31]];
        const points=plan.map(([x,y,z])=>[s*x,y,z]);
        wingPanel(k,fierce?'#86534b':'#997448',wing,points,[s*.82,1.04+wingtip*.32,-.15]);
      }
      for(let i=0;i<4;i++) {
        blade(k,i%2?wing:plum,[s*.28,1.02,-.03],[s*(.39+span-i*.13),.80+wingtip-i*.10,-.42-i*.12],
          [s*.083,.16,.14],[0,.065,.04]);
      }
      if(elder||mid) {
        const shoulder=k.e(wing,s*.61*scale,1.08+wingtip*.12,-.13,.38,.215,.33);
        shoulder.rotation.z=s*wingtip*.6;
      } else k.e(wing,s*.38*scale,.89,-.12,.23,.26,.46);
    });
    for(let i=0;i<2;i++) blade(k,(mid||elder)&&!fierce?'#c77b64':'#e7caa0',[s*(.12+i*.08),.75,-.34],[s*(.18+i*.16),.98,-1.02-i*.13],[s*.105,.03,0],[0,.055,0]);
  }
  if(mid||elder||fierce) {
    const crest= fierce?'#a85043':'#cf6e66';
    const long=(elder&&!fierce)?1.13:mid?.71:.35;
    for(let i=-1;i<=1;i++) {
      const tipY=headY+(fierce?.51:elder?.04:.28);
      blade(k,(!fierce&&elder&&i===0)?'#efd175':crest,[i*.10,headY+.27,.30],[i*.19,tipY,-.12-long+Math.abs(i)*.18],[.135,0,0],[0,elder?.30:.17,0]);
      if(fierce&&elder) k.r(crest,[i*.11,headY+.23,.12],[i*.15,headY+.61,-.14],.09,.006);
    }
  } else {
    for(const s of sides) k.r(plum,[s*.09,headY+.20,.02],[s*.14,headY+.44,-.06],.098,.01);
  }
}
function rat(k,id) {
  const big=id===20, skin=big?'#b39259':'#a889ad', cream='#f4dbb5', w=big?.63:.43;
  k.e(skin,0,.62,-.15,w,.48,.65);
  k.e(cream,0,.56,.245,w*.81,.35,.37);
  k.e(skin,0,.94,.40,w*.87,.38,.41);
  for(const s of sides) {
    k.e(skin,s*w*.70,1.22,.29,.19,.23,.114);
    k.e(big?'#d2ae8c':'#deb2bd',s*w*.70,1.24,.38,.12,.15,.045);
    k.eye(s*w*.56,1.00,.69,.075);
    k.e(cream,s*w*.40,.78,.71,.22,.17,.21);
    k.e(skin,s*w*.67,.37,-.30,.23,.26,.26);
    feet(k,s,w*.75,-.15,'#d3a4a1',.23);
    k.r(skin,[s*w*.59,.58,.27],[s*w*.60,.15,.39],.106,.069);
    feet(k,s,w*.60,.39,'#d3a4a1',.16);
    k.b(ivory,s*.065,.66,.885,.116,big?.25:.16,.085);
    for(let i=0;i<(big?3:2);i++) {
      line(k,big?'#614945':'#746576',[[s*w*.44,.80,.76],[s*w*.96,.85-i*.055,.80],[s*(w+.34),.93-i*.13,.84+i*.03]],[.019,.018,.008]);
    }
  }
  k.e('#d09b9b',0,.875,.874,.088,.062,.065);
  const tail=big?[[0,.63,-.59],[.17,.42,-.98],[.42,.52,-1.21],[.53,.84,-1.35]]:
    [[0,.52,-.60],[.08,.48,-.95],[.20,.79,-1.20],[.25,1.08,-1.12],[.23,1.10,-.94]];
  line(k,big?'#d8ae8e':skin,tail,big?[.12,.085,.057,.026]:[.098,.065,.055,.045,.026]);
}
function snake(k,id) {
  const cobra=id===24, skin=cobra?'#8e79a5':'#a780ad';
  // Coil on the ground and lift the forebody clear of the loop.
  const path=[[-.54,.36,-.44],[-.78,.26,-.24],[-.77,.22,.10],[-.48,.21,.43],[0,.20,.48],[.45,.23,.20],[.47,.27,-.27],[.18,.32,-.50],[-.13,.40,-.32],[-.20,.57,-.05],[-.13,.85,.17],[0,1.16,.21],[0,cobra?1.65:1.43,.22]];
  const radii=[.065,.11,.15,.17,.18,.19,.19,.19,.19,.18,.17,.16,.17];
  line(k,skin,path,radii);
  const headY=cobra?1.86:1.53;
  if(cobra) {
    k.e(skin,0,1.35,.15,.63,.57,.20);
    k.e('#a28aaf',0,1.36,.266,.54,.47,.115);
    for(const s of sides) {
      k.e('#e5c36a',s*.33,1.49,.354,.18,.145,.042);
      k.e(ink,s*.33,1.51,.390,.113,.093,.023);
      k.e('#d86861',s*.32,1.51,.412,.060,.062,.014);
      k.r(ink,[s*.08,1.25,.39],[s*.43,1.18,.344],.056,.044);
      k.r('#e5c36a',[s*.06,1.08,.355],[s*.32,1.02,.309],.040,.020);
    }
  } else {
    for(let i=0;i<3;i++) {
      k.e(gold,-.53-i*.015,.38+i*.086,-.44,.125-i*.014,.079,.115-i*.012);
    }
    k.e(gold,0,1.19,.225,.177,.065,.17);
  }
  k.e(skin,0,headY,.29,cobra?.30:.26,.23,.31);
  k.e(cobra?'#9b85ac':'#dbb676',0,headY-.095,.52,.224,.114,.20);
  for(const s of sides) {
    k.e('#eacc74',s*.182,headY+.02,.493,.077,.079,.044);
    k.e(ink,s*.185,headY+.02,.529,.023,.053,.016);
    if(cobra) k.r(ivory,[s*.13,headY-.12,.605],[s*.13,headY-.25,.635],.034,.005);
  }
  line(k,'#d77084',[[0,headY-.14,.66],[0,headY-.16,.82]], [.021,.014]);
  for(const s of sides) k.r('#d77084',[0,headY-.16,.82],[s*.038,headY-.17,.90],.014,.004);
  k.lengthPath=[...(cobra?[]:[[-.56,.62,-.44]]),...path,[0,headY,.36],[0,headY-.08,.72]];
}
function raichu(k) {
  const orange='#e8a04a', dark='#795842';
  k.e(orange,0,.71,0,.48,.63,.41);
  k.e('#f7dfaa',0,.68,.30,.35,.45,.165);
  k.e(orange,0,1.44,.13,.48,.42,.38);
  for(const s of sides) {
    ear(k,s,[s*.28,1.71,.04],[s*.75,2.22,-.02],.18,dark,'#f2c75a');
    k.r(dark,[s*.73,2.17,-.024],[s*.84,2.04,-.035],.08,.022);
    k.e('#f4cd5e',s*.375,1.37,.365,.12,.10,.066);
    k.eye(s*.227,1.53,.444,.067);
    k.r(orange,[s*.37,.96,.15],[s*.51,.74,.30],.14,.11);
    k.e(dark,s*.51,.73,.31,.115,.113,.12);
    k.e(orange,s*.34,.30,.0,.22,.26,.25);
    feet(k,s,.35,.17,dark,.25);
    k.e(dark,s*.27,.90,-.31,.17,.063,.085);
    k.e(dark,s*.28,.72,-.32,.17,.056,.087);
  }
  k.e(ink,0,1.44,.502,.045,.03,.026);
  smile(k,1.35,.491,.10);
  line(k,dark,[[0,.53,-.28],[.16,.41,-.72],[.45,.48,-1.02],[.80,.77,-1.02],[.89,1.05,-.82]],[.071,.049,.042,.036,.038]);
  const bolt=[[.87,1.02,-.82],[1.22,1.35,-.78],[1.05,1.36,-.79],[1.37,1.74,-.74],[.86,1.43,-.81],[1.00,1.42,-.80]];
  for(let i=1;i<bolt.length-1;i++) k.tri('#f7ce56',bolt[0],bolt[i],bolt[i+1]);
}
function sand(k,id) {
  const spiny=id===28, skin=spiny?'#c5a161':'#e2bd6b', back=spiny?'#967446':'#bc944e';
  k.e(skin,0,.67,-.06,.48,.53,.51);
  k.e('#f2dba6',0,.68,.27,.35,.40,.20);
  k.e(skin,0,1.11,.20,.43,.40,.36);
  k.e(skin,0,1.0,.427,.32,.20,.27);
  for(const s of sides) {
    ear(k,s,[s*.23,1.29,.09],[s*.39,1.59,.035],.12,skin,spiny?back:null);
    k.eye(s*.276,1.16,.452,.064);
    k.e(skin,s*.34,.34,-.12,.24,.29,.25); feet(k,s,.36,.055,skin,.24,3);
    k.r(skin,[s*.32,.89,.11],[s*.54,.67,.30],.14,.096);
    k.e(skin,s*.54,.66,.31,.14,.12,.15);
    for(let i=-1;i<=1;i++) {
      k.r(ivory,[s*.54+i*.062,.64,.39],[s*.56+i*.078,.57,spiny?.73:.52],spiny?.060:.032,.005);
    }
  }
  if(spiny) {
    for(let row=0;row<3;row++) {
      const count=row===1?5:4;
      for(let j=0;j<count;j++) {
        const a=(j/(count-1)-.5)*2.68, yy=1.23-row*.28;
        const base=[.34*Math.sin(a),yy,-.15-.26*Math.cos(a)];
        k.r(j%2?'#a28451':back,base,shift(base,.29*Math.sin(a),.22-row*.06,-.55*Math.cos(a)),.146,.006);
      }
    }
    line(k,skin,[[0,.49,-.34],[0,.36,-.73],[.07,.34,-1.06]],[.20,.14,.022]);
  } else {
    // Bricks follow the curvature of the shell.
    for(const [yy,rad] of [[.46,.42],[.69,.485],[.92,.42],[1.15,.38],[1.35,.30]]) {
      const rear=yy>1.05?.19:-.056;
      for(let i=0;i<8;i++) {
        const a=-1.66+(i+.5)*.415, b=a-.207, c=a+.207;
        line(k,back,[[rad*Math.sin(b),yy,rear-rad*Math.cos(b)],[rad*Math.sin(a),yy,rear-rad*Math.cos(a)],[rad*Math.sin(c),yy,rear-rad*Math.cos(c)]],[.010,.012,.010]);
        if(i%2===(Math.round(yy*5)%2)) k.r(back,[rad*Math.sin(b),yy,rear-rad*Math.cos(b)],[rad*.98*Math.sin(b),yy+.14,rear-rad*.98*Math.cos(b)],.011,.009);
      }
    }
    k.r(skin,[0,.46,-.34],[.05,.26,-.89],.16,.013);
  }
}
function nido(k,id) {
  const female=id<32, stage=(id-(female?29:32)), big=stage===2;
  const skin=female?['#9dbdca','#8eb2c5','#70a5b9'][stage]:['#bf92b4','#b088ad','#a184b0'][stage];
  const spots=female?'#638da6':'#856591', inner=female?'#8293a9':'#6f917d';
  const w=big?.60:stage?.50:.38, y=big?.87:.54, head=big?1.58:stage?1.04:.86;
  k.e(skin,0,y,-.12,w,big?.69:.40,big?.54:.63);
  if(big) k.e('#ead7ae',0,.85,.22,.44,.49,.24);
  k.e(skin,0,head,big?.18:.38,w*.93,big?.44:.335,w*.84);
  k.e(skin,0,head-.11,big?.48:.65,w*.83,.21,w*.62);
  for(const s of sides) {
    const base=[s*w*.55,head+.16,big?.09:.24];
    const tip=[s*(w+.16),head+(big?.53:stage?.78:.69),base[2]-.17];
    ear(k,s,base,tip,female&&stage===0?.17:.21,skin,inner);
    k.eye(s*w*.60,head+.052,big?.53:.38+w*.59,.064+(big?.019:0));
    if(stage) k.r(skin,[s*w*.40,head+.1,big?.58:.69],[s*w*.76,head+.16,big?.42:.54],.054,.040);
    k.e(ink,s*.11,head-.045,(big?.48:.65)+w*.58,.025,.021,.017);
    k.e(skin,s*w*.70,.33,-.28,.23,big?.35:.24,.27); feet(k,s,w*.74,big?.06:-.16,skin,big?.32:.23,3);
    if(big) {
      k.e(skin,s*.48,1.13,.03,.25,.26,.26);
      k.r(skin,[s*.49,1.1,.04],[s*.77,.82,.24],.17,.145);
      k.e(skin,s*.77,.80,.25,.175,.135,.17);
      for(let i=-1;i<=1;i++) k.r(ivory,[s*.77+i*.07,.77,.35],[s*.77+i*.075,.72,.47],.039,.006);
      if(female) k.e('#e7d7ae',s*.24,1.19,.36,.215,.19,.095);
    } else {
      k.r(skin,[s*w*.63,.57,.23],[s*w*.67,.16,.36],.134,.102);
      feet(k,s,w*.67,.41,skin,.17,2);
    }
    for(const [dz,dy,rr] of [[-.27,.10,.105],[.01,.19,.075],[-.43,.01,.071]]) k.e(spots,s*w*.93,y+dy,-.09+dz,.058,rr,rr*1.10);
    if(stage) k.r(ivory,[s*w*.50,head-.16,big?.64:.76],[s*w*.51,head-.29,big?.68:.81],.056,.006);
  }
  k.r(female&&!stage?skin:spots,[0,head+.21,big?.39:.51],[0,head+(big&&!female?.91:stage?.61:female?.37:.54),big?.61:.63],big?.16:.092,.006);
  for(let i=0;i<(big?4:3);i++){
    const z=-.23-i*.18, yy=y+(big?.54:.32)-i*.045;
    k.r(spots,[0,yy,z],[0,yy+(female?.17:.26),z-.13],.112,.005);
  }
  const tail=big?[[0,.69,-.41],[0,.38,-.86],[.05,.37,-1.24],[.12,.47,-1.63]]:[[0,.49,-.51],[0,.52,-.84],[0,.65,-1.03]];
  line(k,skin,tail,big?[.26,.20,.14,.03]:[.15,.095,.014]);
}
function fairy(k,id) {
  const big=id===36, skin=big?'#e8a9b6':'#eeb1bb';
  const top=big?1.80:1.57;
  k.e(skin,0,.79,0,.58,big?.73:.65,.47);
  k.e(skin,0,1.19,.055,.55,.43,.46);
  for(const s of sides) {
    const start=[s*.32,1.39,.01], tip=[s*(big?.62:.53),top,.0];
    ear(k,s,start,tip,.164,skin,'#916b63');
    k.eye(s*.236,1.24,.447,.059);
    k.e('#df92a3',s*.34,1.11,.419,.074,.032,.031);
    k.r(skin,[s*.46,.98,.11],[s*(big?.77:.67),1.07,.22],.15,.068);
    for(let i=-1;i<=1;i++) k.r(skin,[s*.58,1.03,.18],[s*.70,1.07+i*.054,.23],.053,.018);
    feet(k,s,.31,.12,skin,.25);
    // Folded fairy wings have a scalloped lower edge.
    const outline=big?[[.27,.98],[.68,1.37],[1.00,1.60],[.90,1.11],[.77,1.15],[.68,.86],[.56,.95],[.40,.80]]:[[.22,.96],[.48,1.18],[.62,1.26],[.58,1.04],[.48,1.07],[.43,.92],[.33,.96]];
    const pts=outline.map(([x,y])=>[s*x,y,-.30-x*.30]);
    wingPanel(k,'#d087a0','#e6a2b6',pts,[s*(big?.66:.43),big?1.16:1.055,-.40]);
  }
  smile(k,1.14,.522,.108,'#865763');
  line(k,skin,[[0,1.52,.20],[-.10,1.66,.19],[-.05,1.77,.21],[.12,1.74,.24],[.16,1.59,.28],[.07,1.56,.32]],[.13,.13,.11,.10,.078,.045]);
  const tail=big?[[0,.60,-.29],[.12,.58,-.66],[.24,.77,-.93],[.22,1.0,-.87],[.12,.99,-.72]]:[[0,.63,-.27],[.08,.62,-.60],[.15,.76,-.79],[.14,.89,-.70],[.08,.83,-.60]];
  line(k,skin,tail,big?[.19,.22,.24,.18,.109]:[.17,.17,.16,.12,.06]);
}
function fox(k,id) {
  const nine=id===38, fur=nine?'#f4deb0':'#c67b56', mane=nine?'#f5e6c4':'#e8c49d';
  const tailColor=nine?'#f1dca7':'#b96948', tipColor=nine?'#e8ad75':'#d58b5c';
  k.e(fur,0,.69,-.15,.37,nine?.49:.37,nine?.75:.56);
  k.e(mane,0,.82,.16,.34,.40,.28);
  const head=nine?1.32:1.14;
  k.e(fur,0,head,.31,.39,.35,.39);
  k.e(mane,0,head-.11,.63,.247,.14,nine?.29:.18);
  k.e(ink,0,head-.05,nine?.894:.795,.066,.045,.045);
  for(const s of sides) {
    ear(k,s,[s*.23,head+.16,.22],[s*.42,head+.61,.14],.143,fur,nine?'#bf987c':'#71594c');
    k.e(nine?'#cb685f':'#564338',s*.262,head+.017,.59,.067,.080,.056);
    k.e(ivory,s*.245,head+.046,.632,.023,.027,.018);
    k.e(fur,s*.25,.43,-.46,.18,.25,.22);
    for(const z of [-.46,.25]) {
      k.r(fur,[s*.25,.57,z],[s*.26,.16,z+.016],.116,.074);
      feet(k,s,.26,z+.065,nine?fur:'#91604b',.132);
    }
    if(nine) {
      blade(k,mane,[s*.18,head+.16,.16],[s*.58,head+.29,-.31],[s*.084,.095,0],[0,.055,.02]);
      blade(k,mane,[s*.20,.95,.23],[s*.45,.86,.37],[0,.085,.025],[.02,0,.055]);
    }
  }
  if(!nine) {
    for(let i=-1;i<=1;i++) {
      const x=i*.136;
      line(k,tailColor,[[x,head+.24,.44],[x,head+.41,.42],[x-.035,head+.45,.31],[x-.07,head+.37,.28]],[.061,.084,.074,.037]);
    }
  } else {
    for(let i=-1;i<=1;i++) blade(k,mane,[i*.11,head+.24,.37],[i*.14,head+.53,-.14],[.072,0,0],[0,.065,0]);
  }
  // Each tail has a separate root and follows its own bend around the rump.
  const count=nine?9:6;
  for(let j=0;j<count;j++) {
    const a=-1.32+2.64*j/(count-1), x=Math.sin(a), back=Math.cos(a);
    const rise=.18*(j%2), reach=nine?1.03:.71;
    const start=[x*.22,.64,-.44], bend=[x*reach*.66,.61+rise,-.65-back*.30];
    const middle=[x*reach,.97+rise,-.75-back*.49], crown=[x*(reach+.10),1.33+rise,-.61-back*.52];
    tagged(k,'tail-'+j,()=>{
      line(k,tailColor,[start,bend,middle,crown],[.10,nine?.15:.135,nine?.178:.145,nine?.123:.118]);
      if(nine) {
        line(k,tipColor,[crown,[x*(reach+.15),1.48+rise,-.63-back*.52],[x*(reach+.22),1.57+rise,-.73-back*.57]],[.126,.079,.009]);
      } else {
        line(k,tipColor,[crown,[x*(reach+.04),1.43+rise,-.49-back*.49],[x*(reach-.10),1.35+rise,-.47-back*.47]],[.116,.095,.047]);
      }
    });
  }
}
function puff(k,id) {
  const tall=id===40, skin=tall?'#e9acba':'#edb2c5', y=tall?.93:.72;
  k.e(skin,0,y,0,tall?.55:.65,tall?.88:.63,tall?.46:.55);
  if(tall) k.e('#f7e8db',0,.83,.31,.41,.61,.20);
  const face=tall?1.35:.92;
  for(const s of sides) {
    const start=[s*(tall?.26:.32),tall?1.59:1.12,-.015];
    const tip=[s*(tall?.47:.55),tall?2.40:1.51,-.045];
    ear(k,s,start,tip,tall?.15:.16,skin,tall?'#393c46':'#454354');
    if(tall) {
      k.e('#343541',s*.42,2.21,-.028,.103,.146,.082);
      k.e(skin,s*.42,2.28,-.018,.088,.105,.091);
    }
    k.e('#faf2de',s*(tall?.22:.27),face,tall?.388:.444,.151,.167,.093);
    k.e(tall?'#579c99':'#518eab',s*(tall?.22:.27),face+.008,tall?.45:.508,.126,.138,.059);
    k.e(ivory,s*(tall?.22:.27)-.028,face+.060,tall?.494:.557,.055,.060,.025);
    k.r(skin,[s*.48,y+.05,.04],[s*(tall?.69:.72),y-.13,.16],.13,.072);
    feet(k,s,tall?.28:.34,.12,skin,tall?.245:.214);
  }
  smile(k,face-.22,tall?.468:.548,.111,'#906372');
  line(k,skin,[[.15,face+.24,.29],[.10,face+.37,.23],[-.07,face+.43,.29],[-.20,face+.33,.34],[-.15,face+.19,.40],[-.03,face+.16,.43]],[.12,.13,.14,.127,.10,.052]);
}
function bat(k,id) {
  const big=id===42, skin=big?'#7396bc':'#7896ba', membrane=big?'#986eaa':'#9577aa';
  const y=1.0, w=big?.52:.31;
  k.e(skin,0,y,0,w,big?.58:.39,big?.42:.29);
  for(const s of sides) {
    tagged(k,'wing',()=>{
      const wingPts=[[.20,1.12,-.05],[.63,1.57,-.14],[1.00,1.48,-.24],[1.60,1.65,-.38],
        [1.37,1.30,-.40],[1.29,1.04,-.38],[1.11,1.17,-.30],[.97,.86,-.32],[.78,1.04,-.21],[.65,.78,-.18],[.40,.94,-.12]];
      const pts=wingPts.map(([x,y,z])=>[s*x*(big?1.25:1),y+(big?.10:0),z]);
      wingPanel(k,skin,membrane,pts,[s*(big?1.06:.85),1.23,-.18]);
      for(const i of [4,7,9]) k.r(skin,pts[1],pts[i],.040,.010);
    });
    ear(k,s,[s*w*.56,y+(big?.39:.25),-.06],[s*(w+.15),big?1.89:1.78,-.09],big?.14:.128,skin,membrane);
    if(big) {
      k.e('#eee7d4',s*.292,1.31,.308,.103,.072,.047);
      k.e(ink,s*.29,1.31,.35,.038,.052,.021);
      k.r(skin,[s*.18,1.37,.37],[s*.38,1.40,.25],.04,.035);
    }
    const mouthZ=big?.430:.296;
    k.r(ivory,[s*(big?.24:.13),y+(big?.16:.045),mouthZ+.015],[s*(big?.23:.12),y+(big?-.043:-.090),mouthZ+.045],big?.066:.039,.005);
    if(big) {
      k.r(ivory,[s*.195,.61,.353],[s*.18,.76,.423],.051,.006);
      line(k,skin,[[s*.23,.65,-.12],[s*.32,.38,-.02],[s*.42,.27,.05]],[.060,.048,.032]);
      k.e(skin,s*.42,.26,.07,.085,.045,.095);
    } else {
      line(k,skin,[[s*.13,.76,-.08],[s*.17,.51,-.09],[s*.27,.23,-.20]],[.046,.034,.011]);
    }
  }
  k.e(big?'#443246':'#563a50',0,big?.963:.936,big?.325:.224,big?.387:.188,big?.405:.117,big?.097:.073);
  if(big) k.e('#d8849c',0,.69,.381,.195,.085,.047);
}
function flower(k,id) {
  const odd=id===43, gloom=id===44, skin=odd?'#577c96':gloom?'#697fa0':'#637a9b';
  const y=odd?.54:.65;
  k.e(skin,0,y,0,odd?.425:.51,odd?.425:.53,odd?.398:.465);
  for(const s of sides) {
    feet(k,s,odd?.225:.25,.11,skin,odd?.194:.22);
    if(!odd) k.e(skin,s*.48,y-.044,.03,.171,.144,.143);
    if(gloom) {
      line(k,ink,[[s*.10,.72,.44],[s*.19,.69,.435],[s*.26,.72,.399]],[.021,.024,.016]);
    } else {
      k.e('#b06071',s*(odd?.169:.219),y+.06,odd?.361:.409,.039,.056,.029);
      k.e('#eeaaa3',s*(odd?.169:.219)-.008,y+.077,odd?.382:.430,.012,.014,.011);
    }
  }
  if(gloom) {
    k.e('#ae777c',0,.50,.443,.193,.075,.052);
    k.e('#d8e7df',.096,.43,.485,.044,.074,.025);
    k.e('#d8e7df',.103,.36,.477,.037,.042,.027);
  } else smile(k,y-.067,odd?.403:.469,.10,'#493947');
  if(odd) {
    for(const [x,y,z,w] of [[-.63,1.48,.12,.17],[.60,1.45,.18,.18],[-.30,1.67,-.39,.17],[.28,1.74,-.28,.16],[.05,1.54,.38,.16]]) {
      blade(k,z>0?'#70a558':'#548e59',[0,.85,0],[x,y,z],[w,0,-x*.12],[0,.03,.08]);
    }
  } else if(gloom) {
    for(let i=0;i<5;i++) leaf(k,i%2?'#bb7656':'#b26e52',[0,1.10,0],i*Math.PI*2/5,.73,-.21,.23);
    for(let i=0;i<4;i++) {
      const a=i*Math.PI/2;
      k.e('#ae6951',.24*Math.cos(a),1.23,.24*Math.sin(a),.27,.25,.27);
      k.e('#e6b28a',.29*Math.cos(a),1.41,.29*Math.sin(a),.086,.047,.081);
    }
    k.e('#a2604f',0,1.38,0,.24,.216,.24);
  } else {
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5+.3, x=Math.cos(a), z=Math.sin(a);
      k.e(i%2?'#d57580':'#d26e78',x*.48,1.30,z*.48,.47,.19,.47);
      // Round overlapping petals form a single broad five-lobed cap.
      k.e('#ecc0aa',x*.65,1.458,z*.65,.095,.037,.084);
      k.e('#ecc0aa',x*.48+z*.12,1.477,z*.48-x*.12,.05,.028,.056);
    }
    k.e('#df995b',0,1.41,0,.29,.16,.29);
    k.e('#924e4b',0,1.53,0,.154,.053,.154);
  }
}
function mushroom(k,x,y,z,size,elder) {
  const cap=elder?'#b76652':'#dc817d';
  k.r('#e8c994',[x,y,z],[x,y+size*.34,z],size*.18,size*.21);
  k.e('#ebd3a4',x,y+size*.35,z,size*.78,size*.13,size*.74);
  k.e(cap,x,y+size*.42,z,size*.82,size*(elder?.44:.33),size*.77);
  for(const [a,b,w] of [[.30,.24,.14],[-.41,.22,.13],[.32,-.37,.095],[-.19,-.44,.10],[0,.02,.09]]) {
    const height=Math.sqrt(1-(a/.82)**2-(b/.77)**2);
    k.e(elder?'#e7bd7b':'#f0ceaa',x+a*size,y+size*(.42+height*(elder?.44:.33))-.018*size,z+b*size,w*size,.041*size,w*.86*size);
  }
}
function crab(k,id) {
  const elder=id===47, skin=elder?'#c77b58':'#de925e', w=elder?.51:.402;
  k.e(skin,0,.50,-.14,w,.30,elder?.73:.51);
  k.e(skin,0,.55,.34,w*.91,.28,.34);
  for(const s of sides) {
    k.e(elder?'#e2d9ce':'#ecebd9',s*w*.66,.73,.54,.145,.154,.102);
    if(!elder) k.eye(s*w*.67,.75,.614,.075);
    for(const [z,len] of [[-.43,.38],[-.19,.48],[.02,.43]]) {
      line(k,skin,[[s*w*.74,.50,z],[s*(w+len*.64),.40,z-.08],[s*(w+len),.10,z+.04]],[.093,.072,.018]);
    }
    const hand=[s*(w+.24),.38,elder?.57:.49];
    line(k,skin,[[s*w*.74,.55,.22],[s*(w+.16),.43,.32],hand],[.116,.099,.12]);
    k.e(skin,...hand,elder?.235:.148,elder?.161:.106,elder?.27:.167);
    line(k,skin,[shift(hand,s*.105,0,.11),shift(hand,s*.10,.03,elder?.43:.26),shift(hand,s*.017,.08,elder?.55:.34)],[elder?.14:.08,elder?.09:.046,.009]);
    k.r(skin,shift(hand,-s*.075,.04,.10),shift(hand,-s*.08,.15,elder?.42:.25),elder?.091:.067,.009);
    if(!elder) line(k,skin,[[s*.13,.68,.48],[s*.21,.95,.53],[s*.28,1.01,.54]],[.038,.026,.014]);
  }
  if(elder) mushroom(k,0,.46,-.20,1.11,true);
  else {
    mushroom(k,-.20,.71,-.24,.39,false);
    mushroom(k,.18,.68,-.38,.47,false);
  }
}
function venonat(k) {
  const fur='#a48bb4';
  k.e(fur,0,.79,.0,.53,.61,.47);
  k.e(fur,0,1.17,.04,.51,.45,.45);
  for(let i=0;i<14;i++) {
    const a=i*Math.PI/7, x=Math.cos(a),z=Math.sin(a);
    if(z>.66) continue;
    for(const [y,rad] of [[.54,.44],[.88,.48],[1.25,.42]]) {
      k.r(i%2?fur:'#9a81aa',[x*rad,y,z*rad],[x*(rad+.123),y-.10,z*(rad+.12)],.091,.005);
    }
  }
  for(const s of sides) {
    k.e('#c16384',s*.285,1.22,.376,.217,.235,.125);
    for(const [dx,dy] of [[-.062,.081],[.069,.047],[0,-.060]]) k.e('#da8f9f',s*.285+dx,1.22+dy,.483,.038,.038,.020);
    line(k,ivory,[[s*.17,1.50,.0],[s*.27,1.77,.01],[s*.39,1.96,.07]],[.035,.034,.066]);
    k.r(fur,[s*.40,.83,.06],[s*.49,.68,.23],.104,.075);
    k.e('#e0b9a3',s*.49,.66,.25,.086,.084,.084);
    feet(k,s,.276,.14,'#c49984',.241);
    k.r(ivory,[s*.065,1.02,.475],[s*.064,.92,.486],.036,.007);
  }
  k.e('#bd979d',0,1.071,.482,.15,.086,.061);
}
function diglett(k) {
  k.e('#9f7159',0,.49,0,.35,.55,.34);
  eyes(k,.127,.723,.286,.048);
  k.e('#de98a6',0,.618,.331,.135,.086,.080);
  k.e('#efb4bc',-.031,.644,.394,.049,.025,.015);
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5;
    k.e(i%2?'#9f846c':'#ab9076',.35*Math.cos(a),.082,.31*Math.sin(a),.124+(i%3)*.018,.09+(i%2)*.022,.121);
  }
}
export function early(id,k) {
  if(id>=1 && id<=3) return bulb(k,id);
  if(id===4 || id===5) return lizard(k,id);
  if(id>=7 && id<=9) return turtle(k,id);
  if(id===10 || id===13) return grub(k,id);
  if(id===11 || id===14) return cocoon(k,id);
  if(id===12 || id===49) return butterfly(k,id);
  if(id===15) return bee(k);
  if((id>=16 && id<=18) || id===21 || id===22) return bird(k,id);
  if(id===19 || id===20) return rat(k,id);
  if(id===23 || id===24) return snake(k,id);
  if(id===26) return raichu(k);
  if(id===27 || id===28) return sand(k,id);
  if(id>=29 && id<=34) return nido(k,id);
  if(id===35 || id===36) return fairy(k,id);
  if(id===37 || id===38) return fox(k,id);
  if(id===39 || id===40) return puff(k,id);
  if(id===41 || id===42) return bat(k,id);
  if(id>=43 && id<=45) return flower(k,id);
  if(id===46 || id===47) return crab(k,id);
  if(id===48) return venonat(k);
  if(id===50) return diglett(k);
  throw new RangeError('No early Kanto model for '+id);
}
