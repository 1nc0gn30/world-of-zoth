# Headless Blender 4.3 (bpy + bmesh) Full 3D Enemy & District Landmark Generator for World of Zoth v1.0.
# Usage: /usr/bin/blender --background --python tools/blender_meshes.py
import bpy
import bmesh
import math
import json
import os


def bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0)):
    """Convert a Blender BMesh's edges into flat [x1,y1,z1, x2,y2,z2, ...] (Three.js Y-up)."""
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    ox, oy, oz = offset
    out = []
    for e in bm.edges:
        v0, v1 = e.verts[0].co, e.verts[1].co
        out.extend([
            round(v0.x * scale + ox, 3),
            round(v0.z * scale + oy, 3),
            round(v0.y * scale + oz, 3),
            round(v1.x * scale + ox, 3),
            round(v1.z * scale + oy, 3),
            round(v1.y * scale + oz, 3),
        ])
    return out


def add_ring(bm, cx, cy, cz, r, segs=16, axis="z"):
    verts = []
    for i in range(segs):
        a = i / segs * math.pi * 2.0
        ca, sa = math.cos(a) * r, math.sin(a) * r
        if axis == "z":
            verts.append(bm.verts.new((cx + ca, cy + sa, cz)))
        elif axis == "x":
            verts.append(bm.verts.new((cx, cy + ca, cz + sa)))
        else:
            verts.append(bm.verts.new((cx + ca, cy, cz + sa)))
    for i in range(segs):
        bm.edges.new((verts[i], verts[(i + 1) % segs]))
    return verts


