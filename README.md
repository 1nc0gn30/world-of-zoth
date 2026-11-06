# World of Zoth v0.2 (local build)

A 3D lattice RPG set in the 1nc0gn30 episode world. It has 5 acts, 18 main missions, 10 side missions, 11 zones and a secret one, levels up to 30, and 21 crew members (or 22).

## Play on desktop
Open `world-of-zoth.html` directly in Chrome, Edge, Firefox or Safari. It is a single file and uses no network or CDN.

**Controls**
| Action | Keys |
|---|---|
| Move | WASD / arrows |
| Run | Shift |
| Camera | mouse drag or Q/E-free orbit |
| Interact / confirm | E / Enter |
| Scan pulse | Space |
| Menu | Tab / Esc |
| Timed strike / block / parry in battle | Space |

## Play on Android
1. Copy `dist/world-of-zoth.apk` to the phone (USB, cloud drive or any file transfer).
2. Open it with the phone's file manager. Android asks you to allow "install unknown apps" for that file manager, so allow it once.
3. Tap Install. The app appears as **World of Zoth** with the gold Z icon.
4. If you have adb on a computer, you can run `adb install -r dist/world-of-zoth.apk` instead.

The app runs landscape and fullscreen, and works fully offline. It is self-signed with a debug key, so Play Protect may warn about an unknown developer. Saves are stored on the device.

On touch screens you get a stick on the left, buttons on the right and a run toggle. Large text is on by default and can be changed in Menu → system.

## Build
- `tools/build.sh` builds game.js, world-of-zoth.html and dist/world-of-zoth.zip. Add `--assets` to regenerate the sprites.
- `tools/build_apk.sh` builds dist/world-of-zoth.apk. It needs JDK 17 and Android SDK build-tools 34 under ~/android; no Gradle is required.

## Tests (headless Chrome, frame-stepped, real key input)
- `node tests/play_v2.mjs` plays the whole main chain, q1 to q18, with every boss, then save/load. It uses debug warps instead of long walks.
- `node tests/play_full.mjs` plays acts 1–2 entirely on foot.
- `node tests/zones.mjs` renders every zone.
- `node tests/record_v2.mjs` records the trailer.

## Docs
- `STORY.md`: the story.
- `DESIGN.md`: the design, including a spoiler section listing the Easter eggs.

This build has not been published, uploaded or posted anywhere.
