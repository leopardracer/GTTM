#!/usr/bin/env python3
import re
import sys
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FONT_SIZE = 16

BG = (11, 13, 16)
FG_DEFAULT = (215, 247, 220)

FG_MAP = {
    30: (46, 52, 54), 31: (255, 85, 85), 32: (80, 250, 123), 33: (241, 250, 140),
    34: (98, 114, 164), 35: (255, 121, 198), 36: (139, 233, 253), 37: (248, 248, 242),
    90: (136, 146, 160), 91: (255, 110, 110), 92: (110, 231, 168), 93: (255, 235, 120),
    94: (130, 170, 255), 95: (255, 150, 220), 96: (150, 230, 255), 97: (255, 255, 255),
}
BG_MAP = {
    40: (46, 52, 54), 41: (170, 40, 40), 42: (60, 140, 70), 43: (241, 250, 140),
    44: (60, 70, 120), 45: (150, 60, 130), 46: (60, 130, 140), 47: (200, 200, 200),
}

ANSI_RE = re.compile(r"\x1b\[([0-9;]*)m")

def parse_ansi(text: str):
    """Yields (line_index, [(text_segment, fg, bg, bold), ...]) per line."""
    lines_out = []
    for raw_line in text.split("\n"):
        segments = []
        fg, bg, bold = FG_DEFAULT, None, False
        pos = 0
        for m in ANSI_RE.finditer(raw_line):
            if m.start() > pos:
                segments.append((raw_line[pos:m.start()], fg, bg, bold))
            codes = [int(c) for c in m.group(1).split(";") if c != ""] or [0]
            for c in codes:
                if c == 0:
                    fg, bg, bold = FG_DEFAULT, None, False
                elif c == 1:
                    bold = True
                elif c == 22:
                    bold = False
                elif c == 39:
                    fg = FG_DEFAULT
                elif c == 49:
                    bg = None
                elif c in FG_MAP:
                    fg = FG_MAP[c]
                elif c in BG_MAP:
                    bg = BG_MAP[c]
            pos = m.end()
        if pos < len(raw_line):
            segments.append((raw_line[pos:], fg, bg, bold))
        lines_out.append(segments)
    return lines_out

def render(text: str, out_path: str, padding=24):
    lines = parse_ansi(text)
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    font_bold = ImageFont.truetype(FONT_BOLD_PATH, FONT_SIZE)

    char_w = font.getlength("M")
    line_h = int(FONT_SIZE * 1.55)

    max_chars = max((sum(len(s[0]) for s in line) for line in lines), default=1)
    width = int(max_chars * char_w) + padding * 2
    height = line_h * len(lines) + padding * 2

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)

    y = padding
    for line in lines:
        x = padding
        for seg_text, fg, bg, bold in line:
            if seg_text == "":
                continue
            f = font_bold if bold else font
            w = f.getlength(seg_text)
            if bg:
                draw.rectangle([x, y - 2, x + w, y + line_h - 4], fill=bg)
            draw.text((x, y), seg_text, font=f, fill=fg)
            x += w
        y += line_h

    # subtle window chrome
    chrome = Image.new("RGB", (width, height + 32), (18, 20, 24))
    chrome.paste(img, (0, 32))
    d2 = ImageDraw.Draw(chrome)
    for i, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d2.ellipse([16 + i * 22, 12, 28 + i * 22, 24], fill=color)

    chrome.save(out_path)
    print(f"wrote {out_path} ({chrome.width}x{chrome.height})")

if __name__ == "__main__":
    in_path, out_path = sys.argv[1], sys.argv[2]
    with open(in_path, "r", encoding="utf-8") as f:
        content = f.read()
    render(content, out_path)
