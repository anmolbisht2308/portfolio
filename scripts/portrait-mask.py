import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import sys, colorsys
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W = 512
im = im.resize((W, W), Image.LANCZOS)
a = np.asarray(im).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(-1), a.min(-1)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
# hue in degrees
h = np.zeros_like(mx)
d = np.maximum(mx - mn, 1e-6)
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
bg = (sat > 0.72) & (h > 8) & (h < 60) & (mx > 0.45)
# only background connected to the image border counts
lab, n = ndi.label(bg)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
fg = ~bg
fg = ndi.binary_opening(fg, iterations=2)
fg = ndi.binary_fill_holes(fg)
lab, n = ndi.label(fg)
sizes = ndi.sum(fg, lab, range(1, n + 1))
fg = lab == (1 + int(np.argmax(sizes)))
Image.fromarray((fg * 255).astype(np.uint8)).save(out)
print("fg fraction", fg.mean())
