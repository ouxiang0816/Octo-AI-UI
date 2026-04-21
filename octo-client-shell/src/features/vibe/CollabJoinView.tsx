/**
 * CollabJoinView — full VibeDesign editor in collaboration mode.
 * Opened when someone navigates to #/collab/{id}
 * Real-time sync with owner via localStorage + storage events.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadCollab, readLiveUpdate } from './storage';
import type { GeneratedPage } from './types';

// Lazy-import VibeDesign to avoid circular deps
import { VibeDesign } from '../../pages/VibeDesign';

const MOCK_OWNER = { name: 'Vivian Chen', initial: 'V', color: '#1476ff' };

export const CollabJoinView: React.FC<{ id: string }> = ({ id }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [initialPages, setInitialPages] = useState<GeneratedPage[]>([]);
  const [initialSpec, setInitialSpec] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    // Load from live update first (most recent), fallback to collab session
    const live = readLiveUpdate(id);
    const session = live ?? loadCollab(id);
    if (!session && !live) {
      setNotFound(true);
      setReady(true);
      return;
    }
    if (session) {
      setInitialPages(session.pages ?? []);
      setInitialSpec(session.spec);
    }
    setReady(true);

    // Auto-dismiss banner after 4 seconds
    const t = setTimeout(() => setShowBanner(false), 4000);
    return () => clearTimeout(t);
  }, [id]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1476ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] flex items-center justify-center mx-auto">
            <Users size={24} className="text-[#ef4444]" />
          </div>
          <h2 className="text-base font-semibold text-[#191919]">邀请链接已失效</h2>
          <p className="text-sm text-[#777]">该协作项目不存在或链接已过期</p>
          <button onClick={() => { window.location.hash = ''; }}
            className="mt-2 text-sm text-[#1476ff] flex items-center gap-1.5 mx-auto hover:underline">
            <ArrowLeft size={14} /> 返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Join banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -48 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2.5 bg-white border border-[rgba(25,25,25,0.1)] rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: MOCK_OWNER.color }}>
              {MOCK_OWNER.initial}
            </div>
            <div>
              <p className="text-xs font-medium text-[#191919]">
                已加入 <span className="text-[#1476ff]">{MOCK_OWNER.name}</span> 的 Vibe Design 项目
              </p>
              <p className="text-[10px] text-[#aaa]">你现在可以共同编辑，画布更新实时同步</p>
            </div>
            <button onClick={() => setShowBanner(false)} className="ml-1 text-[#ccc] hover:text-[#555] text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-[#191919] text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <VibeDesign
        onClose={() => { window.location.hash = ''; }}
        onToast={showToast}
        collabId={id}
        isCollaborator={true}
        initialPages={initialPages}
        initialSpec={initialSpec}
      />
    </div>
  );
};
