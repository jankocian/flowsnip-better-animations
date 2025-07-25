# flowsnip-better-animations

## Overview

**Plug and play on scroll transitions helper** for **Webflow**:

- Fast and easy way to add native **CSS transitions on scroll** to your elements
- Easily configurable via data attributes, no more manual clicking
- **Staggering** – easily stagger all the nested transitions by adding one data attribute
- Responsive friendly staggering - only stagger transitions of elements that enter the viewport at the same time, no more need to handle mobile interactions separately!
- CSS selectors (`[aos]`, `[aos-children] > *`, etc.) are used for transitions, while JS handles duration and delay calculations and applying `in-viewport` class when an element is in view
- Intersection Observer is used for efficient viewport detection, with threshold configurable via `aos-threshold` attribute

## How to Use

### Embedding the Script

`Site settings` > `Custom Code` > `Head code`

```
<script src="https://cdn.jsdelivr.net/npm/@jankocian/flowsnip-better-animations@1"></script>
```

Do not use `async` for the script tag to ensure the styles are injected immediately.

### Basic Usage

- `aos` - Marks an element to be animated on scroll
- `aos-children` - Marks an element whose children will be animated
- `aos="fade-in"`, `aos-children="fade-in"` (optional) - Defines the animation type, default is `fade-up`
- `aos-duration` (optional) - Defines the duration of the animation for itself and/or nested elements 400ms
- `aos-stagger` (optional) - Defines the stagger delay for itself and/or nested elements, default is 150ms
- `aos-threshold` (optional) - On body element - defines the visibility threshold for triggering animations, default is 0.2 (20 %)

### Examples

```
<div>
  <div aos aos-duration="400">Content 1</div>
  <div aos="fade-in" aos-duration="800">Content 2</div>
</div>

<ul aos-children aos-duration="300" aos-stagger="50">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

<br>

---

<br>

_This project was bootstrapped with [Finsweet Developer Starter](https://github.com/finsweet/developer-starter)._
