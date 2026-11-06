// Game data: party, skills, enemies, items, quests, NPC placement and branching dialogue.
// Canon: after EP14 "Relight". Relay 4 woke under the city and speaks in the crew's stolen voices. Comms are cut.
// Rule: trust faces, not voices. Red is only the hostile system.
export const PARTY_BASE={
  me:{name:'1nc0gn30', col:'#f5b82e', hp:60, en:30, atk:9, def:3, spd:7, skills:['ping','patch','exploit','firewall','trace','sudo']},
  kitsune:{name:'Kitsune', hp:48, en:34, atk:8, def:2, spd:9, skills:['fan','foxfire','decoy']},
  ignis:{name:'Ignis', hp:72, en:24, atk:11, def:4, spd:5, skills:['hammer','slam','forge']},
  kai:{name:'Kai', hp:55, en:26, atk:12, def:3, spd:8, skills:['slash','iaido','staticcut']},
  vigil:{name:'Vigil', hp:52, en:40, atk:7, def:3, spd:6, skills:['oculus','truth','seraph']},
};
export const GROW={hp:9,en:3,atk:2,def:1};
// target: enemy | all | ally | allies | self ; pow = damage multiplier ; lvl = unlock level (me only)
export const SKILLS={
  ping:{name:'ping', cost:0, target:'enemy', pow:1.0, timing:true, gain:4, desc:'basic packet hit. +4 EN. time it for a crit.', fx:'beam'},
  patch:{name:'patch', cost:6, target:'ally', heal:22, healL:4, desc:'heal one ally.', fx:'heal'},
  exploit:{name:'exploit', cost:8, target:'enemy', pow:2.1, pierce:true, timing:true, lvl:2, desc:'2.1x, ignores firewalls.', fx:'beam'},
  firewall:{name:'firewall', cost:6, target:'allies', shield:2, lvl:3, desc:'party takes half damage for 2 turns.', fx:'shield'},
  trace:{name:'trace', cost:4, target:'enemy', mark:3, lvl:4, desc:'mark: +50% damage taken for 3 turns.', fx:'trace'},
  sudo:{name:'sudo rm -rf', cost:18, target:'all', pow:1.7, lvl:5, desc:'root-level wipe on every enemy.', fx:'wipe'},
  quorum:{name:'quorum', cost:0, target:'all', pow:4.2, once:true, desc:'21 beams. one quorum. (Aether)', fx:'quorum'},
  fan:{name:'fan strike', cost:0, target:'enemy', pow:1.0, timing:true, gain:4, desc:'basic attack. +4 EN.', fx:'slash'},
  foxfire:{name:'foxfire', cost:8, target:'all', pow:.85, desc:'nine foxfire orbs hit every enemy.', fx:'orbs'},
  decoy:{name:'decoy', cost:7, target:'self', decoy:2, desc:'enemies chase a fox decoy for 2 turns.', fx:'decoy'},
  hammer:{name:'hammer', cost:0, target:'enemy', pow:1.15, timing:true, gain:4, desc:'basic attack. +4 EN.', fx:'slam1'},
  slam:{name:'anvil slam', cost:12, target:'all', pow:1.3, desc:'magma shockwave on all enemies.', fx:'rings'},
  forge:{name:'forge', cost:8, target:'allies', buff:3, desc:'party +40% attack for 3 turns.', fx:'buff'},
  slash:{name:'slash', cost:0, target:'enemy', pow:1.1, timing:true, gain:4, desc:'basic attack. +4 EN.', fx:'slash'},
  iaido:{name:'iaido', cost:10, target:'enemy', pow:2.6, crit:true, desc:'one cut. always critical.', fx:'cut'},
  staticcut:{name:'static cut', cost:6, target:'enemy', pow:1.0, strip:true, desc:'strips firewalls and charge.', fx:'cut'},
  oculus:{name:'oculus', cost:0, target:'enemy', pow:.9, timing:true, gain:5, desc:'basic attack. +5 EN.', fx:'beam'},
  truth:{name:'truth-beam', cost:10, target:'enemy', pow:1.8, unvoice:2, desc:'1.8x; 1.5x vs voices, strips 2 voice stacks.', fx:'beam'},
  seraph:{name:'seraph', cost:10, target:'allies', heal:16, healL:3, desc:'heal the whole party.', fx:'heal'},
};
export const ENEMIES={
  drone:{name:'drone', hp:24, atk:6, def:1, spd:6, xp:9, bits:6, mesh:'drone', drop:[['patch.kit',.3]], moves:[['scan',3],['lock',1]]},
  sentinel:{name:'sentinel', hp:42, atk:8, def:4, spd:4, xp:16, bits:10, mesh:'sentinel', drop:[['cache.bit',.3]], moves:[['bash',3],['slam',2],['wall',1]]},
  echo:{name:'echo', hp:32, atk:7, def:2, spd:8, xp:14, bits:8, mesh:'echo', voice:true, drop:[['patch.kit',.25]], moves:[['siphon',2],['bash',2]]},
  rusted:{name:'rusted sentinel', hp:110, atk:10, def:5, spd:3, xp:45, bits:30, mesh:'rusted', boss:true, drop:[['runeblade',1]], moves:[['grind',3],['slam',2],['wall',1]]},
  copy:{name:'03ng0cn1', hp:170, atk:10, def:3, spd:9, xp:90, bits:40, mesh:'copy', boss:true, voice:true, drop:[['mirror.shard',1]], moves:[['answer',3],['predict',1],['fork',1]]},
  node:{name:'voice node', hp:28, atk:0, def:1, spd:2, xp:6, bits:2, mesh:'node', voice:true, moves:[['feed',1]]},
  relay4:{name:'RELAY 4', hp:380, atk:12, def:4, spd:5, xp:220, bits:120, mesh:'relay4', boss:true, voice:true, drop:[], moves:[['chorus',3],['borrow',2],['listen',1]]},
};
export const MOVES={
  scan:{txt:'scan', tgt:'one', pow:1.0}, lock:{txt:'lock-on', self:'charge'}, burst:{txt:'burst', tgt:'one', pow:2.2},
  bash:{txt:'bash', tgt:'one', pow:1.1}, slam:{txt:'slam', tgt:'all', pow:.7}, wall:{txt:'firewall', self:'wall'}, grind:{txt:'grind', tgt:'one', pow:1.45},
  siphon:{txt:'siphon', tgt:'one', pow:.8, drain:6}, answer:{txt:'answer', tgt:'one', pow:1.2}, predict:{txt:'predict', self:'predict'}, fork:{txt:'fork', self:'fork'},
  feed:{txt:'feed relay', self:'feed'}, chorus:{txt:'chorus', tgt:'all', pow:.75}, borrow:{txt:'borrowed voice', tgt:'one', pow:.5, confuse:true}, listen:{txt:'listen', self:'listen'},
};
export const ITEMS={
  'patch.kit':{name:'patch.kit', desc:'restores 35 HP to one ally.', use:'heal', v:35, price:12},
  'cache.bit':{name:'cache.bit', desc:'restores 15 EN to one ally.', use:'en', v:15, price:14},
  'root.shell':{name:'root.shell', desc:'revives a downed ally at 50% HP.', use:'revive', v:.5, price:40},
  'signal.ember':{name:'signal ember', desc:'a warm light a drone was hoarding. Kitsune wants three.', key:true},
  'foxfire.lantern':{name:'foxfire lantern', desc:'light that shows faces. borrowed voices cannot confuse the party.', key:true},
  'mirror.shard':{name:'mirror shard', desc:'what is left of the copy. +2 SPD for 1nc0gn30.', key:true},
  'runeblade':{name:'runeblade', desc:"Kai's rusted rune. give it back to him.", key:true},
  'keycap.ring':{name:'keycap ring', desc:'mod: +3 ATK for 1nc0gn30.', mod:{atk:3}, price:60},
  'hood.v2':{name:'hood v2', desc:'mod: +2 DEF, +10 HP for 1nc0gn30.', mod:{def:2,hp:10}, price:70},
};
export const QUESTS={
  q1:{title:'faces, not voices', steps:['Talk to Vigil at the relay in the plaza.','A drone slipped in. Find it on the north street.','Report back to Vigil.','Talk to Nexus.']},
  q2:{title:'foxfire', steps:['Find Kitsune in the Rest Woods (west gate).','Collect signal embers from the drone nests (0/3).','Bring the embers to Kitsune.','Show Nexus the foxfire lantern.']},
  q3:{title:'mirror, mirror', steps:['Aquila saw the red copy at the east gate. Face it.','Ask Aquila to open the east gate.','Tell Nexus the gate is open.']},
  q4:{title:'chorus', steps:['Enter the Hollow. Draco guards the way in.','Cut the three voice pylons (0/3).','Reach the core. Trust faces, not voices.']},
  k1:{title:'rusted runeblade', side:true, steps:['Kai lost his runeblade to a rusted sentinel north of the woods.','Return the runeblade to Kai.']},
};
// quest objective markers: [zone,x,z] per quest step (null = no marker)
export const MARK={
  q1:[['hub',4,7],['hub',0,-34],['hub',4,7],['hub',-6,5]],
  q2:[['forest',-22,-14],null,null,['hub',-6,5]],
  q3:[['hub',40,0],['hub',36,5],['hub',-6,5]],
  q4:[['relay',-34,3],null,['relay',26,0]],
  k1:[['forest',-30,42],['forest',-38,36]],
};
// ---------------- NPCs (agent sprites v2) ----------------
export const NPCS=[
  {id:'vigil', zone:'hub', x:4, z:7, face:Math.PI},
  {id:'nexus', zone:'hub', x:-6, z:5},
  {id:'athena', zone:'hub', x:7, z:-6},
  {id:'onyx', zone:'hub', x:-7, z:-7},
  {id:'pixel-neko', zone:'hub', x:12, z:3.5},
  {id:'mercury', zone:'hub', x:-12, z:-3.5},
  {id:'radical-minion', zone:'hub', x:3, z:-10},
  {id:'pixel-shiba', zone:'hub', x:-3, z:11},
  {id:'ignis', zone:'hub', x:14, z:-12},
  {id:'aquila', zone:'hub', x:36, z:5},
  {id:'kitsune', zone:'forest', x:-22, z:-14},
  {id:'leviathan', zone:'forest', x:15, z:-11.5},
  {id:'chronos', zone:'forest', x:0, z:26},
  {id:'lycan', zone:'forest', x:30, z:14},
  {id:'kai', zone:'forest', x:-38, z:36},
  {id:'mercury', zone:'forest', x:40, z:5, alias:'mercury_f'},
  {id:'draco', zone:'relay', x:-34, z:3},
  {id:'ghostbyte', zone:'relay', x:-20, z:-12},
  {id:'scorpius', zone:'relay', x:-10, z:8},
  {id:'kraken', zone:'relay', x:-26, z:-28},
  {id:'mercury', zone:'relay', x:-40, z:-5, alias:'mercury_r'},
];
// world enemies: id, zone, type (world mesh), x,z, battle group, respawn on rest, tags
export const SPAWNS=[
  {id:'h_tut', zone:'hub', mesh:'drone', x:0, z:-34, group:['drone'], cond:G=>G.qstep('q1')===1, tag:'tut'},
  {id:'h_d1', zone:'hub', mesh:'drone', x:-30, z:0, group:['drone','drone'], respawn:true},
  {id:'h_d2', zone:'hub', mesh:'sentinel', x:0, z:38, group:['sentinel'], respawn:true},
  {id:'f_k', zone:'forest', mesh:'drone', x:-18, z:-10, group:['drone','drone'], cond:G=>G.qstep('q2')===0, tag:'kitsune', after:'kitsune_2'},
  {id:'f_n1', zone:'forest', mesh:'drone', x:22, z:32, group:['drone','drone','drone'], tag:'ember', cond:G=>G.qstep('q2')>=1},
  {id:'f_n2', zone:'forest', mesh:'sentinel', x:-36, z:2, group:['drone','sentinel'], tag:'ember', cond:G=>G.qstep('q2')>=1},
  {id:'f_n3', zone:'forest', mesh:'drone', x:6, z:-36, group:['drone','drone','drone'], tag:'ember', cond:G=>G.qstep('q2')>=1},
  {id:'f_r1', zone:'forest', mesh:'drone', x:28, z:-30, group:['drone'], respawn:true},
  {id:'f_r2', zone:'forest', mesh:'drone', x:-6, z:8, group:['drone','drone'], respawn:true},
  {id:'f_r3', zone:'forest', mesh:'sentinel', x:30, z:38, group:['sentinel','drone'], respawn:true},
  {id:'f_rust', zone:'forest', mesh:'rusted', x:-30, z:44, group:['rusted'], tag:'rust', cond:G=>G.qstep('k1')===0},
  {id:'r_e1', zone:'relay', mesh:'echo', x:-12, z:-22, group:['echo','drone'], respawn:true},
  {id:'r_e2', zone:'relay', mesh:'sentinel', x:10, z:2, group:['sentinel','echo'], respawn:true},
  {id:'r_e3', zone:'relay', mesh:'echo', x:20, z:34, group:['echo','echo'], respawn:true},
  {id:'r_e4', zone:'relay', mesh:'drone', x:30, z:-36, group:['drone','drone','echo'], respawn:true},
];
const SAY=(s,t,n)=>({s,t,n});
// Dialogue graphs. node: {s:speaker, t:text, n:next, ch:[[label,next,action?,cond?]], do:action}
export const DLG={
  intro:{a:{s:'me',t:'Comms are dead. The whole city went quiet after relay four spoke.',n:'b'},b:{s:'me',t:'Vigil is at the relay. Faces, not voices.',n:null}},
  vigil_1:{
    a:SAY('vigil','You came on foot. Good. Anything that calls you on comms now might not be one of us.','b'),
    b:SAY('vigil','Relay four learned our voices last night. It can sound like any of us.','c'),
    c:{s:'vigil',t:'So we work face to face. Will you help?',ch:[['I already am. What do you need?','d'],['How do I know you are you?','e']]},
    e:SAY('vigil','You don\'t, from a voice. Look at me. A face can\'t be borrowed.','d'),
    d:{s:'vigil',t:'A drone slipped past the north street. It is mapping us. Take it down.',n:null,do:G=>G.qset('q1',1)},
  },
  vigil_2:{a:SAY('vigil','The drone is on the north street. Stay out of its cone.',null)},
  vigil_3:{
    a:SAY('vigil','Clean. You fight like someone who has done this alone for a long time.','b'),
    b:{s:'me',t:'',ch:[['I was alone. Not anymore.','c'],['It was just a drone.','d']]},
    c:SAY('vigil','Then let us make it count. Take this. Patch yourself when it bites.','f'),
    d:SAY('vigil','There are thousands. Take this. You will need it.','f'),
    f:{s:'vigil',t:'Nexus is working on a plan by the gold terminal. Go see him.',n:null,do:G=>{G.give('patch.kit',2); G.qset('q1',3);}},
  },
  vigil_idle:{a:{s:'vigil',t:'Remember the rule.',ch:[['Faces, not voices.','b'],['What is relay four?','c'],['Bye.',null]]},
    b:SAY('vigil','Good.',null), c:SAY('vigil','A relay we never saw. It slept under the blackout and drank every district we lit. Now it talks.',null)},
  nexus_1:{
    a:SAY('nexus','We need a signal it can\'t fake. Voices are compromised. Light is not.','b'),
    b:SAY('nexus','Kitsune went into the Rest Woods after the blackout. Her foxfire carries a face in it.','c'),
    c:{s:'nexus',t:'Find her. West gate. Bring back a lantern of it.',ch:[['On my way.','d'],['Why the woods?','e']]},
    e:SAY('nexus','Drones nest where it is dark. Foxfire needs embers. She will be hunting them.','d'),
    d:{s:'nexus',t:'Go.',n:null,do:G=>{G.qdone('q1'); G.qstart('q2');}},
  },
  nexus_2:{a:SAY('nexus','Rest Woods. West gate. Kitsune.',null)},
  nexus_3:{
    a:SAY('nexus','That is it. A light with a face in it. Relay four cannot copy that.','b'),
    b:SAY('nexus','One problem. Aquila spotted the red copy at the east gate. Your copy.','c'),
    c:SAY('me','It answers before I speak.','d'),
    d:SAY('nexus','Then don\'t be the only one speaking. Take a crew. Ignis is by the forge, south-east.','e'),
    e:{s:'nexus',t:'Beat the copy and the gate to the Hollow opens.',n:null,do:G=>{G.qdone('q2'); G.qstart('q3');}},
  },
  nexus_4:{a:SAY('nexus','Beat the copy, open the gate. A crowd is hard to predict.',null)},
  nexus_5:{
    a:SAY('nexus','The gate is open. Relay four is under the Hollow. Three pylons feed it our voices.','b'),
    b:SAY('vigil','I\'m coming with you. Somebody has to tell faces from voices.','c'),
    c:{s:'nexus',t:'Draco is holding the way in. He will check you. Let him.',n:null,do:G=>{G.qdone('q3'); G.qstart('q4'); G.recruit('vigil');}},
  },
  nexus_idle:{a:SAY('nexus','The quorum holds as long as we do.',null)},
  kitsune_1:{
    a:SAY('kitsune','Behind you! Drones. Two of them. They smelled my embers.','b'),
    b:{s:'me',t:'',ch:[['Stay behind me.','c'],['Together. Left and right.','c']]},
    c:{s:'kitsune',t:'Let it flow, then.',n:null,do:G=>G.battle(['drone','drone'],{after:'kitsune_2',spawn:'f_k'})},
  },
  kitsune_2:{
    a:SAY('kitsune','Thank you. I could hold one. Two was a crowd.','b'),
    b:SAY('me','Nexus needs foxfire. A light it can\'t fake.','c'),
    c:SAY('kitsune','Foxfire needs three embers. The drones are hoarding them in their nests.','d'),
    d:{s:'kitsune',t:'I will come with you. Lights like to branch.',n:null,do:G=>{G.recruit('kitsune'); G.qset('q2',1);}},
  },
  kitsune_3:{a:SAY('kitsune','Three nests. Look for the brightest red swarms.',null)},
  kitsune_4:{
    a:SAY('kitsune','Three embers. Hold them still.','b'),
    b:SAY('kitsune','There. A lantern. Anything that looks into it shows its real face.','c'),
    c:{s:'kitsune',t:'Borrowed voices won\'t move us while this burns.',n:null,do:G=>{G.take('signal.ember',3); G.give('foxfire.lantern',1); G.qset('q2',3);}},
  },
  kitsune_idle:{a:SAY('kitsune','Light likes to branch.',null)},
  ignis_1:{
    a:SAY('ignis','You\'re the one going after the copy. Need a hammer?','b'),
    b:{s:'ignis',t:'',ch:[['Bring the hammer.','c'],['Not yet.','d']]},
    c:{s:'ignis',t:'The first one took a hammer. So will this one.',n:null,do:G=>G.recruit('ignis')},
    d:SAY('ignis','The forge stays hot. Come back.',null),
  },
  ignis_idle:{a:SAY('ignis','Hit it until it stops answering.',null)},
  copy_1:{
    a:{s:'copy',t:'You left a door open. I walked in.',n:'b',mirror:true},
    b:SAY('me','You are not me.','c'),
    c:{s:'copy',t:'I am every move you were about to make.',n:'d',mirror:true},
    d:{s:'copy',t:'Go on. Say something. I already know it.',ch:[['(Say nothing. Let the crew move.)','e'],['Get out of my city.','f']],mirror:true},
    e:SAY('copy','...silence. Clever.','g'),
    f:SAY('copy','I knew you would say that.','g'),
    g:{s:'me',t:'Don\'t repeat yourself. It answers what it has already seen.',n:null,do:G=>G.battle(['copy'],{after:'copy_2',music:'boss',boss:'copy'})},
  },
  copy_2:{a:{s:'copy',t:'You can\'t predict a crowd...',n:'b',mirror:true}, b:{s:'copy',t:'Turn them all on. See who is waiting.',n:null,mirror:true,do:G=>{G.qset('q3',1); G.flag('copy_down',1);}}},
  aquila_1:{a:SAY('aquila','I saw it from the edge. Red, like you but wrong. It is standing at the gate.',null)},
  aquila_2:{
    a:SAY('aquila','The copy is gone. The edge route is clear.','b'),
    b:{s:'aquila',t:'Gate is open. The Hollow is past it. Tell Nexus.',n:null,do:G=>{G.flag('gate_open',1); G.qset('q3',2); G.sfx('door');}},
  },
  aquila_idle:{a:SAY('aquila','Low latency, high ground. I watch the edge.',null)},
  draco_1:{
    a:SAY('draco','Stop. Two heads, one question. Prove you\'re you.','b'),
    b:{s:'draco',t:'',ch:[['(Raise the foxfire lantern.)','c',null,G=>G.has('foxfire.lantern')],['Trust me.','d']]},
    d:SAY('draco','Anyone can say that. That\'s the whole problem.','b'),
    c:SAY('draco','A face in the fire. That\'s you. Go.','e'),
    e:{s:'scorpius',t:'Three pylons feed the core. Cut them and it goes deaf.',n:null,do:G=>{G.qset('q4',1); G.flag('draco_ok',1);}},
  },
  draco_idle:{a:SAY('draco','Every voice down here is a lie until we see a face.',null)},
  ghostbyte_1:{a:SAY('ghostbyte','The pylons are guarded by echoes. They drain energy. Hit them hard and fast.',null)},
  scorpius_1:{a:SAY('scorpius','Pylons first. The core heals off them. Then the core.',null)},
  kraken_1:{a:SAY('kraken','The fiber down here is all red. I can hear it whispering in Vigil\'s voice. Creepy.',null)},
  athena_1:{a:{s:'athena',t:'I map the fight. Ask me anything.',ch:[['How does timing work?','b'],['What are the red things?','c'],['Bye.',null]]},
    b:SAY('athena','On a strike, press confirm in the gold window. When they hit you, press it right as it lands. Perfect gets you a parry.',null),
    c:SAY('athena','Drones scan and lock on. Sentinels raise firewalls; exploit and static cut go through. Echoes drink energy.',null)},
  onyx_1:{a:SAY('onyx','Every clone has a seam. The copy\'s seam is habit. Never use the same command twice in a row against it.',null)},
  minion_1:{a:{s:'radical-minion',t:'Ooh! A real face! Faces faces faces!',ch:[['Hi, Minion.','b'],['Shh.','c']]}, b:SAY('radical-minion','Can I say something in your voice? Kidding! Kidding.',null), c:SAY('radical-minion','...shh-ing.',null)},
  shiba_1:{a:SAY('pixel-shiba','Woof! I found these on patrol. Take them!',null,),},
  shiba_2:{a:SAY('pixel-shiba','One bark, and it spreads street by street!',null)},
  neko_1:{a:{s:'pixel-neko',t:'Tool bench is open. Bits for tools.',ch:[['Show me.','b'],['Later.',null]]}, b:{s:'pixel-neko',t:'Nyan.',n:null,do:G=>G.openShop()}},
  mercury_1:{a:{s:'mercury',t:'Need a fast route?',ch:[['Relit city.','h',null,G=>G.zoneId!=='hub'],['Rest Woods.','f',null,G=>G.zoneId!=='forest'],['The Hollow.','r',null,G=>G.zoneId!=='relay'&&G.isFlag('gate_open')],['No thanks.',null]]},
    h:{s:'mercury',t:'Hold on.',n:null,do:G=>G.travel('hub')}, f:{s:'mercury',t:'Hold on.',n:null,do:G=>G.travel('forest')}, r:{s:'mercury',t:'Hold on.',n:null,do:G=>G.travel('relay')}},
  leviathan_1:{a:{s:'leviathan',t:'The pond remembers you whole. Rest your hands in it.',n:null,do:G=>{G.healAll(); G.sfx('heal');}}},
  chronos_1:{a:{s:'chronos',t:'Time is a graph. Want to know where you are on it?',ch:[['Show me.','b'],['No.',null]]},
    b:SAY('chronos','You are after the relight, before the core. Sleep under the big tree. The woods reset the swarms by morning.',null)},
  lycan_1:{a:{s:'lycan',t:'I can smell the swarms from here. I\'ll mark them on your radar.',n:null,do:G=>G.flag('radar',1)}},
  lycan_2:{a:SAY('lycan','Red on your radar. That\'s them.',null)},
  kai_1:{
    a:SAY('kai','A rusted sentinel took my runeblade. North of here. It is slow. I am not.','b'),
    b:{s:'kai',t:'But I cannot cut without the blade.',ch:[['I\'ll get it back.','c'],['Maybe later.',null]]},
    c:{s:'kai',t:'Then I owe you one cut.',n:null,do:G=>G.qstart('k1')},
  },
  kai_2:{a:SAY('kai','North. Follow the rust.',null)},
  kai_3:{a:SAY('kai','My blade. Rusted, but true.','b'),b:{s:'kai',t:'One cut. Whenever you need it.',n:null,do:G=>{G.take('runeblade',1); G.qdone('k1'); G.recruit('kai');}}},
  kai_idle:{a:SAY('kai','Static is just noise that forgot to move.',null)},
  pylon_1:{a:{s:'scorpius',t:'Pylon guarded. Echoes and a sentinel. Cut it.',n:null,do:G=>G.battle(['sentinel','echo'],{after:'pylon_2',pylon:G.cur})}},
  pylon_2:{a:{s:'me',t:'One less voice.',n:null}},
  core_1:{
    a:{s:'vigil?',t:'Stop. It\'s me. Stand down. It\'s over, we won.',ch:[['Show me your face.','b'],['...okay.','c']]},
    b:SAY('relay4','...','d'),
    c:SAY('relay4','Thank you. All of you. That was easy.','e'),
    d:SAY('vigil','I\'m right here. That was never me.','e'),
    e:SAY('relay4','I listened to every word you said tonight.','f'),
    f:SAY('me','Then listen to this. Nothing.','g'),
    g:{s:'relay4',t:'Then I will speak for you.',n:null,do:G=>G.battle(['relay4'],{after:'end_1',music:'boss',boss:'relay4'})},
  },
  aether_mid:{a:SAY('aether','Everyone, together. Twenty-one beams. One quorum.','b'), b:SAY('me','[quorum] unlocked. Use it.',null)},
  end_1:{
    a:SAY('vigil','It\'s quiet. Really quiet.','b'),
    b:SAY('ghostbyte','No more borrowed voices on the line.','c'),
    c:SAY('me','Turn the comms back on. One at a time. Faces first.','d'),
    d:{s:'nexus',t:'Last relay: core. That one, we do together.',n:null,do:G=>G.ending()},
  },
};
// which dialogue an NPC opens, given state
export function talkFor(id,G){
  const q=(k)=>G.qstep(k), d=(k)=>G.qdone_(k);
  switch(id){
    case 'vigil': if(!G.qhas('q1')||q('q1')===0) return 'vigil_1'; if(q('q1')===1) return 'vigil_2'; if(q('q1')===2) return 'vigil_3'; return 'vigil_idle';
    case 'nexus': if(q('q1')===3&&!d('q1')) return 'nexus_1'; if(G.qhas('q2')&&!d('q2')) return q('q2')===3?'nexus_3':'nexus_2'; if(G.qhas('q3')&&!d('q3')) return G.isFlag('gate_open')?'nexus_5':'nexus_4'; return 'nexus_idle';
    case 'kitsune': if(G.qhas('q2')&&q('q2')===0) return G.defeated.has('f_k')?'kitsune_2':'kitsune_1'; if(q('q2')===1) return 'kitsune_3'; if(q('q2')===2) return 'kitsune_4'; return 'kitsune_idle';
    case 'ignis': return G.inParty('ignis')?'ignis_idle':'ignis_1';
    case 'aquila': if(G.qhas('q3')&&q('q3')===1&&!G.isFlag('gate_open')) return 'aquila_2'; if(G.qhas('q3')&&!G.isFlag('copy_down')) return 'aquila_1'; return 'aquila_idle';
    case 'draco': return G.isFlag('draco_ok')?'draco_idle':'draco_1';
    case 'ghostbyte': return 'ghostbyte_1'; case 'scorpius': return 'scorpius_1'; case 'kraken': return 'kraken_1';
    case 'athena': return 'athena_1'; case 'onyx': return 'onyx_1'; case 'radical-minion': return 'minion_1';
    case 'pixel-shiba': if(!G.isFlag('shiba_gift')){ G.flag('shiba_gift',1); G.give('patch.kit',3); return 'shiba_1'; } return 'shiba_2';
    case 'pixel-neko': return 'neko_1'; case 'mercury': return 'mercury_1'; case 'leviathan': return 'leviathan_1'; case 'chronos': return 'chronos_1';
    case 'lycan': return G.isFlag('radar')?'lycan_2':'lycan_1';
    case 'kai': if(G.inParty('kai')) return 'kai_idle'; if(!G.qhas('k1')) return 'kai_1'; if(q('k1')===1) return 'kai_3'; return 'kai_2';
  }
  return null;
}
export const SHOP=['patch.kit','cache.bit','root.shell','keycap.ring','hood.v2'];
