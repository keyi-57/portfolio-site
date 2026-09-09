"""
作品图压缩：PNG(RGBA) -> WebP(RGB)
- 去掉无用的 alpha 通道（照片类图像不需要透明）
- WebP q82：视觉设计师对画质敏感，不压太狠
- 满宽卡需要 ~1700px，故 1920 宽度保留；1440 的图不动尺寸
可重复执行；原图已备份在 _media-backup/
"""
from PIL import Image
import os, sys

SRC = os.path.join(os.path.dirname(__file__), 'public', 'media', 'works')
QUALITY = 82


def optimize(fname):
    path = os.path.join(SRC, fname)
    im = Image.open(path)

    # RGBA / P / LA -> RGB：照片类没有透明需求，少一个通道省 ~25%
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (8, 8, 10))  # 用站点底色垫底，避免边缘发黑
        rgba = im.convert('RGBA')
        bg.paste(rgba, mask=rgba.split()[-1])
        im = bg
    elif im.mode != 'RGB':
        im = im.convert('RGB')

    stem = os.path.splitext(fname)[0]
    out = os.path.join(SRC, stem + '.webp')
    im.save(out, 'WEBP', quality=QUALITY, method=6, exact=False)

    old = os.path.getsize(path)
    new = os.path.getsize(out)
    if new < old:
        os.remove(path)
        print(f'{fname:26s} {old/1024:8.1f} KB -> {stem}.webp {new/1024:7.1f} KB  ({(1-new/old)*100:5.1f}% ↓)')
    else:
        os.remove(out)
        print(f'{fname:26s} {old/1024:8.1f} KB  WebP 没更小，保留原图')


if __name__ == '__main__':
    files = [f for f in sorted(os.listdir(SRC)) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    before = sum(os.path.getsize(os.path.join(SRC, f)) for f in os.listdir(SRC))
    for f in files:
        optimize(f)
    after = sum(os.path.getsize(os.path.join(SRC, f)) for f in os.listdir(SRC))
    print(f'\nworks/ 合计 {before/1024/1024:.2f} MB -> {after/1024/1024:.2f} MB  ({(1-after/before)*100:.1f}% ↓)')
