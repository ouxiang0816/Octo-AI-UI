/**
 * PublishedView — read-only design handoff page.
 * Opens when someone navigates to #/preview/{id}
 * Annotation mode: Figma Dev Mode style — hover/click elements, right panel shows properties.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Check, Copy, ArrowLeft, Download, ExternalLink, Layers, Eye, MousePointer2, Code2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadPublished } from './storage';
import { InteractiveLoginDemo } from './canvases';
import type { VibeSession, GeneratedPage } from './types';

// ─── Layer definitions — maps data-layer-id to display name + CSS props ────────
interface LayerDef {
  name: string;
  type: string;
  color?: string; // highlight color swatch
  props: { label: string; value: string }[];
}

const LAYER_DEFS: Record<string, LayerDef> = {
  card: {
    name: '登录卡片',
    type: 'Frame',
    props: [
      { label: 'Width', value: '340px' },
      { label: 'Background', value: '#FFFFFF' },
      { label: 'Padding', value: '32px 0' },
      { label: 'Gap', value: '16px (space-y-4)' },
    ],
  },
  logo: {
    name: '应用图标',
    type: 'Frame',
    color: '#1476FF',
    props: [
      { label: 'Width / Height', value: '44px × 44px' },
      { label: 'Background', value: '#1476FF' },
      { label: 'Border Radius', value: '12px' },
      { label: 'Box Shadow', value: '0 4px 12px rgba(20,118,255,0.35)' },
    ],
  },
  title: {
    name: '标题文字',
    type: 'Text',
    props: [
      { label: 'Content', value: '欢迎回来' },
      { label: 'Font Size', value: '18px' },
      { label: 'Font Weight', value: '700 (Bold)' },
      { label: 'Color', value: '#191919' },
      { label: 'Font Family', value: 'PingFang SC' },
      { label: 'Text Align', value: 'center' },
    ],
  },
  subtitle: {
    name: '副标题',
    type: 'Text',
    props: [
      { label: 'Content', value: '登录你的设计工作台' },
      { label: 'Font Size', value: '12px' },
      { label: 'Font Weight', value: '400 (Regular)' },
      { label: 'Color', value: '#AAAAAA' },
      { label: 'Text Align', value: 'center' },
    ],
  },
  'email-input': {
    name: '邮箱输入框',
    type: 'Input',
    props: [
      { label: 'Height', value: '40px' },
      { label: 'Border Radius', value: '12px' },
      { label: 'Border', value: '1px solid #E5E7EB' },
      { label: 'Background', value: '#FAFAFA' },
      { label: 'Padding', value: '0 14px' },
      { label: 'Font Size', value: '14px' },
      { label: 'Color', value: '#191919' },
      { label: 'Placeholder', value: 'your@email.com' },
    ],
  },
  'password-input': {
    name: '密码输入框',
    type: 'Input',
    props: [
      { label: 'Height', value: '40px' },
      { label: 'Border Radius', value: '12px' },
      { label: 'Border', value: '1px solid #E5E7EB' },
      { label: 'Background', value: '#FAFAFA' },
      { label: 'Padding', value: '0 40px 0 14px' },
      { label: 'Font Size', value: '14px' },
    ],
  },
  'login-btn': {
    name: '登录按钮',
    type: 'Button',
    color: '#1476FF',
    props: [
      { label: 'Height', value: '40px' },
      { label: 'Border Radius', value: '12px' },
      { label: 'Background', value: '#1476FF' },
      { label: 'Color', value: '#FFFFFF' },
      { label: 'Font Size', value: '14px' },
      { label: 'Font Weight', value: '600 (SemiBold)' },
      { label: 'Box Shadow', value: '0 2px 8px rgba(20,118,255,0.3)' },
    ],
  },
  'google-btn': {
    name: 'Google 登录按钮',
    type: 'Button',
    props: [
      { label: 'Height', value: '40px' },
      { label: 'Border Radius', value: '12px' },
      { label: 'Border', value: '1px solid #E5E7EB' },
      { label: 'Background', value: '#FFFFFF' },
      { label: 'Color', value: '#333333' },
      { label: 'Font Size', value: '14px' },
    ],
  },
};

// ─── Design spec tokens (right panel fallback / overview) ───────────────────────
const SPEC_TOKENS: Record<string, {
  colors: { label: string; value: string; hex: string }[];
  typography: { label: string; value: string }[];
  spacing: string[];
  radius: string;
}> = {
  '企业设计规范 v2.0': {
    colors: [
      { label: '品牌主色', value: '#1476FF', hex: '#1476FF' },
      { label: '成功色', value: '#10B981', hex: '#10B981' },
      { label: '警告色', value: '#F59E0B', hex: '#F59E0B' },
      { label: '危险色', value: '#EF4444', hex: '#EF4444' },
      { label: '文字主色', value: '#191919', hex: '#191919' },
      { label: '文字辅助', value: '#777777', hex: '#777777' },
      { label: '背景色', value: '#F8FAFC', hex: '#F8FAFC' },
    ],
    typography: [
      { label: '字体族', value: 'PingFang SC, HarmonyOS Sans' },
      { label: '标题 H1', value: '24px / Bold / -0.5px' },
      { label: '标题 H2', value: '18px / SemiBold' },
      { label: '正文', value: '14px / Regular / 1.6' },
      { label: '辅助文字', value: '12px / Regular' },
      { label: '标签', value: '11px / Medium' },
    ],
    spacing: ['4', '8', '12', '16', '24', '32', '48'],
    radius: '8px / 12px / 16px',
  },
  'Material Design 3': {
    colors: [
      { label: 'Primary', value: '#6750A4', hex: '#6750A4' },
      { label: 'Secondary', value: '#625B71', hex: '#625B71' },
      { label: 'Error', value: '#B3261E', hex: '#B3261E' },
      { label: 'Surface', value: '#FFFBFE', hex: '#FFFBFE' },
      { label: 'On Surface', value: '#1C1B1F', hex: '#1C1B1F' },
    ],
    typography: [
      { label: '字体族', value: 'Google Sans, Roboto' },
      { label: 'Headline M', value: '28px / Regular' },
      { label: 'Body Large', value: '16px / Regular / 1.5' },
      { label: 'Label Medium', value: '12px / Medium' },
    ],
    spacing: ['4', '8', '12', '16', '24', '32'],
    radius: '4px / 8px / 12px / 28px',
  },
  'iOS HIG': {
    colors: [
      { label: 'Blue', value: '#007AFF', hex: '#007AFF' },
      { label: 'Green', value: '#34C759', hex: '#34C759' },
      { label: 'Orange', value: '#FF9500', hex: '#FF9500' },
      { label: 'Red', value: '#FF3B30', hex: '#FF3B30' },
      { label: 'Label', value: '#000000', hex: '#000000' },
      { label: 'System BG', value: '#F2F2F7', hex: '#F2F2F7' },
    ],
    typography: [
      { label: '字体族', value: 'SF Pro Display, SF Pro Text' },
      { label: 'Large Title', value: '34px / Regular' },
      { label: 'Body', value: '17px / Regular / 1.47' },
      { label: 'Caption', value: '12px / Regular' },
    ],
    spacing: ['4', '8', '16', '20', '28', '44'],
    radius: '10px / 13px / 16px',
  },
  'Ant Design 5': {
    colors: [
      { label: 'Primary Blue', value: '#1677FF', hex: '#1677FF' },
      { label: 'Success', value: '#52C41A', hex: '#52C41A' },
      { label: 'Warning', value: '#FAAD14', hex: '#FAAD14' },
      { label: 'Error', value: '#FF4D4F', hex: '#FF4D4F' },
      { label: 'Text Primary', value: 'rgba(0,0,0,0.88)', hex: '#141414' },
      { label: 'BG Layout', value: '#F5F5F5', hex: '#F5F5F5' },
    ],
    typography: [
      { label: '字体族', value: 'PingFang SC, Microsoft YaHei' },
      { label: 'H1', value: '38px / 600' },
      { label: 'Base', value: '14px / 400 / 1.5715' },
      { label: 'SM', value: '12px / 400' },
    ],
    spacing: ['4', '8', '12', '16', '24', '32', '40'],
    radius: '6px / 8px',
  },
  '无规范约束': {
    colors: [
      { label: '主色', value: '#1476FF', hex: '#1476FF' },
      { label: '文字', value: '#191919', hex: '#191919' },
      { label: '背景', value: '#F8FAFC', hex: '#F8FAFC' },
    ],
    typography: [
      { label: '字体族', value: '系统默认字体' },
      { label: '正文', value: '14px / Regular' },
    ],
    spacing: ['8', '16', '24', '32'],
    radius: '自由定义',
  },
  'H Design_v1.1规范': {
    colors: [
      { label: '主色 Blue-6', value: '#1476FF', hex: '#1476FF' },
      { label: '成功 Green-6', value: '#00B578', hex: '#00B578' },
      { label: '警告 Orange-6', value: '#FF8C00', hex: '#FF8C00' },
      { label: '危险 Red-6', value: '#FA3741', hex: '#FA3741' },
      { label: '文字主色', value: '#191919', hex: '#191919' },
      { label: '文字辅助', value: '#6B6B6B', hex: '#6B6B6B' },
      { label: '背景色', value: '#F5F5F5', hex: '#F5F5F5' },
    ],
    typography: [
      { label: '字体族', value: 'HarmonyOS Sans, PingFang SC' },
      { label: '大标题', value: '24px / Bold / -0.3px' },
      { label: '标题', value: '18px / SemiBold' },
      { label: '正文', value: '14px / Regular / 1.6' },
      { label: '辅助文字', value: '12px / Regular' },
    ],
    spacing: ['4', '8', '12', '16', '24', '32', '48'],
    radius: '8px / 12px / 16px / 24px',
  },
  'ICT UI_v3.1.0规范': {
    colors: [
      { label: 'Primary', value: '#0F5DCA', hex: '#0F5DCA' },
      { label: 'Primary Light', value: '#3D7FDB', hex: '#3D7FDB' },
      { label: 'Success', value: '#1B8B5B', hex: '#1B8B5B' },
      { label: 'Warning', value: '#D97706', hex: '#D97706' },
      { label: 'Error', value: '#C0392B', hex: '#C0392B' },
      { label: 'Text Primary', value: '#1A1A1A', hex: '#1A1A1A' },
      { label: 'Surface', value: '#F0F2F5', hex: '#F0F2F5' },
    ],
    typography: [
      { label: '字体族', value: 'Noto Sans SC, Helvetica Neue' },
      { label: 'Display', value: '32px / 700' },
      { label: 'Heading', value: '20px / 600 / 1.4' },
      { label: 'Body', value: '14px / 400 / 1.7' },
      { label: 'Caption', value: '12px / 400' },
    ],
    spacing: ['2', '4', '8', '12', '16', '24', '32', '40'],
    radius: '4px / 6px / 8px',
  },
  'Cloud UI_v1.0.1规范': {
    colors: [
      { label: '品牌蓝', value: '#0066CC', hex: '#0066CC' },
      { label: '天空蓝', value: '#4DA6FF', hex: '#4DA6FF' },
      { label: '成功绿', value: '#27AE60', hex: '#27AE60' },
      { label: '警告橙', value: '#E67E22', hex: '#E67E22' },
      { label: '错误红', value: '#E74C3C', hex: '#E74C3C' },
      { label: '正文', value: '#2C3E50', hex: '#2C3E50' },
      { label: '浅背景', value: '#ECF0F1', hex: '#ECF0F1' },
    ],
    typography: [
      { label: '字体族', value: 'Source Han Sans CN, SF Pro' },
      { label: 'H1', value: '28px / 700 / -0.5px' },
      { label: 'H2', value: '20px / 600' },
      { label: 'Body', value: '14px / 400 / 1.6' },
      { label: 'Small', value: '12px / 400 / 1.5' },
    ],
    spacing: ['4', '8', '16', '24', '32', '48', '64'],
    radius: '2px / 4px / 8px / 16px',
  },
  'DevUI_v1.0.0规范': {
    colors: [
      { label: 'devui-brand', value: '#5E7CE0', hex: '#5E7CE0' },
      { label: 'devui-info', value: '#348FE4', hex: '#348FE4' },
      { label: 'devui-success', value: '#50D4AB', hex: '#50D4AB' },
      { label: 'devui-warning', value: '#FAD714', hex: '#FAD714' },
      { label: 'devui-danger', value: '#F66F6A', hex: '#F66F6A' },
      { label: 'devui-text', value: '#252B3A', hex: '#252B3A' },
      { label: 'devui-bg', value: '#F3F6F8', hex: '#F3F6F8' },
    ],
    typography: [
      { label: '字体族', value: 'Nunito Sans, PingFang SC' },
      { label: 'H1', value: '36px / 700' },
      { label: 'Body', value: '14px / 400 / 1.5715' },
      { label: 'SM', value: '12px / 400' },
      { label: 'XS', value: '10px / 400' },
    ],
    spacing: ['4', '8', '12', '16', '20', '24', '32'],
    radius: '4px / 6px / 10px',
  },
};

// ─── Dev Mode Overlay ──────────────────────────────────────────────────────────
interface LayerRect { x: number; y: number; w: number; h: number }

const DevModeOverlay: React.FC<{
  canvasRef: React.RefObject<HTMLDivElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}> = ({ canvasRef, selectedId, onSelect }) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [rects, setRects] = useState<Record<string, LayerRect>>({});

  const measure = useCallback(() => {
    const container = canvasRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const next: Record<string, LayerRect> = {};
    Object.keys(LAYER_DEFS).forEach(id => {
      const el = container.querySelector(`[data-layer-id="${id}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      next[id] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    });
    setRects(next);
  }, [canvasRef]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Re-measure after a tick so DOM has fully rendered
  useEffect(() => {
    const id = setTimeout(measure, 100);
    return () => clearTimeout(id);
  }, [measure]);

  return (
    <div className="absolute inset-0" onClick={() => onSelect(null)}>
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 15px,#1476ff 15px,#1476ff 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,#1476ff 15px,#1476ff 16px)' }} />

      {(Object.entries(rects) as [string, LayerRect][]).map(([id, rect]) => {
        const isHovered = hoverId === id;
        const isSelected = selectedId === id;
        const def = LAYER_DEFS[id];

        return (
          <div
            key={id}
            className="absolute cursor-pointer transition-colors duration-100"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              outline: isSelected
                ? '2px solid #1476ff'
                : isHovered
                  ? '1.5px dashed #1476ff'
                  : 'none',
              background: isSelected
                ? 'rgba(20,118,255,0.08)'
                : isHovered
                  ? 'rgba(20,118,255,0.04)'
                  : 'transparent',
            }}
            onMouseEnter={() => setHoverId(id)}
            onMouseLeave={() => setHoverId(null)}
            onClick={e => { e.stopPropagation(); onSelect(isSelected ? null : id); }}
          >
            {/* Layer name label — shows on hover or selected */}
            <AnimatePresence>
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute pointer-events-none z-20"
                  style={{ top: rect.y > 28 ? -22 : rect.h + 4, left: 0 }}
                >
                  <div className="bg-[#1476ff] text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap flex items-center gap-1">
                    <span className="text-[10px] opacity-70">{def.type}</span>
                    <span>{def.name}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dimension badge — only when selected */}
            {isSelected && (
              <div className="absolute pointer-events-none z-20"
                style={{ bottom: -18, right: 0 }}>
                <div className="bg-[#1476ff] text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap font-mono">
                  {Math.round(rect.w)} × {Math.round(rect.h)}
                </div>
              </div>
            )}

            {/* Corner handles when selected */}
            {isSelected && [
              { top: -3, left: -3 }, { top: -3, right: -3 },
              { bottom: -3, left: -3 }, { bottom: -3, right: -3 },
            ].map((style, i) => (
              <div key={i} className="absolute w-2 h-2 bg-white border-2 border-[#1476ff] rounded-sm pointer-events-none"
                style={style as React.CSSProperties} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── Inspect Panel ─────────────────────────────────────────────────────────────
const InspectPanel: React.FC<{ selectedId: string | null; spec: string }> = ({ selectedId, spec }) => {
  const tokens = SPEC_TOKENS[spec] ?? SPEC_TOKENS['企业设计规范 v2.0'];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (selectedId) {
    const def = LAYER_DEFS[selectedId];
    if (!def) return null;
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Selected layer header */}
        <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.07)] flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: def.color ? `${def.color}18` : '#f5f6f7' }}>
            <MousePointer2 size={12} style={{ color: def.color ?? '#777' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#191919] truncate">{def.name}</p>
            <p className="text-[10px] text-[#bbb] mt-0.5">{def.type}</p>
          </div>
          {def.color && (
            <div className="w-4 h-4 rounded shrink-0 border border-[rgba(25,25,25,0.1)]"
              style={{ background: def.color }} />
          )}
        </div>

        {/* Properties */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2.5">
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">属性</p>
            <div className="space-y-0.5">
              {def.props.map(prop => (
                <button
                  key={prop.label}
                  onClick={() => handleCopyValue(prop.label, prop.value)}
                  className="w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-[#f8fafc] transition-colors group text-left"
                >
                  <span className="text-[10px] text-[#aaa] shrink-0">{prop.label}</span>
                  <span className="text-[10px] text-[#333] font-mono truncate text-right flex items-center gap-1">
                    {prop.value.startsWith('#') && (
                      <span className="w-3 h-3 rounded-sm border border-[rgba(25,25,25,0.1)] shrink-0 inline-block"
                        style={{ background: prop.value }} />
                    )}
                    {copiedKey === prop.label ? (
                      <span className="text-[#10b981] text-[10px] flex items-center gap-0.5"><Check size={10} />已复制</span>
                    ) : (
                      <span>{prop.value}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Spacer before layer list */}
          <div className="h-px bg-[rgba(25,25,25,0.05)] mx-4 my-2" />

          {/* All layers list */}
          <div className="px-4 pb-4">
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">页面图层</p>
            <div className="space-y-0.5">
              {Object.entries(LAYER_DEFS).map(([id, d]) => (
                <div key={id} className={`flex items-center gap-2 py-1 px-2 rounded-lg text-left cursor-default ${selectedId === id ? 'bg-[#f0f5ff]' : ''}`}>
                  <div className="w-2 h-2 rounded-sm shrink-0"
                    style={{ background: d.color ?? (d.type === 'Text' ? '#f5f5f5' : '#f0f5ff'), border: '1px solid rgba(25,25,25,0.1)' }} />
                  <span className={`text-[10px] truncate ${selectedId === id ? 'text-[#1476ff] font-medium' : 'text-[#555]'}`}>{d.name}</span>
                  <span className="text-[10px] text-[#ccc] ml-auto shrink-0">{d.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: spec overview + layer list hint
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.07)] shrink-0">
        <p className="text-[10px] font-semibold text-[#191919]">设计参数</p>
        <p className="text-[10px] text-[#bbb] mt-0.5">{spec}</p>
      </div>

      {/* Hint */}
      <div className="mx-4 mt-3 mb-3 bg-[#f0f5ff] border border-[#d4e0ff] rounded-xl px-3 py-2.5 flex items-start gap-2 shrink-0">
        <MousePointer2 size={12} className="text-[#1476ff] mt-0.5 shrink-0" />
        <p className="text-[10px] text-[#1476ff] leading-relaxed">点击画布中的元素可查看其尺寸、颜色、字体等参数</p>
      </div>

      {/* Layer list */}
      <div className="px-4 pb-3 shrink-0">
        <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">页面图层</p>
        <div className="space-y-0.5">
          {Object.entries(LAYER_DEFS).map(([id, d]) => (
            <div key={id} className="flex items-center gap-2 py-1 px-2 rounded-lg">
              <div className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: d.color ?? (d.type === 'Text' ? '#f5f5f5' : '#f0f5ff'), border: '1px solid rgba(25,25,25,0.1)' }} />
              <span className="text-[10px] text-[#555] truncate">{d.name}</span>
              <span className="text-[10px] text-[#ccc] ml-auto shrink-0">{d.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[rgba(25,25,25,0.05)] mx-4" />

      {/* Colors */}
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.05)] shrink-0">
        <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2.5">颜色</p>
        <div className="space-y-2">
          {tokens.colors.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border border-[rgba(25,25,25,0.1)] shrink-0" style={{ background: c.hex }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#555] truncate">{c.label}</p>
              </div>
              <code className="text-[10px] text-[#aaa] font-mono">{c.value}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.05)] shrink-0">
        <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2.5">字体</p>
        <div className="space-y-2">
          {tokens.typography.map(t => (
            <div key={t.label}>
              <p className="text-[10px] text-[#bbb]">{t.label}</p>
              <p className="text-[10px] text-[#555]">{t.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.05)] shrink-0">
        <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2.5">间距</p>
        <div className="flex flex-wrap gap-1.5">
          {tokens.spacing.map(s => (
            <div key={s} className="flex flex-col items-center gap-0.5">
              <div className="bg-[#f0f5ff] border border-[#d4e0ff]" style={{ width: Math.min(parseInt(s), 32), height: 8, borderRadius: 2 }} />
              <span className="text-[10px] text-[#bbb]">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="px-4 py-3 shrink-0">
        <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">圆角</p>
        <p className="text-[10px] text-[#555]">{tokens.radius}</p>
      </div>
    </div>
  );
};

// ─── Code Panel ────────────────────────────────────────────────────────────────
const CODE_FILES = ['LoginPage.tsx', 'login.module.css', 'types.ts'];

type CodeLine = { code: string; color: 'keyword' | 'string' | 'comment' | 'jsx' | 'fn' | 'normal' };

const CODE_LINES: CodeLine[] = [
  { code: `import React, { useState } from 'react';`,       color: 'keyword' },
  { code: `import { Sparkles } from 'lucide-react';`,       color: 'keyword' },
  { code: ``,                                               color: 'normal' },
  { code: `interface LoginPageProps {}`,                    color: 'jsx' },
  { code: ``,                                               color: 'normal' },
  { code: `export const LoginPage: React.FC = () => {`,    color: 'fn' },
  { code: `  const [email, setEmail] = useState('');`,      color: 'normal' },
  { code: `  const [password, setPassword] = useState('');`,color: 'normal' },
  { code: `  const [loading, setLoading] = useState(false);`,color: 'normal' },
  { code: ``,                                               color: 'normal' },
  { code: `  const handleLogin = () => {`,                  color: 'fn' },
  { code: `    if (!email || !password) return;`,           color: 'normal' },
  { code: `    setLoading(true);`,                          color: 'normal' },
  { code: `    // TODO: call auth API endpoint`,            color: 'comment' },
  { code: `  };`,                                           color: 'normal' },
  { code: ``,                                               color: 'normal' },
  { code: `  return (`,                                     color: 'normal' },
  { code: `    <div className="min-h-screen bg-white`,      color: 'jsx' },
  { code: `      flex items-center justify-center">`,       color: 'string' },
  { code: `      <div className="w-[340px] space-y-4">`,    color: 'jsx' },
  { code: ``,                                               color: 'normal' },
  { code: `        {/* Logo */}`,                           color: 'comment' },
  { code: `        <div className="text-center">`,          color: 'jsx' },
  { code: `          <div className="w-11 h-11 rounded-xl`, color: 'jsx' },
  { code: `            bg-[#1476ff] mx-auto mb-3">`,        color: 'string' },
  { code: `            <Sparkles size={24} />`,             color: 'jsx' },
  { code: `          </div>`,                               color: 'jsx' },
  { code: `          <h2>欢迎回来</h2>`,                   color: 'jsx' },
  { code: `          <p>登录你的设计工作台</p>`,           color: 'jsx' },
  { code: `        </div>`,                                 color: 'jsx' },
  { code: ``,                                               color: 'normal' },
  { code: `        {/* Email Input */}`,                    color: 'comment' },
  { code: `        <div className="space-y-1">`,            color: 'jsx' },
  { code: `          <label>邮箱</label>`,                 color: 'jsx' },
  { code: `          <input`,                               color: 'jsx' },
  { code: `            type="email"`,                       color: 'string' },
  { code: `            value={email}`,                      color: 'jsx' },
  { code: `            onChange={e => setEmail(e.target.value)}`, color: 'fn' },
  { code: `            placeholder="your@email.com"`,       color: 'string' },
  { code: `            className="w-full border rounded-xl`, color: 'jsx' },
  { code: `              px-3.5 py-2.5 text-sm"`,          color: 'string' },
  { code: `          />`,                                   color: 'jsx' },
  { code: `        </div>`,                                 color: 'jsx' },
  { code: ``,                                               color: 'normal' },
  { code: `        {/* Password Input */}`,                 color: 'comment' },
  { code: `        <div className="space-y-1">`,            color: 'jsx' },
  { code: `          <label>密码</label>`,                 color: 'jsx' },
  { code: `          <input type="password"`,               color: 'jsx' },
  { code: `            value={password}`,                   color: 'jsx' },
  { code: `            onChange={e => setPassword(e.target.value)}`, color: 'fn' },
  { code: `            placeholder="输入密码"`,            color: 'string' },
  { code: `            className="w-full border rounded-xl`, color: 'jsx' },
  { code: `              px-3.5 py-2.5 text-sm"`,          color: 'string' },
  { code: `          />`,                                   color: 'jsx' },
  { code: `        </div>`,                                 color: 'jsx' },
  { code: ``,                                               color: 'normal' },
  { code: `        {/* Login Button */}`,                   color: 'comment' },
  { code: `        <button onClick={handleLogin}`,          color: 'jsx' },
  { code: `          disabled={loading}`,                   color: 'jsx' },
  { code: `          className="w-full bg-[#1476ff]`,       color: 'jsx' },
  { code: `            text-white py-2.5 rounded-xl`,       color: 'string' },
  { code: `            font-semibold">`,                    color: 'string' },
  { code: `          {loading ? '登录中...' : '登 录'}`,  color: 'jsx' },
  { code: `        </button>`,                              color: 'jsx' },
  { code: `      </div>`,                                   color: 'jsx' },
  { code: `    </div>`,                                     color: 'jsx' },
  { code: `  );`,                                          color: 'normal' },
  { code: `};`,                                            color: 'normal' },
];

const COLOR_MAP: Record<CodeLine['color'], string> = {
  keyword: '#7c3aed',
  string:  '#059669',
  comment: '#9ca3af',
  jsx:     '#1476ff',
  fn:      '#d97706',
  normal:  '#1e293b',
};

const FILE_ACCENT: Record<string, string> = {
  '.tsx': '#0891b2',
  '.css': '#db2777',
  '.ts':  '#7c3aed',
};
const fileAccent = (name: string) =>
  Object.entries(FILE_ACCENT).find(([ext]) => name.endsWith(ext))?.[1] ?? '#888';

const CodePanel: React.FC = () => {
  const [activeFile, setActiveFile] = useState('LoginPage.tsx');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_LINES.map(l => l.code).join('\n')).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden bg-white rounded-xl border border-[rgba(25,25,25,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* File tree */}
      <div className="w-[160px] border-r border-[rgba(25,25,25,0.07)] shrink-0 flex flex-col bg-[#f8fafc]">
        <div className="px-3 py-2.5 border-b border-[rgba(25,25,25,0.07)]">
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider">文件结构</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {[['src/', true], ['  components/', true], ...CODE_FILES.map(f => [`    ${f}`, false])].map(([label, isDir], i) => (
            typeof label === 'string' && (
              <div key={i}
                onClick={() => !isDir && setActiveFile((label as string).trim())}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono ${
                  !isDir
                    ? `cursor-pointer ${activeFile === (label as string).trim() ? 'bg-[#f0f5ff] text-[#1476ff] font-medium' : 'text-[#555] hover:bg-[#eef2f7]'}`
                    : 'text-[#aaa] cursor-default'
                }`}
              >
                {!isDir && <ChevronRight size={10} className="shrink-0 opacity-50" />}
                <span style={!isDir ? { color: fileAccent((label as string).trim()) } : {}}>{label as string}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Code editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-[rgba(25,25,25,0.07)] shrink-0 h-9 bg-[#f8fafc]">
          {CODE_FILES.map(f => (
            <button key={f} onClick={() => setActiveFile(f)}
              className={`h-full px-4 text-[10px] font-mono border-r border-[rgba(25,25,25,0.06)] transition-colors flex items-center gap-1.5 ${
                activeFile === f
                  ? 'bg-white text-[#191919] font-medium border-t-[2px] border-t-[#1476ff]'
                  : 'text-[#999] hover:text-[#555]'
              }`}>
              <span className="text-[10px]" style={{ color: fileAccent(f) }}>◆</span>
              {f}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleCopy}
            className={`mx-3 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg transition-colors ${
              copied ? 'text-[#10b981] bg-[#f0fdf4]' : 'text-[#777] hover:text-[#191919] hover:bg-[#f0f0f0]'
            }`}>
            {copied ? <><Check size={10} />已复制</> : <><Copy size={10} />复制代码</>}
          </button>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto py-3 select-text bg-white">
          {CODE_LINES.map((line, i) => (
            <div key={i} className="flex items-start hover:bg-[#f8fafc] min-h-[20px]">
              <span className="text-[10px] text-[#d1d5db] font-mono w-10 shrink-0 select-none text-right pr-4 leading-5 pt-px">{i + 1}</span>
              <pre className="text-[11.5px] font-mono leading-5 whitespace-pre"
                style={{ color: line.code ? COLOR_MAP[line.color] : 'transparent' }}>
                {line.code || ' '}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const PublishedView: React.FC<{ id: string }> = ({ id }) => {
  const [session, setSession] = useState<VibeSession | null>(null);
  const [activePage, setActivePage] = useState<GeneratedPage | null>(null);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<'demo' | 'annotation' | 'code'>('demo');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadPublished(id);
    if (!s) { setNotFound(true); return; }
    setSession(s);
    if (s.pages.length > 0) {
      setActivePage(s.pages.find(p => p.id === s.activePageId) ?? s.pages[0]);
    }
  }, [id]);

  // Clear selection when switching modes
  useEffect(() => {
    setSelectedLayerId(null);
  }, [viewMode]);

  const currentUrl = window.location.href;
  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publishedDate = session?.publishedAt
    ? new Date(session.publishedAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  void activePage; // may be used for multi-page later

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] flex items-center justify-center mx-auto">
            <ExternalLink size={24} className="text-[#ef4444]" />
          </div>
          <h2 className="text-base font-semibold text-[#191919]">链接已失效</h2>
          <p className="text-sm text-[#777]">该发布链接不存在或已被删除</p>
          <button onClick={() => { window.location.hash = ''; }}
            className="mt-2 text-sm text-[#1476ff] flex items-center gap-1.5 mx-auto hover:underline">
            <ArrowLeft size={14} /> 返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1476ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f0f2f5] flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="h-12 bg-white border-b border-[rgba(25,25,25,0.08)] px-5 flex items-center gap-3 shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#9059c4] to-[#1476ff] flex items-center justify-center shrink-0">
          <Sparkles size={12} className="text-white" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#191919] truncate">{session.title}</span>
          <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] border border-[#d1fae5] px-2 py-0.5 rounded-full font-medium shrink-0">已发布</span>
          <span className="text-[10px] text-[#bbb] shrink-0 hidden sm:block">· {publishedDate}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#aaa] hidden md:block">规范：{session.spec}</span>
          {/* Mode toggle */}
          <div className="flex items-center bg-[#f5f6f7] rounded-lg p-0.5">
            {([
              ['demo',       <Eye size={10} />,       '演示'],
              ['annotation', <Layers size={10} />,    '标注'],
              ['code',       <Code2 size={10} />,     '代码'],
            ] as const).map(([mode, icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-[#1476ff] font-medium shadow-sm'
                    : 'text-[#777]'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-[#f0fdf4] text-[#10b981]' : 'bg-[#f5f6f7] text-[#555] hover:bg-[#eee]'}`}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? '已复制链接' : '复制链接'}
          </button>
          <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg bg-[#1476ff] text-white hover:bg-[#1060d0] transition-colors">
            <Download size={10} /> 下载标注
          </button>
        </div>
      </div>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Mode indicator bar */}
          <div className="bg-white border-b border-[rgba(25,25,25,0.07)] px-4 flex items-center gap-3 h-10 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${viewMode === 'code' ? 'bg-[#1476ff]' : 'bg-[#10b981]'}`} />
            <span className="text-xs font-medium text-[#191919]">登录页 Demo</span>
            <span className="text-[10px] text-[#bbb]">· {session.spec}</span>
            {viewMode === 'annotation' && (
              <span className="text-[10px] bg-[#f0f5ff] text-[#1476ff] border border-[#d4e0ff] px-2 py-0.5 rounded-full font-medium ml-1 flex items-center gap-1">
                <MousePointer2 size={10} /> 标注模式
                {selectedLayerId && <> · 已选中：{LAYER_DEFS[selectedLayerId]?.name}</>}
              </span>
            )}
            {viewMode === 'code' && (
              <span className="text-[10px] bg-[#f0f5ff] text-[#1476ff] border border-[#dbeafe] px-2 py-0.5 rounded-full font-medium ml-1 flex items-center gap-1">
                <Code2 size={10} /> 代码视图 · LoginPage.tsx
              </span>
            )}
          </div>

          {/* Canvas / Code area */}
          {viewMode === 'code' ? (
            <div className="flex-1 p-6 overflow-hidden">
              <CodePanel />
            </div>
          ) : (
            <div className="flex-1 overflow-auto flex items-center justify-center p-8"
              style={{
                background: `radial-gradient(circle, rgba(25,25,25,0.08) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            >
              <div
                ref={canvasRef}
                className="relative bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
                style={{ width: 900, height: 600 }}
              >
                {/* Fix: wrapper must have full size so h-full inside InteractiveLoginDemo resolves correctly */}
                <div className={`w-full h-full${viewMode === 'annotation' ? ' pointer-events-none select-none' : ''}`}>
                  <InteractiveLoginDemo />
                </div>

                {/* Dev Mode overlay — annotation mode only */}
                <AnimatePresence>
                  {viewMode === 'annotation' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0"
                    >
                      <DevModeOverlay
                        canvasRef={canvasRef}
                        selectedId={selectedLayerId}
                        onSelect={setSelectedLayerId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {viewMode === 'annotation' && !selectedLayerId && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1e2433]/85 text-white text-[10px] px-3.5 py-1.5 rounded-full pointer-events-none flex items-center gap-1.5 backdrop-blur-sm">
                    <MousePointer2 size={10} /> 标注模式 · 悬停并点击元素查看设计参数
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Inspect / Spec panel ─────────────────────────────────────────── */}
        <div className="w-[248px] border-l border-[rgba(25,25,25,0.07)] flex flex-col shrink-0 overflow-hidden bg-white">
          {viewMode === 'code' ? (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.07)] shrink-0">
                <p className="text-[10px] font-semibold text-[#191919]">组件信息</p>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">LoginPage.tsx</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {/* Framework */}
                <div>
                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">技术栈</p>
                  {[['框架', 'React 18 + TypeScript'], ['样式', 'Tailwind CSS v3'], ['图标', 'Lucide React'], ['规范', session.spec]].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-[#6b7280]">{k}</span>
                      <span className="text-[10px] text-[#1476ff] font-mono">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-[rgba(25,25,25,0.06)]" />
                {/* Props */}
                <div>
                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">组件 Props</p>
                  <div className="bg-[#f8fafc] rounded-xl p-3 space-y-1.5 border border-[rgba(25,25,25,0.06)]">
                    <p className="text-[10px] text-[#9ca3af]">// 当前无外部 Props</p>
                    <p className="text-[10px] text-[#16a34a] font-mono">{'interface LoginPageProps {}'}</p>
                  </div>
                </div>
                <div className="h-px bg-[rgba(25,25,25,0.06)]" />
                {/* State */}
                <div>
                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">内部状态</p>
                  {[['email', 'string'], ['password', 'string'], ['loading', 'boolean'], ['success', 'boolean']].map(([name, type]) => (
                    <div key={name} className="flex items-center gap-2 py-1">
                      <span className="text-[10px] text-[#7c3aed] font-mono">{name}</span>
                      <span className="text-[10px] text-[#9ca3af] ml-auto">{type}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-[rgba(25,25,25,0.06)]" />
                {/* Dependencies */}
                <div>
                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">依赖项</p>
                  {['react', 'lucide-react', 'tailwindcss'].map(dep => (
                    <div key={dep} className="flex items-center gap-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                      <span className="text-[10px] text-[#374151] font-mono">{dep}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3 border-t border-[rgba(25,25,25,0.07)] shrink-0">
                <button className="w-full bg-[#1476ff] text-white text-xs py-2 rounded-xl font-medium hover:bg-[#0f63e0] transition-colors flex items-center justify-center gap-1.5">
                  <Download size={10} /> 下载代码
                </button>
              </div>
            </div>
          ) : (
            <InspectPanel selectedId={viewMode === 'annotation' ? selectedLayerId : null} spec={session.spec} />
          )}

          {/* Owner — only in demo/annotation modes */}
          {viewMode !== 'code' && (
            <div className="px-4 py-3 mt-auto border-t border-[rgba(25,25,25,0.05)] shrink-0">
              <p className="text-[10px] text-[#bbb]">发布者</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9059c4] to-[#1476ff] flex items-center justify-center text-white text-[10px] font-bold">
                  {session.owner.charAt(0)}
                </div>
                <span className="text-[10px] text-[#555]">{session.owner}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
