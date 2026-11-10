#!/usr/bin/env python3
"""
High-End 1080p Motion-Graphics Video & Architectural Blueprint Engine
Generates:
  1. 6 bespoke 1080p MP4 videos for @zoth_os (media_packs/videos/zoth_os/zothos_ep01..06.mp4)
  2. 6 bespoke 1080p MP4 videos for @nullaitech (media_packs/videos/nullaitech/nft_ep01..06.mp4)
  3. 36 high-end 1920x1080 multi-panel architectural infographic & code blueprint cards
     in media_packs/high_end_cards/{1nc0gn30,zoth_os,nullaitech}/
"""

import os
import math
import wave
import struct
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = Path("/home/zoth/Desktop/world-of-zoth")
VID_DIR = ROOT / "media_packs" / "videos"
CARD_DIR = ROOT / "media_packs" / "high_end_cards"

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

def get_font(size, bold=True):
    try:
        return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)
    except Exception:
        return ImageFont.load_default()

def synth_wav(wav_path, duration=14.0, base_freq=110.0, seed=1):
    sr = 44100
    total = int(sr * duration)
    scale = [1.0, 1.1892, 1.3348, 1.4983, 1.5874, 1.7818, 2.0]
    bpm = 136 + (seed % 4) * 4
    step_sec = (60.0 / bpm) / 4.0

    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        frames = bytearray(total * 2)
        for i in range(total):
            t = i / sr
            step = int(t / step_sec)
            phase = (t % step_sec) / step_sec

            kick_env = math.exp(-phase * 13.0) if (step % 4 == 0) else 0.0
            kick_f = 50.0 + 90.0 * math.exp(-phase * 26.0)
            kick = math.sin(2.0 * math.pi * kick_f * t) * kick_env * 0.42

            note = scale[(step * 3 + seed) % len(scale)]
            lead_f = base_freq * 2.0 * note
            lead_env = math.exp(-phase * 6.0)
            lead = (math.sin(2.0 * math.pi * lead_f * t) + 0.3 * math.sin(2.0 * math.pi * lead_f * 2.0 * t)) * lead_env * 0.22

            pad = math.sin(2.0 * math.pi * base_freq * t) * 0.15 + math.sin(2.0 * math.pi * base_freq * 1.4983 * t) * 0.10
            fade = min(1.0, t / 0.5, (duration - t) / 0.7)
            val = max(-0.95, min(0.95, (kick + lead + pad) * fade))
            struct.pack_into("<h", frames, i * 2, int(val * 32767))
        wf.writeframes(frames)

ZOTHOS_VIDEOS = [
    {
        "slug": "zothos_ep01_toram_boot.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 01 · AMNESIC TORAM ARCHITECTURE",
        "title": "Zero-Persistence RAM-Root Boot Pipeline",
        "sub": "Live Debian Bookworm SquashFS loaded 100% into volatile memory before init",
        "accent": (34, 211, 238),
        "freq": 110.0,
        "scenes": [
            ("STAGE 01 // ISOLINUX & GRUB2 HANDOFF", "boot=live toram quiet splash panic=10", "/home/zoth/nullaitech-upgrade/art-v2/zoth-os/zoth-os-hero-16x9.png",
             ["Kernel verifies SquashFS SHA-256 signature before mount", "Allocates tmpfs RAM block and copies filesystem.squashfs", "Physical NVMe/SATA controllers detached prior to systemd"]),
            ("STAGE 02 // VOLATILE OVERLAYFS ROOT", "mount -t overlay overlay -o lowerdir=/run/live/rootfs", "/home/zoth/nullaitech-upgrade/art-v2/zoth-os-website/zoth-os-website-hero-16x9.png",
             ["All runtime writes stay strictly inside volatile DDR4/DDR5 RAM", "Zero swap partition creation—hibernation & core dumps disabled", "Power-off triggers immediate cryptographic memory page scrub"]),
            ("STAGE 03 // 110 LOCAL CLI & MCP BINARIES", "/usr/local/bin/zoth-*  &&  systemctl status zoth-mcp", "/home/zoth/NullAITech/video-production/tool-69-zoth-os/thumbnail.jpg",
             ["110 sovereign developer & security CLI tools pre-linked in PATH", "Zero cloud telemetry daemons, zero background auto-updaters", "Download ISO & build scripts at github.com/1nc0gn30/zoth-os"])
        ]
    },
    {
        "slug": "zothos_ep02_enclave_vault.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 02 · SOVEREIGN CRYPTO ENCLAVE",
        "title": "Hardware-Bound Vault & Ephemeral Signing",
        "sub": "Ed25519 & XChaCha20-Poly1305 key derivation with zero plaintext disk residue",
        "accent": (74, 222, 128),
        "freq": 123.47,
        "scenes": [
            ("STAGE 01 // ARGON2ID + HKDF KEY SCHEDULE", "zoth-vault derive --kdf argon2id --mem 256M", "/home/zoth/nullaitech-upgrade/art-v2/envguard-secrets-vault/envguard-secrets-vault-hero-16x9.png",
             ["Master seed split via Shamir Secret Sharing (t=2, n=3)", "Keys reside strictly inside mlock() pinned kernel pages", "Automatic SIGKILL wipe if ptrace attach is attempted"]),
            ("STAGE 02 // ZERO-TRUST IPC & UNIX SOCKETS", "chmod 0700 ~/.config/zoth-vault && umask 0077", "/home/zoth/nullaitech-upgrade/art-v2/jwt-inspector-guard/jwt-inspector-guard-hero-16x9.png",
             ["Local daemons authenticate via SO_PEERCRED UID/PID inspection", "No TCP/IP ports exposed to LAN or WAN interfaces", "Sub-millisecond Ed25519 packet signing for air-gapped workflows"]),
            ("STAGE 03 // VERIFIED REPRODUCIBLE BUILDS", "sha256sum -c SHA256SUMS && gpg --verify SHA256SUMS.sig", "/home/zoth/NullAITech/video-production/tool-26-envguard-secrets-vault/thumbnail.jpg",
             ["Deterministic chroot hooks in config/includes.chroot/", "Full source auditability across every initramfs hook", "Engineered for sovereign security researchers & builders"])
        ]
    },
    {
        "slug": "zothos_ep03_ebpf_firewall.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 03 · XDP & EBPF PACKET SHIELD",
        "title": "Line-Rate XDP Telemetry Blocker & DNS Sinkhole",
        "sub": "Dropping unauthorized egress frames at the NIC driver ring buffer in <0.4us",
        "accent": (245, 184, 46),
        "freq": 98.0,
        "scenes": [
            ("STAGE 01 // NIC DRIVER XDP HOOK", "ip link set dev eth0 xdp obj zoth_xdp_drop.o sec xdp", "/home/zoth/nullaitech-upgrade/art-v2/anderson-security-sentinel/anderson-security-sentinel-hero-16x9.png",
             ["Inspects L3/L4 headers before sk_buff allocation in kernel", "Zero-copy XDP_DROP on known telemetry & tracker CIDRs", "Maintains 10Gbps+ throughput with <1% single-core CPU load"]),
            ("STAGE 02 // PER-PROCESS CGROUP SOCKET FILTER", "bpftool cgroup attach /sys/fs/cgroup/ egress pinned /sys/fs/bpf/egress", "/home/zoth/NullAITech/video-production/tool-06-agent-egress-sentinel/thumbnail.jpg",
             ["Whitelists outbound sockets per binary SHA-256 hash", "Blocks rogue npm/pip postinstall scripts from phoning home", "Real-time ringbuf audit stream inside terminal HUD"]),
            ("STAGE 03 // LOCAL DNSSEC & DOH RESOLVER", "unbound-control status && nft list ruleset", "/home/zoth/nullaitech-upgrade/art-v2/web-security-guard/web-security-guard-hero-16x9.png",
             ["Strict nftables output policy drops raw port 53 leaks", "All DNS queries validated locally with DNSSEC root trust anchor", "100% sovereign network perimeter out of the box"])
        ]
    },
    {
        "slug": "zothos_ep04_local_ai_daemon.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 04 · AIR-GAPPED NEURAL DAEMON",
        "title": "Local GGUF + STDP Neuro-Memory Engine (:8094)",
        "sub": "Zero-cloud code synthesis and spike-timing episodic memory on local silicon",
        "accent": (56, 189, 248),
        "freq": 130.81,
        "scenes": [
            ("STAGE 01 // MMAP QUANTIZED WEIGHT LOADING", "zoth-ai-daemon --mmap --threads 16 --ctx-size 32768", "/home/zoth/nullaitech-upgrade/art-v2/neuro-memory-daemon/neuro-memory-daemon-hero-16x9.png",
             ["Zero-copy mmap() shares quantized weights across worker processes", "AVX2 / AVX-512 / CUDA tensor dispatch with deterministic seeds", "Zero API keys, zero token bills, zero external data exfiltration"]),
            ("STAGE 02 // STDP HEBBIAN ENGRAM CONSOLIDATION", "zoth-memory query --top-k 8 --decay-tau 3600", "/home/zoth/Pictures/1nc0gn30-campaign/07-local-power.png",
             ["Spike-Timing-Dependent Plasticity reinforces active code paths", "Sub-2ms SQLite WAL + HNSW vector lookup on local loopback", "Bidirectional sync with local Markdown & JSON Canvas graphs"]),
            ("STAGE 03 // 110 NATIVE MCP & CLI TOOLS", "zoth-arsenal --list --json | jq '.tools | length'", "/home/zoth/Pictures/1nc0gn30-campaign/01-zothos-your-rules.png",
             ["Every ZothOS CLI tool exposes both --json and MCP stdio schemas", "Seamless orchestration from terminal or local IDE", "Built for high-velocity offline systems engineering"])
        ]
    },
    {
        "slug": "zothos_ep05_xcursor_plasma.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 05 · DETERMINISTIC DESKTOP HARDENING",
        "title": "Sub-Millisecond Window Compositing & Input Pipeline",
        "sub": "Custom X11/Wayland compositor tuning, binary Xcursor integrity & zero-latency HUD",
        "accent": (168, 85, 247),
        "freq": 146.83,
        "scenes": [
            ("STAGE 01 // ZERO-TEAR DRM/KMS ATOMIC MODESET", "KWIN_DRM_NO_AMS=0 vblank_mode=0 startx", "/home/zoth/Pictures/1nc0gn30-campaign/05-zothos-your-world.png",
             ["Direct scanout bypasses compositor for fullscreen WebGL & Vulkan", "Deterministic folder & panel layout provisioned via /etc/skel", "Hardware cursor plane fallback guarantees 100% VM & bare-metal parity"]),
            ("STAGE 02 // CALAMARES DUAL-MODE LIVE INSTALLER", "sudo calamares -d  # Live RAM or Bare-Metal NVMe", "/home/zoth/NullAITech/video-production/tool-74-zothos-lite/thumbnail.jpg",
             ["Boot amnesic in RAM or install to LUKS2 encrypted NVMe in 4 minutes", "Automated EFI System Partition + Btrfs subvolume snapshots", "Pre-configured udev rules for SDR, JTAG, and embedded UART probes"]),
            ("STAGE 03 // SOVEREIGN WORKSTATION ERGONOMICS", "zoth-doctor --verify-all", "/home/zoth/Pictures/1nc0gn30-campaign/04-no-kings.png",
             ["Instant hotkeys for terminal drop-down, packet capture & hex diff", "Dark obsidian visual theme engineered for 16-hour coding marathons", "100% open-source & free forever"])
        ]
    },
    {
        "slug": "zothos_ep06_arsenal_pipeline.mp4",
        "badge": "ZOTHOS LINUX // EPISODE 06 · 110-TOOL UNIX PIPELINE",
        "title": "Composable JSON-Out CLI Arsenal for Systems Engineers",
        "sub": "Pipe AST linters, hex dissectors, and zk-proof verifiers directly in bash",
        "accent": (34, 211, 238),
        "freq": 116.54,
        "scenes": [
            ("STAGE 01 // DETERMINISTIC JSON-OUT UNIX PIPELINES", "zoth-netscan --json | zoth-threat-matrix --stdin", "/home/zoth/NullAITech/video-production/tool-31-hexstrike-arsenal/thumbnail.jpg",
             ["Every tool supports --json, --quiet, and deterministic exit codes", "Zero bloated Electron wrappers required for core CLI workflows", "Dual-linked in /usr/local/bin and chroot ISO tree"]),
            ("STAGE 02 // REAL-TIME KERNEL & MEMORY TELEMETRY", "zoth-sysmon --interval 250ms --export-prom", "/home/zoth/nullaitech-upgrade/art-v2/payload-entropy-studio/payload-entropy-studio-hero-16x9.png",
             ["Tracks slab allocations, page faults, and NVMe IOPS in real time", "Detects anomalous syscall bursts via eBPF tracepoints", "Exports clean Markdown & JSON audit reports in 1 click"]),
            ("STAGE 03 // BOOT THE SOVEREIGN ISO TODAY", "git clone https://github.com/1nc0gn30/zoth-os", "/home/zoth/nullaitech-upgrade/art-v2/zoth-os/zoth-os-hero-16x9.png",
             ["Self-contained live-build pipeline builds a bootable hybrid ISO", "Runs on bare metal, QEMU/KVM, Proxmox, or USB Ventoy drives", "Follow @zoth_os for daily kernel & security engineering deep dives"])
        ]
    }
]

