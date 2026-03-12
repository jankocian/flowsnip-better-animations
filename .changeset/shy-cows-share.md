---
"@jankocian/flowsnip-better-animations": minor
---

Improve scroll-trigger behavior for edge-of-page elements.

- animate above-the-fold elements immediately on initial page load
- bypass the vertical observer offset for elements near the bottom of the page when that offset would prevent them from ever entering the trigger area
- derive the observer `rootMargin` from a single vertical offset constant
