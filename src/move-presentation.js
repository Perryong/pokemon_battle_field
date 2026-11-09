// One entry per Red/Blue move, in move-number order. Each line selects a staging
// pattern, a drawn object, a palette and (where applicable) the number of beats.
const score = `
Pound|blow|palm|cream
Karate Chop|slash|chop|red
Double Slap|blow|palm|pink|3
Comet Punch|blow|fist|gold|4
Mega Punch|blow|fist|orange
Pay Day|shot|coin|gold|5
Fire Punch|blow|fist|fire
Ice Punch|blow|fist|ice
Thunder Punch|blow|fist|volt
Scratch|slash|claw|cream
Vise Grip|clamp|pincer|orange
Guillotine|clamp|blade|steel
Razor Wind|wind|blade|mint
Swords Dance|buff|sword|steel|3
Cut|slash|blade|leaf
Gust|wind|feather|mint
Wing Attack|blow|feather|sky
Whirlwind|wind|spiral|sky|4
Fly|aerial|feather|sky
Bind|coil|band|tan|3
Slam|blow|burst|orange
Vine Whip|lash|leaf|leaf
Stomp|blow|foot|tan
Double Kick|kick|foot|orange|2
Mega Kick|kick|foot|red
Jump Kick|aerial|foot|orange
Rolling Kick|roll|foot|red
Sand Attack|dust|stone|sand|14
Headbutt|ram|burst|cream
Horn Attack|stab|horn|ivory
Fury Attack|stab|horn|orange|4
Horn Drill|drill|horn|steel
Tackle|ram|burst|tan
Body Slam|aerial|burst|orange
Wrap|coil|band|tan|4
Take Down|dash|burst|rust
Thrash|blow|claw|red|3
Double-Edge|dash|star|gold
Tail Whip|debuff|tail|pink
Poison Sting|dart|needle|venom
Twineedle|dart|needle|leaf|2
Pin Missile|dart|needle|mint|5
Leer|gaze|eye|red
Bite|clamp|fang|ivory
Growl|sound|ripple|tan
Roar|sound|ripple|orange|5
Sing|sound|note|pink
Supersonic|sound|ripple|gold|6
Sonic Boom|sound|blade|mint|2
Disable|gaze|cross|violet
Acid|shot|drop|acid|4
Ember|shot|flame|fire|4
Flamethrower|stream|flame|fire
Mist|selfcloud|cloud|ice
Water Gun|stream|drop|water
Hydro Pump|stream|jet|water
Surf|ground|wave|water
Ice Beam|beam|crystal|ice
Blizzard|storm|snow|ice|16
Psybeam|beam|spiral|psy
Bubble Beam|stream|bubble|water
Aurora Beam|beam|ribbon|aurora
Hyper Beam|beam|star|gold
Peck|stab|beak|ivory
Drill Peck|drill|beak|sky
Submission|roll|band|orange
Low Kick|kick|foot|tan
Counter|blow|shield|rust
Seismic Toss|toss|stone|sand
Strength|ram|stone|orange
Absorb|drain|seed|leaf|6
Mega Drain|drain|seed|mint|12
Leech Seed|seed|sprout|leaf
Growth|buff|sprout|leaf
Razor Leaf|dart|leaf|leaf|6
Solar Beam|beam|sun|solar
Poison Powder|dust|spore|venom|14
Stun Spore|dust|spore|gold|14
Sleep Powder|dust|sleep|sky|14
Petal Dance|wind|petal|pink|12
String Shot|coil|thread|ivory|5
Dragon Rage|stream|flame|dragon
Fire Spin|coil|flame|fire|5
Thunder Shock|bolt|spark|volt|1
Thunderbolt|bolt|spark|volt|3
Thunder Wave|bolt|ripple|volt|2
Thunder|storm|bolt|volt|3
Rock Throw|lob|stone|earth
Earthquake|ground|stone|earth
Fissure|ground|crack|rust
Dig|burrow|stone|earth
Toxic|dust|skull|venom|8
Confusion|mind|spiral|violet
Psychic|mind|eye|psy
Hypnosis|gaze|spiral|violet
Meditate|buff|halo|psy
Agility|echo|trail|sky
Quick Attack|dash|trail|cream
Rage|blow|flame|rust
Teleport|blink|star|psy
Night Shade|mind|ghost|ghost
Mimic|copy|mask|violet
Screech|sound|zigzag|gold|5
Double Team|echo|clone|mint
Recover|heal|cross|mint
Harden|buff|plate|steel
Minimize|shrink|star|pink
Smokescreen|dust|cloud|smoke|12
Confuse Ray|beam|spiral|ghost
Withdraw|buff|shell|water
Defense Curl|buff|shell|tan
Barrier|screen|wall|psy
Light Screen|screen|pane|solar
Haze|field|cloud|smoke
Reflect|screen|mirror|ice
Focus Energy|buff|spark|gold
Bide|buff|burst|rust
Metronome|call|finger|violet
Mirror Move|call|mirror|sky
Self-Destruct|burst|blast|orange
Egg Bomb|lob|egg|ivory
Lick|lash|tongue|pink
Smog|dust|cloud|venom|12
Sludge|lob|drop|venom|3
Bone Club|blow|bone|ivory
Fire Blast|stream|kanji|fire
Waterfall|ground|fall|water
Clamp|clamp|shell|water
Swift|dart|star|gold|5
Skull Bash|ram|skull|ivory
Spike Cannon|dart|spike|steel|5
Constrict|coil|band|violet|2
Amnesia|buff|question|psy
Kinesis|mind|spoon|violet
Soft-Boiled|heal|egg|ivory
High Jump Kick|aerial|foot|red
Glare|gaze|eye|gold
Dream Eater|drain|dream|ghost|9
Poison Gas|dust|cloud|venom|16
Barrage|lob|egg|tan|5
Leech Life|drain|fang|rust|8
Lovely Kiss|shot|heart|pink|3
Sky Attack|aerial|feather|solar
Transform|transform|mask|violet
Bubble|shot|bubble|water|6
Dizzy Punch|blow|fist|psy
Spore|dust|spore|tan|18
Flash|field|sun|solar
Psywave|sound|spiral|psy|4
Splash|splash|drop|water
Acid Armor|melt|drop|acid
Crabhammer|blow|pincer|red
Explosion|burst|blast|fire
Fury Swipes|slash|claw|rust|4
Bonemerang|return|bone|ivory|2
Rest|heal|sleep|sky
Rock Slide|storm|stone|earth|10
Hyper Fang|clamp|fang|orange
Sharpen|buff|blade|steel
Conversion|buff|cube|aurora
Tri Attack|triad|star|aurora|3
Super Fang|clamp|fang|red
Slash|slash|claw|steel
Substitute|doll|doll|leaf
Struggle|blow|burst|rust
`.trim().split('\n');
export const movePresentations=score.map((line,i)=>{
 const [name,style,motif,palette,n]=line.split('|');
 return {id:i+1,name,style,motif,palette,n:Number(n)||1};
});
export function presentation(id){
 const m=movePresentations[Number(id)-1];if(!m)throw new RangeError('Unknown move presentation '+id);
 return m;
}
export const selfStyles=new Set(['buff','selfcloud','echo','blink','shrink','heal','screen','call','transform','splash','melt','doll','copy']);
