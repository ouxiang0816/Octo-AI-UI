import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles, X, ChevronDown, ChevronRight,
} from 'lucide-react';

// ── Thinking-o 1 icon (inline SVG, replacing lucide icons) ────────────────────
const ThinkingIcon = ({ spinning }: { spinning: boolean }) => (
  <motion.svg
    width="12" height="12" viewBox="0 0 12 12" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={spinning ? { rotate: 360 } : { rotate: 0 }}
    transition={spinning
      ? { duration: 3, repeat: Infinity, ease: 'linear' }
      : { duration: 0.3 }
    }
    style={{ flexShrink: 0 }}
  >
    <g clipPath="url(#clip-thinking-icon)">
      <path d="M10.7964 1.20375C11.6657 2.073 11.2427 3.99 9.89641 6C11.2434 8.01 11.6657 9.927 10.7964 10.7963C9.92716 11.6655 8.01016 11.2433 6.00091 9.897C3.99016 11.2425 2.07316 11.6655 1.20391 10.7963C0.33466 9.927 0.75691 8.01 2.10316 6.00075C0.75691 3.99 0.33466 2.073 1.20391 1.20375C2.07316 0.334505 3.99016 0.756755 6.00016 2.10375C8.01016 0.756755 9.92716 0.334505 10.7964 1.20375ZM2.57416 6.65775L2.49391 6.786C1.49191 8.41875 1.26166 9.7875 1.73641 10.2638C2.22391 10.7513 3.65416 10.4955 5.34316 9.426C4.82356 9.0276 4.33098 8.59515 3.86866 8.1315C3.40509 7.66964 2.97265 7.17756 2.57416 6.6585V6.65775ZM9.42541 6.65775L9.21991 6.92025C8.87938 7.34343 8.5161 7.74778 8.13166 8.1315C7.66953 8.59484 7.1772 9.02704 6.65791 9.42525C8.34616 10.4955 9.77566 10.7513 10.2639 10.2638C10.7514 9.77625 10.4964 8.346 9.42541 6.65775ZM6.00016 3.0255L5.79691 3.1755C5.3054 3.55307 4.83938 3.96271 4.40191 4.40175C3.95256 4.84964 3.5341 5.32749 3.14941 5.832L3.02491 5.99925L3.15016 6.168C3.44641 6.558 3.77491 6.94425 4.12966 7.32L4.40266 7.59825C4.85055 8.04761 5.32839 8.46607 5.83291 8.85075L6.00016 8.9745L6.16891 8.85075C6.57049 8.54524 6.95506 8.218 7.32091 7.8705L7.59916 7.599C8.04854 7.15088 8.467 6.67278 8.85166 6.168L8.97466 6L8.85091 5.83275C8.5454 5.43117 8.21816 5.0466 7.87066 4.68075L7.59916 4.4025C7.15102 3.95314 6.67292 3.53468 6.16816 3.15L6.00016 3.02475V3.0255ZM6.00016 5.24625C6.20007 5.24625 6.39179 5.32567 6.53314 5.46702C6.6745 5.60838 6.75391 5.8001 6.75391 6C6.75391 6.19991 6.6745 6.39163 6.53314 6.53299C6.39179 6.67434 6.20007 6.75375 6.00016 6.75375C5.80025 6.75375 5.60853 6.67434 5.46718 6.53299C5.32582 6.39163 5.24641 6.19991 5.24641 6C5.24641 5.8001 5.32582 5.60838 5.46718 5.46702C5.60853 5.32567 5.80025 5.24625 6.00016 5.24625ZM1.73791 1.73625C1.25041 2.22375 1.50616 3.654 2.57566 5.343C2.97407 4.82341 3.40652 4.33083 3.87016 3.8685C4.33202 3.40494 4.8241 2.97249 5.34316 2.574C3.65416 1.50375 2.22466 1.24875 1.73716 1.73625H1.73791ZM6.78766 2.49375L6.66016 2.57475C7.17947 2.97267 7.67156 3.40488 8.13316 3.8685C8.59649 4.33063 9.02869 4.82296 9.42691 5.34225C10.4972 3.654 10.7529 2.2245 10.2654 1.73625C9.79066 1.2615 8.42041 1.49175 6.78766 2.49375Z" fill="#7E7A75"/>
    </g>
    <defs>
      <clipPath id="clip-thinking-icon">
        <rect width="12" height="12" fill="white"/>
      </clipPath>
    </defs>
  </motion.svg>
);

