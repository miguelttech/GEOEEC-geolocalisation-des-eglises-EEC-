import React from 'react';

export const PATHS: Record<string, React.ReactNode> = {
  search:       <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>,
  close:        <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>,
  chevron:      <path d="M9 18l6-6-6-6"/>,
  chevronD:     <path d="M6 9l6 6 6-6"/>,
  chevronL:     <path d="M15 18l-6-6 6-6"/>,
  pin:          <><path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>,
  pinFilled:    <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13zm0-11.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"/>,
  filter:       <><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></>,
  filterFunnel: <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  layers:       <><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/></>,
  history:      <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12a9 9 0 0 1 16-5.7"/><path d="M19 4v3h-3"/></>,
  bookmark:     <path d="M6 4v16l6-4 6 4V4z"/>,
  star:         <path d="M12 3l2.6 6 6.4.6-4.8 4.4 1.4 6.4L12 17l-5.6 3.4 1.4-6.4L3 9.6l6.4-.6L12 3z"/>,
  starFilled:   <path d="M12 3l2.6 6 6.4.6-4.8 4.4 1.4 6.4L12 17l-5.6 3.4 1.4-6.4L3 9.6l6.4-.6L12 3z"/>,
  share:        <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 11l6-4"/><path d="M9 13l6 4"/></>,
  route:        <><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17V8a3 3 0 0 1 3-3h6"/><path d="M18 7v9a3 3 0 0 1-3 3H9"/></>,
  car:          <><path d="M5 13l1.6-3.8A2 2 0 0 1 8.4 8h7.2a2 2 0 0 1 1.8 1.2L19 13"/><path d="M4 13h16v4h-2"/><path d="M6 17H4v-4"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/><path d="M9 17h6"/></>,
  bike:         <><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l3.5-6h5l-2.5 6"/><path d="M9.5 11l2 6"/><circle cx="15" cy="6" r="1"/><path d="M14 7l-2 4"/></>,
  walk:         <><circle cx="13" cy="4.5" r="1.8"/><path d="M13 8l-2 4 2 2 1 5"/><path d="M11 12l-3 1"/><path d="M11 21l1.5-4"/><path d="M14 11l3 1.5"/></>,
  crosshair:    <><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2.5"/></>,
  swap:         <><path d="M7 4v16"/><path d="M4 7l3-3 3 3"/><path d="M17 20V4"/><path d="M20 17l-3 3-3-3"/></>,
  ruler:        <><path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7 9l2 2"/><path d="M10 6l2 2"/><path d="M13 12l2 2"/><path d="M16 9l2 2"/></>,
  navStart:     <><path d="M3 11l18-8-8 18-2-8z"/></>,
  navArrow:     <><path d="M12 2l7 19-7-5-7 5z"/></>,
  wa:           <><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M8.8 7.6c.3 0 .6.2.7.5l.7 1.6c.1.3 0 .6-.2.8l-.5.5c.7 1.4 1.6 2.3 3 3l.5-.6c.2-.2.5-.3.8-.2l1.6.7c.3.1.5.4.5.7 0 1.3-1.1 2-2.3 1.7-3.3-.8-5.6-3.2-6.3-6.3-.2-1 .4-2.1 1.5-2.1z"/></>,
  tg:           <><path d="M21.5 4.3L2.8 11.2c-.6.2-.6 1 0 1.2l4.6 1.5L20 6.3c.3-.2.6.2.4.4l-9.5 8.6v3.3c0 .5.6.7.9.3l2.6-2.8 4.7 3.5c.4.3 1 .1 1.1-.4l3-13.9c.1-.6-.4-1-.9-.8z"/></>,
  near:         <><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></>,
  home:         <><path d="M3 12l9-9 9 9"/><path d="M5 10v11h14V10"/></>,
  expand:       <><path d="M3 9V3h6"/><path d="M21 9V3h-6"/><path d="M3 15v6h6"/><path d="M21 15v6h-6"/></>,
  compress:     <><path d="M9 3v6H3"/><path d="M15 3v6h6"/><path d="M9 21v-6H3"/><path d="M15 21v-6h6"/></>,
  lock:         <><rect x="4" y="11" width="16" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  map:          <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></>,
  list:         <><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></>,
  copy:         <><rect x="8" y="8" width="13" height="13" rx="1.5"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  extLink:      <><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></>,
  cross:        <><path d="M12 3v18"/><path d="M5 9h14"/></>,
  grad:         <><path d="M3 9l9-4 9 4-9 4-9-4z"/><path d="M7 11v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/></>,
  medical:      <><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"/></>,
  book:         <><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z"/><path d="M4 5v14"/><path d="M8 7h6"/><path d="M8 11h4"/></>,
  leaf:         <><path d="M5 21c0-9 7-16 16-16-1 9-7 16-16 16z"/><path d="M5 21c4-4 8-8 16-16"/></>,
  bldg:         <><rect x="4" y="3" width="16" height="18"/><path d="M9 7h.01M14 7h.01M9 11h.01M14 11h.01M9 15h.01M14 15h.01"/></>,
  land:         <><path d="M3 19l5-7 4 5 3-3 6 5"/><path d="M3 5h18"/><path d="M3 5v14h18V5"/></>,
  sat:          <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>,
  region:       <><path d="M5 3l4 2 6-2 4 2v16l-4-2-6 2-4-2z"/></>,
  shield:       <><path d="M12 2l9 4v7c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/></>,
  user:         <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>,
  users:        <><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M14 19c0-2 2-4 3-4s3 1 4 3"/></>,
  stat:         <><path d="M4 20V8"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/></>,
  bell:         <><path d="M18 16a2 2 0 0 0 2-2v-3a8 8 0 0 0-16 0v3a2 2 0 0 0 2 2h12z"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
  help:         <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2.2-2.5 4M12 17h.01"/></>,
  phone:        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
  clock:        <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  globe:        <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>,
  download:     <><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></>,
  more:         <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  arrowRight:   <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
  trend:        <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
  refresh:      <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 20v-4h4"/></>,
  sun:          <><circle cx="12" cy="12" r="4"/><path d="M12 3v1.5"/><path d="M12 19.5V21"/><path d="M3 12h1.5"/><path d="M19.5 12H21"/><path d="M5.6 5.6l1.05 1.05"/><path d="M17.35 17.35L18.4 18.4"/><path d="M5.6 18.4l1.05-1.05"/><path d="M17.35 6.65L18.4 5.6"/></>,
  moon:         <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>,
  mic:          <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/><path d="M8 21h8"/></>,
  check:        <path d="M5 12l4 4 10-10"/>,
  routePath:    <><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8v4a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4"/></>,
  trail:        <><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="9" r="1.5"/><circle cx="18" cy="13" r="1.5"/><circle cx="14" cy="18" r="1.5"/><path d="M6 6l6 3 6 4-4 5" strokeDasharray="2,3"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  church:       <><path d="M12 3v4"/><path d="M10 5h4"/><path d="M5 22V11l7-4 7 4v11"/><path d="M5 22h14"/><path d="M10 22v-5h4v5"/></>,
  hospital:     <><rect x="4" y="6" width="16" height="14" rx="1"/><path d="M12 9v8"/><path d="M8 13h8"/></>,
  graduation:   <><path d="M3 9l9-4 9 4-9 4-9-4z"/><path d="M7 11v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/><path d="M21 9v6"/></>,
  university:   <><path d="M3 10l9-5 9 5-9 5-9-5z"/><path d="M5 11v6h14v-6"/><path d="M3 19h18"/></>,
  buildings:    <><rect x="3" y="9" width="8" height="12"/><rect x="13" y="3" width="8" height="18"/><path d="M16 7h2M16 11h2M16 15h2M16 19h2"/><path d="M5 13h2M5 17h2"/></>,
  fields:       <><path d="M3 18h18"/><path d="M5 18V8"/><path d="M9 18V5"/><path d="M13 18V8"/><path d="M17 18V5"/><path d="M21 18V8"/></>,
  pickaxe:      <path d="M3 20l5-5 4 4-5 5z"/>,
  flag:         <><path d="M5 21V4l8 3 8-3v11l-8 3-8-3z"/></>,
  directions:   <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z" fill="currentColor" stroke="none"/>,
  compass:      <><circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  network:      <><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7.2v3.8"/><path d="M10.8 11l-4 5.8"/><path d="M13.2 11l4 5.8"/></>,
  briefcase:    <><rect x="2" y="8" width="20" height="13" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="14" x2="22" y2="14"/></>,
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}

