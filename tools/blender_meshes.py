# Headless Blender (bpy + bmesh) procedural 3D wireframe geometry generator for World of Zoth.
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
        # Blender Z-up -> Three.js Y-up: (x, z, y)
        out.extend([
            round(v0.x * scale + ox, 3),
            round(v0.z * scale + oy, 3),
            round(v0.y * scale + oz, 3),
            round(v1.x * scale + ox, 3),
            round(v1.z * scale + oy, 3),
            round(v1.y * scale + oz, 3),
        ])
    return out


def build_relay4_crown():
    """Geodesic parabolic dish + 6-fin harmonic resonator crown for Relay 4."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=10, radius=2.4)
    # Deform upper hemisphere into a deep parabolic receiver dish + lower spike
    for v in bm.verts:
        r = math.hypot(v.co.x, v.co.y)
        if v.co.z > 0:
            v.co.z = 0.28 * (r ** 2) - 0.8
        else:
            v.co.z *= 0.65
    # Add 6 radial transceiver fins
    for i in range(6):
        ang = i * math.pi / 3.0
        ca, sa = math.cos(ang), math.sin(ang)
        v_in = bm.verts.new((ca * 1.1, sa * 1.1, -0.4))
        v_out = bm.verts.new((ca * 3.2, sa * 3.2, 1.4))
        v_tip = bm.verts.new((ca * 2.6, sa * 2.6, 2.5))
        bm.edges.new((v_in, v_out))
        bm.edges.new((v_out, v_tip))
        bm.edges.new((v_tip, v_in))
    arr = bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0))
    bm.free()
    return arr


def build_sandglass_cage():
    """Twisted double-helix astrolabe & octagram chronosphere cage for SANDGLASS."""
    bm = bmesh.new()
    # Two counter-twistedcones + equatorial astrolabe torus
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
    # Merge bm2 into bm
    vmap = [bm.verts.new(v.co) for v in bm2.verts]
    for e in bm2.edges:
        bm.edges.new((vmap[e.verts[0].index], vmap[e.verts[1].index]))
    bm2.free()
    arr = bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0))
    bm.free()
    return arr


def build_hunter_seraph():
    """6-winged Seraphim gyroscope & faceted ocular polyhedron for THE HUNTER."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.35)
    # Flatten slightly along Y (Three.js Z) to form an ocular lens
    for v in bm.verts:
        v.co.y *= 0.45
    # Add 6 swept seraphim blade wings around the eye
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
    arr = bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0))
    bm.free()
    return arr


def build_blank_tesseract():
    """4D-projected fractured tesseract hypercube & floating monolith frame for >_ (THE BLANK CURSOR)."""
    bm = bmesh.new()
    # 16 vertices of a 4D hypercube projected into 3D
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
    arr = bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0))
    bm.free()
    return arr


def build_citadel_spire():
    """Twisted Gothic-cyber lattice spire sculpted in Blender for the Skyline & Relit Hub."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=8, radius1=2.6, radius2=0.2, depth=14.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=4, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += 7.0
        twist = (v.co.z / 14.0) * math.pi * 0.75
        x, y = v.co.x, v.co.y
        v.co.x = x * math.cos(twist) - y * math.sin(twist)
        v.co.y = x * math.sin(twist) + y * math.cos(twist)
    arr = bmesh_to_seg_array(bm, scale=1.0, offset=(0.0, 0.0, 0.0))
    bm.free()
    return arr


def main():
    data = {
        "relay4_crown": build_relay4_crown(),
        "sandglass_cage": build_sandglass_cage(),
        "hunter_seraph": build_hunter_seraph(),
        "blank_tesseract": build_blank_tesseract(),
        "citadel_spire": build_citadel_spire(),
    }
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "blender_geo.js")
    with open(out_path, "w") as f:
        f.write("// Generated by headless Blender (bpy + bmesh) via tools/blender_meshes.py\n")
        f.write("export const BLENDER_GEO = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")
    for k, v in data.items():
        print(f"  {k}: {len(v)//6} 3D edges ({len(v)} floats)")


if __name__ == "__main__":
    main()
