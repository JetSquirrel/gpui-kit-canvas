/** The app mark: a desktop window with a sidebar, which is the shell this tool sketches. */
export function Logo({ size = 32, color, glyph = "#FFFFFF" }: { size?: number; color: string; glyph?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 144 144" aria-hidden="true" style={{ display: "block", flex: "0 0 auto" }}>
      <rect x="4" y="4" width="136" height="136" rx="30" fill={color} />
      <rect x="26" y="34" width="92" height="76" rx="10" fill={glyph} />
      <path d="M26 44a10 10 0 0 1 10-10h72a10 10 0 0 1 10 10v8H26z" fill={color} fillOpacity="0.22" />
      <circle cx="38" cy="43" r="3.2" fill={color} fillOpacity="0.55" />
      <circle cx="48" cy="43" r="3.2" fill={color} fillOpacity="0.55" />
      <circle cx="58" cy="43" r="3.2" fill={color} fillOpacity="0.55" />
      <path d="M26 52h30v48a10 10 0 0 1-10 10h-10a10 10 0 0 1-10-10z" fill={color} fillOpacity="0.22" />
      <rect x="33" y="60" width="16" height="4" rx="2" fill={color} fillOpacity="0.5" />
      <rect x="33" y="70" width="16" height="4" rx="2" fill={color} fillOpacity="0.5" />
      <rect x="33" y="80" width="16" height="4" rx="2" fill={color} fillOpacity="0.5" />
      <rect x="64" y="62" width="46" height="5" rx="2.5" fill={color} fillOpacity="0.42" />
      <rect x="64" y="74" width="46" height="5" rx="2.5" fill={color} fillOpacity="0.26" />
      <rect x="64" y="86" width="30" height="5" rx="2.5" fill={color} fillOpacity="0.26" />
    </svg>
  );
}