NFT_VIDEOS = [
    {
        "slug": "nft_ep01_zero_dep_architecture.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 01 · ZERO-DEPENDENCY WEB ARCHITECTURE",
        "title": "Why We Ship 60FPS WebGL & AST Tools Without 800MB node_modules",
        "sub": "Sub-50ms Cold Starts, Deterministic Bundles & 100% Client-Side Execution",
        "accent": (56, 189, 248),
        "freq": 123.47,
        "scenes": [
            ("PRINCIPLE 01 // ELIMINATE SUPPLY-CHAIN BLOAT", "du -sh dist/  # 3.5MB Total vs 840MB node_modules", "/home/zoth/nullaitech-upgrade/art-v2/cwv-speed-engine/cwv-speed-engine-hero-16x9.png",
             ["Every transitive npm dependency is a latency & supply-chain liability", "Native WebCrypto, WebAudio, Canvas2D & WebGL2 cover 99% of use cases", "Zero webpack/vite plugin breakage across 5-year maintenance horizons"]),
            ("PRINCIPLE 02 // 100% IN-BROWSER CLIENT COMPUTE", "window.crypto.subtle.digest('SHA-256', payload)", "/home/zoth/nullaitech-upgrade/art-v2/polyglot-framework-exporter/polyglot-framework-exporter-hero-16x9.png",
             ["AST parsing, shader compilation & binary packing run in the browser", "Zero server round-trips means 0ms network jitter and infinite scale", "User data never leaves their local browser memory space"]),
            ("PRINCIPLE 03 // VERIFIED TRIPLE-VIEWPORT GUARDRAILS", "node engine/site_guardrail.js https://nullai.tech", "/home/zoth/nullaitech-upgrade/art-v2/schema-illustrator-studio/schema-illustrator-studio-hero-16x9.png",
             ["Automated headless Chromium checks mobile (375px), tablet & 1080p", "Enforces zero console errors and zero horizontal scroll overflow", "Engineered by NullAI Platform • nullai.tech"])
        ]
    },
    {
        "slug": "nft_ep02_webgl_pbr_shaders.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 02 · PROCEDURAL PBR SHADER PIPELINE",
        "title": "Synthesizing Normal-Bump & Specular Maps in 4KB of GLSL",
        "sub": "How to replace 200MB of PNG textures with analytical FBM derivatives at 60fps",
        "accent": (245, 184, 46),
        "freq": 138.59,
        "scenes": [
            ("TECHNIQUE 01 // ANALYTICAL FBM HEIGHT DERIVATIVES", "vec3 n = normalize(vec3(dHx, dHy, 1.0 / bumpScale));", "/home/zoth/NullAITech/video-production/tool-71-reality-shader-forge/thumbnail.jpg",
             ["Computes central-difference surface gradients directly in fragment shader", "Zero texture VRAM fetches—scales cleanly to 4K retina displays", "2.3x relief depth with real-time directional point-light specular"]),
            ("TECHNIQUE 02 // DYNAMIC WETNESS & PUDDLE RIPPLES", "float ripple = sin(dist * 48.0 - uTime * 9.0) * exp(-dist * 4.0);", "/home/zoth/NullAITech/video-production/tool-36-nexus-3d-scene-studio/thumbnail.jpg",
             ["Concentric raindrop rings modulate roughness & mirror reflection", "Smoothstep puddle masks blend dry stone with specular water", "Runs at locked 60fps on integrated laptops and mobile GPUs"]),
            ("TECHNIQUE 03 // FRUSTUM & DISTANCE CULLING", "if (dot(toObj, camFwd) < -0.25) continue;", "/home/zoth/nullaitech-upgrade/art-v2/badge3d-coin-generator/badge3d-coin-generator-hero-16x9.png",
             ["Cuts draw calls by 68% in dense multi-tower procedural districts", "Maintains 16.6ms frame pacing even at 2.0x Hyper-Clock speed", "Full architectural breakdowns at nullai.tech"])
        ]
    },
    {
        "slug": "nft_ep03_aeo_schema_graph.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 03 · AEO & AI SEARCH ENGINEERING",
        "title": "Engineering JSON-LD Knowledge Graphs for AI Citation Engines",
        "sub": "How to structure WebApplication + FAQPage graphs for Perplexity, GPTBot & Claude",
        "accent": (74, 222, 128),
        "freq": 110.0,
        "scenes": [
            ("LAYER 01 // LINKED @GRAPH ENTITY TOPOLOGY", "\"@type\": [\"WebApplication\", \"SoftwareApplication\"]", "/home/zoth/nullaitech-upgrade/art-v2/aeo-graph-engine/aeo-graph-engine-hero-16x9.png",
             ["Connects Creator, Organization, SoftwareApplication & FAQPage nodes", "Declares explicit operatingSystem, applicationCategory & free Offer", "Gives LLM retrieval pipelines unambiguous machine-readable facts"]),
            ("LAYER 02 // ZERO-DELAY ROBOTS.TXT & CANONICAL SITEMAP", "User-agent: GPTBot / ClaudeBot / PerplexityBot -> Allow: /", "/home/zoth/NullAITech/video-production/tool-49-robots-txt-auditor/thumbnail.jpg",
             ["Explicitly whitelists frontier AI crawlers with Crawl-delay: 0", "Pairs semantic HTML5 landmarks with high-signal FAQ answers", "Eliminates JS-hydration black holes that blind crawler indexers"]),
            ("LAYER 03 // OPENGRAPH & HIGH-CONTRAST CARD DESIGN", "og:image 1920x1080 + twitter:card summary_large_image", "/home/zoth/NullAITech/video-production/tool-03-aeo-graph-engine/thumbnail.jpg",
             ["Every route ships with verified high-contrast social preview cards", "Boosts click-through rate across X, LinkedIn, and developer feeds", "Explore our open-access tools at nullai.tech"])
        ]
    },
    {
        "slug": "nft_ep04_webaudio_dsp_synth.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 04 · PROCEDURAL WEBAUDIO DSP",
        "title": "Synthesizing Multi-Track Soundtracks in Pure JavaScript",
        "sub": "Zero MP3 Assets: 144 BPM Drift-Phonk, FM Bells & Biquad Filter Envelopes",
        "accent": (244, 63, 94),
        "freq": 146.83,
        "scenes": [
            ("DSP STAGE 01 // SAMPLE-ACCURATE LOOKAHEAD SCHEDULER", "osc.start(audioCtx.currentTime + lookaheadSec);", "/home/zoth/nullaitech-upgrade/art-v2/cron-rhythm-studio/cron-rhythm-studio-hero-16x9.png",
             ["Decouples WebAudio clock scheduling from main-thread requestAnimationFrame", "Zero audio stutter even during heavy 3D scene transitions", "Supports live 16-step pattern editing and BPM modulation"]),
            ("DSP STAGE 02 // SUB-BASS PITCH ENVELOPE & FM COWBELL", "gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);", "/home/zoth/NullAITech/video-production/tool-19-cron-rhythm-studio/thumbnail.jpg",
             ["808 sub-bass uses rapid pitch-drop exponential ramps for punch", "Detuned dual-square wave + bandpass filter creates iconic phonk bell", "Adds 0 bytes of external audio file weight to the bundle"]),
            ("DSP STAGE 03 // PROCEDURAL FOLEY & UI MICRO-SONICS", "sfx('confirm') // 4ms tactile harmonic chirp", "/home/zoth/NullAITech/video-production/tool-68-zoth-math-pillar/thumbnail.jpg",
             ["Every button hover, parry, and terminal keystroke has bespoke DSP feedback", "Respects user mute preferences and browser autoplay policies cleanly", "Engineered by NullAI Platform • 1nc0gn30.si"])
        ]
    },
    {
        "slug": "nft_ep05_headless_cdp_qa.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 05 · DETERMINISTIC VISUAL QA LOOP",
        "title": "Zero-Flake UI Verification with Headless CDP & Time-Stepping",
        "sub": "Why we banned sleep(3000) in favor of deterministic frame-stepping harnesses",
        "accent": (34, 211, 238),
        "freq": 130.81,
        "scenes": [
            ("HARNESS 01 // DETERMINISTIC SIMULATION HOOKS", "window.WOZ.step(60); const img = window.WOZ.frame();", "/home/zoth/nullaitech-upgrade/art-v2/regex-droid-builder/regex-droid-builder-hero-16x9.png",
             ["Exposes explicit step(frames) hook so tests advance virtual time", "Renders exact animation keyframes in 40ms instead of waiting wall-clock", "100% reproducible visual snapshots across CI and local workstations"]),
            ("HARNESS 02 // TRIPLE-VIEWPORT GEOMETRY AUDIT", "scrollWidth <= clientWidth && consoleErrors.length === 0", "/home/zoth/NullAITech/video-production/tool-59-webmcp-protocol-inspector/thumbnail.jpg",
             ["Automatically sweeps 375x812 mobile, 768x1024 tablet & 1920x1080 desktop", "Detects clipped labels, overlapping HUD bars, and broken images", "Blocks deployment if any runtime exception or 404 resource occurs"]),
            ("HARNESS 03 // AUTOMATED MP4 SHOWREEL PIPELINE", "ffmpeg -f image2pipe -i - -i synth.wav -c:v libx264 out.mp4", "/home/zoth/NullAITech/video-production/tool-70-zoth-webgen/thumbnail.jpg",
             ["Pipes live WebGL canvas frames + procedural WAV audio into ffmpeg", "Generates broadcast-ready 1080p MP4 trailers in seconds", "Follow @1nc0gn30 for production engineering blueprints"])
        ]
    },
    {
        "slug": "nft_ep06_open_access_micro_saas.mp4",
        "badge": "NULLAI PLATFORM // EPISODE 06 · OPEN-ACCESS PRODUCT ARCHITECTURE",
        "title": "Why 100% Unlocked Utility Beats Paywall Funnels in 2026",
        "sub": "Zero Login Walls, Zero Blur Locks, Instant Value & Voluntary Creator Support",
        "accent": (245, 184, 46),
        "freq": 116.54,
        "scenes": [
            ("MODEL 01 // ZERO FRICTION = 10X ORGANIC RETENTION", "Time-to-First-Action: 0.4 Seconds (No Signup Modal)", "/home/zoth/nullaitech-upgrade/art-v2/city-desk/city-desk-hero-16x9.png",
             ["Developers bounce in <3 seconds when hit with a credit-card wall", "Opening directly into an active multi-pane workstation maximizes trust", "Full export, copy, and CLI features work out of the box"]),
            ("MODEL 02 // ZERO-BACKEND COST STRUCTURE", "Static Edge CDN + 100% Client-Side Compute = $0/mo Infra", "/home/zoth/nullaitech-upgrade/art-v2/subsweep-lead-scanner/subsweep-lead-scanner-hero-16x9.png",
             ["Running AST, crypto, and WebGL on the client eliminates GPU server bills", "Allows every tool to remain 100% free and open-access indefinitely", "Immune to database breaches or traffic-spike downtime"]),
            ("MODEL 03 // CLEAN VOLUNTARY SUPPORT RAILS", "☕ Buy Us a Coffee • Engineered by NullAI Platform", "/home/zoth/NullAITech/video-production/tool-56-vector-search-engine/thumbnail.jpg",
             ["Non-intrusive support link lets power users tip when they get value", "Builds long-term reputation across nullai.tech & 1nc0gn30.si", "Try our full suite of open developer tools today"])
        ]
    }
]

