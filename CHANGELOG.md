# @jankocian/flowsnip-better-animations

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