def build_relay4_crown():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=10, radius=2.4)
    for v in bm.verts:
        r = math.hypot(v.co.x, v.co.y)
        if v.co.z > 0:
            v.co.z = 0.28 * (r ** 2) - 0.8
        else:
            v.co.z *= 0.65
    for i in range(6):
        ang = i * math.pi / 3.0
        ca, sa = math.cos(ang), math.sin(ang)
        v_in = bm.verts.new((ca * 1.1, sa * 1.1, -0.4))
        v_out = bm.verts.new((ca * 3.2, sa * 3.2, 1.4))
        v_tip = bm.verts.new((ca * 2.6, sa * 2.6, 2.5))
        bm.edges.new((v_in, v_out))
        bm.edges.new((v_out, v_tip))
        bm.edges.new((v_tip, v_in))
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_sandglass_cage():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=2.1, radius2=0.25, depth=3.0)
    for v in bm.verts:
        twist = (v.co.z / 1.5) * 0.65
        x, y = v.co.x, v.co.y
        v.co.x = x * math.cos(twist) - y * math.sin(twist)
        v.co.y = x * math.sin(twist) + y * math.cos(twist)
        v.co.z += 1.5
    bm2 = bmesh.new()
    bmesh.ops.create_cone(bm2, cap_ends=True, cap_tris=False, segments=12, radius1=0.25, radius2=2.1, depth=3.0)
    for v in bm2.verts:
        twist = -(v.co.z / 1.5) * 0.65
        x, y = v.co.x, v.co.y
        v.co.x = x * math.cos(twist) - y * math.sin(twist)
        v.co.y = x * math.sin(twist) + y * math.cos(twist)
        v.co.z -= 1.5
    vmap = [bm.verts.new(v.co) for v in bm2.verts]
    for e in bm2.edges:
        bm.edges.new((vmap[e.verts[0].index], vmap[e.verts[1].index]))
    bm2.free()
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_hunter_seraph():
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.35)
    for v in bm.verts:
        v.co.y *= 0.45
    for w in range(6):
        base_ang = w * math.pi / 3.0
        for seg in range(5):
            r0 = 1.65 + seg * 0.48
            r1 = r0 + 0.42
            a0 = base_ang + seg * 0.14
            a1 = base_ang + (seg + 1) * 0.14
            v0 = bm.verts.new((math.cos(a0) * r0, -0.15 * seg, math.sin(a0) * r0))
            v1 = bm.verts.new((math.cos(a1) * r1, -0.15 * (seg + 1), math.sin(a1) * r1))
            v2 = bm.verts.new((math.cos(a0 + 0.22) * (r0 + 0.2), 0.15, math.sin(a0 + 0.22) * (r0 + 0.2)))
            bm.edges.new((v0, v1))
            bm.edges.new((v0, v2))
            bm.edges.new((v1, v2))
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_blank_tesseract():
    bm = bmesh.new()
    verts4d = []
    for x in (-1, 1):
        for y in (-1, 1):
            for z in (-1, 1):
                for w in (-1, 1):
                    scale = 1.0 / (2.2 - 0.45 * w)
                    verts4d.append(bm.verts.new((x * scale * 2.4, y * scale * 1.4, z * scale * 2.8)))
    for i in range(16):
        for bit in range(4):
            j = i ^ (1 << bit)
            if i < j:
                bm.edges.new((verts4d[i], verts4d[j]))
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_drone_rotor():
    """Quad-rotor cyber-hornet with swept delta arms & scanner eye."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.42)
    for v in bm.verts:
        v.co.z *= 0.65
    for i in range(4):
        ang = (i + 0.5) * math.pi / 2.0
        cx, cy = math.cos(ang) * 0.78, math.sin(ang) * 0.78
        v0 = bm.verts.new((math.cos(ang) * 0.3, math.sin(ang) * 0.3, 0.0))
        v1 = bm.verts.new((cx, cy, 0.18))
        v2 = bm.verts.new((cx * 0.85, cy * 0.85, -0.35))
        bm.edges.new((v0, v1))
        bm.edges.new((v1, v2))
        add_ring(bm, cx, cy, 0.18, 0.28, segs=10, axis="z")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_sentinel_mech():
    """Armored bipedal lattice goliath with shoulder pods & chest core."""
    bm = bmesh.new()
    # Torso octa-core
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=6, radius1=0.45, radius2=0.72, depth=1.1)
    # Shoulder pods + arms + legs
    for side in (-1, 1):
        sh = bm.verts.new((side * 0.75, 0.0, 0.45))
        el = bm.verts.new((side * 1.05, -0.15, -0.05))
        ha = bm.verts.new((side * 0.92, -0.45, -0.55))
        pod1 = bm.verts.new((side * 0.95, 0.25, 0.85))
        pod2 = bm.verts.new((side * 0.55, -0.25, 0.85))
        bm.edges.new((sh, el))
        bm.edges.new((el, ha))
        bm.edges.new((sh, pod1))
        bm.edges.new((sh, pod2))
        bm.edges.new((pod1, pod2))
        hip = bm.verts.new((side * 0.38, 0.0, -0.55))
        kn = bm.verts.new((side * 0.46, -0.18, -0.95))
        ft = bm.verts.new((side * 0.42, 0.1, -1.35))
        bm.edges.new((hip, kn))
        bm.edges.new((kn, ft))
    add_ring(bm, 0, 0, 0.78, 0.32, segs=8, axis="z")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_worm_serpent():
    """Articulated 9-segment cyber-wyrm with mandibles and dorsal spines."""
    bm = bmesh.new()
    prev_ring = None
    for s in range(9):
        u = s / 8.0
        x = (u - 0.5) * 2.4
        z = math.sin(u * math.pi * 2.0) * 0.28
        r = 0.44 * (1.0 - u * 0.65)
        ring_v = add_ring(bm, x, 0.0, z, r, segs=8, axis="x")
        if prev_ring:
            for k in range(0, 8, 2):
                bm.edges.new((prev_ring[k], ring_v[k]))
        # Dorsal spine
        sp = bm.verts.new((x - 0.12, 0.0, z + r + 0.25))
        bm.edges.new((ring_v[2], sp))
        prev_ring = ring_v
    arr = bmesh_to_seg_array(bm, offset=(0.0, 1.15, 0.0))
    bm.free()
    return arr


def build_mite_arachnid():
    """8-legged crystal cyber-spider."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.32)
    for side in (-1, 1):
        for leg in range(4):
            ang = (leg - 1.5) * 0.38
            bx, by = side * 0.22, math.sin(ang) * 0.22
            kx, ky, kz = side * 0.62, math.sin(ang) * 0.55, 0.32
            fx, fy, fz = side * 0.88, math.sin(ang) * 0.75, -0.32
            v0 = bm.verts.new((bx, by, 0.0))
            v1 = bm.verts.new((kx, ky, kz))
            v2 = bm.verts.new((fx, fy, fz))
            bm.edges.new((v0, v1))
            bm.edges.new((v1, v2))
    arr = bmesh_to_seg_array(bm, offset=(0.0, 0.45, 0.0))
    bm.free()
    return arr


