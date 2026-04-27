import { PROTOTYPE_DOMAINS, type PrototypeSolution } from '../features/assets/mock-data';

export const PROTOTYPE_COMPONENT_LINKS_STORAGE_KEY = 'octo.prototype-component-links';
export const PROTOTYPE_COMPONENT_LINKS_UPDATED_EVENT = 'octo.prototype-component-links.updated';

export interface LinkedPrototypeComponent extends PrototypeSolution {
  domainKey: string;
  domainLabel: string;
}

export function loadPrototypeComponentLinkMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROTOTYPE_COMPONENT_LINKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, value]) => typeof value === 'boolean'),
    );
  } catch {
    return {};
  }
}

export function savePrototypeComponentLinkMap(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROTOTYPE_COMPONENT_LINKS_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(PROTOTYPE_COMPONENT_LINKS_UPDATED_EVENT));
}

export function loadEnabledPrototypeComponents(): LinkedPrototypeComponent[] {
  const enabledMap = loadPrototypeComponentLinkMap();
  return PROTOTYPE_DOMAINS.flatMap((domain) =>
    domain.solutions
      .filter((solution) => enabledMap[solution.id])
      .map((solution) => ({
        ...solution,
        domainKey: domain.key,
        domainLabel: domain.label,
      })),
  );
}
