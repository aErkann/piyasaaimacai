from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 1024
OUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'piyasaai_ma_ai_app_icon.png')

img = Image.new('RGBA', (SIZE, SIZE), (3, 7, 11, 255))
draw = ImageDraw.Draw(img)

import math
for i in range(100):
    y = i * SIZE // 100
    shade = 3 + int(i * 0.12)
    draw.line([(0, y), (SIZE, y)], fill=(shade, 7 + i // 10, 11 + i // 8, 255))

cx, cy = SIZE // 2, SIZE // 2
r = SIZE // 2 - 40

for i in range(360):
    angle = math.radians(i)
    x1 = cx + int(r * math.cos(angle))
    y1 = cy + int(r * math.sin(angle))
    x2 = cx + int((r - 30) * math.cos(angle + 0.03))
    y2 = cy + int((r - 30) * math.sin(angle + 0.03))
    c = 35 + int(200 * (abs(math.sin(math.radians(i * 1.5)))))
    draw.line([(x1, y1), (x2, y2)], fill=(c, 209 + int(46 * abs(math.sin(math.radians(i * 1.5)))), 139, 180), width=2)

overlay = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
for i in range(0, SIZE, 3):
    a = 10 - int(10 * abs(i - SIZE/2) / (SIZE/2))
    odraw.line([(i, 0), (i, SIZE)], fill=(35, 209, 139, max(0, a)))

img = Image.alpha_composite(img, overlay)

try:
    font_large = ImageFont.truetype("arial.ttf", 240)
    font_small = ImageFont.truetype("arial.ttf", 72)
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

try:
    bbox = draw.textbbox((0, 0), "P&M", font=font_large)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (SIZE - tw) // 2
    ty = (SIZE - th) // 2 - 20
    draw.text((tx, ty), "P&M", fill=(35, 209, 139, 255), font=font_large)

    bbox2 = draw.textbbox((0, 0), "AI", font=font_small)
    tw2 = bbox2[2] - bbox2[0]
    draw.text((tx + tw + 16, ty + 80), "AI", fill=(100, 200, 255, 255), font=font_small)

    bbox3 = draw.textbbox((0, 0), "Tuzak Radar", font=font_small)
    tw3 = bbox3[2] - bbox3[0]
    draw.text(((SIZE - tw3) // 2, ty + th + 40), "Tuzak Radar", fill=(142, 171, 186, 200), font=font_small)
except:
    draw.text((SIZE//4, SIZE//3), "PM", fill=(35, 209, 139, 255))
    draw.text((SIZE//3, SIZE//2), "AI", fill=(100, 200, 255, 255))

img.save(OUT, 'PNG')
print(f'Icon saved: {OUT} ({SIZE}x{SIZE})')