def build_phase_merkaba():
    """Counter-interlocking star tetrahedron (Merkaba) prism."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=4, radius1=0.85, radius2=0.0, depth=1.2)
    bm2 = bmesh.new()
    bmesh.ops.create_cone(bm2, cap_ends=True, cap_tris=False, segments=4, radius1=0.0, radius2=0.85, depth=1.2)
    for v in bm2.verts:
        x, y = v.co.x, v.co.y
        v.co.x = x * 0.707 - y * 0.707
        v.co.y = x * 0.707 + y * 0.707
    vmap = [bm.verts.new(v.co) for v in bm2.verts]
    for e in bm2.edges:
        bm.edges.new((vmap[e.verts[0].index], vmap[e.verts[1].index]))
    bm2.free()
    arr = bmesh_to_seg_array(bm, offset=(0.0, 0.85, 0.0))
    bm.free()
    return arr


def build_gunship_valkyrie():
    """Twin-turbine VTOL interceptor gunship."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=6, radius1=0.55, radius2=0.08, depth=1.8)
    for v in bm.verts:
        # Rotate cone to point along Y
        y, z = v.co.y, v.co.z
        v.co.y = z
        v.co.z = y * 0.55
    for side in (-1, 1):
        w0 = bm.verts.new((side * 0.35, 0.1, 0.0))
        w1 = bm.verts.new((side * 1.45, -0.25, 0.12))
        w2 = bm.verts.new((side * 1.25, -0.65, -0.08))
        bm.edges.new((w0, w1))
        bm.edges.new((w1, w2))
        bm.edges.new((w2, w0))
        add_ring(bm, side * 1.35, -0.25, 0.05, 0.34, segs=10, axis="z")
    arr = bmesh_to_seg_array(bm, offset=(0.0, 1.8, 0.0))
    bm.free()
    return arr


