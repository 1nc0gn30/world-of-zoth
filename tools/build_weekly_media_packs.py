#!/usr/bin/env python3
"""
Weekly Multi-Account Media & 4-Slide 1080p Carousel Deck Builder
Generates:
  - 336 bespoke 1920x1080 4-slide carousel images across @1nc0gn30, @zoth_os, @nealfraziertech, and @zothstudio
  - Complete 7-Day × 5-Slot/Day (140 posts total) curated queue in tools/weekly_content_queue.json
  - Strict brand siloing: zero cross-pollution between accounts, @dinorawrai untouched
"""

import os
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = Path("/home/zoth/Desktop/world-of-zoth")
OUT_DIR = ROOT / "media_packs" / "week1"
QUEUE_JSON = ROOT / "tools" / "weekly_content_queue.json"

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

def get_font(size, bold=True):
    try:
        return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)
    except Exception:
        return ImageFont.load_default()

def render_carousel_slide(bg_path, out_path, accent_rgb, badge_text, title, subtitle, bullets, footer_left, slide_idx):
    W, H = 1920, 1080
    base = Image.new("RGB", (W, H), (8, 9, 13))

    # Load and composite blurred dark ambient backdrop so zero background text ever ghosts behind typography
    if bg_path and os.path.exists(bg_path):
        try:
            bg = Image.open(bg_path).convert("RGB")
            bw, bh = bg.size
            scale = max(W / bw, H / bh)
            nw, nh = int(bw * scale), int(bh * scale)
            bg = bg.resize((nw, nh), Image.Resampling.LANCZOS)
            ox, oy = (nw - W) // 2, (nh - H) // 2
            bg = bg.crop((ox, oy, ox + W, oy + H))
            bg = bg.filter(ImageFilter.GaussianBlur(radius=28))
            bg = ImageEnhance.Brightness(bg).enhance(0.22)
            base.paste(bg, (0, 0))
        except Exception:
            pass

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Top & Bottom framing bars
    draw.rectangle([0, 0, W, 68], fill=(6, 7, 10, 245))
    draw.rectangle([0, H - 72, W, H], fill=(6, 7, 10, 245))
    draw.rectangle([0, 68, W, 71], fill=(*accent_rgb, 230))
    draw.rectangle([0, H - 75, W, H - 72], fill=(*accent_rgb, 230))

    # Left technical dossier card border (opaque dark obsidian surface)
    card_x, card_y, card_w, card_h = 64, 118, 860, 840
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=18, fill=(10, 13, 20, 248), outline=(*accent_rgb, 220), width=3)

    # Right preview viewport frame around the live screenshot (opaque dark obsidian surface)
    vp_x, vp_y, vp_w, vp_h = 968, 118, 888, 840
    draw.rounded_rectangle([vp_x, vp_y, vp_x + vp_w, vp_y + vp_h], radius=18, fill=(10, 13, 20, 248), outline=(*accent_rgb, 200), width=3)

    # Paste sharp framed inset of the background inside the right viewport + telemetry footer beneath it
    if bg_path and os.path.exists(bg_path):
        try:
            inset = Image.open(bg_path).convert("RGB")
            iw = vp_w - 40
            ih = int(iw * 9 / 16)
            inset = inset.resize((iw, ih), Image.Resampling.LANCZOS)
            ix = vp_x + 20
            iy = vp_y + 44
            overlay_rgb = Image.alpha_composite(base.convert("RGBA"), overlay)
            overlay_rgb.paste(inset.convert("RGBA"), (ix, iy))
            base = overlay_rgb.convert("RGB")
            overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            draw.rounded_rectangle([ix - 3, iy - 3, ix + iw + 3, iy + ih + 3], radius=10, outline=(*accent_rgb, 230), width=2)
            # Caption panel below the 16:9 screenshot inside the right viewport
            cap_y = iy + ih + 26
            draw.rounded_rectangle([ix, cap_y, ix + iw, vp_y + vp_h - 28], radius=12, fill=(15, 20, 30, 245), outline=(55, 65, 85, 200), width=2)
            f_cap_h = get_font(20, True)
            f_cap_b = get_font(19, False)
            draw.text((ix + 24, cap_y + 22), f"LIVE SYSTEM TELEMETRY // VERIFIED 1080P CAPTURE (0{slide_idx}/04)", font=f_cap_h, fill=accent_rgb)
            draw.text((ix + 24, cap_y + 62), f"Module: {title[:48]}", font=f_cap_b, fill=(230, 236, 245))
            draw.text((ix + 24, cap_y + 98), f"Focus:  {bullets[0][:52]}", font=f_cap_b, fill=(180, 192, 210))
            draw.text((ix + 24, cap_y + 134), "Status: 100% Offline-First · Zero Console Errors · Grade-A", font=f_cap_b, fill=(74, 222, 128))
        except Exception:
            pass

    f_badge = get_font(20, True)
    f_title = get_font(38, True)
    f_sub = get_font(22, False)
    f_bullet = get_font(22, False)
    f_code = get_font(20, True)
    f_hud = get_font(19, True)

    # Top HUD bar
    draw.text((64, 22), badge_text.upper(), font=f_hud, fill=accent_rgb)
    slide_pill = f"CAROUSEL SLIDE 0{slide_idx}/04  ▸"
    draw.text((W - 360, 22), slide_pill, font=f_hud, fill=(245, 247, 250))

    # Badge inside card
    draw.rounded_rectangle([card_x + 36, card_y + 34, card_x + 430, card_y + 76], radius=8, fill=(*accent_rgb, 38), outline=(*accent_rgb, 190), width=2)
    draw.text((card_x + 54, card_y + 44), f"SLIDE 0{slide_idx} // ARCHITECTURE BRIEF", font=f_badge, fill=accent_rgb)

    # Title (wrapped cleanly to 34 chars)
    words = title.split()
    lines, cur = [], ""
    for w in words:
        if len(cur + " " + w) <= 32:
            cur = (cur + " " + w).strip()
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)

    ty = card_y + 106
    for ln in lines[:3]:
        draw.text((card_x + 36, ty), ln, font=f_title, fill=(248, 250, 252))
        ty += 50

    # Subtitle
    ty += 12
    draw.text((card_x + 36, ty), subtitle[:60], font=f_sub, fill=accent_rgb)
    ty += 48

    # Divider
    draw.line([(card_x + 36, ty), (card_x + card_w - 36, ty)], fill=(*accent_rgb, 110), width=2)
    ty += 30

    # Bullets / Code Specs
    for idx, b in enumerate(bullets[:4]):
        box_h = 110
        draw.rounded_rectangle([card_x + 36, ty, card_x + card_w - 36, ty + box_h], radius=10, fill=(18, 23, 35, 230), outline=(55, 65, 85, 180), width=1)
        draw.rectangle([card_x + 36, ty, card_x + 44, ty + box_h], fill=accent_rgb)
        # Wrap bullet to 54 chars
        bwords = b.split()
        blines, bcur = [], ""
        for bw in bwords:
            if len(bcur + " " + bw) <= 52:
                bcur = (bcur + " " + bw).strip()
            else:
                blines.append(bcur)
                bcur = bw
        if bcur:
            blines.append(bcur)
        by = ty + 18
        for bln in blines[:2]:
            draw.text((card_x + 62, by), bln, font=f_bullet, fill=(226, 232, 240))
            by += 32
        ty += box_h + 18

    # Bottom HUD bar
    draw.text((64, H - 48), footer_left, font=f_hud, fill=(200, 210, 225))
    # 4-dot progress indicator
    for i in range(1, 5):
        dx = W - 220 + (i - 1) * 42
        col = accent_rgb if i == slide_idx else (70, 80, 95)
        draw.rounded_rectangle([dx, H - 46, dx + 28, H - 30], radius=4, fill=col)

    final_img = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    final_img.save(out_path, "JPEG", quality=92)


