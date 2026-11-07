// Data-driven quest engine for missions 5-18 and the agent side missions (QDEF in content.js).
import { QDEF } from './content.js';
import { DLG, NPCS, SPAWNS, QUESTS, ITEMS, PARTY_BASE } from './data.js';
const TAG_ZONES=['hub','forest','relay','fiber','clock','streets','foundry','caves','deep'];
export function initQuests(G){
  const Q=G.Q={};
  const chain=(id,lines,last)=>{ const d={}; lines.forEach(([s,t],i)=>{ d[String.fromCharCode(97+i)]={s,t,n:i<lines.length-1?String.fromCharCode(98+i):null, mirror:s==='copy'&&false}; }); if(!lines.length) d.a={s:'me',t:'...',n:null}; DLG[id]=d; return id; };
  // dialogue graphs
  for(const [k,q] of Object.entries(QDEF)){
    if(q.offer) chain(`Q:${k}:offer`,q.offer);
    (q.steps||[]).forEach((s,i)=>{ if(s.lines) chain(`Q:${k}:${i}`,s.lines); });
    if(q.done&&q.done.lines&&q.done.lines.length) chain(`Q:${k}:done`,q.done.lines);
    // generated world spawns for collect steps
    (q.steps||[]).forEach((s,i)=>{ if(s.kind!=='collect') return; s.foes.forEach(([zone,mesh,x,z,group,boss],j)=>{ SPAWNS.push({id:`${k}_f${j}`, zone, mesh, x, z, group, cond:G=>G.qstep(k)===i&&!G.qdone_(k), qcollect:{k,i,item:s.item}, boss:!!boss}); }); });
  }
  // the quiet reflection (03ng0cn1) waits in the hall for mission 13
  NPCS.push({id:'copy', zone:'mirrors', x:0, z:0, red:true, dyn:true, cond:G=>G.qhas('q13')&&!G.qdone_('q13')});
  const cur=k=>{ const q=QDEF[k], st=G.quests[k]; if(!q||!st||st.done) return null; return q.steps[st.step]; };
  Q.def=k=>QDEF[k]; Q.cur=cur;
  Q.active=()=>Object.keys(G.quests).filter(k=>QDEF[k]&&!G.quests[k].done);
  // ---- start / advance / finish ----
  Q.start=k=>{ const q=QDEF[k]; if(G.qhas(k)) return; G.qstart(k); if(q.start){ if(q.start.flag) G.flag(q.start.flag); (q.start.items||[]).forEach(([it,n])=>G.give(it,n)); } Q.onZone(G.zoneId); G.rebuildFoes&&G.rebuildFoes(); };
  Q.advance=k=>{ const q=QDEF[k], st=G.quests[k]; if(!st||st.done) return; const s=q.steps[st.step];
    if(s){ if(s.flag) G.flag(s.flag); (s.items||[]).forEach(([it,n])=>G.give(it,n)); }
    st.step++; if(st.step>=q.steps.length){ st.step=q.steps.length-1; Q.finish(k); return; }
    G.toast('> '+G.stepText(k),'#ece4d2'); G.rebuildFoes&&G.rebuildFoes(); G.rebuildNPCs&&G.rebuildNPCs(); Q.onZone(G.zoneId); };
  Q.finish=k=>{ const q=QDEF[k]; const D=q.done||{}; const reward=()=>{ if(G.qdone_(k)) return; G.qdone(k);
      if(D.flag) G.flag(D.flag); (D.take||[]).forEach(([it,n])=>G.take(it,n)); (D.items||[]).forEach(([it,n])=>G.give(it,n));
      if(D.xp){ const ups=G.gainXP(G.active(),D.xp); G.toast(`+${D.xp} xp`,'#f5b82e'); ups.forEach(u=>G.toast(`${u.name} > level ${u.lvl}`+(u.learn?`  learned: ${u.learn}`:''),'#f5b82e')); }
      if(D.recruit) G.recruit(D.recruit); if(q.boss) G.ach('boss_'+q.boss); if(k==='q4') G.ach('boss_relay4');
      if(D.next){ const n=QDEF[D.next]; if(!n.giver) Q.start(D.next); }
      if(k==='q14'&&!G.qhas('s_copy')) Q.start('s_copy');
      if(k==='q17'&&!G.qhas('s_citadel')) Q.start('s_citadel');
      G.rebuildFoes&&G.rebuildFoes(); G.rebuildNPCs&&G.rebuildNPCs(); G.checkAch&&G.checkAch(); };
    if(DLG[`Q:${k}:done`]&&!G.isFlag('qd_'+k)){ G.flag('qd_'+k); if(G.mode==='battle'||G.B){ reward(); G.after=`Q:${k}:done`; } else G.dialog(`Q:${k}:done`,reward); } else reward(); };
  // ---- talk: returns true if the engine handled this NPC ----
  Q.talk=id=>{
    for(const k of Q.active()){ const s=cur(k); if(s&&s.kind==='talk'&&s.npc===id&&(!s.zone||s.zone===G.zoneId)){ const i=G.quests[k].step; if(DLG[`Q:${k}:${i}`]) G.dialog(`Q:${k}:${i}`,()=>Q.advance(k)); else Q.advance(k); return true; } }
    for(const [k,q] of Object.entries(QDEF)){ if(q.giver===id&&!G.qhas(k)&&q.avail&&q.avail(G)){ if(q.dlg){ G.dialog(q.dlg); return true; } G.dialog(`Q:${k}:offer`,()=>Q.start(k)); return true; } }
    return false; };
  // ---- world interactables for use / pickups / tags / mirror steps ----
  Q.interactables=()=>{ const L=[], z=G.zoneId;
    for(const k of Q.active()){ const s=cur(k); if(!s) continue; const i=G.quests[k].step;
      if(s.kind==='use'&&s.at[0]===z) L.push({x:s.at[1],z:s.at[2],r:s.at[3],label:s.label,col:s.boss?'#dc3228':'#f5b82e',act:()=>Q.use(k,i)});
      if(s.kind==='pickups') s.list.forEach(([pz,x,zz],j)=>{ if(pz===z&&!G.flags[`pk_${k}_${j}`]) L.push({x,z:zz,r:2.6,label:'catch  glitching minion',col:'#F43F5E',act:()=>{ G.flag(`pk_${k}_${j}`); G.sfx('loot'); G.toast(`minion ${s.list.filter((_,jj)=>G.flags[`pk_${k}_${jj}`]).length}/8`,'#F43F5E'); G.rebuildNPCs(); if(s.list.every((_,jj)=>G.flags[`pk_${k}_${jj}`])) Q.advance(k); }}); });
      if(s.kind==='mirror'&&z==='mirrors'){ const pil=G.Z.mirrors.objs.pil; pil.forEach(([x,zz],j)=>{ if(G.flags['mir_'+j]) return; const ix=x*.82, iz=zz*.82; L.push({x:ix,z:iz,r:2.6,label:'look into  the mirror',col:'#dc3228',act:()=>{ if(j===4){ G.dialog('mirror_true',()=>Q.advance(k)); } else { G.flag('mir_'+j); G.dialog('mirror_false',()=>G.battle(['reflection','reflection'],{lvl:G.zone.lvl})); } }}); }); }
    }
    // red copy tags (egg): one per district
    if(TAG_ZONES.includes(z)&&G.Z[z].tag&&!G.flags['tag_'+z]){ const [x,zz]=G.Z[z].tag; L.push({x,z:zz,r:2.4,label:'read  red tag',col:'#dc3228',act:()=>Q.tag(z)}); }
    return L; };
  Q.props=()=>{ const P=[], z=G.zoneId; for(const k of Q.active()){ const s=cur(k); if(s&&s.kind==='pickups') s.list.forEach(([pz,x,zz],j)=>{ if(pz===z&&!G.flags[`pk_${k}_${j}`]) P.push({id:'radical-minion',x,z:zz}); }); } return P; };
  Q.tag=z=>{ G.flag('tag_'+z); G.sfx('red'); G.glitch(.4); const n=TAG_ZONES.filter(t=>G.flags['tag_'+t]).length; G.toast(`> 03ng0cn1 was here  (${n}/9)`,'#dc3228');
    if(!G.qhas('s_tags')) Q.start('s_tags'); if(n>=9&&!G.qdone_('s_tags')) Q.finish('s_tags'); G.rebuildNPCs(); };
  Q.use=(k,i)=>{ const s=QDEF[k].steps[i]; const fight=()=>{ if(s.battle) G.battle(s.battle,{qk:k,qi:i,boss:s.boss,lvl:G.zone.lvl,music:s.boss?(s.battle[0]==='blank'?'final':'boss'):undefined}); else Q.advance(k); };
    if(DLG[`Q:${k}:${i}`]) G.dialog(`Q:${k}:${i}`,fight); else fight(); };
  // ---- events ----
  Q.onZone=z=>{ G.flag('seen_'+z); if(G.qdone_('q14')&&!G.qhas('s_copy')) Q.start('s_copy'); if(G.qdone_('q17')&&!G.qhas('s_citadel')) Q.start('s_citadel'); for(const k of Q.active()){ const s=cur(k); if(s&&s.kind==='visit'&&s.zone===z) Q.advance(k); } };
  Q.onWin=o=>{ if(o.qk){ const st=G.quests[o.qk]; if(st&&st.step===o.qi&&!st.done) Q.advance(o.qk); }
    const c=o.foe&&o.foe.s.qcollect; if(c){ const st=G.quests[c.k]; if(!st||st.done||st.step!==c.i) return; const s=QDEF[c.k].steps[c.i];
      if(s.item) G.give(s.item,1); const have=s.item?(G.inv[s.item]||0):s.foes.filter((_,j)=>G.defeated.has(`${c.k}_f${j}`)).length; if(have>=s.n) Q.advance(c.k); else G.toast('> '+G.stepText(c.k)); } };
  Q.onRest=()=>{ if(G.qhas('q18')&&!G.qdone_('q18')){ G.qdone('q18'); G.finalEnding(); return true; } return false; };
  // ---- HUD ----
  Q.stepText=k=>{ const s=cur(k), st=G.quests[k]; if(!s) return null; let t=s.t;
    if(s.kind==='collect') t+=`  (${s.item?(G.inv[s.item]||0):s.foes.filter((_,j)=>G.defeated.has(`${k}_f${j}`)).length}/${s.n})`;
    if(s.kind==='pickups') t+=`  (${s.list.filter((_,j)=>G.flags[`pk_${k}_${j}`]).length}/8)`;
    if(s.kind==='tags') t=t.replace('0/9',TAG_ZONES.filter(z=>G.flags['tag_'+z]).length+'/9');
    return t; };
  const npcAt=(id,zone)=>{ const n=NPCS.find(n=>n.id===id&&(!zone||n.zone===zone)&&(!n.cond||n.cond(G))); if(n&&n.dyn&&G.Z.mirrors){ const pl=G.Z.mirrors.objs.pil[4]; return [n.zone,pl[0]*.82,pl[1]*.82]; } return n&&[n.zone,n.x,n.z]; };
  Q.mark=k=>{ const s=cur(k); if(!s) return null;
    if(s.kind==='talk') return npcAt(s.npc,s.zone); if(s.kind==='use') return [s.at[0],s.at[1],s.at[2]]; if(s.kind==='visit') return [s.zone,G.Z[s.zone].spawn.x,G.Z[s.zone].spawn.z];
    if(s.kind==='collect'){ const j=s.foes.findIndex((_,j)=>!G.defeated.has(`${k}_f${j}`)); if(j>=0){ const f=s.foes[j]; return [f[0],f[2],f[3]]; } }
    if(s.kind==='pickups'){ const l=s.list.map((p,j)=>[p,j]).filter(([p,j])=>!G.flags[`pk_${k}_${j}`]); const here=l.find(([p])=>p[0]===G.zoneId)||l[0]; return here&&here[0]; }
    if(s.kind==='mirror') return ['mirrors',0,14]; if(s.kind==='rest') return ['forest',-20,20]; return null; };
  // pending main mission (available but not yet offered): point at the giver
  Q.pending=()=>{ for(const [k,q] of Object.entries(QDEF)){ if(q.main&&q.giver&&!G.qhas(k)&&q.avail(G)) return {k, text:`Talk to ${PARTY_BASE[q.giver]?PARTY_BASE[q.giver].name:q.giver}.`, mark:npcAt(q.giver)}; } return null; };
  Q.TAG_ZONES=TAG_ZONES;
  return Q;
}
