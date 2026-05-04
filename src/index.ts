import { getDurationValue, getPageDelay, getStaggerValue } from './utils/animation-attributes';

window.Webflow ||= [];

const DEFAULT_DURATION = '480ms';
const DEFAULT_STAGGER = '60ms';
const DEFAULT_THRESHOLD = 0;
const TIMING_FN = 'cubic-bezier(0.22, 1, 0.36, 1)';
const VERTICAL_OFFSET = 1 / 10;
const currentScript = document.currentScript as HTMLScriptElement | null;

// Inject CSS immediately to avoid visual glitches before the DOM is fully loaded
(function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
  @media (prefers-reduced-motion: no-preference) {
    /* aos global styles — :not(.aos-done) lets us cleanly drop ALL animation
       styles once done, so the element reverts to its author-defined baseline
       (no transform/filter, so no stacking context; user's own transitions untouched). */
    [aos]:not(.aos-done),
    [aos-children] > *:not(.aos-done) {
      transition-timing-function: ${TIMING_FN};
      transition-property: opacity, transform;
      transition-duration: var(--duration, ${DEFAULT_DURATION});
      will-change: opacity, transform;
    }

    /* aos animations */
    /* fade-up - also default animation */
    [aos=""]:not(.aos-done),
    [aos="fade-up"]:not(.aos-done),
    [aos-children=""] > *:not(.aos-done),
    [aos-children="fade-up"] > *:not(.aos-done) {
      opacity: 0;
      transform: translateY(24px) scale(0.96);
    }

    [aos=""].in-viewport:not(.aos-done),
    [aos="fade-up"].in-viewport:not(.aos-done),
    [aos-children=""] > *.in-viewport:not(.aos-done),
    [aos-children="fade-up"] > *.in-viewport:not(.aos-done) {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* fade-up-blur */
    [aos="fade-up-blur"]:not(.aos-done),
    [aos-children="fade-up-blur"] > *:not(.aos-done) {
      transition-property: opacity, transform, filter;
      will-change: opacity, transform, filter;
      opacity: 0;
      transform: translateY(24px) scale(0.96);
      filter: blur(6px);
    }

    [aos="fade-up-blur"].in-viewport:not(.aos-done),
    [aos-children="fade-up-blur"] > *.in-viewport:not(.aos-done) {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }

    /* fade-in */
    [aos="fade-in"]:not(.aos-done),
    [aos-children="fade-in"] > *:not(.aos-done) {
      opacity: 0;
    }

    [aos="fade-in"].in-viewport:not(.aos-done),
    [aos-children="fade-in"] > *.in-viewport:not(.aos-done) {
      opacity: 1;
    }
  }
`;
  document.head.appendChild(style);
})();

class ScrollAnimator {
  private observer: IntersectionObserver;
  private pendingTargets = new Set<HTMLElement>();
  private revealFrame: number | null = null;
  private globalStagger: string;
  private threshold: number;
  private pageDelay: number;
  private lastScrollY = window.scrollY;
  private isScrollingDown = true;

  constructor() {
    const thresholdAttr = document.documentElement.getAttribute('aos-threshold');
    const globalStaggerAttr = document.documentElement.getAttribute('aos-stagger');
    const parsedThreshold = thresholdAttr ? parseFloat(thresholdAttr) : DEFAULT_THRESHOLD;
    this.threshold =
      Number.isFinite(parsedThreshold) && parsedThreshold >= 0 && parsedThreshold <= 1
        ? parsedThreshold
        : DEFAULT_THRESHOLD;
    this.globalStagger = getStaggerValue(globalStaggerAttr) ?? DEFAULT_STAGGER;
    this.pageDelay = getPageDelay(currentScript);

    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      rootMargin: `${-VERTICAL_OFFSET * 100}% 0% ${-VERTICAL_OFFSET * 100}% 0%`,
      threshold: this.threshold, // Element visibility threshold
    });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.scheduleRevealFlush);
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

      this.pendingTargets.add(target);
      this.observer.observe(target);
    });
  }

  handleIntersect(entries: IntersectionObserverEntry[]) {
    if (!entries.some((entry) => entry.isIntersecting)) return;

    this.scheduleRevealFlush();
  }

  private isInitiallyVisible(target: HTMLElement) {
    const { top, bottom } = target.getBoundingClientRect();
    return top < window.innerHeight && bottom > 0;
  }

  private getDocumentHeight() {
    return Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
  }

  private handleScroll = () => {
    const { scrollY } = window;
    this.isScrollingDown = scrollY >= this.lastScrollY;
    this.lastScrollY = scrollY;
    this.scheduleRevealFlush();
  };

  private scheduleRevealFlush = () => {
    if (this.revealFrame !== null) return;

    this.revealFrame = window.requestAnimationFrame(() => {
      this.revealFrame = null;
      this.flushReadyTargets();
    });
  };

  private flushReadyTargets() {
    const readyTargets = Array.from(this.pendingTargets)
      .filter((target) => this.isReadyToAnimate(target))
      .sort((targetA, targetB) => this.sortElementsByViewportPosition(targetA, targetB));

    readyTargets.forEach((target, items) => {
      this.animateIn(target, items);
    });
  }

  private isReadyToAnimate(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    if (rect.height <= 0) return false;

    const verticalOffset = this.isAtPageBottom() ? 0 : window.innerHeight * VERTICAL_OFFSET;
    const viewportTop = verticalOffset;
    const viewportBottom = window.innerHeight - verticalOffset;
    const thresholdOffset = rect.height * this.threshold;

    return this.isScrollingDown
      ? rect.top + thresholdOffset <= viewportBottom
      : rect.bottom - thresholdOffset >= viewportTop;
  }

  private isAtPageBottom() {
    return window.scrollY + window.innerHeight >= this.getDocumentHeight() - 1;
  }

  private sortElementsByViewportPosition(targetA: Element, targetB: Element) {
    const rectA = targetA.getBoundingClientRect();
    const rectB = targetB.getBoundingClientRect();
    const topDifference = rectA.top - rectB.top;

    if (topDifference !== 0) return topDifference;

    const position = targetA.compareDocumentPosition(targetB);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

    return 0;
  }

  private animateIn(target: HTMLElement, items: number, pageDelay = 0) {
    this.pendingTargets.delete(target);

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
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== target) return;
      target.style.transitionDelay = '';
      target.style.removeProperty('--duration');
      target.classList.add('aos-done');
      target.removeEventListener('transitionend', onTransitionEnd);
    };
    target.addEventListener('transitionend', onTransitionEnd);

    target.classList.add('in-viewport');
    this.observer.unobserve(target);
  }
}

window.Webflow.push(() => {
  new ScrollAnimator();
});
