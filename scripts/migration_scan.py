from __future__ import annotations
import csv
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
TARGET_EXTS = {".js", ".jsx", ".ts", ".tsx"}
SKIP_PARTS = {"node_modules", ".git", "dist", "build", "coverage"}

patterns = {
    "material_ui_import": re.compile(r"@material-ui|@mui/|material-ui"),
    "jsx_extension": None,  # handled separately
    "src_old_components": None,
    "uses_state_effect": re.compile(r"\buse(State|Effect)\b"),
    "uses_fetch": re.compile(r"\bfetch\s*\("),
    "react_router": re.compile(r"react-router"),
}

issue_labels = {
    "material_ui_import": "Material UI import",
    "jsx_extension": ".jsx extension",
    "src_old_components": "Under src-old/components",
    "uses_state_effect": "useState/useEffect (likely use client)",
    "uses_fetch": "fetch() instead of Apollo",
    "react_router": "React Router usage",
}

recommended_target = "Convert to Next.js 14 TypeScript component under components/* with shadcn/ui and Apollo hooks"

rows = []
for file_path in ROOT.rglob("*"):
    if not file_path.is_file():
        continue
    if file_path.suffix not in TARGET_EXTS:
        continue
    if any(part in SKIP_PARTS for part in file_path.parts):
        continue

    rel_path = file_path.relative_to(ROOT)
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    issues = []

    if patterns["material_ui_import"].search(text):
        issues.append(issue_labels["material_ui_import"])

    if file_path.suffix == ".jsx":
        issues.append(issue_labels["jsx_extension"])

    if "src-old/components" in str(rel_path):
        issues.append(issue_labels["src_old_components"])

    if patterns["uses_state_effect"].search(text):
        issues.append(issue_labels["uses_state_effect"])

    if patterns["uses_fetch"].search(text):
        issues.append(issue_labels["uses_fetch"])

    if patterns["react_router"].search(text):
        issues.append(issue_labels["react_router"])

    if issues:
        rows.append((str(rel_path), "; ".join(sorted(set(issues))), recommended_target))

output_path = ROOT / "migration_report.csv"
with output_path.open("w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["file_path", "detected_issues", "recommended_migration_target"])
    writer.writerows(rows)

print(f"Wrote {len(rows)} rows to {output_path}")
