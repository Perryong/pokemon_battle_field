// Present both trainers as the near-side player on their own screen.
function perspective(snapshot, guest) {
  if (!guest) return {...snapshot};
  const result = {};
  for (const [key, value] of Object.entries(snapshot)) {
    const mirrored = key.startsWith('player') ? 'rival' + key.slice(6) :
      key.startsWith('rival') ? 'player' + key.slice(5) : key;
    result[mirrored] = value;
  }
  return result;
}

export function friendView(view, guest) {
  const result = perspective(view, guest);
  result.choices = guest ? view.rivalChoices : view.choices;
  // Only the opponent's surviving count is used by the party panel.
  result.rivalParty = result.rivalParty.map(member => ({hp: Number(member.hp > 0)}));
  delete result.rivalChoices;
  delete result.playerChoices;
  // Keep unrevealed party order private too.
  delete result.rivalSlot;
  if (guest && ['player', 'rival'].includes(view.winner))
    result.winner = view.winner === 'player' ? 'rival' : 'player';
  return result;
}

export function friendEvents(events, guest) {
  return events.map(event => {
    const result = perspective(event, guest);
    result.meta = {...event.meta, before: perspective(event.meta.before, guest)};
    delete result.rivalSlot;
    delete result.meta.before.rivalSlot;
    if (guest) {
      result.side = event.side === 'player' ? 'rival' : 'player';
      if (event.meta.switch) result.text = event.text.replace(/^(Player|Rival)/, name => name === 'Player' ? 'Rival' : 'Player');
    }
    return result;
  });
}

// Send only the selected move slot or switch slot. Check legality against the
// current simulator request before accepting input from the other browser.
export function legalCommand(view, side, command) {
  const request = view[side + 'Request'];
  if (!command || typeof command !== 'object') return false;
  if (Number.isInteger(command.switch)) {
    return ['move','switch'].includes(request) &&
      view[side + 'Party'].some(member => member.slot === command.switch && member.canSwitch);
  }
  return request === 'move' && (side === 'player' ? view.choices : view.rivalChoices)
    .some(move => !move.disabled && move.id === command.id && move.slot === command.slot);
}

export function wireCommand(command) {
  return 'switch' in command ? {switch:command.switch} : {id:command.id,slot:command.slot};
}
