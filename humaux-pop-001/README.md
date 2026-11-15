# POP — kinetic-typography design system

Second design system for huashu-motion, parallel to the paper/ink/gold brand
tokens. Reversed from the 《不代表 ≠ 不等于》 MV (jisunmusic × 代代姬,
Canvas 2D + WebGL, 139.68 BPM); the full teardown is in
`~/workspace/goals/video-production-via-huashu-motion/files/reverse-engineering-bu-daibiao-bu-dengyu.md`.

## Files

- `pop.css` — tokens, display type, texture backgrounds, UI components, HUD.
- `pop.js` — karaoke primitive, HUD driver, BPM helpers. Needs GSAP first.
- `index.html` — the system as a working film (humaux-pop-001, "Your AI Has
  Amnesia"), 16:9, 120 BPM. Copy the template and edit the scenes.

## Tokens

| token | value | use |
|---|---|---|
| `--pop-pink` | #FF5C8A | primary accent, stickers, fills |
| `--pop-cyan` | #35C4DC | secondary accent, offset shadow |
| `--pop-lavender` | #E9E2F7 | light section background |
| `--pop-purple` | #2D1B4E | dark section background |
| `--pop-cream` | #FFF9F0 | default background |
| `--pop-yellow` | #FFD23F | highlight, CTA background |
| `--pop-mint` | #7FDBCA | success / ON state |
| `--pop-ink` | #1A1A1A | main text on light backgrounds |

## Display type

`.pop-display` — Anton (Latin) + Noto Sans SC 900 (CJK), with the signature
dual-colour offset shadow: dark glyph, cyan copy at +0.055em, pink copy at
+0.11em (chromatic-aberration style). `.pop-display--on-dark` inverts it
(white glyph, pink then cyan offsets). `.pop-display--pink` is a pink glyph.

## Karaoke

`POP.karaoke(el)` wraps each character in a `.kara-char` span and returns
the spans; animate them with an elastic pop, never a whole-sentence fade:

```js
const chars = POP.karaoke(document.getElementById('hook-word'));
tl.fromTo(chars, { scale: 0, y: 46, opacity: 0 },
  { scale: 1, y: 0, opacity: 1, duration: 0.38, stagger: 0.05,
    ease: 'back.out(2.2)' }, OM.sfx('impact', at));
```

## UI components (all in pop.css)

- `.chat-bubble` — white bubble with tail; `.who` + `.msg` inside.
- `.loadbar` (+ `.fill`) — track + fill; animate the fill's width. Modifiers
  `.loadbar--cyan`, `.loadbar--mint`.
- `.checklist` — `.row` with `.num` circle + `.mark` ✓/✗; rows alternate
  pink / blue automatically.
- `.sticker` — rotated rounded label, hard shadow; `--pink`, `--cyan`,
  `--mint` variants.
- `.toggle` — pill + knob; add the `on` class to flip it (CSS transition
  slides the knob). `.state.off` / `.state.on` labels.
- `.pop-card` — white card with `.ic` circle, `.t` title, `.d` desc.
- `.dialog` — hard border + cyan offset shadow, `.dlg-title` + `.dlg-body`.

## Texture backgrounds (apply to a `.scene`)

`.bg-dots`, `.bg-dots--pink`, `.bg-dots--dark`, `.bg-halftone`,
`.bg-grid`, `.bg-rays`, `.bg-solid-pink`, `.bg-solid-yellow`,
`.bg-solid-purple`, `.bg-solid-cream`. Switch one per section — the
background change is what marks a new section.

## HUD

`#hud` is a four-corner persistent overlay (markup in index.html):

- top-left: film title + section label (one `.sec` div per section,
  switched with `tl.set` display — same seek-safe pattern as captions).
- top-right: counter (e.g. `MEMORY 0%` → `100%`).
- bottom-left: `BPM · BAR` readout (ticks with playback).
- bottom-right: progress bar + percent.

Drive it from the timeline:

```js
POP.hud.init({ title: 'HUMAUX POP-001', bpm: 120 });
POP.hud.tick(tl);
POP.hud.counterTo(tl, 0, 100, 0, VOICE_END, v => 'MEMORY ' + Math.round(v) + '%');
POP.hud.progressTo(tl, 0, VOICE_END);
```

## BPM timeline

`POP.bpm = 120` → `POP.beat()` = 0.5 s, `POP.barAt(n)` = bar n in seconds.
Put every scene cut on `B(n)` (beat n) so the picture locks to the music
bed. `om sound` picks a music BPM that best fits the cut times, and the
`pulse` style's range [116, 124] contains 120, so a 0.5 s cut grid lands
on 120 BPM exactly. Use `OM.music({ style: 'pulse' })` for the bed.

## Gotchas (from the iteration log — don't relearn these)

- Root needs `data-composition-id` + `data-width` + `data-height`.
- After a scene exits, set `visibility: hidden` (else the checker reports
  text-overlap and ghost frames appear).
- Motion uses `transform` (x/y/scale), never `left`/`top` in tweens.
- Captions are per-sentence divs switched with `tl.set(display)` — never
  `tl.call`.
- Never write a literal `<video>` inside a JS comment (the checker
  misreads it as a video source).
- `* { box-sizing: border-box; }` is set in pop.css; keep it.
