/**
 * DemoPublishedView — 发布后的 Demo 公开访问页
 * 路由：#/make/:id（兼容 #/demo/:id）
 */
import React from 'react';
import { Monitor } from 'lucide-react';
import { DemoCanvas } from './OctoBuild';

export function DemoPublishedView({ id }: { id: string }) {
  const stored = localStorage.getItem(`octo-make-${id}`) ?? localStorage.getItem(`octo-demo-${id}`);

  if (!stored) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f5f5f5] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] flex items-center justify-center">
          <Monitor size={24} className="text-[#1476ff]" />
        </div>
        <p className="text-[16px] font-semibold text-[#191919]">Demo 不存在或已下线</p>
        <p className="text-[12px] text-[#999]">链接 ID：{id}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#fafafa]">
      {/* 顶栏 */}
      <div className="h-[48px] px-4 flex items-center justify-between bg-white border-b border-[rgba(0,0,0,0.08)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center">
            <Monitor size={14} className="text-[#1476ff]" />
          </div>
          <span className="text-[12px] font-semibold text-[#191919]">ComputeGraphViewer.make</span>
          <span className="text-[10px] text-[#bbb] font-mono">· {id.slice(-8)}</span>
        </div>
        <span className="text-[10px] text-[#bbb]">由 Octo Make 生成</span>
      </div>

      {/* Demo 画布全屏展示 */}
      <div className="flex-1 min-h-0 p-4">
        <div className="w-full h-full rounded-[16px] border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white">
          <DemoCanvas />
        </div>
      </div>
    </div>
  );
}
