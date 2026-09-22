"""Generate every Unibud icon asset from one vector definition.

Usage: python3 scripts/build_icons.py

The mark is a folder, because "a subject is a folder" is the idea the whole
app is built on, drawn in the same language as the interface: flat colour,
a heavy black outline and a solid offset shadow.

Outputs (all regenerated, nothing hand-edited):
  assets/icon.png                      1024, opaque — iOS requires no alpha
  assets/android-icon-foreground.png   1024, alpha, inside the 66% safe zone
  assets/android-icon-background.png   1024, opaque
  assets/android-icon-monochrome.png   1024, alpha silhouette for themed icons
  assets/splash-icon.png               1024, alpha
  assets/favicon.png                   196
  assets/logo.svg                      the source mark
  docs/unibud-logo.png                 wordmark, for a listing or README
"""

import os
import subprocess

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
DOCS = os.path.join(ROOT, 'docs')

BLUE = '#3760F9'
LIME = '#D2FC59'
INK = '#17161B'
CREAM = '#FFFDF8'


def folder(cx, cy, w, stroke, shadow=True):
    """The folder mark, centred on (cx, cy) and `w` wide, as SVG elements.

    The whole mark is centred, tab included — centring the body alone leaves
    it sitting low in the frame. At icon sizes the brand's offset shadow
    merges with the black outline into a lopsided border, so `shadow` is off
    for the app icon and on only where the mark is large.
    """
    h = w * 0.72
    tab_w, tab_h, tab_x = w * 0.44, w * 0.155, w * 0.05
    r, off = w * 0.07, w * 0.05
    total = h + tab_h
    x = cx - w / 2
    ty = cy - total / 2
    y = ty + tab_h

    def shape(dx, dy, fill_body, fill_tab, stroke_col, sw):
        return f"""
    <path d="M {x + dx + tab_x} {ty + dy + r}
             a {r} {r} 0 0 1 {r} {-r}
             h {tab_w - 2 * r}
             a {r} {r} 0 0 1 {r} {r}
             v {tab_h + r * 2}
             h {-tab_w}
             z"
          fill="{fill_tab}" stroke="{stroke_col}" stroke-width="{sw}"
          stroke-linejoin="round"/>
    <rect x="{x + dx}" y="{y + dy}" width="{w}" height="{h}" rx="{r * 1.5}"
          fill="{fill_body}" stroke="{stroke_col}" stroke-width="{sw}"
          stroke-linejoin="round"/>"""

    out = ''
    if shadow:
        out += shape(off, off, INK, INK, INK, sw=stroke)
    out += shape(0, 0, LIME, CREAM, INK, sw=stroke)
    # A tick inside the folder: the app exists to tell you what is handled.
    t = w * 0.34
    ccy = y + h * 0.55
    out += f"""
    <path d="M {cx - t * 0.60} {ccy}
             l {t * 0.42} {t * 0.42}
             l {t * 0.84} {-t * 0.90}"
          fill="none" stroke="{INK}" stroke-width="{stroke * 1.2}"
          stroke-linecap="round" stroke-linejoin="round"/>"""
    return out


def icon_svg(size=1024, background=BLUE, inset=1.0, shadow=False):
    """Square app icon. `inset` shrinks the mark for Android's safe zone."""
    bg = (
        f'<rect width="{size}" height="{size}" fill="{background}"/>'
        if background
        else ''
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}"
     viewBox="0 0 {size} {size}">
  {bg}
  {folder(size / 2, size / 2, size * 0.62 * inset, size * 0.042 * inset, shadow)}
