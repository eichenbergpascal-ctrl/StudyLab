# Task: Drei neue Aufgabentypen integrieren (true_false, ordering, calculation)

## Context
StudyLab ist ein Uni-Lerntool mit Probeklausuren und Karteikarten. Aktuell existieren 4 Aufgabentypen: `mc`, `fill_blank`, `matching`, `free_text`. Drei neue Typen werden hinzugefügt. Alle nutzen Selbstbewertung (Richtig/Falsch-Buttons durch den User) — kein Auto-Check. Die neuen Typen müssen überall funktionieren: in Probeklausur-Sessions, Fehler-Sessions und im manuellen Erstellen/Editieren-Dialog.

## Tech Stack
- Framework: Next.js 14+ (App Router), TypeScript, Server Components
- Styling: Tailwind CSS, shadcn/ui (Radix UI)
- Backend: Supabase (PostgreSQL, Edge Functions Deno/TS)
- Markdown: react-markdown + remark-gfm + remark-math + rehype-katex
- Icons: lucide-react
- Design: Lies `design-system/README.md` und `design-system/colors_and_type.css` für Token/Farben

## File Structure (alle relevanten Dateien)
```
supabase/
  migrations/001_initial_schema.sql          # question_type ENUM Definition
  functions/generate-section/index.ts        # Generation-Prompt + Types + Validierung
  functions/regenerate-content/index.ts      # Regeneration-Prompt + Types + Validierung
prompts/generation-prompt-v2.md              # Prompt-Dokumentation (parallel aktualisieren)
src/lib/types/exam-questions.ts              # TypedExamQuestion Union + Interfaces
src/app/(dashboard)/klausuren/[id]/probeklausur/
  _components/ExamQuestionDialog.tsx          # Manuelles Erstellen/Editieren aller Typen
  _components/question-types/                # Ein Renderer pro Typ
    McQuestion.tsx                            # Referenz-Pattern für neue Renderer
    FillBlankQuestion.tsx
    MatchingQuestion.tsx
    FreeTextQuestion.tsx
  session/[sessionId]/_components/ExamSession.tsx  # Switch-Dispatch auf question_type
src/app/(dashboard)/fehler/klausuren/session/
  _components/ExamErrorSession.tsx            # Gleicher Switch-Dispatch für Fehler-Sessions
```

## Task

### Phase 1: Datenbank + Types

1. Erstelle eine neue Migration `supabase/migrations/XXX_add_new_question_types.sql` die dem question_type ENUM drei Werte hinzufügt:
   ```sql
   ALTER TYPE question_type ADD VALUE 'true_false';
   ALTER TYPE question_type ADD VALUE 'ordering';
   ALTER TYPE question_type ADD VALUE 'calculation';
   ```

2. Erweitere `src/lib/types/exam-questions.ts` um diese Interfaces und füge sie zur `TypedExamQuestion` Union + `parseExamQuestion` hinzu:

   **true_false:**
   ```ts
   interface TrueFalseQuestionData { statement: string }
   interface TrueFalseAnswerData { is_true: boolean; explanation: string }
   ```

   **ordering:**
   ```ts
   interface OrderingQuestionData { instruction: string; items: string[] }
   // items sind in korrekter Reihenfolge gespeichert, correct_order ist immer [0,1,2,...]
   interface OrderingAnswerData { correct_order: number[]; explanation: string }
   ```

   **calculation:**
   ```ts
   interface CalculationQuestionData { question: string; formula_hint?: string }
   interface CalculationAnswerData {
     correct_value: number
     tolerance?: number
     unit?: string
     solution_steps: string[]
     explanation: string
   }
   ```

3. Regeneriere `src/lib/database.types.ts` mit `pnpm supabase gen types typescript` (oder aktualisiere die question_type Union manuell wenn CLI nicht verfügbar).

### Phase 2: Session-Renderer (3 neue Komponenten)

