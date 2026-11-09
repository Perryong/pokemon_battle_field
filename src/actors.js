import {group,egg,rod,poly,ink,gold,orange,cream,teal} from './shapes.js';
function eye(head,s,x,y,z,size){egg(head,ink,s*x,y,z,size,size*1.17,size*.73);egg(head,'#fff9db',s*x+.018,y+size*.35,z+size*.57,size*.34,size*.36,size*.24)}
export function pikachu(p){
 const root=group(p),body=group(root),head=group(body,0,1.32,.06);
 egg(body,gold,0,.81,0,.63,.75,.54);egg(head,gold,0,.19,.06,.72,.59,.58);
 const ears=[],arms=[];for(const s of [-1,1]){
 const e=group(head,s*.35,.58,.01);e.rotation.z=-s*.32;ears.push(e);
 rod(e,gold,[0,0,0],[0,.42,0],.14,.16);rod(e,gold,[0,.42,0],[0,.68,0],.16,.12);rod(e,ink,[0,.68,0],[0,1.04,0],.12,.008);
 egg(head,'#e64937',s*.53,.12,.39,.153,.135,.087);eye(head,s,.29,.32,.55,.09);
 let a=group(body,s*.45,.99,.21);egg(a,gold,s*.05,-.12,.1,.16,.29,.15);arms.push(a);
 egg(body,gold,s*.36,.16,.22,.28,.17,.41);for(let i=0;i<2;i++)egg(body,'#a96e27',s*.36+i*.07-.035,.16,.61,.016,.045,.012);
 egg(body,'#93552e',s*.29,.91,-.43,.25,.081,.07);
 }
 egg(head,ink,0,.20,.63,.05,.033,.029);
 for(const s of [-1,1])rod(head,'#824c29',[0,.11,.63],[s*.08,.085,.62],.014);
 const tail=group(body,-.14,.54,-.39);tail.rotation.y=-Math.PI*.39;
 poly(tail,'#9c552a',[[0,-.03],[-.30,.12],[-.22,.38],[.1,.18]]);
 poly(tail,gold,[[-.28,.1],[-.58,.4],[-.39,.55],[-.91,.86],[-.68,1.28],[-.05,.85],[-.25,.59],[.08,.34]]);
 const source=group(head,0,.15,.69);return {root,body,head,tail,ears,arms,source};
}
export function charizard(p){
 const root=group(p),body=group(root),head=group(body,0,2.67,.29);
 egg(body,orange,0,1.25,0,.85,1.05,.7);egg(body,cream,0,1.16,.39,.68,.86,.40);
 rod(body,orange,[0,1.72,.04],[0,2.75,.28],.53,.33);egg(head,orange,0,.02,.02,.49,.46,.53);
 const jaw=group(head,0,-.13,.20);egg(jaw,cream,0,-.02,.32,.355,.14,.41);egg(head,orange,0,.002,.49,.40,.20,.45);
 const wings=[],arms=[];for(const s of [-1,1]){
 rod(head,orange,[s*.28,.25,-.15],[s*.36,.67,-.34],.115,.012);eye(head,s,.37,.16,.31,.085);
 egg(head,'#77472e',s*.15,.14,.78,.032,.018,.042);rod(head,'#fff7cc',[s*.28,-.07,.70],[s*.27,-.18,.70],.048,.005,5);
 let a=group(body,s*.62,1.83,.14);rod(a,orange,[0,0,0],[s*.3,-.32,.24],.205,.14);egg(a,orange,s*.34,-.32,.34,.16,.13,.17);
 for(let k=0;k<3;k++)rod(a,'#fcf1c4',[s*(.24+k*.08),-.32,.40],[s*(.24+k*.08),-.34,.58],.046,.005,5);arms.push(a);
 egg(body,orange,s*.57,.58,.01,.42,.54,.45);egg(body,orange,s*.61,.22,.27,.36,.22,.49);
 for(let k=-1;k<=1;k++)rod(body,'#f9e6b7',[s*.61+k*.13,.18,.51],[s*.61+k*.16,.12,.79],.09,.008,6);
 let w=group(body,s*.46,2.02,-.29);wings.push(w);
 let pts=[[0,0],[.47,.66],[1.37,1.28],[1.95,1.00],[2.13,.17],[1.63,.33],[1.32,-.02],[.91,.14],[.54,-.22]];
 poly(w,teal,pts.map(([x,y])=>[s*x,y]),.045);
 for(let i=0;i<4;i++)rod(w,orange,[s*pts[i][0],pts[i][1],.035],[s*pts[i+1][0],pts[i+1][1],.035],.09-i*.015,.078-i*.015);
 for(let i of [4,6,8])rod(w,'#287488',[s*1.37,1.28,.055],[s*pts[i][0],pts[i][1],.055],.037,.012);
 }
 let tail=group(body,0,.87,-.39);
 rod(tail,orange,[0,0,0],[.05,-.37,-.72],.38,.25);rod(tail,orange,[.05,-.37,-.72],[.35,-.22,-1.32],.25,.16);rod(tail,orange,[.35,-.22,-1.32],[.62,.31,-1.60],.16,.085);
 let fire=group(tail,.62,.31,-1.60);egg(fire,'#e5441f',0,.15,0,.20,.35,.19);rod(fire,'#fb8628',[0,.25,0],[.09,.71,0],.17,.006);egg(fire,'#ffd332',.04,.17,.13,.115,.24,.10);
 const source=group(head,0,-.063,.92);return {root,body,head,wings,arms,tail,fire,jaw,source};
}
