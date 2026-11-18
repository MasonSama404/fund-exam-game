#!/usr/bin/env python3
"""
Bundles modular source files in src/ into standalone zero-dependency HTML5 game:
- /Users/mason/fund-exam-game/index.html
- /Users/mason/fund-exam-game/dist/index.html
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"


def main():
    template = (SRC / "template.html").read_text(encoding="utf-8")
    css = (SRC / "styles.css").read_text(encoding="utf-8")

    js_files = [
        SRC / "data" / "levels_act1.js",
        SRC / "data" / "levels_act2_a.js",
        SRC / "data" / "levels_act2_b.js",
        SRC / "audio.js",
        SRC / "tower_canvas.js",
        SRC / "game.js",
    ]

    missing = [str(p) for p in js_files if not p.exists()]
    if missing:
        print("Missing source files:", missing, file=sys.stderr)
        sys.exit(1)

    js_bundle = "\n\n".join(p.read_text(encoding="utf-8") for p in js_files)

    html = template.replace("/*__INLINE_CSS__*/", css).replace("/*__INLINE_JS__*/", js_bundle)

    (ROOT / "index.html").write_text(html, encoding="utf-8")
    DIST.mkdir(parents=True, exist_ok=True)
    (DIST / "index.html").write_text(html, encoding="utf-8")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")

    size_kb = len(html.encode("utf-8")) / 1024
    print(f"Built index.html and dist/index.html successfully ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