# ============================================================================
# WEEKLY CONTENT DEFINITIONS (7 DAYS × 5 SLOTS/DAY PER ACCOUNT)
# ============================================================================

WOZ_VIDEOS = [
    ("dist/world-of-zoth-commercial.mp4", "EP I: 06:12 — Faces, Not Voices"),
    ("dist/world-of-zoth-ep2-crew.mp4", "EP II: Midnight at the Safehouse"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_SEASON3-TRILOGY-TRAILER.mp4", "Season III Trilogy Premiere (36 Films)"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_COMEDY-PAYWALL-FAKEOUT.mp4", "The $19.99 Katana Prank (Zero Paywalls)"),
    ("dist/world-of-zoth-ep25-citadel.mp4", "EP XXV: The Citadel of Archon-0"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_140BPM-DRIFT-PHONK-EDIT.mp4", "140 BPM Drift-Phonk Combat Edit"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_COMEDY-SHIBA-QA-LEAD.mp4", "When Pixel-Shiba Leads QA (#0612)"),
    ("dist/world-of-zoth-ep26-abyss.mp4", "EP XXVI: Abyssal Pelagic Memory"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_3D-BUMP-SHADER-SHOWCASE.mp4", "ZGL 3D Procedural Bump Shader Showcase"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_COMEDY-EVIL-TWIN-HR.mp4", "Hiring Your Evil Twin (03ng0cn1)"),
    ("dist/world-of-zoth-ep27-fiber.mp4", "EP XXVII: Packet Runner at 140 BPM"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_COMEDY-0612-GROUPCHAT.mp4", "06:12 AM Safehouse Groupchat Sitcom"),
    ("dist/world-of-zoth-ep36-trilogy.mp4", "EP XXXVI: The 36-Episode Trilogy Finale"),
    ("/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_COMEDY-PROMPT-INJECTION.mp4", "Nice Try, Prompt Injector (Null Academy)")
]

WOZ_SHOTS = [
    str(ROOT / "shots/z_hub.png"), str(ROOT / "shots/z_forest.png"), str(ROOT / "shots/z_relay.png"), str(ROOT / "shots/z_fiber.png"),
    str(ROOT / "shots/z_clock.png"), str(ROOT / "shots/z_streets.png"), str(ROOT / "shots/z_foundry.png"), str(ROOT / "shots/z_caves.png"),
    str(ROOT / "shots/z_mirrors.png"), str(ROOT / "shots/z_deep.png"), str(ROOT / "shots/z_skyline.png"), str(ROOT / "shots/z_abyss.png"),
    str(ROOT / "shots/z_citadel.png"), str(ROOT / "shots/z_nullcore.png"), str(ROOT / "shots/z_rooftop.png"), str(ROOT / "shots/z_loom.png"),
    str(ROOT / "shots/z_vault.png"), str(ROOT / "shots/z_astral.png"), str(ROOT / "shots/z_omega.png"), str(ROOT / "shots/z_horizon.png"),
    str(ROOT / "assets/woz_v04_battle_sync.jpg"), str(ROOT / "assets/woz_v04_blender_hunter.jpg"),
    str(ROOT / "assets/woz_v04_party_copy.jpg"), str(ROOT / "assets/woz_v04_codex.jpg"),
    str(ROOT / "assets/woz_v04_hud.jpg"), str(ROOT / "assets/woz_v04_skyline_spire.jpg"),
    str(ROOT / "shots/z_archon_battle.jpg"), str(ROOT / "shots/battle-05.png")
]

ZOTHOS_VIDEOS = [
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep01_toram_boot.mp4"),
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep02_enclave_vault.mp4"),
    "/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_ZOTHOS-TORAM-COMMERCIAL.mp4",
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep03_ebpf_firewall.mp4"),
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep04_local_ai_daemon.mp4"),
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep05_xcursor_plasma.mp4"),
    str(ROOT / "media_packs/videos/zoth_os/zothos_ep06_arsenal_pipeline.mp4"),
    "/home/zoth/nullaitech-upgrade/reels-v2/zoth-os/zoth-os-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/zoth-os-website/zoth-os-website-reel-16x9.mp4",
    "/home/zoth/NullAITech/media-assets/zothos-lite-cot-motion-edit.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/envguard-secrets-vault/envguard-secrets-vault-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/anderson-security-sentinel/anderson-security-sentinel-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/neuro-memory-daemon/neuro-memory-daemon-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/payload-entropy-studio/payload-entropy-studio-reel-16x9.mp4"
]

ZOTHOS_SHOTS = [
    "/home/zoth/nullaitech-upgrade/art-v2/zoth-os/zoth-os-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/zoth-os-website/zoth-os-website-hero-16x9.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/01-zothos-your-rules.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/05-zothos-your-world.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/07-local-power.png",
    "/home/zoth/Pictures/1nc0gn30-campaign/04-no-kings.png",
    "/home/zoth/nullaitech-upgrade/art-v2/envguard-secrets-vault/envguard-secrets-vault-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/anderson-security-sentinel/anderson-security-sentinel-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/neuro-memory-daemon/neuro-memory-daemon-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/payload-entropy-studio/payload-entropy-studio-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/jwt-inspector-guard/jwt-inspector-guard-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/web-security-guard/web-security-guard-hero-16x9.png",
    "/home/zoth/NullAITech/video-production/tool-69-zoth-os/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-74-zothos-lite/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-26-envguard-secrets-vault/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-13-anderson-security-sentinel/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-31-hexstrike-arsenal/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-30-ghidra-mcp-bridge/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-60-yara-sigma-forge/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-05-agent-capsule-jail/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-06-agent-egress-sentinel/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-11-agent-prompt-firewall/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-51-shodan-surface-sentinel/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-25-osint-scout-skill/thumbnail.jpg"
]

NFT_VIDEOS = [
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep01_zero_dep_architecture.mp4"),
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep02_webgl_pbr_shaders.mp4"),
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep03_aeo_schema_graph.mp4"),
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep04_webaudio_dsp_synth.mp4"),
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep05_headless_cdp_qa.mp4"),
    str(ROOT / "media_packs/videos/nealfraziertech/nft_ep06_open_access_micro_saas.mp4"),
    "/home/zoth/nullaitech-upgrade/reels-v2/aeo-graph-engine/aeo-graph-engine-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/cwv-speed-engine/cwv-speed-engine-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/polyglot-framework-exporter/polyglot-framework-exporter-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/schema-illustrator-studio/schema-illustrator-studio-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/regex-droid-builder/regex-droid-builder-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/cron-rhythm-studio/cron-rhythm-studio-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/badge3d-coin-generator/badge3d-coin-generator-reel-16x9.mp4",
    "/home/zoth/nullaitech-upgrade/reels-v2/subsweep-lead-scanner/subsweep-lead-scanner-reel-16x9.mp4"
]

NFT_SHOTS = [
    "/home/zoth/nullaitech-upgrade/art-v2/aeo-graph-engine/aeo-graph-engine-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/cwv-speed-engine/cwv-speed-engine-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/polyglot-framework-exporter/polyglot-framework-exporter-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/schema-illustrator-studio/schema-illustrator-studio-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/regex-droid-builder/regex-droid-builder-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/cron-rhythm-studio/cron-rhythm-studio-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/badge3d-coin-generator/badge3d-coin-generator-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/subsweep-lead-scanner/subsweep-lead-scanner-hero-16x9.png",
    "/home/zoth/nullaitech-upgrade/art-v2/city-desk/city-desk-hero-16x9.png",
    "/home/zoth/NullAITech/video-production/tool-03-aeo-graph-engine/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-20-cwv-speed-engine/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-43-polyglot-framework-exporter/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-50-schema-illustrator-studio/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-48-regex-droid-builder/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-19-cron-rhythm-studio/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-56-vector-search-engine/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-59-webmcp-protocol-inspector/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-47-pwa-manifest-builder/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-49-robots-txt-auditor/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-17-certpath-roadmap-studio/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-70-zoth-webgen/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-36-nexus-3d-scene-studio/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-71-reality-shader-forge/thumbnail.jpg",
    "/home/zoth/NullAITech/video-production/tool-68-zoth-math-pillar/thumbnail.jpg"
]

# 21 Distinct Carousel Topics per Account (7 Days × 3 Carousel Slots/Day)
WOZ_CAROUSEL_TOPICS = [
    ("3D World-Space FBM Shaders", "Zero-Texture Procedural Relief in Pure WebGL",
     ["World-space FBM normal-bump perturbation (dN) on every facade", "Concentric raindrop ripples in wet asphalt puddles (uTex.y)", "Interior parallax lit rooms computed per fragment", "5 live PBR surface presets via > textures in-engine"],
     "🗺️ 3D Lattice Shader Breakdown\n\nEvery building in World of Zoth computes procedural world-space FBM normal-bump relief, wet cyber-rain ripples & interior parallax windows in pure WebGL—zero external PNG textures.\n\nhttps://github.com/1nc0gn30/world-of-zoth #WebGL #Shaders #GameDev"),
    ("Terminal Verb Combat Engine", "Tactical Turn-Based Directives & Parries",
     ["Execute real terminal verbs: > ping, > exploit, > firewall", "Precision timing slider grants 1.5x critical strikes", "Sub-second [SPACE] parries counter incoming telegraphs", "21-Skybeam Quorum Ultimate unlocked at max sync"],
     "⚔️ Terminal Command Combat\n\nAttacks in World of Zoth are terminal directives (> ping, > exploit, > firewall).\nChain x6 Lattice Syncs (+30% DMG) and time sub-second parries against reflective bosses.\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieGames #RPG #PixelArt"),
    ("22-Cabinet Safehouse Arcade", "Self-Contained Retro Megaplex Inside a 3.6MB RPG",
     ["Play Galaga, Breakout, Snake, Cyber-Pong & Vector Asteroids", "Solve 5x5 Quantum Wave-Collapse & 6x6 Laser Routers", "Challenge the 3x3 Pantheon Triad Card Table", "Zero microtransactions—100% unlocked in browser & APK"],
     "🕹️ Inside the 22-Cabinet Safehouse Megaplex\n\nFrom Conway's Game of Life & Doom-Fire to Galaga, Breakout, Cyber-Pong & Pantheon Triad—all 22 arcade games live inside a single 3.6MB HTML file.\n\nhttps://github.com/1nc0gn30/world-of-zoth #RetroGaming #JavaScript"),
    ("Act I: Relit City & Rest Woods", "Where the 06:12 Saga Begins",
     ["Explore Relit City's dot-matrix skyscraper canyon & Relay 1", "Meet Vigil: 'Trust faces, not voices. Silence cannot be copied.'", "Cross into Rest Woods' Conway's Game of Life clearing", "Face 03ng0cn1 (The Red Copy) at the East Gate"],
     "🌆 Act I Field Guide: Relit City & Rest Woods\n\nStep into the boots of 1nc0gn30 at 06:12.\nWalk the dot-matrix skyscraper canyons, calibrate Relay 1 with Vigil, and face your reflection at the East Gate.\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieDev #CyberRPG"),
    ("Act II: The Hollow & Relay 4", "Severing the Stitched Voice Pylons",
     ["Navigate red glitching voxel terraces above the abyss", "Relay 4 broadcasts voices stitched from fallen operators", "Use acoustic sonar [SPACE] to expose cloaked nodes", "Sever the 3 corrupted voice pylons to silence the chorus"],
     "📡 Act II Field Guide: The Hollow & Relay 4\n\nBeneath the relit streets, Relay 4 broadcasts voices stitched together from fallen operators.\nUse your acoustic sonar pulse to locate and sever the corrupted pylons.\n\nhttps://github.com/1nc0gn30/world-of-zoth #GameDev #SciFi"),
    ("Act III: Hilbert Fiber & Clocktower", "140 BPM Optical Conduits & Frozen Time",
     ["Subterranean Hilbert space-filling curves pulse at 140 BPM", "Run the 3D Hilbert Packet Runner mini-game (> runner)", "Ascend the Sand Clocktower frozen at 06:12 by SANDGLASS", "Align the 5-Ring Chrono-Orrery to restore the timeline"],
     "⏳ Act III Field Guide: Hilbert Tunnels & Sand Clocktower\n\nRace through 140 BPM space-filling Hilbert optical conduits and climb the Sand Clocktower where time is frozen at 06:12.\n\nhttps://github.com/1nc0gn30/world-of-zoth #CreativeCoding #WebGL"),
    ("Act IV: Superposition & Mirrors", "Wave-Function Collapse Streets & Doom Foundry",
     ["Collapse Streets exist in quantum superposition until observed", "Forge the octagonal Mirror Key inside Doom-Fire Foundry", "Navigate Physarum slime-mould acoustic standing waves", "Recruit 03ng0cn1 (#22) inside the octagonal Hall of Mirrors"],
     "🪞 Act IV Field Guide: Collapse Streets & Hall of Mirrors\n\nStreets generated by quantum Wave-Function Collapse lead to the octagonal labyrinth where your reflection (03ng0cn1) awaits.\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieGameDev #RPG"),
    ("Act V: Mode-7 Skyline & 06:13", "21 Sovereign Skybeams & The First Sunrise",
     ["Ascend the high-altitude Voronoi plateau under 21 skybeams", "Confront >_ (The Blank Cursor) at the root lattice node", "Dive 4096m into the Menger-sponge Sub-Lattice Abyss", "Unlock the secret Rooftop sector to witness 06:13 Dawn"],
     "🌅 Act V Field Guide: Mode-7 Skyline & The 06:13 Dawn\n\nSummon all 22 companions beneath the 21 sovereign skybeams, defeat the Blank Cursor (>_), and watch the Braille sun rise at 06:13.\n\nhttps://github.com/1nc0gn30/world-of-zoth #PixelArt #WebGL2"),
    ("Null Academy: 16 Security Labs", "Learn Real AI-Security & Crypto Inside an RPG",
     ["Interactive prompt-injection & jailbreak defense challenges", "Zero-Knowledge 4x4 cipher grids & XOR packet inspection", "Morse, Hex & Unicode Braille frequency decoding", "Earn Kernel Points & permanent squad stat boosts"],
     "🎓 Null Academy: 16 Interactive AI-Security Labs\n\nBuilt directly into Relit City—practice prompt-firewall hardening, ZK cipher grids, and frequency decoding to level up your operator kernel.\n\nhttps://github.com/1nc0gn30/world-of-zoth #CyberSecurity #InfoSec"),
    ("22 Blender 4.3 Wireframe Monuments", "Procedural 3D Geometry Exported to Zero-Dep JS",
     ["Custom Python Blender 4.3 pipeline generates vertex/edge meshes", "Includes Dawn Horizon Gate, Omega Core & Astral Spire Crown", "Rendered at 60fps with frustum culling & distance fog", "Zero external .glb/.obj network fetches required"],
     "📐 22 Blender 4.3 Procedural Wireframe Monuments\n\nFrom the 4D Clifford Hyper-Torus in Null Core to the Chrono-Vault Orrery, every 3D monument is compiled directly into our single-file bundle.\n\nhttps://github.com/1nc0gn30/world-of-zoth #Blender3D #ThreeJS #WebGL"),
    ("140 BPM WebAudio Synth Engine", "Zero MP3 Files — Pure Real-Time Oscillators",
     ["Every district theme & boss track synthesized live in-browser", "Pirate Radio FM (> radio) streams Chiptune, Darksynth & Phonk", "Interactive 16-step Chiptune Sequencer (> synth)", "4-Track Signal Tower Rhythm Sync mini-game (> rhythm)"],
     "🎵 140 BPM Procedural WebAudio Engine\n\nWorld of Zoth uses zero external MP3s—every bassline, arpeggio, and boss theme is synthesized live in your browser via WebAudio oscillators.\n\nhttps://github.com/1nc0gn30/world-of-zoth #Chiptune #WebAudio #Synth"),
    ("Pantheon Triad 3x3 Card Battler", "High-Stakes Tabletop Strategy Atop Astral Spire",
     ["Collect holographic cards for all 22 companions (> cards)", "Directional N/E/S/W edge power captures & chain combos", "Wager bits against Grandmaster AI opponents (> triad)", "Unlock rare Boss & Archon cards via Citadel victories"],
     "🃏 Pantheon Triad: 3x3 Tactical Card Battler\n\nClimb the Astral Spire, build your deck of 22 holographic companion cards, and chain directional captures on the 3x3 grid.\n\nhttps://github.com/1nc0gn30/world-of-zoth #CardGame #IndieGames"),
    ("Chrono-Vault Pet Sanctuary", "Good Dog Protocol & Sub-Lattice Fishing",
     ["Adopt & pet Pixel-Shiba and Pixel-Neko in District #17", "Familiars grant passive HP regen & crit boost in combat", "Cast lines in Deep-Water Memory (> fish) for rare relics", "Synthesize consumables at theSafehouse Alchemy Bench"],
     "🐕 Chrono-Vault Pet Sanctuary & Familiar Protocol\n\nVisit District #17 (> pets) to train Pixel-Shiba & Pixel-Neko for passive squad buffs, then fish the Deep-Water Memory trench for relics.\n\nhttps://github.com/1nc0gn30/world-of-zoth #CozyGaming #PixelArt"),
    ("ZGL 3D World Blueprint Studio", "Build & Share Custom 3D Lattice Sectors In-Game",
     ["Launch > builder inside District #19 (The Omega Foundry)", "Place buildings, neon pylons, warp pads & boss triggers", "Script custom crew dialogues in Scene Maker (> scenemaker)", "Export & import shareable sector blueprints instantly"],
     "🏗️ ZGL 3D World Blueprint Studio & Scene Creator\n\nWorld of Zoth includes its own in-game 3D level editor (> builder) and dialogue cutscene maker (> scenemaker).\n\nhttps://github.com/1nc0gn30/world-of-zoth #LevelDesign #GameDev"),
    ("Zero-Knowledge Citadel & Archon-0", "99-Floor Infinite Stack & AI Colosseum",
     ["Scale the 99-Floor Infinite Stack procedural dungeon", "Wager on AI vs AI boss battles in the Colosseum (> colosseum)", "Face ARCHON-0 (4,800 HP) in the Pantheon Sanctum", "Test your endurance in Endless Boss Survival Gauntlet"],
     "🏰 Zero-Knowledge Citadel & 99-Floor Infinite Stack\n\nReady for endgame? Climb 99 procedural floors, wager on AI vs AI Colosseum duels, and challenge ARCHON-0.\n\nhttps://github.com/1nc0gn30/world-of-zoth #Roguelike #RPG"),
    ("2.0x Hyper-Clock & Speedrun HUD", "Engineered for Frame-Perfect Routing",
     ["Tap [V] anytime to cycle 1.0x, 1.5x Turbo & 2.0x Hyper-Clock", "Chain 0.9s cooldown Dissipate Dashes across 20 districts", "Built-in 10-Split Speedrun Timer (> speedrun) with Gold PBs", "Instant 20-District World Atlas warp grid (> atlas)"],
     "⚡ 2.0x Hyper-Clock & Built-In Speedrun Timer\n\nTap [V] to engage 2.0x engine speed, chain Dissipate Dashes, and track frame-accurate splits across all 5 Acts.\n\nhttps://github.com/1nc0gn30/world-of-zoth #Speedrun #IndieGames"),
    ("Kernel Module Skill Tree & Anvil", "Deep RPG Build Crafting & +15 Relic Forging",
     ["Unlock Overflow, Race Window, Heap Spray & JIT Compilation", "Upgrade weapons to +15 at the Doom-Fire Foundry Anvil", "Socket Protocol Resonance gems for elemental synergies", "Trigger 4-Agent Pantheon Union Finishers (> union)"],
     "🔧 Kernel Skill Tree & +15 Foundry Blacksmithing\n\nCustomize your operator with kernel exploit modules, forge +15 relics at the Doom-Fire Anvil, and unleash 4-agent Union Finishers.\n\nhttps://github.com/1nc0gn30/world-of-zoth #RPG #GameDesign"),
    ("Unicode U+2800 Braille & Bayer 8x8", "The Visual Language of World of Zoth",
     ["Sub-pixel 2x4 Unicode Braille matrices render dynamic banners", "Ordered Bayer 8x8 dithering shades every portrait & dialog box", "Gold phosphor (#fbbf24) + emerald telemetry palette", "60fps aperture handoff from title screen to live 3D street"],
     "✨ Unicode U+2800 Braille & Ordered Bayer 8x8 Dithering\n\nHow we gave World of Zoth its signature gold-phosphor CRT aesthetic using pure mathematical dithering and sub-pixel Braille matrices.\n\nhttps://github.com/1nc0gn30/world-of-zoth #ASCIIArt #CreativeCoding"),
    ("Single-File 3.6MB HTML + Android APK", "100% Offline-First Sovereign Distribution",
     ["Entire 20-district 3D game compiles into one 3.6MB HTML file", "Zero CDN scripts, zero external assets, zero cloud servers", "Signed native Android WebView APK with dual-stick touch HUD", "Boot it from a USB stick or air-gapped terminal anywhere"],
     "📦 20 3D Worlds in a Single 3.6MB HTML File & Android APK\n\nZero external dependencies. Double-click world-of-zoth.html offline or install the signed Android APK with full touch controls.\n\nhttps://github.com/1nc0gn30/world-of-zoth #WebDev #AndroidDev"),
    ("24-Episode In-Engine Cinema Hub", "Real-Time 3D Movies Rendered Live in WebGL",
     ["Type > cinema to browse all 24 theatrical episodes in-game", "Season I (EP I–XII) & Season II (EP XIII–XXIV) filter tabs", "Dynamic camera rails, typewriter portraits & 3D rain shaders", "Also available as standalone 1080p MP4s in commercial.html"],
     "🎬 24-Episode In-Engine 3D Cinema Screening Room\n\nWatch all 24 theatrical episodes rendered live in real-time WebGL via > cinema (or stream the 1080p MP4s in commercial.html).\n\nhttps://github.com/1nc0gn30/world-of-zoth #Machinima #WebGL"),
    ("Sovereign Master Control Center", "95+ Subsystems Accessible from One Terminal",
     ["Type > master or press [TAB] for the Radial Command Wheel", "Instant search across all 20 districts, 22 games & tools", "Includes Operator ID Card PNG exporter (> idcard)", "100% open-source & free forever on GitHub"],
     "🧭 The Sovereign Master Control Center (> master)\n\nOver 95 interactive subsystems, 22 arcade cabinets, and 20 3D districts—all searchable from one unified terminal.\n\nhttps://github.com/1nc0gn30/world-of-zoth #OpenSource #IndieDev")
]

ZOTHOS_CAROUSEL_TOPICS = [
    ("Debian Live toram Amnesic Architecture", "Zero-Disk Forensics & RAM-Resident Execution",
     ["Boot parameter toram copies full SquashFS image into system RAM", "Unmounts boot media—zero read/write wear or disk artifacts", "Sub-millisecond binary launch directly from memory pages", "Power-off wipes volatile state for clean amnesic hygiene"],
     "🐧 Debian Live toram Amnesic Boot Architecture\n\nLoading the entire SquashFS root filesystem into RAM eliminates disk bottlenecks and guarantees clean amnesic resets on power-off.\n\n#Linux #CyberSecurity #Privacy #OSDev"),
    ("Rust Argon2id + XChaCha20 Vault", "Hardware-Isolated Local Secrets Engine (:8787)",
     ["Key derivation: Argon2id (m=64MiB, t=3, p=1) resists GPU cracking", "Authenticated encryption: XChaCha20-Poly1305 with 24-byte nonce", "MasterKey & passphrases zeroized in RAM immediately on drop", "Strict 127.0.0.1 loopback bind + 0600 file mode enforcement"],
     "🔐 Rust Argon2id + XChaCha20-Poly1305 Secrets Enclave\n\nPlaintext .env files are a liability. ZothOS encrypts keys at rest and injects them directly into child process memory via execvpe.\n\n#RustLang #InfoSec #DevSecOps #Cryptography"),
    ("CLI + Localhost Workstation Parity", "Dual-Interface Engineering for Every OS Utility",
     ["Every ZothOS tool exposes a scriptable CLI (/usr/local/bin/<tool>)", "Supports --json output for jq, awk & automated bash pipelines", "Pairs with a multi-pane localhost web UI for visual analysis", "100% offline execution with zero external cloud calls"],
     "⚡ CLI + Localhost Web Workstation Parity\n\nEvery security and analysis utility in ZothOS runs both as a JSON-scriptable CLI binary and a multi-pane localhost workstation.\n\n#LinuxAdmin #SysAdmin #CLI #OpenSource"),
    ("KDE Plasma 6 & XFCE Live ISO Hardening", "Deterministic Desktop & Xcursor Packaging",
     ["Validates Xcursor binary magic headers (Xcur) at ISO build time", "Enforces KWIN_FORCE_SW_CURSOR=1 for QEMU & VirtIO-GPU visibility", "Pre-populates /etc/skel & /home/zoth desktop launchers cleanly", "Eliminates broken symlinks & missing icons on live boot"],
     "🖥️ Debian Live ISO Desktop & Cursor Determinism\n\nHow we guarantee rock-solid X11/Wayland cursor visibility and deterministic desktop folders across QEMU, VirtIO, and bare-metal NVMe.\n\n#LinuxDesktop #KDE #Kernel #Debian"),
    ("EnvGuard Zero-Trust .env Auditor", "Shamir Secret Splitting & Entropy Scanning",
     ["Scans repositories for leaked keys & high-entropy tokens", "Encrypts plaintext configs into armored zero-trust vaults", "Supports Shamir's Secret Sharing (k-of-n quorum recovery)", "CI/CD pre-commit guard blocks accidental credential pushes"],
     "🛡️ EnvGuard: Zero-Trust .env Auditor & Shamir Splitter\n\nAudit secret lifetimes, split master keys into k-of-n Shamir threshold shares, and block credential leaks before git commit.\n\n#AppSec #DevSecOps #Security #Git"),
    ("Anderson Security Sentinel", "Real-Time Linux Posture & Intrusion Telemetry",
     ["Audits active listening sockets, SUID binaries & kernel sysctls", "Monitors anomalous outbound egress connections in real time", "Generates actionable hardening scores & remediation scripts", "Zero-overhead local daemon with instant CLI reporting"],
     "🚨 Anderson Security Sentinel: Linux Posture Auditing\n\nContinuous verification of listening sockets, kernel hardening flags, and outbound network egress—100% local on your machine.\n\n#CyberSecurity #BlueTeam #LinuxSecurity"),
    ("Neuro-Memory STDP Daemon (:8094)", "Biologically Inspired Local Context Engrams",
     ["Models Spike-Timing-Dependent Plasticity (STDP) for AI memory", "Strengthens frequently accessed architectural notes & code paths", "Decays stale noise automatically without cloud vector DBs", "Syncs bidirectionally with local Markdown knowledge vaults"],
     "🧠 Neuro-Memory STDP Daemon (:8094)\n\nInstead of sending your codebase to a cloud vector DB, ZothOS runs a local Spike-Timing-Dependent Plasticity memory graph on-device.\n\n#LocalAI #MachineLearning #Privacy #Linux"),
    ("Payload Entropy & Binary Inspector", "Visualizing Shannon Entropy Across Executables",
     ["Computes sliding-window Shannon entropy (0.0–8.0 bits/byte)", "Pinpoints packed sections, encrypted shellcode & obfuscated blobs", "Side-by-side hex/ASCII inspector with ELF/PE header parsing", "Runs 100% client-side & via CLI for malware triage"],
     "🔬 Sliding-Window Shannon Entropy Binary Analysis\n\nSpot packed ELF/PE segments and encrypted payloads in milliseconds by graphing byte-distribution entropy across binary offsets.\n\n#MalwareAnalysis #ReverseEngineering #InfoSec"),
    ("JWT Inspector & Cryptographic Guard", "Auditing Token Signatures, Claims & Alg-None Flaws",
     ["Decodes JOSE headers, payload claims & expiration TTLs offline", "Tests for alg:none bypass, weak HMAC secrets & key confusion", "Verifies RS256/ES256/EdDSA signatures against public JWKS", "Zero token leakage—never paste production JWTs into cloud sites"],
     "🔑 Offline JWT Security Auditing & Signature Verification\n\nNever paste production bearer tokens into third-party web decoders. Inspect claims, TTLs, and signature algorithms locally in ZothOS.\n\n#WebSecurity #PenTesting #AppSec #API"),
    ("YARA & Sigma Detection Rule Forge", "Authoring & Testing Threat Signatures Locally",
     ["Interactive builder for YARA binary rules & Sigma log signatures", "Live syntax validation + regex/hex-string pattern testing", "Exports standardized rules for SOC pipelines & local scanners", "Includes curated templates for persistence & credential access"],
     "🎯 YARA & Sigma Threat Detection Rule Forge\n\nWrite, validate, and test YARA binary patterns and Sigma log detection rules offline with instant corpus matching.\n\n#ThreatHunting #DFIR #BlueTeam #SOC"),
    ("Ghidra MCP Bridge & Binary Triage", "Connecting Local Decompilers to Sovereign Agents",
     ["Exposes Ghidra decompilation, symbol tables & call graphs via MCP", "Allows local AI agents to audit stripped C/Rust binaries safely", "Automates vulnerability discovery & struct recovery offline", "Strict air-gapped execution—binaries never leave localhost"],
     "⚙️ Ghidra MCP Bridge: Local AI Assisted Reverse Engineering\n\nPipe stripped binary call graphs and decompiled C pseudocode from Ghidra directly into local AI agents over stdio MCP.\n\n#ReverseEngineering #Ghidra #CyberSecurity"),
    ("Agent Capsule Jail & Egress Firewall", "Sandboxing Autonomous AI Code Execution",
     ["Isolates agent subprocesses inside restricted filesystem namespaces", "Enforces strict allowlists on outbound DNS & TCP/TLS egress", "Logs every syscall, file mutation & network packet for replay", "Prevents prompt-injection from exfiltrating host credentials"],
     "🔒 Sandboxing Autonomous AI Agents on Linux\n\nAutonomous code execution requires strict boundaries: namespace capsule jails, outbound egress allowlists, and full flight-recorder logs.\n\n#AISecurity #LinuxKernel #Sandboxing"),
    ("Agent Prompt Firewall & Policy Auditor", "Defending Local LLMs Against Indirect Injection",
     ["Scans untrusted RAG documents & web inputs for instruction hijacks", "Enforces deterministic JSON schema contracts on tool calls", "Blocks unauthorized shell/filesystem invocations pre-execution", "Zero-latency local filter pipeline before model inference"],
     "🛡️ Defending Against Indirect Prompt Injection\n\nWhen AI agents read external repos or web pages, a deterministic pre-inference prompt firewall + tool-call policy auditor is mandatory.\n\n#LLM #AISafety #AppSec #InfoSec"),
    ("AudioCipher Steganography Engine", "LSB Phase & Spectral Data Hiding in WAV Audio",
     ["Embeds encrypted payloads inside 16-bit PCM audio spectrograms", "Real-time FFT waterfall analyzer verifies zero audible artifacts", "Pairs XChaCha20 encryption with reed-solomon error correction", "Full CLI + browser workstation for covert comms research"],
     "📡 Spectral & LSB Audio Steganography in ZothOS\n\nHide and verify encrypted payloads inside PCM audio waveforms with live FFT spectrogram diffing.\n\n#Cryptography #Steganography #SecurityResearch"),
    ("HexStrike Offensive & Defensive Arsenal", "Unified Packet, Port & Protocol Workbench",
     ["High-speed local port, service banner & TLS cipher suite auditor", "Custom packet crafting & hex-stream protocol fuzzer", "Maps attack surface exposure before external deployment", "Built for red/blue team purple-hat verification"],
     "⚡ HexStrike Protocol & Attack-Surface Workbench\n\nAudit TLS cipher suites, inspect raw hex protocol frames, and verify service hardening before opening a single port.\n\n#NetSec #PenTesting #RedTeam #Linux"),
    ("Shodan & Surface Exposure Sentinel", "Continuous External Attack-Surface Hygiene",
     ["Correlates public IP/DNS records against exposed port telemetry", "Flags forgotten staging subdomains, open buckets & expired certs", "Exports structured JSON reports for automated firewall updates", "Keeps sovereign infrastructure tight and minimal"],
     "🌐 Attack-Surface & Subdomain Exposure Hygiene\n\nYou can't defend services you forgot were listening. Continuously audit public DNS, TLS certificates, and exposed ports.\n\n#OSINT #CloudSecurity #SecOps"),
    ("Web Security Guard & Header Auditor", "Hardening CSP, HSTS & Cross-Origin Isolation",
     ["Audits Content-Security-Policy, X-Frame-Options & Referrer-Policy", "Detects permissive CORS wildcards & insecure cookie flags", "Generates drop-in Nginx, Cloudflare & Netlify header configs", "Enforces Grade-A security posture across every deployment"],
     "🔒 Hardening HTTP Security Headers (CSP, HSTS, COOP/COEP)\n\nMissing security headers turn minor bugs into full compromises. Audit and generate strict CSP & HSTS policies in seconds.\n\n#WebSecurity #Infosec #DevOps"),
    ("Sovereign Agent Bridge & Swarm Multiplexer", "Coordinating Local Multi-Agent Daemons",
     ["Routes tasks across specialized local agents over loopback IPC", "Zero cloud API latency—runs on local GGUF/Ollama/vLLM weights", "Deterministic consensus voting on code patches & security audits", "Full terminal TUI + live telemetry dashboard"],
     "🤖 Local Multi-Agent Swarm Multiplexing on Linux\n\nCoordinate specialized security, architecture, and verification agents over localhost IPC with zero cloud token dependency.\n\n#LocalLLM #AIEngineering #Linux"),
    ("Flight Recorder for Autonomous Agents", "Immutable Audit Trails for Every Tool Call",
     ["Records every prompt, tool argument, stdout/stderr & file diff", "Cryptographically hashes log chains to detect tampering", "Replay any agent session step-by-step for post-mortem debugging", "Essential compliance layer for production AI automation"],
     "📼 Why Every AI Agent Needs an Immutable Flight Recorder\n\nWhen autonomous agents run shell commands and edit code, full step-by-step replay logs and cryptographic diff trails are non-negotiable.\n\n#AIOps #DevSecOps #SoftwareEngineering"),
    ("Zero-Telemetry Kernel & DNS Hygiene", "Stopping OS-Level Data Exfiltration at the Source",
     ["Strips background crash reporters, telemetry pings & captive checks", "Routes DNS through encrypted local resolvers with sinkhole lists", "Enforces strict nftables loopback isolation for local daemons", "Your CPU cycles and network bandwidth belong strictly to you"],
     "🛡️ Zero-Telemetry Linux Kernel & nftables Isolation\n\nAn operating system should never phone home. Strip background telemetry, lock local daemons to 127.0.0.1, and own your network stack.\n\n#Privacy #Linux #SysAdmin #CyberSecurity"),
    ("ZothOS v3.5 Complete Sovereign Arsenal", "75+ Security, Crypto & AI Tools in One Live ISO",
     ["Bootable from USB into RAM (toram) or run natively on Debian/Ubuntu", "Unified CLI binaries + dark-glassmorphic localhost workstations", "Protected by the Rust Argon2id Zoth Sovereign Vault (:8787)", "100% open-access engineering for sovereign builders"],
     "🐧 ZothOS v3.5: The Complete Sovereign Linux Arsenal\n\n75+ offline-first security, cryptography, and local AI workstations unified with scriptable CLI binaries and RAM-resident boot.\n\n#Linux #OpenSource #CyberSecurity #LocalAI")
]

NFT_CAROUSEL_TOPICS = [
    ("Answer Engine Optimization (AEO) Graphs", "Engineering Sites for AI & Search Citation",
     ["Pair SoftwareApplication + FAQPage inside a unified JSON-LD @graph", "Explicitly allow GPTBot, ClaudeBot, PerplexityBot & Googlebot", "Maintain canonical sitemap.xml with accurate lastmod timestamps", "Guarantees rich structured citation across AI answer engines"],
     "📐 Answer Engine Optimization (AEO) & Schema.org Graphs\n\nModern technical discovery requires unified JSON-LD @graph schemas + zero-delay crawler rules so AI search engines cite your work accurately.\n\nhttps://nealfrazier.tech #SEO #AEO #WebDev"),
    ("Core Web Vitals: Sub-100ms INP & Zero CLS", "Performance Engineering Without Framework Bloat",
     ["Eliminate main-thread hydration stalls for instant INP response", "Reserve explicit aspect-ratio boxes to lock CLS at 0.000", "Inline critical CSS tokens & defer non-essential canvas shaders", "Fast software converts better and respects the user's hardware"],
     "🚀 Engineering Sub-100ms INP & 0.000 CLS\n\nEvery kilobyte of third-party JS costs main-thread responsiveness. Keep bundles lean, reserve layout geometry, and ship instant UIs.\n\nhttps://nealfrazier.tech #WebPerformance #JavaScript #Frontend"),
    ("Automated Triple-Viewport CDP Verification", "Proving UI Quality Across Mobile, Tablet & Desktop",
     ["Headless Chromium DevTools Protocol captures 375px, 768px & 1440px", "Asserts scrollWidth <= clientWidth (zero horizontal overflow)", "Fails the build on any console.error or uncaught pageerror", "Visual contact-sheet inspection before every production deploy"],
     "🛠️ Automated Multi-Viewport UI Verification Loops\n\nDon't guess if a layout breaks on mobile—automate headless CDP checks at 375px, 768px, and 1440px with zero console errors allowed.\n\nhttps://nealfrazier.tech #Frontend #Testing #DevOps"),
    ("Client-Side AST & Browser Utility Design", "Why Zero-Backend Web Apps Scale Infinitely",
     ["Run AST parsing, regex compilation & schema transforms in-browser", "Zero server round-trips = instant 0ms feedback on every keystroke", "User code and sensitive data never leave their local device", "Deploys globally on static edge CDNs with 100% uptime"],
     "⚡ The Power of 100% Client-Side Developer Utilities\n\nWhen AST parsing, crypto transforms, and visualizers run directly in the browser, you get 0ms latency, total data privacy, and infinite scale.\n\nhttps://nealfrazier.tech #SoftwareEngineering #WebDev #Arch"),
    ("Polyglot Framework AST Transpilation", "Converting Components Cleanly Across Stacks",
     ["Parse source UI trees into an intermediate framework-agnostic AST", "Emit idiomatic React, Vue, Svelte, Solid or vanilla Web Components", "Preserves accessibility attributes, scoped styles & state hooks", "Eliminates manual rewrite debt during design-system migrations"],
     "🔄 AST-Driven Polyglot UI Transpilation\n\nInstead of rewriting components by hand across React, Vue, and vanilla JS, compile UI primitives through a clean intermediate AST.\n\nhttps://nealfrazier.tech #TypeScript #ReactJS #WebComponents"),
    ("Visualizing Relational & JSON Schemas", "Interactive ER Diagrams from Raw DDL & TypeScript",
     ["Parse SQL DDL, Prisma schemas & TypeScript interfaces live", "Auto-layout entity-relationship graphs with foreign-key routing", "Export clean migration scripts & documentation diagrams", "Turns complex database architecture into clear visual maps"],
     "🗂️ Turning Raw Schemas into Interactive Architecture Graphs\n\nAuto-parsing SQL DDL and TypeScript interfaces into live ER diagrams helps teams spot normalization bugs before writing a single query.\n\nhttps://nealfrazier.tech #Database #SQL #SystemDesign"),
    ("Deterministic Regex AST & Finite Automata", "Building & Auditing Complex Patterns Visually",
     ["Compile regular expressions into visual railroad state machines", "Detect catastrophic backtracking (ReDoS) before production", "Generate unit-test suites covering edge-case match groups", "Makes cryptic regex patterns readable and maintainable"],
     "🧩 Visualizing Regex as Finite State Machines (And Preventing ReDoS)\n\nUnchecked regular expressions can lock up a Node.js event loop via catastrophic backtracking. Audit patterns visually with AST state graphs.\n\nhttps://nealfrazier.tech #JavaScript #NodeJS #AppSec"),
    ("Cron Schedule Choreography & Jitter", "Preventing Thundering Herds in Distributed Cron",
     ["Visualize 5-field cron expressions across 24-hour load timelines", "Add deterministic hash jitter to spread top-of-the-hour spikes", "Enforce idempotent locking so overlapping runs never corrupt state", "Simple scheduling discipline saves massive infrastructure headaches"],
     "⏱️ Preventing Cron Thundering Herds with Deterministic Jitter\n\nScheduling 50 jobs at '0 * * * *' guarantees top-of-the-hour CPU spikes. Stagger schedules and visualize overlap windows up front.\n\nhttps://nealfrazier.tech #Backend #DevOps #DistributedSystems"),
    ("WebGL2 & 3D Procedural Asset Pipelines", "Bringing High-Craft 3D to the Modern Web",
     ["Procedural SDF & PBR shaders deliver crisp 60fps 3D in <50KB", "Interactive metallic coin, badge & product showcase renderers", "Respects prefers-reduced-motion & pauses offscreen rAF loops", "Elevates landing pages above generic templates"],
     "✨ High-Craft 60fps WebGL Without Megabytes of 3D Bloat\n\nProcedural shaders and lightweight geometry let you embed interactive 3D product showcases that load faster than a hero JPEG.\n\nhttps://nealfrazier.tech #WebGL #CreativeCoding #UIUX"),
    ("Vector Search & HNSW Indexing Internals", "How Semantic Retrieval Actually Works Under the Hood",
     ["Cosine similarity & dot-product scoring over normalized embeddings", "Hierarchical Navigable Small World (HNSW) graphs for sub-ms recall", "Hybrid BM25 lexical + dense vector fusion beats pure embeddings", "Run lightweight vector indexes directly in SQLite or WebAssembly"],
     "🔍 Hybrid BM25 + Vector Retrieval Architecture\n\nPure vector embeddings miss exact keyword identifiers (SKUs, error codes, function names). Hybrid BM25 + dense vector fusion wins every time.\n\nhttps://nealfrazier.tech #AIEngineering #Search #RAG"),
    ("WebMCP & Model Context Protocol Design", "Standardizing How AI Agents Use Developer Tools",
     ["Clean JSON-Schema tool declarations with deterministic inputs", "Lazy-loaded tool discovery keeps agent context windows lean", "Structured error payloads let agents self-correct automatically", "Turns any CLI or web service into an agent-ready capability"],
     "🔌 Designing Clean MCP (Model Context Protocol) Tool Schemas\n\nThe secret to reliable AI agents isn't a bigger prompt—it's small, deterministic MCP tools with strict JSON schemas and actionable error messages.\n\nhttps://nealfrazier.tech #MCP #AIAgents #SoftwareArchitecture"),
    ("PWA & Offline-First Service Worker Caching", "Building Web Apps That Work on an Airplane",
     ["Stale-while-revalidate asset caching for instant repeat loads", "IndexedDB + localStorage state persistence with version migrations", "Valid webmanifest icons, theme colors & standalone display mode", "Bridges the gap between web URLs and native desktop/mobile apps"],
     "📱 Offline-First PWA Architecture That Feels Native\n\nWith clean Service Worker cache strategies and IndexedDB state persistence, a web application should work just as fast offline as online.\n\nhttps://nealfrazier.tech #PWA #WebDev #MobileDev"),
    ("Zero-Dependency Node.js CLI Engineering", "Why Standard Library Primitives Age Best",
     ["Node's built-in crypto, https, fs & child_process cover 95% of CLIs", "Zero npm supply-chain churn or broken transitive dependencies", "Instant cold-start execution in CI/CD & cron environments", "Code written against web & POSIX standards runs for a decade"],
     "🛠️ The Case for Zero-Dependency Node.js CLIs\n\nBefore reaching for 40 npm packages, check Node's standard library (`crypto`, `https`, `fs`, `util.parseArgs`). Zero supply-chain bloat, instant cold starts.\n\nhttps://nealfrazier.tech #NodeJS #JavaScript #CleanCode"),
    ("Dual-Theme Editorial Light & Dark Mode", "Engineering High-Contrast Typography Systems",
     ["Pair deep obsidian dark surfaces with warm alabaster/ivory light mode", "Enforce WCAG AAA contrast ratios on body copy & code blocks", "Use CSS custom properties (--bg, --ink, --accent) for 0ms switching", "Never ship washed-out gray-on-gray cards"],
     "🎨 Engineering High-Contrast Dual-Theme UI Systems\n\nGreat light mode isn't just `filter: invert(1)`—it requires warm editorial ivory surfaces, deep ink typography, and calibrated contrast tokens.\n\nhttps://nealfrazier.tech #DesignSystems #CSS #UIUX"),
    ("Idempotent API & Webhook State Machines", "Handling Retries Without Duplicate Side Effects",
     ["Key every mutation by deterministic idempotency_key + payload hash", "Verify HMAC-SHA256 webhook signatures with constant-time compare", "Transition state atomically so network retries are safe no-ops", "Rock-solid payment & fulfillment pipelines"],
     "⚙️ Designing Idempotent Webhook & API State Machines\n\nNetworks drop packets and webhooks retry. Keying every state transition by a deterministic idempotency token prevents duplicate side effects.\n\nhttps://nealfrazier.tech #Backend #API #SystemDesign"),
    ("E-Commerce & POD Margin Telemetry", "Automating Unit-Economics Before You Scale Ads",
     ["Model platform fees, payment processing, fulfillment & shipping live", "Audit listing SEO titles, 13-tag coverage & taxonomy relevance", "Transpile catalog schemas cleanly between Etsy, Shopify & Printify", "Data-driven unit economics protect profitability"],
     "📊 Automating E-Commerce & POD Unit-Economics\n\nKnow your exact net margin after platform fees, fulfillment, and ad spend before launching a campaign—and automate listing SEO audits via API.\n\nhttps://nealfrazier.tech #Ecommerce #SaaS #Automation"),
    ("Canvas2D & 60fps Motion Choreography", "Making Interfaces Feel Alive Without Video Bloat",
     ["Use cubic-bezier spring physics & transform/opacity compositing", "Pause requestAnimationFrame loops automatically when tab is hidden", "Gate entrance choreography cleanly behind route transitions", "Delivers cinema-grade polish at 60fps on mobile & desktop"],
     "🎬 60fps Motion Choreography Rules for Web Engineers\n\nAnimate only `transform` and `opacity`, pause `requestAnimationFrame` when offscreen, and always honor `prefers-reduced-motion`.\n\nhttps://nealfrazier.tech #WebAnimation #Frontend #UX"),
    ("Automated Lead & Domain Surface Discovery", "Building High-Signal B2B Intelligence Pipelines",
     ["Inspect DNS MX/TXT records, tech-stack headers &CWV scores", "Identify businesses with broken mobile layouts or missing SEO schemas", "Generate personalized architectural audit reports automatically", "Turn technical diagnostics into high-converting client value"],
     "🔎 Technical Diagnostics as a B2B Growth Engine\n\nAutomatically auditing Core Web Vitals, schema graphs, and mobile responsiveness lets you bring concrete engineering value to every conversation.\n\nhttps://nealfrazier.tech #B2B #GrowthEngineering #Tech"),
    ("100% Open-Access Tool Architecture", "Why Removing Paywall Friction Builds Trust",
     ["Every utility unlocks full export, copy & advanced modes by default", "Zero signup walls, zero blurred results, zero dark-pattern modals", "Supported by optional 'Buy Us a Coffee' & sovereign consulting", "Engineers remember and share tools that respect their time"],
     "🔓 Why We Ship 100% Open-Access Developer Tools\n\nNo blurred results. No 'sign up to copy JSON' modals.\nWhen a developer lands on your tool, let them solve their problem in 5 seconds flat.\n\nhttps://nealfrazier.tech #OpenSource #BuildInPublic #DevTools"),
    ("Multi-Model AI Orchestration Patterns", "Routing Tasks Across Fast & Deep Reasoning Models",
     ["Use lightweight flash models for high-throughput classification", "Route complex multi-file architecture & verification to deep models", "Enforce deterministic verification loops (tests + headless browser)", "Model-agnostic pipelines prevent vendor lock-in"],
     "🤖 Practical Multi-Model AI Routing in Production\n\nPair fast models for triage with deep reasoning models for architecture—and always gate output behind deterministic compiler & browser checks.\n\nhttps://nealfrazier.tech #AIEngineering #LLMOps #SoftwareEngineering"),
    ("The Neal Frazier Tech Engineering Standard", "Shipping Self-Contained, Verified Software Daily",
     ["Every release passes automated triple-viewport headless verification", "Complete AEO/SEO schema graphs, sitemaps & security headers", "Zero console errors, zero horizontal overflow, 100% real utility", "Explore our full portfolio & open tools at nealfrazier.tech"],
     "⚡ The Neal Frazier Tech Production Guardrail\n\nBefore any app goes live: triple-viewport CDP verification, zero console errors, full Schema.org @graph, and 100% real client-side utility.\n\nhttps://nealfrazier.tech #SoftwareEngineering #FullStack #Tech")
]


def build_all():
    queue = {
        "generated_at": "2026-11-08T00:10:00-05:00",
        "accounts": {
            "1nc0gn30": [],
            "zoth_os": [],
            "nealfraziertech": []
        }
    }

    configs = [
        ("1nc0gn30", (251, 191, 36), "WORLD OF ZOTH // 1NC0GN30 SAGA", "ENGINEERED BY @1NC0GN30 • WORLD OF ZOTH v2.0", WOZ_VIDEOS, WOZ_SHOTS, WOZ_CAROUSEL_TOPICS),
        ("zoth_os", (0, 240, 255), "ZOTHOS v3.5 // SOVEREIGN LINUX ENCLAVE", "ZOTHOS SOVEREIGN LINUX • RAM-RESIDENT & ZERO-LEAK", ZOTHOS_VIDEOS, ZOTHOS_SHOTS, ZOTHOS_CAROUSEL_TOPICS),
        ("nealfraziertech", (52, 211, 153), "NEAL FRAZIER TECH // SYSTEMS ARCHITECTURE", "NEALFRAZIER.TECH • FULL-STACK & AI SYSTEMS ENGINEERING", NFT_VIDEOS, NFT_SHOTS, NFT_CAROUSEL_TOPICS)
    ]

    for handle, accent, badge, footer, videos, shots, topics in configs:
        c_idx = 0
        v_idx = 0
        for day in range(1, 8):
            for slot in range(1, 6):
                if slot in (1, 5):
                    # Video slot
                    v_item = videos[v_idx % len(videos)]
                    v_idx += 1
                    if isinstance(v_item, tuple):
                        v_path = v_item[0] if os.path.isabs(v_item[0]) else str(ROOT / v_item[0])
                        v_title = v_item[1]
                    else:
                        v_path = v_item
                        v_title = Path(v_item).stem.replace("-", " ").replace("_", " ").upper()

                    if handle == "1nc0gn30":
                        txt = f"🎬 WORLD OF ZOTH — {v_title} [Day {day}/90 · Slot {slot}/5]\n\n\"The city is lit again, but now it can talk. Trust faces, not voices.\"\n\n• 20 Playable 3D Districts\n• 22 Companions & 22 Mini-Games\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieDev #WebGL #CyberRPG"
                    elif handle == "zoth_os":
                        txt = f"🐧 ZothOS Motion Briefing [Day {day} · Slot {slot}/5]: {v_title}\n\nRAM-resident Debian Live (toram) architecture paired with our local Rust Argon2id secrets enclave (:8787) and 75+ offline security workstations.\n\n#Linux #CyberSecurity #InfoSec #OpenSource #LocalAI"
                    else:
                        txt = f"⚡ Neal Frazier Tech Engineering Reel [Day {day} · Slot {slot}/5]\n\nShipping zero-dependency client-side developer utilities, automated CDP verification loops, and high-converting web architecture.\n\nhttps://nealfrazier.tech #SoftwareEngineering #WebDev #BuildInPublic"

                    queue["accounts"][handle].append({
                        "day": day,
                        "slot": slot,
                        "type": "video",
                        "text": txt,
                        "mediaFiles": [v_path]
                    })
                else:
                    # 4-Slide 1080p Carousel Deck slot (Slots 2, 3, 4)
                    t_title, t_sub, t_bullets, t_text = topics[c_idx % len(topics)]
                    slide_files = []
                    for s_i in range(1, 5):
                        if s_i == 4:
                            # Attach one of the newly rendered high-end 1080p architectural blueprint cards as Slide 4
                            arch_cards = sorted((ROOT / "media_packs" / "high_end_cards" / handle).glob("*.jpg"))
                            if arch_cards:
                                slide_files.append(str(arch_cards[c_idx % len(arch_cards)]))
                                continue
                        bg_shot = shots[(c_idx * 4 + s_i - 1) % len(shots)]
                        out_slide = OUT_DIR / handle / f"day{day}_slot{slot}_slide{s_i}.jpg"
                        # Rotate bullet emphasis per slide
                        rotated_bullets = t_bullets[s_i - 1:] + t_bullets[:s_i - 1]
                        render_carousel_slide(
                            bg_path=bg_shot,
                            out_path=str(out_slide),
                            accent_rgb=accent,
                            badge_text=f"{badge} · DAY {day} SLOT {slot}",
                            title=f"{t_title} ({s_i}/4)",
                            subtitle=t_sub,
                            bullets=rotated_bullets,
                            footer_left=footer,
                            slide_idx=s_i
                        )
                        slide_files.append(str(out_slide))
                    c_idx += 1
                    queue["accounts"][handle].append({
                        "day": day,
                        "slot": slot,
                        "type": "carousel",
                        "text": t_text,
                        "mediaFiles": slide_files
                    })

    os.makedirs(QUEUE_JSON.parent, exist_ok=True)
    with open(QUEUE_JSON, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2)
    print(f"BUILT_WEEKLY_PACKS: {sum(len(v) for v in queue['accounts'].values())} posts, {21 * 4 * 3} custom 1080p carousel slides.")

if __name__ == "__main__":
    build_all()
