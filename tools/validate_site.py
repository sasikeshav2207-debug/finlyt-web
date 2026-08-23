# -*- coding: utf-8 -*-
"""Pre-deploy validation for the FinLytTech Jekyll site.

GitHub Pages builds remotely, so a broken build means a broken site. This
checks the things that would break it, plus every internal link and anchor.
"""
import io, os, re, sys, glob

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Repo root = parent of tools/, so this runs from anywhere.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors, warns = [], []
liquid_exempt = set()


def read(p):
    return io.open(p, encoding="utf-8", errors="replace").read()


def split_fm(txt):
    """Return (front_matter_dict, body) for a Jekyll file."""
    if not txt.startswith("---"):
        return None, txt
    end = txt.find("\n---", 3)
    if end == -1:
        return None, txt
    raw = txt[3:end]
    body = txt[end + 4:]
    fm = {}
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, body


# ---------------------------------------------------------------- collect
pages = {}          # url -> (path, body)
page_files = [f for f in glob.glob(os.path.join(ROOT, "*.html"))]

for p in page_files:
    txt = read(p)
    fm, body = split_fm(txt)
    name = os.path.basename(p)
    if fm is None:
        # No front matter: Jekyll copies the file verbatim and never runs
        # Liquid on it, so it is exempt from the template checks below.
        pages["/" + name] = (p, txt)
        liquid_exempt.add(name)
        continue
    if "permalink" in fm:
        url = fm["permalink"]
    elif name == "index.html":
        url = "/"
    else:
        url = "/" + name
    pages[url] = (p, body)
    if fm.get("layout") is None:
        errors.append("%s: front matter has no layout" % name)

# Blog posts -> /blog/<slug>/
for p in glob.glob(os.path.join(ROOT, "_posts", "*")):
    base = os.path.basename(p)
    m = re.match(r"\d{4}-\d{2}-\d{2}-(.+)\.(md|html)$", base)
    if m:
        pages["/blog/%s/" % m.group(1)] = (p, read(p))

layouts = {os.path.basename(p): read(p) for p in glob.glob(os.path.join(ROOT, "_layouts", "*.html"))}

print("Pages discovered (%d):" % len(pages))
for u in sorted(pages):
    print("   %s" % u)
print()

# ------------------------------------------------------------ liquid check
for name, txt in list(layouts.items()) + [(os.path.basename(v[0]), v[1]) for v in pages.values()]:
    if name in liquid_exempt:
        continue
    for open_tag, close_tag in (("if", "endif"), ("for", "endfor"), ("unless", "endunless")):
        o = len(re.findall(r"\{%-?\s*" + open_tag + r"\s", txt))
        c = len(re.findall(r"\{%-?\s*" + close_tag + r"\s*-?%\}", txt))
        if o != c:
            errors.append("%s: unbalanced {%% %s %%} (%d) vs {%% %s %%} (%d)"
                          % (name, open_tag, o, close_tag, c))
    if txt.count("{{") != txt.count("}}"):
        errors.append("%s: unbalanced {{ }} braces" % name)

# --------------------------------------------------------- anchors per page
anchors = {}
for url, (path, body) in pages.items():
    anchors[url] = set(re.findall(r'id="([^"]+)"', body))
# ids that live in the shared layout are available on every page
shell_ids = set()
for txt in layouts.values():
    shell_ids |= set(re.findall(r'id="([^"]+)"', txt))

# ----------------------------------------------------------------- links
link_sources = [(os.path.basename(v[0]), v[1]) for v in pages.values()]
link_sources += [("_layouts/" + k, v) for k, v in layouts.items()]

checked = 0
for name, txt in link_sources:
    for href in re.findall(r'href="([^"]+)"', txt):
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "{{", "{%")):
            continue
        checked += 1
        path, _, frag = href.partition("#")
        if not path:
            continue
        if path.endswith((".css", ".js", ".svg", ".png", ".jpg", ".xml", ".ico")):
            fs = os.path.join(ROOT, path.lstrip("/"))
            if not os.path.exists(fs):
                errors.append("%s: asset not found -> %s" % (name, href))
            continue
        if path not in pages:
            errors.append("%s: link target missing -> %s" % (name, href))
            continue
        if frag and frag not in anchors.get(path, set()) and frag not in shell_ids:
            warns.append("%s: anchor #%s not found on %s" % (name, frag, path))

# --------------------------------------------------------------- assets
for must in ["assets/finlyt.css", "assets/finlyt.js", "assets/colors_and_type.css",
             "assets/blog.css", "assets/finlyttech-lockup-light.png",
             "assets/finlyttech-app-icon.png", "assets/founder.jpg", "CNAME"]:
    if not os.path.exists(os.path.join(ROOT, must)):
        errors.append("missing required file: %s" % must)

# CNAME sanity
cname = read(os.path.join(ROOT, "CNAME")).strip()
if cname != "finlyt.net":
    errors.append("CNAME is %r, expected finlyt.net" % cname)

# --------------------------------------------------------------- report
print("Internal links checked: %d" % checked)
print()
if warns:
    print("WARNINGS (%d)" % len(warns))
    for w in sorted(set(warns)):
        print("   ! " + w)
    print()
if errors:
    print("ERRORS (%d)" % len(errors))
    for e in sorted(set(errors)):
        print("   x " + e)
    sys.exit(1)
print("PASS - no build-breaking problems found.")
