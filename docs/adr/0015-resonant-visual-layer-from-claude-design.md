# 0015. Resonant's visual layer comes from the Claude Design round; gradients, animation, fonts and assets join the spine

Status: Accepted, 2026-10-24

## Context

The portal looked generic and Resonant's values were placeholders (ADR 0003 said so). The founder ran a refinement round in Claude Design and approved a direction on 2026-10-24: dark by default, one brand pink, a "Bloom" header per screen, three type families, an icon set and spot illustrations drawn for Resonant, with a brand book, a layout guide, an accessibility table and sixteen design decision records. The export lives in `Claude outputs/` (untracked): `approved/elos-screens-FINAL.html` is the visual reference, `resonant-design-system/` holds the tokens (Claude Design's flat format), a hand-written CSS bundle, one README per component with a "Changes in this system" table, and `docs/contracts.md` consolidating 28 contract edits and three contracts to add.

This is also the first run of a case Elos wants to sell: a team with a design system that exists as files and CSS brings it into Elos. The spine (ADR 0004) must absorb it without a parallel format.

## Decision

1. **The artifact is adopted as Resonant's look; the spine stays.** Tokens were converted into the DTCG tiers (ADR 0003), light as the base and dark as the overlay, and the portal opens in dark. The component READMEs and `docs/contracts.md` are the spec for the contract edits; the hand-written bundle and the FINAL screens are references to diff the emitted CSS against, never copied into the repo. Contracts remain the source (ADR 0001).
2. **Normalizations taken while converting.** A token that was both a value and a group becomes `.default` (`color.accent.default`). Type styles are semantic groups `type.<style>` with `family`, `size` and `weight` aliasing primitives, and `line-height` and `tracking` as the style's own values. The size ramp gained `base` (14), `2xl` (44) and `3xl` (56); the 12.5px code size rounds to `xs` (12). Semantic radius and spacing alias primitives. Shadows stay raw strings with alpha hex, as a primitive. The small control height stays at the approved 34px; the contract guideline says the container supplies the 44px hit area.
3. **Gradients are tokens.** `$type: "gradient"` holds a layer or a list of layers (`kind`, `angle`, `at`, `size`, `stops`), each stop a color token reference with an optional `alpha`. The emitter writes `var()` stops (and `color-mix` for alpha), so a gradient follows the theme of the element it paints. Nine live in `semantic.json` under `gradient.*`.
4. **Animation is declared, not written.** A contract may carry `keyframes` (name, offsets, declarations that may reference tokens) and a part an `animation` (which keyframes, duration and easing tokens, iterations, and the root state that starts it). The emitter writes `animation` and `@keyframes`, and the existing reduced-motion guard stops them.
5. **Decorative parts are real elements.** The Bloom lights and grain, the beam frame and the beam itself are parts (empty spans with `aria-hidden`) styled through tokens and the whitelisted styles, not pseudo-elements. The style whitelist grew with the effects a token cannot carry (`opacity`, `mix-blend-mode`, `background-image`, `backdrop-filter`, masks, `clip-path`) and the SVG properties inline icons need.
6. **Fonts are in the manifest.** `system.json` lists `fonts` (family and URL); the token CSS imports them, so the portal, the playground and the static export load the same faces the font tokens name.
7. **Assets are files in the directory.** Icons and illustrations are `assets/icons/<name>.svg` and `assets/illustrations/<name>.svg`, read into the catalog, served over REST and MCP, and rendered by `ds.icon` and `ds.illustration` contracts whose `name` prop is the enum of files. The SVG rules (grid, stroke, one floating accent through a CSS variable) are the artifact's style guides.
8. **The design system's own documents live with it.** The brand book, the layout guide, the icon and illustration guides and the DDRs move into `Resonant DS/docs/`; `docs/adr/` keeps Elos decisions only. The layout guide's page types become page examples (`pages/*.page.json`) as the contracts they need land, because that is what agents read.

## Consequences

- Every contract edit in the artifact's tables is expressible; `ds.page-head`, `ds.icon` and `ds.illustration` are new contracts. The portal's hand-written `page-head.tsx` is replaced by the contract, as ADR 0014 requires.
- The conversion was a one-off script over the Claude Design format. The import story on the roadmap (Phase 1, item 7) gets its first concrete source format from this run.
- Gradient and animation are additions to the contract schema; the JSON schemas in `dist/` regenerate on build. Existing contracts are unaffected.
- The tokens page and the token editor need to render gradient values (a swatch painted by the resolved CSS) and the manifest fonts.
