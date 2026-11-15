import {createTagMatch,tagComputerChoice,tagTeam} from './tag-match.js';
import {generateRival} from './team.js';

export function createSoloTag(party,onState,partner=null,{opponent1,opponent2}={}) {
  tagTeam(party);
  const rival=opponent1 ?? generateRival(party.length);
  const teammate=partner ?? generateRival(party.length);
  tagTeam(teammate);
  const otherRival=opponent2 ?? generateRival(teammate.length);
  const match=createTagMatch([party,rival,teammate,otherRival]);
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
