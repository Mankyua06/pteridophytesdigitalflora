"""Strict, portable theme settings; never accepts arbitrary CSS."""
import re

from openpyxl import load_workbook

DEFAULTS = {
    "background_color": "#f6f5ef", "text_color": "#203b2f",
    "muted_color": "#657267", "border_color": "#d4dcd1",
    "accent_color": "#315c43", "surface_color": "#e6ebdf",
    "body_font": "system", "heading_font": "system",
    "base_font_size": "16", "heading_font_size": "48",
}


def resolve(rows):
    result = dict(DEFAULTS)
    seen = set()
    for row in rows:
        key, value = row.get("key"), row.get("value")
        if key not in DEFAULTS or key in seen:
            raise ValueError(f"Unknown or duplicate theme key: {key}")
        seen.add(key)
        if value is None or str(value).strip() == "":
            continue
        value = str(value).strip()
        if key.endswith("_color"):
            valid = re.fullmatch(r"#[0-9a-fA-F]{6}", value)
        elif key.endswith("_font"):
            valid = value in ("system", "serif", "sans")
        else:
            low, high = (12, 24) if key == "base_font_size" else (24, 72)
            valid = value.isdigit() and low <= int(value) <= high
        if not valid:
            raise ValueError(f"Invalid theme value: {key}={value}")
        result[key] = value
    return result


def read_master(ctx):
    wb = load_workbook(ctx.master, read_only=True, data_only=False)
    try:
        if "11_Site_Theme" not in wb.sheetnames:
            return resolve([])
        ws = wb["11_Site_Theme"]
        header = [c.value for c in ws[1]]
        if header.count("key") != 1 or header.count("value") != 1:
            raise ValueError("Theme sheet requires unique key and value headers")
        records = []
        for cells in ws.iter_rows(min_row=2):
            if all(c.value is None for c in cells):
                continue
            if any(c.data_type == "f" for h, c in zip(header, cells) if h in ("key", "value")):
                raise ValueError("Theme formulas are not supported")
            records.append({h: c.value for h, c in zip(header, cells)})
        return resolve(records)
    finally:
        wb.close()
