import {Peer} from 'peerjs';
import {CASUAL,OU} from './formats.js';
import {createPartyMatch} from './gen1-battle.js';
import {friendEvents, friendView, legalCommand, wireCommand} from './friend-match.js';

const protocol = 'pbf-rby-1';
export const isRoomId = value => /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(value || '');
const endpoint = (id,format) => protocol + (format===OU?'-ou':'') + '-' + id;

// Only the host runs the simulator. The guest holds its choice locally until
// the host has locked its choice, even when the guest submits first.
export class FriendRoom {
  constructor({invite, party, format=CASUAL, onInvite, onStart, onTurn, onStatus, onEnd}) {
    this.callbacks = {onInvite,onStart,onTurn,onStatus,onEnd};
    this.party = structuredClone(party);
    this.format=format;
    this.guest = Boolean(invite);
    this.id = invite || crypto.randomUUID();
    this.phase = 0;
    this.locked = false;
    this.released = false;
    this.closed = false;
    this.peer = new Peer(this.guest ? undefined : endpoint(this.id,this.format));
    this.deadline('The connection service did not respond. Try again.');
    this.peer.on('open', () => {
      if (this.closed) return;
      clearTimeout(this.timer);
      if (this.guest) {
        this.deadline('Could not reach the host. Check that their battle tab is open, or ask for a new link.');
        this.bind(this.peer.connect(endpoint(this.id,this.format), {reliable:true, metadata:{protocol}}));
      } else {
        onInvite(this.id);
        onStatus('Invite ready. Keep this tab open while your friend joins.');
      }
    });
    this.peer.on('connection', conn => {
      if (this.guest || this.conn || conn.metadata?.protocol !== protocol) {
        conn.on('open', () => conn.send({type:'unavailable'}));
        return;
      }
      this.bind(conn);
      this.deadline('The joining trainer did not finish connecting. Create a new invite.');
    });
    this.peer.on('error', error => {
      if (!this.started && !this.closed)
        this.end(error.type === 'peer-unavailable' ? 'This invite has expired or the host has left.' :
          'The battle connection failed. Check your network and try again.');
    });
    this.peer.on('disconnected', () => {
      if (!this.started) this.end('The connection service disconnected. Open a new invite to try again.');
    });
  }

  deadline(message) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.end(message), 35000);
  }

  bind(conn) {
    this.conn = conn;
    conn.on('open', () => {
      if (this.closed) return;
      if (this.guest) this.send({type:'join', protocol, format:this.format, party:this.party});
      this.callbacks.onStatus('Connecting both teams…');
    });
    conn.on('data', packet => {
      if (this.closed) return;
      try { this.receive(packet); }
      catch { this.end('The room received incompatible battle data. Start a new friend battle.'); }
    });
    conn.on('close', () => this.end('Your friend disconnected. This battle has ended.'));
    conn.on('error', () => this.end('The battle connection was interrupted.'));
  }

  send(data) {
    if (this.conn?.open && !this.closed) this.conn.send(data);
  }

  receive(packet) {
    if (!packet || typeof packet !== 'object') return;
    if (packet.type === 'unavailable') return this.end('This room already has two trainers. Ask for a new invite.');
    if (packet.type === 'leave') return this.end('Your friend left the room.');
    if (!this.started) {
      if (!this.guest && packet.type === 'join' && packet.protocol === protocol) {
        if ((packet.format || CASUAL)!==this.format) throw Error('Format mismatch');
        this.match = createPartyMatch(this.party,packet.party,undefined,this.format);
        const view = this.match.view();
        this.send({type:'start',protocol,view:friendView(view,true)});
        this.start(friendView(view,false));
      } else if (this.guest && packet.type === 'start' && packet.protocol === protocol) {
        this.start(packet.view);
      }
      return;
    }
    if (this.guest && packet.type === 'turn' && packet.phase === this.phase + 1) {
      this.advance(packet.view,packet.events);
      return;
    }
    if (packet.phase !== this.phase) return;
    if (this.guest && packet.type === 'release') {
      this.released = true;
      this.sendGuestChoice();
    } else if (!this.guest && packet.type === 'choice' && this.locked && this.released) {
      const view = this.match.view();
      if (!legalCommand(view,'rival',packet.command)) throw Error('Invalid guest choice');
      this.resolve(wireCommand(packet.command));
    }
  }

  start(view) {
    clearTimeout(this.timer);
    this.started = true;
    this.view = view;
    this.prepare();
    this.callbacks.onStart(view);
  }

  prepare() {
    this.choice = null;
    this.released = false;
    this.locked = this.view.playerRequest === 'wait' || Boolean(this.view.winner);
    if (!this.guest && this.locked && !this.view.winner) this.requestGuest();
  }

  submit(command) {
    if (this.closed || this.locked || !this.started || !legalCommand(this.view,'player',command)) return;
    this.choice = wireCommand(command);
    this.locked = true;
    this.callbacks.onStatus('Choice locked. Waiting for your friend.');
    if (this.guest) this.sendGuestChoice();
    else this.requestGuest();
  }

  requestGuest() {
    if (this.view.rivalRequest === 'wait') this.resolve(null);
    else {
      this.released = true;
      this.send({type:'release',phase:this.phase});
    }
  }

  sendGuestChoice() {
    if (this.released && this.locked && this.choice) {
      this.send({type:'choice',phase:this.phase,command:this.choice});
      this.released = false;
    }
  }

  resolve(guestChoice) {
    const events = this.match.turn(this.choice,guestChoice);
    const view = this.match.view();
    this.send({type:'turn',phase:this.phase+1,view:friendView(view,true),events:friendEvents(events,true)});
    this.advance(friendView(view,false),friendEvents(events,false));
  }

  advance(view,events) {
    this.phase++;
    this.view = view;
    this.prepare();
    this.callbacks.onTurn(view,events);
  }

  end(message) {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.timer);
    this.peer.destroy();
    this.callbacks.onEnd(message);
  }

  leave() {
    this.send({type:'leave'});
    this.end('');
  }
}
