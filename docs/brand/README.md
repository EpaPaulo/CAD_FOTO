# Brand assets

`TraceCAT.png` is the source artwork for the mark. `frontend/public/logo.png`,
which the app serves as both the header logo and the browser tab icon, is
derived from it: trimmed to its bounding box, padded to a square so it keeps its
proportions at any size, and quantised to a small palette, which the flat
artwork suits.

Regenerate it after editing the source:

```python
from PIL import Image

im = Image.open('docs/brand/TraceCAT.png').convert('RGBA')
im = im.crop(im.getbbox())
w, h = im.size
side = max(w, h)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
out = canvas.resize((256, 256), Image.LANCZOS)
out.quantize(colors=64, method=Image.FASTOCTREE).save(
    'frontend/public/logo.png', optimize=True
)
```

The striped half does not survive small sizes: it is crisp at 48px, merges at
24px, and reads as a solid block at the 16px favicon size. On the light theme
the white half sits on a near-white header, so only the outline carries it. A
simplified small-size variant would fix both if that ever matters.
