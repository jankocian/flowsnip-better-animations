# @jankocian/flowsnip-better-animations

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
