# App icon generator
# Reads new-icon.png (1024x) and resizes to Android mipmap sizes
from PIL import Image
import os

SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

SRC = 'new-icon.png'
BASE = 'android/app/src/main/res'
SRC_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), SRC)
if not os.path.exists(SRC_PATH):
    SRC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', SRC)

src_img = Image.open(SRC_PATH).convert('RGBA')

for density, size in SIZES.items():
    resized = src_img.resize((size, size), Image.LANCZOS)
    
    path = f'{BASE}/mipmap-{density}/ic_launcher.png'
    resized.save(path, 'PNG')
    print(f'Created: {path} ({size}x{size})')

    # Round icon (same for simplicity; Android adaptive icon handles masking)
    resized.save(f'{BASE}/mipmap-{density}/ic_launcher_round.png', 'PNG')

    # Foreground (same image, adaptive icon foreground)
    resized.save(f'{BASE}/mipmap-{density}/ic_launcher_foreground.png', 'PNG')
    print(f'Created: foreground for {density}')

print('All icons generated from new-icon.png!')
