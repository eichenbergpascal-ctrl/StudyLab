# Lerntool — Spezifikation v1.4

## 1. Überblick

Ein Multi-User-Lerntool zur gezielten Klausurvorbereitung auf Basis selbst erstellter Vorlesungszusammenfassungen. Das System ermöglicht das Erstellen von Karteikarten, Probeklausuren und Fehler-Sessions, organisiert nach Klausuren und thematischen Blöcken mit Gewichtung.

### Tech-Stack

| Schicht | Technologie | Details |
|---------|------------|---------|
| Framework | Next.js 14+ (App Router) | TypeScript, Server Components, Server Actions |
| Styling | Tailwind CSS | Utility-first, `@tailwindcss/typography` optional für Markdown-Content in Sections |
| UI-Komponenten | shadcn/ui (Radix UI) | Komponenten werden ins Projekt kopiert, kein Dependency-Lock-in |
| Markdown-Rendering | react-markdown + remark-gfm + rehype-katex | Für interne Darstellung von Section-Content (z.B. Fortschrittsanzeige), nicht für den PDF-Viewer |
| PDF-Anzeige | react-pdf oder nativer Browser-Embed | Für den Zusammenfassungs-Viewer (Original-PDF aus Supabase Storage) |
| Icons | lucide-react | Konsistentes Icon-Set, Teil von shadcn/ui |
| Backend / Datenbank | Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime) | Einziges Backend-System |
| Authentifizierung | Supabase Auth (E-Mail/Passwort + Google OAuth) | Session via `@supabase/ssr`, RLS auf allen Tabellen |
| Supabase Client | `@supabase/supabase-js` + `@supabase/ssr` | Browser-Client (anon-Key + RLS) + Server-Client (Cookie-Auth) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) | 150s Timeout, 3 Functions: `process-summary`, `generate-section`, `regenerate-content` |
| LLM | Anthropic API (Claude Sonnet) via `@anthropic-ai/sdk` | Zweistufige Pipeline: Parsing → Generierung pro Section |
| PDF-Parsing | LLM-basiert (PDF als Base64 via Document-Feature) | Kein separates Parsing-Tool |
| Deployment | Vercel (Frontend) + Supabase Cloud (Backend) | Git-Push → Auto-Deploy via GitHub |
| Repo / CI | GitHub | Vercel-Integration, Preview Deployments pro Branch |
| Paketmanager | pnpm | Schneller und Disk-effizienter als npm |

### Bewusst nicht im Stack

| Technologie | Grund |
|------------|-------|
| Redux / Zustand | Overkill — Server Components + useState reichen |
| Prisma / Drizzle ORM | Supabase Client SDK ist das ORM |
| tRPC | Supabase SDK typed die Calls bereits |
| Next Auth / Clerk | Supabase Auth ist integriert |
| Docker | Vercel + Supabase Cloud — kein Self-Hosting |
| n8n / Workflow-Engine | Nur 2 Edge Functions — Orchestrierung direkt im Code |
| Jest / Vitest (V1) | Manuelles Testing + einfache Tests für kritische Logik |

