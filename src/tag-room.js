import {Peer} from 'peerjs';
import {createTagMatch,tagComputerChoice,tagTeam,trainers} from './tag-match.js';
import {generateRival} from './team.js';

const protocol='pbf-kanto-tag-v1';
const endpoint=(mode,id)=>protocol+'-'+mode+'-'+id;

export class TagRoom {
  constructor({mode,invite,role,party,onLobby,onState,onEnd}) {
    tagTeam(party);
    this.mode=mode;this.host=!invite;this.id=invite || crypto.randomUUID();
    this.role=role;this.party=structuredClone(party);this.onLobby=onLobby;this.onState=onState;this.onEnd=onEnd;
    this.seat=this.host?0:null;this.parties=[this.host?this.party:null,null,null,null];
    this.connections=new Map();this.timers=new Set();this.phase=0;this.closed=false;
    this.peer=new Peer(this.host?endpoint(mode,this.id):undefined);
    const opening=this.timeout(()=>this.end('The room service did not respond. Try again.'));
    this.peer.on('open',()=>{
      this.cancel(opening);
      if (this.closed) return;
      if (this.host) this.lobby();
      else {
        const conn=this.peer.connect(endpoint(mode,this.id),{reliable:true,metadata:{protocol}});
        this.conn=conn;
        const joining=this.timeout(()=>this.end('Could not join. Check that the host has the room open.'));
        conn.on('open',()=>conn.send({type:'join',role:this.role,party:this.party}));
        conn.on('data',packet=>{this.cancel(joining);this.receiveGuest(packet);});
        conn.on('close',()=>this.end('The host closed the room.'));
        conn.on('error',()=>this.end('Connection to the host was interrupted.'));
      }
    });
    this.peer.on('connection',conn=>this.accept(conn));
    this.peer.on('error',error=>{
      if (this.host && error.type==='peer-unavailable') return;
      this.end('The tag room is unavailable. Check the invite and try again.');
    });
    this.peer.on('disconnected',()=>{if (!this.view) this.end('The room service disconnected. Create a new invite.');});
  }
  timeout(fn) {
    const timer=setTimeout(()=>{this.timers.delete(timer);fn();},35000);this.timers.add(timer);return timer;
  }
  cancel(timer) {clearTimeout(timer);this.timers.delete(timer);}
  accept(conn) {
    if (!this.host || conn.metadata?.protocol!==protocol) {conn.close();return;}
    let seat=null;
    const timer=this.timeout(()=>conn.close());
    conn.on('data',p=>{
      if (this.closed || !p || typeof p!=='object') return;
      if (seat===null && p.type==='join') {
        const seats=p.role==='ally'?[2]:p.role==='foe' && this.mode==='versus'?[1,3]:[];
        const available=seats.find(s=>!this.parties[s]);
        if (this.match || available===undefined) {conn.send({type:'end',text:'Those trainer seats are full. Ask for a new invite.'});return;}
        try {tagTeam(p.party);} catch(error) {conn.send({type:'end',text:error.message});return;}
        seat=available;this.cancel(timer);this.parties[seat]=p.party;this.connections.set(seat,conn);
        this.lobby();
        if (this.mode==='coop' && this.parties[2]) {
          this.parties[1]=generateRival(this.parties[0].length);
          this.parties[3]=generateRival(this.parties[2].length);
        }
        if (this.parties.every(Boolean)) {
          try {this.match=createTagMatch(this.parties);this.publish([]);} catch {this.end('Could not start the tag match. Try creating a new room.');}
        }
      } else if (seat!==null && p.type==='choice' && p.phase===this.phase && this.released) {
        this.record(seat,p.command);
      }
    });
    const lost=()=>{
      this.cancel(timer);
      if (this.closed || seat===null || !this.connections.delete(seat)) return;
      if (this.match) {this.end(trainers[seat]+' disconnected. The tag battle has ended.');return;}
      this.parties[seat]=null;this.lobby();
    };
    conn.on('close',lost);conn.on('error',lost);
  }
  lobby() {
    const seats=this.parties.map(Boolean);
    for (const [seat,c] of this.connections) c.send({type:'lobby',seat,seats});
    this.onLobby(this,seats);
  }
  receiveGuest(p) {
    if (this.closed || !p) return;
    if (p.type==='end') {this.end(p.text);return;}
    if (p.type==='lobby') {this.seat=p.seat;this.onLobby(this,p.seats);return;}
    if (p.type==='state' && (!this.view || p.phase>this.phase)) {
      this.phase=p.phase;this.released=false;this.choice=null;this.view=p.view;
      this.onState(this,p.events);
    } else if (p.type==='release' && p.phase===this.phase) {
      this.released=true;this.sendChoice();
    }
  }
  publish(events) {
    this.phase++;this.commands=new Map();this.released=false;this.choice=null;
    this.views=[0,1,2,3].map(s=>this.match.view(s));this.view=this.views[0];
    for(const [seat,c] of this.connections) c.send({type:'state',view:this.views[seat],phase:this.phase,events});
    this.onState(this,events);
    if (this.view.ended) return;
    if (this.mode==='coop') for (const seat of [1,3]) {
      if (this.views[seat].choices.length) this.commands.set(seat,tagComputerChoice(this.views[seat]));
    }
    if (!this.view.choices.length) this.release();
  }
  submit(command) {
    if (this.closed || this.choice || !this.view?.choices.some(c=>c.command===command)) return;
    this.choice=command;
    if (this.host) {this.commands.set(0,command);this.release();}
    else this.sendChoice();
  }
  release() {
    this.released=true;
    for (const c of this.connections.values()) c.send({type:'release',phase:this.phase});
    this.resolve();
  }
  sendChoice() {
    if (this.released && this.choice) this.conn.send({type:'choice',phase:this.phase,command:this.choice});
  }
  record(seat,command) {
    if (!this.match || this.commands.has(seat) || !this.views[seat].choices.some(c=>c.command===command)) return;
    this.commands.set(seat,command);this.resolve();
  }
  resolve() {
    if (this.view.ended || this.views.some((v,i)=>v.choices.length && !this.commands.has(i))) return;
    try {
      const events=this.match.turn(this.views.map((_,i)=>this.commands.get(i)));
      this.publish(events);
    } catch {this.end('The simulator could not resolve that turn. The tag battle has ended.');}
  }
  end(text) {
    if (this.closed) return;
    this.closed=true;
    for (const timer of this.timers) clearTimeout(timer);
    for (const c of this.connections.values()) if(c.open) c.send({type:'end',text:text || 'The host left the room.'});
    this.peer.destroy();this.onEnd(text || '');
  }
}
