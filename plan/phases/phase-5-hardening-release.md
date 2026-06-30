# Phase 5 — Hardening & Release (PM Brief)

> **Goal:** take the feature-complete MVP+AI build to a **signed, auto-updating v1.0.0** that survives an 8-hour service.

**Effort:** ~6 weeks · **Branch prefix:** `phase5/`

---

## Entry gate
- Phase 4 exit gate green: AI detection meets bars in both modes; MVP domains complete.

## PM start sequence
1. Read this brief, `CLAUDE.md` §5.7/§5.8/§5.10, SRS §5 (non-functional) + §3.8 (data mgmt), `revival/06-risk-assessment.md` §4 (gates).
2. Audit CAMS. 3. Decompose below.

---

## Task breakdown

### T1 — Performance & stability pass `[implementer + tester]`
- **Scope:** meet SRS §5 budgets — startup < 10 s, input < 100 ms, transitions ≥ 30 fps, slide change < 500 ms, **8-hour soak without degradation**. Profile memory; fix leaks. Soak test in CI/nightly.
- **Rules:** §5.7, §5.8. **Done:** budgets met and asserted; 8 h soak passes.

### T2 — Backup / restore `[implementer]` (SRS §3.8)
- **Scope:** automated backup of SQLite + media references; restore flow; integrity check; backup history.
- **Rules:** §5.5. **Done:** backup + restore round-trips; corrupt backup detected.

### T3 — First-run experience & docs `[implementer]`
- **Scope:** first-run wizard (display setup, default translation download, mic/AI opt-in); user docs + keyboard-shortcut reference; in-app help entry points.
- **Rules:** §5.4. **Done:** fresh install is usable without external instructions.

### T4 — Auto-update channel `[implementer + security]`
- **Scope:** electron-forge/`update-electron-app` (or Squirrel) update feed; signed releases; staged rollout. Keep Fuses/asar integrity intact.
- **Rules:** §1.4, §5.10. **Done:** an older build auto-updates to a newer signed build.

### T5 — Code signing & installers `[security]`
- **Scope:** signed installers — Windows (installer + portable), macOS (DMG, notarized if certs available), Linux (AppImage/deb/rpm). Verify Fuses + CSP + no DevTools in production.
- **Rules:** §1.4. **Done:** signed artifacts launch clean on all target OSes; no security regressions.

### T6 — Accessibility & live-operation polish `[reviewer + tester]`
- **Scope:** full keyboard operability of live controls; high-visibility status; error messages never reach the projector as stack traces; audience path fails safe.
- **Rules:** §5.4, §5.7. **Done:** an operator can run a full service keyboard-only; no raw error ever projected.

### T7 — Release readiness review `[PM + reviewer + security]`
- **Scope:** final pass over CLAUDE.md §1 Golden Rules across the whole app; confirm all earlier exit gates still hold; licensing (R17) cleared; release notes.
- **Done:** every Golden Rule holds repo-wide; release notes written; v1.0.0 tagged.

---

## Verification & review
- PM confirms each exit gate from Phases 0–4 still passes (no regression) plus the §5 budgets. `security` signs off on signing, update feed, Fuses/CSP. Final build **observed running** a full mock service end-to-end (`run`/`verify`).

## Exit gate (ship v1.0.0 when ALL true)
- [ ] SRS §5 perf budgets met; 8 h soak green.
- [ ] Backup/restore working; first-run wizard + docs done.
- [ ] Auto-update verified; signed installers for all target OSes; no DevTools/security regression in production.
- [ ] Full keyboard operability; audience path fails safe; no projected stack traces.
- [ ] All Golden Rules hold repo-wide; licensing cleared; release notes written.
- [ ] CAMS tasks closed; PM synthesis + release report to user.

## Risks (`docs/revival/06-risk-assessment.md`)
- **R5** perf/stability → budgets + soak in CI. **R17** licensing → final clearance before ship. Post-v1: SRS Phase 2–3 (cloud sync, mobile companion, collaborative editing, analytics) become the next roadmap — out of scope for v1.0.0.
