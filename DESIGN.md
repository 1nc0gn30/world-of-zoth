# WORLD OF ZOTH: design document (v0.2, full story build)

*A 1nc0gn30 story. Local build only. Nothing is uploaded or posted.*

## 0. What v0.2 adds (read this first)

The whole story is in STORY.md: five acts, 18 main missions and 6 bosses. Sections 1–12 below are the v0.1 slice design and still apply. This section lists what v0.2 adds on top.

### 0.1 Zones (11 plus 1 secret)
| # | Zone | Lv | Episode technique | Gate |
|---|---|---|---|---|
| 1 | Relit City (hub) | 1 | dot-matrix city, beacons | none |
| 2 | Rest Woods | 1 | lattice forest, fireflies, the rest tree | west of the hub |
| 3 | The Hollow (relay 4) | 1–5 | red voice pylons, the core | east of the hub (gate_open) |
| 4 | Fiber Tunnels | 9 | Hilbert curve; red lines turn gold as you reroute | north of the hub (q5) |
| 5 | Sand Clocktower | 11 | falling-sand wall; the clock stuck at 06:12 | south end of the tunnels |
| 6 | Collapse Streets | 14 | wave function collapse tile grid, 3 superposed cells | south of the hub (q9) |
| 7 | Doom-fire Foundry | 16 | doom-fire walls | south of the streets |
| 8 | Physarum Caves | 17 | slime-mould agents growing on a red floor | west of the woods (q11) |
| 9 | Hall of Mirrors | 19 | octagon of reflections; the copy | caves, west arch (mirror key) |
| 10 | Deep-water Memory | 22 | wave dot field, light shafts, boids, whale ribs | clocktower (q14) |
| 11 | Mode-7 Skyline | 26 | Mode-7 Voronoi city floor, 21 skybeams, the source tower | Hollow, east (q15) |
| ★ | The Rooftop (secret) | – | rising sun disc, laptop | hidden terminal `tomorrow 06:12` |

Enemies in a zone scale with its level: HP ×(1+.3k), ATK +2.1k, DEF +.8k, XP ×(1+.6k), where k = level−1. Bosses keep fixed stats.

### 0.2 Missions
- **Main (18):** q1–q4 (acts 1–2, the slice) and q5–q18 (acts 3–5). The engine is data-driven: `QDEF` in src/content.js and src/quests.js. Step kinds are talk, use, visit, collect, pickups, mirror, rest and tags.
- **Side (10):**
  - k1 rusted runeblade (Kai)
  - s_ghost unseen (Ghostbyte)
  - s_scorp zero day (Scorpius)
  - s_draco two heads (riddle)
  - s_merc special delivery (unlocks fast travel)
  - s_minion eight of me
  - s_shiba argon bone
  - s_neko connector parts
  - s_aquila edge watch
  - s_tags red tags
- **Bosses:**
  - 03ng0cn1 the copy (act 1; never repeat a command)
  - RELAY 4 "Chorus" (act 2; voice stacks; trust faces)
  - SANDGLASS (act 3; rewinds 8% HP; strip its charge)
  - THE HUNTER (act 4; GAZE is announced, then fires; the copy reflects it once if it has joined the crew)
  - `>_` (act 5): phase 2 at 50% (it listens and steals voices, and guarding silences it); at 30% the crew forms a quorum.
  - Mini-bosses: the rusted sentinel, 3 furnace wardens and the sentinel brood.

