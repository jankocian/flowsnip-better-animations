# @jankocian/flowsnip-better-animations

## 2.5.3

### Patch Changes

- Keep aos-children stagger groups deterministic by revealing earlier pending siblings before a ready later child, preventing fast footer scrolls from assigning the first stagger slot to the last visible item.

## 2.5.2

### Patch Changes

- Replay completed animations when an element loses layout because an ancestor becomes display none, allowing hidden mega-menu content to animate again on the next reveal.

## 2.5.1

### Patch Changes

- Make fast-scroll reveals deterministic at the end of the page by using one ordered pending queue and a scroll-direction trigger check, while still revealing footer-bottom items when the viewport reaches the page bottom.

## 2.5.0

### Minor Changes

- Fix fast-scroll stagger ordering by revealing all currently ready pending elements in viewport/document order instead of relying on IntersectionObserver callback batch order.

## 2.3.1

### Patch Changes

- Improved threshold/offset defaults.

  - change the default visibility threshold from `0.2` to `0`
  - increase the vertical observer offset from `1/15` to `1/10`

## 2.3.0

### Minor Changes

- Add fade-up-blur.

  - add a new `fade-up-blur` animation variant for `aos` and `aos-children`
  - document the new animation option in the README

## 2.2.2

### Patch Changes

- Improved stagger sort.

## 2.2.1

### Patch Changes

- Minor improvements.

  - extract animation attribute parsing into a dedicated utility module
  - centralize duration, stagger, and page-delay normalization logic

## 2.2.0

### Minor Changes

- Add page-level delay support for initially visible animations.

  - add `aos-page-delay` to delay above-the-fold animations on initial page load
  - allow `body` to override the script tag value for page-level delay configuration
  - document the new page delay option in the README

## 2.1.0

### Minor Changes

- 197d285: Improve scroll-trigger behavior for edge-of-page elements.

  - animate above-the-fold elements immediately on initial page load
  - bypass the vertical observer offset for elements near the bottom of the page when that offset would prevent them from ever entering the trigger area
  - derive the observer `rootMargin` from a single vertical offset constant

## 2.0.0

### Major Changes

- 741a56f: Light refactor – shorten attribute names, improve stagger (global, default)

## 1.0.0

### Major Changes

- 7bbca70: Release of version 1
