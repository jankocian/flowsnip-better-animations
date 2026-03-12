import { getDurationValue, getPageDelay, getStaggerValue } from './utils/animation-attributes';

window.Webflow ||= [];

const DEFAULT_DURATION = '360ms';
const DEFAULT_STAGGER = '60ms';
const DEFAULT_THRESHOLD = 0;
const TIMING_FN = 'cubic-bezier(0, 0, 0.2, 1)';
const VERTICAL_OFFSET = 1 / 10;
const currentScript = document.currentScript as HTMLScriptElement | null;

// Inject CSS immediately to avoid visual glitches before the DOM is fully loaded
(function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
  @media (prefers-reduced-motion: no-preference) {
    /* aos global styles */
    [aos],
    [aos-children] > * {
      transition-timing-function: ${TIMING_FN};
      transition-property: opacity, transform;
      transition-duration: var(--duration, ${DEFAULT_DURATION});
    }

    /* aos animations */
    /* fade-up - also default animation */
    [aos=""],
    [aos="fade-up"],
    [aos-children=""] > *,
    [aos-children="fade-up"] > * {
      opacity: 0;
      transform: translateY(24px);
    }

    [aos=""].in-viewport,
    [aos="fade-up"].in-viewport,
    [aos-children=""] > *.in-viewport,
    [aos-children="fade-up"] > *.in-viewport {
      opacity: 1;
      transform: translateY(0);
    }

    /* fade-up-blur */
    [aos="fade-up-blur"],
    [aos-children="fade-up-blur"] > * {
      transition-property: opacity, transform, filter;
      opacity: 0;
      transform: translateY(16px);
      filter: blur(6px);
    }

    [aos="fade-up-blur"].in-viewport,
    [aos-children="fade-up-blur"] > *.in-viewport {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }

    /* fade-in */
    [aos="fade-in"],
    [aos-children="fade-in"] > * {
      opacity: 0;
    }

    [aos="fade-in"].in-viewport,
    [aos-children="fade-in"] > *.in-viewport {
      opacity: 1;
    }
  }
`;
  document.head.appendChild(style);
})();

class ScrollAnimator {
  private observer: IntersectionObserver;
  private edgeObserver: IntersectionObserver;
  private globalStagger: string;
  private bottomOffsetBoundary: number;
  private pageDelay: number;

  constructor() {
    const thresholdAttr = document.documentElement.getAttribute('aos-threshold');
    const globalStaggerAttr = document.documentElement.getAttribute('aos-stagger');
    const threshold = thresholdAttr ? parseFloat(thresholdAttr) : DEFAULT_THRESHOLD;
    this.globalStagger = getStaggerValue(globalStaggerAttr) ?? DEFAULT_STAGGER;
    this.bottomOffsetBoundary = this.getDocumentHeight() - window.innerHeight * VERTICAL_OFFSET;
    this.pageDelay = getPageDelay(currentScript);

    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      rootMargin: `${-VERTICAL_OFFSET * 100}% 0% ${-VERTICAL_OFFSET * 100}% 0%`,
      threshold, // Element visibility threshold
    });
    this.edgeObserver = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      threshold,
    });
    this.initializeAnimations();
  }

  initializeAnimations() {
    // Select elements with aos and children of elements with aos-children
    const elements = document.querySelectorAll('[aos], [aos-children] > *');
    let initialItems = 0;

    elements.forEach((element) => {
      const target = element as HTMLElement;

      if (this.isInitiallyVisible(target)) {
        this.animateIn(target, initialItems, this.pageDelay);
        initialItems += 1;
        return;
      }

      if (this.shouldIgnoreBottomOffset(target)) {
        this.edgeObserver.observe(target);
        return;
      }

      this.observer.observe(target);
    });
  }

  handleIntersect(entries: IntersectionObserverEntry[]) {
    const intersectingEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((entryA, entryB) => this.sortEntriesByViewportPosition(entryA, entryB));

    intersectingEntries.forEach((entry, items) => {
      this.animateIn(entry.target as HTMLElement, items);
    });
  }

  private isInitiallyVisible(target: HTMLElement) {
    const { top, bottom } = target.getBoundingClientRect();
    return top < window.innerHeight && bottom > 0;
  }

  private shouldIgnoreBottomOffset(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const targetBottom = rect.bottom + window.scrollY;

    return rect.height > 0 && targetBottom > this.bottomOffsetBoundary;
  }

  private getDocumentHeight() {
    return Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
  }

  private sortEntriesByViewportPosition(
    entryA: IntersectionObserverEntry,
    entryB: IntersectionObserverEntry
  ) {
    const topDifference = entryA.boundingClientRect.top - entryB.boundingClientRect.top;

    if (topDifference !== 0) return topDifference;

    const targetA = entryA.target;
    const targetB = entryB.target;
    const position = targetA.compareDocumentPosition(targetB);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

    return 0;
  }

  private animateIn(target: HTMLElement, items: number, pageDelay = 0) {
    // Determine duration
    const durationAttr =
      target.getAttribute('aos-duration') ||
      target.closest('[aos-duration]')?.getAttribute('aos-duration') ||
      null;
    const duration = getDurationValue(durationAttr) ?? DEFAULT_DURATION;
    target.style.setProperty('--duration', duration);

    // Determine stagger
    const staggerAttr =
      target.getAttribute('aos-stagger') ||
      target.closest('[aos-stagger]')?.getAttribute('aos-stagger') ||
      null;

    const stagger = getStaggerValue(staggerAttr) ?? this.globalStagger;
    const staggerDelay = `calc(${items} * ${stagger})`;

    if (stagger || pageDelay > 0) {
      target.style.transitionDelay =
        pageDelay > 0 ? `calc(${pageDelay}ms + ${staggerDelay})` : staggerDelay;

      const transitionEndHandler = () => {
        target.style.transitionDelay = ``;
        target.removeEventListener('transitionend', transitionEndHandler);
      };

      target.addEventListener('transitionend', transitionEndHandler);
    }

    target.classList.add('in-viewport');
    this.observer.unobserve(target);
    this.edgeObserver.unobserve(target);
  }
}

window.Webflow.push(() => {
  new ScrollAnimator();
});
