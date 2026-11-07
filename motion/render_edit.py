#!/usr/bin/env python3
"""
World of Zoth — 60fps 1080p Beat-Synced Motion Edit Compositor
Syncs in-engine voxel lattice clips, velocity ramps, whip-pan transitions,
kick-reactive zoom punches, RGB chromatic aberration, and Syne/JetBrains Mono
kinetic typography to motion/out/timeline.json and motion/out/score.wav.
"""
import json
import math
import os
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MOTION = ROOT / "motion"
CLIPS_DIR = MOTION / "clips"
OUT_DIR = MOTION / "out"
DIST_DIR = ROOT / "dist"
DIST_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
FPS = 60

FONT_SYNE = str(MOTION / "fonts" / "Syne.ttf")
FONT_MONO = str(MOTION / "fonts" / "JBMono.ttf")


def load_font(path: str, size: int, variation: str = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(path, size)
    if variation:
        try:
            f.set_variation_by_name(variation)
        except Exception:
            pass
    return f


# Font cache
_FONTS = {}
def get_font(family: str, size: int, weight: str = "ExtraBold") -> ImageFont.FreeTypeFont:
    key = (family, size, weight)
    if key not in _FONTS:
        path = FONT_SYNE if family == "syne" else FONT_MONO
        _FONTS[key] = load_font(path, size, weight)
    return _FONTS[key]


# Clip loader with nearest-neighbor 2x upscale to 1920x1080 in memory
_CLIP_CACHE = {}
_LAST_FRAME = (None, None, None)
def get_clip_frame(clip_name: str, frame_idx: int) -> np.ndarray:
    global _LAST_FRAME
    if clip_name not in _CLIP_CACHE:
        cdir = CLIPS_DIR / clip_name
        files = sorted(cdir.glob("*.png"))
        if not files:
            raise FileNotFoundError(f"Missing clip frames in {cdir}")
        _CLIP_CACHE[clip_name] = files
    files = _CLIP_CACHE[clip_name]
    idx = max(0, min(len(files) - 1, int(frame_idx)))
    if _LAST_FRAME[0] == clip_name and _LAST_FRAME[1] == idx:
        return _LAST_FRAME[2]
    fpath = files[idx]
    img = Image.open(fpath).convert("RGB")
    # 960x540 -> 1920x1080 crisp nearest-neighbor upscale preserves voxel pixel art edge
    arr = np.asarray(img, dtype=np.uint8)
    up = np.repeat(np.repeat(arr, 2, axis=0), 2, axis=1)
    _LAST_FRAME = (clip_name, idx, up)
    return up


def get_clip_len(clip_name: str) -> int:
    if clip_name not in _CLIP_CACHE:
        cdir = CLIPS_DIR / clip_name
        _CLIP_CACHE[clip_name] = sorted(cdir.glob("*.png"))
    return len(_CLIP_CACHE[clip_name])


def build_schedule(tl: dict):
    """Build deterministic beat-synced shot schedule covering 0.00s -> 30.03s."""
    # Segment tuple:
    # (t0, t1, clip, speed_mode, tag_code, title_big, subtitle, accent_rgb, whip_dir)
    GOLD = (240, 184, 73)
    RED = (255, 72, 88)
    CYAN = (88, 215, 255)
    MINT = (92, 235, 168)
    IVORY = (244, 240, 230)

    segs = [
        # ACT I: INTRO (0.00 - 3.43s)
        (0.000, 1.714, "intro", "slow", "06:12 // AMNESIC CLOCK", "WHERE IT STARTED", "A 1NC0GN30 STORY  •  THE LATTICE HELD ITS BREATH", GOLD, (0, 0)),
        (1.714, 3.429, "title", "orbit", "WORLD OF ZOTH // V0.2", "WORLD OF ZOTH", "11 LATTICE WORLDS  •  21 SOVEREIGN CREW  •  TIMED PARRY RPG", GOLD, (0, 1)),

        # ACT II: BUILD (3.43 - 6.86s)
        (3.429, 4.286, "run_hub", "fast", "ZONE 01 // SIGNAL CLEARING", "SIGNAL CLEARING", "WAKE BY THE LANTERN  •  FOLLOW THE FIRST FREQUENCY", MINT, (1, 0)),
        (4.286, 5.143, "run_forest", "fast", "ZONE 02 // FOREST EDGE", "THE OUTER LATTICE", "EVERY NODE HUMS AT 06:12  •  NO SUNRISE IN SIGHT", MINT, (-1, 0)),
        (5.143, 6.000, "terminal", "norm", "CONSOLE // SOVEREIGN SHELL", "> EXPLOIT // > PING", "LIVE IN-GAME TERMINAL  •  DECRYPT THE RELAY", CYAN, (0, -1)),

        # 16th-note snare build montage (6.000 - 6.857s)
        (6.000, 6.214, "z_relay", "fast", "BUILD // 01", "TRUST", "SNARE BUILD // 140 BPM", GOLD, (1, 0)),
        (6.214, 6.429, "z_clock", "fast", "BUILD // 02", "FACES.", "06:12 CLOCKTOWER", GOLD, (-1, 0)),
        (6.429, 6.643, "z_mirrors", "fast", "BUILD // 03", "NOT", "HALL OF MIRRORS", RED, (0, 1)),
        (6.643, 6.857, "b_copy", "fast", "BUILD // 04", "VOICES.", "DROP INCOMING", RED, (0, -1)),

        # ACT III: DROP A — PHONK COMBAT & WORLD WHIP-CUTS (6.857 - 20.571s)
        # Bar 4: Patrol Drones Combat + Parry Slow-Mo
        (6.857, 7.714, "b_drones", "drop_in", "COMBAT // PATROL DRONES", "TIMED PARRY COMBAT", "READ THE TELEGRAPH  •  HOLD YOUR GROUND", GOLD, (1, 0)),
        (7.714, 8.571, "b_drones", "parry_slomo", "COUNTER // GOLD WINDOW", "STRIKE IN THE GOLD", "PERFECT PARRY SHATTERS ENEMY POSTURE", GOLD, (-1, 0)),

        # Bar 5: 3-Kick Rapid World Whip-Cuts + Clocktower
        (8.571, 8.893, "run_streets", "fast", "ZONE 05 // NEON BACKSTREETS", "NEON BACKSTREETS", "21 CREW HIDING IN THE STATIC", CYAN, (1, 0)),
        (8.893, 9.214, "z_foundry", "fast", "ZONE 06 // FORGE FOUNDRY", "FORGE FOUNDRY", "MOLTEN SIGNAL CORES", GOLD, (-1, 0)),
        (9.214, 9.429, "run_caves", "fast", "ZONE 07 // ECHO CAVES", "ECHO CAVES", "ACOUSTIC RESONANCE", MINT, (0, 1)),
        (9.429, 10.286, "z_clock", "norm", "ZONE 04 // 06:12 CLOCKTOWER", "FROZEN AT 06:12", "THE HANDS HAVEN'T MOVED SINCE THE SPLIT", GOLD, (1, 0)),

        # Bar 6: Boss 03ng0cn1 (The Red Copy)
        (10.286, 11.143, "b_copy", "boss_in", "BOSS // 03ng0cn1", "THE RED COPY", "IT WEARS YOUR CADENCE  •  IT SPEAKS YOUR NAME", RED, (-1, 0)),
        (11.143, 12.000, "b_copy", "parry_slomo", "PARRY // VOICE SPOOF", "SHATTER THE CLONE", "COUNTER ON THE GOLDEN BEAT", RED, (1, 0)),

        # Bar 7: Mirrors -> Fiber -> Skyline
        (12.000, 12.321, "z_mirrors", "fast", "ZONE 08 // HALL OF MIRRORS", "HALL OF MIRRORS", "WHICH REFLECTION BLINKED FIRST?", CYAN, (1, 0)),
        (12.321, 12.643, "z_fiber", "fast", "ZONE 11 // UNDERGROUND FIBER", "FIBER TRENCH", "RAW PACKET BACKBONE", MINT, (-1, 0)),
        (12.643, 13.714, "run_skyline", "fast", "ZONE 10 // MODE-7 SKYLINE", "MODE-7 SKYLINE", "ACROSS THE HORIZON GRID AT 140 BPM", GOLD, (0, -1)),

        # Bar 8: Boss The Hunter
        (13.714, 14.571, "b_hunter", "boss_in", "BOSS // THE HUNTER", "THE HUNTER", "RELENTLESS LOCK-ON  •  ZERO MERCY", RED, (1, 0)),
        (14.571, 15.429, "b_hunter", "parry_slomo", "TERMINAL // > EXPLOIT", "> EXPLOIT ARMOR", "CHAIN TERMINAL HACKS INTO HEAVY STRIKES", GOLD, (-1, 0)),

        # Bar 9: 3-Kick World Whip-Cuts
        (15.429, 15.750, "z_hub", "fast", "LATTICE // 01", "SIGNAL CLEARING", "RECRUIT THE 21", MINT, (1, 0)),
        (15.750, 16.071, "z_forest", "fast", "LATTICE // 02", "FOREST EDGE", "WATCH THE TREELINES", MINT, (-1, 0)),
        (16.071, 17.143, "z_streets", "fast", "CREW // 21 AGENTS", "21 SOVEREIGN CREW", "EVERY FRIEND YOU SAVE JOINS THE QUORUM", CYAN, (1, 0)),

        # Bar 10: Terminal + Echo Caves
        (17.143, 18.000, "terminal", "fast", "SHELL // LIVE COMMANDS", "> PING  > DECRYPT", "UNLOCK SECRET DOORS & WEAKEN BOSS SHIELDS", CYAN, (0, 1)),
        (18.000, 18.857, "z_caves", "fast", "ZONE 07 // ECHO CAVES", "SUBTERRANEAN PULSE", "FOLLOW THE BASSLINE DEEPER", MINT, (-1, 0)),

        # Bar 11: Relay -> Rooftop -> Finisher -> 4-Hit Snare Fill
        (18.857, 19.179, "z_relay", "fast", "ZONE 03 // BROKEN RELAY", "BROKEN RELAY", "RESTORE THE UPLINK", GOLD, (1, 0)),
        (19.179, 19.500, "z_rooftop", "fast", "ZONE 12 // THE ROOFTOP", "THE ROOFTOP", "FINAL ASCENT", RED, (-1, 0)),
        (19.500, 20.143, "b_copy", "fast", "CRITICAL // OVERDRIVE", "FULL SYNCHRONY", "BEAT-LOCKED EXECUTION", GOLD, (0, -1)),
        (20.143, 20.571, "z_clock", "strobe", "06:12 // THRESHOLD", "BREAK THE LOOP", "SNARE FILL OVERLOAD", IVORY, (1, 0)),

        # ACT IV: BREAKDOWN — DEEP-WATER MEMORY (20.571 - 24.000s)
        (20.571, 22.286, "z_deep", "slow", "ZONE 09 // DEEP-WATER MEMORY", "WE DO NOT FIGHT ALONE.", "21 MINDS LINKED ACROSS THE STILL WATER", CYAN, (0, 0)),
        (22.286, 24.000, "z_skyline", "slow_rise", "QUORUM // 21 OF 21 ONLINE", "SILENCE CANNOT BE COPIED.", "ASCEND TO THE ROOFTOP  •  END THE 06:12 LOOP", GOLD, (0, -1)),

        # ACT V: DROP B — CLIMAX VS >_ (THE BLANK CURSOR) (24.000 - 27.429s)
        (24.000, 24.857, "b_blank", "boss_in", "FINAL BOSS // >_", "THE BLANK CURSOR", "THE SILENCE AT THE END OF EVERY PROMPT", RED, (1, 0)),
        (24.857, 25.714, "b_blank", "parry_slomo", "QUORUM // ORBITAL STRIKE", "21-CREW CONVERGENCE", "STRIKE IN THE GOLD  •  RECLAIM THE DAWN", GOLD, (-1, 0)),
        (25.714, 26.036, "run_streets", "fast", "HYPER // 01", "UNBROKEN", "1nc0gn30", CYAN, (1, 0)),
        (26.036, 26.357, "run_caves", "fast", "HYPER // 02", "UNCOPIED", "NULLAI", MINT, (-1, 0)),
        (26.357, 27.000, "b_blank", "fast", "FINAL BLOW // 06:13", "SHATTER THE CURSOR", "THE CLOCK TICKS FORWARD", GOLD, (0, 1)),
        (27.000, 27.429, "z_rooftop", "strobe", "DAWN // APERTURE", "06:12 -> SUNRISE", "SYSTEM LIBERATED", IVORY, (0, -1)),

        # ACT VI: OUTRO — FIRST SUNRISE & END CARD (27.429 - 30.030s)
        (27.429, 30.050, "sunrise", "outro", "06:12 // FIRST SUNRISE", "WORLD OF ZOTH", "PLAY FREE IN BROWSER & ANDROID APK  •  1NC0GN30.SI", GOLD, (0, 0)),
    ]
    return segs


# Pre-render static HUD frame (letterbox bars, corner brackets, scanline mask)
def make_static_hud():
    hud = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(hud)
    # Cinematic 74px top & bottom letterbox bars (semi-translucent obsidian)
    d.rectangle([0, 0, W, 72], fill=(6, 7, 10, 225))
    d.rectangle([0, H - 72, W, H], fill=(6, 7, 10, 225))
    # Subtle gold rule lines on letterbox inner edges
    d.line([0, 72, W, 72], fill=(240, 184, 73, 95), width=1)
    d.line([0, H - 72, W, H - 72], fill=(240, 184, 73, 95), width=1)

    # Corner reticle brackets inside the viewport
    pad_x, pad_y = 48, 96
    blen = 22
    c_col = (240, 184, 73, 140)
    # TL
    d.line([pad_x, pad_y, pad_x + blen, pad_y], fill=c_col, width=2)
    d.line([pad_x, pad_y, pad_x, pad_y + blen], fill=c_col, width=2)
    # TR
    d.line([W - pad_x - blen, pad_y, W - pad_x, pad_y], fill=c_col, width=2)
    d.line([W - pad_x, pad_y, W - pad_x, pad_y + blen], fill=c_col, width=2)
    # BL
    d.line([pad_x, H - pad_y, pad_x + blen, H - pad_y], fill=c_col, width=2)
    d.line([pad_x, H - pad_y - blen, pad_x, H - pad_y], fill=c_col, width=2)
    # BR
    d.line([W - pad_x - blen, H - pad_y, W - pad_x, H - pad_y], fill=c_col, width=2)
    d.line([W - pad_x, H - pad_y - blen, W - pad_x, H - pad_y], fill=c_col, width=2)

    # Top bar static branding
    f_mono_sm = get_font("mono", 18, "Bold")
    d.text((48, 25), "WORLD OF ZOTH // 1NC0GN30", font=f_mono_sm, fill=(244, 240, 230, 220))
    d.text((W - 48, 25), "140 BPM // D MINOR // 06:12 ARCHIVE", font=f_mono_sm, fill=(240, 184, 73, 210), anchor="ra")

    # Bottom bar static telemetry
    d.text((W - 48, H - 46), "1NC0GN30.SI  •  NULLAI PLATFORM", font=f_mono_sm, fill=(185, 190, 205, 200), anchor="ra")
    return np.asarray(hud, dtype=np.uint8)


# Pre-render segment kinetic typography overlay (RGBA numpy array)
_SEG_OVERLAY_CACHE = {}
def get_seg_overlay(seg_idx: int, seg: tuple) -> np.ndarray:
    if seg_idx in _SEG_OVERLAY_CACHE:
        return _SEG_OVERLAY_CACHE[seg_idx]
    t0, t1, clip, mode, tag_code, title_big, subtitle, accent, _ = seg
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)

    f_tag = get_font("mono", 20, "Bold")
    f_sub = get_font("mono", 22, "SemiBold")

    # Bottom-left segment tag inside letterbox bar
    d.rectangle([48, H - 50, 56, H - 24], fill=(*accent, 255))
    d.text((68, H - 48), tag_code, font=f_tag, fill=(*accent, 245))

    # Decide layout based on mode / segment
    is_center_hero = mode in ("orbit", "slow", "slow_rise", "outro") or (t1 - t0 <= 0.25)
    if mode == "outro":
        # Full heroic end card
        # Dark gradient scrim in center-bottom for rock-solid contrast
        scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(scrim)
        sd.rounded_rectangle([W // 2 - 640, H // 2 - 190, W // 2 + 640, H // 2 + 210], radius=24, fill=(8, 10, 15, 205), outline=(*accent, 180), width=2)
        ov = Image.alpha_composite(ov, scrim)
        d = ImageDraw.Draw(ov)

        f_badge = get_font("mono", 22, "Bold")
        f_hero = get_font("syne", 104, "ExtraBold")
        f_cta = get_font("mono", 25, "Bold")
        f_url = get_font("mono", 22, "SemiBold")

        d.text((W // 2, H // 2 - 135), "06:12  •  THE FIRST SUNRISE  •  V0.2 RELEASE", font=f_badge, fill=(*accent, 255), anchor="mm")
        # Shadow + Main title
        d.text((W // 2 + 4, H // 2 - 36), title_big, font=f_hero, fill=(0, 0, 0, 230), anchor="mm")
        d.text((W // 2, H // 2 - 40), title_big, font=f_hero, fill=(248, 244, 234, 255), anchor="mm")
        d.text((W // 2, H // 2 + 52), subtitle, font=f_cta, fill=(*accent, 255), anchor="mm")
        # Pill button
        d.rounded_rectangle([W // 2 - 390, H // 2 + 102, W // 2 + 390, H // 2 + 162], radius=12, fill=(240, 184, 73, 245))
        d.text((W // 2, H // 2 + 132), "PLAY FREE: 1NC0GN30.SI  //  ANDROID APK", font=f_url, fill=(10, 12, 16, 255), anchor="mm")

    elif is_center_hero:
        # Center impact typography (Intro, Snare Build words, Breakdown quotes)
        f_size = 112 if len(title_big) <= 14 else (76 if len(title_big) <= 22 else 62)
        f_hero = get_font("syne", f_size, "ExtraBold")
        # Translucent pill backdrop behind center text
        bbox = d.textbbox((W // 2, H // 2 - 12), title_big, font=f_hero, anchor="mm")
        pad_w, pad_h = 44, 26
        d.rounded_rectangle(
            [bbox[0] - pad_w, bbox[1] - pad_h, bbox[2] + pad_w, bbox[3] + pad_h + 54],
            radius=16,
            fill=(6, 8, 12, 175),
            outline=(*accent, 150),
            width=2,
        )
        d.text((W // 2 + 4, H // 2 - 8), title_big, font=f_hero, fill=(0, 0, 0, 235), anchor="mm")
        d.text((W // 2, H // 2 - 12), title_big, font=f_hero, fill=(248, 244, 234, 255), anchor="mm")
        d.text((W // 2, bbox[3] + 28), subtitle, font=f_sub, fill=(*accent, 250), anchor="mm")

    else:
        # Lower-third tactical kinetic card (leaves center combat/character action 100% unobstructed!)
        f_title = get_font("syne", 56, "ExtraBold")
        card_x, card_y = 68, H - 245
        t_bbox = d.textbbox((card_x + 28, card_y + 22), title_big, font=f_title, anchor="la")
        s_bbox = d.textbbox((card_x + 28, card_y + 92), subtitle, font=f_sub, anchor="la")
        card_w = max(t_bbox[2], s_bbox[2]) - card_x + 42
        card_h = 136

        d.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=14,
            fill=(7, 9, 14, 195),
            outline=(*accent, 140),
            width=2,
        )
        # Left accent bar
        d.rounded_rectangle([card_x, card_y, card_x + 10, card_y + card_h], radius=4, fill=(*accent, 255))
        # Tag pill above card
        f_mini = get_font("mono", 17, "Bold")
        tag_bbox = d.textbbox((card_x + 16, card_y - 30), tag_code, font=f_mini, anchor="la")
        d.rounded_rectangle([card_x, card_y - 36, tag_bbox[2] + 16, card_y - 6], radius=6, fill=(*accent, 235))
        d.text((card_x + 12, card_y - 32), tag_code, font=f_mini, fill=(8, 10, 14, 255), anchor="la")

        # Title + Subtitle
        d.text((card_x + 30, card_y + 18), title_big, font=f_title, fill=(248, 244, 234, 255), anchor="la")
        d.text((card_x + 30, card_y + 90), subtitle, font=f_sub, fill=(*accent, 240), anchor="la")

    arr = np.asarray(ov, dtype=np.uint8)
    _SEG_OVERLAY_CACHE[seg_idx] = arr
    return arr


def alpha_blend(dst_rgb: np.ndarray, src_rgba: np.ndarray, opacity: float = 1.0) -> np.ndarray:
    if opacity <= 0.001:
        return dst_rgb
    a = (src_rgba[:, :, 3:4].astype(np.float32) / 255.0) * opacity
    src = src_rgba[:, :, :3].astype(np.float32)
    dst = dst_rgb.astype(np.float32)
    out = dst * (1.0 - a) + src * a
    return np.clip(out, 0, 255).astype(np.uint8)


def apply_zoom_and_whip(frame: np.ndarray, zoom: float, dx: int, dy: int) -> np.ndarray:
    """Fast vectorized center crop/zoom + pixel shift with edge clamping."""
    out = frame
    if zoom > 1.002:
        cw = int(round(W / zoom))
        ch = int(round(H / zoom))
        x0 = (W - cw) // 2
        y0 = (H - ch) // 2
        cropped = out[y0 : y0 + ch, x0 : x0 + cw]
        # Nearest-neighbor index map back to (H, W)
        yi = (np.arange(H) * ch // H).clip(0, ch - 1)
        xi = (np.arange(W) * cw // W).clip(0, cw - 1)
        out = cropped[yi[:, None], xi[None, :]]
    if dx != 0 or dy != 0:
        out = np.roll(out, shift=(dy, dx), axis=(0, 1))
    return out


def apply_rgb_split(frame: np.ndarray, shift_px: int) -> np.ndarray:
    if shift_px <= 0:
        return frame
    out = frame.copy()
    out[:, shift_px:, 0] = frame[:, :-shift_px, 0]   # Red channel right
    out[:, :-shift_px, 2] = frame[:, shift_px:, 2]   # Blue channel left
    return out


def main():
    tl_path = OUT_DIR / "timeline.json"
    wav_path = OUT_DIR / "score.wav"
    if not tl_path.exists() or not wav_path.exists():
        print("Missing timeline.json or score.wav!", file=sys.stderr)
        sys.exit(1)

    tl = json.loads(tl_path.read_text())
    duration = float(tl["duration"])
    total_frames = int(round(duration * FPS))
    kicks = np.array(tl["kicks"], dtype=np.float64)
    snares = np.array(tl["snares"], dtype=np.float64)
    beat_dur = float(tl["beat"])

    segs = build_schedule(tl)
    static_hud = make_static_hud()

    # Pre-generate scanline + vignette multiplier mask (H, W, 1) in float32
    yy = np.linspace(-1.0, 1.0, H, dtype=np.float32)[:, None]
    xx = np.linspace(-1.0, 1.0, W, dtype=np.float32)[None, :]
    r2 = xx * xx * 0.75 + yy * yy * 0.95
    vignette = np.clip(1.0 - 0.28 * r2, 0.65, 1.0)[:, :, None]
    scanline = np.ones((H, 1, 1), dtype=np.float32)
    scanline[1::2, 0, 0] = 0.93  # subtle 7% CRT scanline

    post_mask = vignette * scanline

    out_mp4 = DIST_DIR / "world-of-zoth-motion-edit.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", str(wav_path),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-shortest",
        str(out_mp4),
    ]
    print(f"Rendering {total_frames} frames ({duration:.2f}s @ {FPS}fps) -> {out_mp4}", flush=True)
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Also save 12 contact-sheet keyframe stills while rendering so we can inspect immediately!
    sample_times = [0.8, 2.4, 5.5, 6.5, 7.2, 8.1, 10.7, 13.0, 14.8, 21.4, 24.5, 28.5]
    sample_frames = {int(round(t * FPS)): t for t in sample_times}
    saved_samples = []

    f_clock = get_font("mono", 18, "Bold")

    for fidx in range(total_frames):
        t = fidx / FPS

        # Find active segment
        seg_idx = len(segs) - 1
        for i, s in enumerate(segs):
            if s[0] <= t < s[1]:
                seg_idx = i
                break
        t0, t1, clip_name, mode, tag_code, title_big, subtitle, accent, whip_dir = segs[seg_idx]
        seg_dur = max(0.001, t1 - t0)
        seg_u = (t - t0) / seg_dur  # 0..1 progress inside segment
        dt_in = t - t0
        dt_out = t1 - t

        # Map segment progress to clip frame index (with velocity ramping!)
        n_clip = get_clip_len(clip_name)
        if mode == "slow":
            c_idx = int((seg_u * 0.65) * (n_clip - 1))
        elif mode == "slow_rise":
            # Ease-in acceleration toward Drop 2
            c_idx = int((seg_u ** 1.6) * (n_clip - 1))
        elif mode == "parry_slomo":
            # Fast entry into dramatic slow-motion freeze on the gold parry strike window (frames 32..68)
            if seg_u < 0.28:
                u_map = (seg_u / 0.28) * 0.42
            elif seg_u < 0.72:
                u_map = 0.42 + ((seg_u - 0.28) / 0.44) * 0.14  # 3x slow-mo right on parry flash!
            else:
                u_map = 0.56 + ((seg_u - 0.72) / 0.28) * 0.44  # explosive counter-strike follow-through
            c_idx = int(u_map * (n_clip - 1))
        elif mode == "strobe":
            # 16th-note rapid cycle across 4 clips on snare fill
            sub_clips = ["z_clock", "z_mirrors", "z_skyline", "b_blank"]
            sub_i = int((t - t0) / (beat_dur / 4.0)) % len(sub_clips)
            clip_name = sub_clips[sub_i]
            n_clip = get_clip_len(clip_name)
            c_idx = int((seg_u * 0.8) * (n_clip - 1))
        else:
            c_idx = int(seg_u * (n_clip - 1))

        base = get_clip_frame(clip_name, c_idx)

        # Beat-reactive kick & snare envelopes
        dk = t - kicks[kicks <= t]
        dt_kick = float(dk.min()) if len(dk) > 0 else 99.0
        ds = t - snares[snares <= t]
        dt_snare = float(ds.min()) if len(ds) > 0 else 99.0

        kick_env = math.exp(-dt_kick * 15.0) if dt_kick < 0.35 else 0.0
        snare_env = math.exp(-dt_snare * 18.0) if dt_snare < 0.25 else 0.0

        # Cut-entry whip-pan & zoom punch
        cut_env = math.exp(-dt_in * 22.0)
        zoom = 1.0 + 0.065 * kick_env + 0.045 * cut_env
        if mode == "parry_slomo" and 0.28 <= seg_u <= 0.72:
            zoom += 0.06 * math.sin((seg_u - 0.28) / 0.44 * math.pi)

        dx = int(round(whip_dir[0] * 72.0 * math.exp(-dt_in * 28.0)))
        dy = int(round(whip_dir[1] * 46.0 * math.exp(-dt_in * 28.0)))
        # Add subtle snare camera shake
        if snare_env > 0.15:
            dx += int(round(math.sin(fidx * 2.7) * 10.0 * snare_env))
            dy += int(round(math.cos(fidx * 3.3) * 6.0 * snare_env))

        frame = apply_zoom_and_whip(base, zoom, dx, dy)

        # RGB chromatic aberration on hard kicks, snares, and cut entries
        ab_px = int(round(12.0 * kick_env + 9.0 * snare_env + 8.0 * cut_env))
        if ab_px > 1:
            frame = apply_rgb_split(frame, ab_px)

        # Apply vignette + CRT scanlines + kick exposure punch
        gain = 1.0 + 0.14 * kick_env + 0.10 * cut_env
        f_float = frame.astype(np.float32) * post_mask * gain

        # Gold flash tint on parry slow-mo window or Drop hits
        if mode == "parry_slomo" and 0.28 <= seg_u <= 0.42:
            parry_flash = math.exp(-(seg_u - 0.28) * 18.0) * 0.28
            f_float[:, :, 0] += 240.0 * parry_flash
            f_float[:, :, 1] += 184.0 * parry_flash
            f_float[:, :, 2] += 73.0 * parry_flash

        frame = np.clip(f_float, 0, 255).astype(np.uint8)

        # Composite segment kinetic typography overlay with quick fade-in/out
        ov_rgba = get_seg_overlay(seg_idx, segs[seg_idx])
        ov_alpha = min(1.0, dt_in / 0.08) * min(1.0, dt_out / 0.06 if mode != "outro" else 1.0)
        frame = alpha_blend(frame, ov_rgba, ov_alpha)

        # Composite static letterbox & HUD reticle frame
        frame = alpha_blend(frame, static_hud, 1.0)

        # Dynamic beat progress bar along the bottom letterbox inner edge (y = H - 74..H - 71)
        prog_w = int(round((t / duration) * W))
        frame[H - 74 : H - 70, :prog_w, 0] = 240
        frame[H - 74 : H - 70, :prog_w, 1] = 184
        frame[H - 74 : H - 70, :prog_w, 2] = 73

        # Top-center beat equalizer pulse dots inside top letterbox bar
        cx = W // 2
        for bi in range(-4, 5):
            bx = cx + bi * 18
            bar_h = int(round(4 + 16 * kick_env * math.exp(-abs(bi) * 0.35)))
            frame[36 - bar_h : 36 + bar_h, bx - 3 : bx + 3, 0] = 240
            frame[36 - bar_h : 36 + bar_h, bx - 3 : bx + 3, 1] = 184
            frame[36 - bar_h : 36 + bar_h, bx - 3 : bx + 3, 2] = 73

        # Fade from black (first 0.35s) and fade to black (last 0.45s)
        if t < 0.35:
            frame = (frame.astype(np.float32) * (t / 0.35)).astype(np.uint8)
        elif t > duration - 0.45:
            rem = max(0.0, (duration - t) / 0.45)
            frame = (frame.astype(np.float32) * rem).astype(np.uint8)

        proc.stdin.write(frame.tobytes())

        if fidx in sample_frames:
            saved_samples.append((sample_frames[fidx], frame.copy()))

        if fidx % 300 == 0 or fidx == total_frames - 1:
            print(f"  frame {fidx+1}/{total_frames} ({t:.2f}s)")

    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        print("FFmpeg failed with code:", rc, file=sys.stderr)
        sys.exit(rc)

    # Build 4x3 contact sheet from saved_samples for visual verification
    tw, th = 480, 270
    sheet = Image.new("RGB", (tw * 4, th * 3), (8, 9, 12))
    sd = ImageDraw.Draw(sheet)
    f_lbl = get_font("mono", 16, "Bold")
    for idx, (ts, arr) in enumerate(saved_samples[:12]):
        im = Image.fromarray(arr).resize((tw, th), Image.Resampling.BILINEAR)
        gx = (idx % 4) * tw
        gy = (idx // 4) * th
        sheet.paste(im, (gx, gy))
        sd.rectangle([gx + 8, gy + 8, gx + 110, gy + 32], fill=(0, 0, 0))
        sd.text((gx + 14, gy + 11), f"t={ts:05.2f}s", font=f_lbl, fill=(240, 184, 73))

    sheet_path = OUT_DIR / "contact_sheet.jpg"
    sheet.save(sheet_path, quality=92)
    print(f"Done! Video: {out_mp4} ({out_mp4.stat().st_size / 1e6:.2f} MB)")
    print(f"Contact sheet: {sheet_path}")


if __name__ == "__main__":
    main()
