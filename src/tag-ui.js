import {TagRoom} from './tag-room.js';
import {createSoloTag} from './solo-tag.js';
import {tagTeam,trainers} from './tag-match.js';
import {isRoomId} from './friend-room.js';
import {readTeams} from './team-library.js';
import {lookup} from './roster.js';
import {portrait} from './thumbs.js';

const $=id=>document.getElementById(id);
function button(label,fn) {
  const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b;
}
const titles={solo:'Solo tag',coop:'Co-op tag',versus:'2v2 tag'};
const effects={self:'Self',allAdjacent:'All adjacent Pokémon',allAdjacentFoes:'Both opponents',allySide:'Your side',all:'Entire field'};

export function setupTag({storage,getParty,leaveScene}) {
  const dialog=$('tagLobby'),params=new URLSearchParams(location.hash.slice(1));
  let invite=params.get('tag'),role=params.get('side'),room=null,teams=[],queue=[],elapsed=0,selected=null;
  const rate=$('replayRate').parentElement,originalRateParent=rate.parentElement;
  const locked=()=>!room || room.closed || room.choice || queue.length || room.view.ended;
  function trainer(seat) {
    if(seat===room.seat) return 'You';
    if(seat===(room.seat^2)) return room.mode==='solo'?'CPU partner':'Partner';
    return room.mode==='versus'?trainers[seat]:'CPU '+(seat===1?'1':'2');
  }
  const poke=(field,i)=>lookup(field[i].id).name;
  function selectedParty() {
    const source=teams[Number($('tagTeam').value)]?.party || [];
    return [...$('tagRoster').querySelectorAll('input:checked')].map(input=>source[Number(input.value)]);
  }
  function draft() {
    const count=selectedParty().length;
    for(const input of $('tagRoster').querySelectorAll('input')) input.disabled=!input.checked && count>=3;
    $('tagConnect').disabled=!count || (invite!==null && (!isRoomId(invite) ||
      !['versus','coop'].includes(params.get('mode')) || !['ally','foe'].includes(role) || (role==='foe' && params.get('mode')==='coop')));
    $('tagConnect').textContent=invite!==null?'Join as '+(role==='ally'?'teammate':'opponent') :
      $('tagMode').value==='solo'?'Start solo battle':'Create '+titles[$('tagMode').value].toLowerCase()+' room';
  }
  function roster() {
    const party=teams[Number($('tagTeam').value)]?.party || [];
    $('tagRoster').replaceChildren(...party.map((p,i)=>{
      const label=document.createElement('label'),input=document.createElement('input');
      input.type='checkbox';input.value=i;input.checked=i<3;input.onchange=draft;
      label.append(input,lookup(p.id).name);return label;
    }));draft();
  }
  function open() {
    teams=[{name:'Current party',party:getParty()}];
    try {teams.push(...readTeams(storage));} catch { /* Current party still works. */ }
    $('tagTeam').replaceChildren(...teams.map((t,i)=>new Option(t.name,i)));
    $('tagMode').disabled=invite!==null;if(invite!==null) $('tagMode').value=params.get('mode');
    $('tagLobbyStatus').textContent=invite!==null?'Review your party before joining.':'';
    $('tagDraft').hidden=$('tagConnect').hidden=false;$('tagLinks').replaceChildren();roster();dialog.showModal();
  }
  function inviteLink(r,side) {
    const url=new URL(location.protocol==='file:'?'https://perryong.github.io/pokemon_battle_field/':location.href);
    url.search='';url.hash=new URLSearchParams({tag:r.id,mode:r.mode,side});
    const label=document.createElement('label'),text=document.createElement('strong'),input=document.createElement('input');
    text.textContent=side==='ally'?'Teammate link':'Opponent link · share with both opponents';
    input.readOnly=true;input.value=url.href;input.dataset.side=side;
    const copy=button('Copy',async()=>{
      try {await navigator.clipboard.writeText(input.value);copy.textContent='Copied';}
      catch {input.select();}
    });
    label.append(text,input,copy);return label;
  }
  function lobby(r,seats) {
    const count=seats.filter(Boolean).length;
    $('tagLobbyStatus').textContent=trainers[r.seat]+' · '+count+' of '+(r.mode==='coop'?2:4)+' human trainers ready.';
    if(r.host && !$('tagLinks').childElementCount){
      $('tagLinks').append(inviteLink(r,'ally'));
      if(r.mode==='versus') $('tagLinks').append(inviteLink(r,'foe'));
    }
  }
  function showField(view) {
    const order=[view.seat,view.seat^2,view.seat^1,view.seat^3];
    $('tagField').replaceChildren(...order.map(i=>{
      const m=view.field[i],card=document.createElement('div'),icon=document.createElement('i'),body=document.createElement('div');
      icon.className='portrait';portrait(icon,m.id);
      const who=document.createElement('small'),name=document.createElement('b'),hp=document.createElement('small'),meter=document.createElement('meter');
      who.textContent=trainer(i);name.textContent=poke(view.field,i);hp.textContent=m.hp+'/'+m.maxHP+' HP'+(m.status?' · '+m.status:'');
      meter.min=0;meter.max=m.maxHP;meter.value=m.hp;meter.setAttribute('aria-label',name.textContent+' HP');
      body.append(who,name,meter,hp);card.dataset.seat=i;card.append(icon,body);return card;
    }));
  }
  function command(c) {if(locked()) return;room.submit(c.command);selected=null;controls();}
  function controls() {
    const v=room.view,options=v.choices;
    $('tagPrompt').textContent=room.closed?(room.mode==='solo'?'Battle ended.':'Connection closed.'):v.ended?(v.winner?v.winner+' team wins!':'Draw.'):
      queue.length?'Resolving turn…':room.choice?'Choice locked.':!options.length?(room.mode==='solo'?'Computer trainers are playing.':'Waiting for other trainers.'):
      v.forced?'Send a replacement.':selected?'Choose a target.':'Attack or switch.';
    $('tagMoves').replaceChildren();$('tagTargets').replaceChildren();$('tagBench').replaceChildren();
    const disabled=Boolean(locked());
    const groups=Map.groupBy(options.filter(c=>c.kind==='move'),c=>c.command.split(' ').slice(0,2).join(' '));
    for(const [key,choices] of groups) {
      const c=choices[0],b=button(c.name,()=>{
        if (choices.length===1) command(c);
        else {selected=key;controls();}
      });
      b.replaceChildren(document.createElement('strong'),document.createElement('small'));
      b.firstChild.textContent=c.name;b.lastChild.textContent=[c.pp!=null?c.pp+'/'+c.maxPP+' PP':'',effects[c.scope]].filter(Boolean).join(' · ');
      b.disabled=disabled;b.dataset.move=c.move;b.setAttribute('aria-pressed',selected===key);$('tagMoves').append(b);
      if(selected===key) for(const opt of [...choices].sort((a,b)=>(a.target%2===v.seat%2)-(b.target%2===v.seat%2))){
        const target=button(trainer(opt.target)+' · '+poke(v.field,opt.target),()=>command(opt));
        target.disabled=disabled;target.dataset.target=opt.target;$('tagTargets').append(target);
      }
    }
    for(const c of options.filter(c=>c.kind==='switch')) {
      const b=button('Switch to '+c.name+' · '+c.hp+'/'+c.maxHP,()=>command(c));b.disabled=disabled;$('tagBench').append(b);
    }
  }
  function state(r,events) {
    room=r;
    if (dialog.open) dialog.close();
    $('tagConsole').hidden=false;$('singlesConsole').hidden=true;$('tagRate').append(rate);
    for(const id of ['tagOpen','friendOpen','openDex','show','play']) $(id).disabled=true;
    $('tagHeading').textContent=titles[r.mode];$('tagRound').textContent='Turn '+r.view.round;
    $('tagSeat').textContent='Your trainer · '+trainers[r.seat];
    const log=$('tagLog');
    for(const e of events) {
      const li=document.createElement('li');li.textContent=e.text;log.append(li);
    }
    queue.push(...events);selected=null;showField(r.view);controls();
    if(!events.length) $('tagAction').textContent='All four trainers are on the field.';
  }
  function end(text) {
    if(!text) return;
    if(room?.view){controls();$('tagAction').textContent=text;}
    else {room=null;$('tagLinks').replaceChildren();$('tagDraft').hidden=$('tagConnect').hidden=false;
      $('tagMode').disabled=invite!==null;draft();$('tagLobbyStatus').textContent=text;}
  }
  function leave(){
    room?.end('');room=null;queue=[];elapsed=0;selected=null;
    if(invite!==null){invite=null;history.replaceState(null,'',location.pathname+location.search);}
    if(dialog.open)dialog.close();
    $('tagLinks').replaceChildren();$('tagLog').replaceChildren();
    if(!$('tagConsole').hidden) {
      $('singlesConsole').hidden=false;$('tagConsole').hidden=true;originalRateParent.append(rate);
      for(const id of ['tagOpen','friendOpen','openDex','show','play']) $(id).disabled=false;
      leaveScene();
    }
  }
  $('tagOpen').onclick=open;$('tagMode').onchange=draft;$('tagTeam').onchange=roster;
  $('tagClose').onclick=$('tagExit').onclick=leave;
  dialog.addEventListener('cancel',e=>{e.preventDefault();leave();});
  $('tagConnect').onclick=()=>{
    if(room) return;
    try {
      const party=selectedParty();tagTeam(party);
      const mode=$('tagMode').value;
      if(mode==='solo' && invite===null){
        room=createSoloTag(party,state);state(room,[]);return;
      }
      room=new TagRoom({mode,invite,role,party,onLobby:lobby,onState:state,onEnd:end});
      $('tagMode').disabled=$('tagDraft').hidden=$('tagConnect').hidden=true;
      $('tagLobbyStatus').textContent='Connecting trainers…';
    } catch(error){end(error.message);}
  };
  window.addEventListener('pagehide',()=>room?.end(''));
  return {open,get active(){return Boolean(room?.view);},get invited(){return invite!==null;},
    draw(arena,t,dt,speed,reduced){
      elapsed+=dt*speed;
      while(queue.length && elapsed>=1.25){elapsed-=1.25;queue.shift();if(!queue.length) controls();}
      if(!queue.length){
        elapsed=0;
        // Play CPU-only replacements and turns after the player's party is out, one phase at a time.
        if(room.mode==='solo' && !room.view.ended && !room.view.choices.length) room.submit();
      }
      const event=queue[0];
      const caption=event?.text || $('tagLog').lastChild?.textContent || 'All four trainers are on the field.';
      if(!room.closed && $('tagAction').textContent!==caption) $('tagAction').textContent=caption;
      arena.drawTag(event?.field || room.view.field,room.seat,t,event,elapsed/1.25,reduced);
    }};
}
