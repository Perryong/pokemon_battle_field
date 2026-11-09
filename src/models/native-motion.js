// Both original character rigs use authored joints. Strike and wind are
// envelopes, so the idle resumes naturally even when a turn is interrupted.
const {sin,cos,PI}=Math;
export function nativeMotion(id,n){
 if(id===25)return ({t,u,kind,wind,strike,recoil})=>{
  const idle=2*PI*t,tailHit=kind==='heavy',dash=kind==='light',bolt=kind==='special',guard=kind==='guard';
  const sniff=sin(idle*.85),twitch=Math.max(0,cos(idle*.53))**8;
  n.body.position.set(0,-.12*wind+.05*strike,0);
  n.body.rotation.set(.045*sniff-.22*wind+(dash?.42:.13)*strike-.19*recoil,(tailHit?.48:0)*strike,0);
  n.head.rotation.set(-.045*sniff+.13*wind-.18*strike,.12*sin(idle*.42)-.22*(tailHit?strike:0),.045*sin(idle*.71));
  n.ears.forEach((ear,i)=>{const side=i?1:-1;
   ear.rotation.set(.055*sin(idle*.81+i)+.47*wind-(bolt?.48:.18)*strike+.22*recoil,side*.10*twitch,
    -side*(.32+.11*sin(idle*.64+i*1.8)+.17*twitch+.22*wind-.16*strike));
   n.arms[i].rotation.x=-.22+.10*sin(idle*.85+i*.5)-(guard?.8:bolt?.67:.32)*strike;
  });
  n.tail.rotation.set(-.08+.15*sin(idle*.6)-.45*wind+(tailHit?1.02:.38)*strike,
    -PI*.39+.17*sin(idle*.54)+(tailHit?.93:0)*strike-.12*recoil,.16*sin(idle*.63)+.24*wind);
 };
 return ({t,kind,wind,strike,recoil})=>{
  const idle=2*PI*t,breath=sin(idle*.44),fire=kind==='special',guard=kind==='guard';
  n.body.position.set(0,0,0);n.body.rotation.set(.022*breath-.16*wind+.14*strike-.10*recoil,0,0);
  n.head.rotation.set(.045*sin(idle*.41)-.36*wind+(fire?.28:.42)*strike,.075*sin(idle*.34),.025*sin(idle*.53));
  n.jaw.rotation.x=.03+.034*(1+breath)+.18*wind+(fire?.49:.30)*strike;
  n.wings.forEach((wing,i)=>{const side=i?1:-1;
   wing.rotation.set(-.10+.12*breath+.23*wind,side*(.46+.22*sin(idle*.47)-.51*wind+(guard?.80:.39)*strike),
    side*(.10*cos(idle*.47)+.27*wind-.31*strike));
   n.arms[i].rotation.x=-.16+.08*breath-.32*wind-(fire?.18:.75)*strike;
  });
  n.tail.rotation.set(.05*sin(idle*.37),.27*sin(idle*.39)+.24*wind-.31*strike,.08*sin(idle*.55));
  n.fire.scale.set(1+.10*sin(idle*1.9),1.12+.24*sin(idle*2.5)+.36*strike,1+.1*cos(idle*2));
 };
}
