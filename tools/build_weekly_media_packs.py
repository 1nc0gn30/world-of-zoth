#!/usr/bin/env python3
"""
1nc0gn30 Obsidian & Gold High-End X Carousel & Media Pack Engine
================================================================
Matches the exact @1nc0gn30 / NullAI visual design system:
  - Pure Obsidian Black (#060605) canvas + Imperial Gold (#DCBA73) + Warm Alabaster Ivory (#F2EADD)
  - Massive, high-contrast editorial typography (72px–96px display titles, 36px–42px gold subheadlines)
  - ZERO small text, ZERO cluttered 4-bullet wireframe boxes, ZERO overlapping components
  - Full-bleed right-hand 1nc0gn30 artwork, ARRI Alexa 65 Real-Life World of Zoth cinema plates,
    and gold-bezel live dark-mode workstation windows with Bayer 8x8 gold dither accents.
"""

import json
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path("/home/zoth/Desktop/world-of-zoth")
OUT_DIR = ROOT / "media_packs" / "week1"
HIGH_END_DIR = ROOT / "media_packs" / "high_end_cards"
QUEUE_JSON = ROOT / "tools" / "weekly_content_queue.json"

FONT_SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FONT_MONO_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

# True 1nc0gn30 Obsidian & Imperial Gold Palette
BG_OBSIDIAN = (6, 6, 5)
IVORY = (242, 234, 221)       # #f2eadd
GOLD = (220, 186, 115)        # #dcba73
GOLD_BRIGHT = (245, 198, 92)  # #f5c65c
GOLD_DIM = (142, 116, 64)
MUTED_IVORY = (196, 186, 170)

BAYER_4X4 = [
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5],
]


def f_sans(size: int):
    return ImageFont.truetype(FONT_SANS_BOLD, size)


def f_mono(size: int, bold: bool = True):
    return ImageFont.truetype(FONT_MONO_BOLD if bold else FONT_MONO_REG, size)


def wrap_pixels(draw: ImageDraw.ImageDraw, text: str, font, max_w: int, max_lines: int = 3) -> list[str]:
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:max_lines]