def build_citadel_spire():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=8, radius1=2.6, radius2=0.2, depth=14.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=4, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += 7.0
        twist = (v.co.z / 14.0) * math.pi * 0.75
        x, y = v.co.x, v.co.y
        v.co.x = x * math.cos(twist) - y * math.sin(twist)
        v.co.y = x * math.sin(twist) + y * math.cos(twist)
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_clock_escapement():
    """Interlocking planetary gear escapement & crown wheel for Sand Clocktower."""
    bm = bmesh.new()
    add_ring(bm, 0, 0, 0, 3.6, segs=24, axis="y")
    add_ring(bm, 0, 0, 0, 2.8, segs=24, axis="y")
    add_ring(bm, 0, 0, 0, 2.2, segs=18, axis="x")
    for i in range(12):
        a = i / 12.0 * math.pi * 2.0
        v0 = bm.verts.new((math.cos(a) * 2.8, 0.0, math.sin(a) * 2.8))
        v1 = bm.verts.new((math.cos(a + 0.08) * 4.1, 0.0, math.sin(a + 0.08) * 4.1))
        v2 = bm.verts.new((math.cos(a + 0.18) * 2.8, 0.0, math.sin(a + 0.18) * 2.8))
        bm.edges.new((v0, v1))
        bm.edges.new((v1, v2))
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_mirror_obelisk():
    """Floating fractured diamond hyper-obelisk for Hall of Mirrors."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=6, radius1=1.6, radius2=0.0, depth=3.2)
    for v in bm.verts:
        v.co.z += 1.6
    bm2 = bmesh.new()
    bmesh.ops.create_cone(bm2, cap_ends=False, cap_tris=False, segments=6, radius1=0.0, radius2=1.6, depth=2.2)
    for v in bm2.verts:
        v.co.z -= 1.1
    vmap = [bm.verts.new(v.co) for v in bm2.verts]
    for e in bm2.edges:
        bm.edges.new((vmap[e.verts[0].index], vmap[e.verts[1].index]))
    bm2.free()
    add_ring(bm, 0, 0, 0.4, 2.4, segs=16, axis="z")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_abyss_monolith():
    """Twisted recursive Menger/octahedral trench monolith for Sub-Lattice Abyss."""
    bm = bmesh.new()
    for lvl in range(5):
        z0 = lvl * 2.4
        r = 2.8 - lvl * 0.35
        ang = lvl * 0.38
        pts = []
        for k in range(6):
            a = k / 6.0 * math.pi * 2.0 + ang
            pts.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, z0)))
        for k in range(6):
            bm.edges.new((pts[k], pts[(k + 1) % 6]))
    add_ring(bm, 0, 0, 5.2, 3.8, segs=24, axis="z")
    add_ring(bm, 0, 0, 5.2, 3.2, segs=24, axis="x")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_pantheon_throne():
    """Grand gothic-cybernetic cathedral spire-throne with 3 ZK seal rings for Zero-Knowledge Citadel."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=8, radius1=4.2, radius2=1.2, depth=14.0)
    for v in bm.verts:
        v.co.z += 7.0
    add_ring(bm, 0, 0, 4.0, 5.2, segs=32, axis="z")
    add_ring(bm, 0, 0, 9.0, 4.0, segs=32, axis="z")
    add_ring(bm, 0, 0, 14.0, 3.0, segs=24, axis="y")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_archon_seraph():
    """6-winged hyper-dodecahedral compiler superboss (ARCHON-0)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.6)
    for w in range(6):
        ang = w / 6.0 * math.pi * 2.0
        v0 = bm.verts.new((math.cos(ang) * 1.4, math.sin(ang) * 1.4, 0.0))
        v1 = bm.verts.new((math.cos(ang + 0.25) * 3.8, math.sin(ang + 0.25) * 3.8, 1.8))
        v2 = bm.verts.new((math.cos(ang - 0.25) * 3.4, math.sin(ang - 0.25) * 3.4, -1.4))
        bm.edges.new((v0, v1))
        bm.edges.new((v1, v2))
        bm.edges.new((v2, v0))
    add_ring(bm, 0, 0, 0, 2.9, segs=28, axis="z")
    add_ring(bm, 0, 0, 0, 2.9, segs=28, axis="x")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_null_singularity():
    """4D Clifford hyper-torus & nested gyroscope rings for District #15: The Null Core."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=2.2)
    for v in bm.verts:
        v.co.z += 6.0
    # 8 torus-knot meridian loops around the singularity
    for k in range(8):
        phi = k / 8.0 * math.pi * 2.0
        pts = []
        for s in range(20):
            th = s / 20.0 * math.pi * 2.0
            R_maj = 4.6
            r_min = 1.8
            x = (R_maj + r_min * math.cos(th)) * math.cos(phi + th * 0.5)
            y = (R_maj + r_min * math.cos(th)) * math.sin(phi + th * 0.5)
            z = 6.0 + r_min * math.sin(th) * 1.4
            pts.append(bm.verts.new((x, y, z)))
        for s in range(20):
            bm.edges.new((pts[s], pts[(s + 1) % 20]))
    add_ring(bm, 0, 0, 6.0, 6.8, segs=36, axis="z")
    add_ring(bm, 0, 0, 6.0, 6.8, segs=36, axis="x")
    add_ring(bm, 0, 0, 6.0, 6.8, segs=36, axis="y")
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_quantum_loom():
    """12-strand double-helical Möbius loom spindle & warp-thread rings for District #16: The Quantum Loom."""
    bm = bmesh.new()
    # Upper and lower crown rings
    add_ring(bm, 0, 0, 1.0, 5.2, segs=24, axis="z")
    add_ring(bm, 0, 0, 11.0, 5.2, segs=24, axis="z")
    add_ring(bm, 0, 0, 6.0, 2.4, segs=24, axis="z")
    # 12 counter-woven catenary warp threads connecting bottom to top with 180-deg twist
    for i in range(12):
        a0 = (i / 12.0) * math.pi * 2.0
        a1 = a0 + math.pi * 0.75
        pts = []
        for s in range(9):
            u = s / 8.0
            ang = a0 * (1.0 - u) + a1 * u
            rad = 5.2 * (1.0 - 0.54 * math.sin(u * math.pi))
            z = 1.0 + u * 10.0
            pts.append(bm.verts.new((math.cos(ang) * rad, math.sin(ang) * rad, z)))
        for s in range(8):
            bm.edges.new((pts[s], pts[s + 1]))
    # Central suspended biconical shuttle core
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=1.5, radius2=0.1, depth=3.6)
    for v in bm.verts[-18:]:
        v.co.z += 6.0
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def build_chrono_orrery():
    """5-ring tilted celestial armillary sphere & planetary escapement orrery for District #17: The Chrono-Vault."""
    bm = bmesh.new()
    # Base pedestal rings
    add_ring(bm, 0, 0, 0.4, 5.4, segs=28, axis="z")
    add_ring(bm, 0, 0, 1.2, 4.2, segs=24, axis="z")
    # 5 Tilted armillary gimbal rings centered at z=6.2
    tilts = [
        (5.0, 0.25, 0.0),
        (4.3, -0.45, 0.6),
        (3.6, 0.72, -0.5),
        (2.9, -0.88, 1.1),
        (2.2, 1.15, -0.9),
    ]
    for rad, tx, ty in tilts:
        segs = 28
        pts = []
        cx, sx = math.cos(tx), math.sin(tx)
        cy, sy = math.cos(ty), math.sin(ty)
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            x0, y0, z0 = math.cos(a) * rad, math.sin(a) * rad, 0.0
            # Rotate around X then Y
            y1, z1 = y0 * cx - z0 * sx, y0 * sx + z0 * cx
            x2, z2 = x0 * cy + z1 * sy, -x0 * sy + z1 * cy
            pts.append(bm.verts.new((x2, y1, 6.2 + z2)))
        for i in range(segs):
            bm.edges.new((pts[i], pts[(i + 1) % segs]))
    # Central polar axis & sun-octahedron at (0,0,6.2)
    p_bot = bm.verts.new((0, 0, 0.4))
    p_top = bm.verts.new((0, 0, 11.8))
    bm.edges.new((p_bot, p_top))
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.25)
    for v in bm.verts[-12:]:
        v.co.z += 6.2
    arr = bmesh_to_seg_array(bm)
    bm.free()
    return arr


