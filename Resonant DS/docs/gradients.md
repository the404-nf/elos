# Gradients

Resonant uses gradients for light, never for decoration. They make the pink feel alive: the Bloom header, a beam on hover, a chart that fills in. Under that, surfaces stay flat. This section lists every gradient the system allows, where each one goes, and how they're built.

## Rules

- **Pink leads.** Every gradient starts at or centers on pink. Coral and peach appear only at the far end of a pink gradient, never alone and never as a flat fill.
- **One loud gradient per view.** The Bloom header is it. Below the header, at most one featured element per view gets `gradient-edge` or `gradient-glow`.
- **Built from tokens.** Stops are color tokens (`color-bloom-*`, `color-gradient-*`, `color-accent`), so every gradient follows the theme. Don't write hex values in a gradient.
- **Many stops, no banding.** Soft fades use eight to ten stops (`gradient-bloom`, `gradient-fade`). A two-stop fade over a large area bands, especially in dark.
- **Never behind text that has to be read.** Text sits on flat surfaces or on the Bloom, and the Bloom has its own text color (`color-text-on-bloom`).
- **Never a state.** Gradients don't mean success, danger, selected or disabled. States use flat status colors and a word.
- **Not on controls.** Buttons, chips, fields and switches are flat. A gradient appears on hover only as light: the beam and the glow shadows.
- **Motion is optional.** If a gradient moves (the Bloom turns, the beam runs, the trail falls), it stops under reduced motion and the still version reads on its own.

## The set

| Gradient | Built from | Where | Not for |
|---|---|---|---|
| `gradient-bloom` | `color-bloom-light-1..3`, `color-bloom-warm-1`, each over many stops, on `color-bloom-ground` | The Bloom header (PageHead) | Anywhere else. One per screen. |
| `gradient-text` | `color-gradient-text-start` to `color-gradient-text-end`, 100deg | Display words at 24px and up (pink text, case 3) | Labels, body, links, buttons |
| `gradient-accent` | `color-gradient-accent-start` to `color-gradient-accent-end`, 90deg | Data bars and meters that show amount | Progress of a task (flat `color-accent`), status |
| `gradient-edge` | accent start, accent end at 60%, `color-gradient-text-end`, 135deg | The 1.5px border of one featured card per view | Inputs, buttons, every card in a grid |
| `gradient-fade` | `color-accent` at 34% fading to transparent over ten stops | The area under a chart line | Card backgrounds |
| `gradient-trail` | transparent, `color-accent` at 60%, transparent | The light running down a timeline | Static dividers |
| `gradient-glow` | `color-accent` at 10%, radial from below | Inside the same featured card as `gradient-edge` | More than one card per view |
| `gradient-shimmer` | `color-surface-sunken` and `color-surface-overlay` | Skeleton loading | Anything that is loaded |

The beam (`.rs-card--interactive::before`) is a conic gradient too. It isn't a variable because it reads its angle from the animated `--rs-beam-angle`. The recipe is in `docs/bloom-and-motion.md`.

## Using them

The gradients are `gradient.*` tokens in `tokens/semantic.json` (DTCG type `gradient`: one layer or a list of layers, each with stops that reference color tokens and an optional alpha). The build emits each as a CSS custom property whose stops are `var()` references, so a light island inside a dark page gets light stops. Contracts bind `background` to a gradient token like any other binding.

## Adding a gradient

1. Check the set first. A new gradient is rare: most needs are a flat color or an existing recipe.
2. Start from pink, use only color tokens as stops, and add stops until it doesn't band on a dark canvas.
3. Write down where it goes and where it doesn't, and add it to this table and the Gradient card.
4. Check both themes, and check that nothing on top of it has to be read.
