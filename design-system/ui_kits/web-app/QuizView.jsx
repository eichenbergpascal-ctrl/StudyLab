/* StudyLab UI Kit — Practice Exam (Quiz) View */
/* global React, Card, Button, Badge, ProgressBar, Icon */

function QuizView() {
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);
  const questionIndex = 4;
  const totalQuestions = 15;
  const correctAnswer = 2;

  const qs = {
    root: { flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--slate-50)', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '20px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' },
    topBar: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
    counter: { fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' },
    timer: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--slate-600)', fontFamily: 'var(--font-mono)' },
    content: { maxWidth: '700px', width: '100%', alignSelf: 'center' },
    questionCard: { padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' },
    questionType: { fontSize: '12px', fontWeight: 600, color: 'var(--blue-500)', textTransform: 'uppercase', letterSpacing: '0.04em' },
    questionText: { fontSize: '18px', fontWeight: 600, color: 'var(--slate-900)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' },
    options: { display: 'flex', flexDirection: 'column', gap: '8px' },
    option: (isSelected, isCorrect, isWrong) => ({
      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px',
      borderRadius: 'var(--radius-sm)', border: '1.5px solid',
      borderColor: isCorrect ? 'var(--green-400)' : isWrong ? 'var(--red-300)' : isSelected ? 'var(--blue-400)' : 'var(--slate-200)',
      background: isCorrect ? 'var(--green-50)' : isWrong ? 'var(--red-50)' : isSelected ? 'var(--blue-50)' : '#fff',
      cursor: submitted ? 'default' : 'pointer', transition: 'all 120ms',
      fontFamily: 'var(--font-sans)',
    }),
    optionLetter: (isSelected) => ({
      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 600,
      background: isSelected ? 'var(--blue-500)' : 'var(--slate-100)',
      color: isSelected ? '#fff' : 'var(--slate-500)',
    }),
    optionText: { fontSize: '14px', color: 'var(--slate-700)', lineHeight: 1.5, paddingTop: '2px' },
    feedback: (correct) => ({
      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
      borderRadius: 'var(--radius-sm)',
      background: correct ? 'var(--green-50)' : 'var(--red-50)',
      border: `1px solid ${correct ? 'var(--green-200)' : 'var(--red-200)'}`,
    }),
    feedbackIcon: (correct) => ({
      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: correct ? 'var(--green-500)' : 'var(--red-500)', color: '#fff',
    }),
    feedbackText: { fontSize: '14px', lineHeight: 1.5 },
    feedbackTitle: (correct) => ({ fontWeight: 600, color: correct ? 'var(--green-700)' : 'var(--red-700)', marginBottom: '2px' }),
    feedbackBody: { color: 'var(--slate-600)' },
    actions: { display: 'flex', justifyContent: 'space-between', marginTop: '16px' },
    sidebar: { maxWidth: '700px', width: '100%', alignSelf: 'center', marginTop: '20px' },
    questionNav: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
    qNavDot: (state) => ({
      width: '28px', height: '28px', borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      background: state === 'current' ? 'var(--blue-500)' : state === 'correct' ? 'var(--green-100)' : state === 'wrong' ? 'var(--red-100)' : 'var(--slate-100)',
      color: state === 'current' ? '#fff' : state === 'correct' ? 'var(--green-700)' : state === 'wrong' ? 'var(--red-700)' : 'var(--slate-500)',
    }),
  };

  const options = [
    'Eine Funktion, die einen Skalar auf einen Vektor abbildet',
    'Eine Abbildung, die Vektoraddition und Skalarmultiplikation erhält',
    'Eine Abbildung f: V → W mit f(u+v) = f(u) + f(v) und f(λv) = λf(v)',
    'Eine bijektive Abbildung zwischen zwei Mengen',
  ];

  const letters = ['A', 'B', 'C', 'D'];
  const isCorrect = submitted && selectedAnswer === correctAnswer;
  const isWrong = submitted && selectedAnswer !== correctAnswer;

  // Question navigation states
  const qStates = Array.from({ length: totalQuestions }, (_, i) => {
    if (i === questionIndex) return 'current';
    if (i < questionIndex) return i % 3 === 0 ? 'wrong' : 'correct';
    return 'future';
  });

  return React.createElement('div', { style: qs.root },
    /* Header */
    React.createElement('div', { style: qs.header },
      React.createElement('div', { style: qs.headerLeft },
        React.createElement(Button, { variant: 'ghost', icon: 'arrowLeft', size: 'sm' }),
        React.createElement('h1', { style: qs.title }, 'Lineare Algebra II'),
        React.createElement(Badge, { color: 'amber' }, 'Probeklausur'),
      ),
      React.createElement(Button, { variant: 'destructive', size: 'sm' }, 'Abbrechen'),
    ),

    /* Progress bar + timer */
    React.createElement('div', { style: qs.topBar },
      React.createElement('span', { style: qs.counter }, `Frage ${questionIndex + 1} / ${totalQuestions}`),
      React.createElement(ProgressBar, { value: ((questionIndex + 1) / totalQuestions) * 100, color: 'var(--blue-500)', style: { flex: 1 } }),
      React.createElement('div', { style: qs.timer },
        React.createElement(Icon, { name: 'clock', size: 15 }), '32:15'
      ),
    ),

    /* Question */
    React.createElement('div', { style: qs.content },
      React.createElement(Card, { style: qs.questionCard },
        React.createElement('span', { style: qs.questionType }, 'Multiple Choice'),
        React.createElement('div', { style: qs.questionText }, 'Was ist die korrekte Definition einer linearen Abbildung?'),

        React.createElement('div', { style: qs.options },
          options.map((opt, i) => {
            const sel = selectedAnswer === i;
            const showCorrect = submitted && i === correctAnswer;
            const showWrong = submitted && sel && i !== correctAnswer;
            return React.createElement('div', {
              key: i,
              style: qs.option(sel, showCorrect, showWrong),
              onClick: () => { if (!submitted) setSelectedAnswer(i); },
            },
              React.createElement('div', { style: qs.optionLetter(sel || showCorrect) }, showCorrect
                ? React.createElement(Icon, { name: 'check', size: 14 })
                : showWrong
                  ? React.createElement(Icon, { name: 'x', size: 14 })
                  : letters[i]
              ),
              React.createElement('span', { style: qs.optionText }, opt),
            );
          })
        ),

        /* Feedback */
        submitted && React.createElement('div', { style: qs.feedback(isCorrect) },
          React.createElement('div', { style: qs.feedbackIcon(isCorrect) },
            React.createElement(Icon, { name: isCorrect ? 'check' : 'x', size: 14 })
          ),
          React.createElement('div', { style: qs.feedbackText },
            React.createElement('div', { style: qs.feedbackTitle(isCorrect) }, isCorrect ? 'Richtig!' : 'Falsch'),
            React.createElement('div', { style: qs.feedbackBody },
              isCorrect
                ? 'Gut gemacht! Eine lineare Abbildung erhält Vektoraddition und Skalarmultiplikation.'
                : 'Die richtige Antwort ist C. Eine lineare Abbildung muss beide Eigenschaften — Additivität und Homogenität — erfüllen.'
            ),
          ),
        ),

        /* Actions */
        React.createElement('div', { style: qs.actions },
          React.createElement(Button, { variant: 'ghost', size: 'sm' }, 'Frage melden'),
          !submitted
            ? React.createElement(Button, {
                variant: 'primary', disabled: selectedAnswer === null,
                onClick: () => setSubmitted(true),
              }, 'Antwort prüfen')
            : React.createElement(Button, { variant: 'primary', icon: 'arrowRight' }, 'Nächste Frage'),
        ),
      ),
    ),

    /* Question Navigator */
    React.createElement('div', { style: qs.sidebar },
      React.createElement(Card, { style: { padding: '12px 16px' } },
        React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '8px' } }, 'Fragenübersicht'),
        React.createElement('div', { style: qs.questionNav },
          qStates.map((state, i) =>
            React.createElement('div', { key: i, style: qs.qNavDot(state) }, i + 1)
          )
        ),
      ),
    ),
  );
}

Object.assign(window, { QuizView });
