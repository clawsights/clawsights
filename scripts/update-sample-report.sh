#!/usr/bin/env bash
#
# Regenerate the sample report.html used for parser tests.
#
# Runs `claude -p` with the /insights command to generate a fresh report,
# then copies it into test/fixtures/sample-report.html.
#
# Usage:
#   ./scripts/update-sample-report.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_PATH="$REPO_ROOT/test/fixtures/sample-report.html"
REPORT_PATH="$HOME/.claude/usage-data/report.html"

echo "Generating fresh /insights report..."
claude -p "/insights" > /dev/null 2>&1

if [ ! -f "$REPORT_PATH" ]; then
  echo "Error: report.html not found at $REPORT_PATH"
  echo "Make sure claude is installed and /insights ran successfully."
  exit 1
fi

cp "$REPORT_PATH" "$FIXTURE_PATH"
echo "Updated: $FIXTURE_PATH"
echo ""
echo "Run tests to verify:"
echo "  npm test"
