# Accessibility

Target: WCAG 2.2 AA in both themes. Text pairs hold 4.5:1, large text (24px and up) 3:1, and borders, focus rings, icons and graphics that carry meaning 3:1.

## Checked pairs

Ratios are computed from the resolved token values, with translucent tints composited on the surface they sit on.

| Foreground | Background | Dark | Light | Needs |
|---|---|---|---|---|
| `text-primary` | `surface-canvas` | 17.6 | 19.6 | 4.5:1 |
| `text-primary` | `surface-raised` | 16.4 | 18.2 | 4.5:1 |
| `text-primary` | `surface-overlay` | 15.4 | 19.6 | 4.5:1 |
| `text-primary` | `surface-sunken` | 14.6 | 17.0 | 4.5:1 |
| `text-secondary` | `surface-raised` | 7.7 | 6.2 | 4.5:1 |
| `text-secondary` | `surface-sunken` | 6.8 | 5.8 | 4.5:1 |
| `text-tertiary` | `surface-raised` | 5.9 | 4.9 | 4.5:1 |
| `text-tertiary` | `surface-sunken` | 5.2 | 4.6 | 4.5:1 |
| `text-link` | `surface-raised` | 8.5 | 6.4 | 4.5:1 |
| `text-danger` | `surface-overlay` | 7.5 | 7.0 | 4.5:1 |
| `action-primary-foreground` | `action-primary-background` | 17.9 | 19.6 | 4.5:1 |
| `action-secondary-foreground` | `action-secondary-background` | 14.6 | 17.0 | 4.5:1 |
| `action-danger-foreground` | `action-danger-background` | 5.1 | 5.1 | 4.5:1 |
| `status-accent-foreground` | `status-accent-background` | 7.0 | 5.7 | 4.5:1 |
| `status-info-foreground` | `status-info-background` | 6.7 | 7.8 | 4.5:1 |
| `status-success-foreground` | `status-success-background` | 7.6 | 4.7 | 4.5:1 |
| `status-warning-foreground` | `status-warning-background` | 8.4 | 5.8 | 4.5:1 |
| `status-danger-foreground` | `status-danger-background` | 6.4 | 5.9 | 4.5:1 |
| `text-inverse` | `surface-inverse` | 17.9 | 19.6 | 4.5:1 |
| `text-on-accent` | `accent` | 5.9 | 5.9 | 4.5:1 |
| `text-on-bloom` | `bloom-ground` | 17.4 | 6.8 | 4.5:1 |
| `border-focus` | `surface-raised` | 18.0 | 18.2 | 3:1 |
| `border-focus` | `accent` | 3.3 | 5.9 | 3:1 |
| `accent` | `surface-raised` | 5.4 | 3.1 | 3:1 |
| `accent-strong` | `surface-sunken` | 5.5 | 4.1 | 3:1 |
| `border-strong` | `surface-overlay` | 4.6 | 3.6 | 3:1 |

## Rules that keep these true

- Text on the Bloom header is only `text-on-bloom`. It holds above 4.5:1 against the brightest light in each theme.
- No white text on the brand pink (3.3:1). Text on a pink fill is `text-on-accent` (ink).
- Progress on a light track uses `accent-strong`: plain `accent` on `surface-sunken` in light is 2.9:1.
- The focus ring is never pink. It is ink in light and white in dark, solid 2px, 2px offset, and it holds 3:1 on every surface and on accent fills.
- Status is never color alone: badges, alerts and toasts carry a word.
- Hit areas are at least 44px. The small button (34px) gets its hit area from padding in its container.
- All motion, including the Bloom rotation, the beam and the chart draw, stops under `prefers-reduced-motion`.

## Keyboard

Every interactive component lists its keys on its page. Behavior components (Dialog, Tabs, Switch, Tooltip, Popover, Menu) get focus management and roving tab index from Zag.js.
