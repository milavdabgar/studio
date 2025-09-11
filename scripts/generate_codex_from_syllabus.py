#!/usr/bin/env python3
"""
Generate simple SVG diagrams ("codex") for each unit/topic in a syllabus JSON.

Usage:
  python scripts/generate_codex_from_syllabus.py <subject_dir>

Where <subject_dir> contains a syllabus JSON file (e.g., 1313202.json, DI01032011.json).
This script will create a `codex/unit-<n>/` folder with:
  - index.svg: Unit index linking to topic SVGs
  - topic SVGs: one per topic, listing its subtopics

Notes:
  - Handles two schema variants found in this repo:
    1) `underpinningTheory` (units with `topics` each having `subtopics`)
    2) `courseContent` (units with `content` list of strings)
  - Filenames are slugified from topic numbers/titles for readability.
"""
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple


def slugify(text: str) -> str:
  text = text.strip().lower()
  text = re.sub(r"[^a-z0-9]+", "-", text)
  text = re.sub(r"-+", "-", text)
  return text.strip("-") or "topic"


def find_syllabus_json(subject_dir: Path) -> Path:
  # Prefer a file that matches a known course code pattern or the only .json present
  json_files = sorted(p for p in subject_dir.glob("*.json") if p.is_file())
  if not json_files:
    raise FileNotFoundError(f"No syllabus JSON found in {subject_dir}")
  # Heuristic: prefer the shortest filename (often just the code), else first
  json_files.sort(key=lambda p: len(p.name))
  return json_files[0]


def parse_units(data: Dict[str, Any]) -> List[Dict[str, Any]]:
  units: List[Dict[str, Any]] = []

  # Schema 1: underpinningTheory
  if isinstance(data.get("underpinningTheory"), list):
    for u in data["underpinningTheory"]:
      unit_no = str(u.get("unitNumber") or u.get("unit") or "")
      topics = []
      for t in u.get("topics", []):
        tnum = str(t.get("topicNumber") or "")
        title = str(t.get("title") or "")
        subs = [str(s) for s in t.get("subtopics", [])]
        topics.append({"topicNumber": tnum, "title": title, "subtopics": subs})
      if topics:
        units.append({
          "unitNumber": unit_no,
          "unitTitle": str(u.get("unitTitle") or ""),
          "topics": topics,
        })

  # Schema 2: courseContent
  elif isinstance(data.get("courseContent"), list):
    for u in data["courseContent"]:
      unit_no = str(u.get("unitNumber") or "")
      content_list = u.get("content", [])
      topics = []
      for idx, item in enumerate(content_list, start=1):
        title = str(item)
        topics.append({
          "topicNumber": f"{unit_no}.{idx}",
          "title": title,
          "subtopics": [],
        })
      if topics:
        units.append({
          "unitNumber": unit_no,
          "unitTitle": str(u.get("unitTitle") or ""),
          "topics": topics,
        })
  else:
    raise ValueError("Unsupported syllabus schema: expected 'underpinningTheory' or 'courseContent'")

  return units


def write_file(path: Path, content: str) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(content, encoding="utf-8")