### Projektstruktur

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Öffentliche Seiten (Login, Register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # Geschützter Bereich (deutsche Pfade)
│   │   ├── layout.tsx          # Sidebar, Navigation, Auth-Guard
│   │   ├── page.tsx            # Dashboard (Klausur-Liste)
│   │   ├── klausuren/[id]/     # Klausur-Detail + Blocks + Viewer
│   │   ├── karteikarten/       # Karteikarten-Übersicht
│   │   ├── probeklausuren/     # Probeklausur-Übersicht
│   │   ├── fehler/             # Fehler-Pool (Karteikarten + Klausuren)
│   │   ├── fortschritt/        # Lernfortschritt pro Klausur
│   │   └── gruppen/            # Lerngruppen (Erstellen, Beitreten, Einreichen, Übernehmen)
│   ├── api/                    # API Routes (cleanup-sessions entfernt — läuft jetzt als pg_cron Job)
│   ├── auth/callback/          # OAuth Callback
│   └── layout.tsx              # Root Layout
├── components/
│   ├── ui/                     # shadcn/ui Komponenten
│   ├── layout/                 # Sidebar, DashboardHeader
│   └── pdf-viewer/             # PDF-Viewer-Komponenten
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser-Client
│   │   └── server.ts           # Server-Client
│   ├── types/
│   │   ├── database.types.ts   # Auto-generierte Supabase-Types
│   │   └── exam-questions.ts   # Fragetyp-Definitionen
│   └── utils/
│       ├── largest-remainder.ts  # Fragenverteilungs-Algorithmus
│       └── __tests__/            # Unit Tests
├── proxy.ts                    # Proxy-Konfiguration
supabase/
├── functions/                  # Edge Functions (Deno)
│   ├── process-summary/        # PDF-Parsing + Section-Dispatch
│   ├── generate-section/       # Generierung pro Section (parallel)
│   └── regenerate-content/     # On-Demand-Nachgenerierung
├── migrations/                 # SQL-Migrationen (11 Dateien)
└── config.toml
```

> **Hinweis:** Die Spezifikation v1.0 nutzte englische Pfade (`exam/`, `practice/`, `errors/`). Die Implementierung verwendet deutsche Pfade (`klausuren/`, `probeklausur/`, `fehler/`). Der Viewer ist verschachtelt unter `klausuren/[id]/blocks/[blockId]/viewer/[summaryId]/` statt als eigene Top-Level-Route.

---

## 2. Datenmodell / Projektstruktur

### Hierarchie

```
User (Supabase Auth)
└── Klausur
    ├── Block A (Gewichtung: z.B. 40%)
    │   ├── Zusammenfassung 1 (PDF)
    │   │   ├── Themenabschnitt 1.1 (erkannt via Überschriften)
    │   │   ├── Themenabschnitt 1.2
    │   │   └── ...
    │   └── Zusammenfassung 2 (PDF)
    │       ├── Themenabschnitt 2.1
    │       └── ...
    ├── Block B (Gewichtung: z.B. 35%)
    │   └── ...
    └── Block C (Gewichtung: z.B. 25%)
        └── ...
```

### Regeln

- Eine **Klausur** ist die oberste Organisationseinheit (z.B. "Controlling WS25"). Gehört immer genau einem User.
- Ein **Block** ist eine thematische Einheit innerhalb einer Klausur mit manuell eingegebener Gewichtung in Prozent. Die Gewichtungen aller Blöcke einer Klausur müssen 100% ergeben.
- Eine **Zusammenfassung** ist ein hochgeladenes PDF-Dokument, das manuell genau einem Block zugeordnet wird. Ein PDF gehört immer zu genau einem Block (keine Mehrfachzuordnung).
- Ein **Themenabschnitt** ist eine automatisch erkannte Untereinheit innerhalb einer Zusammenfassung, basierend auf Überschriften im PDF. Dient als Zuordnungsebene für Aufgaben und Karteikarten.
- Blöcke können nicht in mehreren Klausuren vorkommen.
- Neue Blöcke und Zusammenfassungen können jederzeit nachträglich hinzugefügt werden.

### Datenbank-Schema (Supabase PostgreSQL)

```
exams
  id, user_id (FK auth.users), name, created_at

blocks
  id, exam_id (FK exams), name, weight_percent, created_at

summaries
  id, block_id (FK blocks), filename, storage_path, parsed_content (JSONB),
  processing_status (enum: pending/parsing/generating/completed/failed),
  processing_error (text, nullable),
  sections_total (int, nullable),
  sections_processed (int, default 0),
  created_at, updated_at (timestamptz, nullable)

sections
  id, summary_id (FK summaries), title, sort_order, content_text (Markdown-Format),
  start_page (int, nullable), end_page (int, nullable)  -- physische Seitenzahlen im PDF

flashcards
  id, section_id (FK sections), question, answer, is_user_created (bool),
  source_contribution_id (uuid, nullable),  -- FK contributions, für Lerngruppen-Übernahme
  created_at

exam_questions
  id, section_id (FK sections),
  question_type (enum: mc/fill_blank/matching/free_text/true_false/ordering/calculation),
  question_data (JSONB), answer_data (JSONB), is_user_created (bool),
  source_contribution_id (uuid, nullable),  -- FK contributions, für Lerngruppen-Übernahme
  created_at

attempts
  id, user_id (FK auth.users), flashcard_id (FK, nullable), exam_question_id (FK, nullable),
  is_correct (bool), session_type (enum: flashcard/exam/error_session), created_at

exam_sessions
  id, user_id (FK auth.users), exam_id (FK exams),
  block_id (FK blocks, nullable),  -- null = Vollklausur, gesetzt = Teilklausur
  status (enum: in_progress/completed/abandoned),
  question_ids (JSONB array),      -- geordnete Liste der gewählten Fragen
  answers (JSONB),                 -- { "question_id": { "response": ..., "is_correct": bool|null } }
  created_at, completed_at (nullable)
```

### Index-Strategie

```sql
-- Schnelles Filtern nach User
CREATE INDEX idx_attempts_user_id ON attempts(user_id);

-- Error-View: Letzter Attempt pro Flashcard
CREATE INDEX idx_attempts_flashcard_latest
  ON attempts(flashcard_id, created_at DESC)
  WHERE flashcard_id IS NOT NULL;

-- Error-View: Letzter Attempt pro Exam Question
CREATE INDEX idx_attempts_question_latest
  ON attempts(exam_question_id, created_at DESC)
  WHERE exam_question_id IS NOT NULL;

-- Lernfortschritt: Zählung pro Session-Type
CREATE INDEX idx_attempts_session_type
  ON attempts(user_id, session_type);
```

### Error-View Definition

```sql
CREATE VIEW error_pool AS
WITH latest_attempts AS (
  SELECT DISTINCT ON (flashcard_id, exam_question_id)
    id, user_id, flashcard_id, exam_question_id,
    is_correct, session_type, created_at
  FROM attempts
  ORDER BY
    flashcard_id, exam_question_id, created_at DESC
)
SELECT * FROM latest_attempts
WHERE is_correct = false;
```

**Fehler-Reiter:** Kein eigener Table, sondern die **View `error_pool`** auf `attempts`. Eine Aufgabe ist im Fehler-Pool, wenn ihre letzte Bewertung `is_correct = false` ist. Wird sie in einer Fehler-Session richtig beantwortet, fällt sie automatisch raus.

**RLS:** Alle Tabellen gefiltert auf `user_id = auth.uid()`. Kaskadiert über Foreign Keys (exams → blocks → summaries → sections → flashcards/exam_questions).

**Storage:** Supabase Storage Bucket `summaries` für PDF-Uploads, mit RLS-Policy pro User.

---

## 3. Content-Import

### Upload-Prozess und Processing-Pipeline

**Trigger:** Das Frontend ruft nach dem Upload direkt eine Supabase Edge Function auf (`POST /functions/v1/process-summary` mit `{ summary_id }`). Der User-JWT wird automatisch mitgesendet und in der Edge Function validiert.

**Zweistufige Pipeline:**

1. User erstellt eine Klausur und legt Blöcke mit Gewichtungen an.
2. User lädt PDF-Zusammenfassungen hoch und ordnet sie manuell einem Block zu.
3. PDF wird in Supabase Storage gespeichert, Summary-Row mit `processing_status: pending` erstellt.
4. Frontend ruft Edge Function auf → Status wechselt zu `parsing`.
5. **Schritt 1 — Parsing-Call:** PDF wird als Base64 via Document-Feature an Claude gesendet.
   - Text wird extrahiert und in Themenabschnitte aufgeteilt (Überschriftenerkennung)
   - Metadaten-Blöcke (z.B. "Klausurrelevant", Prüfungshinweise) werden ignoriert
   - Output: Strukturierte Section-Liste mit Markdown-Content pro Section
   - Ergebnis wird in `sections`-Tabelle geschrieben, `sections_total` gesetzt
   - Status wechselt zu `generating`
6. **Schritt 2 — Generierungs-Calls (pro Section, parallel via `generate-section` Edge Function):**
   - `process-summary` dispatcht einen HTTP-Call pro Section an die separate Edge Function `generate-section`
   - Dies umgeht das 150s-Timeout-Problem: jede Section läuft in ihrem eigenen Function-Invocation
   - Input: `content_text` (Markdown) der jeweiligen Section
   - Output: 3–5 Karteikarten + 3–5 Klausuraufgaben pro Section
   - Calls laufen parallel (Promise.all auf die Dispatch-Responses), `sections_processed` wird pro fertigem Call inkrementiert
   - Fehler in einer Section blockieren nicht die anderen
7. Alle Sections fertig → `processing_status: completed`. Bei Fehlern → `failed` mit `processing_error`.

**Status-Tracking und UI-Feedback:**
- Frontend nutzt Supabase Realtime-Subscription oder Polling (alle 3s) auf `processing_status`
- Summary-Liste zeigt Status-Badge: ⏳ Verarbeitung / ✓ Fertig / ✗ Fehler
- Bei `generating`: Fortschrittsanzeige "3/7 Abschnitte verarbeitet"
- Bei `failed`: Fehlermeldung + Retry-Button

**Retry-Logik:**
- Bei Fehler kann der User "Erneut versuchen" klicken
- Wenn Parsing erfolgreich war, aber Generierung teilweise fehlschlug: nur Sections ohne Flashcards/Questions werden wiederholt
- Maximale automatische Retries pro Call: 2 (mit exponentiellem Backoff)

### PDF als Single Source of Truth

- Das hochgeladene PDF ist die finale, autoritative Version des Inhalts.
- Es wird kein HTML-Quellcode oder anderer Zwischenstand verwendet.
- PDF-Parsing erfolgt LLM-basiert — keine separate Parsing-Library. Claude erkennt die Struktur semantisch (Überschriften, Definitionen, Formeln) statt auf Font-Größen zu raten.
- **PDF-Übermittlung:** Base64-encoded via Document-Content-Block der Anthropic API (`type: "document"`, `source: base64`).
- **Größenlimits:** Maximal 30 Seiten (Soft-Limit, darüber Warnung), maximal 10 MB Dateigröße.

### Content-Format

- Der Parsing-Call liefert `content_text` pro Section als **Markdown**.
- Überschriften, Listen, Tabellen, Fettdruck werden als Markdown abgebildet.
- Formeln als LaTeX-Notation: `$...$` (inline) und `$$...$$` (Block).
- Rendering im Frontend via `react-markdown` + `KaTeX` für Formeln.

### `parsed_content` (JSONB) — Struktur

```json
{
  "version": 1,
  "page_count": 12,
  "sections": [
    {
      "title": "DuPont-Analyse",
      "sort_order": 1,
      "content_markdown": "## DuPont-Analyse\n\nDie DuPont-Zerlegung..."
    }
  ],
  "metadata": {
    "ignored_blocks": ["Klausurhinweis auf S. 3"]
  }
}
```

`content_text` in der `sections`-Tabelle ist die Single Source of Truth. Das JSONB dient als Backup/Rohformat des Parsing-Ergebnisses.

### Umgang mit Diagrammen

- Diagramme im PDF werden **nicht visuell extrahiert**. Fragen zu Diagrammen sind rein textbasiert (z.B. "Beschreibe die DuPont-Zerlegung" statt "Was zeigt dieses Diagramm?").
- Der Textinhalt rund um Diagramme (Beschriftungen, Erklärungen) wird normal extrahiert und für die Fragengenerierung verwendet.

### On-Demand-Nachgenerierung

- Pro Themenabschnitt kann der User weitere Karteikarten oder Klausuraufgaben nachgenerieren.
- Nachgenerierung erfolgt **gezielt pro Themenabschnitt** (nicht pro Zusammenfassung oder Block), um API-Last gering zu halten.
- Pro Nachgenerierung: 3–5 neue Einträge.
- Nachgenerierung nutzt denselben Generierungs-Call wie die initiale Pipeline — kein separater Code-Pfad.

---

## 4. Karteikarten

### Format

- **Nur Freitext-Antwort:** User sieht eine Frage und schreibt die Antwort in ein Textfeld.
- Kein Multiple Choice, kein Lückentext, keine Zuordnung bei Karteikarten.

### Bewertung

- **Selbstbewertung durch den User:** Nach dem Antworten wird die Musterlösung aufgedeckt. Der User markiert selbst: **richtig** oder **falsch**.
- Keine AI-basierte Bewertung.

### Musterlösungen

- Musterlösungen müssen **eigenständig verständlich** generiert werden — so detailliert, dass der User den Abgleich allein anhand der Musterlösung vornehmen kann, ohne die Zusammenfassung nachschlagen zu müssen.
- Kein zusätzlicher "Hinweis"-Button oder Rückverweis auf die Zusammenfassung.

### Generierung

- Beim Upload einer Zusammenfassung werden automatisch **3–5 Karteikarten pro Themenabschnitt** generiert.
- Jede Karteikarte wird einem **Themenabschnitt** (und damit einem Block) zugeordnet.
- Weitere Karteikarten können jederzeit **on-demand pro Themenabschnitt** nachgeneriert werden (3–5 pro Call).
- Fragen können sich auf Fließtext, Definitionen, Formeln und Theorien beziehen (z.B. "Erkläre die DuPont-Zerlegung", "Berechne X mit Formel Y").

### User-Kontrolle

- Karteikarten können jederzeit **editiert**, **gelöscht** und **manuell hinzugefügt** werden.

---

## 5. Probeklausuren

### Struktur

- Eine Probeklausur besteht aus **immer 18 Aufgaben**.
- Die Verteilung der Aufgaben auf Blöcke folgt der Blockgewichtung via **Largest-Remainder-Methode**:
  1. Berechne für jeden Block: `Gewichtung × 18` (ergibt Dezimalzahl)
  2. Jeder Block bekommt den abgerundeten Wert (Floor)
  3. Berechne Differenz: `18 - Summe aller Floors = Restplätze`
  4. Verteile Restplätze an die Blocks mit den größten Nachkommaanteilen (je +1)
  - Beispiel: Block A = 40% → 7.2 (Floor 7), Block B = 35% → 6.3 (Floor 6), Block C = 25% → 4.5 (Floor 4). Summe Floors: 17, Restplatz 1 → Block C (höchster Rest 0.5) bekommt +1 → 7 + 6 + 5 = 18 ✓
- **Minimum-Regel:** Jeder Block mit Gewichtung > 0% bekommt mindestens 1 Frage.
- Kein Timer.
- Keine Punktevergabe. Bewertung ist richtig/falsch pro Aufgabe.

### Fragetypen

- Multiple Choice (`mc`)
- Lückentext (`fill_blank`)
- Zuordnung (`matching`)
- Freitext (`free_text`)
- Wahr/Falsch (`true_false`)
- Reihenfolge (`ordering`)
- Rechenaufgabe (`calculation`)

Diese Fragetypen werden **nur in Probeklausuren und Block-Übungen** verwendet, nicht bei Karteikarten. Der Fragetyp wird bei der Generierung automatisch passend zum Inhalt gewählt (kein fester Mix).

> **Hinweis:** Die ursprüngliche Spezifikation v1.0 definierte nur 4 Typen (mc, fill_blank, matching, free_text). Die 3 zusätzlichen Typen (true_false, ordering, calculation) wurden nach ersten Nutzungstests ergänzt (Migration `20260526100000`). UI-Komponenten existieren für alle 7 Typen.

### Aufgabenpool

- Jede generierte Klausuraufgabe fließt in einen **persistenten Aufgabenpool** pro Themenabschnitt (und damit pro Block).
- Bei Initialisierung werden **3–5 Klausuraufgaben pro Themenabschnitt** generiert.
- Neue Probeklausuren werden aus dem bestehenden Pool zusammengestellt und zufällig gemischt.
- Wenn der Pool nicht ausreicht, werden neue Aufgaben dazugeneriert.
- Aufgaben im Pool sind **editierbar** und **löschbar**.

### Bewertung

- **Selbstbewertung:** User markiert pro Aufgabe **richtig** oder **falsch**.

### Teilklausuren

- Es können Probeklausuren für **einzelne Blöcke** erstellt werden.
- Die Aufgabenanzahl wird proportional zur Gewichtung des Blocks berechnet: `round(Gewichtung × 18)`.
  - Minimum: 3 Fragen. Maximum: 18 Fragen.
  - Beispiel: Block mit 25% Gewichtung → `round(0.25 × 18) = round(4.5) = 5` Aufgaben.

### Exam Sessions

- Beim Start einer Probeklausur wird eine `exam_session` erstellt mit Status `in_progress`.
- Fragen werden bei Erstellung festgelegt und in `question_ids` gespeichert (Reihenfolge fix).
- Antworten werden laufend in `answers` gespeichert (JSONB-Update pro Frage).
- **Pausieren und Fortsetzen:** User kann die Session verlassen und später weitermachen — unbeantwortete Fragen sind erkennbar.
- "Abschließen" setzt Status auf `completed` und schreibt alle Bewertungen in `attempts`.
- Maximal **1 offene Session pro Exam** (verhindert Session-Spam).
- Dashboard zeigt "Offene Klausur fortsetzen"-Button wenn eine Session existiert.
- Sessions älter als 7 Tage ohne Abschluss werden automatisch auf `abandoned` gesetzt.
- Fehler-Sessions nutzen dieselbe Logik (`session_type = error_session`, keine feste Fragenanzahl — alle Items aus dem Error-Pool).

---

## 6. Fehler-Tracking

### Prinzip

- Jede als **falsch** markierte Karteikarte oder Klausuraufgabe wird automatisch in den Fehler-Reiter verschoben.

### Struktur

- **Zwei getrennte Fehler-Reiter:**
  - Karteikarten-Fehler (Freitext-Format)
  - Klausuraufgaben-Fehler (verschiedene Fragetypen)

### Implementierung

- Kein eigener Table. Fehler-Pool ist ein **Database View** auf die `attempts`-Tabelle: alle Aufgaben/Karteikarten, deren letzte Bewertung `is_correct = false` ist.

### Fehler-Sessions

- User kann eine **Fehler-Session** starten, die den Fehler-Pool im jeweiligen Format durcharbeitet (Karteikarten-Fehler als Freitext, Klausuraufgaben-Fehler im Original-Fragetyp).

### Rückkehr in den normalen Pool

- Sobald eine Aufgabe/Karteikarte in einer Fehler-Session **einmal richtig** beantwortet wird, fällt sie automatisch aus dem View raus (letzte Bewertung ist jetzt `is_correct = true`).

---

## 7. Lernfortschritt

### Übersichtsseite pro Klausur

Für jeden Block werden folgende Metriken angezeigt (berechnet aus `attempts`-Tabelle):

| Metrik | Beschreibung |
|--------|-------------|
| Karteikarten bearbeitet / gesamt | Wie viele der verfügbaren Karteikarten wurden mindestens einmal beantwortet |
| Karteikarten richtig / falsch | Absolute Zahlen der Bewertungen |
| Klausuraufgaben bearbeitet / gesamt | Wie viele Aufgaben aus dem Pool wurden mindestens einmal bearbeitet |
| Klausuraufgaben richtig / falsch | Absolute Zahlen der Bewertungen |
| Offene Fehler | Anzahl Einträge im Fehler-View für diesen Block |

### Darstellung

- Nur nackte Zahlen, keine farbliche Einordnung, keine Schwellenwerte, keine zeitliche Entwicklung.

---

## 8. Zusammenfassungs-Viewer

### Prinzip

Das hochgeladene PDF wird als Original angezeigt — kein Markdown-Rendering, kein Re-Parsing für die Darstellung. Der User sieht exakt das Dokument, das er hochgeladen hat. Markdown (`content_text` in `sections`) ist ein internes Zwischenformat für die KI-Pipeline (Karteikarten- und Fragengenerierung) und wird nicht im Viewer gerendert.

### Funktionen

1. **PDF-Viewer:** Die hochgeladenen Zusammenfassungen werden als eingebettetes PDF angezeigt (z.B. via `<iframe>`, `<embed>` oder einer leichtgewichtigen PDF-Viewer-Library wie `react-pdf`). Das PDF wird aus Supabase Storage geladen (signierte URL).

2. **Fortschritts-Overlay pro Themenabschnitt:** Sobald Sections durch die KI-Pipeline existieren, wird neben dem Viewer eine Sidebar oder ein Panel angezeigt mit:
   - Liste der erkannten Themenabschnitte
   - Pro Abschnitt: Verfügbare Aufgaben (Karteikarten + Klausuraufgaben)
   - Davon bearbeitet
   - Davon richtig / falsch
   - Hinweis: Dieses Overlay erscheint erst, wenn die Processing-Pipeline für das PDF abgeschlossen ist (`processing_status: completed`).

3. **Direkte Aufgabenbearbeitung:** Aus dem Viewer heraus können die einem Themenabschnitt zugeordneten Aufgaben direkt gestartet und bearbeitet werden. Es werden nur bestehende Aufgaben aus dem Pool angezeigt — keine On-the-fly-Generierung im Viewer.

---

## 9. User-Management

### Multi-User-Architektur

- **Authentifizierung:** Supabase Auth (E-Mail/Passwort oder OAuth).
- **Datenisolierung:** Row Level Security (RLS) auf allen Tabellen. Jeder User sieht ausschließlich seine eigenen Klausuren, Blöcke, Zusammenfassungen, Karteikarten, Aufgaben und Fortschrittsdaten.
- **Kein Sharing:** Klausuren und Inhalte werden nicht zwischen Usern geteilt. Jeder User baut seinen eigenen Lernbestand auf.

---

## 10. API-Kosten und Limits

### Kostenstruktur

- LLM-Calls laufen über die **Anthropic API** (separat vom Claude Pro-Abo). Kosten entstehen pro Token.
- Ein 12-Seiten-PDF erzeugt ca. 6.000–15.000 Input-Tokens (je nach Inhalt und Dichte).
- Claude Sonnet: $3/1M Input, $15/1M Output.
- Geschätzte Kosten pro Zusammenfassung (12 Seiten, ~6 Sections):
  - Parsing-Call: ~$0.04–0.10
  - Generierungs-Calls: ~6 × $0.005 = ~$0.03
  - **Gesamt: ~$0.07–0.13**
- On-demand-Nachgenerierung: ca. $0.005–0.01 pro Themenabschnitt.

### Generierungslimits

| Trigger | Karteikarten | Klausuraufgaben |
|---------|-------------|-----------------|
| Initialisierung (Upload) | 3–5 pro Themenabschnitt | 3–5 pro Themenabschnitt |
| On-demand (pro Themenabschnitt) | 3–5 pro Call | 3–5 pro Call |

- Fragetyp bei Klausuraufgaben wird automatisch passend zum Inhalt gewählt (kein fester Mix vorgegeben).
- Nachgenerierung ist nur **pro Themenabschnitt** möglich, nicht auf Block- oder Klausur-Ebene.

### Pool-Limits

- **Soft Cap pro Section:** 20 AI-generierte Flashcards, 20 AI-generierte Exam Questions.
- Bei Erreichen des Caps: Hinweis an User ("Du hast bereits 20 Karteikarten für diesen Abschnitt. Möchtest du trotzdem weitere generieren?").
- Ab 30 Items pro Section: dringlicherer Hinweis mit Empfehlung, alte Fragen zu löschen.
- Kein Hard Block — User kann weitergenerieren.
- **Manuell erstellte Items zählen nicht** gegen das Limit (erkennbar via `is_user_created`-Flag).
- Kein automatisches Löschen — User hat volle Kontrolle über den Pool.

---

## 11. Lerngruppen (Community-Feature)

### Konzept

Kontrolliertes Teilen von Karteikarten und Klausuraufgaben innerhalb einer privaten Gruppe — kein öffentliches Free-for-all. Gedacht für Kommilitonen die denselben Kurs belegen.

### Datenmodell (neu)

```
study_groups
  id          uuid PK
  name        text NOT NULL
  owner_id    uuid FK auth.users
  invite_code text UNIQUE NOT NULL  -- zufälliger kurzer String, z.B. "abc12"
  created_at  timestamptz

study_group_members
  group_id    uuid FK study_groups
  user_id     uuid FK auth.users
  joined_at   timestamptz
  PRIMARY KEY (group_id, user_id)

contributions
  id               uuid PK
  group_id         uuid FK study_groups
  contributor_id   uuid FK auth.users
  source_type      text NOT NULL  -- 'flashcard' | 'exam_question'
  source_id        uuid NOT NULL  -- ID der Flashcard oder Exam Question (kein DB FK wegen zwei Zieltabellen)
  preview_question text NOT NULL  -- denormalisiert: Frage-Text für Preview ohne Join
  created_at       timestamptz
```

**RLS:**
- `study_groups`: Owner kann alles, Mitglieder können lesen
- `study_group_members`: Mitglieder können eigene Membership lesen/löschen (Austritt), Owner kann alle sehen
- `contributions`: Nur Mitglieder der jeweiligen Gruppe können lesen; Contributor kann eigene einstellen und löschen

### User Flow

**Gruppe erstellen & beitreten:**
1. User erstellt eine Gruppe (Name eingeben) → Einladungslink mit `invite_code` wird generiert
2. Kommilitone öffnet Link → tritt Gruppe bei (wird als Member eingetragen)
3. Gruppe erscheint in der Sidebar unter "Lerngruppen"

**Karten einreichen (Contributor):**
1. User navigiert in eine Gruppe → "Karten einreichen"-Button
2. Auswahl-UI zeigt eigene Flashcards und Exam Questions, sortiert nach `created_at DESC`, gruppiert nach Section/Block
3. User wählt per Checkbox einzelne oder alle Karten einer Section aus
4. Einreichen → Contribution-Rows werden in DB geschrieben (eine Row pro Karte)

**Karten übernehmen (Empfänger):**

Gruppen-Übersicht zeigt pro Contributor: "XY hat N Karten bereitgestellt" mit `created_at` des letzten Einreichens.

Beim Übernehmen gibt es zwei Pfade:

**Pfad 1 — Alles übernehmen (neue Klausur):**
- User klickt "Als neue Klausur übernehmen"
- Eingabe: Name für die neue Klausur
- System erstellt automatisch: Klausur → Blöcke (aus Original) → Sections (aus Original) → kopiert alle Karten rein
- Blockgewichtungen werden auf gleichmäßige Verteilung gesetzt (da unbekannt) — User kann danach manuell anpassen
- Keine KI-Calls nötig, reine DB-Operationen

**Pfad 2 — Selektiv übernehmen (in bestehende Klausur):**
- User wählt einzelne Contributions aus (Checkbox + Preview)
- Wählt Ziel-Klausur → Ziel-Block
- Section-Matching: Suche nach Section mit identischem Titel (case-insensitive, trimmed) im Ziel-Block
  - Match gefunden → Karte wird dort eingefügt
  - Kein Match → neue Section mit Original-Titel wird angelegt
- Karte wird als Kopie eingefügt (`is_user_created = false`, `source_contribution_id` gesetzt)

### Kopier-Logik

- Beim Kopieren wird eine echte neue Row in `flashcards` oder `exam_questions` angelegt — keine Referenz auf das Original
- Feld `source_contribution_id` (nullable UUID) auf beiden Tabellen: zeigt auf die `contributions`-Row aus der die Karte stammt — Grundlage für spätere "Update verfügbar"-Logik
- Bereits übernommene Contributions werden für den User markiert (damit er nicht doppelt übernimmt)

### "Update verfügbar"-Logik (Basis)

- Wenn ein Contributor neue Karten einreicht (`contributions.created_at` neuer als letztes Übernehmen des Users), erscheint ein Hinweis in der Gruppenansicht: "XY hat 3 neue Karten bereitgestellt seit deiner letzten Übernahme"
- Kein automatisches Update — User entscheidet manuell

### Was bewusst ausgeschlossen wurde

| Feature | Grund |
|---------|-------|
| Öffentliche Community / Bibliothek | Cold-Start-Problem, Qualitätskontrolle, Urheberrecht |
| Bidirektionale Sync | Merge-Konflikt-Problem; One-Way-Append reicht |
| Moderation durch Owner | Jeder filtert selbst beim Übernehmen |
| Automatisches Übernehmen | User hat volle Kontrolle |
| Gruppen-Probeklausur (gemeinsam lösen) | Out of Scope V1 |

---

## 12. Features die bewusst ausgeschlossen wurden

| Feature | Grund |
|---------|-------|
| Timer bei Probeklausuren | Unnötige Komplexität |
| Lernplan / Spaced Repetition | Fortschrittsanzeige reicht; unnötige Komplexität |
| Klausurdatum | Kein Lernplan, daher kein Datum nötig |
| AI-basierte Antwortbewertung | Unzuverlässig bei Fachbegriffen, API-Kosten, Selbstbewertung reicht |
| Schwierigkeitsgrade bei Karten | Overengineered |
| Zeitliche Fortschrittsentwicklung | Nicht benötigt |
| Farbliche Einordnung / Schwellenwerte | Nicht benötigt |
| Splitscreen mit On-the-fly-Generierung | Durch Viewer mit Pool-Zugriff ersetzt |
| Hinweis-Button bei falschen Antworten | Musterlösung ist bereits der Abgleich; wäre doppelt |
| Visuelle Diagramm-Fragen | PDF-Parsing extrahiert keine Bilder; textbasierte Fragen reichen |
| Automatische Gewichtungserkennung | Nicht alle Zusammenfassungen haben Metadaten-Blöcke; manuelle Eingabe zuverlässiger |
| Fester Fragetyp-Mix | System wählt passendsten Typ pro Frage automatisch |
