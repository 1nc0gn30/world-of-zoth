#!/usr/bin/env python3
"""World of Zoth — "06:12" : original procedural dark-phonk / trap score for the motion edit.

100% synthesized from math (numpy + scipy). No samples, no licenses, safe to post anywhere.
140 BPM, D minor. 16 bars + ring-out tail. Writes motion/out/score_raw.wav (48 kHz stereo)
and motion/out/timeline.json (beat grid shared with the video compositor).

Structure (bars are 0-indexed):
  0-1   intro      : FM bell motif + dark pad + vinyl, low-passed
  2-3   build      : hats in, 16th rolls, snare build, riser -> DROP
  4-11  drop A     : 808 glide bass, half-time kick/snare, triplet hats, distorted cowbell lead
  12-13 breakdown  : drums out, major lift (sunrise 06:12), riser
  14-15 drop B     : everything + extra impact, hard stop on bar 16
  16+   tail       : impact + bell ring-out
"""
import json, os
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 140.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
BARS = 16
TAIL = 2.6
DUR = BARS * BAR + TAIL
N = int(DUR * SR)
rng = np.random.default_rng(612)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

L = np.zeros(N); R = np.zeros(N)
duck = np.ones(N)  # sidechain envelope driven by kicks


def t_of(bar, beat=0.0):
    return bar * BAR + beat * BEAT


def put(sig, t, gain=1.0, pan=0.0, bus=None):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i]
    gl = gain * np.cos((pan + 1) * np.pi / 4); gr = gain * np.sin((pan + 1) * np.pi / 4)
    if bus is None:
        L[i:i + len(sig)] += sig * gl; R[i:i + len(sig)] += sig * gr
    else:
        bus[0][i:i + len(sig)] += sig * gl; bus[1][i:i + len(sig)] += sig * gr


def sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return sosfilt(sos(kind, f, order), x)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def note(m):  # midi -> Hz
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- instruments ----------------
def kick(dur=0.42):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.16)
    click = filt(rng.standard_normal(n), "highpass", 2500) * env_exp(n, 0.004) * 0.5
    return np.tanh(2.2 * (body + click)) * 0.9


def snare(dur=0.32):
    n = int(dur * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 186 * t) * env_exp(n, 0.05)
    nz = filt(rng.standard_normal(n), "bandpass", [1200, 9000]) * env_exp(n, 0.11)
    clap = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR); m = n - i
        clap[i:] += filt(rng.standard_normal(m), "bandpass", [900, 3500]) * env_exp(m, 0.03 if k < 2 else 0.12)
    return np.tanh(1.6 * (0.55 * tone + 0.7 * nz + 0.6 * clap)) * 0.8


def hat(dur=0.05, open_=False):
    n = int((0.28 if open_ else dur) * SR)
    x = filt(rng.standard_normal(n), "highpass", 7500, 4)
    return x * env_exp(n, 0.09 if open_ else 0.014) * 0.5


