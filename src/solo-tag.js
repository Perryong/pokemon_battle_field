import {createTagMatch,tagComputerChoice,tagTeam} from './tag-match.js';
import {generateRival} from './team.js';

export function createSoloTag(party,onState) {
  tagTeam(party);
  const computers=Array.from({length:3},()=>generateRival(party.length));
  const match=createTagMatch([party,...computers]);
  return {
    mode:'solo',seat:0,view:match.view(0),closed:false,
    submit(command) {
      if (this.closed || this.view.ended) return;
      if (this.view.choices.length && !this.view.choices.some(c=>c.command===command)) return;
      const moves=[command,...[1,2,3].map(seat=>tagComputerChoice(match.view(seat)))];
      const events=match.turn(moves);
      this.view=match.view(0);
      onState(this,events);
    },
    end(){this.closed=true;},
  };
}
