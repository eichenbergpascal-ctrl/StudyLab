/* StudyLab UI Kit — Shared Components */
/* global React */

const SL_ICONS = {
  grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  checkSquare: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  fileText: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  alertCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  trendingUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  upload: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  rotateCcw: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`,
  panelLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
};

function Icon({ name, size = 18, className = '' }) {
  const svg = SL_ICONS[name];
  if (!svg) return null;
  const sized = svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
  return React.createElement('span', {
    className: `sl-icon ${className}`,
    dangerouslySetInnerHTML: { __html: sized },
    style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  });
}

/* ─── Button ─── */
function Button({ children, variant = 'primary', size = 'md', icon, onClick, style = {}, disabled }) {
  const base = {
    fontFamily: 'var(--font-sans)', fontWeight: 500, border: 'none', cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
    borderRadius: 'var(--radius-sm)', transition: 'all 150ms var(--ease-default)',
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = {
    sm: { fontSize: '13px', padding: '5px 12px' },
    md: { fontSize: '14px', padding: '8px 16px' },
    lg: { fontSize: '15px', padding: '10px 20px' },
  };
  const variants = {
    primary: { background: 'var(--blue-500)', color: '#fff' },
    secondary: { background: 'var(--slate-100)', color: 'var(--slate-700)', border: '1px solid var(--slate-200)' },
    ghost: { background: 'transparent', color: 'var(--slate-600)' },
    destructive: { background: 'var(--red-500)', color: '#fff' },
    success: { background: 'var(--green-500)', color: '#fff' },
  };
  return React.createElement('button', {
    onClick, disabled,
    style: { ...base, ...sizes[size], ...variants[variant], ...style }
  }, icon && React.createElement(Icon, { name: icon, size: size === 'sm' ? 14 : 16 }), children);
}

/* ─── Badge ─── */
function Badge({ children, color = 'slate' }) {
  const colors = {
    blue:  { bg: 'var(--blue-100)',  fg: 'var(--blue-700)' },
    green: { bg: 'var(--green-100)', fg: 'var(--green-700)' },
    amber: { bg: 'var(--amber-100)', fg: 'var(--amber-700)' },
    red:   { bg: 'var(--red-100)',   fg: 'var(--red-700)' },
    slate: { bg: 'var(--slate-100)', fg: 'var(--slate-600)' },
  };
  const c = colors[color] || colors.slate;
  return React.createElement('span', {
    style: { fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', background: c.bg, color: c.fg, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }
  }, children);
}

/* ─── Card ─── */
function Card({ children, style = {}, onClick, className = '' }) {
  return React.createElement('div', {
    onClick,
    className,
    style: { background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'var(--font-sans)', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 150ms', ...style }
  }, children);
}

/* ─── ProgressBar ─── */
function ProgressBar({ value = 0, color = 'var(--blue-500)', height = 6, style = {} }) {
  return React.createElement('div', {
    style: { height: `${height}px`, background: 'var(--slate-100)', borderRadius: '999px', overflow: 'hidden', ...style }
  }, React.createElement('div', {
    style: { height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: '999px', transition: 'width 400ms var(--ease-out)' }
  }));
}

/* ─── StatCard ─── */
function StatCard({ label, value, sub, color = 'var(--blue-500)', progress }) {
  return React.createElement(Card, { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
    React.createElement('span', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--slate-500)' } }, label),
    React.createElement('span', { style: { fontSize: '28px', fontWeight: 700, color: 'var(--slate-900)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 } }, value),
    sub && React.createElement('span', { style: { fontSize: '12px', color: 'var(--slate-400)' } }, sub),
    progress !== undefined && React.createElement(ProgressBar, { value: progress, color, style: { marginTop: '4px' } })
  );
}

/* ─── Ring (circular progress) ─── */
function ProgressRing({ value = 0, size = 48, strokeWidth = 4, color = 'var(--blue-500)' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return React.createElement('div', { style: { position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } },
    React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      React.createElement('circle', { cx: size/2, cy: size/2, r, stroke: 'var(--slate-100)', strokeWidth, fill: 'none' }),
      React.createElement('circle', { cx: size/2, cy: size/2, r, stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeDasharray: circ, strokeDashoffset: offset, transform: `rotate(-90 ${size/2} ${size/2})`, style: { transition: 'stroke-dashoffset 400ms var(--ease-out)' } })
    ),
    React.createElement('span', { style: { position: 'absolute', fontSize: '12px', fontWeight: 700, color: 'var(--slate-800)', fontFamily: 'var(--font-sans)' } }, `${Math.round(value)}%`)
  );
}

/* ─── NavItem ─── */
function NavItem({ icon, label, active, onClick }) {
  return React.createElement('button', {
    onClick,
    style: {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', width: '100%',
      fontSize: '13px', fontWeight: active ? 600 : 500, fontFamily: 'var(--font-sans)',
      color: active ? 'var(--blue-600)' : 'var(--slate-600)', background: active ? 'var(--blue-50)' : 'transparent',
      borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
      transition: 'all 120ms var(--ease-default)',
    }
  }, React.createElement(Icon, { name: icon, size: 16 }), label);
}

/* ─── Export ─── */
Object.assign(window, {
  Icon, Button, Badge, Card, ProgressBar, StatCard, ProgressRing, NavItem, SL_ICONS
});