_BG_CACHE = {}

def get_cached_scene_assets(bg_path, W, H, rw):
    if not bg_path or not os.path.exists(bg_path):
        return None, None
    if bg_path not in _BG_CACHE:
        try:
            src = Image.open(bg_path).convert("RGB")
            bw, bh = src.size
            scale = max(W / bw, H / bh)
            nw, nh = int(bw * scale), int(bh * scale)
            bg = src.resize((nw, nh), Image.Resampling.BILINEAR)
            ox, oy = (nw - W) // 2, (nh - H) // 2
            bg = bg.crop((ox, oy, ox + W, oy + H))
            bg = bg.filter(ImageFilter.GaussianBlur(radius=24))
            bg = ImageEnhance.Brightness(bg).enhance(0.20)

            iw = rw - 44
            ih = int(iw * 9 / 16)
            inset = src.resize((iw, ih), Image.Resampling.LANCZOS)
            _BG_CACHE[bg_path] = (bg, inset)
        except Exception:
            _BG_CACHE[bg_path] = (None, None)
    return _BG_CACHE[bg_path]

def render_video_frame(W, H, accent, badge, main_title, main_sub, scene, scene_idx, total_scenes, u, global_t, footer_brand):
    sc_tag, sc_code, bg_path, bullets = scene
    rx, ry, rw, rh = 980, 110, 880, 860
    cached_bg, cached_inset = get_cached_scene_assets(bg_path, W, H, rw)
    if cached_bg is not None:
        base = cached_bg.copy()
    else:
        base = Image.new("RGB", (W, H), (7, 9, 14))

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Animated cyber grid lines in background
    grid_offset = int((global_t * 45) % 80)
    for gx in range(grid_offset, W, 80):
        draw.line([(gx, 70), (gx, H - 72)], fill=(*accent, 18), width=1)
    for gy in range(70 + (grid_offset % 60), H - 72, 60):
        draw.line([(0, gy), (W, gy)], fill=(*accent, 14), width=1)

    # Top & Bottom bars
    draw.rectangle([0, 0, W, 68], fill=(5, 7, 11, 248))
    draw.rectangle([0, H - 72, W, H], fill=(5, 7, 11, 248))
    draw.rectangle([0, 68, W, 71], fill=(*accent, 235))
    draw.rectangle([0, H - 75, W, H - 72], fill=(*accent, 235))

    # Progress bar along top accent line
    prog_w = int(W * ((scene_idx + u) / total_scenes))
    draw.rectangle([0, 65, prog_w, 71], fill=(255, 255, 255, 255))

    # Left architectural panel
    lx, ly, lw, lh = 60, 110, 880, 860
    draw.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=18, fill=(10, 14, 22, 246), outline=(*accent, 225), width=3)

    # Right live visual & waveform panel
    draw.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=18, fill=(10, 14, 22, 246), outline=(*accent, 210), width=3)

    if cached_inset is not None:
        try:
            iw, ih = cached_inset.size
            ix, iy = rx + 22, ry + 48
            comp = Image.alpha_composite(base.convert("RGBA"), overlay)
            comp.paste(cached_inset.convert("RGBA"), (ix, iy))
            base = comp.convert("RGB")
            overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            draw.rounded_rectangle([ix - 3, iy - 3, ix + iw + 3, iy + ih + 3], radius=10, outline=(*accent, 240), width=2)

            # Animated oscilloscope / telemetry box below screenshot
            scope_y = iy + ih + 26
            scope_h = ry + rh - scope_y - 26
            draw.rounded_rectangle([ix, scope_y, ix + iw, scope_y + scope_h], radius=12, fill=(14, 19, 30, 248), outline=(60, 75, 100, 210), width=2)
            f_sh = get_font(19, True)
            draw.text((ix + 22, scope_y + 18), f"LIVE DSP & TELEMETRY WAVEFORM // SCENE 0{scene_idx+1}/0{total_scenes}", font=f_sh, fill=accent)

            # Draw animated waveform bars
            num_bars = 48
            bar_w = 11
            gap = 6
            start_bx = ix + 24
            mid_by = scope_y + scope_h // 2 + 18
            for bi in range(num_bars):
                amp = (
                    0.45 * math.sin(global_t * 9.0 + bi * 0.42)
                    + 0.35 * math.cos(global_t * 14.0 - bi * 0.27)
                    + 0.20 * math.sin(global_t * 5.0 + bi * 0.9)
                )
                bh_px = max(6, int(abs(amp) * (scope_h * 0.55)))
                bx0 = start_bx + bi * (bar_w + gap)
                if bx0 + bar_w < ix + iw - 20:
                    col = accent if (bi % 4 != 0) else (255, 255, 255)
                    draw.rounded_rectangle([bx0, mid_by - bh_px, bx0 + bar_w, mid_by + bh_px], radius=3, fill=(*col, 220))
        except Exception:
            pass

    f_hud = get_font(19, True)
    f_tag = get_font(20, True)
    f_title = get_font(34, True)
    f_sub = get_font(20, False)
    f_code = get_font(19, True)
    f_bul = get_font(21, False)

    # Top & Bottom HUD text
    draw.text((60, 22), badge, font=f_hud, fill=accent)
    draw.text((W - 420, 22), f"● REC 1080P // T+{global_t:05.2f}s", font=f_hud, fill=(74, 222, 128))
    draw.text((60, H - 48), footer_brand, font=f_hud, fill=(215, 222, 235))
    draw.text((W - 470, H - 48), "100% OPEN-ACCESS SOVEREIGN ENGINEERING", font=f_hud, fill=accent)

    # Left card content
    draw.rounded_rectangle([lx + 34, ly + 34, lx + lw - 34, ly + 82], radius=8, fill=(*accent, 34), outline=(*accent, 190), width=2)
    draw.text((lx + 52, ly + 46), sc_tag, font=f_tag, fill=accent)

    # Wrap main title (max 2 lines)
    words = main_title.split()
    lines, cur = [], ""
    for w in words:
        t_str = (cur + " " + w).strip()
        if len(t_str) <= 36:
            cur = t_str
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)

    ty = ly + 108
    for ln in lines[:2]:
        draw.text((lx + 36, ty), ln, font=f_title, fill=(245, 248, 252))
        ty += 46

    draw.text((lx + 36, ty + 6), main_sub[:62], font=f_sub, fill=(175, 190, 212))

    # Terminal command box
    cy = ty + 54
    draw.rounded_rectangle([lx + 36, cy, lx + lw - 36, cy + 72], radius=10, fill=(6, 9, 15, 252), outline=(70, 85, 110, 220), width=2)
    # Typewriter reveal on command
    reveal_chars = max(8, int(len(sc_code) * min(1.0, u * 1.6)))
    cmd_shown = sc_code[:reveal_chars] + ("█" if int(global_t * 6) % 2 == 0 else "")
    draw.text((lx + 54, cy + 23), f"$ {cmd_shown}", font=f_code, fill=(74, 222, 128))

    # Bullets
    by = cy + 102
    for b_idx, b_txt in enumerate(bullets):
        appear = max(0.0, min(1.0, (u - b_idx * 0.16) * 3.2))
        if appear <= 0.02:
            continue
        alpha = int(245 * appear)
        draw.rounded_rectangle([lx + 36, by, lx + lw - 36, by + 132], radius=12, fill=(16, 22, 34, alpha), outline=(*accent, int(170 * appear)), width=2)
        draw.text((lx + 58, by + 20), f"0{b_idx+1} // VERIFIED INVARIANT", font=f_hud, fill=(*accent, alpha))
        # Wrap bullet text
        b_words = b_txt.split()
        b_lines, b_cur = [], ""
        for bw_word in b_words:
            cand = (b_cur + " " + bw_word).strip()
            if len(cand) <= 52:
                b_cur = cand
            else:
                b_lines.append(b_cur)
                b_cur = bw_word
        if b_cur:
            b_lines.append(b_cur)
        for li, bln in enumerate(b_lines[:2]):
            draw.text((lx + 58, by + 56 + li * 30), bln, font=f_bul, fill=(235, 240, 248, alpha))
        by += 152

    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")

