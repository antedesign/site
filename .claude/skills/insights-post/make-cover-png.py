#!/usr/bin/env python3
"""Render an Insights cover SVG to the 1200x630 PNG used for og:image.

Social platforms do not render SVG, so every post needs both files.

    python3 .claude/skills/insights-post/make-cover-png.py <slug>

Run it from the repository root. Needs cairosvg:

    pip install cairosvg
"""

import sys
from pathlib import Path

COVER_DIR = Path("assets/images/insights")
WIDTH, HEIGHT = 1200, 630


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    slug = sys.argv[1].removesuffix(".svg")
    svg = COVER_DIR / f"{slug}.svg"
    png = COVER_DIR / f"{slug}.png"

    if not svg.exists():
        print(f"error: {svg} not found.")
        print("Draw the cover first, using double-diamond-design-process.svg as the template.")
        return 1

    try:
        import cairosvg
    except ImportError:
        print("error: cairosvg is not installed. Run: pip install cairosvg")
        return 1

    cairosvg.svg2png(
        url=str(svg),
        write_to=str(png),
        output_width=WIDTH,
        output_height=HEIGHT,
    )

    print(f"wrote {png} ({WIDTH}x{HEIGHT}, {png.stat().st_size // 1024} KB)")
    print(f"point og:image at https://antedesign.be/{png}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
