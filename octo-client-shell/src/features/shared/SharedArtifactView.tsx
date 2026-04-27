import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { type SharedArtifactPayload } from '../../data/shared-artifacts';

function renderSharedContent(content: string) {
  const blocks = content.split('\n').map((line, index) => {
    const text = line.trim();
    if (!text) return <div key={index} className="h-[8px]" />;
    if (text.startsWith('# ')) return <h1 key={index} className="text-[28px] font-semibold leading-[40px] text-[#191919]">{text.slice(2)}</h1>;
    if (text.startsWith('## ')) return <h2 key={index} className="mt-[28px] text-[16px] font-semibold leading-[24px] text-[#191919]">{text.slice(3)}</h2>;
    if (text.startsWith('- ')) return <div key={index} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">• {text.slice(2)}</div>;
    return <p key={index} className="mt-[12px] text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">{text}</p>;
  });

  return <div>{blocks}</div>;
}

export function SharedArtifactView({
  payload,
  onClose,
}: {
  payload: SharedArtifactPayload | null;
  onClose: () => void;
}) {
  if (!payload) {
    return (
      <div className="fixed inset-0 bg-[#f3f6fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[18px] font-semibold text-[#191919]">分享内容不存在</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-[16px] inline-flex items-center gap-[6px] rounded-[12px] bg-white px-[14px] py-[10px] text-[13px] text-[#191919] shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft size={14} />
            返回
          </button>
        </div>
      </div>
    );
  }

  const isHtml = payload.workflow === 'demo' && /<\/?[a-z][\s\S]*>/i.test(payload.content);

  return (
    <div className="fixed inset-0 bg-[#f3f6fb] overflow-hidden">
      <div className="h-full flex flex-col">
        <header className="h-[72px] shrink-0 border-b border-[rgba(25,25,25,0.08)] bg-white px-[24px] flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] hover:bg-[#f5f5f5]"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-semibold text-[#191919]">{payload.title}</h1>
                {payload.subtitle && <p className="truncate text-[12px] text-[rgba(25,25,25,0.55)]">{payload.subtitle}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(window.location.href).catch(() => {})}
              className="inline-flex items-center gap-[6px] rounded-[12px] bg-white px-[14px] py-[10px] text-[13px] text-[#191919] shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
            >
              <Copy size={14} />
              复制链接
            </button>
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-[6px] rounded-[12px] bg-[#1476ff] px-[14px] py-[10px] text-[13px] text-white"
            >
              <ExternalLink size={14} />
              新标签打开
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto px-[28px] py-[24px]">
          <div className="mx-auto max-w-[1120px] rounded-[20px] border border-[rgba(25,25,25,0.06)] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
            {isHtml ? (
              <iframe
                title={payload.title}
                srcDoc={payload.content}
                sandbox="allow-scripts allow-same-origin allow-forms"
                className="h-[calc(100vh-180px)] w-full rounded-[20px] border-0"
              />
            ) : (
              <div className="px-[32px] py-[28px]">
                {renderSharedContent(payload.content)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
