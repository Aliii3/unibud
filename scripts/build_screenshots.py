"""Compose App Store listing screenshots from raw app captures.

Usage:
  npm run web                       # in one terminal
  node scripts/capture_screens.mjs  # raw screens -> /tmp/unibud-shots/raw
  python3 scripts/build_screenshots.py

Each frame is a branded panel: a headline, a sub-line, and the app screen
inside the same outlined, offset-shadowed surface the interface itself uses.

Sizes follow App Store Connect's iPhone requirements. 6.9" is the one Apple
requires; 6.5" is generated too because older listings still ask for it.
"""

import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.environ.get('SHOT_DIR', '/tmp/unibud-shots/raw')
OUT = os.path.join(ROOT, 'store', 'screenshots')

BLUE = (55, 96, 249)
LIME = (210, 252, 89)
INK = (23, 22, 27)
CREAM = (247, 243, 234)
LAVENDER = (218, 217, 251)
WHITE = (255, 253, 248)

FONT_BOLD = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'

# (raw capture, headline, sub-line, panel colour, headline ink)
FRAMES = [
    ('01-home', 'Every subject,\none place.',
     'Documents, tasks and deadlines live in the folder they belong to.',
     BLUE, WHITE),
    ('02-deadlines', 'Never miss\nwhat is due.',
     'Assignments, quizzes and exams, sorted by what comes first.',
     LIME, INK),
    # Panels never use the app's own canvas colour: the device edge vanishes
    # into the background, and the headline never repeats the one on screen.
    ('03-schedule', 'Your timetable,\nsorted once.',
     'Add your class times and see them beside everything else you owe.',
     LAVENDER, INK),
    ('04-todo', 'One list for\nevery subject.',
     'Tasks from every folder, gathered where you can actually see them.',
     LIME, INK),
    ('06-settings', 'Unibud asks.\nYou answer.',
     'One check-in a day, so nothing gets remembered at the last minute.',
     BLUE, WHITE),
]

# App Store Connect iPhone sizes. 6.9" is required; 6.5" is still accepted.
SIZES = {'6.9': (1290, 2796), '6.5': (1242, 2688)}


def fit_text(draw, text, font_path, max_width, start):
    """Largest size at which every line fits the available width."""
    size = start
    while size > 24:
        font = ImageFont.truetype(font_path, size)
        if all(draw.textlength(line, font=font) <= max_width
               for line in text.split('\n')):
            return font
        size -= 2
    return ImageFont.truetype(font_path, size)


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255
    )
    out = img.copy()
    out.putalpha(mask)
    return out


def compose(raw_path, headline, sub, panel, ink, size):
    w, h = size
    canvas = Image.new('RGB', (w, h), panel)
    draw = ImageDraw.Draw(canvas)

    margin = int(w * 0.085)
    text_w = w - margin * 2

    head_font = fit_text(draw, headline, FONT_BOLD, text_w, int(w * 0.105))
    sub_font = ImageFont.truetype(FONT_REG, int(w * 0.036))

    y = int(h * 0.062)
    for line in headline.split('\n'):
        draw.text((margin, y), line, font=head_font, fill=ink)
        y += int(head_font.size * 1.12)

    y += int(h * 0.008)
    words, line, lines = sub.split(), '', []
    for word in words:
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=sub_font) <= text_w:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    for line in lines:
        draw.text((margin, y), line, font=sub_font,
                  fill=ink if panel is not LAVENDER else (90, 88, 110))
        y += int(sub_font.size * 1.42)

    # The device screen, in the app's own surface treatment: black outline
    # on a solid offset shadow.
    shot = Image.open(raw_path).convert('RGB')
    border = max(4, int(w * 0.0075))
    offset = int(w * 0.018)
    top = y + int(h * 0.035)

    # Size by the height that is actually left, not by width: sizing by width
    # pushed the screen past the bottom edge and sliced the tab bar labels
    # in half, which reads as a broken screenshot rather than a bleed.
    avail_h = h - top - int(h * 0.03) - border * 2 - offset
    avail_w = int(w * 0.78) - border * 2
    scale = min(avail_h / shot.height, avail_w / shot.width)
    target_w = int(shot.width * scale)
    shot = shot.resize((target_w, int(shot.height * scale)), Image.LANCZOS)

    radius = int(target_w * 0.075)

    plate = Image.new('RGB', (shot.width + border * 2, shot.height + border * 2), INK)
    plate.paste(shot, (border, border))
    plate = rounded(plate, radius + border)

    x = (w - plate.width) // 2
    shadow = Image.new('RGBA', plate.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [0, 0, plate.width - 1, plate.height - 1], radius=radius + border,
        fill=INK + (255,)
    )
    canvas.paste(shadow, (x + offset, top + offset), shadow)
    canvas.paste(plate, (x, top), plate)
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    missing = [n for n, *_ in FRAMES if not os.path.exists(f'{RAW}/{n}.png')]
    if missing:
        raise SystemExit(
            f'missing raw captures: {", ".join(missing)}\n'
            f'run `node scripts/capture_screens.mjs` against a running dev server'
        )

    for label, (w, h) in SIZES.items():
        folder = os.path.join(OUT, f'iphone-{label}')
        os.makedirs(folder, exist_ok=True)
        for i, (name, headline, sub, panel, ink) in enumerate(FRAMES, start=1):
            img = compose(f'{RAW}/{name}.png', headline, sub, panel, ink, (w, h))
            path = os.path.join(folder, f'{i:02d}-{name.split("-", 1)[1]}.png')
            img.save(path, 'PNG')
            print(f'{os.path.relpath(path, ROOT):54} {w}x{h}')


if __name__ == '__main__':
    main()
