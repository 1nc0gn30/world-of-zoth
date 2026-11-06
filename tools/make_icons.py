# App icon: gold dot-matrix "Z" inside a braille-dashed lattice ring on black (episode palette).
import sys, os, math
from PIL import Image, ImageDraw
out=sys.argv[1] if len(sys.argv)>1 else 'android/res'
BK=(6,5,4); GD=(245,184,46); DG=(138,101,20); DDG=(60,44,10); BONE=(236,228,210)
S=512; im=Image.new('RGB',(S,S),BK); d=ImageDraw.Draw(im)
# lattice floor grid in deep gold
for i in range(0,S,32): d.line([(i,0),(i,S)],fill=(20,15,5)); d.line([(0,i),(S,i)],fill=(20,15,5))
# dashed rings
for r,col,dash in ((222,DG,2),(200,DDG,3),(238,DDG,4)):
    n=96
    for k in range(n):
        if k%dash: continue
        a0=k/n*2*math.pi; a1=(k+.6)/n*2*math.pi
        d.line([(S/2+math.cos(a0)*r,S/2+math.sin(a0)*r),(S/2+math.cos(a1)*r,S/2+math.sin(a1)*r)],fill=col,width=6)
Z=["#########","       ##","      ## ","     ##  ","    ##   ","   ##    ","  ##     "," ##      ","#########"]
cell=30; ox=S/2-len(Z[0])*cell/2; oy=S/2-len(Z)*cell/2
for j,row in enumerate(Z):
    for i,ch in enumerate(row):
        cx=ox+i*cell+cell/2; cy=oy+j*cell+cell/2
        if ch=='#':
            d.ellipse([cx-13,cy-13,cx+13,cy+13],fill=(90,66,14))
            d.ellipse([cx-10,cy-10,cx+10,cy+10],fill=GD)
            d.ellipse([cx-4,cy-6,cx+2,cy-1],fill=BONE)
        else:
            d.ellipse([cx-2,cy-2,cx+2,cy+2],fill=DDG)
for name,px in (('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)):
    p=os.path.join(out,'mipmap-'+name); os.makedirs(p,exist_ok=True)
    im.resize((px,px),Image.LANCZOS).save(os.path.join(p,'ic_launcher.png'))
os.makedirs('assets',exist_ok=True); im.save('assets/icon-512.png')
