import {roster, lookup, dexNumber, typeColors} from './roster.js';
import {moveById, sourceNote, validateLoadout} from './gen1-data.js';
import {portrait} from './thumbs.js';
import {PARTY_LIMIT, generateRival} from './team.js';
import {inspector} from './inspect.js';

const $ = id => document.getElementById(id);
const searchKey = text => text.normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .replaceAll('♀','f').replaceAll('♂','m').toLowerCase().replace(/[^a-z0-9]/g,'');

export function setupDex({team, apply}) {
  const dialog = $('dex');
  let members = [], slot = 0, rivalMode = false;
  let selected = null, draft = [], legalMoves = [], studio;
  for (const type of [...new Set(roster.flatMap(mon => mon.types))].sort()) {
    $('dexType').add(new Option(type, type));
  }

  function showMoveInfo() {
    const move = moveById(Number($('previewMove').value));
    const info = $('moveInfo');
    info.replaceChildren();
    if (!move) return;
    const facts = document.createElement('strong');
    const power = move.category === 'Status' ? 'Status' :
      move.power > 1 ? move.power + ' power' : 'Special damage';
    facts.textContent = [move.type, move.category, power, move.accuracy == null ? 'Bypasses accuracy check' : move.accuracy + '% accuracy', move.pp + ' PP']
      .filter((value,i) => !(i === 2 && value === 'Status')).join(' · ');
    info.append(facts);
    for (const text of [move.description, move.id === 165 ? 'Used automatically when no other move is available.' : sourceNote(selected, move.id)]) {
      if (!text) continue;
      const line = document.createElement('span');
      line.textContent = text;
      info.append(line);
    }
  }

  function validateDraft() {
    const ids = draft.filter(Boolean);
    const reason = !ids.length ? 'Equip at least one move.' : validateLoadout(selected, ids);
    $('setCount').textContent = ids.length + ' / 4';
    $('setError').textContent = reason || '';
    const unavailable = !document.querySelector('#speciesList [aria-pressed="true"]');
    $('asPlayer').disabled = $('asRival').disabled = !!reason || unavailable;
    $('partyAdd').disabled = !!reason || unavailable || members.length >= PARTY_LIMIT;
    $('asPlayer').disabled ||= !members[slot] || (selected.id === members[slot].id && ids.join() === members[slot].moves.join());
    const editingMember=!rivalMode && members[slot]?.id===selected.id;
    const pending=editingMember && members[slot].moves.join()!==ids.join();
    $('partyBattle').disabled=!!(pending && reason);
    $('partyHelp').textContent=pending
      ? reason || ('Starting saves these moves in slot '+(slot+1)+'.')
      : 'Slot 1 leads. Your rival will bring '+members.length+' Pokémon.';
    $('previewMove').disabled = $('previewAttack').disabled = unavailable;
  }

  function renderSlots() {
    const slots = $('equippedSlots');
    slots.replaceChildren();
    for (let i = 0; i < 4; i++) {
      const label = document.createElement('label');
      label.textContent = 'Slot ' + (i + 1);
      const select = document.createElement('select');
      select.dataset.slot = i;
      select.add(new Option('Empty slot', ''));
      for (const move of legalMoves) select.add(new Option(move.name, move.id));
      select.value = draft[i] || '';
      select.onchange = () => {
        const next = Number(select.value) || null;
        const previous = draft.indexOf(next);
        if (next && previous >= 0 && previous !== i) draft[previous] = draft[i];
        draft[i] = next;
        if (next) { $('previewMove').value = next; showMoveInfo(); }
        renderSlots();
        slots.querySelector('[data-slot="'+i+'"]').focus({preventScroll:true});
      };
      label.append(select);
      slots.append(label);
    }
    validateDraft();
  }

  function detail(id, reset = false) {
    const mon = lookup(id);
    const changed = selected?.id !== id || reset;
    selected = mon;
    studio ??= inspector($('modelView'));
    const fighter = studio.set(mon, $('trainerCompare').checked);
    for (const button of $('speciesList').querySelectorAll('button')) {
      button.setAttribute('aria-pressed', Number(button.dataset.dex) === id);
    }
    if (changed) {
      const current = rivalMode ? team()[1].find(m=>m.id===id) : members[slot];
      const config = current?.id === id ? current : undefined;
      draft = [...(config?.moves || mon.defaultMoves)];
      while (draft.length < 4) draft.push(null);
      legalMoves = mon.learnset.map(moveById).sort((a,b) => a.name.localeCompare(b.name));
      const fallback = document.createElement('optgroup');
      fallback.label = 'Out of PP';
      fallback.append(new Option('Struggle',165));
      $('previewMove').replaceChildren(...legalMoves.map(move => new Option(move.name, move.id)),fallback);
      $('previewMove').value = draft.find(Boolean) || legalMoves[0].id;
      renderSlots();
      showMoveInfo();
    }
    $('dexId').textContent = 'NATIONAL ' + dexNumber(id);
    $('dexName').textContent = mon.name;
    $('types').replaceChildren(...mon.types.map(type => {
      const chip = document.createElement('span');
      chip.textContent = type; chip.style.borderColor = typeColors[type]; return chip;
    }));
    $('measureLabel').textContent = fighter.measure === 'length' ? 'Pokédex length' : 'Pokédex height';
    $('dexSize').textContent = mon.metres.toFixed(1) + ' m';
    $('dexWeight').textContent = mon.kg.toLocaleString() + ' kg';
    $('dexNote').textContent = fighter.path ? 'Measured along the body. Its resting pose is ' + fighter.height.toFixed(2) + ' m tall.' : '';
  }

  function list() {
    const query = searchKey($('dexSearch').value);
    const type = $('dexType').value;
    const rows = roster.filter(mon => (!type || mon.types.includes(type)) &&
      (!query || searchKey(mon.name).includes(query) || (/^\d+$/.test(query) && mon.id === Number(query))));
    $('count').textContent = rows.length + ' / 151 species';
    const wrap = $('speciesList'); wrap.replaceChildren();
    for (const mon of rows) {
      const button = document.createElement('button');
      button.className = 'species'; button.dataset.dex = mon.id;
      button.setAttribute('aria-pressed', selected?.id === mon.id);
      button.innerHTML = '<i class="portrait"></i><span><small>' + dexNumber(mon.id) +
        '</small><strong>' + mon.name + '</strong></span>';
      portrait(button.firstChild, mon.id);
      button.onclick = () => detail(mon.id);
      wrap.append(button);
    }
    document.querySelector('.dex-detail').setAttribute('aria-disabled', !rows.length);
    if (!rows.length) wrap.textContent = 'No matches. Try a different name, number, or type.';
    else if (!rows.some(mon => mon.id === selected?.id)) detail(rows[0].id);
    if (selected) validateDraft();
  }

  function renderParty() {
    $('partyCount').textContent = members.length + ' / ' + PARTY_LIMIT;
    $('partySlots').replaceChildren(...members.map((member,i)=>{
      const b=document.createElement('button');
      b.dataset.partySlot=i; b.setAttribute('aria-pressed',slot===i);
      b.append(document.createElement('i'),document.createElement('span'));
      b.firstChild.className='portrait';portrait(b.firstChild,member.id);
      b.lastChild.textContent=(i===0?'Lead':i+1)+' · '+lookup(member.id).name;
      b.onclick=()=>{slot=i;rivalMode=false;$('dexSearch').value=$('dexType').value='';
        list();detail(member.id,true);renderParty();$('partyNotice').textContent='';};
      return b;
    }));
    $('asPlayer').textContent='Save to slot '+(slot+1);
    $('makeLead').disabled=slot===0;
    $('partyRemove').disabled=members.length===1;
    validateDraft();
  }
  function stage(append) {
    const member={id:selected.id,moves:draft.filter(Boolean)};
    if (validateLoadout(selected,member.moves) || (append && members.length>=PARTY_LIMIT)) return;
    if (append) {slot=members.length;members.push(member);} else members[slot]=member;
    rivalMode=false;
    renderParty();$('partyNotice').textContent=selected.name+' saved in slot '+(slot+1)+'.';
  }
  function start(rivalLead=null) {
    if (!rivalLead && !rivalMode && members[slot].id===selected.id) {
      const moves=draft.filter(Boolean);
      if (validateLoadout(selected,moves)) return;
      members[slot]={id:selected.id,moves};
    }
    const rival=generateRival(members.length,rivalLead);
    apply([members,rival]);dialog.close();
  }
  function open(id, side = 0, preferredSlot = 0) {
    members=team()[0].map(p=>({id:p.id,moves:[...p.moves]}));
    slot=Math.max(0,Math.min(preferredSlot,members.length-1));rivalMode=side===1;
    $('partyNotice').textContent='';
    $('dexSearch').value = $('dexType').value = '';
    $('rivalEditor').open=rivalMode;
    selected = lookup(id);
    dialog.showModal(); list(); detail(id, true); renderParty();
    dialog.scrollTop=0;
    $('speciesList').querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest'});
    $('dexSearch').focus({preventScroll:true});
  }
  $('dexSearch').oninput = $('dexType').onchange = list;
  $('trainerCompare').onchange = () => detail(selected.id);
  $('previewMove').onchange = () => { studio?.cancelPreview?.(); showMoveInfo(); };
  $('previewAttack').onclick = () => studio.perform(Number($('previewMove').value));
  $('dexClose').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (!dialog.open) studio?.stop(); });
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  $('partyAdd').onclick=()=>stage(true);
  $('asPlayer').onclick=()=>stage(false);
  $('asRival').onclick=()=>start({id:selected.id,moves:draft.filter(Boolean)});
  $('makeLead').onclick=()=>{
    const [member]=members.splice(slot,1);members.unshift(member);slot=0;rivalMode=false;
    $('dexSearch').value=$('dexType').value='';list();detail(member.id,true);renderParty();$('partyNotice').textContent=selected.name+' will lead.';
  };
  $('partyRemove').onclick=()=>{
    if (members.length===1) return;
    members.splice(slot,1);slot=Math.min(slot,members.length-1);rivalMode=false;
    $('dexSearch').value=$('dexType').value='';list();detail(members[slot].id,true);renderParty();
    $('partyNotice').textContent='Slot removed.';
  };
  $('partyBattle').onclick=()=>start();
  $('openDex').onclick=()=>open(team()[0][0].id);
  return {open, get studio() { return studio; }};
}
