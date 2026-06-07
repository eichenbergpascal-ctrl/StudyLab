# Projektstatus — StudyLab

---

## 2026-06-07 — Security Audit Abschluss

### Was heute gemacht wurde

**Security-Findings aus dem Audit vollständig abgearbeitet:**

#### Critical (C)
- **C-1** `flashcards/actions.ts` — IDOR in updateFlashcard/deleteFlashcard: Ownership-Check auf RLS-Ebene über Join-Pfad `section → summary → block → exam → user_id` implementiert ✅
- **C-2** `question-actions.ts` — IDOR in updateExamQuestion/deleteExamQuestion: gleicher RLS-Fix wie C-1 ✅
- **C-3** `middleware.ts` — Auth-Middleware war totes Code (config-Re-Export funktionierte nicht mit Next.js 16/Turbopack): `config` direkt in `middleware.ts` definiert, `proxy`-Logik bleibt in `src/proxy.ts` ✅
- **C-4** `gruppen/actions.ts:267` — submitContributions ohne Membership-Check: auf App-Ebene gefixt + RLS `contributions_contributor_insert` prüft jetzt zusätzlich `is_study_group_member(group_id)` ✅

#### Medium (M)
- **M-1** `gruppen/actions.ts` — getContributionsForGroup/getGroupDetail exponieren Daten: RLS `contributions_member_select` via `is_study_group_member()` ✅
- **M-2** `gruppen/actions.ts` — adoptAllAsNewExam/adoptSelective ohne Membership-Check: auf App-Ebene gefixt ✅
- **M-3** `viewer/actions.ts:15` — startSectionExamSession: sectionId nicht auf User-Exam gescoped: App-Ebene gefixt ✅
- **M-4** `flashcards/actions.ts:31` — createFlashcard: sectionId unverified: RLS `flashcards_user_policy` deckt das ab ✅
- **M-5** `question-actions.ts:28` — createExamQuestion: sectionId unverified: RLS `exam_questions_user_policy` deckt das ab ✅
- **M-6** `process-summary`, `regenerate-content` — TOCTOU Race in checkRateLimit: gefixt ✅
- **M-7** `process-summary/index.ts:299` — Raw Anthropic Error in processing_error gespeichert: gefixt ✅
- **M-8** `auth/callback/route.ts:9` — Unvalidierter next-Redirect-Parameter: gefixt ✅

#### Low (L)
- **L-1** `generate-section/index.ts:376` — Non-constant-time Service Key Comparison: `crypto.subtle.timingSafeEqual` implementiert, Edge Function deployed ✅
- **L-3** `gruppen/actions.ts:11` — Modulo Bias in Invite-Code-Generierung: Rejection Sampling mit `randomBytes` implementiert ✅
- **L-4** Edge Functions — `any` cast auf Anthropic Response: Tech-Debt, noch offen ⏳
- **L-5** `gruppen/actions.ts:80` — leaveGroup ohne Membership-Check: `isMember()` Helper jetzt auch in leaveGroup genutzt ✅
- **L-6** `blockId/actions.ts:38` — filename ohne Längenvalidierung: Tech-Debt, noch offen ⏳
- **L-7** `probeklausur`, `viewer/actions` — Duplizierte shuffle-Funktion: Tech-Debt, noch offen ⏳

### RLS-Audit Ergebnis

Alle kritischen Tabellen geprüft und abgesichert:

| Tabelle | Policy | Status |
|---|---|---|
| `flashcards` | Join-Pfad über `exam.user_id` | ✅ |
| `exam_questions` | Join-Pfad über `exam.user_id` | ✅ |
| `sections` | Join-Pfad über `exam.user_id` | ✅ |
| `contributions` | INSERT: `contributor_id = auth.uid() AND is_study_group_member(group_id)` | ✅ |
| `study_group_members` | INSERT: `user_id = auth.uid() AND group EXISTS` | ✅ |
| `study_groups` | Owner-All + Member-Select | ✅ |

**Migration deployed:** `rls_fix_contributions_and_group_members_insert`

### Dokumentationslücke geschlossen
- **Processing-Pipeline Modell-Upgrade:** Alle drei Edge Functions (`process-summary`, `generate-section`, `regenerate-content`) laufen bereits auf `claude-sonnet-4-6` — war im Projektplan noch als offen markiert, ist aber längst umgesetzt. Projektplan-Eintrag Etappe 7.5 war veraltet. ✅

### Noch offen
- L-4, L-6, L-7 (Tech-Debt, kein Security-Risiko)
- Invite-Code-Enforcement auf DB-Ebene (bewusst nicht implementiert — `SECURITY DEFINER` Funktion wäre nötig, Risiko akzeptabel)

---

## Template für neue Einträge

```
## YYYY-MM-DD — [Thema / Session-Titel]

### Was gemacht wurde
- ...

### Entscheidungen
- ...

### Noch offen
- ...
```