4. Erstelle `TrueFalseQuestion.tsx` in `question-types/`:
   - Zeige die Aussage (statement) in einer Card mit Label "Wahr oder Falsch"
   - Zwei Buttons: "Wahr" und "Falsch" (noch NICHT die Richtig/Falsch-Bewertung — das sind die Antwort-Optionen)
   - Nach Klick auf Wahr/Falsch: Lösung aufdecken — zeige ob die Aussage tatsächlich wahr/falsch ist + Erklärung
   - Dann Selbstbewertung mit Richtig/Falsch-Buttons (gleiches Pattern wie McQuestion.tsx)
   - Nutze exakt dasselbe visuelle Pattern wie `McQuestion.tsx` (Markdown-Rendering, Card-Styling, Button-Farben #36A06E / #DC4A4A)

5. Erstelle `OrderingQuestion.tsx` in `question-types/`:
   - Zeige die Instruktion in einer Card mit Label "Reihenfolge"
   - Zeige alle Items als Liste. Jedes Item hat ein nummeriertes Dropdown (`<select>`) für die Position (1, 2, 3, ...)
   - Items werden beim Rendern in zufälliger Reihenfolge angezeigt (shuffle wie in MatchingQuestion.tsx)
   - "Lösung anzeigen": Zeige korrekte Reihenfolge, markiere richtig/falsch positionierte Items visuell (grün/rot wie bei Matching)
   - Dann Selbstbewertung

6. Erstelle `CalculationQuestion.tsx` in `question-types/`:
   - Zeige die Frage in einer Card mit Label "Rechenaufgabe"
   - Wenn `formula_hint` vorhanden: Zeige als grauen Hinweis-Block unter der Frage (kursiv, text-muted-foreground)
   - Eingabefeld für die Antwort (type="text", kein type="number" — Komma/Punkt-Probleme vermeiden). Daneben optional die Unit als Label
   - "Lösung anzeigen": Zeige korrekten Wert (mit Einheit wenn vorhanden), Lösungsschritte als nummerierte Liste, Erklärung
   - Dann Selbstbewertung

### Phase 3: Session-Dispatch

7. Erweitere den Switch in `ExamSession.tsx` um die 3 neuen Cases + Imports.
8. Erweitere den Switch in `ExamErrorSession.tsx` um die 3 neuen Cases + Imports.

### Phase 4: Manuelles Erstellen/Editieren

9. Erweitere `ExamQuestionDialog.tsx`:
   - Erweitere `QuestionType` um `"true_false" | "ordering" | "calculation"`
   - Erweitere `TYPE_LABELS` um: `true_false: "Wahr/Falsch"`, `ordering: "Reihenfolge"`, `calculation: "Rechenaufgabe"`
   - Erweitere `TYPES` Array
   - Füge State-Variablen für jeden neuen Typ hinzu (Pattern von den bestehenden übernehmen)
   - Füge Reset-Logik im `useEffect` hinzu
   - Füge Init-Logik für Edit-Modus hinzu
   - Füge Validierung in `isSubmitDisabled` hinzu
   - Füge Submit-Logik in `handleSubmit` hinzu
   - Füge Formular-UI hinzu:

   **true_false:** Textarea für Statement + Radio-Buttons (Wahr/Falsch) für korrekte Antwort + Textarea für Erklärung

   **ordering:** Textarea für Instruktion + dynamische Liste von Textfeldern für Items (min 2, max 8, "Element hinzufügen"-Button) + Hinweis "Elemente in der richtigen Reihenfolge eingeben" + Textarea für Erklärung

   **calculation:** Textarea für Frage + optionales Textfeld für Formelhinweis + Number-Input für korrekten Wert + optionales Number-Input für Toleranz + optionales Textfeld für Einheit + dynamische Liste von Textfeldern für Lösungsschritte (min 1, "Schritt hinzufügen"-Button) + Textarea für Erklärung

   Da der Dialog jetzt 7 Typen hat: Ändere das Grid auf `grid-cols-3` (statt `grid-cols-2`) in der Typ-Auswahl, damit es optisch funktioniert. Eventuell auf `grid-cols-4` für die erste Reihe + `grid-cols-3` für die zweite — wähle was visuell sauberer aussieht.

### Phase 5: Generation-Prompt + Edge Functions

10. Erweitere den GENERATION_PROMPT in `supabase/functions/generate-section/index.ts`:
    - Füge die 3 neuen Typen zum JSON-Schema-Beispiel hinzu:
      ```json
      {
        "question_type": "true_false",
        "question_data": { "statement": "<Aussage, 1–2 Sätze>" },
        "answer_data": { "is_true": true, "explanation": "<1–2 Sätze>" }
      },
      {
        "question_type": "ordering",
        "question_data": {
          "instruction": "<Was soll sortiert werden? 1 Satz>",
          "items": ["<Item in korrekter Reihenfolge>", "..."]
        },
        "answer_data": { "correct_order": [0, 1, 2], "explanation": "<1–2 Sätze>" }
      },
      {
        "question_type": "calculation",
        "question_data": {
          "question": "<Rechenaufgabe, 1–3 Sätze>",
          "formula_hint": "<optional: relevante Formel>"
        },
        "answer_data": {
          "correct_value": 42.5,
          "tolerance": 0.1,
          "unit": "€",
          "solution_steps": ["<Schritt 1>", "<Schritt 2>"],
          "explanation": "<1–2 Sätze>"
        }
      }
      ```
    - Aktualisiere den Prompt-Text: "Wähle die 3–5 passendsten Aufgabentypen für den Inhalt. Nicht alle 7 Typen erzwingen." (statt "4 Typen")
    - Füge Prompt-Guidelines hinzu:
      - true_false: "Aussagen müssen plausibel klingen — keine offensichtlich falschen Statements. Mischung aus wahren und falschen Aussagen."
      - ordering: "3–6 Items. Nur verwenden wenn eine klare, eindeutige Reihenfolge existiert (Prozessschritte, chronologische Abfolge, Rangfolgen)."
      - calculation: "Nur verwenden wenn der Themenabschnitt Zahlen, Formeln oder Berechnungsbeispiele enthält. Aufgabe muss mit den gegebenen Informationen lösbar sein. solution_steps als kurze Schritte (je max 15 Wörter)."

11. Füge die TypeScript-Interfaces für die neuen Typen in `generate-section/index.ts` hinzu (gleiche Stelle wie die bestehenden McQuestion, FillBlankQuestion etc.) und erweitere die `ExamQuestion` Union.

12. Mache exakt dasselbe für `supabase/functions/regenerate-content/index.ts` — gleicher Prompt, gleiche Typen, gleiche Validierung.

13. Aktualisiere `prompts/generation-prompt-v2.md` mit den neuen Typen (Dokumentation synchron halten).

## Acceptance Criteria
- [ ] Migration läuft fehlerfrei durch (ALTER TYPE ADD VALUE)
- [ ] `TypedExamQuestion` in exam-questions.ts enthält alle 7 Typen mit korrekten Interfaces
- [ ] `parseExamQuestion` handled alle 7 Typen
- [ ] Alle 3 neuen Session-Renderer existieren und folgen dem Pattern der bestehenden (Markdown-Support, Selbstbewertung, gleiche Farben/Buttons)
- [ ] OrderingQuestion shufflet Items und nutzt nummerierte Dropdowns (kein Drag & Drop)
- [ ] CalculationQuestion zeigt formula_hint optional an
- [ ] ExamSession.tsx und ExamErrorSession.tsx dispatchen alle 7 Typen
- [ ] ExamQuestionDialog unterstützt manuelles Erstellen und Editieren aller 7 Typen
- [ ] Ordering-Dialog hat Hinweis "Elemente in der richtigen Reihenfolge eingeben"
- [ ] Calculation-Dialog hat optionale Felder für Toleranz, Einheit und Formelhinweis
- [ ] Generation-Prompt in beiden Edge Functions enthält die 3 neuen Typen mit korrektem JSON-Schema
- [ ] generation-prompt-v2.md ist synchron aktualisiert
- [ ] Keine bestehende Funktionalität der 4 alten Typen ist beeinträchtigt
- [ ] TypeScript kompiliert fehlerfrei (`pnpm build` oder `pnpm tsc --noEmit`)

## Constraints
- Kein Auto-Check bei Rechenaufgaben — alle Typen nutzen Selbstbewertung (Richtig/Falsch-Buttons)
- Kein Drag & Drop bei Reihenfolge — nummerierte Dropdowns
- Keine neuen Dependencies hinzufügen
- Design-Tokens aus `design-system/colors_and_type.css` nutzen, Farben für Richtig (#36A06E) und Falsch (#DC4A4A) wie in bestehenden Komponenten
- Alle UI-Texte auf Deutsch
