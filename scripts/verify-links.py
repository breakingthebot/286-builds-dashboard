#!/usr/bin/env python3
"""
Link Verifier for 286 Builds Dashboard
Tests all repo_url links in builds.json, checks HTTP status, and verifies README.md existence.
"""

import json
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

TIMEOUT = 15  # seconds per request
MAX_WORKERS = 5  # parallel requests (be polite to GitHub)
README_PATHS = ["README.md", "readme.md", "Readme.md"]


def check_url(url: str) -> tuple[bool, int, str]:
    """
    Check if a URL returns HTTP 200.
    Returns (is_alive, status_code, error_message).
    """
    if not url:
        return False, 0, "Empty URL"

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "286-builds-dashboard-link-checker/1.0 (github.com/breakingthebot/286-builds-dashboard)"
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return True, resp.status, ""
    except urllib.error.HTTPError as exc:
        return False, exc.code, str(exc.reason)
    except urllib.error.URLError as exc:
        return False, 0, str(exc.reason)
    except Exception as exc:
        return False, 0, str(exc)


def github_raw_url(repo_url: str, path: str) -> Optional[str]:
    """Convert a GitHub repo URL to a raw content URL."""
    # https://github.com/user/repo -> https://raw.githubusercontent.com/user/repo/main/README.md
    if not repo_url.startswith("https://github.com/"):
        return None
    parts = repo_url.rstrip("/").split("/")
    if len(parts) < 5:
        return None
    user, repo = parts[3], parts[4]
    return f"https://raw.githubusercontent.com/{user}/{repo}/main/{path}"


def check_readme(repo_url: str) -> tuple[bool, str]:
    """Check if a README.md exists in the repo's main branch."""
    for readme_name in README_PATHS:
        raw_url = github_raw_url(repo_url, readme_name)
        if raw_url:
            alive, status, _ = check_url(raw_url)
            if alive:
                return True, readme_name
    return False, ""


def verify_build(build: dict) -> dict:
    """Verify a single build's links and return a result dict."""
    build_num = build.get("build_number", "?")
    name = build.get("project_name", "?")
    repo_url = build.get("repo_url", "")

    result = {
        "build_number": build_num,
        "project_name": name,
        "repo_url": repo_url,
        "repo_alive": False,
        "repo_status": 0,
        "repo_error": "",
        "has_readme": False,
        "readme_name": "",
    }

    if not repo_url:
        result["repo_error"] = "No repo_url"
        return result

    # Check repo page
    alive, status, error = check_url(repo_url)
    result["repo_alive"] = alive
    result["repo_status"] = status
    result["repo_error"] = error

    # Check README (only if repo is reachable)
    if alive:
        has_readme, readme_name = check_readme(repo_url)
        result["has_readme"] = has_readme
        result["readme_name"] = readme_name

    return result


def print_report(results: list, total: int) -> None:
    """Print a formatted link verification report."""
    broken = [r for r in results if not r["repo_alive"]]
    no_readme = [r for r in results if r["repo_alive"] and not r["has_readme"]]

    print(f"\n🔗 Link Verification Report")
    print(f"{'=' * 50}")
    print(f"Total builds checked: {total}")
    print(f"Repos alive:          {total - len(broken)}/{total}")
    print(f"Missing README:       {len(no_readme)}")
    print()

    if broken:
        print("❌ Broken / Unreachable Repos:")
        for r in broken:
            status = f"HTTP {r['repo_status']}" if r["repo_status"] else r["repo_error"]
            print(f"   Build #{r['build_number']} ({r['project_name']})")
            print(f"     URL:    {r['repo_url']}")
            print(f"     Status: {status}")
        print()

    if no_readme:
        print("⚠️  Repos Without README.md:")
        for r in no_readme:
            print(f"   Build #{r['build_number']} ({r['project_name']}): {r['repo_url']}")
        print()

    if not broken and not no_readme:
        print("✅ All links are alive and all repos have README.md!")
    elif not broken:
        print("✅ All repo links are alive.")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: verify-links.py <path-to-builds.json>")
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

    if not isinstance(builds, list):
        print("❌ builds.json must contain a JSON array")
        return 1

    print(f"🔍 Verifying links for {len(builds)} builds (this may take a moment)...")

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(verify_build, build): build for build in builds}
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            status = "✅" if result["repo_alive"] else "❌"
            print(f"  {status} Build #{result['build_number']}: {result['project_name']}")

    # Sort results by build number for consistent output
    results.sort(key=lambda r: r["build_number"] if isinstance(r["build_number"], int) else 0)

    print_report(results, len(builds))

    # Exit 1 if any repos are broken (missing README is a warning, not failure)
    broken = [r for r in results if not r["repo_alive"]]
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
