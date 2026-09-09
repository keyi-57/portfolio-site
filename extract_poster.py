import av, os
src = "C:/Users/LJY/WorkBuddy/2026-09-07-09-50-54/portfolio-site/public/media/hero.mp4"
out = "C:/Users/LJY/WorkBuddy/2026-09-07-09-50-54/portfolio-site/public/media/hero-poster.jpg"
container = av.open(src)
stream = next(s for s in container.streams if s.type == 'video')
target_pts = int(0.8 / stream.time_base.denominator * stream.time_base.numerator) if False else None
# seek to ~0.8s
container.seek(int(0.8 * av.time_base)) if False else None
found = None
for frame in container.decode(stream):
    found = frame
    if frame.time >= 0.8:
        break
img = found.to_image()
img.save(out, "JPEG", quality=85)
print("saved", out, img.size)