// ── Animated trailing dots: . → .. → ... → . → … ─────────────────────────────
const AnimatedDots = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = window.setInterval(() => setCount(c => c >= 3 ? 1 : c + 1), 500);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span aria-hidden>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className="transition-opacity duration-300"
          style={{ opacity: i <= count ? 1 : 0 }}
        >.</span>
      ))}
    </span>
  );
};

export interface AIAssistantAssetItem {
  id: string;
  title: string;
  subtitle: string;
  score?: number;
  thumbnail?: React.ReactNode;
  onClick?: () => void;
}

export interface AIAssistantAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'primary' | 'success';
}

export interface AIAssistantPanelProps {
  title: string;
  subtitle?: string;
  userMessage?: string;
  userMessageNode?: React.ReactNode;
  onClose: () => void;
  thinking: {
    lines: string[];
    visibleCount: number;
    isDone: boolean;
    elapsedSec: number;
    keywords?: string[];
    runningLabel?: string;
    doneLabel?: (elapsedSec: number) => string;
    collapseOnDone?: boolean;
  };
  summary?: React.ReactNode;
  assets?: AIAssistantAssetItem[];
  resultLabel?: string;
  emptyState?: React.ReactNode;
  extraContent?: React.ReactNode;
  actions?: AIAssistantAction[];
  footerSlot?: React.ReactNode;
  className?: string;
}

const AssetThumb = ({ score = 0 }: { score?: number }) => {
  const dotColor = score >= 90 ? '#3b82f6' : score >= 80 ? '#0d9488' : '#9ca3af';
  return (
    <div className="w-[64px] h-[46px] rounded-[8px] bg-[#1e2330] shrink-0 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 12px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 20px)',
        }}
      />
      <div className="absolute bg-[#374151] flex items-center justify-center left-[18px] px-[4px] rounded-[4px] top-[15px] w-[28px] h-[16px]">
        <div className="bg-[#6b7280] h-[4px] rounded-full w-[20px]" />
      </div>
      <div className="absolute left-[52px] top-[36px] rounded-full w-[6px] h-[6px]" style={{ backgroundColor: dotColor }} />
    </div>
  );
};

