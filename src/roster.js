import catalog from './kanto.json' with {type:'json'};
export const roster=catalog;
export const lookup=id=>roster[Number(id)-1];
export const dexNumber=id=>'#'+String(id).padStart(3,'0');
export const typeColors={Normal:'#9a9786',Fighting:'#c66c54',Flying:'#859abd',Poison:'#ae7bb7',Ground:'#bb985f',Rock:'#a29870',Bug:'#8aa14a',Ghost:'#8675ae',Steel:'#83a1a9',Fire:'#da7752',Water:'#679fc1',Grass:'#74a46a',Electric:'#d9b448',Psychic:'#cd7f9d',Ice:'#84b9b7',Dragon:'#7c80ba',Fairy:'#cb95b8'};
