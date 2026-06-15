#!/usr/bin/env python3
"""Generate placeholder PNG icons for the amoCRM widget.

amoCRM requires `logo.png` (168x168) and `logo_min.png` (32x32). This script
produces simple branded placeholders using only the standard library, so no
Pillow/ImageMagick is needed. Replace the output with your real logo when ready.

Usage:
    python3 amocrm-widget/images/generate-icons.py
"""

import os
import struct
import zlib

BRAND = (37, 99, 235)  # blue-600


def write_png(path: str, w: int, h: int, rgb: tuple[int, int, int]) -> None:
    r, g, b = rgb
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter type: none
        for x in range(w):
            # Two overlapping squares to hint at "compare two plans".
            in1 = (w * 0.18 < x < w * 0.62) and (h * 0.20 < y < h * 0.64)
            in2 = (w * 0.38 < x < w * 0.82) and (h * 0.36 < y < h * 0.80)
            if in1 and in2:
                raw += bytes((255, 255, 255))
            elif in1 or in2:
                raw += bytes((235, 238, 245))
            else:
                raw += bytes((r, g, b))

    def chunk(typ: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit RGB
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    write_png(os.path.join(here, "logo.png"), 168, 168, BRAND)
    write_png(os.path.join(here, "logo_min.png"), 32, 32, BRAND)
    print("Wrote logo.png (168x168) and logo_min.png (32x32)")


if __name__ == "__main__":
    main()