</svg>"""


def monochrome_parts(size=1024):
    """Android themed icons recolour a silhouette, so the mark is one flat
    shape and the tick has to be a hole in it — drawn in the same ink it
    would simply disappear.

    Returns (silhouette_svg, tick_svg). The hole is punched after rasterising:
    the SVG renderer here does not support <mask>.
    """
    w = size * 0.62 * 0.66
    stroke = size * 0.042 * 0.66
    h, tab_h = w * 0.72, w * 0.155
    solid = (
        folder(size / 2, size / 2, w, stroke, shadow=False)
        .replace(f'fill="{CREAM}"', f'fill="{INK}"')
        .replace(f'fill="{LIME}"', f'fill="{INK}"')
        .replace(f'stroke="{INK}" stroke-width="{stroke * 1.2}"',
                 f'stroke="none" stroke-width="0"')
    )
    t = w * 0.34
    ccy = (size / 2 - (h + tab_h) / 2) + tab_h + h * 0.55
    tick = f"""<path d="M {size / 2 - t * 0.60} {ccy}
                     l {t * 0.42} {t * 0.42}
                     l {t * 0.84} {-t * 0.90}"
              fill="none" stroke="#ffffff" stroke-width="{stroke * 1.25}"
              stroke-linecap="round" stroke-linejoin="round"/>"""
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" '
            f'height="{size}" viewBox="0 0 {size} {size}">')
    return f'{head}{solid}</svg>', f'{head}{tick}</svg>'


def wordmark_svg(width=1600, height=520):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"
     viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#F7F3EA"/>
  {folder(300, height / 2, 320, 14, shadow=True)}
  <text x="540" y="{height / 2 + 46}"
        font-family="Helvetica, Arial, sans-serif" font-size="150"
        font-weight="bold" fill="{INK}" letter-spacing="-6">Unibud</text>
  <text x="546" y="{height / 2 + 120}"
        font-family="Helvetica, Arial, sans-serif" font-size="46"
        font-weight="600" fill="#6B6862" letter-spacing="1">
    Save now. Find anytime.
  </text>
</svg>"""


def render(svg, out_path, px, alpha):
    tmp = out_path + '.svg'
    with open(tmp, 'w') as fh:
        fh.write(svg)
    doc = pymupdf.open(tmp)
    page = doc[0]
    zoom = px / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=alpha)
    pix.save(out_path)
    os.remove(tmp)
    return pix.width, pix.height


def build_monochrome(size=1024):
    """Punch the tick out of the silhouette, which needs pixel compositing."""
    from PIL import Image

    solid_svg, tick_svg = monochrome_parts(size)
    tmp = f'{ASSETS}/_mono'
    render(solid_svg, tmp + '-solid.png', size, True)
    render(tick_svg, tmp + '-tick.png', size, True)

    solid = Image.open(tmp + '-solid.png').convert('RGBA')
    tick = Image.open(tmp + '-tick.png').convert('RGBA')
    alpha = Image.composite(
        Image.new('L', solid.size, 0), solid.split()[3], tick.split()[3]
    )
    solid.putalpha(alpha)
    out = f'{ASSETS}/android-icon-monochrome.png'
    solid.save(out)
    for f in (tmp + '-solid.png', tmp + '-tick.png'):
        os.remove(f)
    print(f'{os.path.relpath(out, ROOT):42} {size}x{size}')


def main():
    jobs = [
        # iOS rejects an icon with an alpha channel, so this one is opaque.
        (icon_svg(), f'{ASSETS}/icon.png', 1024, False),
        # Android keeps its content inside the middle 66%; the launcher may
        # crop anything outside it.
        (icon_svg(background=None, inset=0.66),
         f'{ASSETS}/android-icon-foreground.png', 1024, True),
        (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">'
         f'<rect width="1024" height="1024" fill="{BLUE}"/></svg>',
         f'{ASSETS}/android-icon-background.png', 1024, False),
        (icon_svg(background=None), f'{ASSETS}/splash-icon.png', 1024, True),
        (icon_svg(), f'{ASSETS}/favicon.png', 196, False),
        (wordmark_svg(), f'{DOCS}/unibud-logo.png', 1600, False),
    ]
    for svg, path, px, alpha in jobs:
        w, h = render(svg, path, px, alpha)
        print(f'{os.path.relpath(path, ROOT):42} {w}x{h}'
              f'{"" if alpha else "  (opaque)"}')

    build_monochrome()

    with open(f'{ASSETS}/logo.svg', 'w') as fh:
        fh.write(icon_svg())
    print(f'{"assets/logo.svg":42} vector source')


if __name__ == '__main__':
    main()
