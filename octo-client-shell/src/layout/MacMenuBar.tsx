import { useState, useEffect } from 'react';

// On macOS, -apple-system resolves to SF Pro which includes \uF8FF (Apple logo).
// On other platforms this renders as a blank — acceptable for a macOS demo.
const APPLE_CHAR = '\uF8FF';

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

function formatTime(): string {
  const d = new Date();
  const weekday = d.toLocaleString('en-US', { weekday: 'short' });
  const month   = d.toLocaleString('en-US', { month: 'short' });
  const day     = d.getDate();
  const time    = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${weekday} ${month} ${day}  ${time}`;
}

// ── SF Symbol–accurate SVG icons ────────────────────────────────────────────

function WiFiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
      <circle cx="8" cy="11" r="1.4" fill="currentColor" />
      <path d="M4.93 7.93a4.35 4.35 0 0 1 6.14 0" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M2.22 5.22a7.5 7.5 0 0 1 11.56 0"  stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M0 2.5A10.65 10.65 0 0 1 16 2.5"   stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function SpotlightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="5.8" cy="5.8" r="4.15" stroke="currentColor" strokeWidth="1.35" />
      <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

// Control Center — concentric half-arcs (matches macOS icon)
function ControlCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8" width="5" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

// Screen sharing / AirPlay Display icon
function DisplayIcon() {
  return (
    <svg width="17" height="13" viewBox="0 0 17 13" fill="none" aria-hidden>
      <rect x="0.68" y="0.68" width="15.64" height="9.64" rx="1.6" stroke="currentColor" strokeWidth="1.35" />
      <path d="M5.5 12.5h6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M8.5 10.3v2.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

// ── Menu items ───────────────────────────────────────────────────────────────

const MENU_ITEMS = ['文件', '编辑', '视图', '窗口', '帮助'];

// ── Component ────────────────────────────────────────────────────────────────

export function MacMenuBar() {
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    // Refresh on the next whole minute, then every minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const t1 = setTimeout(() => {
      setTime(formatTime());
      const id = setInterval(() => setTime(formatTime()), 60_000);
      return () => clearInterval(id);
    }, msUntilNextMinute);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] select-none"
      style={{ height: 28, fontFamily: SF }}
    >
      {/* Pure backdrop blur — no fill */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      />

      {/* Content row */}
      <div className="relative flex items-center justify-between h-full px-[10px]">

        {/* ── Left: Apple + app name + menu items ── */}
        <div className="flex items-center">

          {/* Apple logo — renders as  on macOS system font */}
          <div
            className="w-[33px] h-[24px] flex items-center justify-center rounded-[4px]"
            style={{ fontSize: 16, color: 'rgba(0,0,0,0.88)', lineHeight: 1 }}
          >
            {APPLE_CHAR}
          </div>

          {/* App name — bold 700 */}
          <span
            className="px-[11px] py-[4px] text-[12px] leading-[16px] text-[rgba(25,25,25,0.9)]"
            style={{ fontWeight: 700 }}
          >
            Octo AI
          </span>

          {/* Menu items — semibold 590 */}
          {MENU_ITEMS.map((item) => (
            <span
              key={item}
              className="px-[11px] py-[4px] text-[12px] leading-[16px] text-[rgba(25,25,25,0.82)] rounded-[4px] cursor-default hover:bg-black/[0.08] transition-colors"
              style={{ fontWeight: 590 }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* ── Right: status icons + clock ── */}
        <div className="flex items-center" style={{ color: 'rgba(0,0,0,0.80)' }}>

          <div className="px-[8px] flex items-center"><WiFiIcon /></div>
          <div className="px-[8px] flex items-center"><SpotlightIcon /></div>
          <div className="px-[8px] flex items-center"><ControlCenterIcon /></div>
          <div className="px-[8px] flex items-center"><DisplayIcon /></div>

          {/* Clock — semibold 590, same as Figma */}
          <span
            className="px-[11px] py-[4px] text-[12px] leading-[16px] cursor-default"
            style={{ fontWeight: 590, color: 'rgba(0,0,0,0.82)' }}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
