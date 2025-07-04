window.Webflow ||= [];

const DEFAULT_DURATION = '480ms';
const DEFAULT_STAGGER = '80ms';
const DEFAULT_THRESHOLD = 0.2;
const TIMING_FN = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

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
  private globalStagger: string;

  constructor() {
    const thresholdAttr = document.documentElement.getAttribute('aos-threshold');
    const globalStaggerAttr = document.documentElement.getAttribute('aos-stagger');
    const threshold = thresholdAttr ? parseFloat(thresholdAttr) : DEFAULT_THRESHOLD;
    this.globalStagger = globalStaggerAttr
      ? ` ${parseFloat(globalStaggerAttr)}ms`
      : DEFAULT_STAGGER;

    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      rootMargin: '-6.66667% 0% -6.66667% 0%',
      threshold, // Element visibility threshold
    });
    this.initializeAnimations();
  }

  initializeAnimations() {
    // Select elements with aos and children of elements with aos-children
    const elements = document.querySelectorAll('[aos], [aos-children] > *');
    elements.forEach((element) => this.observer.observe(element));
  }

  handleIntersect(entries: IntersectionObserverEntry[]) {
    let items = 0;

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;

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

        // Animate in
        items += 1;
        target.classList.add('in-viewport');

        // Stop observing once animated
        this.observer.unobserve(target);
      }
    });
  }
}

window.Webflow.push(() => {
  new ScrollAnimator();
});
