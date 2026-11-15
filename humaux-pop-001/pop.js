/* ==========================================================================
   POP helpers — karaoke text, HUD, BPM-driven timeline.
   Loaded by templates/pop/index.html (and any project copied from it).
   Depends on GSAP (vendor/gsap.min.js) being loaded first.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- BPM: the timeline's metronome ---------------------------------- */
  /* 120 BPM -> beat = 0.5 s, bar (4/4) = 2.0 s. Scene cuts and text pops
     land on beatAt(n) so the picture locks to the music bed; `om sound`
     picks a music BPM that best fits the cut times (see cli/lib/score.js
     pickBpm), and the pulse style's range [116, 124] contains 120, so the
     bed lands on 120 exactly when cuts sit on the 0.5 s grid. */
  var POP = {
    bpm: 120,
    beat: function () { return 60 / this.bpm; },
    beatAt: function (n) { return n * this.beat(); },
    barAt: function (n) { return n * 4 * this.beat(); },
    /* bar.beat readout for the HUD, e.g. t=6.4 at 120 BPM -> "BAR 04.2" */
    barLabel: function (t) {
      var beats = t / this.beat();
      var bar = Math.floor(beats / 4) + 1;
      var beatInBar = Math.floor(beats % 4) + 1;
      return 'BAR ' + String(bar).padStart(2, '0') + '.' + beatInBar;
    },
  };

  /* ---- karaoke: per-character pop-in ---------------------------------- */
  /* Wraps every character of el in a .kara-char span and returns the spans
     so the timeline can animate them with an elastic overshoot:
         const chars = POP.karaoke(el);
         tl.fromTo(chars, {scale: 0, y: 46, opacity: 0},
           {scale: 1, y: 0, opacity: 1, duration: .38, stagger: .05,
            ease: 'back.out(2.2)'}, at);
     Spaces become non-breaking spaces so word gaps survive the split.
     Never fade a whole sentence in — pop it char by char. */
  POP.karaoke = function (el) {
    var text = el.textContent;
    el.textContent = '';
    var spans = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var s = document.createElement('span');
      s.className = 'kara-char';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(s);
      spans.push(s);
    }
    el.appendChild(frag);
    return spans;
  };

  /* ---- HUD: four-corner persistent overlay ---------------------------- */
  /* The HUD is a fixed overlay (#hud) whose fields are updated by the
     timeline. Counter and progress are driven by time so they move even
     when no text is on screen (the reference MV's "always moving" feel).
     Usage:
         POP.hud.init({ title: 'HUMAUX POP-001', bpm: 120 });
         POP.hud.section('#2 PROBLEM', 4.0);   // sets label at time t
         POP.hud.counterTo(100, 22.0, 4.0);    // 0 -> 100 over 4 s
         POP.hud.progressTo(1, 0, 28.0);       // 0 -> 100% over the film
     All of these return GSAP tweens / timeline positions so they can be
     placed on the main timeline. The HUD element itself is created by
     POP.hud.init; the markup lives in index.html as #hud. */
  POP.hud = {
    _el: null,
    _fields: null,
    _state: { section: '', counter: 0, counterLabel: '', progress: 0 },
    init: function (opts) {
      opts = opts || {};
      this._el = document.getElementById('hud');
      if (!this._el) return this;
      this._fields = {
        title: this._el.querySelector('.hud-tl .title'),
        counter: this._el.querySelector('.hud-tr'),
        bpm: this._el.querySelector('.hud-bl'),
        fill: this._el.querySelector('.hud-br .fill'),
        pct: this._el.querySelector('.hud-br .pct'),
      };
      if (opts.title && this._fields.title) this._fields.title.textContent = opts.title;
      if (opts.bpm) POP.bpm = opts.bpm;
      this._render(0);
      return this;
    },
    _render: function (t) {
      var f = this._fields;
      if (!f) return;
      if (f.counter) f.counter.textContent = this._state.counterLabel;
      if (f.bpm) f.bpm.textContent = POP.bpm + ' BPM · ' + POP.barLabel(t);
      if (f.fill) f.fill.style.width = (this._state.progress * 100).toFixed(1) + '%';
      if (f.pct) f.pct.textContent = Math.round(this._state.progress * 100) + '%';
    },
    /* Section label: switched seek-safely by the timeline with tl.set on
       the .sec divs (same pattern as captions — one div per section, show
       one, hide the rest). Do NOT set it imperatively here: a direct write
       runs once at load and would leave the last section showing from
       frame 0. The timeline owns the switching; see index.html. */
    section: function () { return this; },
    /* Counter: animate the top-right number from `from` to `to` over
       `dur` seconds starting at `at`. label is a function(value)->string,
       e.g. (v) => 'MEMORY ' + Math.round(v) + '%'. */
    counterTo: function (tl, from, to, at, dur, label) {
      var self = this;
      var o = { v: from };
      self._state.counterLabel = label(from);
      tl.to(o, {
        v: to, duration: dur, ease: 'power1.inOut',
        onUpdate: function () {
          self._state.counter = o.v;
          self._state.counterLabel = label(o.v);
          self._render(tl.time());
        },
      }, at);
      return this;
    },
    /* Progress: animate the bottom-right bar 0..1 over the film. */
    progressTo: function (tl, at, dur) {
      var self = this;
      var o = { v: 0 };
      tl.to(o, {
        v: 1, duration: dur, ease: 'none',
        onUpdate: function () {
          self._state.progress = o.v;
          self._render(tl.time());
        },
      }, at);
      return this;
    },
    /* Keep the BPM / BAR readout ticking with playback time. Call once;
       it installs a ticker that re-renders the readout from the
       timeline's current time. */
    tick: function (tl) {
      var self = this;
      var last = -1;
      var update = function () {
        var t = tl.time();
        var bar = POP.barLabel(t);
        if (bar !== last) { last = bar; self._render(t); }
      };
      if (global.gsap) global.gsap.ticker.add(update);
      return this;
    },
  };

  global.POP = POP;
})(window);
