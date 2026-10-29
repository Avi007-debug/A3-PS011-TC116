"""
ArgusASM Terminology & Typographical Lint Test (Tasks Section 3 / R-9)
AIORI Hackathon 2026 - Problem Statement PS-011
Guarantees:
1. Strict non-offensive terminology: dangling records are NEVER described as
   'vulnerable', 'exploitable', or 'takeover possible'.
   Must use 'potential dangling DNS candidate' with confidence levels.
2. Zero typographical em-dashes (\u2014) or en-dashes (\u2013) across source files.
"""

import os
import re
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FORBIDDEN_DANGLING_PHRASES = [
    re.compile(r"takeover\s+possible", re.IGNORECASE),
    re.compile(r"vulnerable\s+to\s+takeover", re.IGNORECASE),
    re.compile(r"subdomain\s+is\s+vulnerable", re.IGNORECASE),
    re.compile(r"exploitable\s+dangling", re.IGNORECASE),
]

SCAN_EXTENSIONS = {".py", ".ts", ".tsx", ".json"}
IGNORE_DIRS = {".git", "node_modules", ".pytest_cache", "__pycache__", "dist", "build", "venv"}
IGNORE_FILES = {"test_wording_lint.py", "tasks.md", "package-lock.json"}


def test_dangling_dns_non_offensive_terminology():
    """Verify that source files use cautious, non-offensive terminology for dangling DNS."""
    violations = []

    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f in IGNORE_FILES:
                continue
            _, ext = os.path.splitext(f)
            if ext in SCAN_EXTENSIONS:
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as handle:
                        for line_idx, line in enumerate(handle, start=1):
                            for pattern in FORBIDDEN_DANGLING_PHRASES:
                                if pattern.search(line):
                                    rel_path = os.path.relpath(filepath, REPO_ROOT)
                                    violations.append(f"{rel_path}:{line_idx} - Matches '{pattern.pattern}': {line.strip()}")
                except Exception:
                    pass

    assert not violations, f"Offensive or prohibited terminology found:\n" + "\n".join(violations)


def test_zero_em_dash_or_en_dash():
    """Verify zero typographical em-dashes (\\u2014) or en-dashes (\\u2013) in source files."""
    violations = []

    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f in IGNORE_FILES:
                continue
            _, ext = os.path.splitext(f)
            if ext in {".py", ".ts", ".tsx"}:
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as handle:
                        for line_idx, line in enumerate(handle, start=1):
                            if "\u2014" in line or "\u2013" in line:
                                rel_path = os.path.relpath(filepath, REPO_ROOT)
                                violations.append(f"{rel_path}:{line_idx} contains em/en-dash: {line.strip()[:60]}")
                except Exception:
                    pass

    assert not violations, f"Typographical em/en-dashes found:\n" + "\n".join(violations[:10])
