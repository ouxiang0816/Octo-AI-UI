import { Search } from 'lucide-react';
import unionIcon from '../assets/icons/union.svg';

export type AppTab = 'Chat' | 'Cowork' | 'Studio';
const TABS: AppTab[] = ['Chat', 'Cowork', 'Studio'];

interface TopNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenSearch?: () => void;
}

export function TopNavBar({ activeTab, onTabChange, onOpenSearch }: TopNavBarProps) {
  const tabIndex = TABS.indexOf(activeTab);

  return (
    <div
      className="h-[48px] shrink-0 flex items-center px-[16px] gap-[16px]"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-[8px] shrink-0" style={{ minWidth: 160 }}>
        <img src={unionIcon} alt="" aria-hidden="true" className="w-[26px] h-[26px] shrink-0" />
        <span className="font-semibold text-[17px] text-[#191919] leading-none select-none">Octo AI</span>
      </div>

      {/* Center: Sliding tab group */}
      <div className="flex-1 flex justify-center">
        <div
          className="relative flex items-center rounded-[10px] p-[3px]"
          style={{ background: 'rgba(0, 0, 0, 0.07)' }}
        >
          {/* Sliding pill */}
          <div
            className="absolute top-[3px] bottom-[3px] rounded-[7px] bg-white transition-transform duration-200 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
            style={{
              left: 3,
              width: `calc((100% - 6px) / 3)`,
              transform: `translateX(calc(${tabIndex} * (100% + 0px)))`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
            }}
          />
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`relative z-10 flex-1 px-[22px] py-[5px] text-[13px] font-medium leading-none transition-colors select-none rounded-[7px] ${
                activeTab === tab
                  ? 'text-[#191919]'
                  : 'text-[rgba(0,0,0,0.42)] hover:text-[rgba(0,0,0,0.62)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-[10px] shrink-0" style={{ minWidth: 160, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="搜索对话和文件"
          className="h-[32px] rounded-[8px] px-[10px] flex items-center gap-[6px] text-[12px] transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.50)',
            color: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(0,0,0,0.09)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.80)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.50)';
          }}
        >
          <Search size={13} strokeWidth={2} />
          <span>搜索对话和文件</span>
        </button>

        {/* Avatar placeholder */}
        <div
          className="w-[28px] h-[28px] rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold select-none"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          U
        </div>
      </div>
    </div>
  );
}
