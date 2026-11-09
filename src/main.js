import './style.css';
import {buildScene} from './scene.js';
import {setupDex} from './dex.js';
import {lookup, dexNumber, typeColors} from './roster.js';
import {portrait} from './thumbs.js';
import {moveById} from './gen1-data.js';
import {loadParties, saveParties} from './team.js';
import {createBattle, pickAction, eventFrame, idleFrame, playEvents, buildExhibition, damageMultiplier, SHOW_LENGTH} from './battle.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
let team = loadParties(storage);
let match = createBattle(team), state = match.view(), sequence, exhibition;
let mode = 'play', paused = reduced, ready = false, arena, gameTime = 0, showTime = 0;
let last = performance.now(), stamp = '', note = lookup(team[0][0].id).name + ' is ready.';
let log = [];
const choiceCache = new Map();

function rematch() {
  match = createBattle(team);
  state = match.view();
  sequence = null;
  log = [];
  note = lookup(team[0][0].id).name + ' is ready.';
  $('turnLog').replaceChildren();
  $('history').hidden = true;
  refresh(true);
}

function apply(newTeams) {
  team = newTeams;
  saveParties(storage,team);
  showTime = gameTime = 0;
  exhibition = null;mode='play';rematch();
}

const dex = setupDex({team:() => team, apply});
$('buildTeam').onclick=()=>dex.open(team[0][0].id);
$('pickPlayer').onclick=()=>{const f=currentFrame();dex.open(f.playerBaseId,0,f.playerSlot);};
$('pickRival').onclick=()=>dex.open(currentFrame().rivalBaseId,1);

function choose(slot) {
  const option=state.choices.find(item=>item.slot===slot&&!item.disabled);
  if (option) act(option);
}
function act(command) {
  if (!ready || mode!=='play' || sequence || state.winner) return;
  const segments=[];
  do {
    const before=state;
    const events=match.turn(command,pickAction(before,'rival'));
    state=match.view();
    segments.push(...playEvents(events,before,state));
    log.push(...events.map(event=>'Turn '+before.round+' · '+event.text));
    command=null;
  } while (!state.winner && state.playerRequest==='wait');
  sequence=segments.length ? {segments,index:0,elapsed:0} : null;
  refresh(true);
}

function segmentLength(segment) {
  return segment.event.moveId ? (reduced ? .85 : 1.85) : (reduced ? .40 : .90);
}

function currentFrame() {
  if (mode === 'show') return exhibition(showTime);
  if (!sequence) return idleFrame(state,reduced ? 0 : gameTime,note);
  const segment = sequence.segments[sequence.index];
  return eventFrame(segment,reduced ? 0 : gameTime,Math.min(1,sequence.elapsed/segmentLength(segment)));
}

function advance(dt) {
  gameTime += dt;
  if (!sequence) return;
  sequence.elapsed += dt;
  const duration = segmentLength(sequence.segments[sequence.index]);
  if (sequence.elapsed < duration) return;
  sequence.elapsed -= duration;
  sequence.index++;
  if (sequence.index < sequence.segments.length) return;
  sequence = null;
  note = state.winner ? resultText(state.winner) : log.at(-1)?.replace(/^Turn \d+ · /,'') || 'Choose a move.';
  $('turnLog').replaceChildren(...log.map(text => {
    const line = document.createElement('li'); line.textContent = text; return line;
  }));
  $('history').hidden = !log.length;
}

function resultText(winner) {
  if (winner === 'draw') return 'The match is a draw.';
  return (winner==='player'?'Your party':'The rival party')+' wins!';
}

function useMode(next) {
  mode = next;
  if (next === 'show' && !exhibition) exhibition = buildExhibition(team);
  refresh(true);
}

function describeChoice(move,choice,defenderTypes) {
  const pp = choice.pp == null ? '' : choice.pp+'/'+choice.maxPP+' PP';
  if (!move) return pp || 'Forced turn';
  if (move.category === 'Status') return [move.type,'Status',pp].filter(Boolean).join(' · ');
  const multiplier = damageMultiplier(move,defenderTypes);
  return [move.type,pp,multiplier !== 1 ? '×'+multiplier : ''].filter(Boolean).join(' · ');
}

