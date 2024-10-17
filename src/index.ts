window.Webflow ||= [];

const DEFAULT_DURATION = '500ms';
const DEFAULT_STAGGER = '150ms';
const DEFAULT_THRESHOLD = 0.2;
const TIMING_FN = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

// Inject CSS immediately to avoid visual glitches before the DOM is fully loaded
(function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
  /* fs-aos global styles */
  [fs-aos],
  [fs-aos-children] > * {
    transition-timing-function: ${TIMING_FN};
    transition-property: opacity, transform;
    transition-duration: var(--duration, ${DEFAULT_DURATION});
  }

  /* fs-aos animations */
  /* fade-up - also default animation */
  [fs-aos=""],
  [fs-aos="fade-up"],
  [fs-aos-children=""] > *,
  [fs-aos-children="fade-up"] > * {
    opacity: 0;
    transform: translateY(32px);
  }

  [fs-aos=""].in-viewport,
  [fs-aos="fade-up"].in-viewport,
  [fs-aos-children=""] > *.in-viewport,
  [fs-aos-children="fade-up"] > *.in-viewport {
    opacity: 1;
    transform: translateY(0);
  }

  /* fade-in */
  [fs-aos="fade-in"],
  [fs-aos-children="fade-in"] > * {
    opacity: 0;
  }

  [fs-aos="fade-in"].in-viewport,
  [fs-aos-children="fade-in"] > *.in-viewport {
    opacity: 1;
  }
`;
  document.head.appendChild(style);
})();

class ScrollAnimator {
  private observer: IntersectionObserver;

  constructor() {
    const thresholdAttr = document.documentElement.getAttribute('fs-aos-threshold');
    const threshold = thresholdAttr ? parseFloat(thresholdAttr) : DEFAULT_THRESHOLD;

    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      rootMargin: '-6.66667% 0% -6.66667% 0%',
      threshold, // Element visibility threshold
    });
    this.initializeAnimations();
  }

  initializeAnimations() {
    // Select elements with fs-aos and children of elements with fs-aos-children
    const elements = document.querySelectorAll('[fs-aos], [fs-aos-children] > *');
    elements.forEach((element) => this.observer.observe(element));
  }

  handleIntersect(entries: IntersectionObserverEntry[]) {
    let items = 0;

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;

        // Determine duration
        const durationAttr =
          target.getAttribute('fs-aos-duration') ||
          target.closest('[fs-aos-duration]')?.getAttribute('fs-aos-duration');
        const duration = durationAttr
          ? Number.isNaN(durationAttr)
            ? durationAttr
            : `${parseFloat(durationAttr)}ms`
          : DEFAULT_DURATION;
        target.style.setProperty('--duration', duration);

        // Determine stagger
        const staggerAttr =
          target.getAttribute('fs-aos-stagger') ||
          target.closest('[fs-aos-stagger]')?.getAttribute('fs-aos-stagger');
        const stagger =
          typeof staggerAttr === 'string'
            ? staggerAttr === ''
              ? DEFAULT_STAGGER
              : Number.isNaN(staggerAttr)
                ? staggerAttr
                : `${parseFloat(staggerAttr)}ms`
            : null;
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
