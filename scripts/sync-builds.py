#!/usr/bin/env python3
"""
Auto-sync script for 286 Builds Dashboard
Fetches the latest builds.json from breakingthebot/286-builds and updates dashboard stats.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from collections import Counter

SOURCE_URL = "https://raw.githubusercontent.com/breakingthebot/286-builds/main/builds.json"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "builds.json")
STATS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "stats.json")


def fetch_builds(url: str) -> list:
    """Fetch and parse builds.json from the remote URL."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "286-builds-dashboard-sync/1.0 (github.com/breakingthebot/286-builds-dashboard)"
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"❌ HTTP error fetching builds.json: {exc.code} {exc.reason}")
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"❌ Network error fetching builds.json: {exc.reason}")
        sys.exit(1)
    except json.JSONDecodeError as exc:
        print(f"❌ Invalid JSON in remote builds.json: {exc}")
        sys.exit(1)


def compute_stats(builds: list) -> dict:
    """Compute dashboard stats from the builds list."""
    if not builds:
        return {}

    categories = Counter(b.get("category", "Uncategorized") for b in builds)
    depths = Counter(b.get("depth", "Unknown") for b in builds)

    # Technology/language counts — each build has a single 'technology' string
    technologies = Counter(
        b.get("technology", "Unknown") for b in builds if b.get("technology")
    )

    # Stack tag counts (array field)
    stack_tags: Counter = Counter()
    for b in builds:
        for tag in b.get("stack", []):
            stack_tags[tag] += 1

    return {
        "totalBuilds": len(builds),
        "totalCategories": len(categories),
        "totalTechnologies": len(technologies),
        "deepBuilds": depths.get("Deep", 0),
        "expandedBuilds": depths.get("Expanded", 0),
        "basicBuilds": depths.get("Basic", 0),
        "byCategory": dict(categories.most_common()),
        "byDepth": dict(depths),
        "topTechnologies": dict(technologies.most_common(10)),
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }


def load_existing(path: str) -> list:
    """Load existing builds.json if it exists."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_json(path: str, data) -> None:
    """Write JSON data to a file, creating directories if needed."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main() -> int:
    print("🔄 Syncing builds.json from 286-builds...")

    # Fetch remote data
    remote_builds = fetch_builds(SOURCE_URL)
    print(f"✅ Fetched {len(remote_builds)} builds from remote")

    # Load existing local data
    output_path = os.path.normpath(OUTPUT_PATH)
    existing_builds = load_existing(output_path)
    print(f"📁 Existing local builds: {len(existing_builds)}")

    # Detect changes
    remote_nums = {b.get("build_number") for b in remote_builds}
    existing_nums = {b.get("build_number") for b in existing_builds}
    new_nums = remote_nums - existing_nums

    if new_nums:
        print(f"🆕 New builds detected: {sorted(new_nums)}")
    elif remote_builds == existing_builds:
        print("✅ No changes detected — dashboard is already up to date")
    else:
        print("📝 Builds data has changed (content update)")

    # Always write the latest data (preserves ordering from source)
    save_json(output_path, remote_builds)
    print(f"💾 Saved {len(remote_builds)} builds to {output_path}")

    # Compute and save stats
    stats = compute_stats(remote_builds)
    stats_path = os.path.normpath(STATS_PATH)
    save_json(stats_path, stats)
    print(f"📊 Stats saved to {stats_path}")
    print(f"   Total builds:     {stats['totalBuilds']}")
    print(f"   Deep builds:      {stats['deepBuilds']}")
    print(f"   Expanded builds:  {stats['expandedBuilds']}")
    print(f"   Basic builds:     {stats['basicBuilds']}")
    print(f"   Categories:       {stats['totalCategories']}")

    # Automatically update README.md counts
    update_readme(stats['totalBuilds'])

    return 0

def update_readme(total_builds: int) -> None:
    readme_path = os.path.join(os.path.dirname(__file__), "..", "README.md")
    if not os.path.exists(readme_path):
        return
        
    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    import re
    new_content = re.sub(
        r"across \d+ completed projects",
        f"across {total_builds} completed projects",
        content
    )
    
    if new_content != content:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"📝 Automatically updated README.md to show {total_builds} completed projects")


if __name__ == "__main__":
    sys.exit(main())
