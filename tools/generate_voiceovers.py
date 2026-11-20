#!/usr/bin/env python3
"""
Generate zero-cost, studio-quality neural voice-overs for World of Zoth (GhostByte AI Guide)
using Microsoft Edge Neural TTS (edge-tts) + ffmpeg compact mono MP3 mastering.
"""
import asyncio
import os
import subprocess
import tempfile
import edge_tts

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "voice")
VOICE = "en-US-AndrewMultilingualNeural"

CLIPS = {
    "gb_intro": (
        "Hey operator. I'm GhostByte, your living three-D volumetric guide inside World of Zoth. "
        "Press G anytime to open my AI Academy, switch soundtracks with B, or explore twenty sovereign districts together. "
        "Remember rule one: trust faces, not voices, and own your compute."
    ),
    "gb_01_use_ai": (
        "Chapter one: How to actually use AI like an engineer. "
        "Large language models are prediction engines, not mind readers. "
        "Always give four things: a clear role, grounded context, hard constraints, and one concrete example of the output shape you want. "
        "Then pair the model with deterministic tools, tests, and retrieval so it verifies its own work instead of guessing."
    ),
    "gb_02_history": (
        "Chapter two: Where AI started. "
        "In 1950, Alan Turing asked whether machines could think. "
        "In 1958, Frank Rosenblatt wired the first Perceptron. "
        "Decades of AI winters followed until backpropagation in 1986, GPU deep learning with AlexNet in 2012, "
        "and the 2017 Transformer paper, Attention Is All You Need, which unlocked modern reasoning models."
    ),
    "gb_03_nous": (
        "Chapter three: Nous Research and the open-weight revolution. "
        "While closed labs locked intelligence behind metered APIs, Nous Research championed open weights, "
        "community-owned datasets, and uncensored steerable reasoning. "
        "With distributed training breakthroughs like DisTrO and Psyche, Nous proved frontier AI belongs to builders everywhere, not a handful of monopolies."
    ),
    "gb_04_hermes": (
        "Chapter four: Hermes models and the Hermes Agent architecture. "
        "Nous Hermes models pioneered rock-solid function calling, strict JSON schemas, and multi-turn agentic reasoning on local hardware. "
        "Hermes Agent turns those weights into a sovereign operator: connecting to local MCP tools, shell workflows, and persistent memory "
        "so your assistant executes real engineering tasks privately on your own machine."
    ),
    "gb_05_future": (
        "Chapter five: Where AI is headed from 2026 into 2030. "
        "The next era is local-first, multi-agent, and embodied. "
        "Instead of typing into a browser tab, specialized agent swarms collaborate on-device with spike-timing neuro-memory, "
        "WebGPU browser engines, and Physical AI standards like FieldKit, grounding spatial vision and voice directly in the real world."
    ),
    "gb_06_zothos": (
        "Chapter six: ZothOS and ZothOS-Lite. "
        "ZothOS version three-point-four is a persistent Debian 13 and KDE Plasma 6 AI workstation operating system "
        "running twenty-three sovereign loopback daemons with zero cloud telemetry. "
        "Need zero-trace mobility? ZothOS-Lite boots completely into RAM from a live USB with fifty-six curated models and ZothNet three-hop Sphinx mixnet routing."
    ),
    "gb_07_studio": (
        "Chapter seven: Zoth Studio v2 and the 80-Tool Sovereign Arsenal. "
        "Zoth Studio packs fifty-six in-browser WebGPU utilities and twenty-four bare-metal CLI daemons under one roof. "
        "From security auditing and vector search to 3D graphics and agent firewalls, every single tool is 100 percent free, open-access, and unlocked by default."
    ),
    "gb_08_local_llm": (
        "Chapter eight: Running local LLMs and owning your weights. "
        "Quantization formats like GGUF Q4 and Q8 shrink massive neural networks so they fly on consumer GPUs and laptops. "
        "When your weights, embeddings, and prompts stay on 127.0.0.1, nobody can throttle your rate limits, silently change your model, or harvest your private data."
    ),
    "gb_09_security": (
        "Chapter nine: AI Security and Red Teaming. "
        "An AI agent with shell or file tools is only as safe as its boundaries. "
        "Separate untrusted data from system instructions to stop prompt injection, sign your RAG knowledge bases, "
        "use safetensors to block weight backdoors, and enforce least privilege with human approval on destructive actions."
    ),
    "gb_10_tactical": (
        "GhostByte live scan active. Check your golden 3D lattice trail for your next mission objective, "
        "hit C to phase-dash through hostile patrols, press B to switch our soundtrack, or visit Null Academy in the Hub to earn XP and sovereign cosmetics."
    ),
}


async def synth_one(key: str, text: str) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    final_path = os.path.join(OUT_DIR, f"{key}.mp3")
    if os.path.exists(final_path) and os.path.getsize(final_path) > 4096:
        print(f"  [SKIP] {key}.mp3 already exists ({os.path.getsize(final_path) // 1024} KB)")
        return
    for attempt in range(1, 5):
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            raw_path = tmp.name
        try:
            comm = edge_tts.Communicate(text, VOICE, rate="+4%", pitch="-2Hz")
            await comm.save(raw_path)
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", raw_path,
                    "-ac", "1", "-ar", "24000", "-b:a", "48k",
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    final_path,
                ],
                check=True,
            )
            sz = os.path.getsize(final_path)
            print(f"  [OK] {key}.mp3 ({sz // 1024} KB)")
            await asyncio.sleep(0.7)
            return
        except Exception as exc:
            if attempt == 4:
                raise
            print(f"  [RETRY {attempt}] {key}: {exc}")
            await asyncio.sleep(1.2 * attempt)
        finally:
            if os.path.exists(raw_path):
                os.remove(raw_path)


async def main() -> None:
    print(f"Synthesizing {len(CLIPS)} neural voice-over clips using {VOICE}...")
    for k, txt in CLIPS.items():
        await synth_one(k, txt)
    total = sum(
        os.path.getsize(os.path.join(OUT_DIR, f))
        for f in os.listdir(OUT_DIR)
        if f.endswith(".mp3")
    )
    print(f"Done! Total narration bundle size: {total / 1024:.1f} KB")


if __name__ == "__main__":
    asyncio.run(main())