def draw_gold_bayer_edge(draw: ImageDraw.ImageDraw, W: int, H: int, seed: int = 1):
    """Draws subtle 1nc0gn30 ordered Bayer gold dither & orbital ember particles on the right edge."""
    # Right-edge Bayer gold dither strip (like 02-zoth-studio-beyond-cloud.png)
    cell = 6
    for y in range(0, H, cell):
        for x in range(W - 96, W, cell):
            dist_from_right = (W - x) / 96.0  # 0 at right edge, 1 at x=W-96
            wave = 0.5 + 0.5 * math.sin(y * 0.018 + seed * 1.7)
            density = (1.0 - dist_from_right) * (0.65 + 0.35 * wave)
            thresh = (BAYER_4X4[(y // cell) % 4][(x // cell) % 4] + 0.5) / 16.0
            if density > thresh:
                c = GOLD_BRIGHT if (x + y) % 12 == 0 else GOLD
                draw.rectangle([x, y, x + cell - 2, y + cell - 2], fill=(*c, 165))

    # Subtle orbital gold glints around the right visual stage
    cx, cy = 1390, 540
    for r_orb in (430, 510):
        draw.ellipse(
            [cx - r_orb, cy - int(r_orb * 0.72), cx + r_orb, cy + int(r_orb * 0.72)],
            outline=(*GOLD, 36),
            width=2,
        )


def composite_right_visual(base: Image.Image, bg_path: str, is_full_bleed_art: bool):
    """
    Places high-end visual on the right half (x=820..1920) with ZERO overlapping text boxes.
    - If `is_full_bleed_art` is True (1nc0gn30-campaign raw art, Real-Life Zoth ARRI Alexa 65, or 3D district art),
      blends it full-height on the right with a smooth obsidian gradient on the left seam.
    - If `is_full_bleed_art` is False (live Zoth Studio dark-mode tool capture or art-v2 hero),
      crops to the clean visual/UI region and frames it in an elevated 1nc0gn30 Gold-Bezel Window.
    """
    W, H = base.size
    if not bg_path or not os.path.exists(bg_path):
        return

    src = Image.open(bg_path).convert("RGB")
    sw, sh = src.size

    # If the source is an art-v2 hero image (which has its own text on the left half x=0..48%),
    # crop to the right 52% visual showcase so we NEVER double-render text!
    if "art-v2/" in bg_path:
        src = src.crop((int(sw * 0.47), 0, sw, sh))
        sw, sh = src.size
        is_full_bleed_art = False
    elif "live-tool-captures/" in bg_path:
        # Crop out the top site nav so the active dark-mode tool workstation fills the window cleanly
        src = src.crop((60, 145, sw - 60, sh - 40))
        sw, sh = src.size
        is_full_bleed_art = False
    elif "1nc0gn30-campaign/" in bg_path:
        # Crop strictly to the pure right-side illustration (x=48%..94%, y=6%..90%) so baked-in text/watermarks never appear!
        raw_candidate = Path(bg_path).parent / "raw" / Path(bg_path).name if "/raw/" not in bg_path else Path(bg_path)
        if raw_candidate.exists():
            src = Image.open(raw_candidate).convert("RGB")
            sw, sh = src.size
        src = src.crop((int(sw * 0.48), int(sh * 0.06), int(sw * 0.95), int(sh * 0.90)))
        sw, sh = src.size
        is_full_bleed_art = True

    if is_full_bleed_art:
        target_w, target_h = 1140, H
        scale = max(target_w / sw, target_h / sh)
        nw, nh = int(sw * scale), int(sh * scale)
        art = src.resize((nw, nh), Image.Resampling.LANCZOS)
        ox = (nw - target_w) // 2
        oy = (nh - target_h) // 2
        art = art.crop((ox, oy, ox + target_w, oy + target_h))
        art = ImageEnhance.Contrast(art).enhance(1.08)

        # Smooth horizontal alpha mask fading from 0 at x=0 (canvas x=780) to 255 at x=280 (canvas x=1060)
        mask = Image.new("L", (target_w, target_h), 255)
        m_px = mask.load()
        for x in range(280):
            t = x / 280.0
            a = int(255 * (t * t * (3 - 2 * t)))
            for y in range(target_h):
                m_px[x, y] = a
        base.paste(art, (W - target_w, 0), mask)
    else:
        # Pure Obsidian right stage with Gold Astrolabe / Sacred Geometry Framing Rings (ZERO ghosted background text!)
        # Elevated 16:9 Gold-Bezel Sovereign Window on the right (x=856..1820, y=210..818)
        win_x, win_y, win_w, win_h = 856, 210, 964, 608
        bar_h = 48
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)

        # Decorative 1nc0gn30 Gold Astrolabe / Sacred Geometry Framing Rings behind the window
        cx_orb, cy_orb = win_x + win_w // 2, win_y + win_h // 2
        od.ellipse([cx_orb - 470, cy_orb - 470, cx_orb + 470, cy_orb + 470], outline=(*GOLD, 42), width=2)
        od.ellipse([cx_orb - 410, cy_orb - 410, cx_orb + 410, cy_orb + 410], outline=(*GOLD, 28), width=1)
        od.line([(cx_orb, 40), (cx_orb, H - 40)], fill=(*GOLD, 26), width=1)

        # Subtle warm gold ambient aura behind the window
        for glow_i in range(6, 0, -1):
            pad = glow_i * 6
            od.rounded_rectangle(
                [win_x - pad, win_y - pad, win_x + win_w + pad, win_y + win_h + pad],
                radius=20 + pad,
                fill=(220, 186, 115, 7),
            )

        # Window frame & header bar
        od.rounded_rectangle(
            [win_x, win_y, win_x + win_w, win_y + win_h],
            radius=16,
            fill=(12, 12, 14, 255),
            outline=(*GOLD, 235),
            width=3,
        )
        od.rounded_rectangle(
            [win_x + 2, win_y + 2, win_x + win_w - 2, win_y + bar_h],
            radius=14,
            fill=(20, 19, 17, 255),
        )
        od.line([(win_x, win_y + bar_h), (win_x + win_w, win_y + bar_h)], fill=(*GOLD, 160), width=2)

        # 3 Gold/Bronze window control dots
        for di, dcol in enumerate([GOLD_BRIGHT, GOLD, GOLD_DIM]):
            dx = win_x + 24 + di * 22
            dy = win_y + bar_h // 2
            od.ellipse([dx - 6, dy - 6, dx + 6, dy + 6], fill=dcol)

        od.text(
            (win_x + 104, win_y + 13),
            "SOVEREIGN WORKSTATION // ZERO-CLOUD LOCAL ENGINE",
            font=f_mono(18, True),
            fill=GOLD,
        )

        base_rgba = Image.alpha_composite(base.convert("RGBA"), overlay)

        # Fit FULL WIDTH of the 16:9 screenshot cleanly inside (zero horizontal clipping!)
        inner_w = win_w - 24
        inner_h = win_h - bar_h - 24
        # Crop out top studio nav bar (y=13%..95%) so the active dark-mode workstation fills the 16:9 frame cleanly
        src_clean = src.crop((0, int(sh * 0.13), sw, int(sh * 0.95)))
        csw, csh = src_clean.size
        scale = inner_w / csw
        nw, nh = inner_w, max(inner_h, int(csh * scale))
        shot = src_clean.resize((nw, nh), Image.Resampling.LANCZOS)
        shot = shot.crop((0, 0, inner_w, inner_h))

        base_rgba.paste(shot.convert("RGBA"), (win_x + 12, win_y + bar_h + 12))
        base.paste(base_rgba.convert("RGB"), (0, 0))


def render_1nc0gn30_slide(
    bg_path: str,
    out_path: str,
    handle: str,
    title: str,
    subtitle: str,
    highlight_point: str,
    domain: str,
    slide_idx: int = 1,
    total_slides: int = 4,
    is_full_bleed_art: bool = True,
):
    """
    Renders a 1920x1080 poster/carousel slide matching the exact 1nc0gn30 campaign style:
      - Left column (x=76..810): Top @handle badge, huge Warm Ivory headline, bold Gold subheadline,
        one clean high-contrast takeaway card (30px font), and bottom domain pill.
      - Right stage (x=820..1920): High-end full-bleed art or gold-bezel workstation window.
      - ZERO overlapping components, ZERO tiny text.
    """
    W, H = 1920, 1080
    base = Image.new("RGB", (W, H), BG_OBSIDIAN)

    # 1. Composite right-side high-end visual first
    composite_right_visual(base, bg_path, is_full_bleed_art=is_full_bleed_art)

    # 2. Overlay left-side obsidian gradient guard so text on x=0..820 has 100% pure black contrast
    rgba = base.convert("RGBA")
    left_guard = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lg_px = left_guard.load()
    for x in range(920):
        if x < 740:
            a = 250
        else:
            t = (x - 740) / 180.0
            a = int(250 * (1.0 - (t * t * (3 - 2 * t))))
        for y in range(H):
            lg_px[x, y] = (6, 6, 5, a)
    rgba = Image.alpha_composite(rgba, left_guard)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw_gold_bayer_edge(draw, W, H, seed=slide_idx + hash(title) % 97)

    left_x = 78
    max_text_w = 720

    # 3. Top Attribution Pill ("NULLAI / @1nc0gn30")
    tag_text = f"NULLAI / @{handle}" if handle != "1nc0gn30" else "NULLAI / @1nc0gn30"
    font_tag = f_mono(26, False)
    tb = draw.textbbox((0, 0), tag_text, font=font_tag)
    pill_w = (tb[2] - tb[0]) + 44
    draw.rounded_rectangle(
        [left_x, 78, left_x + pill_w, 134],
        radius=8,
        fill=(14, 14, 12, 255),
        outline=(*GOLD, 120),
        width=2,
    )
    draw.text((left_x + 22, 91), tag_text, font=font_tag, fill=GOLD)

    # 4. Massive Editorial Display Title (Warm Alabaster Ivory #F2EADD)
    clean_title = title.replace("(1/4)", "").replace("(2/4)", "").replace("(3/4)", "").replace("(4/4)", "").strip()
    title_size = 76 if len(clean_title) <= 22 else (64 if len(clean_title) <= 34 else 56)
    font_title = f_sans(title_size)
    t_lines = wrap_pixels(draw, clean_title, font_title, max_text_w, max_lines=3)

    cur_y = 166
    line_step = int(title_size * 1.14)
    for ln in t_lines:
        draw.text((left_x, cur_y), ln, font=font_title, fill=IVORY)
        cur_y += line_step

    # 5. Bold Uppercase Gold Subheadline (Imperial Gold #DCBA73)
    cur_y += 18
    font_sub = f_sans(36)
    sub_lines = wrap_pixels(draw, subtitle.upper(), font_sub, max_text_w, max_lines=2)
    for sln in sub_lines:
        draw.text((left_x, cur_y), sln, font=font_sub, fill=GOLD)
        cur_y += 46

    # 6. Single High-Impact Callout Card (Large 30px Typography — Zero Tiny Bullets!)
    cur_y = max(cur_y + 28, 590)
    font_point = f_sans(30)
    p_lines = wrap_pixels(draw, highlight_point, font_point, max_text_w - 56, max_lines=3)
    card_h = 44 + len(p_lines) * 42
    draw.rounded_rectangle(
        [left_x, cur_y, left_x + max_text_w, cur_y + card_h],
        radius=12,
        fill=(15, 14, 12, 245),
        outline=(*GOLD, 210),
        width=2,
    )
    draw.rectangle([left_x, cur_y, left_x + 10, cur_y + card_h], fill=GOLD_BRIGHT)
    py = cur_y + 20
    for pln in p_lines:
        draw.text((left_x + 30, py), pln, font=font_point, fill=IVORY)
        py += 42

    # 7. Bottom Domain Pill & Slide Indicator (Always cleanly anchored at y=936..996)
    font_dom = f_mono(28, False)
    db = draw.textbbox((0, 0), domain, font=font_dom)
    dom_w = (db[2] - db[0]) + 48
    draw.rounded_rectangle(
        [left_x, 932, left_x + dom_w, 992],
        radius=8,
        fill=(14, 14, 12, 255),
        outline=(*GOLD, 150),
        width=2,
    )
    draw.text((left_x + 24, 946), domain, font=font_dom, fill=GOLD)

    if total_slides > 1:
        for i in range(1, total_slides + 1):
            bx = left_x + dom_w + 36 + (i - 1) * 48
            bcol = GOLD_BRIGHT if i == slide_idx else (52, 46, 36, 255)
            draw.rounded_rectangle([bx, 952, bx + 34, 972], radius=5, fill=bcol)

    final_img = Image.alpha_composite(rgba, overlay).convert("RGB")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    final_img.save(out_path, "JPEG", quality=95)


# ============================================================================
# CURATED HIGH-END VISUAL POOLS (Zero Low-Res Thumbnails!)
# ============================================================================
CAMPAIGN_ART = [
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/01-zothos-your-rules.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/02-zoth-studio-beyond-cloud.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/04-no-kings.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/05-zothos-your-world.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/06-studio-worlds-out.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/07-local-power.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/08-make-tools.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/raw/01-zothos-your-rules.png",
]

REAL_LIFE_ZOTH_ART = [
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_01_basalt_plaza.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_02_nullcore_monument.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_03_sentinel_field.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_04_clocktower_0612.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_05_hall_of_mirrors.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/real-life-zoth/district_06_wanderers_crossing.png",
]

WOZ_SHOTS = [
    *REAL_LIFE_ZOTH_ART,
    CAMPAIGN_ART[3],
    CAMPAIGN_ART[7],
    str(ROOT / "assets/woz_v04_battle_sync.jpg"),
    str(ROOT / "assets/woz_v04_blender_hunter.jpg"),
    str(ROOT / "assets/woz_v04_skyline_spire.jpg"),
    str(ROOT / "shots/z_archon_battle.jpg"),
    str(ROOT / "shots/z_hub.png"),
    str(ROOT / "shots/z_clock.png"),
    str(ROOT / "shots/z_mirrors.png"),
    str(ROOT / "shots/z_citadel.png"),
    str(ROOT / "shots/z_nullcore.png"),
    str(ROOT / "shots/z_horizon.png"),
]

ZOTHOS_SHOTS = [
    CAMPAIGN_ART[0],
    CAMPAIGN_ART[4],
    CAMPAIGN_ART[2],
    CAMPAIGN_ART[3],
    CAMPAIGN_ART[6],
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/zoth-os/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/zothos-lite/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/sovereign-agent-bridge/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/envguard-secrets-vault/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/anderson-security-sentinel/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/neuro-memory-daemon/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/jwt-inspector-guard/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/hexstrike-arsenal/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/yara-sigma-forge/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/zothnet/state1.png",
]

NFT_SHOTS = [
    CAMPAIGN_ART[1],
    CAMPAIGN_ART[5],
    CAMPAIGN_ART[7],
    CAMPAIGN_ART[2],
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/aeo-graph-engine/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/cwv-speed-engine/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/regex-droid-builder/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/schema-illustrator-studio/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/badge3d-coin-generator/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/polyglot-framework-exporter/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/cron-rhythm-studio/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/pwa-manifest-builder/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/webmcp-protocol-inspector/state1.png",
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/live-tool-captures/vector-search-engine/state1.png",
]


def rebuild_all_slides():
    # Import existing queue topics & videos from weekly_content_queue.json so we preserve all campaign structure
    # while upgrading 100% of the images to the 1nc0gn30 Obsidian & Gold design system.
    import importlib.util
    spec = importlib.util.spec_from_file_location("old_packs", "/tmp/old_weekly_packs.py")
    old_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old_mod)

    configs = [
        ("1nc0gn30", "1nc0gn30.nullai.tech", WOZ_SHOTS, old_mod.WOZ_CAROUSEL_TOPICS, "woz_arch"),
        ("zoth_os", "zothos.nullai.tech", ZOTHOS_SHOTS, old_mod.ZOTHOS_CAROUSEL_TOPICS, "zos_arch"),
        ("nullaitech", "nullai.tech", NFT_SHOTS, old_mod.NFT_CAROUSEL_TOPICS, "nft_arch"),
    ]

    total_rendered = 0
    for handle, domain, shots, topics, arch_prefix in configs:
        # 1. Re-render the 6 high_end_cards per account in 1nc0gn30 Obsidian & Gold style
        arch_dir = HIGH_END_DIR / handle
        arch_dir.mkdir(parents=True, exist_ok=True)
        existing_arch = sorted(arch_dir.glob("*.jpg"))
        if not existing_arch:
            existing_arch = [arch_dir / f"{arch_prefix}_0{i}_card.jpg" for i in range(1, 7)]

        for idx, arch_path in enumerate(existing_arch):
            t_title, t_sub, t_bullets, _ = topics[idx % len(topics)]
            bg = CAMPAIGN_ART[(idx + (0 if handle == "zoth_os" else 1)) % len(CAMPAIGN_ART)]
            render_1nc0gn30_slide(
                bg_path=bg,
                out_path=str(arch_path),
                handle=handle,
                title=t_title,
                subtitle=t_sub,
                highlight_point=t_bullets[0],
                domain=domain,
                slide_idx=4,
                total_slides=4,
                is_full_bleed_art=True,
            )
            total_rendered += 1

        # 2. Re-render all 7 Days × 3 Carousel Slots × 3 Slides in media_packs/week1/<handle>/
        c_idx = 0
        for day in range(1, 8):
            for slot in (2, 3, 4):
                t_title, t_sub, t_bullets, _ = topics[c_idx % len(topics)]
                for s_i in range(1, 4):
                    bg_shot = shots[(c_idx * 3 + s_i - 1) % len(shots)]
                    is_art = any(k in bg_shot for k in ("1nc0gn30-campaign", "real-life-zoth"))
                    out_slide = OUT_DIR / handle / f"day{day}_slot{slot}_slide{s_i}.jpg"
                    render_1nc0gn30_slide(
                        bg_path=bg_shot,
                        out_path=str(out_slide),
                        handle=handle,
                        title=t_title,
                        subtitle=t_sub,
                        highlight_point=t_bullets[(s_i - 1) % len(t_bullets)],
                        domain=domain,
                        slide_idx=s_i,
                        total_slides=4,
                        is_full_bleed_art=is_art,
                    )
                    total_rendered += 1
                c_idx += 1

    print(f"✓ Re-rendered {total_rendered} high-end 1nc0gn30 Obsidian & Gold slides across all accounts.")


if __name__ == "__main__":
    rebuild_all_slides()
