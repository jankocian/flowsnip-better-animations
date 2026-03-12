window.Webflow ||= [];

const DEFAULT_DURATION = '480ms';
const DEFAULT_STAGGER = '80ms';
const DEFAULT_THRESHOLD = 0.2;
const TIMING_FN = 'cubic-bezier(0.165, 0.84, 0.44, 1)';
const VERTICAL_OFFSET = 1 / 15;

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
      transform: translateY(32px);
    }

    [aos=""].in-viewport,
    [aos="fade-up"].in-viewport,
    [aos-children=""] > *.in-viewport,
    [aos-children="fade-up"] > *.in-viewport {
      opacity: 1;
      transform: translateY(0);
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

  constructor() {
    const thresholdAttr = document.documentElement.getAttribute('aos-threshold');
    const globalStaggerAttr = document.documentElement.getAttribute('aos-stagger');
    const threshold = thresholdAttr ? parseFloat(thresholdAttr) : DEFAULT_THRESHOLD;
    this.globalStagger = globalStaggerAttr
      ? ` ${parseFloat(globalStaggerAttr)}ms`
      : DEFAULT_STAGGER;
    this.bottomOffsetBoundary = this.getDocumentHeight() - window.innerHeight * VERTICAL_OFFSET;

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
        this.animateIn(target, initialItems);
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
    let items = 0;

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.animateIn(entry.target as HTMLElement, items);
        items += 1;
      }
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

  private animateIn(target: HTMLElement, items: number) {
    // Determine duration
    const durationAttr =
      target.getAttribute('aos-duration') ||
      target.closest('[aos-duration]')?.getAttribute('aos-duration');
    const duration = durationAttr
      ? Number.isNaN(durationAttr)
        ? durationAttr
        : `${parseFloat(durationAttr)}ms`
      : DEFAULT_DURATION;
    target.style.setProperty('--duration', duration);

    // Determine stagger
    const staggerAttr =
      target.getAttribute('aos-stagger') ||
      target.closest('[aos-stagger]')?.getAttribute('aos-stagger') ||
      null;

    const stagger = staggerAttr ? `${parseFloat(staggerAttr)}ms` : this.globalStagger;

    if (stagger) {
      target.style.transitionDelay = `calc(${items} * ${stagger})`;

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