def main():
    data = {
        "relay4_crown": build_relay4_crown(),
        "sandglass_cage": build_sandglass_cage(),
        "hunter_seraph": build_hunter_seraph(),
        "blank_tesseract": build_blank_tesseract(),
        "drone_rotor": build_drone_rotor(),
        "sentinel_mech": build_sentinel_mech(),
        "worm_serpent": build_worm_serpent(),
        "mite_arachnid": build_mite_arachnid(),
        "phase_merkaba": build_phase_merkaba(),
        "gunship_valkyrie": build_gunship_valkyrie(),
        "citadel_spire": build_citadel_spire(),
        "clock_escapement": build_clock_escapement(),
        "mirror_obelisk": build_mirror_obelisk(),
        "abyss_monolith": build_abyss_monolith(),
        "pantheon_throne": build_pantheon_throne(),
        "archon_seraph": build_archon_seraph(),
        "null_singularity": build_null_singularity(),
        "quantum_loom": build_quantum_loom(),
        "chrono_orrery": build_chrono_orrery(),
    }
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "blender_geo.js")
    with open(out_path, "w") as f:
        f.write("// Generated by headless Blender 4.3 (bpy + bmesh) via tools/blender_meshes.py\n")
        f.write("export const BLENDER_GEO = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")
    for k, v in data.items():
        print(f"  {k}: {len(v)//6} 3D edges ({len(v)} floats)")


if __name__ == "__main__":
    main()
