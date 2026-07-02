'use client';
import React from 'react';
import { I, IconProps } from './icons';

// ── useOutside ───────────────────────────────────────────────────────────────
export function useOutside(ref: React.RefObject<Element | null>, onClose: () => void) {
  React.useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
}

// ── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  bg?: string;
  color?: string;
  size?: number;
  border?: boolean;
  ringColor?: string;
}
export const Avatar = ({ initials, bg = 'rgba(46,151,68,0.25)', color = '#5AC472', size = 36, border = true, ringColor }: AvatarProps) => (
  <div className="avatar" style={{
    width: size, height: size,
    background: bg, color,
    fontSize: Math.round(size * 0.36),
    border: border ? `1px solid ${ringColor || color}` : 'none',
  }}>{initials}</div>
);

// ── CompleteBar ───────────────────────────────────────────────────────────────
export const CompleteBar = ({ pct }: { pct: number }) => {
  const col = pct < 50 ? '#C62828' : pct < 80 ? '#E65100' : '#2E9744';
  return (
    <div className="complete">
      <div className="bar"><div className="fill" style={{ width: pct + '%', background: col }} /></div>
      <span className="pct" style={{ color: pct < 50 ? '#FF8A7A' : pct < 80 ? '#FFB877' : '#7BCD8B' }}>{pct}%</span>
    </div>
  );
};

// ── StatusPill ────────────────────────────────────────────────────────────────
export const StatusPill = ({ statut }: { statut: string }) => {
  if (statut === 'actif') return (
    <span className="pill pill-green">
      <span style={{width:6,height:6,borderRadius:'50%',background:'#5AC472'}}/>Actif
    </span>
  );
  if (statut === 'inactif') return (
    <span className="pill pill-gray">
      <span style={{width:6,height:6,borderRadius:'50%',background:'#888'}}/>Inactif
    </span>
  );
  if (statut === 'en_attente') return (
    <span className="pill pill-orange pulse-orange" style={{cursor:'help'}}
      data-tip="Modification soumise — cliquez pour valider">
      <span style={{width:6,height:6,borderRadius:'50%',background:'#FF8A3D',display:'inline-block'}}/>En attente
    </span>
  );
  return null;
};

// ── NiveauPill ────────────────────────────────────────────────────────────────
export const NiveauPill = ({ niveau }: { niveau: string }) => {
  const map: Record<string, string> = { PAROISSE: 'pill-green', STATION: 'pill-orange', ANNEXE: 'pill-blue' };
  return <span className={'pill ' + (map[niveau] || 'pill-gray')}>{niveau}</span>;
};

// ── GpsCell ───────────────────────────────────────────────────────────────────
export const GpsCell = ({ ok }: { ok: boolean }) => ok
  ? <span className="pill pill-green" style={{padding:'2px 7px'}}><I.check size={10}/> GPS OK</span>
  : <span className="pill pill-red"   style={{padding:'2px 7px'}}><I.x size={10}/> Manquant</span>;

