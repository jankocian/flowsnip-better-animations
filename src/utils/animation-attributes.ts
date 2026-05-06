const PAGE_DELAY_ATTR = 'aos-page-delay';

export const getPageDelay = (currentScript: HTMLScriptElement | null) => {
  const pageDelayAttr =
    document.body?.getAttribute(PAGE_DELAY_ATTR) ??
    currentScript?.getAttribute(PAGE_DELAY_ATTR) ??
    null;

  return parseNumericAttr(pageDelayAttr, 0);
};

export const getDurationValue = (attribute: string | null) => {
  if (attribute === null) return null;

  const trimmed = attribute.trim();
  if (trimmed.endsWith('ms') || trimmed.endsWith('s')) return trimmed;

  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? `${parsed}ms` : null;
};

export const getStaggerValue = (attribute: string | null) => {
  const parsed = parseNumericAttr(attribute, Number.NaN);
  return Number.isFinite(parsed) ? `${parsed}ms` : null;
};

export const getThreshold = (attribute: string | null, fallback: number) => {
  if (attribute === null) return fallback;

  const parsed = parseFloat(attribute);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};

const parseNumericAttr = (attribute: string | null, fallback: number) => {
  if (attribute === null) return fallback;

  const parsed = parseFloat(attribute);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
