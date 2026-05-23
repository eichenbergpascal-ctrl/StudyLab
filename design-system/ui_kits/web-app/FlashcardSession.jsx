/* StudyLab UI Kit — Flashcard Session View */
/* global React, Card, Button, Badge, ProgressBar, Icon */

function FlashcardSession() {
  const [flipped, setFlipped] = React.useState(false);
  const [cardIndex, setCardIndex] = React.useState(6);
  const totalCards = 24;

  const fs = {
    root: { flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--slate-50)', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '20px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' },
    topBar: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    counter: { fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' },
    cardArea: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' },
    flashcard: {
      width: '100%', maxWidth: '580px', minHeight: '300px',
      background: '#fff', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-lg)', padding: '32px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'box-shadow 200ms, border-color 200ms',
      position: 'relative', textAlign: 'center',
      userSelect: 'none',
    },
    flashcardFlipped: {
      background: 'var(--blue-50)', borderColor: 'var(--blue-200)',
    },
    cardLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--blue-500)', position: 'absolute', top: '16px', left: '20px' },
    question: {
      fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 600,
      color: 'var(--slate-900)', lineHeight: 1.5, maxWidth: '460px',
    },
    answer: {
      fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 400,
      color: 'var(--slate-700)', lineHeight: 1.7, maxWidth: '460px',
    },
    flipHint: {
      position: 'absolute', bottom: '16px',
      fontSize: '12px', color: 'var(--slate-400)', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: '4px',
    },
    controls: {
      display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px',
    },
    ratingBtn: (bg, fg) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '12px 24px', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--slate-200)', background: bg, color: fg,
      cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
      transition: 'all 120ms',
      minWidth: '100px',
    }),
    ratingLabel: { fontSize: '11px', fontWeight: 500, opacity: 0.7 },
    sidebar: {
      display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px',
      maxWidth: '580px', width: '100%', alignSelf: 'center',
    },
    statRow: {
      display: 'flex', gap: '8px',
    },
    miniStat: (bg) => ({
      flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
      background: bg, display: 'flex', flexDirection: 'column', gap: '2px',
    }),
    miniStatVal: { fontSize: '18px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
    miniStatLabel: { fontSize: '11px', fontWeight: 500, opacity: 0.7 },
  };

  const handleNext = () => {
    setFlipped(false);
    setCardIndex(prev => Math.min(prev + 1, totalCards - 1));
  };

  const questionText = "Was ist eine lineare Abbildung?";
  const answerText = "Eine lineare Abbildung ist eine Abbildung f: V → W zwischen zwei Vektorräumen V und W, die die Eigenschaften f(u + v) = f(u) + f(v) und f(λv) = λf(v) für alle Vektoren u, v ∈ V und alle Skalare λ erfüllt.";

  return React.createElement('div', { style: fs.root },
    /* Header */
    React.createElement('div', { style: fs.header },
      React.createElement('div', { style: fs.headerLeft },
        React.createElement(Button, { variant: 'ghost', icon: 'arrowLeft', size: 'sm', onClick: () => {} }),
        React.createElement('h1', { style: fs.title }, 'Lineare Algebra II'),
        React.createElement(Badge, { color: 'blue' }, 'Karteikarten'),
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement(Icon, { name: 'zap', size: 16 }),
        React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--green-600)' } }, '5× Streak'),
      )
    ),

    /* Progress */
    React.createElement('div', { style: fs.topBar },
      React.createElement('span', { style: fs.counter }, `${cardIndex + 1} / ${totalCards}`),
      React.createElement(ProgressBar, { value: ((cardIndex + 1) / totalCards) * 100, color: 'var(--blue-500)', style: { flex: 1 } }),
    ),

    /* Card Area */
    React.createElement('div', { style: fs.cardArea },
      React.createElement('div', {
        style: { ...fs.flashcard, ...(flipped ? fs.flashcardFlipped : {}) },
        onClick: () => setFlipped(!flipped),
      },
        React.createElement('span', { style: fs.cardLabel }, flipped ? 'Antwort' : 'Frage'),
        !flipped
          ? React.createElement('div', { style: fs.question }, questionText)
          : React.createElement('div', { style: fs.answer }, answerText),
        !flipped && React.createElement('div', { style: fs.flipHint },
          React.createElement(Icon, { name: 'rotateCcw', size: 14 }), 'Klicken zum Aufdecken'
        ),
      )
    ),

    /* Rating Controls (shown when flipped) */
    flipped && React.createElement('div', { style: fs.controls },
      React.createElement('button', {
        style: fs.ratingBtn('var(--red-50)', 'var(--red-600)'),
        onClick: handleNext,
      },
        React.createElement(Icon, { name: 'x', size: 18 }),
        React.createElement('span', null, 'Falsch'),
        React.createElement('span', { style: fs.ratingLabel }, 'Nochmal'),
      ),
      React.createElement('button', {
        style: fs.ratingBtn('var(--amber-50)', 'var(--amber-700)'),
        onClick: handleNext,
      },
        '~',
        React.createElement('span', null, 'Unsicher'),
        React.createElement('span', { style: fs.ratingLabel }, 'Bald wiederholen'),
      ),
      React.createElement('button', {
        style: fs.ratingBtn('var(--green-50)', 'var(--green-600)'),
        onClick: handleNext,
      },
        React.createElement(Icon, { name: 'check', size: 18 }),
        React.createElement('span', null, 'Richtig'),
        React.createElement('span', { style: fs.ratingLabel }, 'Nächste Stufe'),
      ),
    ),

    /* Session Stats */
    React.createElement('div', { style: fs.sidebar },
      React.createElement('div', { style: fs.statRow },
        React.createElement('div', { style: fs.miniStat('var(--green-50)') },
          React.createElement('span', { style: { ...fs.miniStatVal, color: 'var(--green-600)' } }, '4'),
          React.createElement('span', { style: { ...fs.miniStatLabel, color: 'var(--green-600)' } }, 'Richtig'),
        ),
        React.createElement('div', { style: fs.miniStat('var(--red-50)') },
          React.createElement('span', { style: { ...fs.miniStatVal, color: 'var(--red-600)' } }, '1'),
          React.createElement('span', { style: { ...fs.miniStatLabel, color: 'var(--red-600)' } }, 'Falsch'),
        ),
        React.createElement('div', { style: fs.miniStat('var(--amber-50)') },
          React.createElement('span', { style: { ...fs.miniStatVal, color: 'var(--amber-700)' } }, '1'),
          React.createElement('span', { style: { ...fs.miniStatLabel, color: 'var(--amber-700)' } }, 'Unsicher'),
        ),
        React.createElement('div', { style: fs.miniStat('var(--slate-50)') },
          React.createElement('span', { style: { ...fs.miniStatVal, color: 'var(--slate-600)' } }, `${totalCards - cardIndex - 1}`),
          React.createElement('span', { style: { ...fs.miniStatLabel, color: 'var(--slate-500)' } }, 'Verbleibend'),
        ),
      ),
    ),
  );
}

Object.assign(window, { FlashcardSession });
