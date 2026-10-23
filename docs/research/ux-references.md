# UX references for the portal

Reviewed 2026-10-24 by browsing each site's listing, preview and editing flows. The question for every site: what does it do that the Elos portal should do, and what should Elos deliberately not copy because Elos edits contracts and tokens, not CSS.

## What each site does well

### Theme and token editors

**tweakcn** (shadcn theme generator). Left: every token as a control, grouped in tabs (Colors, Typography, Other). Right: a full composed application preview (Cards, Dashboard, Application, Marketing tabs) that re-themes as you drag. Light and dark toggle on the preview. Presets, Import, Share, Save, Code, Export to Figma, "Open in" other tools. Colors are grouped in pairs: background and foreground together under Primary, Secondary, Accent, Card, Popover, Muted, Destructive. Typography is three family selects and a letter-spacing slider. Other is radius, spacing and shadow sliders with a row of shadow presets. The lesson: tokens are edited against a realistic page, never a swatch grid, and the control for a token is chosen by type.

**Ant Design theme editor.** Two levels: Global and Component. Global shows seed tokens (colorPrimary, colorSuccess, borderRadius) and expands each into its derived map tokens, so the user sees the chain from one decision to the ten values it produces. Component level lists each component's own tokens and, per variant example, the "related tokens" that produce that look. Preview is a whole page with zoom and a Page or Overview switch. The lesson: show the chain, and show per component which tokens matter for what you are looking at.

**daisyUI theme generator.** Colors shown as three tints with contrast text drawn on them, so legibility is visible at a glance. Radius is set per family of components (boxes, fields, selectors), not per token. Sizes are a scale with a base step. Themes are a list you can clone with one gesture. The preview is dense: thirty components at once. The lesson: group controls by what they affect, and preview contrast, not just color.

**shadcn.** The old themes page became "create", a project builder. Component pages carry a headless engine switch (Base UI, React Aria, Radix) with the same examples, which is exactly Resonant's behavior seam made visible. Every page has Copy Page, llms.txt, a Skills page and an MCP server, so agents are first-class readers. Blocks are full screens with a viewport switch and "Open in v0".

**Astryx (Meta).** Themes page: a list of named themes on the left (Neutral, Stone, Matcha, Y2K, Butter), the same storefront on the right re-themed instantly, with "Use this theme" and "Try in Playground". Positions itself as "agent ready". The lesson: a theme is a thing you browse and compare on one real page, and the playground is where you then tweak it.

**Reshaped.** "Design system for you and your agents". Figma plugin syncs a theme from a theme.json generated in code, and the theme name becomes a Figma variables mode. New themes generated from a single color. The lesson: a theme is a named artifact that moves between code and design tools, and generating a starting theme from one brand color lowers the first step.

### Component documentation

**MUI.** Every example has Copy, Edit in StackBlitz, Expand code, and a sentence of guidance before it. The component page has a side table of contents by example and a chip row linking Figma, Sketch, Bundle size, Source and Material Design spec. Theming has an "agent skill" to give an AI assistant full theming context.

**Primer.** Component listing as cards with a wireframe-style illustration and a one-line description. Component page: platform status row (React Ready, Rails Ready, Figma), tabs Overview, Guidelines, Accessibility, then examples with Copy, Reset and Open in StackBlitz. Variant sections start with a sentence of rules per variant ("Primary: highest-priority action; use sparingly. Never put more than one in a group"). There is a component status page across platforms, and a Token Names page. The lesson: rules sit next to the variant they govern, and status is per platform.

**Chakra.** Component overview as a grid of cards with small schematic illustrations and a description. Tokens follow the W3C format with value and description, semantic tokens separate from base tokens, and "Agent Skills" offered as the alternative to reading docs. The lesson: schematic thumbnails read faster than real renders at grid size; the token model is the same as ours.

**Headless UI.** Preview and Code toggle on every example; the docs are the API and the examples, nothing else.

### Galleries and registries

**Untitled UI.** Components page is a grid of cards, each a mini render on a light tile with the name and "n components · n variants" counts. Sidebar groups by base components and application sections. The lesson: counts on cards tell you how deep a component goes before you open it.

**Kibo UI.** Listing in the sidebar by domain (Collaboration, Project management, Code, Forms, Images, Finance). Each page: Code or Preview toggle over the example, one install command, a Features list. Positions itself as "the missing parts of shadcn". The lesson: domain grouping for composed components, and a Features list that is short bullets.

**AlignUI Pro blocks.** Blocks grouped by page type (landing page, application), each group a card with the count of blocks, a search over components and blocks. Paid, so previews are placeholders until unlocked.

**Tailark.** Blocks shown as large real previews, with a viewport width toggle and "Preview" and "Code" per block. The hero of the site is the gallery itself.

**21st.dev.** A registry: search, categories with counts, "top today" and "new and noteworthy", bookmarks, publish. Each component ships with a prompt so an AI agent can reproduce it, and the site sells a "copy prompt" flow next to "copy code". The lesson: distribution to agents is a product surface, and ranking by use is navigation.