// ── Dropdown ──────────────────────────────────────────────────────────────────
interface DropdownProps {
  label?: string;
  value?: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number | string;
  disabled?: boolean;
}
export const Dropdown = ({ label, value, options, onChange, placeholder, width, disabled }: DropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', width: width || 'auto' }}>
      {label && <div className="label">{label}</div>}
      <button type="button" className="dropdown-btn" onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, background: 'rgba(255,255,255,0.05)',
          border: '1px solid ' + (open ? 'rgba(46,151,68,0.60)' : 'rgba(245,197,24,0.15)'),
          borderRadius: 6, padding: '9px 12px', color: value ? 'var(--text)' : 'rgba(240,244,241,0.40)',
          fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          textAlign: 'left', boxShadow: open ? '0 0 0 3px rgba(46,151,68,0.10)' : 'none',
          opacity: disabled ? 0.5 : 1,
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder || 'Sélectionner'}
        </span>
        <I.chevD size={14} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease', opacity: 0.7 }} />
      </button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 280, overflowY: 'auto' }}>
          {options.map((o, i) => (
            <button key={i} onClick={() => { onChange(o); setOpen(false); }}
              style={{ fontSize: 13, padding: '8px 10px', color: o === value ? '#5AC472' : 'var(--text)' }}>
              {o === value && <I.check size={12} />}
              <span style={{ marginLeft: o === value ? 0 : 18 }}>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SegButtons ────────────────────────────────────────────────────────────────
interface SegOption { value: string; label: string; }
export const SegButtons = ({ value, options, onChange }: { value: string; options: SegOption[]; onChange: (v: string) => void }) => (
  <div className="seg">
    {options.map(o => (
      <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

// ── Toggle ────────────────────────────────────────────────────────────────────
export const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <div className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} />
);

// ── TopCount ──────────────────────────────────────────────────────────────────
export const TopCount = ({ label, value, color = 'var(--text)' }: { label: string; value: string; color?: string }) => (
  <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
    <span className="sg" style={{ fontSize: 22, color }}>{value}</span>
  </div>
);

// ── Widget ────────────────────────────────────────────────────────────────────
interface WidgetProps { title: string; children: React.ReactNode; action?: React.ReactNode; }
export const Widget = ({ title, children, action }: WidgetProps) => (
  <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ── HorizontalBars ────────────────────────────────────────────────────────────
interface BarDatum { label: string; value: number; }
export const HorizontalBars = ({ data, max, formatVal }: { data: BarDatum[]; max?: number; formatVal?: (v: number) => string }) => {
  const m = max || Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', gap: 12, alignItems: 'center', fontSize: 12 }}>
          <div style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          <div style={{ position: 'relative', height: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
            <div data-tip={`${d.label} · ${formatVal ? formatVal(d.value) : d.value.toLocaleString('fr')}`} style={{
              position: 'absolute', inset: 0, width: ((d.value / m) * 100) + '%',
              background: 'linear-gradient(90deg, rgba(46,151,68,0.85), rgba(46,151,68,0.45))',
              borderRadius: 3, transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
              borderRight: '2px solid #2E9744',
            }} />
          </div>
          <div className="sg-md" style={{ fontSize: 14, color: 'var(--text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatVal ? formatVal(d.value) : d.value.toLocaleString('fr')}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Donut ─────────────────────────────────────────────────────────────────────
interface DonutSegment { count: number; color: string; }
export const Donut = ({ segments, total, label }: { segments: DonutSegment[]; total: number; label: string }) => {
  const r = 64, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
        {segments.map((s, i) => {
          const len = (s.count / total) * c;
          const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="22"
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-off}
            style={{ transition: 'stroke-dasharray 600ms ease' }} />;
          off += len;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div className="sg" style={{ fontSize: 26, lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
};

// ── StackedBars ───────────────────────────────────────────────────────────────
interface StackKey { key: string; color: string; }
export const StackedBars = ({ data, keys }: { data: Record<string, string|number>[]; keys: StackKey[] }) => {
  const max = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k.key] as number), 0)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 200, padding: '8px 0 0' }}>
      {data.map((d, i) => {
        const total = keys.reduce((s, k) => s + (d[k.key] as number), 0);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', height: (total / max) * 170, borderRadius: 3, overflow: 'hidden' }}
              data-tip={`${d.name} · ${total} paroisses`}>
              {keys.map(k => (
                <div key={k.key} style={{ background: k.color, height: ((d[k.key] as number) / total) * 100 + '%' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name as string}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── LineChart ─────────────────────────────────────────────────────────────────
interface LinePoint { year: number; comm: number; noncomm: number; }
export const LineChart = ({ data, width = 480, height = 200 }: { data: LinePoint[]; width?: number; height?: number }) => {
  if (!data.length) return <svg width={width} height={height} style={{ width: '100%', height, display: 'block' }} />;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
  const all = data.flatMap(d => [d.comm, d.noncomm]);
  const rawMax = all.length ? Math.max(...all) : 0;
  const yMax = rawMax > 0 ? rawMax * 1.1 : 1;   // évite yMax=0 → division par zéro
  const yMin = 0;
  const xs = data.map((_, i) =>
    pad.l + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2)
  );
  const yScale = (v: number) => pad.t + h - ((v - yMin) / (yMax - yMin)) * h;
  const path = (key: 'comm'|'noncomm') => data.map((d, i) => (i === 0 ? 'M' : 'L') + xs[i] + ',' + yScale(d[key])).join(' ');
  const area = data.map((d, i) => (i === 0 ? 'M' : 'L') + xs[i] + ',' + yScale(d.comm)).join(' ') + ` L${pad.l + w},${pad.t + h} L${pad.l},${pad.t + h} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => yMin + (yMax - yMin) * t);
  return (
    <svg width={width} height={height} style={{ width: '100%', height, display: 'block' }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={pad.l + w} y1={yScale(t)} y2={yScale(t)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
          <text x={pad.l - 6} y={yScale(t) + 3} fill="rgba(240,244,241,0.40)" fontSize="10" textAnchor="end">{Math.round(t / 1000)}k</text>
        </g>
      ))}
      <path d={area} fill="rgba(46,151,68,0.10)" />
      <path d={path('noncomm')} fill="none" stroke="rgba(240,244,241,0.45)" strokeWidth="1.5" />
      <path d={path('comm')} fill="none" stroke="#2E9744" strokeWidth="2" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={yScale(d.comm)} r="3" fill="#2E9744" stroke="#0D1B12" strokeWidth="2" />
          <text x={xs[i]} y={pad.t + h + 16} fill="rgba(240,244,241,0.45)" fontSize="10" textAnchor="middle">{d.year}</text>
        </g>
      ))}
    </svg>
  );
};
