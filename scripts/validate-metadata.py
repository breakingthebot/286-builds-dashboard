#!/usr/bin/env python3
"""
Metadata Validator for 286 Builds Dashboard
Validates builds.json for required fields, date formats, depth values, and category consistency.
"""

import json
import re
import sys
from datetime import datetime

REQUIRED_FIELDS = ["build_number", "date", "project_name", "category", "depth"]

VALID_DEPTHS = {"Deep", "Expanded", "Basic"}

VALID_CATEGORIES = {
    "Web Frontend",
    "Backend & Networking",
    "Automation & DevOps",
    "CLI Tools",
    "Data & Analytics",
    "Desktop & Console Apps",
    "Libraries & Packages",
    "Mobile Apps",
}

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate_builds(builds: list) -> tuple[list, bool]:
    """Validate all builds and return (errors, has_errors)."""
    errors = []

    if not isinstance(builds, list):
        return [{"build": "root", "error": "builds.json must contain a JSON array"}], True

    for i, build in enumerate(builds):
        build_id = build.get("build_number", f"index {i}")
        name = build.get("project_name", f"build #{build_id}")

        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in build or build[field] is None or build[field] == "":
                errors.append({
                    "build": build_id,
                    "name": name,
                    "field": field,
                    "error": f"Missing or empty required field: {field}",
                })

        # Validate date format
        date_val = build.get("date", "")
        if date_val:
            if not DATE_PATTERN.match(str(date_val)):
                errors.append({
                    "build": build_id,
                    "name": name,
                    "field": "date",
                    "error": f"Invalid date format '{date_val}' — expected YYYY-MM-DD",
                })
            else:
                try:
                    datetime.strptime(str(date_val), "%Y-%m-%d")
                except ValueError:
                    errors.append({
                        "build": build_id,
                        "name": name,
                        "field": "date",
                        "error": f"Invalid calendar date: {date_val}",
                    })

        # Validate depth
        depth_val = build.get("depth", "")
        if depth_val and depth_val not in VALID_DEPTHS:
            errors.append({
                "build": build_id,
                "name": name,
                "field": "depth",
                "error": f"Invalid depth '{depth_val}' — must be one of: {', '.join(sorted(VALID_DEPTHS))}",
            })

        # Validate category
        category_val = build.get("category", "")
        if category_val and category_val not in VALID_CATEGORIES:
            errors.append({
                "build": build_id,
                "name": name,
                "field": "category",
                "error": f"Unknown category '{category_val}' — known: {', '.join(sorted(VALID_CATEGORIES))}",
            })

        # Validate build_number is a positive integer
        build_num = build.get("build_number")
        if build_num is not None:
            if not isinstance(build_num, int) or build_num < 1:
                errors.append({
                    "build": build_id,
                    "name": name,
                    "field": "build_number",
                    "error": f"build_number must be a positive integer, got: {build_num!r}",
                })

        # Validate repo_url if present
        repo_url = build.get("repo_url", "")
        if repo_url and not repo_url.startswith("http"):
            errors.append({
                "build": build_id,
                "name": name,
                "field": "repo_url",
                "error": f"repo_url must start with http(s): {repo_url}",
            })

    return errors, len(errors) > 0


def check_duplicates(builds: list) -> list:
    """Check for duplicate build numbers."""
    warnings = []
    seen = {}
    for build in builds:
        num = build.get("build_number")
        if num is None:
            continue
        if num in seen:
            warnings.append(
                f"Duplicate build_number {num}: '{seen[num]}' and '{build.get('project_name', '?')}'"
            )
        else:
            seen[num] = build.get("project_name", "?")
    return warnings


def print_summary(builds: list, errors: list, warnings: list, has_errors: bool) -> None:
    """Print a formatted validation summary."""
    total = len(builds) if isinstance(builds, list) else 0
    print(f"\n📋 Metadata Validation Report")
    print(f"{'=' * 50}")
    print(f"Total builds checked: {total}")
    print(f"Errors found:         {len(errors)}")
    print(f"Warnings found:       {len(warnings)}")
    print()

    if warnings:
        print("⚠️  Warnings:")
        for w in warnings:
            print(f"   • {w}")
        print()

    if errors:
        print("❌ Validation Errors:")
        for e in errors:
            print(f"   Build #{e['build']} ({e.get('name', '?')}) — {e['field']}: {e['error']}")
        print()
        print("❌ Validation FAILED")
    else:
        print("✅ All metadata is valid!")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: validate-metadata.py <path-to-builds.json>")
        return 1

    builds_path = sys.argv[1]

    try:
        with open(builds_path, encoding="utf-8") as f:
            builds = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {builds_path}")
        return 1
    except json.JSONDecodeError as exc:
        print(f"❌ Invalid JSON in {builds_path}: {exc}")
        return 1

    errors, has_errors = validate_builds(builds)
    warnings = check_duplicates(builds) if isinstance(builds, list) else []
    print_summary(builds, errors, warnings, has_errors)

    return 1 if has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
