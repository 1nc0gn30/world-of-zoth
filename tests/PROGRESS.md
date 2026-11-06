# PROGRESS (v0.2 expansion): resume from here if interrupted
Project: /workspace/1nc0gn30/game/world-of-zoth (git repo: commit after each phase). Everything stays local.

## Done
- [x] v0.1 slice (3 zones, 4 quests). The full test passes (tests/full_result.json). Commit 1.
- [x] Android pipeline: android/ (manifest, MainActivity WebView, icon via tools/make_icons.py), tools/build_apk.sh → dist/world-of-zoth.apk. Builds and is signed with a self-signed debug key. Toolchain: ~/android/jdk, ~/android/sdk. No KVM on the box (the emulator would be unaccelerated).
- [x] Phase 1: STORY.md written (5 acts, 18 main missions, 6 bosses, cast arcs, twist).

- [x] Phase 2, content code written (commit 4):
  - src/zones2.js: fiber, clock, streets, foundry, caves, mirrors, deep, skyline, plus the secret rooftop.
  - src/content.js: data. src/quests.js: the engine.
  - battle.js extended. All zones render with 0 errors (tests/zones.mjs).
- [x] Phase 3, eggs code: src/eggs.js (terminal, Konami, Life, doom-fire, scope, achievements).

- [x] Commit 7467c6f: added tracks, the q3 "tell Nexus" step, the warp/fade fix, terminal touch chips, braille/lambda pixel glyphs, DESIGN v0.2 with egg spoilers, the play_v2 solver and the trailer script.
- [x] Android runtime check on the API 29 emulator (unaccelerated): the title screen and a new game run.
  - Fixes were needed: an es2019/chrome74 build target plus a FinalizationRegistry polyfill (tools/polyfill.js).
  - Screenshots are in screenshots/v2/android-*.png.
- [x] play_v2 reached q13 on its first long run, with bosses copy, RELAY 4 and SANDGLASS beaten. It got stuck on q13 because of the copy's NPC mark; that is now fixed.

## Next
- [ ] Get play_v2 green, q1 to q18 (log in /tmp/v2.log; results in tests/v2_result.json).
- [ ] Run tests/eggs.mjs (tag/minion reachability, terminal, Konami, rooftop, mini-games).
- [ ] Rebuild with tools/build.sh, then tools/build_apk.sh, then verify with aapt.
- [ ] Record the trailer: node tests/record_v2.mjs → dist/world-of-zoth-trailer-v0.2-1920x1080.mp4, plus screenshots/v2-*.png (move them to screenshots/v2/).

## Session 20:06
- [x] play_v2 was run in segments: q1→q13 on a fresh run (copy, RELAY 4 and SANDGLASS beaten), then --from=q13 (HUNTER beaten), then --from=q17 (26/26, 0 errors).
- [x] eggs.mjs: everything passes except the rooftop warp; a fix landed after that run (terminal Enter swallow), and it has not been re-run since.
- [x] Rebuilt the HTML, the zip and the APK (versionCode 3) at 20:06 and verified them with aapt.
- [x] Trailer: dist/world-of-zoth-trailer-v0.2-1920x1080.mp4 (88.6 s, h264+aac); 10 screenshots in screenshots/v2/ plus 2 from the Android emulator.

## v0.3 (Phase A)
- [x] Moves:
  - Jump (Space / A / touch ^) with a lattice landing ring.
  - Dissipate (C or V / pad X / touch ~): a braille-particle blink with i-frames and a 1.4 s cooldown. In battle it is a dodge, once per round, during the impact window.
  - Crouch (Ctrl).
  - Gates: zone.gates3 (hurdle / firewall / beam).
  - Gamepad: pollPad.
- [x] HUD (src/hud3.js):
  - Compass strip: N/E/S/W, mission, waypoint, checkpoints, portals.
  - Minimap: rotates with the player; shows explored buildings, fog and the waypoint.
  - Full map (M / pad Y / touch M): pan and zoom, fog of war (woz.fog), district list, and set/clear waypoint (woz.wp). G.hud3.sources is there for Phase B markers.
- [x] Intro cinematic (7 shots, about 72 s) and 5 act cutscenes (src/cine.js); tutorial with 9 steps plus 6 jump/dissipate caches (src/tut3.js); menu options to replay the intro and skip the tutorial; a 'new game (skip intro + tutorial)' title option.
- [x] Built v0.3: the HTML, the zip and the APK (versionCode 4, versionName 0.3; verified with aapt). play_v3 passes 15/15 with 0 errors. Capture: dist/world-of-zoth-v0.3-intro-tutorial-720p.mp4. Screenshots: screenshots/v3/.

