/* StudyLab UI Kit — Sidebar Navigation */
/* global React, Icon, NavItem */

function Sidebar({ currentView, onNavigate }) {
  const navItems = [
    { id: 'dashboard', icon: 'grid', label: 'Dashboard' },
    { id: 'flashcards', icon: 'layers', label: 'Karteikarten' },
    { id: 'quiz', icon: 'checkSquare', label: 'Probeklausuren' },
    { id: 'summaries', icon: 'fileText', label: 'Zusammenfassungen' },
    { id: 'errors', icon: 'alertCircle', label: 'Fehler-Tracking' },
  ];

  const sidebarStyles = {
    root: {
      width: '240px', minWidth: '240px', height: '100vh',
      background: '#fff', borderRight: '1px solid var(--slate-200)',
      display: 'flex', flexDirection: 'column', padding: '0',
      fontFamily: 'var(--font-sans)', position: 'sticky', top: 0,
    },
    logoWrap: {
      padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: '10px',
    },
    logoIcon: {
      width: '28px', height: '28px', position: 'relative',
    },
    logoText: {
      fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)',
      letterSpacing: '-0.02em',
    },
    logoAccent: { color: 'var(--blue-500)' },
    nav: {
      flex: 1, display: 'flex', flexDirection: 'column', gap: '2px',
      padding: '0 8px',
    },
    sectionLabel: {
      fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '16px 10px 6px',
    },
    footer: {
      padding: '12px 8px', borderTop: '1px solid var(--slate-100)',
      display: 'flex', flexDirection: 'column', gap: '2px',
    },
    userRow: {
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
    },
    avatar: {
      width: '30px', height: '30px', borderRadius: '999px',
      background: 'var(--blue-100)', color: 'var(--blue-600)',
      fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center',
      justifyContent: 'center',
    },
    userName: { fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)' },
    userEmail: { fontSize: '11px', color: 'var(--slate-400)' },
  };

  return React.createElement('aside', { style: sidebarStyles.root },
    /* Logo */
    React.createElement('div', { style: sidebarStyles.logoWrap },
      React.createElement('div', { style: sidebarStyles.logoIcon },
        React.createElement('div', { style: { position: 'absolute', width: 18, height: 22, borderRadius: 3, background: 'var(--blue-500)', opacity: 0.25, top: 2, left: 0 } }),
        React.createElement('div', { style: { position: 'absolute', width: 18, height: 22, borderRadius: 3, background: 'var(--blue-500)', opacity: 0.55, top: 4, left: 5 } }),
        React.createElement('div', { style: { position: 'absolute', width: 18, height: 22, borderRadius: 3, background: 'var(--blue-500)', top: 2, left: 10 } }),
      ),
      React.createElement('span', { style: sidebarStyles.logoText },
        'Study', React.createElement('span', { style: sidebarStyles.logoAccent }, 'Lab')
      )
    ),

    /* Search */
    React.createElement('div', { style: { padding: '0 8px 8px' } },
      React.createElement('div', { style: {
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
        background: 'var(--slate-50)', borderRadius: '6px', border: '1px solid var(--slate-200)',
        color: 'var(--slate-400)', fontSize: '13px', cursor: 'pointer',
      }},
        React.createElement(Icon, { name: 'search', size: 14 }),
        'Suchen...',
        React.createElement('span', { style: { marginLeft: 'auto', fontSize: '11px', color: 'var(--slate-300)', border: '1px solid var(--slate-200)', borderRadius: '4px', padding: '0 4px', lineHeight: '18px' } }, '⌘K')
      )
    ),

    /* Nav */
    React.createElement('nav', { style: sidebarStyles.nav },
      React.createElement('span', { style: sidebarStyles.sectionLabel }, 'Lernen'),
      navItems.map(item =>
        React.createElement(NavItem, {
          key: item.id, icon: item.icon, label: item.label,
          active: currentView === item.id,
          onClick: () => onNavigate(item.id),
        })
      )
    ),

    /* Footer */
    React.createElement('div', { style: sidebarStyles.footer },
      React.createElement(NavItem, { icon: 'settings', label: 'Einstellungen', onClick: () => {} }),
      React.createElement('div', { style: sidebarStyles.userRow },
        React.createElement('div', { style: sidebarStyles.avatar }, 'MK'),
        React.createElement('div', null,
          React.createElement('div', { style: sidebarStyles.userName }, 'Marie Koch'),
          React.createElement('div', { style: sidebarStyles.userEmail }, 'marie@uni-berlin.de')
        )
      )
    )
  );
}

Object.assign(window, { Sidebar });
