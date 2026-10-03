"""Generate subsetted woff2 fonts and glowing app icons into src/."""
import os, subprocess, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = '/home/box/system-game/fonts'
SRC = os.path.join(ROOT, 'src')
U = 'U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2212,U+2605,U+25C6,U+00D7,U+2713'
for src, out in [('Orbitron-VariableFont_wght.ttf', 'orbitron'), ('Rajdhani-Medium.ttf', 'rajdhani-500'),
                 ('Rajdhani-SemiBold.ttf', 'rajdhani-600'), ('Rajdhani-Bold.ttf', 'rajdhani-700')]:
    subprocess.run(['pyftsubset', os.path.join(FONTS, src), f'--unicodes={U}', '--flavor=woff2', '--layout-features=*',
                    f'--output-file={os.path.join(SRC, "fonts", out + ".woff2")}'], check=True)

def icon(size, pad_frac=0.0):
    S = 1024
    img = Image.new('RGB', (S, S), (3, 7, 15))
    d = ImageDraw.Draw(img)
    # radial glow background
    glow = Image.new('L', (S, S), 0); gd = ImageDraw.Draw(glow)
    for r in range(520, 0, -8):
        gd.ellipse([S/2-r, S/2-r, S/2+r, S/2+r], fill=int(110 * (1 - r/520) ** 1.6))
    blue = Image.new('RGB', (S, S), (20, 80, 170))
    img = Image.composite(blue, img, glow)
    d = ImageDraw.Draw(img)
    # grid
    for x in range(0, S, 48):
        d.line([(x, 0), (x, S)], fill=(12, 34, 62), width=2); d.line([(0, x), (S, x)], fill=(12, 34, 62), width=2)
    inset = int(S * (0.14 + pad_frac))
    cyan = (90, 220, 255)
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    # panel + corner brackets
    d.rectangle([inset, inset, S-inset, S-inset], fill=(8, 26, 56))
    ld.rectangle([inset, inset, S-inset, S-inset], outline=cyan + (170,), width=6)
    b = int(S * 0.11); w = 18; o = 22
    for cx, cy, sx, sy in [(inset-o, inset-o, 1, 1), (S-inset+o, inset-o, -1, 1), (inset-o, S-inset+o, 1, -1), (S-inset+o, S-inset+o, -1, -1)]:
        ld.line([(cx, cy), (cx + sx*b, cy)], fill=cyan + (255,), width=w)
        ld.line([(cx, cy), (cx, cy + sy*b)], fill=cyan + (255,), width=w)
    # big S glyph
    f = ImageFont.truetype(os.path.join(FONTS, 'Orbitron-VariableFont_wght.ttf'), int(S * (0.5 - pad_frac)))
    try: f.set_variation_by_axes([900])
    except Exception: pass
    txt = 'S'
    bb = ld.textbbox((0, 0), txt, font=f)
    tx = (S - (bb[2]-bb[0]))/2 - bb[0]; ty = (S - (bb[3]-bb[1]))/2 - bb[1] - S*0.03
    ld.text((tx, ty), txt, font=f, fill=(235, 250, 255, 255))
    # small label
    f2 = ImageFont.truetype(os.path.join(FONTS, 'Orbitron-VariableFont_wght.ttf'), int(S * 0.062))
    try: f2.set_variation_by_axes([800])
    except Exception: pass
    lbl = 'SYSTEM'; bb2 = ld.textbbox((0, 0), lbl, font=f2)
    ld.text(((S-(bb2[2]-bb2[0]))/2 - bb2[0], S - inset - S*0.13), lbl, font=f2, fill=cyan + (255,))
    # glow composite
    blur = layer.filter(ImageFilter.GaussianBlur(22))
    tint = Image.new('RGBA', (S, S), cyan + (0,)); tint.putalpha(blur.split()[3])
    img = img.convert('RGBA')
    img.alpha_composite(tint); img.alpha_composite(tint)
    img.alpha_composite(layer)
    return img.convert('RGB').resize((size, size), Image.LANCZOS)

icon(180).save(os.path.join(SRC, 'icons', 'apple-touch-icon.png'))
icon(192).save(os.path.join(SRC, 'icons', 'icon-192.png'))
icon(512).save(os.path.join(SRC, 'icons', 'icon-512.png'))
icon(512, pad_frac=0.06).save(os.path.join(SRC, 'icons', 'icon-maskable-512.png'))
icon(32).save(os.path.join(SRC, 'icons', 'favicon-32.png'))
print('assets ok')
