# SG-Intranetas-V5 — Claude Code Instructions

## Autonomous work rules
- Work through ALL steps without stopping for confirmation
- After each step run: npx tsc --noEmit 2>&1 | grep "^src/" | head -20
- If 0 new errors: immediately continue to next step
- If new errors appear: fix them before continuing
- Only pause if errors cannot be resolved after 2 attempts

## Project rules
- Mock DB only. No Firebase, no Supabase, no backend
- Do not break: workflow engine, asset engine, permission engine
- All UI labels in Lithuanian
- Changes must be minimal and local
- Pre-existing errors allowed: 7 (do not count these as new)

## Definition of done per prompt
- All steps PASS
- BUILD RESULT: PASS (0 new TypeScript errors)
- UTF-8 RESULT: PASS
- FILES MODIFIED list provided