def bass808(freqs_times, dur, glide=0.06):
    """freqs_times: list of (t_rel, hz). Continuous phase sine with glides, saturated."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.full(n, freqs_times[0][1])
    for (t0, f0), nxt in zip(freqs_times, freqs_times[1:] + [None]):
        i0 = int(t0 * SR)
        f[i0:] = f0
        if nxt is not None:
            i1 = int(nxt[0] * SR); ig = int(max(0, nxt[0] - glide) * SR)
            if ig < i1:
                f[ig:i1] = np.linspace(f0, nxt[1], i1 - ig)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.18 * np.sin(2 * ph)
    a = np.minimum(1, t / 0.005) * np.exp(-t / (dur * 0.9))
    return np.tanh(2.6 * x * a) * 0.75


def cowbell(hz, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    sq = lambda f: np.sign(np.sin(2 * np.pi * f * t))
    x = 0.6 * sq(hz) + 0.4 * sq(hz * 1.48)
    x = filt(x, "bandpass", [max(200, hz * 0.8), min(9000, hz * 4)])
    x = np.tanh(3.0 * x) * env_exp(n, 0.07)
    return x * 0.45


def bell(hz, dur=2.2, idx=3.2):
    n = int(dur * SR); t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * hz * 3.5 * t) * idx * env_exp(n, 0.35)
    return np.sin(2 * np.pi * hz * t + mod) * env_exp(n, 0.65) * 0.32


def pad(chord, dur, cutoff=1400):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n); y = np.zeros(n)
    for m in chord:
        for d in (-0.09, 0.0, 0.11):
            f = note(m) * 2 ** (d / 12)
            saw = 2 * ((f * t + rng.random()) % 1) - 1
            x += saw; y += 2 * ((f * 1.002 * t + rng.random()) % 1) - 1
    a = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.35).clip(0)
    x = filt(x, "lowpass", cutoff) * a; y = filt(y, "lowpass", cutoff) * a
    return x * 0.05, y * 0.05


def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = 2400
    for i in range(0, n, seg):
        u = i / n; fc = 300 + 9000 * u ** 2
        out[i:i + seg] = filt(nz[i:i + seg], "bandpass", [fc * 0.7, min(fc * 1.4, 20000)])
    tone = np.sin(2 * np.pi * np.cumsum(120 + 900 * (t / dur) ** 2) / SR) * 0.25
    return (out * 0.6 + tone) * (t / dur) ** 2 * 0.7


def impact(dur=2.4):
    n = int(dur * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(32 + 60 * np.exp(-t / 0.08)) / SR) * env_exp(n, 0.7)
    nz = filt(rng.standard_normal(n), "lowpass", 3500) * env_exp(n, 0.25)
    return np.tanh(1.8 * (sub + 0.5 * nz)) * 0.95


def reverse_cym(dur=1.6):
    n = int(dur * SR)
    x = filt(rng.standard_normal(n), "highpass", 5000) * env_exp(n, 0.5)
    return x[::-1] * 0.35


def crackle(dur):
    n = int(dur * SR); x = np.zeros(n)
    idx = rng.integers(0, n, int(dur * 18)); x[idx] = rng.uniform(-1, 1, len(idx))
    return filt(x, "bandpass", [1500, 6000]) * 0.9 + filt(rng.standard_normal(n), "lowpass", 900) * 0.004


# ---------------- arrangement ----------------
tl = {"bpm": BPM, "beat": BEAT, "bar": BAR, "duration": DUR, "drop": t_of(4), "breakdown": t_of(12),
      "drop2": t_of(14), "end": t_of(16), "kicks": [], "snares": [], "sections": {}}

# D minor: progression Dm - Bb - Gm - A (i - VI - iv - V), breakdown lifts to F - C (sunrise)
CHORDS = [[50, 53, 57, 62], [46, 50, 53, 58], [43, 46, 50, 55], [45, 49, 52, 57]]
ROOTS = [38, 34, 31, 33]  # 808 roots (D2, Bb1, G1, A1)
LIFT = [[41, 45, 48, 53], [48, 52, 55, 60]]  # F, C

pad_bus = (np.zeros(N), np.zeros(N))
mel_bus = (np.zeros(N), np.zeros(N))

# pads across whole song (one chord per bar), lift during breakdown
for bar in range(BARS):
    ch = CHORDS[bar % 4] if not (12 <= bar <= 13) else LIFT[bar - 12]
    cut = 700 if bar < 2 else (1100 if bar < 4 else 1500)
    pl, pr = pad(ch, BAR + 0.4, cut)
    put(pl, t_of(bar), 1.0, -0.3, pad_bus); put(pr, t_of(bar), 1.0, 0.3, pad_bus)

# intro / breakdown FM bell motif (D F A C A F / variation)
MOTIF = [74, 77, 81, 84, 81, 77, 76, 72]
for bar in list(range(0, 4)) + [12, 13]:
    for k in range(8):
        m = MOTIF[k] + (3 if bar >= 12 and k % 4 == 0 else 0)
        put(bell(note(m)), t_of(bar, k * 0.5), 0.55 if bar < 2 else 0.4, -0.5 + 0.14 * k, mel_bus)

put(crackle(t_of(4)), 0, 0.6)
put(crackle(t_of(2)), t_of(12), 0.5)
put(reverse_cym(1.6), t_of(4) - 1.6, 0.9)
put(riser(t_of(4) - t_of(2)), t_of(2), 0.55)
put(riser(BAR * 2), t_of(12), 0.5)
put(reverse_cym(1.2), t_of(14) - 1.2, 0.8)

# build drums
for bar in (2, 3):
    for s in range(8 if bar == 2 else 16):
        put(hat(), t_of(bar, s * (0.5 if bar == 2 else 0.25)), 0.5 + 0.02 * s, 0.25)
for s in range(8):  # snare roll ramp, last beat of bar 3
    put(snare(), t_of(3, 2 + s * 0.25), 0.25 + 0.08 * s, 0.0)
    tl["snares"].append(t_of(3, 2 + s * 0.25))

# impacts on drops + end
for t in (t_of(4), t_of(14)):
    put(impact(), t, 0.9)
put(impact(2.6), t_of(16), 1.0)
put(bell(note(62), 2.6, 4.0), t_of(16), 0.7, -0.2); put(bell(note(69), 2.6, 4.0), t_of(16), 0.5, 0.2)

# phonk cowbell lead (D minor), 2-bar phrase, 16th grid; None = rest
LEAD = [74, None, 74, 77, None, 76, 74, None, 72, None, 72, 74, None, 69, None, None,
        74, None, 74, 77, None, 79, 81, None, 79, None, 77, 76, None, 74, 72, None]


def drums_bar(bar, intensity=1.0, fill=False):
    # half-time trap: kick on 1 and the "and" of 2 / 4 variations, snare on 3
    kicks = [0, 1.5, 2.75] if bar % 2 == 0 else [0, 0.75, 1.5, 3.5]
    for kb in kicks:
        t = t_of(bar, kb); put(kick(), t, 0.95 * intensity); tl["kicks"].append(t)
        i = int(t * SR); m = min(N - i, int(0.32 * SR))
        duck[i:i + m] = np.minimum(duck[i:i + m], 0.35 + 0.65 * (np.arange(m) / m) ** 0.6)
    put(snare(), t_of(bar, 2), 0.85 * intensity); tl["snares"].append(t_of(bar, 2))
    # hats: 8ths with triplet rolls on beat 4 every other bar
    for s in range(8):
        if bar % 2 == 1 and s >= 6: continue
        put(hat(), t_of(bar, s * 0.5), 0.42 * intensity, 0.3)
    if bar % 2 == 1:
        for k in range(6): put(hat(), t_of(bar, 3 + k / 6), 0.3 + 0.03 * k, 0.35)
    put(hat(open_=True), t_of(bar, 1.5), 0.3 * intensity, -0.3)
    if fill:
        for k in range(4): put(snare(), t_of(bar, 3 + k * 0.25), 0.35 + 0.1 * k); tl["snares"].append(t_of(bar, 3 + k * 0.25))


def bass_bar(bar):
    r = ROOTS[bar % 4]
    pattern = [(0, r), (1.5, r), (2.75, r + 12 if bar % 2 == 0 else r + 7), (3.5, r)]
    seq = [(b * BEAT, note(m)) for b, m in pattern]
    put(bass808(seq, BAR + 0.05), t_of(bar), 0.85)


def lead_bar(bar, gain=0.55):
    half = (bar % 2) * 16
    for s in range(16):
        m = LEAD[half + s]
        if m is None: continue
        put(cowbell(note(m)), t_of(bar, s * 0.25), gain, 0.15 if s % 2 else -0.15)


for bar in range(4, 12):
    drums_bar(bar, 1.0, fill=(bar == 11)); bass_bar(bar)
    if bar >= 6: lead_bar(bar, 0.5)
for bar in (12, 13):  # breakdown: just a filtered sub on the downbeat
    put(filt(bass808([(0, note(ROOTS[0] + 3 if bar == 12 else ROOTS[0] + 10))], BAR * 0.9), "lowpass", 180), t_of(bar), 0.6)
for bar in (14, 15):
    drums_bar(bar, 1.05, fill=(bar == 15)); bass_bar(bar); lead_bar(bar, 0.6)

# ---------------- mix ----------------
pl, pr = pad_bus; ml, mr = mel_bus
# bells: simple stereo delay for space (dotted 8th)
d = int(BEAT * 0.75 * SR)
for _ in range(3):
    ml[d:] += ml[:-d] * 0.32; mr[d:] += mr[:-d] * 0.32
# intro low-pass sweep on bells (dark -> open)
mel_mix_l = ml * duck; mel_mix_r = mr * duck
L += pl * duck + mel_mix_l
R += pr * duck + mel_mix_r
# glue: gentle bus saturation + highpass rumble
L = np.tanh(1.15 * filt(L, "highpass", 28)); R = np.tanh(1.15 * filt(R, "highpass", 28))
# fade the tail
tail_i = int(t_of(16) * SR); fade = np.ones(N); fade[tail_i:] = np.linspace(1, 0, N - tail_i) ** 1.5
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); L /= peak / 0.89; R /= peak / 0.89

pcm = (np.stack([L, R], 1) * 32767).astype("<i2")
import wave
with wave.open(os.path.join(OUT, "score_raw.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
tl["kicks"].sort(); tl["snares"].sort()
json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w"), indent=1)
print(f"score: {DUR:.2f}s  drop@{tl['drop']:.2f}s  breakdown@{tl['breakdown']:.2f}s  drop2@{tl['drop2']:.2f}s  end@{tl['end']:.2f}s")
