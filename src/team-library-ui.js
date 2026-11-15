import {exportTeam,importTeam,readTeams,removeTeam,storeTeam} from './team-library.js';
import {checkedTeam,formatName} from './formats.js';

const $=id=>document.getElementById(id);

export function setupTeamLibrary(storage,currentParty,loadParty) {
  const list=$('savedTeams'),name=$('savedName'),paste=$('teamPaste'),format=$('dexFormat');
  let loaded='';
  function message(text,error=false) {
    $('libraryMessage').textContent=text;
    $('libraryMessage').classList.toggle('format-problem',error);
  }
  function refresh(selected='') {
    const saved=readTeams(storage);
    list.replaceChildren(new Option(saved.length?'Choose a team':'No saved teams',''),
      ...saved.map(t=>new Option(t.name+' · '+formatName(t.format)+' · '+t.party.length,t.name)));
    list.value=selected;
    list.onchange();
  }
  function canUpdate() { return loaded && loaded===name.value.trim(); }
  function bind(id,action) {
    $(id).onclick=()=>{try {action();} catch(error) {message(error.message,true);}};
  }
  list.onchange=()=>{ $('loadSaved').disabled=$('deleteSaved').disabled=!list.value; };
  name.oninput=()=>{ $('saveNamed').textContent=canUpdate()?'Update saved team':'Save new team'; };
  function identify(value,saved) {
    loaded=saved?value:'';name.value=value;name.oninput();
  }
  bind('saveNamed',()=>{
    const title=name.value.trim();
    storeTeam(storage,title,format.value,currentParty(),canUpdate());
    identify(title,true);refresh(title);message('Saved “'+title+'” on this device.');
  });
  bind('loadSaved',()=>{
    const entry=readTeams(storage).find(t=>t.name===list.value);
    if (!entry) throw new Error('Choose a saved team.');
    checkedTeam(entry.party,format.disabled?format.value:entry.format);
    loadParty(entry);identify(entry.name,true);message('Loaded “'+entry.name+'” into your party.');
  });
  bind('deleteSaved',()=>{
    const title=list.value;
    if (!title || !window.confirm('Delete “'+title+'” from saved teams?')) return;
    removeTeam(storage,title);if (loaded===title) identify('',false);
    refresh();message('Deleted “'+title+'”.');
  });
  bind('importPaste',()=>{
    const entry=importTeam(paste.value,format.value,format.disabled);
    loadParty(entry);identify(entry.name,false);list.value='';list.onchange();
    message('Imported '+entry.party.length+' Pokémon for '+formatName(format.value)+'. Name the team to save it.');
  });
  bind('exportPaste',()=>{
    paste.value=exportTeam(currentParty(),format.value);paste.focus();paste.select();
    message('Party exported. Copy the text into Showdown’s Import/Export editor.');
  });
  $('copyPaste').onclick=async()=>{
    if (!paste.value.trim()) {message('Export your party or paste a team first.');return;}
    try {await navigator.clipboard.writeText(paste.value);message('Team text copied.');}
    catch {paste.focus();paste.select();message('Text selected. Use your device’s Copy command.');}
  };
  return {reset(){
    $('teamLibrary').open=false;identify('',false);paste.value='';message('');
    try {refresh();} catch(error) {list.replaceChildren();list.onchange();message(error.message,true);}
  }};
}
