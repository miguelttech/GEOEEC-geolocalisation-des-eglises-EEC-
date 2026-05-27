'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

interface IcoProps {
  d: React.ReactNode;
  size?: number;
  fill?: string;
  stroke?: number;
  viewBox?: string;
  style?: React.CSSProperties;
}

const Ico = ({ d, size = 18, fill, stroke = 1.5, viewBox = '0 0 24 24', style }: IcoProps) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill || 'none'} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

export const I: Record<string, (p: IconProps) => React.ReactElement> = {
  dashboard: (p) => <Ico {...p} d={<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>} />,
  map: (p) => <Ico {...p} d={<><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>} />,
  church: (p) => <Ico {...p} d={<><path d="M12 3v18M9 6h6M5 21V11l7-4 7 4v10M5 21h14"/></>} />,
  building: (p) => <Ico {...p} d={<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/></>} />,
  user: (p) => <Ico {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>} />,
  compass: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></>} />,
  network: (p) => <Ico {...p} d={<><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-5 6M12 11l5 6"/></>} />,
  chart: (p) => <Ico {...p} d={<><path d="M3 21h18"/><rect x="5" y="11" width="3" height="8"/><rect x="10" y="6" width="3" height="13"/><rect x="15" y="14" width="3" height="5"/></>} />,
  swap: (p) => <Ico {...p} d={<><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></>} />,
  users: (p) => <Ico {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="9" r="2.5"/><path d="M14 16c2 0 8 1 8 4"/></>} />,
  list: (p) => <Ico {...p} d={<><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></>} />,
  gear: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>} />,
  logout: (p) => <Ico {...p} d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>} />,
  bell: (p) => <Ico {...p} d={<><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 004 0"/></>} />,
  chevD: (p) => <Ico {...p} d="M6 9l6 6 6-6" />,
  chevR: (p) => <Ico {...p} d="M9 6l6 6-6 6" />,
  chevL: (p) => <Ico {...p} d="M15 6l-6 6 6 6" />,
  chevU: (p) => <Ico {...p} d="M6 15l6-6 6 6" />,
  search: (p) => <Ico {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>} />,
  plus: (p) => <Ico {...p} d="M12 5v14M5 12h14" />,
  filter: (p) => <Ico {...p} d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
  up: (p) => <Ico {...p} d="M12 19V5M5 12l7-7 7 7" />,
  down: (p) => <Ico {...p} d="M12 5v14M5 12l7 7 7-7" />,
  upload: (p) => <Ico {...p} d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></>} />,
  download: (p) => <Ico {...p} d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></>} />,
  eye: (p) => <Ico {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  pencil: (p) => <Ico {...p} d={<><path d="M17 3l4 4-11 11H6v-4L17 3z"/></>} />,
  more: (p) => <Ico {...p} d={<><circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/></>} />,
  trash: (p) => <Ico {...p} d={<><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></>} />,
  check: (p) => <Ico {...p} d="M4 12l5 5L20 6" />,
  x: (p) => <Ico {...p} d="M6 6l12 12M18 6L6 18" />,
  alert: (p) => <Ico {...p} d={<><path d="M12 2L1 21h22L12 2zM12 9v5M12 18v.5"/></>} />,
  info: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/></>} />,
  pin: (p) => <Ico {...p} d={<><path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>} />,
  briefcase: (p) => <Ico {...p} d={<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4a2 2 0 012-2h4a2 2 0 012 2v3M3 13h18"/></>} />,
  shield: (p) => <Ico {...p} d={<><path d="M12 2l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></>} />,
  star: (p) => <Ico {...p} d="M12 2l3 7 8 .8-6 5.4 1.9 7.8L12 18.6 5.1 23l1.9-7.8L1 9.8 9 9l3-7z" />,
  imageIco: (p) => <Ico {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-9 9"/></>} />,
  refresh: (p) => <Ico {...p} d={<><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></>} />,
  copy: (p) => <Ico {...p} d={<><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></>} />,
  link: (p) => <Ico {...p} d={<><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></>} />,
  history: (p) => <Ico {...p} d={<><path d="M3 12a9 9 0 109-9c-2.5 0-4.8 1-6.4 2.7L3 8"/><path d="M3 4v4h4M12 7v5l3 2"/></>} />,
  lock: (p) => <Ico {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>} />,
  unlock: (p) => <Ico {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/></>} />,
  cross: (p) => <Ico {...p} d="M12 3v18M7 8h10" />,
  globe: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 4 6.5 4 9s-1.5 6-4 9c-2.5-3-4-6.5-4-9s1.5-6 4-9z"/></>} />,
  bolt: (p) => <Ico {...p} d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  calendar: (p) => <Ico {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>} />,
  hexagon: (p) => <Ico {...p} d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />,
  squares: (p) => <Ico {...p} d={<><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>} />,
  send: (p) => <Ico {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  key: (p) => <Ico {...p} d={<><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></>} />,
  qr: (p) => <Ico {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 18v3M17 21h4"/></>} />,
  device: (p) => <Ico {...p} d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M11 18h2"/></>} />,
  monitor: (p) => <Ico {...p} d={<><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>} />,
  sun: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4"/></>} />,
  moon: (p) => <Ico {...p} d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z" />,
  externLink: (p) => <Ico {...p} d={<><path d="M14 3h7v7M21 3l-9 9"/><path d="M19 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6"/></>} />,
};
