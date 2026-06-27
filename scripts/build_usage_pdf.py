from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SOURCE = DOCS / "Yandex_Agent_Guide_2026.md"
OUTPUT = DOCS / "Yandex_Agent_Guide_2026.pdf"

PAGE_W = 1654
PAGE_H = 2339
MARGIN_X = 110
MARGIN_Y = 110
LINE_GAP = 16


def load_font(size: int, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


FONT_TITLE = load_font(44, bold=True)
FONT_H1 = load_font(34, bold=True)
FONT_H2 = load_font(28, bold=True)
FONT_BODY = load_font(24, bold=False)
FONT_SMALL = load_font(20, bold=False)
FONT_BOLD = load_font(24, bold=True)


def text_width(draw: ImageDraw.ImageDraw, text: str, font):
    return draw.textbbox((0, 0), text, font=font)[2]


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int):
    words = text.split()
    if not words:
      return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def parse_markdown(content: str):
    blocks = []
    for raw_line in content.splitlines():
        line = raw_line.rstrip()
        if not line:
            blocks.append(("space", ""))
            continue
        if line.startswith("# "):
            blocks.append(("title", line[2:].strip()))
            continue
        if line.startswith("## "):
            blocks.append(("h1", line[3:].strip()))
            continue
        if line.startswith("### "):
            blocks.append(("h2", line[4:].strip()))
            continue
        if line.startswith("- "):
            blocks.append(("bullet", line[2:].strip()))
            continue
        if line[:2].isdigit() and line[1] == ".":
            blocks.append(("number", line))
            continue
        blocks.append(("body", line))
    return blocks


def draw_cover(draw: ImageDraw.ImageDraw):
    draw.rounded_rectangle((MARGIN_X, 120, PAGE_W - MARGIN_X, 560), radius=48, fill="#111827")
    draw.text((MARGIN_X + 50, 180), "Yandex Agent", fill="white", font=FONT_TITLE)
    draw.text((MARGIN_X + 50, 245), "Как работает проект и как им пользоваться", fill="#D1D5DB", font=FONT_H2)
    draw.text((MARGIN_X + 50, 305), "Обычный вход, подключение Direct, sandbox, рекомендации и развитие в сторону ML / LLM", fill="#9CA3AF", font=FONT_BODY)

    box_y = 395
    box_w = 340
    gap = 72
    start_x = MARGIN_X + 70
    labels = [
        ("Яндекс ID", "#F59E0B"),
        ("Агент", "#EF4444"),
        ("Direct API", "#10B981"),
    ]
    centers = []
    for idx, (label, color) in enumerate(labels):
        x1 = start_x + idx * (box_w + gap)
        x2 = x1 + box_w
        draw.rounded_rectangle((x1, box_y, x2, box_y + 92), radius=28, fill=color)
        w = text_width(draw, label, FONT_BOLD)
        draw.text((x1 + (box_w - w) / 2, box_y + 28), label, fill="white", font=FONT_BOLD)
        centers.append((x1, x2))

    for left, right in [(centers[0][1], centers[1][0]), (centers[1][1], centers[2][0])]:
        y = box_y + 46
        draw.line((left + 10, y, right - 10, y), fill="#9CA3AF", width=8)
        draw.polygon([(right - 22, y - 12), (right - 22, y + 12), (right - 2, y)], fill="#9CA3AF")


def render_pdf():
    content = SOURCE.read_text(encoding="utf-8")
    blocks = parse_markdown(content)
    pages = []
    image = Image.new("RGB", (PAGE_W, PAGE_H), "white")
    draw = ImageDraw.Draw(image)
    draw_cover(draw)
    y = 640

    def new_page():
        nonlocal image, draw, y
        pages.append(image)
        image = Image.new("RGB", (PAGE_W, PAGE_H), "white")
        draw = ImageDraw.Draw(image)
        y = MARGIN_Y

    def ensure_space(height_needed):
        nonlocal y
        if y + height_needed > PAGE_H - MARGIN_Y:
            new_page()

    max_width = PAGE_W - MARGIN_X * 2

    for kind, text in blocks:
        if kind == "space":
            y += 12
            continue

        if kind == "title":
            continue

        if kind == "h1":
            ensure_space(70)
            draw.text((MARGIN_X, y), text, fill="#111827", font=FONT_H1)
            y += 56
            continue

        if kind == "h2":
            ensure_space(56)
            draw.text((MARGIN_X, y), text, fill="#1F2937", font=FONT_H2)
            y += 46
            continue

        prefix = ""
        font = FONT_BODY
        fill = "#374151"
        if kind == "bullet":
            prefix = "• "
        elif kind == "number":
            prefix = ""

        lines = wrap_text(draw, prefix + text, font, max_width)
        line_height = draw.textbbox((0, 0), "Ag", font=font)[3] + LINE_GAP
        ensure_space(line_height * len(lines) + 8)
        for line in lines:
            draw.text((MARGIN_X, y), line, fill=fill, font=font)
            y += line_height
        y += 6

    pages.append(image)
    pages[0].save(OUTPUT, "PDF", resolution=150.0, save_all=True, append_images=pages[1:])


if __name__ == "__main__":
    render_pdf()
    print(OUTPUT)
