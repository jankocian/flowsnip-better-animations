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

  const trimmedAttribute = attribute.trim();
  if (trimmedAttribute.endsWith('ms') || trimmedAttribute.endsWith('s')) {
    return trimmedAttribute;
  }

  const parsedValue = parseFloat(trimmedAttribute);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? `${parsedValue}ms` : null;
};

export const getStaggerValue = (attribute: string | null) => {
  const parsedValue = parseNumericAttr(attribute, Number.NaN);
  return Number.isFinite(parsedValue) ? `${parsedValue}ms` : null;
};

const parseNumericAttr = (attribute: string | null, fallback: number) => {
  if (attribute === null) return fallback;

  const parsedValue = parseFloat(attribute);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
};
