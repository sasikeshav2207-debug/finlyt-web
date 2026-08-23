# -*- coding: utf-8 -*-
"""Find layout that cannot survive a 360px viewport.

The pages come out of a design tool as inline styles, so the responsive layer
in finlyt.css can only reach an element if the markup tags it with a collapse
class (g2 / g3 / g4 / split). Anything else keeps its desktop geometry on a
phone. This reports the three ways that goes wrong:

  UNTAGGED GRID   a multi-column grid with no collapse class -- stays
                  multi-column at 360px and overflows.

  FIXED HEIGHT    an element that DOES collapse, but pins height/min-height
                  in px. Stacking three columns into three rows inside a
                  300px box crushes all three. This is what broke the home
                  hero visual.

  WIDE FLOOR      a minmax() or min-width floor wider than 360px, which
                  forces a horizontal scrollbar no matter what the grid does.

Run:  python tools/audit_mobile.py
"""
import io
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PHONE = 360

COLLAPSE = ("g2", "g3", "g4", "split")

# An opening tag, captured whole so we can inspect its class and style.
TAG = re.compile(r"<(div|section|ul|ol|nav|figure)\b[^>]*>", re.I)
CLASSES = re.compile(r'class="([^"]*)"')
STYLE = re.compile(r'style="([^"]*)"')

MULTICOL = re.compile(r"grid-template-columns\s*:\s*([^;\"]+)")
HEIGHT = re.compile(r"(?<!line-)(?<!max-)\b(min-height|height)\s*:\s*(\d+)px")
FLOOR = re.compile(r"(?:minmax\(\s*(\d+)px|(?<!max-)\bmin-width\s*:\s*(\d+)px)")


def columns_of(decl):
    """Rough column count for a grid-template-columns value."""
    decl = decl.strip()
    m = re.match(r"repeat\(\s*(\d+)\s*,", decl)
    if m:
        return int(m.group(1))
    if decl.startswith("repeat(auto"):
        return 2  # auto-fit with a floor behaves as multi-column on desktop
    # Count top-level tracks, ignoring commas inside minmax(...)
    depth = 0
    tracks = 1
    for ch in decl:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == " " and depth == 0:
            tracks += 1
    return len([t for t in decl.split() if t]) if tracks else 1


def audit(path):
    html = io.open(path, encoding="utf-8").read()
    out = []
    for m in TAG.finditer(html):
        tag = m.group(0)
        line = html.count("\n", 0, m.start()) + 1
        cls = (CLASSES.search(tag).group(1) if CLASSES.search(tag) else "")
        sty = (STYLE.search(tag).group(1) if STYLE.search(tag) else "")
        if not sty:
            continue
        tagged = any(c in cls.split() for c in COLLAPSE)

        gm = MULTICOL.search(sty)
        if gm and columns_of(gm.group(1)) > 1 and not tagged:
            out.append((line, "UNTAGGED GRID",
                        "grid-template-columns:" + gm.group(1).strip()[:44]))

        if tagged:
            hm = HEIGHT.search(sty)
            if hm and int(hm.group(2)) > 120:
                out.append((line, "FIXED HEIGHT",
                            "%s:%spx on a collapsing grid" % (hm.group(1), hm.group(2))))

        for fm in FLOOR.finditer(sty):
            px = int(fm.group(1) or fm.group(2))
            if px > PHONE:
                out.append((line, "WIDE FLOOR", "%dpx floor > %dpx viewport" % (px, PHONE)))
    return out


def main():
    total = 0
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        rows = audit(os.path.join(ROOT, name))
        if not rows:
            continue
        print("\n%s" % name)
        for line, kind, detail in rows:
            print("  %-5s %-14s %s" % (line, kind, detail))
            total += 1
    print("\n%d potential mobile problems" % total)


if __name__ == "__main__":
    main()