## v0.3 Phase B
### 0. Phase A fixes (done)
- The intro wake shot (shot 5) now shows the hacker sitting up under the rest tree. play_v3 waits for shotI===5 && t>7.8 before taking `screenshots/v3/03-intro-wake.png`.
- Toasts are capped at 2 on screen; the rest wait in a queue. The compass is now 460x40 with labels at 2x scale. Text inputs no longer leak keys into the game.
- Reruns: play_v3 has every check passing; the zone check has 0 errors; the egg check has 0 console errors; play_v2 has been rerun (log /tmp/p2.log).
### 1. AI Labs: Null Academy (done)
- `src/labs.js`: the Null Academy terminal in the hub at (9,-9) has a teal map marker and is run by Athena and Ghostbyte. It holds 8 optional labs: prompting, hallucination, injection, jailbreak, leakage, agent misuse, deepfake/voice-clone (5 clips, needs 4/5 right) and a capstone CTF (unlocks after 5 labs).
- Each lab has a briefing, an attack step (pick an answer, or type one that keyword rules check), a defend step and a debrief card. The NPCs are scripted, with no LLM. Rewards are XP, a cosmetic (`woz.cos`) and an achievement per lab, plus "academy" for all 8. Progress is saved in `woz.labs`.
- Note: the `src/main.js` in this commit also wires the house and the forge (items 2 and 3), plus the 2-toast cap from item 0.
- Test: tests/play_v3b.mjs runs lab_prompt start to finish. It checks that a wrong pick is rejected, a vague typed prompt is rejected and a role + format prompt is accepted, then checks the debrief card and the save.
### 2. Player house (done)
- `src/house.js`: the safehouse door is in the hub at (-9,9) and has a marker. It opens once q1 is done (or with the house_open flag).
- Decorate mode: a top-down 3D view over a 14x10 grid. The catalog has 34 pieces, plus forged posters, up to 60 placed. Pieces can be rotated.
- Boss and egg trophies sit on the shelves. Recruited agents visit and idle in the house.
- The layout is saved in `woz.house`.
- Fixed: the screen fade stayed stuck when decorate opened during a zone transition.
- Test: place 8 pieces, save, reload the page; the layout is restored.
### 3. AI Forge + ZGL (done)
- `src/forge.js` + `src/zgl.js`: open with Settings (pause menu) > "ai forge" or the safehouse forge terminal.
  - Endpoint and model are editable, with xAI (default) and OpenAI presets.
  - The secret key field stays on the device; "forget key" removes it; a notice says calls go device → provider.
  - Includes 3 example prompts, a paste-ZGL option, and an offline ZGL paint editor (16x16, the sprite becomes a safehouse poster).
- Results become house decor, wall and tint changes, posters, or a cloak skin. The cloak skin is simplified: a sprite banner on the player's back plus trim-colour aura particles.
- Spec is in DESIGN.md under "ZGL".
- Test (mocked endpoint via page.route):
  - Valid ZGL is applied (sprite, decor, cloak, aura).
  - The rate limit blocks a fast second call.
  - A reply with `<script>`, "ignore all previous rules" and an out-of-range place is rejected with errors, and nothing is applied.
  - The key never shows up in the console, and forget key removes it.
  - An editor sprite parses and becomes a poster.
### 4. Build + test (done)
- Rebuilt game.js, world-of-zoth.html, dist/world-of-zoth.zip and dist/world-of-zoth.apk. aapt reports versionCode 5, versionName 0.3.1. The title screen now says v0.3.1.
- Fixed an old Android bug: the particle shader had a uniform and an attribute both called `color`, which the Chrome 74 WebView refused to compile ("program not valid"). The attribute is now `acol`, and the emulator shows 0 shader errors.
- Emulator smoke test (AVD zoth, Chrome 74 WebView):
  - The title screen renders and a tap on "new game" starts the intro cinematic.
  - After skipping the intro, the safehouse door shows its prompt, and pressing interact loads the safehouse.
  - The skip, the house_open flag and the interact key were sent over WebView devtools. Real taps on the touch A button were not registered by the emulator.
  - Screenshots are in screenshots/v3b/android/.
- tests/play_v3b.mjs: 22/22 pass, 0 console errors. tests/capture_v3b.mjs records the preview, which is at dist/world-of-zoth-v0.3.1-preview.mp4: 1280x720, 52.8 s, 6.4 MB.
- play_v2 regression: the final ending is reached, 0 errors.
- Known issues:
  - Long lab answer options are cut off at the panel edge (lab 03 "fence the input" option).
  - The forge cloak is a flat sprite banner, not a skinned cape.
  - Real provider calls were not exercised; only the mocked endpoint was tested.