## Cross-cutting patterns

1. **Edit against a real page.** Every good editor previews tokens in a composed screen, not in a swatch table. tweakcn, Ant, daisyUI and Astryx all do this. Elos previews a token in the components that bind to it, which is better targeted but thinner. The portal needs at least one composed "page example" built from Resonant that every token edit previews against.
2. **Controls by type, grouped by effect.** Color pairs (background with foreground), radius by component family, sizes as a scale, typography as family plus a few sliders. Nobody edits a flat list of 97 inputs.
3. **Show the chain.** Ant expands seed tokens into map tokens. Elos has the same structure, primitive to semantic to component, and already shows "also changes" dependents. Make the chain a first-class view in both directions: what this token feeds, and what feeds it.
4. **Preview and Code everywhere.** Headless UI, Kibo, Tailark, Primer, MUI. Elos has it on the contract tab and in the part panel. It belongs next to every example too, and the code shown should be the composition tree, since that is what agents write.
5. **Rules next to the variant.** Primer puts a sentence of guidance before each variant example. Elos has usage and guidelines, but shows them on a separate tab. Pull the relevant rule under each example.
6. **Status per platform.** Primer's React Ready, Rails Ready, Figma. Elos's equivalent is channel support per component, which is already in the contract and should be a visible row on the component page.
7. **Cards with counts and schematic thumbnails.** Untitled's "n variants", Chakra's and Primer's illustrations. Real renders in a grid can be noisy; a consistent thumbnail reads faster.
8. **Agents are readers.** shadcn, Chakra, MUI, Reshaped, Astryx and 21st all expose skills, llms.txt, MCP or prompts. Elos is ahead here with contracts and MCP, but the portal does not show it: every component page should have "Copy for agent" (the contract, the composition examples, the Markdown guidelines) and the MCP connection details.
9. **Named themes as browseable things.** Astryx and daisyUI list themes with instant re-theme of one page. Elos has theme overlays in the model; the portal should list them and allow cloning one into a new brand overlay.
10. **Direct manipulation is rare.** None of the fifteen sites drag handles on a canvas. tweakcn and daisyUI use sliders. The "Figma-like" ask is better served by sliders that snap to the token scale, plus click-to-select on the preview, which Elos already has.

## What not to copy

- Editing CSS values directly. tweakcn and daisyUI write raw colors and pixel values. Elos writes tokens and bindings so that the contract stays the source of truth and agents keep a finite vocabulary. The controls can look like tweakcn's; what they write must stay tokens.
- A flat list of every token. The grouped, typed controls are the point.
- Blocks as code snippets. In Elos a block is a composition tree, validated against the catalog, so a block gallery is a gallery of trees that render on every channel.
- Illustrated thumbnails hand-drawn per component. Elos can render a scaled, static example from the contract, which stays correct when the contract changes.

## Recommendations for the portal

Ordered by value for the feedback already given.

### Now

1. **Composed page examples.** Add two or three "page" compositions to Resonant (a settings form, a dashboard card grid, a dialog over a list) as example trees. The token editor previews every token against them, in both themes, besides the components that bind to it. This is the tweakcn and Ant pattern, and it is what makes a radius or spacing edit legible.
2. **Typed, grouped token controls.** In the token editor, show the control by type: color picker with contrast text drawn on the swatch, slider snapped to the scale for dimensions with the scale shown as ticks, select for font family and weight. In the token list, group semantic tokens by role (surface, text, border, action, status) with background and foreground pairs on one row.
3. **Chain view.** On a token page show "fed by" and "feeds" as two short lists with previews, both clickable.
4. **Preview and Code on every example.** Under each example in the component page, a toggle that shows the composition tree. Add "Copy for agent" that copies the tree, and a "Copy contract" button.
5. **Rules under variants.** On the Preview tab, when an example is selected, show the usage lines and guidelines that mention that variant or prop value.
6. **Channel support row.** A row of chips per channel (web, widget, slack, markdown) with native, degraded or unsupported, taken from the contract.

### Next

7. **Scale sliders on the canvas panel.** When a selected part binds padding, gap, radius or size to a token on a scale, show a slider whose stops are that scale's tokens. Dragging snaps to the next token and rewrites the binding. This is the honest version of the Figma ask.
8. **Component cards with counts.** Variants count, examples count, channel support dots, and a static scaled render instead of a live one.
9. **Themes page.** List theme overlays, re-theme one composed page per theme, clone a theme into a new brand overlay, generate a starting overlay from one brand color as Reshaped does.
10. **Blocks area.** Composition trees stored as blocks, rendered on every channel, searchable by intent, with "Copy for agent". This is the Elos answer to Tailark, AlignUI and 21st.

### Later

11. Shareable theme links and presets, as tweakcn.
12. Figma sync of themes as variable modes, as Reshaped.
13. Ranking and usage signals in listings, as 21st.
