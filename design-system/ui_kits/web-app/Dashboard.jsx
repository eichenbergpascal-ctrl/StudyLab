/* StudyLab UI Kit — Dashboard View */
/* global React, Card, Badge, StatCard, ProgressBar, ProgressRing, Icon, Button */

function Dashboard() {
  const dashStyles = {
    root: { flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--slate-50)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' },
    subtitle: { fontSize: '14px', color: 'var(--slate-500)', marginTop: '4px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
    section: { marginBottom: '24px' },
    sectionTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    examGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
    examCard: { display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' },
    examHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    examTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--slate-900)' },
    examMeta: { fontSize: '13px', color: 'var(--slate-500)', display: 'flex', gap: '12px', alignItems: 'center' },
    examMetaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
    streakRow: { display: 'flex', gap: '4px', marginBottom: '4px' },
    streakDay: (active) => ({
      width: '32px', height: '32px', borderRadius: '6px',
      background: active ? 'var(--green-500)' : 'var(--slate-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '10px', fontWeight: 600,
      color: active ? '#fff' : 'var(--slate-400)',
    }),
    activityItem: {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
      borderBottom: '1px solid var(--slate-100)',
    },
    activityDot: (color) => ({
      width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0,
    }),
    activityText: { fontSize: '13px', color: 'var(--slate-700)', flex: 1 },
    activityTime: { fontSize: '12px', color: 'var(--slate-400)', whiteSpace: 'nowrap' },
  };

  const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const activeDays = [true, true, true, true, true, false, false];

  const exams = [
    { name: 'Lineare Algebra II', badge: 'In 5 Tagen', badgeColor: 'amber', cards: 48, quizzes: 3, progress: 72 },
    { name: 'Einführung in die Informatik', badge: 'In 2 Wochen', badgeColor: 'blue', cards: 96, quizzes: 5, progress: 45 },
    { name: 'Theoretische Physik I', badge: 'In 3 Wochen', badgeColor: 'slate', cards: 64, quizzes: 2, progress: 28 },
    { name: 'Statistik für Ingenieure', badge: 'Bestanden', badgeColor: 'green', cards: 32, quizzes: 4, progress: 100 },
  ];

  const activities = [
    { text: 'Probeklausur "Lineare Algebra II" abgeschlossen — 78% korrekt', time: 'Vor 2 Std.', color: 'var(--blue-500)' },
    { text: '12 Karteikarten in "Informatik" wiederholt', time: 'Vor 5 Std.', color: 'var(--green-500)' },
    { text: 'Neue Zusammenfassung hochgeladen: Physik_Kap3.pdf', time: 'Gestern', color: 'var(--slate-400)' },
    { text: 'Fehler-Review: 8 Fragen aus "Statistik" korrigiert', time: 'Gestern', color: 'var(--amber-500)' },
  ];

  return React.createElement('div', { style: dashStyles.root },
    /* Header */
    React.createElement('div', { style: dashStyles.header },
      React.createElement('div', null,
        React.createElement('h1', { style: dashStyles.title }, 'Dashboard'),
        React.createElement('p', { style: dashStyles.subtitle }, 'Guten Morgen, Marie. Du hast 2 anstehende Klausuren.')
      ),
      React.createElement(Button, { icon: 'upload', variant: 'primary', size: 'md' }, 'PDF hochladen')
    ),

    /* Stats */
    React.createElement('div', { style: dashStyles.statsGrid },
      React.createElement(StatCard, { label: 'Karteikarten gelernt', value: '284', sub: 'Diese Woche: +47', progress: 65, color: 'var(--blue-500)' }),
      React.createElement(StatCard, { label: 'Richtige Antworten', value: '78%', sub: 'Letzte 7 Tage', progress: 78, color: 'var(--green-500)' }),
      React.createElement(StatCard, { label: 'Probeklausuren', value: '12', sub: '3 diese Woche' }),
      React.createElement(Card, { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        React.createElement('span', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--slate-500)' } }, 'Lern-Streak'),
        React.createElement('div', { style: dashStyles.streakRow },
          days.map((d, i) => React.createElement('div', { key: d, style: dashStyles.streakDay(activeDays[i]) }, d))
        ),
        React.createElement('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--green-600)' } }, '5 Tage in Folge')
      )
    ),

    /* Exams */
    React.createElement('div', { style: dashStyles.section },
      React.createElement('div', { style: dashStyles.sectionTitle },
        React.createElement(Icon, { name: 'book', size: 16 }),
        'Klausuren'
      ),
      React.createElement('div', { style: dashStyles.examGrid },
        exams.map((exam, i) => React.createElement(Card, { key: i, style: dashStyles.examCard },
          React.createElement('div', { style: dashStyles.examHeader },
            React.createElement('span', { style: dashStyles.examTitle }, exam.name),
            React.createElement(Badge, { color: exam.badgeColor }, exam.badge)
          ),
          React.createElement('div', { style: dashStyles.examMeta },
            React.createElement('span', { style: dashStyles.examMetaItem },
              React.createElement(Icon, { name: 'layers', size: 14 }), `${exam.cards} Karten`
            ),
            React.createElement('span', { style: dashStyles.examMetaItem },
              React.createElement(Icon, { name: 'checkSquare', size: 14 }), `${exam.quizzes} Klausuren`
            ),
            React.createElement('div', { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' } },
              React.createElement(ProgressRing, { value: exam.progress, size: 36, strokeWidth: 3, color: exam.progress === 100 ? 'var(--green-500)' : 'var(--blue-500)' })
            )
          )
        ))
      )
    ),

    /* Activity */
    React.createElement('div', { style: dashStyles.section },
      React.createElement('div', { style: dashStyles.sectionTitle },
        React.createElement(Icon, { name: 'clock', size: 16 }),
        'Letzte Aktivitäten'
      ),
      React.createElement(Card, { style: { padding: '4px 16px' } },
        activities.map((a, i) => React.createElement('div', { key: i, style: { ...dashStyles.activityItem, borderBottom: i < activities.length - 1 ? '1px solid var(--slate-100)' : 'none' } },
          React.createElement('div', { style: dashStyles.activityDot(a.color) }),
          React.createElement('span', { style: dashStyles.activityText }, a.text),
          React.createElement('span', { style: dashStyles.activityTime }, a.time)
        ))
      )
    )
  );
}

Object.assign(window, { Dashboard });
