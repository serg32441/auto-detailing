#!/usr/bin/env python3
"""Рендерит PNG-превью витрины Telegram-бота в формате, который ждёт ЮKassa:
приветствие + услуга с ценами + кнопки-меню. Это макет, не реальный скриншот."""

from PIL import Image, ImageDraw, ImageFont

W = 760
FONT_DIR = "/usr/share/fonts/truetype/liberation"
reg = lambda s: ImageFont.truetype(f"{FONT_DIR}/LiberationSans-Regular.ttf", s)
bold = lambda s: ImageFont.truetype(f"{FONT_DIR}/LiberationSans-Bold.ttf", s)

f_name = bold(24)
f_sub = reg(17)
f_body = reg(21)
f_body_b = bold(21)
f_btn = bold(21)
f_input = reg(20)

# Палитра
HEADER_BG = (255, 255, 255)
CHAT_BG = (220, 230, 210)
BUBBLE = (255, 255, 255)
TEXT = (20, 24, 18)
GREY = (130, 140, 125)
AVATAR = (76, 175, 80)
BTN = (197, 209, 181)
BTN_TEXT = (40, 52, 30)
BLUE = (82, 136, 193)
GREEN_DOT = (60, 179, 75)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# Сначала посчитаем высоту по контенту (черновой проход на временном холсте)
tmp = ImageDraw.Draw(Image.new("RGB", (W, 10)))

bubble_x, bubble_w = 24, W - 48
pad = 22
text_w = bubble_w - pad * 2

desc = ("Hermes Agent — это бот сервиса Hermes, где можно подключить "
        "персонального AI-агента в Telegram и оформить подписку.")
desc_lines = wrap(tmp, desc, f_body, text_w)

services = [
    "Пробный период — 7 дней бесплатно",
    "Подписка — 490 руб. / 30 дней",
    "Привязка карты — символическое списание 100 руб.",
]

line_h = 30

# Высота пузыря
bubble_inner = (
    34  # "Добро пожаловать!"
    + 16
    + len(desc_lines) * line_h
    + 24
    + 30  # "Услуга и тариф:"
    + 8
    + len(services) * (line_h + 6)
)
bubble_h = bubble_inner + pad * 2

header_h = 84
bubble_y = header_h + 26
buttons_y = bubble_y + bubble_h + 18
btn_h = 64
buttons_block = btn_h * 2 + 16  # два ряда
input_y = buttons_y + buttons_block + 22
H = input_y + 74

img = Image.new("RGB", (W, H), CHAT_BG)
d = ImageDraw.Draw(img)

# ── Шапка ──
d.rectangle([0, 0, W, header_h], fill=HEADER_BG)
d.line([0, header_h, W, header_h], fill=(225, 225, 225), width=1)
d.ellipse([24, 18, 24 + 48, 18 + 48], fill=AVATAR)
d.text((48, 42), "H", font=bold(26), fill=(255, 255, 255), anchor="mm")
d.text((88, 24), "Hermes Agent", font=f_name, fill=(20, 20, 20))
d.text((88, 52), "бот", font=f_sub, fill=GREY)

# ── Пузырь приветствия ──
d.rounded_rectangle(
    [bubble_x, bubble_y, bubble_x + bubble_w, bubble_y + bubble_h],
    radius=18, fill=BUBBLE,
)
tx = bubble_x + pad
ty = bubble_y + pad
d.text((tx, ty), "Добро пожаловать!", font=f_body_b, fill=TEXT)
ty += 34 + 16
for ln in desc_lines:
    d.text((tx, ty), ln, font=f_body, fill=TEXT)
    ty += line_h
ty += 24
d.text((tx, ty), "Услуга и тариф:", font=f_body_b, fill=TEXT)
ty += 30 + 8
for s in services:
    cy = ty + line_h // 2
    d.ellipse([tx, cy - 8, tx + 16, cy + 8], fill=GREEN_DOT)
    d.text((tx + 28, ty), s, font=f_body, fill=TEXT)
    ty += line_h + 6

# ── Кнопки-меню ──
gap = 16
half = (bubble_w - gap) // 2
b1 = [bubble_x, buttons_y, bubble_x + half, buttons_y + btn_h]
b2 = [bubble_x + half + gap, buttons_y, bubble_x + bubble_w, buttons_y + btn_h]
b3 = [bubble_x, buttons_y + btn_h + 16, bubble_x + bubble_w, buttons_y + btn_h * 2 + 16]
for box, label in [
    (b1, "Оформить подписку"),
    (b2, "Техподдержка"),
    (b3, "О сервисе"),
]:
    d.rounded_rectangle(box, radius=12, fill=BTN)
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    d.text((cx, cy), label, font=f_btn, fill=BTN_TEXT, anchor="mm")

# ── Поле ввода ──
d.rectangle([0, input_y, W, H], fill=(255, 255, 255))
d.line([0, input_y, W, input_y], fill=(225, 225, 225), width=1)
menu_box = [22, input_y + 18, 22 + 96, input_y + 18 + 38]
d.rounded_rectangle(menu_box, radius=10, fill=BLUE)
d.text(((menu_box[0] + menu_box[2]) / 2, (menu_box[1] + menu_box[3]) / 2),
       "Меню", font=bold(18), fill=(255, 255, 255), anchor="mm")
d.text((140, input_y + 28), "Написать сообщение...", font=f_input, fill=GREY)

img.save("docs/bot-preview.png")
print(f"saved docs/bot-preview.png ({W}x{H})")
