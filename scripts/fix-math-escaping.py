#!/usr/bin/env python3
"""
Fix math escaping issues in MDX blog files.

Fixes inside math delimiters ($...$ and $$...$$) only:
1. \_ → _ (Hexo escaping not needed in KaTeX/MDX)
2. \\ before LaTeX commands → \ (e.g. \\frac → \frac)
3. \\\\ (quad backslash, line breaks) → \\ (double backslash)
"""

import os
import re
import sys
from pathlib import Path

BLOG_DIR = Path("/data/workspace/ai-blog/data/blog")

LINEBREAK_PLACEHOLDER = "__MATH_LINEBREAK_PLACEHOLDER__"


def fix_math_content(math_str: str) -> str:
    """Apply escaping fixes inside a math region."""
    s = math_str

    # Step a: Replace \\\\ (4 backslashes = literal \\\\) with placeholder
    # In the file, \\\\ means two literal backslashes, which is a LaTeX line break
    s = s.replace("\\\\\\\\", LINEBREAK_PLACEHOLDER)

    # Step b: Replace \_ with _
    s = s.replace("\\_", "_")

    # Step c: Replace \\ followed by a letter with \ + letter
    # This handles \\frac → \frac, \\sum → \sum, \\text → \text, etc.
    # Pattern: two literal backslashes followed by a letter → one backslash + letter
    s = re.sub(r"\\\\([a-zA-Z])", r"\\\1", s)

    # Step d: Replace placeholder with \\ (the correct LaTeX line break)
    s = s.replace(LINEBREAK_PLACEHOLDER, "\\\\")

    return s


def process_file(filepath: Path) -> dict:
    """Process a single MDX file. Returns change info."""
    content = filepath.read_text(encoding="utf-8")
    original = content

    # We need to find math regions and only fix inside them.
    # Strategy: process the file character by character, tracking math delimiters.
    # Handle $$ first, then $.

    result = []
    i = 0
    n = len(content)
    changes = 0
    change_details = []

    while i < n:
        # Check for display math $$...$$
        if content[i:i+2] == "$$":
            # Find the closing $$
            end = content.find("$$", i + 2)
            if end == -1:
                # No closing $$, just append rest as-is
                result.append(content[i:])
                i = n
                continue

            # Extract the math region (between the $$)
            math_open = "$$"
            math_content = content[i+2:end]
            math_close = "$$"

            fixed = fix_math_content(math_content)
            if fixed != math_content:
                changes += 1
                # Count specific fixes
                diff_count = sum(1 for a, b in zip(math_content, fixed) if a != b) + abs(len(math_content) - len(fixed))
                change_details.append(f"  Display math block at offset {i}: {diff_count} char changes")

            result.append(math_open)
            result.append(fixed)
            result.append(math_close)
            i = end + 2
            continue

        # Check for inline math $...$
        # Make sure it's not an escaped $ or part of code
        if content[i] == "$" and (i == 0 or content[i-1] != "\\"):
            # Find the closing $ (not $$, not escaped)
            j = i + 1
            found_close = False
            while j < n:
                if content[j] == "$" and content[j-1] != "\\":
                    # Make sure it's not $$ (which would be display math start)
                    if j + 1 < n and content[j+1] == "$":
                        j += 1
                        continue
                    # Found closing $
                    found_close = True
                    break
                # Don't span across blank lines (inline math shouldn't)
                if content[j] == "\n" and j + 1 < n and content[j+1] == "\n":
                    break
                j += 1

            if found_close:
                math_content = content[i+1:j]
                fixed = fix_math_content(math_content)
                if fixed != math_content:
                    changes += 1
                    change_details.append(f"  Inline math at offset {i}: '{math_content[:60]}' → '{fixed[:60]}'")

                result.append("$")
                result.append(fixed)
                result.append("$")
                i = j + 1
                continue

        result.append(content[i])
        i += 1

    new_content = "".join(result)

    if new_content != original:
        filepath.write_text(new_content, encoding="utf-8")
        return {"file": filepath.name, "changed": True, "regions": changes, "details": change_details}
    else:
        return {"file": filepath.name, "changed": False, "regions": 0, "details": []}


def main():
    mdx_files = sorted(BLOG_DIR.glob("*.mdx"))
    print(f"Found {len(mdx_files)} .mdx files in {BLOG_DIR}\n")

    total_changed = 0
    total_regions = 0

    for filepath in mdx_files:
        info = process_file(filepath)
        if info["changed"]:
            total_changed += 1
            total_regions += info["regions"]
            print(f"✓ {info['file']}: {info['regions']} math region(s) fixed")
            for detail in info["details"][:10]:  # Show first 10 details per file
                print(detail)
            if len(info["details"]) > 10:
                print(f"  ... and {len(info['details']) - 10} more")
            print()

    print(f"\n{'='*60}")
    print(f"Summary: {total_changed} file(s) modified, {total_regions} math region(s) fixed")
    print(f"Total .mdx files scanned: {len(mdx_files)}")


if __name__ == "__main__":
    main()