export const Icon = ({ name, size = 18, color = 'currentColor', stroke = 1.7, fill = 'none' }: IconProps) => {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
         stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {p}
    </svg>
  );
};

export const TYPE_ICON: Record<string, string> = {
  paroisse: 'church', scolaire: 'graduation', medical: 'hospital',
  univ: 'university', agro: 'leaf', immeuble: 'buildings', terrain: 'fields',
};

export function markerSvg(type: string, color: string, sel: boolean): string {
  const ringStroke = sel ? '#FFD600' : '#ffffff';
  const ringFill = color;
  const glyphColor = '#ffffff';
  const size = sel ? 36 : 30;
  let glyph = '';
  switch (type) {
    case 'paroisse':
      glyph = `<path d="M12 5.5v13M6 12h12" stroke="${glyphColor}" stroke-width="2.4" stroke-linecap="round"/>`; break;
    case 'scolaire':
      glyph = `<path d="M4 10l8-3.5L20 10l-8 3.5L4 10z" fill="${glyphColor}"/><path d="M8 12v3c0 1 2 2 4 2s4-1 4-2v-3" stroke="${glyphColor}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; break;
    case 'medical':
      glyph = `<rect x="10.5" y="6" width="3" height="12" fill="${glyphColor}"/><rect x="6" y="10.5" width="12" height="3" fill="${glyphColor}"/>`; break;
    case 'univ':
      glyph = `<path d="M5 6a2 2 0 0 1 2-2h11v16H7a2 2 0 0 1-2-2V6z" fill="${glyphColor}"/><path d="M5 6v14" stroke="${color}" stroke-width="1.2"/>`; break;
    case 'agro':
      glyph = `<path d="M6 18C6 11 11 6 18 6c-1 7-5 12-12 12z" fill="${glyphColor}"/>`; break;
    case 'immeuble':
      glyph = `<rect x="7" y="5" width="10" height="14" fill="${glyphColor}"/><rect x="9" y="7" width="2" height="2" fill="${color}"/><rect x="13" y="7" width="2" height="2" fill="${color}"/><rect x="9" y="11" width="2" height="2" fill="${color}"/><rect x="13" y="11" width="2" height="2" fill="${color}"/><rect x="11" y="15" width="2" height="4" fill="${color}"/>`; break;
    case 'terrain':
      glyph = `<path d="M4 18l5-7 4 5 3-3 4 5z" fill="${glyphColor}"/>`; break;
  }
  return `<div class="marker-pop"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 24 28"><path d="M12 0C5.4 0 0 5 0 11.2c0 8 12 16.8 12 16.8s12-8.8 12-16.8C24 5 18.6 0 12 0z" fill="${ringFill}" stroke="${ringStroke}" stroke-width="${sel ? 2.4 : 1.6}"/>${glyph}</svg></div>`;
}
