import { expect, type Page, test } from '@playwright/test';

declare global {
  interface Window {
    __aosObservers: Array<{
      options: IntersectionObserverInit;
      trigger: (entries: FakeIntersectionObserverEntry[]) => void;
    }>;
  }
}

type FakeIntersectionObserverEntry = Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>;

const installAnimationLibrary = async (page: Page) => {
  await page.evaluate(() => {
    window.__aosObservers = [];
    (window as unknown as { Webflow: { push: (callback: () => void) => void } }).Webflow = {
      push: (callback) => callback(),
    };

    class FakeIntersectionObserver {
      private readonly callback: IntersectionObserverCallback;
      readonly options: IntersectionObserverInit;
      readonly targets = new Set<Element>();

      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
        this.callback = callback;
        this.options = options;
        window.__aosObservers.push(this);
      }

      observe(target: Element) {
        this.targets.add(target);
      }

      unobserve(target: Element) {
        this.targets.delete(target);
      }

      disconnect() {
        this.targets.clear();
      }

      takeRecords() {
        return [];
      }

      trigger(entries: FakeIntersectionObserverEntry[]) {
        this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
      }
    }

    window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  await page.addScriptTag({ url: 'http://localhost:3000/index.js' });
};

test('fast-scroll observer batches reveal currently ready children in visual order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setContent(`
    <style>
      body { margin: 0; font-family: sans-serif; }
      .spacer { height: 1200px; }
      footer { padding: 24px 0 160px; }
      a { display: block; height: 32px; margin: 8px 0; }
    </style>
    <div class="spacer"></div>
    <footer aos-children aos-duration="10000" aos-stagger="50">
      <a href="#one">One</a>
      <a href="#two">Two</a>
      <a href="#three">Three</a>
      <a href="#four">Four</a>
      <a href="#five">Five</a>
    </footer>
  `);

  await installAnimationLibrary(page);
  await page.evaluate(() => window.scrollTo(0, 1120));

  await page.evaluate(() => {
    const lastLink = document.querySelector('footer a:last-child');
    const normalObserver = window.__aosObservers.find((observer) => observer.options.rootMargin);

    if (!lastLink || !normalObserver) throw new Error('Test setup failed.');

    normalObserver.trigger([{ target: lastLink, isIntersecting: true }]);
  });

  await expect
    .poll(() =>
      page.$$eval('footer a', (links) => links.map((link) => link.classList.contains('in-viewport')))
    )
    .toEqual([true, true, true, true, true]);

  await expect
    .poll(() => page.$$eval('footer a', (links) => links.map((link) => link.style.transitionDelay)))
    .toEqual(['calc(0s)', 'calc(0.05s)', 'calc(0.1s)', 'calc(0.15s)', 'calc(0.2s)']);
});

test('fast downward scroll preserves order when earlier children were skipped past', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setContent(`
    <style>
      body { margin: 0; font-family: sans-serif; }
      .spacer { height: 1200px; }
      footer { padding: 24px 0 160px; }
      a { display: block; height: 32px; margin: 8px 0; }
    </style>
    <div class="spacer"></div>
    <footer aos-children aos-duration="10000" aos-stagger="50">
      <a href="#one">One</a>
      <a href="#two">Two</a>
      <a href="#three">Three</a>
      <a href="#four">Four</a>
      <a href="#five">Five</a>
    </footer>
  `);

  await installAnimationLibrary(page);
  await page.evaluate(() => window.scrollTo(0, 1300));

  await page.evaluate(() => {
    const lastLink = document.querySelector('footer a:last-child');
    const normalObserver = window.__aosObservers.find((observer) => observer.options.rootMargin);

    if (!lastLink || !normalObserver) throw new Error('Test setup failed.');

    normalObserver.trigger([{ target: lastLink, isIntersecting: true }]);
  });

  await expect
    .poll(() =>
      page.$$eval('footer a', (links) => links.map((link) => link.classList.contains('in-viewport')))
    )
    .toEqual([true, true, true, true, true]);

  await expect
    .poll(() => page.$$eval('footer a', (links) => links.map((link) => link.style.transitionDelay)))
    .toEqual(['calc(0s)', 'calc(0.05s)', 'calc(0.1s)', 'calc(0.15s)', 'calc(0.2s)']);
});
