---
description: Toggle Avi watch mode on/off. When enabled, Avi monitors your edits and alerts on critical issues.
---

# Avi Watch Mode Toggle

Based on the argument provided:

## If `$ARGUMENTS` is "off" or "disable":

1. Run: `rm -f ~/.claude/.avi-watch-enabled`
2. Respond: "Avi watch mode **disabled**. I'll only analyze when you ask with `/avi`."

## If `$ARGUMENTS` is empty, "on", or "enable":

1. Run: `mkdir -p ~/.claude && touch ~/.claude/.avi-watch-enabled`
2. Respond: "Avi watch mode **enabled**. I'll alert you on critical issues as you code:
   - Components over 150 lines
   - Potential secrets in code
   - Console.logs in production files

   Say `/avi watch off` to disable."

## Current Status Check

If `$ARGUMENTS` is "status":

1. Check if `~/.claude/.avi-watch-enabled` exists
2. Report: "Avi watch mode is currently **[enabled/disabled]**."
