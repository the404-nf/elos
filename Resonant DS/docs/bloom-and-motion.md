# Bloom and motion

The recipes behind the signature moments. Each one is built from tokens and stops under `prefers-reduced-motion`.

## The Bloom header

A ground color with four soft lights over it, turning slowly, with a little grain. Use the PageHead pattern (`.rs-bloom`) rather than rebuilding it.

- Ground: `color-bloom-ground` (pink 900 in dark, pink 400 in light).
- Lights, each a radial gradient that fades out over many stops so there is no banding. Together they are `--gradient-bloom` (see the Gradients section):
  - `color-bloom-light-1` at 32% 42%, size 18%
  - `color-bloom-light-2` at 68% 44%, size 21% (plum in dark)
  - `color-bloom-light-3` at 55% 58%, size 23%, the brightest pink
  - `color-bloom-warm-1` (coral) at 72% 52%, size 10%, faint
- In dark the lights layer sits at 62% opacity, so the header glows rather than shouts.
- The lights sit on a 2000px square centered in the header and rotate once every `motion-duration-ambient` (48s), linear.
- Grain: fractal noise at 14%, `mix-blend-mode: overlay`.
- Coral and peach stay small and faint. The header must read as pink.

## Hover glow

```css
.rs-btn:hover { box-shadow: var(--shadow-glow); }
.rs-btn[data-variant="secondary"]:hover { box-shadow: var(--shadow-glow-soft); }
```

The control never moves on hover. The glow fades in over 300ms with `motion-easing-out`.

## The beam

Interactive cards (a card that is a link) show a short light running around the border on hover and focus. No outside shadow, no lift.

```css
@property --rs-beam-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
.rs-card--interactive::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px; opacity: 0;
  background: conic-gradient(from var(--rs-beam-angle), transparent 0 55%, var(--color-accent) 72%, var(--color-gradient-text-end) 80%, transparent 90%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  transition: opacity 350ms var(--motion-easing-standard);
}
.rs-card--interactive:hover::before { opacity: 1; animation: rs-beam var(--motion-duration-beam) linear infinite; }
@keyframes rs-beam { to { --rs-beam-angle: 360deg; } }
```

Use the beam on cards and for AI moments (a search-by-intent field), not on buttons.

## Chart loading and draw

1. While data loads, show a faint wave in `color-border-default` with a short `color-accent` shimmer sweeping across it, and a mono label with a pulsing dot ("Loading agent reads").
2. When data arrives, cross-fade to the chart. The line draws left to right over `motion-duration-draw` with `motion-easing-out` (`stroke-dasharray` and `stroke-dashoffset`).
3. The area fill reveals in step with the line (`clip-path: inset(0 100% 0 0)` to `inset(0)`). The fill is `color-accent` fading to transparent over ten stops.
4. Secondary series fade in after the line. The last point appears with a ring that pulses outward every 2s.

Line stroke is `color-accent-strong`, 2.5px, round caps and joins.

## Timeline

The current item's dot is `color-accent` with a `color-accent-soft` halo and a ring that pulses outward every 2s. A 44px light in `color-accent` runs down the line from the current item and fades out before the last one, every 2.6s. Items fade in one after another, 140ms apart.

## Entrances

Content blocks rise 12px and fade in over 600ms with `motion-easing-out`, staggered 60ms apart. Big numbers count up over 1.2s with an ease-out curve.
