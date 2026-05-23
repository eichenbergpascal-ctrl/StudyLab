/* StudyLab UI Kit — Summary Viewer */
/* global React, Card, Button, Badge, ProgressBar, Icon */

function SummaryViewer() {
  const sv = {
    root: { flex: 1, display: 'flex', background: 'var(--slate-50)', overflow: 'hidden' },
    toc: {
      width: '220px', minWidth: '220px', borderRight: '1px solid var(--slate-200)',
      background: '#fff', padding: '20px 12px', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: '2px',
    },
    tocTitle: { fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', padding: '0 8px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    tocItem: (active) => ({
      padding: '6px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: active ? 600 : 400,
      color: active ? 'var(--blue-600)' : 'var(--slate-600)',
      background: active ? 'var(--blue-50)' : 'transparent',
      cursor: 'pointer', fontFamily: 'var(--font-sans)', border: 'none', textAlign: 'left', width: '100%',
    }),
    tocSub: { paddingLeft: '16px', fontSize: '12px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    toolbar: {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px',
      borderBottom: '1px solid var(--slate-200)', background: '#fff',
    },
    reader: {
      flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '32px 24px',
    },
    page: {
      maxWidth: '680px', width: '100%', fontFamily: 'var(--font-serif)',
    },
    h2: { fontSize: '22px', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '16px', lineHeight: 1.3, fontFamily: 'var(--font-serif)' },
    h3: { fontSize: '17px', fontWeight: 600, color: 'var(--slate-800)', marginTop: '24px', marginBottom: '10px', fontFamily: 'var(--font-serif)' },
    para: { fontSize: '16px', lineHeight: 1.8, color: 'var(--slate-700)', marginBottom: '14px' },
    highlight: { background: 'var(--amber-100)', padding: '1px 3px', borderRadius: '2px' },
    formula: {
      fontFamily: 'var(--font-mono)', fontSize: '14px', background: 'var(--slate-50)',
      padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--slate-200)',
      color: 'var(--slate-700)', margin: '16px 0', textAlign: 'center',
    },
    bottomBar: {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px',
      borderTop: '1px solid var(--slate-200)', background: '#fff',
    },
    pageNum: { fontSize: '12px', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)', fontWeight: 500 },
  };

  const tocSections = [
    { label: '1. Einführung', active: false },
    { label: '2. Vektorräume', active: true, children: ['2.1 Definition', '2.2 Beispiele', '2.3 Unterräume'] },
    { label: '3. Lineare Abbildungen', active: false },
    { label: '4. Matrizen', active: false },
    { label: '5. Determinanten', active: false },
  ];

  return React.createElement('div', { style: sv.root },
    /* TOC Sidebar */
    React.createElement('div', { style: sv.toc },
      React.createElement('div', { style: sv.tocTitle }, 'Inhalt'),
      tocSections.map((s, i) => React.createElement(React.Fragment, { key: i },
        React.createElement('button', { style: sv.tocItem(s.active) }, s.label),
        s.children && s.active && s.children.map((c, j) =>
          React.createElement('button', { key: j, style: { ...sv.tocItem(j === 0), ...sv.tocSub } }, c)
        )
      ))
    ),

    /* Main reader */
    React.createElement('div', { style: sv.main },
      /* Toolbar */
      React.createElement('div', { style: sv.toolbar },
        React.createElement(Button, { variant: 'ghost', icon: 'arrowLeft', size: 'sm' }),
        React.createElement('span', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)', flex: 1 } }, 'Lineare Algebra II — Zusammenfassung'),
        React.createElement(Badge, { color: 'blue' }, '12 Seiten'),
        React.createElement(Button, { variant: 'secondary', icon: 'layers', size: 'sm' }, 'Karten generieren'),
      ),

      /* Reader Area */
      React.createElement('div', { style: sv.reader },
        React.createElement('div', { style: sv.page },
          React.createElement('h2', { style: sv.h2 }, '2. Vektorräume'),
          React.createElement('h3', { style: sv.h3 }, '2.1 Definition'),
          React.createElement('p', { style: sv.para },
            'Ein ', React.createElement('span', { style: sv.highlight }, 'Vektorraum'), ' (oder linearer Raum) über einem Körper K ist eine Menge V zusammen mit zwei Verknüpfungen: der Vektoraddition und der Skalarmultiplikation, die bestimmte Axiome erfüllen.'
          ),
          React.createElement('p', { style: sv.para },
            'Formal ist ein Vektorraum ein Tupel (V, +, ·), wobei V eine nichtleere Menge ist, die folgende acht Axiome erfüllt:'
          ),
          React.createElement('div', { style: sv.formula },
            '∀ u, v ∈ V : u + v = v + u   (Kommutativität)'
          ),
          React.createElement('p', { style: sv.para },
            'Die Elemente von V heißen Vektoren, die Elemente von K heißen Skalare. Der Nullvektor 0 ∈ V ist das neutrale Element der Addition.'
          ),
          React.createElement('h3', { style: sv.h3 }, '2.2 Beispiele'),
          React.createElement('p', { style: sv.para },
            'Der Standardvektorraum ℝⁿ ist das bekannteste Beispiel. Auch Funktionenräume und Polynomräume sind Vektorräume über ℝ.'
          ),
        )
      ),

      /* Bottom Bar */
      React.createElement('div', { style: sv.bottomBar },
        React.createElement(ProgressBar, { value: 35, color: 'var(--blue-500)', style: { flex: 1 } }),
        React.createElement('span', { style: sv.pageNum }, 'Seite 4 / 12'),
        React.createElement('span', { style: { fontSize: '12px', color: 'var(--slate-400)' } }, '35% gelesen'),
      ),
    ),
  );
}

Object.assign(window, { SummaryViewer });