def build_topic_svg(unit_title: str, topic_number: str, topic_title: str, subtopics: List[str]) -> str:
  # Simple layout with header and bullet-like list for subtopics
  width, height = 1000, max(260, 140 + 28 * max(1, len(subtopics)))
  safe_unit = (unit_title or "Unit").replace("&", "&amp;")
  safe_ttitle = (topic_title or "Topic").replace("&", "&amp;")
  lines = []
  y = 140
  if subtopics:
    for s in subtopics:
      s = str(s).replace("&", "&amp;")
      lines.append(f'<text x="80" y="{y}" class="t">• {s}</text>')
      y += 28
  else:
    lines.append(f'<text x="80" y="{y}" class="t">• Key points: {safe_ttitle}</text>')

  return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{safe_ttitle}">
  <title>{safe_unit} • {topic_number} {safe_ttitle}</title>
  <defs>
    <style>
      .h1 {{ font: 22px sans-serif; font-weight: 700; fill: #0f172a; }}
      .h2 {{ font: 18px sans-serif; font-weight: 600; fill: #0f172a; }}
      .t {{ font: 15px sans-serif; fill: #111827; }}
      .box {{ fill: #f8fafc; stroke: #cbd5e1; }}
    </style>
  </defs>
  <rect x="20" y="20" width="{width-40}" height="{height-40}" rx="14" class="box"/>
  <text x="40" y="60" class="h1">{safe_unit}</text>
  <text x="40" y="100" class="h2">{topic_number} — {safe_ttitle}</text>
  {"\n  ".join(lines)}
</svg>
'''


def build_index_svg(unit_title: str, topics: List[Tuple[str, str, str]]) -> str:
  # topics: list of (display text, filename, group)
  width, height = 1000, 120 + 28 * max(3, len(topics))
  safe_unit = (unit_title or "Unit").replace("&", "&amp;")

  link_lines = []
  y = 120
  for disp, fname, _grp in topics:
    disp = disp.replace("&", "&amp;")
    link_lines.append(f'<a xlink:href="{fname}"><text x="60" y="{y}" class="t">{disp}</text></a>')
    y += 28

  return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{safe_unit} index">
  <title>{safe_unit} — Topic Index</title>
  <defs>
    <style>
      .h {{ font: 22px sans-serif; font-weight: 700; fill: #0f172a; }}
      .t {{ font: 15px sans-serif; fill: #0369a1; text-decoration: underline; }}
      .box {{ fill: #f8fafc; stroke: #cbd5e1; }}
    </style>
  </defs>
  <rect x="20" y="20" width="{width-40}" height="{height-40}" rx="14" class="box"/>
  <text x="40" y="60" class="h">{safe_unit}</text>
  {"\n  ".join(link_lines)}
</svg>
'''


def main(subject_dir_str: str) -> None:
  subject_dir = Path(subject_dir_str).resolve()
  syllabus_path = find_syllabus_json(subject_dir)
  data = json.loads(syllabus_path.read_text(encoding="utf-8"))

  # Identify subject title for context
  title = (
    (data.get("courseInfo") or {}).get("courseTitle")
    or (data.get("courseInfo") or {}).get("subjectName")
    or subject_dir.name
  )

  units = parse_units(data)
  if not units:
    raise SystemExit(f"No units/topics found in {syllabus_path}")

  # Create codex folder structure and generate SVGs
  codex_root = subject_dir / "codex"
  for u in units:
    unit_no_raw = str(u.get("unitNumber") or "").strip()
    # Normalize unit number to integer-like for folder name
    unit_digits = re.sub(r"[^0-9]", "", unit_no_raw) or unit_no_raw or ""
    unit_folder = codex_root / f"unit-{unit_digits or len(units)}"
    unit_folder.mkdir(parents=True, exist_ok=True)

    unit_title = u.get("unitTitle") or f"Unit {unit_digits}"

    # Build topic files and index entries
    index_entries: List[Tuple[str, str, str]] = []
    for t in u.get("topics", []):
      tnum = str(t.get("topicNumber") or "").strip()
      # Normalize topic number (e.g., 1.1 -> 1-1)
      tnum_disp = tnum or ""
      tnum_slug = tnum.replace(".", "-") if tnum else ""
      title_str = str(t.get("title") or "Topic").strip()
      fname = f"{tnum_slug + '-' if tnum_slug else ''}{slugify(title_str)}.svg"

      svg = build_topic_svg(unit_title, tnum_disp, title_str, t.get("subtopics", []))
      write_file(unit_folder / fname, svg)
      index_entries.append((f"{tnum_disp} {title_str}".strip(), fname, ""))

    # Unit index
    index_svg = build_index_svg(unit_title, index_entries)
    write_file(unit_folder / "index.svg", index_svg)

  print(f"Generated codex SVGs for '{title}' in {codex_root}")


if __name__ == "__main__":
  if len(sys.argv) != 2:
    print("Usage: python scripts/generate_codex_from_syllabus.py <subject_dir>")
    sys.exit(1)
  main(sys.argv[1])

