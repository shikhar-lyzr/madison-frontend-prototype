# Madison front-end prototype

The clickable front end of Madison, a product for a bank's second line in three sections: Regulatory change, Assurance (control testing) and Third parties. Use it as the reference for how each screen looks and behaves while you build the product.

- Prototype, live: https://madison-process-model.vercel.app/prototype/
- Design system, live: https://madison-process-model.vercel.app/design-system/

Wireframes say what is on a screen. The design system says how it looks. Wireframe plus design system is the UI, and this prototype is that sum for the main journeys.

## Run it locally

Static HTML, CSS and JavaScript. No build step, no dependencies. The pages link with root paths (`/prototype/...`, `/design-system/...`), so serve the repository root:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/prototype/ and http://localhost:8000/design-system/
```

Opening the files directly from disk will not resolve those links.

## What is here

| Path | What |
| --- | --- |
| `prototype/` | Assurance screens (Home is `index.html`) |
| `prototype/reg-change/` | Regulatory change screens |
| `prototype/tprm/` | Third parties screens |
| `prototype/screens.html` | Every screen, by section, with its wireframe id (B01, B22 and so on) |
| `prototype/control-testing.html` | Control testing end to end: every control testing screen in the order the story runs, numbered |
| `prototype/ask.js` | The Ask Madison panel (a mock, see below) |
| `design-system/tokens.css` | Every token as a CSS variable: colours, type, spacing, radius, shadow, motion, z-index |
| `design-system/tokens.json` | The same tokens as data, each with what it is for |
| `design-system/bundle.css` | The components as plain CSS classes, all named `md-` |
| `design-system/components/` | One live preview page per component |
| `design-system/icons/` | The 36 icons as SVG. Their nearest Lucide names are on the design system page |
| `design-system/madison-design-system.zip` | Tokens, stylesheet, icons and every component's guide in one download |

## How to use it

- Build each screen from its wireframe, styled with `tokens.css` and `bundle.css`. Take values from the tokens, never from a prototype page.
- The prototype pages are generated, so their markup uses inline styles. Read them for layout, states and behaviour, not as code to copy. The design system's component previews are the markup to copy.
- One rule decides the look of every screen: what is yours is raised and carries the only teal, everything else lies flat, and a stop is ringed in red. The design system's overview explains it.

## Behaviour worth reading in the source

All of it is in the small script at the end of each page, and in `prototype/ask.js`.

- **Drawers**: `[data-drawer]` with a `[data-tab]` toggle. One open at a time, Escape or the scrim closes it.
- **Rows that open a record**: `tr[data-go]` and calendar rows. A click anywhere on the row follows its link, unless the click was on a control.
- **Buttons that wait for choices**: `button[data-need]` stays disabled until every radio group, the required words or the required fields are filled, then turns teal and goes to `data-next`. A choice can carry its own `data-next` and `data-label`: picking it renames the button and sends it there (Hold, Decline, Change the set, Insufficient).
- **Steps**: a finished station opens its view-only record. With none, it opens the Activity drawer (`[data-open-drawer]`).
- **Roles (RBAC)**: the person at the foot of the rail (`[data-role-menu]`) opens the bank's roles. Each opens that role's Home, and each rail shows only the sections that role sees: the testing analyst Regulatory change and Assurance, the Head of Compliance Assurance and the compliance officer all three, the third-party risk manager Third parties, the control owner and internal audit Regulatory change (audit read only), the platform administrator Platform.
- **Journey**: Back and Next beside All screens walk the control testing screens in `control-testing.html`'s order.
- **Actions board**: To do and Worth a look side by side. Seen strikes an item through, drops it to the foot of its column and lowers the count.
- **Ask Madison**: docked at the bottom of every page, opened by a click or the `/` key. The answers are a mock that only quotes what the page shows. A real agent replaces one function, `answer(question)`, which resolves to `{ text, items }`: a sentence and the page items it cites. It is exposed as `window.MadisonAsk.answer`.

## What is not here

- No backend, agents or real data. Northgate Community Bank and everyone in it are fictional, and every value is synthetic.
- No dark theme yet. Build light.
- The generator that produces these files lives in a private repository. Changes arrive as new versions of the files here, so read and reference this repository rather than sending changes to it.