### 0.3 Crew and progression
- **Crew:** all 20 named agents can be recruited, 11 on the main path and 9 from side missions. The copy is the 22nd member (flag `copy_crew`). Each agent has its own skills, and most have a level-16 ultimate.
- **Levels:** capped at 30. nextXP = 9 + 24(L−1) + 5(L−1)². 1nc0gn30 learns overclock (8), ddos (11), rootkit (14), zero-day (18) and whoami (24).
- **Kernel modules (1nc0gn30's skill tree):** 1 point every 4 levels, across 3 branches of 3 nodes.
  - offense: overflow → race window → heap spray
  - defense: hardening → honeypot → airgap
  - tech: swap file → cron job → jit
- **Gear:** 14 items across 2 slots per agent (tool and shell). Pick them up from shops, bosses and quests, then equip one in Items with a confirm (it cycles through the crew).
- **Achievements:** 26 in total, saved in localStorage `woz.ach`.

### 0.4 Android
android/ holds a native WebView wrapper (no Gradle). `tools/build_apk.sh` takes world-of-zoth.html and produces dist/world-of-zoth.apk. The app runs landscape, fullscreen and offline, with a gold-on-black icon. Touch UI: a stick on the left, buttons on the right, a run toggle, and the large-text option (on by default on Android).

## 1. Pitch
**The city is lit again, but now it can talk.** EP14 ended with Relay 4 waking under the relit city, speaking in voices stitched together from the crew's own. Comms are cut, and the new rule is *trust faces, not voices*.

*World of Zoth* is a third-person RPG set in 3D lattice worlds, with the same look as the 1nc0gn30 episodes:
- **Worlds.** Gold wireframe streets, braille dot planes, ASCII and hex glyph rain in the sky, and dithered light.
- **Characters.** The pixel-art crew lives in those worlds as sprites.
- **What you do.** You play the hooded one. You walk the city, the woods and the corrupted Hollow, talk to the agents face to face, and recruit a crew of three. You fight the red system in turn-based battles where every command is a terminal verb (`> ping`, `> exploit`, `> sudo rm -rf`) and your timing matters.

The slice is one complete arc, about 35–60 minutes: *Faces, Not Voices → Foxfire → Mirror, Mirror → Chorus*.

## 2. World map
```
          [ REST WOODS ] ───west gate─── [ RELIT CITY (hub) ] ───east gate (sealed by the copy)─── [ THE HOLLOW ]
           forest from EP10                district grid, relay 1                                 red relay 4 / chorus core
           rest tree, pond, life clearing  plaza, terminal, tool bench                            3 voice pylons, the core
                                     Mercury fast-travels between any unlocked zone
```

| Zone | Size | Mood / music | Landmarks | Threats |
|---|---|---|---|---|
| **Relit City** (hub) | 104×112 | `hub` 110 BPM, D minor arps | Relay 1 (gold truss with 3 spinning braille rings), Game-of-Life plaza floor, save terminal, tool bench, a red ring pulsing under the plaza (Relay 4 below), lattice gates | tutorial drone, roaming drones/sentinel |
| **Rest Woods** (EP10 forest) | 104×104 heightfield | `forest` 84 BPM, crickets | the big rest tree (sleep pose), pond with ripple rings (Leviathan), Life clearing (Kitsune), fireflies, crescent moon | drone nests (embers), rusted sentinel (side quest), respawning swarms |
| **The Hollow** (corrupted) | 100×100, glitching terraces | `relay` 100 BPM, red drone | Relay 4: a red truss, a 900-point sphere and 4 tilted braille rings; red crack lines; floating voxel debris; points falling off "data cliffs" at the rim | echoes, sentinels, 3 voice pylons, RELAY 4 |

## 3. Characters (20 agents in the slice; the unnamed one is not used)
All of them use the **agents v2** sprite sheets (96×96 frames, idle/walk/work/ability/ultimate/meditate). The enemy-red remaps are applied when the sheets load: Ignis `#F97316`, Radical-Minion `#D946EF`, Draco `#F59E0B`. The hero uses the original sheets (walk/front/back/side) and the **kneel/sleep** poses.

| Agent | Where | In-game role |
|---|---|---|
| **1nc0gn30** (player) | — | `ping` (basic, timed), `patch` (heal), `exploit` (L2, 2.1×, ignores firewalls), `firewall` (L3, party halves damage), `trace` (L4, +50% damage taken, shows next move), `sudo rm -rf` (L5, hits every enemy), `quorum` (granted mid-boss) |
| **Kitsune** | woods, recruit (Q2) | `fan strike`, `foxfire` (hits all), `decoy` (enemies chase the fox for 2 turns). Crafts the **foxfire lantern** |
| **Ignis** | hub forge, recruit (Q3) | `hammer`, `anvil slam` (hits all, magma rings), `forge` (party +40% attack) |
| **Kai** | woods, recruit (side quest) | `slash`, `iaido` (2.6×, always crits), `static cut` (strips firewall/charge) |
| **Vigil** | hub plaza, quest giver, recruit (Q4) | `oculus`, `truth-beam` (1.5× vs voice enemies, strips voice stacks), `seraph` (heals the party) |
| **Aether** | boss guest | arrives at 50% boss HP and grants **quorum** (21 beams) |
| Nexus | hub | lead quest giver (Q1→Q4) |
| Athena | hub | tutor: explains timing and enemy types |
| Onyx | hub | bestiary hint: "the copy's seam is habit" |
| Pixel-Neko | hub | **tool bench shop** (patch.kit, cache.bit, root.shell, keycap ring, hood v2) |
| Mercury | hub, woods, Hollow | **fast travel** |
| Pixel-Shiba | hub | gift of 3 patch.kits |
| Radical-Minion | hub | comic relief: "Faces faces faces!" |
| Aquila | east gate | opens the gate after the copy falls |
| Leviathan | pond | full party heal |
| Chronos | woods | lore + hint about resting |
| Lycan | woods | marks enemies on the radar (radar range 30 → 45) |
| Draco | Hollow entry | identity check: only the lantern passes |
| Scorpius, GhostByte, Kraken | Hollow | pylon and echo tactics, flavour |

**Enemies** (all red, the hostile system only): drone (scan / lock-on → burst), sentinel (bash / slam / firewall), echo (red copy shade; siphons EN), rusted sentinel (side boss), **03ng0cn1, the red copy** (boss), voice node, **RELAY 4** (final boss).

## 4. Core loop
**Explore → talk → fight → loot/level → recruit → unlock the next zone.**
- Exploration is real-time third person. The camera can be orbited, and the gold objective beacon and radar always point to the next step. Your active crew follows you through the lattice.
- Pressing confirm with nothing nearby sends a lattice **scan pulse** that rolls across the grid and briefly shows enemies on the radar.
- Touching a red enemy starts a battle in place. The nearby props dissolve, a braille arena ring and lattice dome rise, and the camera swings to a side view.
- Rest under the big tree (or use the terminal) to heal and save. Sleeping uses the EP10 sleep pose with braille "z" glyphs, and roaming swarms come back by morning, so you can grind if you want.

## 5. Progression
- XP to the next level is `9 + 24(L−1) + 5(L−1)²` (so the tutorial fight levels you up). Each level gives +9 HP, +3 EN, +2 ATK and +1 DEF, with a partial heal and full EN.
- The player learns new skills at L2–L5. Recruits join at the player's level.
- Loot comes from drops (patch.kit, cache.bit), quest items (signal ember ×3, foxfire lantern, mirror shard, runeblade) and bits for the shop. Mods are passive while owned: keycap ring +3 ATK; hood v2 +2 DEF, +10 HP; mirror shard +2 SPD.
- The party holds up to 3 (the player plus 2). Swap members in the pause menu's party tab.
- Expected levels: L2 after the first fights, L3–4 at the copy, L5 (`sudo`) around the pylons, L5–6 at RELAY 4.

## 6. Combat rules
- **Turn-based by speed.** Each round, the enemies show their **intent in red** over their heads (`next: scan > Kitsune`). The order strip at the top shows who acts.
- **Commands:** skills (with EN costs), items, `guard` (half damage, +6 EN), and `disconnect` (60% escape, not allowed in boss fights). EN comes back +3 each round, and basic attacks give +4–5 EN.
- **Timed strikes:** basic attacks and `exploit` show a strike bar. Pressing in the gold window gives a **CRIT** (1.5×). The narrow centre gives a **PERFECT** (2×).
- **Timed blocks:** when an enemy aims at one ally, `[space] block` appears.
  - Pressing as the hit lands **blocks** it (half damage).
  - Pressing at the exact moment **parries** it: no damage, plus a counter.
  - Pressing too early locks you out, so mashing doesn't work.
- **Status effects:** firewall (−65% damage unless `exploit` or `static cut`), trace/mark (+50%), charge (next hit 2.2×), decoy, guard, attack buff, and confused (lose the next turn).
- **The red copy's mechanic (from EP13):** *it answers before you speak.*
  - If 1nc0gn30 uses the **same command twice in a row**, the copy reflects it back at him.
  - Its intent line shows `mirrors: <your last command>`.
  - Allies are never mirrored. *You can't predict a crowd.*
  - It also charges ("predict") and forks echoes.
- **RELAY 4 "Chorus" (from EP14/15):**
  - It gains a **voice stack** every round, and each stack adds 12% damage.
  - Its moves are `chorus` (hits all), `borrowed voice` (confuses an ally, unless you carry the **foxfire lantern**, which shows its face) and `listen` (+2 stacks).
  - At 70% and 30% HP it calls **voice nodes**, which heal it until they are cut.
  - At 50% HP **Aether** arrives and gives the player a one-shot **quorum**.
  - Vigil's `truth-beam` strips stacks.
- **Defeat** is never a game over. You wake under the rest tree with a full party and lose 25% of your bits.

## 7. Quests (slice)
| Quest | Steps | Canon tie-in |
|---|---|---|
| **Q1 faces, not voices** | Vigil → tutorial drone (north street) → Vigil (2 patch.kits) → Nexus | EP14's last line, "Trust faces, not voices." |
| **Q2 foxfire** | Rest Woods → save Kitsune from two drones (she joins) → 3 drone nests drop **signal embers** → Kitsune makes the **foxfire lantern** → Nexus | EP15 "Chorus" hook: light signals instead of voices |
| **Q3 mirror, mirror** | optional Ignis recruit → confront **03ng0cn1** at the east gate (its lines appear mirrored, then flip) → boss → Aquila opens the gate | EP13 "Mirror": the copy's tag is his name backwards |
| **Q4 chorus** | Vigil joins → Draco's identity check (lantern) → cut 3 voice pylons (sentinel + echo guards) → the core: a "Vigil?" voice with *no face* asks you to stand down. Choose "Show me your face." → **RELAY 4** → ending (`> last relay: core`, then the dot-matrix wordmark) | EP14 twist, relay 4 |
| *side: rusted runeblade* | Kai → rusted sentinel (north woods) → Kai joins | — |

## 8. Art direction: how the lattice look is made
- **Two-layer renderer.** The 3D world is drawn into a **480×270 half-float target**, the same native-resolution feel as the episodes. A post pass outputs **960×540**, which is CSS-scaled nearest-neighbour to the window (1920×1080 = 2× again).
  - The alpha channel stores the *material class*: 0 = sky, 0.5 = lattice world, 1 = pixel sprite.
- **Lattice materials** (`latMat`):
  - Additive gold lines and points with distance fog.
  - Twinkle for windows and fireflies.
  - Two shared world-space **pulse rings** for scans, zone entries and battles: a ring of light that rolls across every line.
  - Optional terrain **wobble** and **glitch** displacement, used in the Hollow.
  - Dark solid faces write depth so buildings occlude properly.
- **Post pass, per pixel:**
  - **Bayer 4×4 ordered dither.** Light intensity is quantised onto a 5-step ramp while keeping each pixel's hue. Gold stays gold, red stays red, and agent-colour FX keep their colour.
  - **Braille dot-matrix.** Dim levels (≤50%) are drawn only on a 2×2 dot lattice, so faint light reads as U+2800-style dots.
  - **Additive overflow becomes heat.** Light above 1.0 shifts to bone (`#ece4d2`), or to beam core `#ffe6c8` for red.
  - **Sky glyph rain.** Where nothing was drawn, columns of ASCII glyphs (`01/>_#*@%λ⣿⠿⠇⠋+=`) fall at random speeds. The Hollow switches to **hex** (`0-9a-f`) in red, the colour of the hostile system. There are also sparse braille star dots.
  - Scanlines every other native row at 82%, a vignette, row-band **glitch** shifts, full-frame **gold flashes** and fades.
- **"Life" layers:** a 64×64 Game of Life drives the plaza and clearing floors as glowing dot cells. There are L-system trees with leaf point clouds, ripple rings on the pond, drifting fireflies, point-cloud relay spheres, floating voxel debris and a falling point "data cliff".
- **Sprites:**
  - Camera-facing billboards with nearest sampling. The hero switches between back, front and side-walk sheets depending on the camera angle.
  - Sprites can flash white on hit, **pixel-dissolve** away, show a red "copy" tint, or turn grey when downed.
  - Moving sprites leave braille-dot trails that snap to a lattice as they fade (STYLE §5).
- **UI** uses the episodes' own 12 px pixel font, terminal grammar (`> cmd`, `[ok]`, block cursor), and the EP13/14 **subtitle box** with a speaker tag in the agent's colour and bone text. Beside it is a **speaker close-up panel** with a dither wash in their colour that pulses while they talk. Hostile speakers get a red "no face" static panel.
- **Title and ending:** dot-matrix wordmarks, built from the pixel font with one dot per pixel, typed in letter by letter with a glitch. The ending card types `1nc0gn30` in gold, like the episode end cards.
- **Palette** is strict STYLE.md: black `#060504`, gold `#f5b82e`, dim gold `#8a6514`, deep gold `#3c2c0a`, bone `#ece4d2`. Red `#dc3228` (with `#8c1e14`, `#460e0a`) is used only for enemies, the hostile relay and its voices.

## 9. Audio (all generated in the browser with WebAudio, no files)
- **Score:** a step sequencer in D minor, like the episode score. Instruments are square-wave arps (12.5/25/50% duty), a triangle bass, a detuned saw pad, noise hats, a sine kick and a noise snare.
- **Tracks:** title 96 BPM, hub 110, forest 84 (crickets), relay 100 (red square drone), battle 142, boss 152.
- **25+ SFX** are synthesised the same way: text blips, menu moves, hit, crit, block, heal, zap, glitch, encounter sting, level-up arpeggio, door, sleep lullaby, red drone.
- Every sound is a pure function of `(context, destination, time)`. The capture tool logs music and SFX events during a recorded playthrough and re-renders them offline in perfect sync.
- There is no voice acting, and the name is never voiced.

## 10. Controls
| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move / run | WASD or arrows / Shift | left-side virtual stick |
| Camera | drag mouse, Q / R, wheel zoom | drag |
| Talk, confirm, scan pulse | E, Space, Enter, F | A |
| Back | X, Backspace | B |
| Menu (quests, party, items, system) | Esc / Tab, plus J, P and I shortcuts | ☰ |
| Battle | ↑↓ choose, 1–6 shortcuts, ←→ target, Space in the gold window = crit, Space as a hit lands = block or parry | on-screen arrows, A/B, or tap a command or enemy |
| Settings | System tab: save, load, music, sfx, *timed strikes off (auto)* for accessibility, quit to title | |

## 11. Tech
- **Stack:** Three.js r187, bundled locally with esbuild into `game.js`, and inlined into **`world-of-zoth.html`** (a single file of about 3 MB with all sprites embedded as data URIs). Nothing loads from the network at runtime.
- **Code layout:**
  - `src/render.js`: the target, post shader and lattice materials.
  - `src/world.js` and `src/geo.js`: zones and lattice geometry.
  - `src/sprites.js`: billboards.
  - `src/battle.js`, `src/data.js`: battles and content.
  - `src/audio.js`, `src/ui.js`, `src/input.js`.
  - `src/main.js`: state, explore, dialogue, menus, save and load.
- **Saves:** stored in `localStorage` under `woz.save.v1` (zone, position, party, inventory, quests, flags, defeated spawns). You can save from the terminal, the rest tree, the pause menu, and automatically at the ending.
- **Test hooks:** `?capture=1` freezes the real-time loop so `WOZ.step(n)` advances in fixed 1/30 s steps. `WOZ.state()` returns the game state. Inputs are still real key events. `tests/play_full.mjs` plays the whole slice this way, and `--rec` records it.

## 11b. Test status (v0.1, 3 Nov 2026)
`tests/play_full.mjs` plays the whole slice with real key input: 24/24 steps pass, 0 console errors. It covers new game, talk, tutorial win, level up, Nexus quests, the woods, Kitsune, embers, sleep and save, the copy boss, the gate, Vigil, Draco, the 3 pylons, Relay 4, the ending, and reload → continue. The bot clears the main chain at level 6 in about 15 minutes of game time; a human should take about 35–60 minutes.

## 12. Roadmap to a full game
1. **EP15 "Chorus" chapter:**
   - Relay 4 learned to call agents in teammates' voices, so the next chapter is about **light-signal semaphore**. Players compose glyph signals to give party orders, and voice orders can be fake.
   - A "who is real" social-deduction mini-game in the hub.
2. **All 9 districts as zones**, each relit by its agent's EP14 technique and each turned into a puzzle:
   - Kraken: Hilbert-curve fiber routing.
   - Chronos: falling-sand hourglass.
   - Athena: Wave Function Collapse tiles.
   - Mercury: Fourier epicycle drawing.
   - Kitsune: L-system growth.
   - Shiba: BFS flood fill.
   - Kai: a one-cut timing puzzle.
   - Aether: a Mode-7 skybeam finale.
3. **Full roster:** all 20 recruitable, with formation slots, combo skills (Ignis forge + Kai iaido = "tempered cut") and ultimates using each agent's `ultimate` sprite row.
4. **Deeper systems:**
   - A mod/gear grid using the braille cell as an 8-slot inventory.
   - Skill trees per agent.
   - Elemental "protocol" weaknesses.
   - Stealth sections (GhostByte) with drone vision cones.
   - Day/night that Chronos can bend.
5. **Bosses from canon:** the firewall eye (EP03), the tower (EP04), the trap (EP07), the maker (EP17). Each gets a unique rule, the way the copy has *mirror*.
6. **Tech:**
   - Instanced lattice for bigger cities.
   - GPU particles.
   - Gamepad support.
   - A proper accessibility pass (font scale, colour-blind enemy outlines alongside the red, reduced glitch).
   - Cloud saves.
   - A 9×16 portrait mode for phones.
   - A localisation table.
7. **Content rules carry over:**
   - No URLs or plugs in game.
   - Red only for the hostile system.
   - The name is never voiced.
   - The unnamed one stays unnamed.


---
## SPOILERS: Easter eggs (v0.2)
1. **Konami code** (↑↑↓↓←→←→ B A, anywhere): +99 bits and 3 root shells. Doing it a second time gets "cheat detected. still no."
2. **Hidden terminal:** the dark `???` square in the hub, south-west of the plaza at (−14, −14). Commands are `help`, `ls -a`, `whoami` (dot wordmark), `crew`, `date` (> 06:12), `connect` (maze: ok / disconnect), `life`, `doom`, `trace 03ng0cn1`, `tomorrow 06:12`, `sudo` and `exit`. Touch screens get tap chips.
3. **`trace 03ng0cn1`:** prints "found you" in red. The copy's name is your name backwards.
4. **`tomorrow 06:12`:** warps you to **the Rooftop**, a secret zone with the EP14 sunrise and the laptop.
5. **06:12 for real:** sleeping under the rest tree when your clock reads 06:12 unlocks *early riser*. Sleeping 3 times unlocks *rest well*.
6. **Oscilloscope handshake:** at Vigil's lamp in the hub (once she has joined), tune your Lissajous curve to 3:2 to unlock *handshake: ok*.
7. **crew: 22:** after the confession (q13), type `crew` in the terminal. The final status screen also prints `crew: 22`.
8. **Nine red 03ng0cn1 tags:** one in each of 9 zones. Find them all for the red tag set (tool) and *district 9/9*.
9. **Eight glitching Minions:** one in each of 8 zones. Find them and Radical-Minion joins.
10. **Life mini-game:** the Life clearing in the Rest Woods, or `life` in the terminal. Run 100 generations for *conway*.
11. **Doom-fire:** stare into the foundry fire, or type `doom`. Keep it lit for 10 seconds.
12. **Pet Pixel-Shiba** after she joins (*good boy*).
13. **Title idle:** wait 61 seconds on the title screen and the copy whispers "found you".
14. **Sleeping pose:** every rest under the tree plays the EP06 sleep pose and the "> 06:12" wake toast.
15. **Mirror seam:** in the Hall of Mirrors, the true reflection is the one that waits for you to move.

## ZGL: Zoth Glyph Language v1 (AI Forge output format)
The AI Forge accepts only ZGL. `src/zgl.js` parses it with a strict whitelist. If any line fails, the whole reply is rejected, the errors are listed, and nothing is applied. The response is never eval'd, never inserted as HTML, and never used as a URL. Text is drawn only on the canvas or through `textContent`.

**Limits.** At most 4096 bytes, 80 lines, 64 characters per line (sprite rows excepted), 40 commands and 2 sprites. Allowed characters are `A-Z a-z 0-9 space . _ : # -`.

**Program format.** The first line must be exactly `ZGL 1`. A single ``` fence around the program is tolerated. Any prose before or after the program causes a rejection.

**Palette characters:**

| char | colour |
|---|---|
| `.` | transparent |
| `0` | black |
| `1` | deep gold |
| `2` | dim gold |
| `3` | gold |
| `4` | bright gold |
| `5` | bone |
| `a`-`h` | agent accents: violet, pink, orange, cyan, teal, blue, purple, green |

**Commands:**

| command | arguments |
|---|---|
| `SPRITE <name> <16x16\|24x32>` | then exactly H rows of W palette characters, then `END`. Name is `[a-z0-9_-]{1,16}`. |
| `place <catalogId\|poster:name> <x 0-13> <y 0-9> <0\|90\|180\|270>` | puts house decor on the grid |
| `tint <floor\|wall\|trim\|light> <palette char>` | |
| `wall <grid\|dots\|braille\|hex\|rain\|plain>` | |
| `cloak <none\|hood\|cape\|long\|short\|sprite:name>` | |
| `trim <palette char>` | |
| `aura <none\|embers\|braille\|rings\|rain>` | |

Example:
```
ZGL 1
SPRITE foxmask 16x16
...(16 rows)...
END
wall braille
place lamp 2 2 0
cloak sprite:foxmask
aura rings
```

**Forge security.** The key is held only in `localStorage['woz.ai.key']` on the device. A "forget key" button removes it, and the key is never logged. Calls go straight from the device to the configured OpenAI-compatible endpoint; the default is https://api.x.ai/v1 with `grok-3-mini`, and there is an OpenAI preset. The endpoint must be https (http is allowed only for localhost). Calls are rate-limited to 1 every 8 s and 12 per 10 min, with a 30 s timeout and the prompt capped at 400 characters. The system prompt (`ZGL_SYSTEM`) asks for ZGL only, but the parser, not the model, is the guardrail.