function renderChoices() {
  const visible = new Set();
  for (const [index, choice] of state.choices.entries()) {
    visible.add(choice.slot);
    let button = choiceCache.get(choice.slot);
    if (!button) {
      button = document.createElement('button');
      button.append(document.createElement('strong'),document.createElement('small'));
      button.onclick = () => choose(choice.slot);
      choiceCache.set(choice.slot,button);
    }
    button.dataset.id = choice.id;
    button.dataset.slot = choice.slot;
    const move = moveById(choice.id);
    button.firstChild.textContent = choice.name || move?.name;
    const detail = describeChoice(move,choice,state.rivalTypes);
    button.lastChild.textContent = detail;
    button.title = detail;
    button.style.setProperty('--move', colorFor(move?.type));
    button.disabled = !ready || !!sequence || !!state.winner || choice.disabled;
    const next = $('moves').children[index];
    if (next !== button) $('moves').insertBefore(button, next || null);
  }
  for (const [id,button] of choiceCache) if (!visible.has(id)) button.remove();
}

const colorFor = type => typeColors[type] || '#90a48d';
const statusText = {brn:'burned',par:'paralyzed',psn:'poisoned',tox:'badly poisoned',slp:'asleep',frz:'frozen'};

function renderParty() {
  const home=state.playerParty,away=state.rivalParty;
  $('switchPanel').hidden=home.length===1;
  if ($('switchPanel').hidden) return;
  const forced=state.playerRequest==='switch';
  $('switchTitle').textContent=forced?'Send a replacement':'Switch Pokémon';
  $('partyScore').textContent='Ready: '+home.filter(p=>p.hp>0).length+' / '+home.length+' · Rival: '+away.filter(p=>p.hp>0).length+' / '+away.length;
  $('switchHint').textContent=state.winner?'Match complete.':forced?'Choose a healthy reserve to continue.':
    home.some(p=>p.canSwitch)?'Switching uses this turn.':
    home.some(p=>!p.active&&p.hp>0)?'Switching is unavailable this turn.':'No healthy reserves.';
  const focus=document.activeElement?.dataset.switchSlot;
  $('switchChoices').replaceChildren(...home.map(p=>{
    const button=document.createElement('button'),icon=document.createElement('i'),words=document.createElement('span');
    icon.className='portrait';portrait(icon,p.id);words.append(document.createElement('strong'),document.createElement('small'));
    words.firstChild.textContent=lookup(p.id).name;
    words.lastChild.textContent=[p.hp+'/'+p.maxHP+' HP',p.hp===0?'Fainted':p.active?'Active':'',statusText[p.status]].filter(Boolean).join(' · ');
    button.dataset.switchSlot=p.slot;button.append(icon,words);button.disabled=!ready||!!sequence||!p.canSwitch||!!state.winner;
    button.onclick=()=>act({switch:p.slot});return button;
  }));
  if (focus!=null) $('switchChoices').querySelector('[data-switch-slot="'+focus+'"]:enabled')?.focus({preventScroll:true});
}

