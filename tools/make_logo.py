# -*- coding: utf-8 -*-
"""Derive tagline-free FinLytTech logos from the deployed lockup.

The brief was "same as deployed", so rather than redraw the mark we cut the
tagline off the approved artwork. The glyph shapes stay pixel-identical.

Two problems with the source asset that this fixes:

  1. It carries the tagline "DELIVERING FINANCIAL EXCELLENCE THROUGH
     FINTELLIGENCE" under the wordmark.
  2. Its background is opaque white, not transparent, so it renders as a
     visible white block on the translucent nav (rgba(255,255,255,.92)) and on
     --paper-2 (#FAFBFC) sections.

Method
------
Tagline: profile ink per row; the last contiguous run of high-ink rows is the
tagline band. Cut above it, then re-tighten and re-pad.

Un-matting: the artwork is drawn from a known four-colour brand palette on
white. For each pixel find the nearest palette colour P, then recover the
coverage that produced it by measuring how far the pixel travelled from white
toward P:  alpha = |C - White| / |P - White|.  Set RGB to P and keep that
alpha. Solid areas come out fully opaque in exact brand colours, antialiased
edges keep correct partial coverage, and the background falls to alpha 0.
"""
import os
import sys

import numpy as np
from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ASSETS = r"C:/Users/sasik/OneDrive/Trading/FinLyt/Web/assets"
SRC = "finlyttech-lockup-light.png"

NAVY = (13, 27, 42)
PALETTE = np.array([NAVY, (46, 158, 107), (43, 184, 174), (123, 220, 200)], dtype=float)
WHITE = np.array([255.0, 255.0, 255.0])

STRONG = 100       # ink px per row that counts as a solid text band
PAD_RATIO = 0.10   # padding as a fraction of final logo height
WHITE_TOL = 10     # channel distance from white that still counts as background


def crop_tagline(im):
    """Return the image with its bottom text band removed and re-padded."""
    a = np.array(im.convert("RGBA"))
    rgb = a[..., :3].astype(int).sum(2)
    alpha = a[..., 3]
    ink = (alpha > 16) & ~((rgb > 720) & (alpha > 200))
    rows = ink.sum(1)
    H = im.size[1]

    strong = rows > STRONG
    end = next((y for y in range(H - 1, -1, -1) if strong[y]), None)
    if end is None:
        raise SystemExit("no content found in %s" % SRC)
    start = end
    while start > 0 and strong[start - 1]:
        start -= 1

    body = ink[:start, :]
    if body.sum() == 0:
        raise SystemExit("nothing above the tagline band")

    br = np.nonzero(body.sum(1))[0]
    bc = np.nonzero(body.sum(0))[0]
    top, bottom = int(br.min()), int(br.max())
    left, right = int(bc.min()), int(bc.max())
    pad = max(4, int(round((bottom - top + 1) * PAD_RATIO)))

    box = (max(0, left - pad), max(0, top - pad),
           min(im.size[0], right + 1 + pad), min(start, bottom + 1 + pad))
    print("   tagline band rows %d..%d removed" % (start, end))
    return im.crop(box)


def unmatte(im, navy_to=None):
    """Lift the artwork off its white background, recovering true alpha.

    Every pixel is assumed to be one brand colour P composited over white at
    some coverage a:  C = P*a + White*(1-a).  Picking P by raw nearest-colour
    fails on antialiased edges — a half-covered navy pixel is mid-grey, which
    is numerically closer to teal than to navy — so instead we solve for the
    best (P, a) pair and keep whichever explains the pixel with the least
    residual. For each candidate the optimal coverage is the projection of
    (C - White) onto (P - White).
    """
    a = np.array(im.convert("RGBA")).astype(float)
    rgb = a[..., :3]
    delta = rgb - WHITE                        # H x W x 3

    best_res = None
    best_cov = None
    best_idx = None

    for i, P in enumerate(PALETTE):
        axis = P - WHITE                       # 3
        denom = float(axis @ axis)
        cov = np.clip((delta @ axis) / denom, 0.0, 1.0)
        recon = WHITE + cov[..., None] * axis
        res = np.linalg.norm(rgb - recon, axis=2)
        if best_res is None:
            best_res, best_cov = res, cov
            best_idx = np.zeros(res.shape, dtype=int)
        else:
            take = res < best_res
            best_res = np.where(take, res, best_res)
            best_cov = np.where(take, cov, best_cov)
            best_idx = np.where(take, i, best_idx)

    target = PALETTE[best_idx]

    # Anything effectively white is background.
    best_cov[np.abs(delta).max(2) <= WHITE_TOL] = 0.0

    out = target.copy()
    if navy_to is not None:
        out[best_idx == 0] = navy_to

    res_img = np.zeros_like(a)
    res_img[..., :3] = out
    res_img[..., 3] = best_cov * 255.0
    return Image.fromarray(res_img.round().clip(0, 255).astype("uint8"), "RGBA")


def save(im, name):
    path = os.path.join(ASSETS, name)
    im.save(path, "PNG", optimize=True)
    opaque = int((np.array(im)[..., 3] == 255).sum())
    clear = int((np.array(im)[..., 3] == 0).sum())
    print("   %-30s %dx%d  %.1f KB  (opaque %d / clear %d)"
          % (name, im.size[0], im.size[1], os.path.getsize(path) / 1024.0, opaque, clear))


print("source: %s" % SRC)
base = crop_tagline(Image.open(os.path.join(ASSETS, SRC)))

print("light variant (navy wordmark, transparent background)")
save(unmatte(base), "finlyttech-logo-light.png")

print("dark-background variant (white wordmark, transparent background)")
save(unmatte(base, navy_to=(255, 255, 255)), "finlyttech-logo-white.png")
