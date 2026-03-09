# Current Task: Fix Critical Audit Findings (C1-C6)
**Branch**: `fix/audit-critical-leaks`
**Started**: 2026-03-06

## Plan
- [x] C1: command-center.js — `.slice()` before `.sort()` to prevent Data.prospects mutation
- [x] C2: pipeline-intel.js — `.slice()` before `.sort()` in `renderCards()` to prevent input mutation
- [x] C3: pipeline-intel.js — Replace direct `.addEventListener()` with `_on()` (lines 58, 70-73)
- [x] C4: build-roadmap.js — Replace direct `.addEventListener()` with `_on()` (line 132)
- [x] C5: agent-architecture.js — Replace `ActionButton` onClick with `_on()` registration
- [x] C6: strain-simulator.js — Replace direct `.addEventListener()` on preset buttons with `_on()`

## Verification
- [x] No new console errors across all 7 modules (no console statements exist in any module)
- [x] All existing timer/listener helpers still present
- [x] grep confirms no remaining direct addEventListener in view modules (0 matches)
- [x] grep confirms no .sort() on Data.* without .slice() (all sort calls operate on copies)
- [x] Diff reviewed: only 5 intended JS files changed

## Results
All 6 critical findings fixed:
- 2 data mutation bugs (C1, C2): Added .slice() before .sort() to prevent mutating Data.prospects
- 4 listener leak bugs (C3-C6): Replaced direct addEventListener with _on() helper across 4 modules
- agent-architecture.js (C5): Restructured ActionButton creation to separate element creation from event binding, using _on() for trackable cleanup
- All changes are minimal, pattern-consistent, and touch only the intended lines
