import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import sys
mask_p, out = sys.argv[1], sys.argv[2]
fg = np.asarray(Image.open(mask_p)) > 127
H, W = fg.shape
y, x = np.mgrid[0:H, 0:W] / np.array([H, W]).reshape(2, 1, 1)
# 1. Inflated body: rounded relief from the silhouette's distance field.
dt = ndi.distance_transform_edt(fg)
body = np.sqrt(dt / dt.max())
# 2. Head as an ellipsoid (face centre measured from the photo).
cx, cy, rx, ry = 0.487, 0.36, 0.21, 0.30
e = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2
head = np.sqrt(np.clip(e, 0, 1))
# 3. Nose / brow / chin: soft bumps give the face real relief.
def bump(px, py, s, a):
    return a * np.exp(-(((x - px) ** 2) + ((y - py) ** 2)) / (2 * s * s))
face = bump(0.487, 0.43, 0.04, 0.14) + bump(0.487, 0.30, 0.09, 0.08) + bump(0.487, 0.55, 0.05, 0.06)
# Eye sockets sit slightly back.
face -= bump(0.42, 0.34, 0.03, 0.06) + bump(0.56, 0.34, 0.03, 0.06)
depth = 0.45 * body + 0.5 * head + face
depth = np.where(fg, depth, 0)
depth = ndi.gaussian_filter(depth, 2.2)
depth = np.where(fg, depth, 0)
lo = depth[fg].min(); hi = depth[fg].max()
depth = np.where(fg, 0.08 + 0.92 * (depth - lo) / (hi - lo), 0)  # 0 = background
Image.fromarray((depth * 255).astype(np.uint8)).save(out, optimize=True)
print("saved", out)