export const ThinkingBlock = ({
  lines,
  visibleCount,
  isDone,
  elapsedSec,
  keywords,
  runningLabel = '思考中',
  doneLabel,
  collapseOnDone = true,
}: AIAssistantPanelProps['thinking']) => {
  const [expanded, setExpanded] = useState(true);
  const userExpandedRef = useRef(false);
  const typingTimerRef = useRef<number | null>(null);
  const typedLengthsRef = useRef<number[]>([]);
  const [typedLengths, setTypedLengths] = useState<number[]>(() => lines.map(() => 0));

  useEffect(() => {
    if (!isDone) {
      userExpandedRef.current = false;
      setExpanded(true);
    }
  }, [isDone]);

  useEffect(() => {
    const reset = lines.map(() => 0);
    typedLengthsRef.current = reset;
    setTypedLengths(reset);
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [lines]);

  useEffect(() => {
    if (!isDone || !collapseOnDone || userExpandedRef.current) return;
    const timer = window.setTimeout(() => setExpanded(false), 600);
    return () => window.clearTimeout(timer);
  }, [collapseOnDone, isDone]);

  useEffect(() => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (lines.length === 0) {
      const reset = lines.map(() => 0);
      typedLengthsRef.current = reset;
      setTypedLengths(reset);
      return;
    }

    if (isDone) {
      const completed = lines.map(line => line.length);
      typedLengthsRef.current = completed;
      setTypedLengths(completed);
      return;
    }

    if (visibleCount <= 0) {
      const reset = lines.map(() => 0);
      typedLengthsRef.current = reset;
      setTypedLengths(reset);
      return;
    }

    const activeIndex = Math.min(visibleCount - 1, lines.length - 1);

    setTypedLengths(prev => {
      const next = lines.map((line, index) => {
        if (index < activeIndex) return line.length;
        if (index === activeIndex) return Math.min(prev[index] || 0, line.length);
        return 0;
      });
      typedLengthsRef.current = next;
      return next;
    });

    const activeLine = lines[activeIndex] || '';
    const step = Math.max(1, Math.ceil(activeLine.length / 18));

    const typeNextChunk = () => {
      const current = typedLengthsRef.current[activeIndex] || 0;
      if (current >= activeLine.length) {
        typingTimerRef.current = null;
        return;
      }

      const nextLengths = lines.map((line, index) => {
        if (index < activeIndex) return line.length;
        if (index === activeIndex) return Math.min(activeLine.length, current + step);
        return 0;
      });

      typedLengthsRef.current = nextLengths;
      setTypedLengths(nextLengths);
      typingTimerRef.current = window.setTimeout(typeNextChunk, 28);
    };

    typingTimerRef.current = window.setTimeout(typeNextChunk, 40);

    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [isDone, lines, visibleCount]);

  useEffect(() => () => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }
  }, []);

  const visibleLineCount = isDone ? lines.length : Math.min(visibleCount, lines.length);
  const activeTypingLineIndex = !isDone && visibleLineCount > 0 ? visibleLineCount - 1 : -1;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          userExpandedRef.current = true;
          setExpanded(v => !v);
        }}
        className="flex items-center gap-[4px] py-[4px] px-1 w-full rounded-[8px] text-left hover:bg-black/5 transition-colors"
      >
        <ThinkingIcon spinning={!isDone} />

        {isDone ? (
          /* Done state: plain text "思考完毕" */
          <span className="text-[12px] text-[#7e7a75] leading-[1.625]">
            {doneLabel ? doneLabel(elapsedSec) : '思考完毕'}
          </span>
        ) : (
          /* Thinking state: shining sweep on "思考中" + animated dots */
          <span className="flex items-baseline gap-0 leading-[1.625]">
            <motion.span
              className="text-[12px] bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(110deg, #7e7a75 25%, #c2bdb8 42%, #ece7e2 50%, #c2bdb8 58%, #7e7a75 75%)',
                backgroundSize: '200% 100%',
              }}
              initial={{ backgroundPosition: '200% 0' }}
              animate={{ backgroundPosition: '-200% 0' }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              {runningLabel?.replace(/\.+$/, '') ?? '思考中'}
            </motion.span>
            <span className="text-[12px] text-[#7e7a75]">
              <AnimatedDots />
            </span>
          </span>
        )}

        <ChevronDown
          size={14}
          className={`text-[#7e7a75] shrink-0 ml-0.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-1 pb-1 flex flex-col gap-3">
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#7e7a75] shrink-0">识别关键词：</span>
              {keywords.map(keyword => (
                <span key={keyword} className="text-[10px] font-semibold text-[#191919]">
                  {keyword}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {lines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={index < visibleLineCount ? 'block' : 'hidden'}
              >
                {index < activeTypingLineIndex ? (
                  <p className="text-[12px] leading-[1.625] text-[#7e7a75]">{line}</p>
                ) : (
                  <div className="relative">
                    <p className="invisible text-[12px] leading-[1.625] whitespace-pre-wrap break-words">
                      {line}
                    </p>
                    <p className="absolute inset-0 text-[12px] leading-[1.625] text-[#7e7a75] whitespace-pre-wrap break-words">
                      {line.slice(0, typedLengths[index] || 0)}
                      {index === activeTypingLineIndex && (typedLengths[index] || 0) < line.length && (
                        <span className="inline-block w-[2px] h-[14px] ml-[1px] translate-y-[2px] bg-[#7e7a75] animate-pulse align-baseline" />
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const getActionClassName = (tone: AIAssistantAction['tone']) => {
  if (tone === 'primary') {
    return 'bg-[#eff6ff] border-[#bfdbfe] text-[#155dfc] hover:bg-[#dbeafe]';
  }
  if (tone === 'success') {
    return 'bg-[#f0fdf4] border-[#86efac] text-[#15803d]';
  }
  return 'text-[#4a5565] border-[#e5e7eb] hover:bg-gray-50';
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  title,
  subtitle,
  userMessage,
  userMessageNode,
  onClose,
  thinking,
  summary,
  assets = [],
  resultLabel,
  emptyState,
  extraContent,
  actions = [],
  footerSlot,
  className = '',
}) => (
  <div className={`w-[360px] shrink-0 border-l border-[#e5e7eb] bg-[#fcf5fd] shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] flex flex-col h-full overflow-hidden ${className}`.trim()}>

    {/* Header */}
    <div className="px-5 h-[59px] border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-[6px]">
        <Sparkles size={14} className="text-[#155dfc] shrink-0" />
        <span className="text-[14px] font-bold text-[#101828] leading-[20px]">{title}</span>
      </div>
      {subtitle && <p className="text-[10px] text-[#6a7282] mt-0.5">{subtitle}</p>}
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/8 rounded-[4px] text-[#6a7282] shrink-0 transition-colors"
      >
        <X size={16} />
      </button>
    </div>

    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

      {/* User message bubble */}
      {(userMessageNode || userMessage) && (
        <div className="flex justify-end">
          {userMessageNode ?? (
            <div
              className="px-[16px] py-[8px] text-[14px] text-[#191919] leading-[1.625] max-w-[85%]"
              style={{ background: '#f0e8f7', borderRadius: '12px 12px 0 12px' }}
            >
              {userMessage}
            </div>
          )}
        </div>
      )}

      {/* Thinking block */}
      <ThinkingBlock {...thinking} />

      {summary && (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <div className="text-[12px] leading-relaxed text-[#374155]">{summary}</div>
        </div>
      )}

      {/* Result label — plain black text, no icon */}
      {assets.length > 0 && resultLabel && (
        <p className="text-[12px] font-medium text-[#191919] leading-[18px]">{resultLabel}</p>
      )}

      {/* White card: assets + action buttons together */}
      {assets.length > 0 ? (
        <div className="bg-white rounded-[16px] p-[12px]">
          {/* Asset rows */}
          <div className="flex flex-col gap-[12px]">
            {assets.map(asset => (
              <div
                key={asset.id}
                onClick={asset.onClick}
                className="flex gap-[12px] items-center px-[8px] py-[12px] rounded-[12px] cursor-pointer hover:bg-[#f9fafb] transition-colors group"
              >
                {asset.thumbnail || <AssetThumb score={asset.score} />}
                <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                  <p className="text-[12px] font-medium text-[#101828] leading-[20px] truncate group-hover:text-[#155dfc] transition-colors">
                    {asset.title}
                  </p>
                  <p className="text-[12px] text-[#6a7282] leading-[16px] truncate">{asset.subtitle}</p>
                </div>
                <ChevronRight size={14} className="text-[#d1d5dc] shrink-0 group-hover:text-[#155dfc] transition-colors" />
              </div>
            ))}
          </div>

          {/* Action buttons inside the white card */}
          {actions.length > 0 && (
            <div className="flex gap-[8px] mt-[12px]">
              {actions.map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex-1 flex items-center justify-center gap-[4px] h-[34px] text-[12px] rounded-[8px] border transition-colors ${getActionClassName(action.tone)}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : emptyState}

      {/* "继续追问" pills and any extra content */}
      {extraContent}
    </div>

    {/* Footer input */}
    {footerSlot && (
      <div className="px-4 pb-4 pt-0 shrink-0">
        {footerSlot}
      </div>
    )}
  </div>
);
