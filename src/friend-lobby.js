import {FriendRoom,isRoomId} from './friend-room.js';
import {CASUAL,OU,partyProblem} from './formats.js';
import {lookup} from './roster.js';
const $ = id => document.getElementById(id);

export function setupFriendLobby({getTeam,getFormat,editTeam,onStart,onTurn,onExit,onChange}) {
  const dialog = $('friendLobby');
  const params=new URLSearchParams(location.hash.slice(1));
  const inviteParam=params.get('battle');
  const inviteFormat=params.get('format') || CASUAL;
  let invite = inviteParam, room = null, editing = false, status = '';

  function update() {
    const busy = room && !room.closed;
    $('friendStatus').textContent = status;
    $('friendTeam').textContent = getTeam().map(member=>lookup(member.id).name).join(' · ');
    $('friendEdit').disabled = Boolean(busy || (invite!==null && ![CASUAL,OU].includes(inviteFormat)));
    $('friendConnect').hidden = Boolean(busy);
    const format=invite!==null ? inviteFormat : $('friendFormat').value;
    const problem=partyProblem(getTeam(),format);
    $('friendFormat').disabled=Boolean(busy || invite!==null);
    $('friendProblems').textContent=problem;
    $('friendProblems').hidden=!problem;
    $('friendConnect').disabled = Boolean(problem || (invite !== null && !isRoomId(invite)));
    $('friendConnect').textContent = invite ? 'Join with my team' : 'Create invite';
    $('friendLeave').hidden = !room && invite === null;
    $('friendLeave').textContent = busy ? 'Leave room' : 'Back to solo battle';
    $('friendShare').hidden = !busy || !room.shareUrl;
    $('friendOpen').textContent = room ? 'Friend room' : 'Battle a friend';
  }

  function open() {
    $('friendFormat').value=room?.format || (invite!==null ? inviteFormat : getFormat());
    if (!room) status = invite === null ? 'Create a link and send it to one friend. Keep both battle tabs open.' :
      isRoomId(invite) ? 'You have a battle invite. Choose your team and join when ready.' : 'This invite link is incomplete.';
    update();
    dialog.showModal();
  }

  function reset() {
    const previous = room;
    room = null;
    previous?.leave();
    if (invite !== null) {
      invite = null;
      history.replaceState(null,'',location.pathname+location.search);
    }
    status = '';
    $('friendLink').value = '';
    dialog.close();
    onExit();
    update();
  }

  $('friendConnect').onclick = () => {
    if (room && !room.closed) return;
    const wasPlaying = room?.started;
    room = null;
    if (wasPlaying) onExit();
    status = invite ? 'Joining the host…' : 'Opening your room…';
    try {
      const format=$('friendFormat').value;
      if (partyProblem(getTeam(),format)) { update();return; }
      room = new FriendRoom({
        invite,party:getTeam(),format,
        onInvite(id) {
          const url = new URL(location.protocol === 'file:' ?
            'https://perryong.github.io/pokemon_battle_field/' : location.href);
          url.search='';url.hash='battle='+id+(format===OU?'&format='+OU:'');
          room.shareUrl=url.href;$('friendLink').value=room.shareUrl;update();
        },
        onStatus(message) { status=message;update();onChange(); },
        onStart(view) { dialog.close();status='Friend connected.';onStart(view);update(); },
        onTurn(view,events) { status='';onTurn(view,events);update(); },
        onEnd(message) {
          if (!message || !room) return;
          status=message;update();onChange();
          if (!room.started && !dialog.open) dialog.showModal();
        },
      });
    } catch {
      status='Online battles require a browser with WebRTC on the published game site.';
    }
    update();
  };

  $('friendFormat').onchange=update;
  $('friendEdit').onclick = () => { editing=true;dialog.close();editTeam($('friendFormat').value); };
  $('dex').addEventListener('close', () => {
    if (editing) { editing=false;open(); }
  });
  $('friendCopy').onclick = async () => {
    const input=$('friendLink');
    try { await navigator.clipboard.writeText(input.value); status='Link copied. Send it to your friend.'; }
    catch { input.focus();input.select();status='Select and copy the invite link.'; }
    update();
  };
  $('friendOpen').onclick = open;
  $('friendClose').onclick = () => dialog.close();
  $('friendLeave').onclick = reset;
  window.addEventListener('pagehide',()=>room?.leave());
  return {
    get current() { return room?.started ? room : null; },
    get status() { return status; },
    openInvite() { if (invite !== null) open(); },
    open,
  };
}