function refresh(force=false) {
  const f = currentFrame(), show = mode === 'show';
  const key = [mode,state.round,state.winner,f.label,f.caption,f.playerHP,f.rivalHP,
    f.playerStatus,f.rivalStatus,f.playerSpeciesId,f.rivalSpeciesId,!!sequence,ready,paused,Math.floor(showTime)].join('|');
  if (!force && key === stamp) return;
  stamp = key;
  $('play').setAttribute('aria-pressed',!show);
  $('show').setAttribute('aria-pressed',show);
  $('livepanel').hidden = show; $('showpanel').hidden = !show;
  $('history').hidden = show || !$('turnLog').children.length;
  $('again').hidden = show || !!sequence || !state.winner;
  for (const [index,prefix,side] of [[0,'p','player'],[1,'c','rival']]) {
    const original = lookup(f[side+'BaseId']);
    const form = lookup(f[side+'SpeciesId']) || original;
    $(prefix+'name').textContent = original.name + (form.id !== original.id ? ' → '+form.name : '');
    const status = statusText[f[side+'Status']];
    $(prefix+'id').textContent = (index?'RIVAL':'YOU')+' / '+dexNumber(original.id)+(status?' · '+status:' · Lv. 100');
    portrait($(prefix+'pic'),form.id);
    const hp = f[side+'HP'], max = f[side+'MaxHP'];
    $(prefix+'hp').textContent = hp;
    $(prefix+'hp').title = hp+' / '+max+' HP';
    $(prefix+'bar').style.width = Math.max(0,Math.min(100,100*hp/max))+'%';
  }
  $('round').textContent = show?'45 S  /  LOOP':'TURN '+String(state.round).padStart(2,'0');
  $('decklabel').textContent = show?'EXHIBITION REEL':'TRAINER CONSOLE';
  $('prompt').textContent = show || sequence ? f.label : state.winner ? resultText(state.winner) : state.playerRequest==='switch' ? 'Choose a replacement.' : state.playerParty.length>1 ? 'Attack or switch.' : 'Choose a move.';
  if (!show) {
    renderChoices();
    renderParty();
    const intent=state.winner || sequence ? null : pickAction(state,'rival');
    $('intel').textContent = state.winner ? 'Match complete.' : sequence ? 'Resolving turn…' :
      !intent ? 'The rival is waiting.' : intent.switch!=null ? 'Rival intent · Send '+lookup(state.rivalParty[intent.switch].id).name : 'Rival intent · '+intent.name;
  }
  if ($('message').textContent !== f.caption) $('message').textContent = f.caption;
  $('pause').textContent = paused?'Play':'Pause';
  $('clock').textContent = '00:'+String(Math.floor(showTime)).padStart(2,'0')+' / 00:45';
  if (show) $('seek').value = showTime;
}

function draw() {
  const f = currentFrame();
  arena.setPair(f.playerSpeciesId || team[0][0].id,f.rivalSpeciesId || team[1][0].id);
  arena.draw(f.t,f.action,f.u,f);
  refresh();
}

function animate(now) {
  const dt = Math.min(.12,(now-last)/1000); last=now;
  if (!$('dex').open) {
    if (mode === 'play') advance(dt);
    else if (!paused) showTime=(showTime+dt)%SHOW_LENGTH;
    draw();
  }
  requestAnimationFrame(animate);
}

$('play').onclick = () => useMode('play');
$('show').onclick = () => useMode('show');
$('focus').onclick = () => arena?.focus();
$('reset').onclick = () => arena?.reset();
$('pause').onclick = () => { paused=!paused; refresh(true); };
$('seek').oninput = e => { showTime=Number(e.target.value); paused=true; refresh(true); };
$('again').onclick = rematch;
refresh(true);
buildScene($('field')).then(r => {
  arena=r;ready=true;$('loading').hidden=true;last=performance.now();
  window.__diorama={...r,dex,freeze(t){
    useMode('show');paused=true;showTime=((t%SHOW_LENGTH)+SHOW_LENGTH)%SHOW_LENGTH;draw();
  },view(pos,tgt){r.camera.position.fromArray(pos);r.controls.target.fromArray(tgt);r.controls.update();}};
  window.__dioramaReady=true;
  const url=new URL(location.href);
  if (url.searchParams.has('t') && Number.isFinite(Number(url.searchParams.get('t')))) window.__diorama.freeze(Number(url.searchParams.get('t')));
  else if (url.searchParams.get('mode')==='exhibition') useMode('show');
  const dexId=Number(url.searchParams.get('dex'));
  if (Number.isInteger(dexId)&&lookup(dexId)) dex.open(dexId);
  requestAnimationFrame(animate);
}).catch(error => {
  $('loading').textContent='The 3D field could not load. Check that WebGL is enabled, then reload.';
  console.error(error);
});
