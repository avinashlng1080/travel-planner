#!/bin/bash
# Avi Watch Mode - Lightweight file analysis trigger
# This hook runs after Edit/Write operations and flags critical issues

# Get the file path from the tool input (passed via stdin as JSON)
FILE_PATH=$(cat | jq -r '.tool_input.file_path // empty')

# Exit silently if no file path or not a code file
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only analyze TypeScript/JavaScript/React files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

# Skip node_modules, dist, build directories
if [[ "$FILE_PATH" =~ (node_modules|dist|build|\.next) ]]; then
  exit 0
fi

# Check if watch mode is enabled (presence of .avi-watch file)
WATCH_FILE="$HOME/.claude/.avi-watch-enabled"
if [ ! -f "$WATCH_FILE" ]; then
  exit 0
fi

# Count lines in the file
if [ -f "$FILE_PATH" ]; then
  LINE_COUNT=$(wc -l < "$FILE_PATH" | tr -d ' ')

  # Critical: Component over 150 lines (give some buffer)
  if [ "$LINE_COUNT" -gt 150 ]; then
    echo "avi: $FILE_PATH is $LINE_COUNT lines. Consider extraction. Say /avi for analysis."
  fi

  # Critical: Check for common security issues
  if grep -q "ANTHROPIC_API_KEY\|API_KEY\|SECRET_KEY\|password.*=" "$FILE_PATH" 2>/dev/null; then
    echo "avi: Potential secret in $FILE_PATH. Say /avi security for details."
  fi

  # Critical: Check for console.log in production code
  if grep -q "console\.log" "$FILE_PATH" 2>/dev/null; then
    if [[ ! "$FILE_PATH" =~ (test|spec|\.test\.|\.spec\.) ]]; then
      echo "avi: console.log found in $FILE_PATH. Clean up before commit."
    fi
  fi
fi

exit 0
