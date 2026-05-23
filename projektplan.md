# Projektplan — Lernapp

> Dieser Plan definiert die Entwicklungsetappen, ihre Abhängigkeiten und Test-Checkpoints.
> Jede Etappe ist ein eigenständiger Claude-Code-Auftrag mit klarem Scope.
> Nach jeder Etappe wird manuell getestet — erst wenn der Checkpoint bestanden ist, geht es weiter.

---

## Voraussetzungen (vor Etappe 1)

Diese Dinge müssen VOR dem ersten Claude-Code-Prompt erledigt sein:

- [ ] **Anthropic API Key** beschaffen (https://console.anthropic.com → API Keys) und in Supabase Dashboard → Edge Function Secrets als `ANTHROPIC_API_KEY` hinterlegen (muss vor Etappe 2 erledigt sein)
- [ ] **Design** erstellen (über Claude AI) und als Referenz bereitstellen (Screenshots, Figma-Export oder HTML-Mockups)
- [ ] **Supabase-Projekt** ist vorhanden (Bestätigt)
- [ ] **Vercel-Account** ist vorhanden (Bestätigt)
- [ ] **GitHub-Repo** erstellen (leer, wird in Etappe 1 befüllt)

---

## Etappe 0 — Projekt-Scaffolding & Infrastruktur

**Ziel:** Lauffähiges Next.js-Projekt mit Supabase-Anbindung, Auth und leerem Dashboard-Layout. Kein Feature-Code — nur das Fundament.

**Scope:**
- Next.js 14+ Projekt mit App Router + TypeScript + pnpm initialisieren
- Tailwind CSS + shadcn/ui Setup (Basis-Komponenten: button, input, card, form, toast)
- Supabase Client-Setup: Browser-Client (`@supabase/supabase-js`) + Server-Client (`@supabase/ssr`)
- Auth-Middleware (`middleware.ts`): Session-Check, Token-Refresh, Redirect auf `/login`
- Login-Seite (Email/Password + Google OAuth) + Register-Seite
- Dashboard-Layout (`(dashboard)/layout.tsx`): Sidebar-Navigation (leer, Platzhalter-Links), Header mit User-Info + Logout
- Leere Dashboard-Startseite (`(dashboard)/page.tsx`): "Willkommen, noch keine Klausuren"
- `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- GitHub-Repo einrichten, Vercel-Projekt verknüpfen, erster Deploy
- Design-Tokens aus dem gelieferten Design in Tailwind-Config übernehmen (Farben, Schriften, Abstände)

**Abhängigkeiten:** Design muss vorliegen. GitHub-Repo muss existieren.

**Test-Checkpoint:**
- [ ] `pnpm dev` startet ohne Fehler
- [ ] Register → Login → Dashboard-Redirect funktioniert
- [ ] Unauthentifizierter Zugriff auf `/` redirected zu `/login`
- [ ] Logout funktioniert
- [ ] Vercel-Deploy zeigt die App live
- [ ] Layout sieht aus wie das Design (Farben, Sidebar, Header)

---

## Etappe 1 — Datenbank-Schema & Klausur/Block-CRUD

**Ziel:** User kann Klausuren erstellen, Blöcke mit Gewichtungen anlegen und verwalten. Datenbank-Schema steht komplett (auch Tabellen die erst später genutzt werden).

**Scope:**
- Komplettes DB-Schema in Supabase anlegen (SQL-Migration):
  - `exams`, `blocks`, `summaries` (mit processing_status etc.), `sections`, `flashcards`, `exam_questions`, `attempts`, `exam_sessions`
  - Alle Indizes (idx_attempts_*)
  - Error-Pool View
  - RLS-Policies auf allen Tabellen
  - Storage Bucket `summaries` mit RLS
- Supabase Types generieren (`database.ts`)
- Klausur-CRUD: Erstellen, Bearbeiten, Löschen
- Block-CRUD innerhalb einer Klausur: Erstellen, Bearbeiten, Löschen, Gewichtung setzen
- Gewichtungs-Validierung: Alle Blocks einer Klausur müssen 100% ergeben (Frontend-Validierung + DB-Check)
- Dashboard-Seite: Liste aller Klausuren des Users
- Klausur-Detailseite: Blocks anzeigen, Gewichtungen, Zusammenfassungs-Platzhalter

**Abhängigkeiten:** Etappe 0 abgeschlossen.

**Test-Checkpoint:**
- [ ] Klausur erstellen → erscheint im Dashboard
- [ ] Klausur bearbeiten (Name ändern) → speichert korrekt
- [ ] Klausur löschen → verschwindet
- [ ] Block erstellen mit Gewichtung → wird in Klausur-Detail angezeigt
- [ ] Gewichtungs-Validierung: Versuch, Blocks mit Summe ≠ 100% zu speichern → Fehlermeldung
- [ ] Zweiter User (neuer Account) sieht KEINE Klausuren des ersten Users (RLS-Test)
- [ ] DB-Schema: Alle Tabellen, Indizes und Views existieren (Supabase Dashboard prüfen)

---

## Etappe 2 — PDF-Upload & Viewer

**Ziel:** User kann PDFs hochladen und sich die hochgeladenen Zusammenfassungen direkt in der App ansehen. Kein KI-Processing in dieser Etappe.

**Scope:**
- PDF-Upload-Komponente (Drag & Drop oder File-Picker) auf der Block-Detailseite
- Upload → Supabase Storage + Summary-Row (status: `pending`)
- PDF-Größen-Validierung: Max 30 Seiten, Max 10 MB (Frontend-Check)
- PDF-Viewer: Hochgeladenes PDF aus Supabase Storage laden (signierte URL) und als eingebettetes PDF anzeigen (via `react-pdf`, `<iframe>` oder `<embed>`)
- Viewer erreichbar über Klick auf eine Zusammenfassung in der Block-Detailseite
- Summary-Liste zeigt hochgeladene PDFs mit Dateiname und Upload-Datum
- Löschen von Zusammenfassungen (mit Bestätigungsdialog)

**Abhängigkeiten:** Etappe 1 abgeschlossen.

**Test-Checkpoint:**
- [ ] PDF hochladen → erscheint in Summary-Liste
- [ ] Klick auf Summary → PDF wird im Viewer angezeigt (lesbar, scrollbar)
- [ ] PDF über 10 MB wird abgelehnt (Frontend-Validierung)
- [ ] Nur PDF-Dateien sind erlaubt
- [ ] Zusammenfassung löschen → PDF verschwindet aus Liste und Storage
- [ ] Zweiter User sieht keine Summaries des ersten Users (RLS-Test)

---

## Etappe 3 — Processing-Pipeline (KI)

**Ziel:** Hochgeladene PDFs werden automatisch geparst und daraus Sections, Flashcards und Exam Questions generiert. Status-Tracking im UI.

**Scope:**
- Edge Function `process-summary`:
  - PDF aus Storage laden
  - Schritt 1: Parsing-Call an Claude (PDF als Base64 Document, Output: Sections als Markdown)
  - Sections in DB schreiben, `sections_total` setzen, Status → `generating`
  - Schritt 2: Generierungs-Calls pro Section (parallel via Promise.allSettled)
  - Pro Section: 3–5 Flashcards + 3–5 Exam Questions
  - `sections_processed` inkrementieren pro fertigem Call
  - Status → `completed` oder `failed`
- Retry-Logik: Max 2 Retries pro Call mit exponentiellem Backoff
- Frontend ruft Edge Function nach Upload auf
- Supabase Realtime Subscription im Frontend für `processing_status`-Updates
- UI: Status-Badge auf Summaries (⏳/✓/✗), Fortschrittsanzeige bei `generating`, Retry-Button bei Fehler
- Anthropic API Key als Supabase Edge Function Secret konfigurieren

**Abhängigkeiten:** Etappe 2 abgeschlossen. Anthropic API Key muss vorliegen.

**Test-Checkpoint:**
- [ ] PDF hochladen → Status wechselt live von `parsing` → `generating` (mit Fortschritt) → `completed`
- [ ] Sections wurden erkannt und in DB geschrieben (Supabase Dashboard prüfen)
- [ ] Flashcards wurden generiert (3–5 pro Section) (DB prüfen)
- [ ] Exam Questions wurden generiert (3–5 pro Section, verschiedene Typen) (DB prüfen)
- [ ] Bei absichtlich kaputtem API Key: Status → `failed`, Fehlermeldung sichtbar, Retry-Button erscheint

---

## Etappe 4 — Karteikarten (Anzeige + Sessions)

**Ziel:** User kann Karteikarten durcharbeiten (Frage sehen → Antwort schreiben → Musterlösung aufdecken → Selbstbewertung). Karteikarten können editiert, gelöscht und manuell erstellt werden.

**Scope:**
- Karteikarten-Übersicht pro Klausur/Block (Liste aller Flashcards, gruppiert nach Section)
- Karteikarten-Session-UI:
  - Frage anzeigen
  - Textfeld für Antwort
  - "Lösung anzeigen"-Button → Musterlösung aufdecken
  - "Richtig" / "Falsch"-Buttons → Attempt in DB schreiben
  - Nächste Karte
  - Session-Ende: Zusammenfassung (X richtig, Y falsch)
- Karteikarten-CRUD: Manuell erstellen, editieren, löschen
- On-Demand-Nachgenerierung pro Section (Button "Weitere Karteikarten generieren")
  - Edge Function `regenerate-content` — separate Function, nutzt aber dieselbe Generierungs-Logik wie Schritt 2 der Pipeline
  - Pool-Limit-Hinweis bei ≥20 AI-generierten Flashcards pro Section
- Filter: Alle Karten / Nur Block X / Nur Section Y

**Abhängigkeiten:** Etappe 3 abgeschlossen (Flashcards müssen existieren).

**Test-Checkpoint:**
- [ ] Karteikarten-Session starten → Frage wird angezeigt
- [ ] Antwort schreiben → Lösung aufdecken → Richtig/Falsch markieren → nächste Karte
- [ ] Session-Ende zeigt Zusammenfassung
- [ ] Attempts werden in DB geschrieben (Supabase Dashboard prüfen)
- [ ] Karteikarte manuell erstellen → erscheint in der Liste
- [ ] Karteikarte editieren → Änderungen gespeichert
- [ ] Karteikarte löschen → verschwindet
- [ ] Nachgenerierung: Button klicken → 3–5 neue Karten erscheinen
- [ ] Pool-Limit: Bei ≥20 AI-Karten pro Section → Hinweis erscheint
- [ ] Pool-Limit: Bei ≥30 AI-Karten pro Section → dringlicherer Hinweis mit Lösch-Empfehlung

---

## Etappe 5 — Probeklausuren

**Ziel:** User kann Probeklausuren (18 Fragen, gewichtet) und Teilklausuren (pro Block) starten, pausieren und fortsetzen. Alle 4 Fragetypen funktionieren.

**Scope:**
- Fragetyp-Komponenten (jeweils eigene UI):
  - Multiple Choice (Radio-Buttons, 4 Optionen)
  - Lückentext (Text mit Input-Feldern)
  - Zuordnung (Drag & Drop oder Dropdown-Matching)
  - Freitext (Textarea + Musterlösung)
- Largest-Remainder-Algorithmus für Fragenverteilung (als Utility-Function mit Test)
- Probeklausur starten:
  - `exam_session` erstellen (Status: `in_progress`)
  - 18 Fragen aus Pool selektieren (gewichtet nach Blocks)
  - Wenn Pool nicht reicht: automatisch nachgenerieren
  - Fragen in `question_ids` speichern
- Probeklausur-Session-UI:
  - Frage anzeigen im richtigen Fragetyp
  - Antwort eingeben → Selbstbewertung (Richtig/Falsch)
  - Fortschrittsanzeige (Frage 5/18)
  - Antworten laufend in `answers` (JSONB) speichern
- Pausieren & Fortsetzen: Session verlassen → Dashboard zeigt "Offene Klausur fortsetzen"
- Session abschließen: Alle Bewertungen → `attempts`, Status → `completed`, Zusammenfassung
- Teilklausuren: Probeklausur für einzelnen Block (min. 3, max. 18 Fragen)
- Max 1 offene Session pro Exam
- On-Demand-Nachgenerierung für Exam Questions (analog zu Flashcards)
- Unit Tests schreiben für Largest-Remainder-Algorithmus und Minimum-Regel (als eigenständige Utility-Functions, testbar ohne UI)

**Abhängigkeiten:** Etappe 3 abgeschlossen (Exam Questions müssen existieren). Kann parallel zu Etappe 4 entwickelt werden, aber sequenziell ist sicherer.

**Automatisierte Tests (kritische Logik):**
- [ ] Largest-Remainder-Algorithmus: Unit-Test mit verschiedenen Gewichtungen (3 Blocks, 5 Blocks, Edge Case 1%-Block)
- [ ] Minimum-Regel: Block mit >0% Gewichtung bekommt mindestens 1 Frage

**Test-Checkpoint:**
- [ ] Probeklausur starten → 18 Fragen werden angezeigt
- [ ] Fragenverteilung entspricht Blockgewichtung (manuell nachzählen)
- [ ] Alle 4 Fragetypen werden korrekt dargestellt und sind bedienbar
- [ ] Selbstbewertung funktioniert pro Frage
- [ ] Session pausieren (Browser schließen) → Dashboard zeigt "Fortsetzen"-Button
- [ ] Session fortsetzen → unbeantwortete Fragen sind noch da, beantwortete haben ihre Bewertung
- [ ] Session abschließen → Zusammenfassung, Attempts in DB
- [ ] Teilklausur für einzelnen Block → korrekte Fragenanzahl
- [ ] Zweite Session starten während eine offen ist → Hinweis/Block

---

## Etappe 6 — Fehler-Tracking & Error Sessions

**Ziel:** Falsch beantwortete Karteikarten und Exam Questions erscheinen im Fehler-Pool. User kann Fehler-Sessions starten.

**Scope:**
- Fehler-Pool-Seite mit zwei Tabs:
  - Karteikarten-Fehler (Freitext-Format)
  - Klausuraufgaben-Fehler (Original-Fragetyp)
- Fehler-Pool liest aus der `error_pool`-View
- Anzeige pro Fehler: Frage, Section-Zuordnung, Block-Zuordnung, Datum des letzten falschen Attempts
- Fehler-Session starten:
  - `exam_session` erstellen mit `session_type = error_session`
  - Alle Items aus dem Error-Pool laden
  - Durcharbeiten im jeweiligen Format
- Selbstbewertung → Attempt schreiben
  - Richtig → Item fällt aus der View (letzter Attempt jetzt `is_correct = true`)
  - Falsch → bleibt im Pool
- Fehler-Counter im Sidebar/Navigation sichtbar

**Abhängigkeiten:** Etappe 4 + Etappe 5 abgeschlossen (es müssen Attempts mit `is_correct = false` existieren).

**Test-Checkpoint:**
- [ ] Nach Etappe 4+5: Falsch bewertete Items erscheinen im Fehler-Pool
- [ ] Karteikarten-Fehler werden als Freitext angezeigt
- [ ] Klausuraufgaben-Fehler werden im Original-Fragetyp angezeigt
- [ ] Fehler-Session starten → Pool durcharbeiten
- [ ] Item richtig beantwortet → verschwindet aus dem Fehler-Pool (Seite neu laden → weg)
- [ ] Item falsch beantwortet → bleibt im Pool
- [ ] Fehler-Counter in Sidebar aktualisiert sich

---

## Etappe 7 — Lernfortschritt & Viewer-Erweiterung

**Ziel:** Übersichtsseite pro Klausur mit Fortschrittsmetriken. PDF-Viewer bekommt Fortschritts-Overlay mit Section-Zuordnung.

**Scope:**
- Lernfortschritt-Seite pro Klausur:
  - Pro Block: Karteikarten bearbeitet/gesamt, richtig/falsch
  - Pro Block: Klausuraufgaben bearbeitet/gesamt, richtig/falsch
  - Pro Block: Offene Fehler
  - Nur nackte Zahlen, keine Farben/Schwellenwerte
- PDF-Viewer-Erweiterung (Fortschritts-Overlay):
  - Sidebar/Panel neben dem PDF-Viewer mit Liste der erkannten Sections
  - Pro Section: Verfügbare Aufgaben (Flashcards + Exam Questions), davon bearbeitet, davon richtig/falsch
  - Direkte Aufgabenbearbeitung aus dem Viewer heraus (Button → Karteikarten oder Exam Questions für diese Section starten)
  - Overlay erscheint nur wenn Processing-Pipeline abgeschlossen ist (`processing_status: completed`)
  - Nur bestehende Pool-Aufgaben — keine On-the-fly-Generierung

**Abhängigkeiten:** Etappe 4 + 5 + 6 abgeschlossen (Fortschrittsdaten müssen existieren).

**Test-Checkpoint:**
- [ ] Lernfortschritt-Seite zeigt korrekte Zahlen (manuell mit DB abgleichen)
- [ ] PDF wird im Viewer korrekt angezeigt (Original-Format)
- [ ] Fortschritts-Overlay neben dem PDF zeigt Sections mit korrekten Zahlen
- [ ] "Aufgaben bearbeiten"-Button im Viewer öffnet Session für die Section
- [ ] Nackte Zahlen — keine Farben, keine Diagramme, keine Schwellenwerte

---

## Etappe 8 — Polish, Edge Cases & Hardening

**Ziel:** Alle lose Enden schließen. Fehlerzustände abfangen. UX-Feinschliff.

**Scope:**
- Abandoned Sessions: Sessions >7 Tage ohne Abschluss → `abandoned` (Cron oder zeitgesteuerter Check)
- Leerzustände: "Noch keine Klausuren", "Noch keine Flashcards", "Fehler-Pool ist leer" — überall sinnvolle Empty States
- Bestätigungsdialoge: Löschen von Klausuren, Blocks, Summaries (kaskadiert!)
- Loading States: Skeleton-Loader für alle Datenlisten
- Error Boundaries: Sinnvolle Fehlermeldungen statt White Screen
- Responsive Design: Mobile-tauglich (falls im Design vorgesehen)
- Performance-Check: Sind die Attempts-Queries schnell genug? Error-Pool-View performant?
- Gewichtungs-UX: Was passiert wenn ein Block gelöscht wird? (Gewichtungen anderer Blocks stimmen nicht mehr → Hinweis)
- SEO: Meta-Tags, Page Titles
- Favicon, App-Name

**Abhängigkeiten:** Alle vorherigen Etappen abgeschlossen.

**Test-Checkpoint:**
- [ ] Abandoned Sessions: Session erstellen, `created_at` manuell in DB auf 8 Tage zurücksetzen, Cleanup-Logik auslösen → Status wechselt zu `abandoned`
- [ ] Alle Leerzustände haben sinnvolle Anzeigen
- [ ] Löschen einer Klausur mit Blocks, Summaries, Flashcards → alles kaskadiert weg (DB prüfen)
- [ ] Keine Console-Errors im Browser
- [ ] Alle Seiten laden in <2s (gefühlt)
- [ ] Mobile-Ansicht brauchbar (falls relevant)
- [ ] Kompletter Durchlauf: Account erstellen → Klausur anlegen → Blocks → PDF hochladen → PDF im Viewer anschauen → Processing abwarten → Karteikarten durcharbeiten → Probeklausur → Fehler-Session → Lernfortschritt prüfen

---

## Übersicht: Abhängigkeiten

```
Voraussetzungen (Design, API Key, GitHub Repo)
  │
  ▼
Etappe 0 — Scaffolding & Auth
  │
  ▼
Etappe 1 — DB-Schema & Klausur/Block-CRUD
  │
  ▼
Etappe 2 — PDF-Upload & Viewer
  │
  ▼
Etappe 3 — Processing-Pipeline (KI)
  │
  ├──────────────┐
  ▼              ▼
Etappe 4       Etappe 5
Karteikarten   Probeklausuren
  │              │
  └──────┬───────┘
         ▼
Etappe 6 — Fehler-Tracking
         │
         ▼
Etappe 7 — Lernfortschritt & Viewer-Erweiterung
         │
         ▼
Etappe 8 — Polish & Hardening
```

**Hinweis:** Etappe 4 und 5 könnten theoretisch parallel laufen, aber sequenziell (4 → 5) ist sicherer, weil die Fragetyp-Komponenten aus Etappe 5 auf den Session-Patterns aus Etappe 4 aufbauen.

---

## Hinweise für die Claude-Code-Prompts

Jede Etappe wird als eigenständiger Claude-Code-Prompt umgesetzt. Dabei gilt:

1. **Spec-Referenz:** Jeder Prompt verweist auf die `lerntool-spezifikation.md` als autoritative Quelle
2. **Scope klar begrenzen:** Nur das bauen was in der Etappe steht — nichts vorgreifen
3. **Bestehenden Code respektieren:** Ab Etappe 1 baut jeder Prompt auf dem bestehenden Projekt auf
4. **Annahmen dokumentieren:** Claude Code soll Entscheidungen als Kommentare dokumentieren
5. **Keine eigenen Design-Entscheidungen:** UI folgt dem gelieferten Design + shadcn/ui Defaults
6. **TypeScript strict:** Keine `any`-Types, Supabase-Types nutzen