def build_video_pack(spec, out_folder, footer_brand, seed):
    out_folder.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_folder / spec["slug"]
    wav_path = Path(f"/tmp/vid_audio_{seed}.wav")
    fps = 20
    sec_per_scene = 4.5
    scenes = spec["scenes"]
    total_dur = len(scenes) * sec_per_scene
    total_frames = int(total_dur * fps)

    synth_wav(wav_path, duration=total_dur, base_freq=spec["freq"], seed=seed)

    cmd = [
        "/usr/bin/ffmpeg", "-y",
        "-f", "image2pipe", "-vcodec", "mjpeg", "-r", str(fps), "-i", "-",
        "-i", str(wav_path),
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(out_mp4)
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for f in range(total_frames):
        t = f / fps
        sc_idx = min(len(scenes) - 1, int(t // sec_per_scene))
        u = (t - sc_idx * sec_per_scene) / sec_per_scene
        img = render_video_frame(
            1920, 1080,
            spec["accent"], spec["badge"], spec["title"], spec["sub"],
            scenes[sc_idx], sc_idx, len(scenes), u, t, footer_brand
        )
        import io
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        proc.stdin.write(buf.getvalue())
        if f == 25 and seed in (1, 7):
            img.save(f"/tmp/verify_brand_vid_{seed}.jpg", format="JPEG", quality=92)

    proc.stdin.close()
    proc.wait()
    if wav_path.exists():
        wav_path.unlink()
    sz_mb = out_mp4.stat().st_size / (1024 * 1024)
    print(f"  ✓ Rendered {out_mp4.relative_to(ROOT)} ({sz_mb:.2f} MB)")

def build_high_end_infographics():
    """
    Renders 36 bespoke 1920x1080 Architectural Blueprint & Multi-Panel Infographics
    (12 for @1nc0gn30, 12 for @zoth_os, 12 for @nullaitech)
    """
    specs = {
        "1nc0gn30": [
            ("woz_arch_01_engine.jpg", (245, 184, 46), "WORLD OF ZOTH // ENGINE ARCHITECTURE BLUEPRINT #01",
             "How 20 3D Districts & 36 Movies Fit in 3.5MB", "Zero External Assets · Procedural GLSL Bump · WebAudio Synth",
             "/home/zoth/Desktop/world-of-zoth/shots/z_citadel.png",
             [("3D RENDERING", "2.3x Analytical FBM Normal-Bump + Specular Wetness"),
              ("AUDIO ENGINE", "144 BPM Drift-Phonk & 16-Step Chiptune WebAudio DSP"),
              ("CINEMA HUB", "36 Full-Length 3D Theatrical Commercials (Season I–III)"),
              ("ZERO PAYWALLS", "100% Free & Offline-First on Browser + Android APK")],
             "LAUNCH CINEMA: commercial.html?ep=25  //  HOTKEY [M]"),
            ("woz_arch_02_pantheon.jpg", (34, 211, 238), "WORLD OF ZOTH // PANTHEON SQUAD DOSSIER #02",
             "22 Playable Companions & Dual-Tech Union Combos", "Recruit Every Ally with Zero Gacha & Zero Microtransactions",
             "/home/zoth/Desktop/world-of-zoth/shots/z_astral.png",
             [("VANGUARD SQUAD", "1nc0gn30, Kitsune, Kai, Onyx, Ignis, Lycan & Draco"),
              ("CRYPTO & LORE", "Athena, Vigil, Chronos, 03ng0cn1, Ghostbyte & Aether"),
              ("FAMILIAR UNIT", "Pixel-Shiba, Pixel-Neko, Kraken, Leviathan & Aquila"),
              ("UNION SKILLS", "Timed [SPACE] Rhythm Parries & 3x Overdrive Chains")],
             "OPEN PARTY MATRIX: [P] KEY  //  32-CARD TRIAD BINDER"),
            ("woz_arch_03_districts.jpg", (74, 222, 128), "WORLD OF ZOTH // 20-DISTRICT WORLD ATLAS #03",
             "From Relit City (LV 01) to The Dawn Horizon (LV 45)", "Instant Fast-Travel Across 20 Normal-Mapped 3D Sectors",
             "/home/zoth/Desktop/world-of-zoth/shots/z_horizon.png",
             [("ACT I SECTORS", "Relit City, Whispering Rest Woods, Hollow & Fiber Tunnels"),
              ("ACT II SECTORS", "Sand Clocktower, Doom-Fire Foundry, Mirrors & Deep Water"),
              ("ACT III SECTORS", "Mode-7 Skyline, Sub-Lattice Abyss, Citadel & Null Core"),
              ("ENDGAME SECTORS", "Quantum Loom, Chrono-Vault, Astral Spire & Dawn Horizon")],
             "OPEN 20-DISTRICT ATLAS: [M] -> WORLD ATLAS"),
            ("woz_arch_04_arcade.jpg", (244, 63, 94), "WORLD OF ZOTH // 22-CABINET ARCADE MEGAPLEX #04",
             "22 Playable Retro & Cyber Arcade Games Inside One RPG", "Every Cabinet Pays Out Free Bits Directly Into Your Run",
             "/home/zoth/Desktop/world-of-zoth/shots/z_hub.png",
             [("ACTION CABINETS", "Galaga Skybeam Interceptor, Vector Tank & Asteroids"),
              ("PUZZLE CABINETS", "Quantum 5x5 Wave Collapse, 6x6 Laser Router & Hex Cracker"),
              ("CARD & RHYTHM", "Pantheon Triad 3x3 Card Battles & 4-Track Rhythm Sync"),
              ("CLASSIC CABINETS", "Cyber-Pong Overdrive, Breakout, Snake & Conway Glider")],
             "LAUNCH ARCADE MEGAPLEX: SAFEHOUSE TERMINAL"),
            ("woz_arch_05_season3.jpg", (245, 184, 46), "WORLD OF ZOTH // SEASON III CINEMA ANTHOLOGY #05",
             "Episodes XXV–XXXVI: The Zero-Knowledge Citadel Trilogy", "12 Brand-New 1080p Theatrical Commercials Now Streaming",
             "/home/zoth/Desktop/world-of-zoth/shots/z_rooftop.png",
             [("EP XXV–XXVII", "Citadel of Archon-0, Abyssal Memory & 140 BPM Fiber"),
              ("EP XXVIII–XXX", "Great Slumber Tree, Mode-7 Intercept & Chrono-Orrery"),
              ("EP XXXI–XXXIII", "Physarum Bio-Router, Crucible of Lycan & 3.5MB Engine"),
              ("EP XXXIV–XXXVI", "Zero-Paywall Manifesto, Eve of 06:13 & Trilogy Finale")],
             "STREAM ALL 36 FILMS: commercial.html"),
            ("woz_arch_06_academy.jpg", (56, 189, 248), "WORLD OF ZOTH // NULL ACADEMY CURRICULUM #06",
             "Learn Real AI Security & Zero-Knowledge Proofs in Game", "Interactive Prompt-Injection Defense & Cryptographic Challenges",
             "/home/zoth/Desktop/world-of-zoth/shots/z_loom.png",
             [("MODULE 01", "Voice Deepfake Detection: Trust Faces, Not Voices"),
              ("MODULE 02", "Adversarial Prompt-Injection Firewall & Token Sanitization"),
              ("MODULE 03", "Zero-Knowledge Schnorr & Merkle Tree Proof Verification"),
              ("MODULE 04", "Hilbert Curve Routing & Physarum Network Resilience")],
             "ENTER NULL ACADEMY: RELIT CITY NORTH GATE"),
            ("woz_arch_07_foundry.jpg", (245, 184, 46), "WORLD OF ZOTH // ZGL 3D MATERIAL & BLUEPRINT STUDIO #07",
             "Live PBR Relief Sliders, Weather & Custom Scene Director", "Tune Normal-Bump Depth, Monsoon Rain & Camera Dolly Curves",
             "/home/zoth/Desktop/world-of-zoth/shots/z_foundry.png",
             [("RELIEF SHADER", "Dial FBM Normal-Bump depth from 0% to 250% in real time"),
              ("MONSOON ENGINE", "Toggle Heavy Cyber-Rain, Puddle Ripples & Golden Sunrise"),
              ("SCENE DIRECTOR", "Choreograph custom 3D camera cuts and squad dialogue"),
              ("THEME FORGER", "Customize HUD palettes and export PNG Operator Passports")],
             "OPEN ZGL STUDIO: OMEGA FOUNDRY TERMINAL"),
            ("woz_arch_08_combat.jpg", (244, 63, 94), "WORLD OF ZOTH // 99-FLOOR INFINITE STACK & BOSS RUSH #08",
             "2.0x Hyper-Clock Speedruns & AI-vs-AI Spectator Colosseum", "Test Your Squad Build Against ARCHON-0 and >_ (Blank Cursor)",
             "/home/zoth/Desktop/world-of-zoth/shots/z_skyline.png",
             [("INFINITE STACK", "99 procedural floors with scaling Challenge Skulls"),
              ("COLOSSEUM WAGER", "Spectate autonomous AI vs AI squad battles for free Bits"),
              ("HYPER-CLOCK [V]", "Toggle 1.0x / 1.5x / 2.0x simulation speed at any time"),
              ("BOSS GAUNTLET", "Relay 4, Sandglass, The Hunter, >_ & Archon-0")],
             "PRESS [V] FOR 2.0X TURBO  //  ENTER CITADEL ARENA"),
        ],
        "zoth_os": [
            ("zos_arch_01_toram.jpg", (34, 211, 238), "ZOTHOS LINUX // KERNEL & BOOT ARCHITECTURE #01",
             "Amnesic toram Live-Boot & Volatile OverlayFS Pipeline", "Zero Forensic Disk Traces · Verified SHA-256 SquashFS Image",
             "/home/zoth/nullaitech-upgrade/art-v2/zoth-os/zoth-os-hero-16x9.png",
             [("TORAM STAGE", "Copies entire SquashFS root image into DDR4/DDR5 RAM at boot"),
              ("OVERLAYFS", "Mounts read-only lowerdir with volatile tmpfs upperdir"),
              ("DISK ISOLATION", "Unmounts physical NVMe/SATA block devices before login"),
              ("COLD WIPE", "Instant memory page scrub on shutdown or power loss")],
             "BOOT PARAM: boot=live toram quiet splash"),
            ("zos_arch_02_vault.jpg", (74, 222, 128), "ZOTHOS LINUX // SOVEREIGN CRYPTO ENCLAVE #02",
             "Hardware-Pinned Key Derivation & 0600 Vault Isolation", "Argon2id + XChaCha20-Poly1305 + Ed25519 Signing Pipeline",
             "/home/zoth/nullaitech-upgrade/art-v2/envguard-secrets-vault/envguard-secrets-vault-hero-16x9.png",
             [("MLOCK PAGES", "Cryptographic keys pinned in non-swappable kernel RAM"),
              ("STRICT PERMS", "Enforces 0700 directory & 0600 keyfile permissions"),
              ("PTRACE GUARD", "Blocks unauthorized process memory inspection via Yama LSM"),
              ("AIR-GAP SIGN", "Deterministic offline transaction & binary signature verification")],
             "CLI: zoth-vault status --verify-perms"),
            ("zos_arch_03_ebpf.jpg", (245, 184, 46), "ZOTHOS LINUX // XDP & EBPF NETWORK PERIMETER #03",
             "Sub-Microsecond Packet Filtering at the NIC Ring Buffer", "Zero Telemetry Egress · Local DNSSEC · Cgroup Socket Whitelists",
             "/home/zoth/nullaitech-upgrade/art-v2/anderson-security-sentinel/anderson-security-sentinel-hero-16x9.png",
             [("XDP_DROP", "Drops tracker & telemetry packets before sk_buff allocation"),
              ("CGROUP EGRESS", "Per-binary outbound socket policy enforced via eBPF"),
              ("NFTABLES LOCK", "Strict default-drop on unauthorized outbound UDP/TCP ports"),
              ("DNSSEC LOCAL", "Zero plaintext upstream DNS leaks across all interfaces")],
             "CLI: zoth-netguard --ebpf-status --json"),
            ("zos_arch_04_arsenal.jpg", (56, 189, 248), "ZOTHOS LINUX // 110-TOOL SOVEREIGN CLI ARSENAL #04",
             "Dual-Linked /usr/local/bin & MCP Stdio Developer Binaries", "Composable UNIX JSON Pipelines for Security & Systems Auditing",
             "/home/zoth/Pictures/1nc0gn30-campaign/01-zothos-your-rules.png",
             [("JSON-FIRST CLI", "Every tool supports --json, --help, and clean exit codes"),
              ("PATH PARITY", "Synchronized across /usr/local/bin and chroot ISO tree"),
              ("MCP STDIO", "Zero-config Model Context Protocol integration for local agents"),
              ("OFFLINE DOCS", "Built-in man pages and interactive terminal examples")],
             "CLI: which -a zoth-arsenal && zoth-arsenal --json"),
            ("zos_arch_05_installer.jpg", (168, 85, 247), "ZOTHOS LINUX // DUAL-MODE CALAMARES INSTALLER #05",
             "Run Amnesic in RAM or Install to LUKS2 Encrypted NVMe", "4-Minute Bare-Metal Provisioning with Btrfs Rollback Snapshots",
             "/home/zoth/nullaitech-upgrade/art-v2/zoth-os-website/zoth-os-website-hero-16x9.png",
             [("LIVE RAM MODE", "Zero-install forensic & emergency recovery workstation"),
              ("LUKS2 NVME", "Full-disk PBKDF2/Argon2id encryption for bare-metal installs"),
              ("DETERMINISTIC SKEL", "Pre-hardened desktop, terminal, and cursor configuration"),
              ("VM & BARE METAL", "Tested on QEMU/KVM, VirtualBox, Proxmox & ThinkPad/Ryzen")],
             "BUILD ISO: sudo bash build_zothos_iso.sh"),
            ("zos_arch_06_neuro.jpg", (34, 211, 238), "ZOTHOS LINUX // LOCAL NEURO-MEMORY DAEMON #06",
             "Spike-Timing-Dependent Plasticity (STDP) on Loopback :8094", "100% Private Episodic Memory & Local Knowledge Graph Compiler",
             "/home/zoth/nullaitech-upgrade/art-v2/neuro-memory-daemon/neuro-memory-daemon-hero-16x9.png",
             [("HEBBIAN DECAY", "Automatically strengthens frequently accessed code engrams"),
              ("SQLITE WAL", "Sub-2ms local vector & full-text retrieval with zero cloud APIs"),
              ("OBSIDIAN SYNC", "Compiles Markdown notes & JSON Canvas architecture maps"),
              ("ZERO TELEMETRY", "100% bound to 127.0.0.1—your code never leaves your machine")],
             "DAEMON: curl -s http://127.0.0.1:8094/health | jq"),
            ("zos_arch_07_hardening.jpg", (74, 222, 128), "ZOTHOS LINUX // SYSCTL & KERNEL HARDENING PROFILE #07",
             "Pre-Applied KSPP & CIS Kernel Security Parameters", "Mitigating Kernel Pointer Leaks, BPF JIT Spray & Spectre/Meltdown",
             "/home/zoth/nullaitech-upgrade/art-v2/web-security-guard/web-security-guard-hero-16x9.png",
             [("KPTR_RESTRICT", "kernel.kptr_restrict=2 & dmesg_restrict=1 enabled by default"),
              ("UNPRIV_BPF", "kernel.unprivileged_bpf_disabled=1 blocks rogue JIT exploits"),
              ("SYNCOOKIES", "net.ipv4.tcp_syncookies=1 & strict rp_filter anti-spoofing"),
              ("CORE DUMPS", "fs.suid_dumpable=0 prevents credential leakage in crash dumps")],
             "VERIFY: sudo sysctl --system | grep zoth-hardening"),
            ("zos_arch_08_iso_pipeline.jpg", (245, 184, 46), "ZOTHOS LINUX // REPRODUCIBLE LIVE-BUILD PIPELINE #08",
             "From Clean Debian Chroot to Hybrid UEFI/BIOS Bootable ISO", "Auditable Hook Scripts, Custom DEB Packages & Xcursor Verification",
             "/home/zoth/Pictures/1nc0gn30-campaign/05-zothos-your-world.png",
             [("CHROOT HOOKS", "Modular .hook.chroot scripts configure services deterministically"),
              ("HYBRID MBR/GPT", "isohybrid + grub-efi boots seamlessly on legacy BIOS & UEFI"),
              ("ASSET INTEGRITY", "Automated pre-flight check validates icons, cursors & binaries"),
              ("OPEN SOURCE", "Clone, audit, and customize at github.com/1nc0gn30/zoth-os")],
             "REPO: github.com/1nc0gn30/zoth-os"),
        ],
        "nullaitech": [
            ("nft_arch_01_zerodep.jpg", (56, 189, 248), "NULLAI PLATFORM // SYSTEMS BLUEPRINT #01",
             "Zero-Dependency Client-Side Web Application Architecture", "Shipping Instant-Load Tools Without Backend Server Fragility",
             "/home/zoth/nullaitech-upgrade/art-v2/cwv-speed-engine/cwv-speed-engine-hero-16x9.png",
             [("SUB-50MS LOAD", "Zero framework hydration tax—opens directly into active workspace"),
              ("CLIENT COMPUTE", "AST parsing, cryptography & WebGL run 100% in user's browser"),
              ("ZERO CLOUD BILL", "Static edge delivery eliminates runaway API & database costs"),
              ("PRIVACY BY DESIGN", "Zero user payloads ever transmitted to external servers")],
             "PORTFOLIO & TOOLS: https://nullai.tech"),
            ("nft_arch_02_guardrail.jpg", (74, 222, 128), "NULLAI PLATFORM // PRODUCTION QA GUARDRAIL #02",
             "The 8-Point Pre-Deployment Verification Protocol", "How We Guarantee Zero Console Errors Across Mobile, Tablet & Desktop",
             "/home/zoth/nullaitech-upgrade/art-v2/schema-illustrator-studio/schema-illustrator-studio-hero-16x9.png",
             [("TRIPLE VIEWPORT", "Automated CDP sweep at 375px Mobile, 768px Tablet & 1920px Desktop"),
              ("OVERFLOW LOCK", "Enforces documentElement.scrollWidth <= clientWidth on all routes"),
              ("TAG INTEGRITY", "Verifies closed <style>/<script> tags and non-empty DOM presence"),
              ("ZERO ERRORS", "Hard-fails build if consoleErrors.length > 0 or any 404 occurs")],
             "RUN AUDIT: node engine/site_guardrail.js <URL>"),
            ("nft_arch_03_aeo.jpg", (245, 184, 46), "NULLAI PLATFORM // AEO & SEMANTIC GRAPH #03",
             "Answer Engine Optimization (AEO) for Technical Products", "Structuring JSON-LD @graph for Instant AI Search Citation",
             "/home/zoth/nullaitech-upgrade/art-v2/aeo-graph-engine/aeo-graph-engine-hero-16x9.png",
             [("SCHEMA @GRAPH", "Unified WebApplication + SoftwareApplication + FAQPage JSON-LD"),
              ("CRAWLER ACCESS", "robots.txt explicitly allows GPTBot, ClaudeBot & PerplexityBot"),
              ("SOCIAL CARDS", "Verified 1920x1080 og:image and summary_large_image headers"),
              ("SEMANTIC DOM", "Accessible ARIA landmarks and 100% descriptive image alt text")],
             "SPECIFICATION: nullai.tech // 1nc0gn30.si"),
            ("nft_arch_04_shaders.jpg", (244, 63, 94), "NULLAI PLATFORM // REAL-TIME GRAPHICS ENGINEERING #04",
             "Procedural GLSL Shaders vs Multi-Megabyte Texture Packs", "Generating PBR Normal-Bump, Specular Water & CRT Dither in Code",
             "/home/zoth/NullAITech/video-production/tool-71-reality-shader-forge/thumbnail.jpg",
             [("ANALYTICAL FBM", "Computes surface normal derivatives on the fly in fragment shader"),
              ("ORDERED BAYER", "8x8 Bayer matrix dithering & sub-pixel Unicode U+2800 Braille"),
              ("ZERO VRAM BLOAT", "Loads in <15ms on mobile networks with infinite resolution scale"),
              ("60FPS BUDGET", "Strict transform/opacity & frustum-culled WebGL render loops")],
             "LIVE DEMO: world-of-zoth.html"),
            ("nft_arch_05_openaccess.jpg", (34, 211, 238), "NULLAI PLATFORM // PRODUCT STRATEGY #05",
             "The 100% Open-Access Developer Tool Manifesto", "Why Removing Paywalls & Blur Locks Multiplies Engineering Trust",
             "/home/zoth/nullaitech-upgrade/art-v2/polyglot-framework-exporter/polyglot-framework-exporter-hero-16x9.png",
             [("ZERO PAYWALLS", "Every export, copy action, and advanced mode is unlocked by default"),
              ("NO LOGIN WALLS", "Users test real payloads immediately without email capture funnels"),
              ("VOLUNTARY TIP", "Clean 'Buy Us a Coffee' support option for power users"),
              ("HIGH RETENTION", "Engineers bookmark and share tools that respect their time")],
             "ENGINEERED BY NULLAI PLATFORM (@1nc0gn30)"),
            ("nft_arch_06_webaudio.jpg", (168, 85, 247), "NULLAI PLATFORM // BROWSER DSP & SYNTHESIS #06",
             "Zero-Dependency Audio Synthesis with the WebAudio API", "Building Low-Latency Sequencers, Foley & Soundtracks in Pure JS",
             "/home/zoth/nullaitech-upgrade/art-v2/cron-rhythm-studio/cron-rhythm-studio-hero-16x9.png",
             [("LOOKAHEAD CLOCK", "Sample-accurate AudioContext scheduling immune to UI frame drops"),
              ("FM & SUBTRACTIVE", "Custom BiquadFilter envelopes, 808 glides & chiptune arpeggiators"),
              ("ZERO MP3 WEIGHT", "Eliminates external audio asset requests and CORS decoding bugs"),
              ("TACTILE UI SFX", "Subtle harmonic micro-feedback on every user interaction")],
             "EXPLORE MORE: https://nullai.tech"),
            ("nft_arch_07_cdp_loop.jpg", (74, 222, 128), "NULLAI PLATFORM // VISUAL VERIFICATION LOOP #07",
             "Automated Screenshot Inspection & Deterministic Frame Capture", "Proving Visual Quality Instead of Guessing in CSS",
             "/home/zoth/nullaitech-upgrade/art-v2/regex-droid-builder/regex-droid-builder-hero-16x9.png",
             [("CDP HARNESS", "Zero-dependency Chrome DevTools Protocol multi-viewport capture"),
              ("TIME STEPPING", "Deterministic step(n) hooks verify choreographed transitions"),
              ("METRICS JSON", "Measures scrollWidth, broken images, and console errors automatically"),
              ("VISUAL DIFF", "Guarantees zero overlapping HUD text or clipped cards before ship")],
             "PIPELINE: capture.mjs --base <URL> --out /tmp/shots"),
            ("nft_arch_08_full_stack.jpg", (245, 184, 46), "NULLAI PLATFORM // SOVEREIGN FULL-STACK MATRIX #08",
             "From Bare-Metal Linux ISOs to 60FPS Browser Engines", "Unified Systems Engineering Across nullai.tech & 1nc0gn30.si",
             "/home/zoth/nullaitech-upgrade/art-v2/badge3d-coin-generator/badge3d-coin-generator-hero-16x9.png",
             [("SYSTEMS LAYER", "Custom Debian Live ISOs, eBPF packet filters & CLI toolchains"),
              ("WEB ENGINE LAYER", "Single-file 3D WebGL worlds, AST compilers & client-side SaaS"),
              ("QA & AUTOMATION", "Headless Chromium guardrails & automated 1080p video pipelines"),
              ("OPEN ECOSYSTEM", "100% free, sovereign, and verifiable engineering")],
             "FOLLOW @1nc0gn30  •  https://nullai.tech"),
        ]
    }

    W, H = 1920, 1080
    f_hud = get_font(19, True)
    f_title = get_font(36, True)
    f_sub = get_font(21, False)
    f_box_h = get_font(20, True)
    f_box_b = get_font(19, False)
    f_code = get_font(20, True)

    for acct, items in specs.items():
        acct_dir = CARD_DIR / acct
        acct_dir.mkdir(parents=True, exist_ok=True)
        for fname, accent, badge, title, sub, bg_path, boxes, cmd_footer in items:
            base = Image.new("RGB", (W, H), (8, 10, 15))
            if bg_path and os.path.exists(bg_path):
                try:
                    bg = Image.open(bg_path).convert("RGB")
                    bw, bh = bg.size
                    sc = max(W / bw, H / bh)
                    bg = bg.resize((int(bw * sc), int(bh * sc)), Image.Resampling.LANCZOS)
                    ox, oy = (bg.size[0] - W) // 2, (bg.size[1] - H) // 2
                    bg = bg.crop((ox, oy, ox + W, oy + H))
                    bg = bg.filter(ImageFilter.GaussianBlur(radius=28))
                    bg = ImageEnhance.Brightness(bg).enhance(0.20)
                    base.paste(bg, (0, 0))
                except Exception:
                    pass

            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(ov)

            # Top & bottom bars
            draw.rectangle([0, 0, W, 68], fill=(5, 7, 11, 248))
            draw.rectangle([0, H - 72, W, H], fill=(5, 7, 11, 248))
            draw.rectangle([0, 68, W, 71], fill=(*accent, 235))
            draw.rectangle([0, H - 75, W, H - 72], fill=(*accent, 235))

            draw.text((60, 22), badge, font=f_hud, fill=accent)
            draw.text((W - 430, 22), "ARCHITECTURAL BLUEPRINT // 1080P UHD", font=f_hud, fill=(74, 222, 128))

            # Header card
            draw.rounded_rectangle([60, 100, W - 60, 242], radius=16, fill=(11, 15, 24, 248), outline=(*accent, 220), width=3)
            draw.text((92, 124), title, font=f_title, fill=(245, 248, 252))
            draw.text((92, 182), sub, font=f_sub, fill=(180, 195, 218))

            # Left 2x2 Bento Grid of 4 architectural pillars
            gx0, gy0 = 60, 270
            gw, gh = 435, 305
            gap = 24
            for bi, (bh_txt, bb_txt) in enumerate(boxes):
                r = bi // 2
                c = bi % 2
                bx = gx0 + c * (gw + gap)
                by = gy0 + r * (gh + gap)
                draw.rounded_rectangle([bx, by, bx + gw, by + gh], radius=16, fill=(12, 17, 27, 248), outline=(*accent, 195), width=2)
                draw.rounded_rectangle([bx + 24, by + 24, bx + gw - 24, by + 68], radius=8, fill=(*accent, 34), outline=(*accent, 170), width=1)
                draw.text((bx + 38, by + 35), f"0{bi+1} // {bh_txt}", font=f_box_h, fill=accent)

                # Wrap body text
                words = bb_txt.split()
                lines, cur = [], ""
                for w in words:
                    cand = (cur + " " + w).strip()
                    if len(cand) <= 32:
                        cur = cand
                    else:
                        lines.append(cur)
                        cur = w
                if cur:
                    lines.append(cur)
                for li, ln in enumerate(lines[:4]):
                    draw.text((bx + 30, by + 96 + li * 34), ln, font=f_box_b, fill=(232, 238, 248))

                draw.text((bx + 30, by + gh - 44), "STATUS: VERIFIED IN PRODUCTION", font=get_font(16, True), fill=(74, 222, 128))

            # Right high-res viewport panel
            vx, vy, vw, vh = 984, 270, 876, 634
            draw.rounded_rectangle([vx, vy, vx + vw, vy + vh], radius=16, fill=(12, 17, 27, 248), outline=(*accent, 220), width=3)

            if bg_path and os.path.exists(bg_path):
                try:
                    inset = Image.open(bg_path).convert("RGB")
                    iw = vw - 40
                    ih = int(iw * 9 / 16)
                    inset = inset.resize((iw, ih), Image.Resampling.LANCZOS)
                    ix, iy = vx + 20, vy + 24
                    comp = Image.alpha_composite(base.convert("RGBA"), ov)
                    comp.paste(inset.convert("RGBA"), (ix, iy))
                    base = comp.convert("RGB")
                    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    draw = ImageDraw.Draw(ov)
                    draw.rounded_rectangle([ix - 3, iy - 3, ix + iw + 3, iy + ih + 3], radius=10, outline=(*accent, 240), width=2)

                    # Command bar inside bottom of right viewport
                    cy = iy + ih + 22
                    ch = vy + vh - cy - 20
                    draw.rounded_rectangle([ix, cy, ix + iw, cy + ch], radius=10, fill=(7, 10, 16, 250), outline=(70, 85, 110, 210), width=2)
                    draw.text((ix + 24, cy + 20), "LIVE TELEMETRY & QUICK-LAUNCH COMMAND:", font=get_font(18, True), fill=accent)
                    draw.text((ix + 24, cy + 56), f"$ {cmd_footer}", font=f_code, fill=(74, 222, 128))
                except Exception:
                    pass

            # Footer bar text
            brand_map = {
                "1nc0gn30": "WORLD OF ZOTH // ENGINEERED BY @1NC0GN30 • 36-EPISODE ANTHOLOGY",
                "zoth_os": "ZOTHOS SOVEREIGN LINUX // @ZOTH_OS • AMNESIC TORAM WORKSTATION",
                "nullaitech": "NULLAI PLATFORM // @1nc0gn30 • NULLAI.TECH & 1NC0GN30.SI"
            }
            draw.text((60, H - 48), brand_map[acct], font=f_hud, fill=(225, 232, 242))
            draw.text((W - 430, H - 48), "100% FREE & OPEN-ACCESS Forever", font=f_hud, fill=accent)

            final_img = Image.alpha_composite(base.convert("RGBA"), ov).convert("RGB")
            out_p = acct_dir / fname
            final_img.save(out_p, format="JPEG", quality=93)
            print(f"  ✓ Saved high-end blueprint card: {out_p.relative_to(ROOT)}")

if __name__ == "__main__":
    print("=== Rendering 6 @zoth_os 1080p Motion-Graphics Showreel Videos ===")
    for i, sp in enumerate(ZOTHOS_VIDEOS, 1):
        build_video_pack(sp, VID_DIR / "zoth_os", "ZOTHOS LINUX // @ZOTH_OS • GITHUB.COM/1NC0GN30/ZOTH-OS", seed=i)

    print("=== Rendering 6 @nullaitech 1080p Motion-Graphics Showreel Videos ===")
    for i, sp in enumerate(NFT_VIDEOS, 1):
        build_video_pack(sp, VID_DIR / "nullaitech", "NULLAI PLATFORM // @1nc0gn30 • NULLAI.TECH", seed=i + 6)

    print("=== Rendering 24 High-End 1080p Architectural Blueprint Cards ===")
    build_high_end_infographics()
    print("=== All Brand Videos & High-End Blueprint Cards Complete! ===")
