import {
  getDurationValue,
  getPageDelay,
  getStaggerValue,
  getThreshold,
} from './utils/animation-attributes';

window.Webflow ||= [];

const DEFAULT_DURATION = '480ms';
const DEFAULT_STAGGER = '60ms';
const DEFAULT_THRESHOLD = 0;
const TIMING_FN = 'cubic-bezier(0.22, 1, 0.36, 1)';
const VERTICAL_OFFSET = 1 / 10;
const TARGET_SELECTOR = '[aos], [aos-children] > *';
const currentScript = document.currentScript as HTMLScriptElement | null;

// Inject CSS immediately to avoid visual glitches before the DOM is fully loaded
(function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
  @media (prefers-reduced-motion: no-preference) {
    /* :not(.aos-done) lets us cleanly drop ALL animation styles once done, so the
       element reverts to its author-defined baseline (no transform/filter, so no
       stacking context; user's own transitions untouched). */
    [aos]:not(.aos-done),
    [aos-children] > *:not(.aos-done) {
      transition-timing-function: ${TIMING_FN};
      transition-property: opacity, transform;
      transition-duration: var(--duration, ${DEFAULT_DURATION});
      will-change: opacity, transform;
    }

    /* fade-up (default) */
    [aos=""]:not(.aos-done),
    [aos="fade-up"]:not(.aos-done),
    [aos-children=""] > *:not(.aos-done),
    [aos-children="fade-up"] > *:not(.aos-done) {
      opacity: 0;
      transform: translateY(24px) scale(0.98);
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
      transform: translateY(24px) scale(0.98);
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
  private resizeObserver: ResizeObserver;
  private mutationObserver: MutationObserver;
  private pendingTargets = new Set<HTMLElement>();
  private completedTargets = new Set<HTMLElement>();
  private revealFrame: number | null = null;
  private globalStagger: string;
  private threshold: number;
  private pageDelay: number;

  constructor() {
    const root = document.documentElement;
    this.threshold = getThreshold(root.getAttribute('aos-threshold'), DEFAULT_THRESHOLD);
    this.globalStagger = getStaggerValue(root.getAttribute('aos-stagger')) ?? DEFAULT_STAGGER;
    this.pageDelay = getPageDelay(currentScript);

    this.observer = new IntersectionObserver(this.handleIntersect, {
      root: null,
      rootMargin: `${-VERTICAL_OFFSET * 100}% 0% ${-VERTICAL_OFFSET * 100}% 0%`,
      threshold: this.threshold,
    });
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.mutationObserver = new MutationObserver(this.handleMutations);

    window.addEventListener('scroll', this.scheduleRevealFlush, { passive: true });
    window.addEventListener('resize', this.scheduleRevealFlush);

    this.initializeAnimations();
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  private initializeAnimations() {
    let initialItems = 0;

    document.querySelectorAll<HTMLElement>(TARGET_SELECTOR).forEach((target) => {
      if (this.isInitiallyVisible(target)) {
        this.animateIn(target, initialItems, this.pageDelay);
        initialItems += 1;
        return;
      }
      this.observeTarget(target);
    });
  }

  private handleIntersect = (entries: IntersectionObserverEntry[]) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    this.scheduleRevealFlush();
  };

  private handleMutations = (mutations: MutationRecord[]) => {
    const candidates = new Set<HTMLElement>();

    for (const mutation of mutations) {
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element) this.releaseSubtree(node);
      });
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) this.collectTargets(node as HTMLElement, candidates);
      });
    }

    candidates.forEach((target) => this.observeTarget(target));
  };

  private handleResize = (entries: ResizeObserverEntry[]) => {
    if (!entries.some((entry) => this.shouldReset(entry.target as HTMLElement))) return;
    this.resetHiddenTargets();
  };

  private collectTargets(root: HTMLElement, into: Set<HTMLElement>) {
    if (root.matches(TARGET_SELECTOR)) into.add(root);
    // querySelectorAll('[aos-children] > *') won't match children of `root` itself,
    // so handle that case explicitly when `root` is the [aos-children] container.
    if (root.hasAttribute('aos-children')) {
      for (const child of root.children) into.add(child as HTMLElement);
    }
    root.querySelectorAll<HTMLElement>(TARGET_SELECTOR).forEach((el) => into.add(el));
  }

  private observeTarget(target: HTMLElement) {
    if (this.pendingTargets.has(target) || this.completedTargets.has(target)) return;
    if (target.classList.contains('aos-done') || target.classList.contains('in-viewport')) return;

    this.pendingTargets.add(target);
    this.observer.observe(target);
  }

  private releaseSubtree(root: Element) {
    this.releaseTarget(root as HTMLElement);
    root.querySelectorAll('*').forEach((el) => this.releaseTarget(el as HTMLElement));
  }

  private releaseTarget(target: HTMLElement) {
    if (!this.pendingTargets.has(target) && !this.completedTargets.has(target)) return;
    // Skip moved nodes: a re-parent fires both removedNodes and addedNodes for the
    // same element, but it's still in the document — keep its tracked state.
    if (target.isConnected) return;

    this.pendingTargets.delete(target);
    this.completedTargets.delete(target);
    this.observer.unobserve(target);
    this.resizeObserver.unobserve(target);
  }

  private scheduleRevealFlush = () => {
    if (this.revealFrame !== null) return;

    this.revealFrame = window.requestAnimationFrame(() => {
      this.revealFrame = null;
      this.flushReadyTargets();
    });
  };

  private flushReadyTargets() {
    Array.from(this.pendingTargets)
      .filter((target) => this.isReadyToAnimate(target))
      .sort((a, b) => this.sortByViewportPosition(a, b))
      .forEach((target, items) => this.animateIn(target, items));
  }

  private animateIn(target: HTMLElement, items: number, pageDelay = 0) {
    this.pendingTargets.delete(target);

    const durationAttr = target.closest('[aos-duration]')?.getAttribute('aos-duration') ?? null;
    target.style.setProperty('--duration', getDurationValue(durationAttr) ?? DEFAULT_DURATION);

    const staggerAttr = target.closest('[aos-stagger]')?.getAttribute('aos-stagger') ?? null;
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
    this.completedTargets.add(target);
    this.resizeObserver.observe(target);
    this.observer.unobserve(target);
  }

  // Replay completed animations only when the element leaves layout entirely,
  // such as when a mega-menu ancestor switches to display: none.
  private shouldReset(target: HTMLElement) {
    const hasAnimated =
      target.classList.contains('in-viewport') || target.classList.contains('aos-done');
    return hasAnimated && target.getClientRects().length === 0;
  }

  private reset(target: HTMLElement) {
    target.classList.remove('in-viewport', 'aos-done');
    target.style.transitionDelay = '';
    target.style.removeProperty('--duration');
    this.completedTargets.delete(target);
    this.pendingTargets.add(target);
    this.resizeObserver.unobserve(target);
    this.observer.observe(target);
  }

  private resetHiddenTargets() {
    this.completedTargets.forEach((target) => {
      if (this.shouldReset(target)) this.reset(target);
    });
  }

  private isInitiallyVisible(target: HTMLElement) {
    const { top, bottom } = target.getBoundingClientRect();
    return top < window.innerHeight && bottom > 0;
  }

  private isReadyToAnimate(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    if (rect.height <= 0) return false;

    const offset = this.isAtPageBottom() ? 0 : window.innerHeight * VERTICAL_OFFSET;
    const visibleTop = Math.max(rect.top, offset);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight - offset);
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) return false;

    const visibleRatio = Math.min(visibleHeight / rect.height, 1);
    return this.threshold <= 0 || visibleRatio >= this.threshold;
  }

  private isAtPageBottom() {
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0
    );
    return window.scrollY + window.innerHeight >= documentHeight - 1;
  }

  private sortByViewportPosition(a: Element, b: Element) {
    const topDifference = a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    if (topDifference !== 0) return topDifference;

    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }
}

window.Webflow.push(() => {
  new ScrollAnimator();
});
