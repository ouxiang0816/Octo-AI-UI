import type { CanvasType, ViewportMode } from './types';

// ─── Canvas type inference ────────────────────────────────────────────────────
export function inferCanvasType(text: string): CanvasType {
  const t = text.toLowerCase();
  if (/汽车|车型|官网|car|vehicle|驾驶|试驾|轿车|suv/.test(t)) return 'car-home';
  if (/登录|注册|login|sign\s*in|密码/.test(t)) return 'login';
  if (/首页|仪表盘|dashboard|概览|数据|统计/.test(t)) return 'dashboard';
  if (/详情|信息|资产|设计参数|规范/.test(t)) return 'detail';
  if (/表单|填写|提交|申请|form/.test(t)) return 'form';
  if (/列表|搜索|查询|list|search/.test(t)) return 'list';
  if (/个人|用户|头像|profile/.test(t)) return 'profile';
  return 'dashboard';
}

export function inferPageName(text: string): string {
  const t = text.toLowerCase();
  if (/汽车|车型|官网|car|vehicle|驾驶|试驾|轿车|suv/.test(t)) return '汽车官网';
  if (/登录/.test(t)) return '登录页';
  if (/注册/.test(t)) return '注册页';
  if (/首页|概览/.test(t)) return '首页';
  if (/仪表盘|dashboard/.test(t)) return '仪表盘';
  if (/详情/.test(t)) return '详情页';
  if (/列表/.test(t)) return '列表页';
  if (/搜索/.test(t)) return '搜索页';
  if (/个人|profile/.test(t)) return '个人中心';
  if (/表单|填写/.test(t)) return '表单页';
  return 'Demo 页面';
}

// ─── Viewport sizes ───────────────────────────────────────────────────────────
export const VIEWPORT_SIZES: Record<ViewportMode, { w: number; h: number; label: string }> = {
  desktop: { w: 900, h: 600, label: '桌面端' },
  tablet:  { w: 640, h: 480, label: '平板端' },
  mobile:  { w: 375, h: 667, label: '移动端' },
};
