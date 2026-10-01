// Ask Madison, docked at the bottom of every page with the rail. For now a mock: it reads what this page shows and
// answers with the rows, fields and lines it found, each one a click away from where it sits on the page.
// answer() is the one function a real agent replaces: it takes the question and resolves to { text, items }.
(function () {
  var box = document.getElementById('ask'); if (!box) return;
  var form = box.querySelector('form'), input = box.querySelector('.ask-input'), send = box.querySelector('.ask-send'),
      log = box.querySelector('.ask-log'), hints = box.querySelector('.ask-hints'), body = box.querySelector('.ask-body'),
      sub = box.querySelector('.ask-sub'), key = 'ask:' + location.pathname;
  var WORK = box.querySelector('template[data-work]').innerHTML, MARK = box.querySelector('template[data-mark]').innerHTML;
  var big = [].find.call(document.querySelectorAll('main h1, main div, main span'), function (e) {   // the page's heading, as drawn
    return !e.children.length && parseFloat(getComputedStyle(e).fontSize) >= 22 && /[A-Za-z]{3}/.test(e.textContent); });
  var here = document.querySelector('aside a[aria-current="page"]'), where = here ? here.closest('nav').getAttribute('aria-label') + ' · ' +
      [].filter.call(here.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.nodeValue; }).join('') : '';
  sub.textContent = (big ? big.textContent : where || document.title.replace(/ · Madison$/, '').replace(/^\w+ · /, '')).replace(/\s+/g, ' ').trim();

  // ---------------- what this page shows: blocks of text a person could point at ----------------
  var INLINE = /^(SPAN|B|STRONG|EM|I|A|SVG|CODE|SMALL|BR|KBD|SUP|SUB|U|S|TIME|ABBR)$/;
  var SKIP = '[data-note],[data-legend],script,style,template,[data-tab]';
  function raw(el) {                                                         // parts laid side by side read with a separator
    var parts = [].map.call(el.childNodes, function (n) {
      if (n.nodeType === 3) return n.nodeValue;
      return n.nodeType === 1 && !n.matches(SKIP) ? raw(n) : '';
    });
    var kids = [].filter.call(el.children, function (k) { return !k.matches(SKIP) && k.textContent.trim(); });
    var loose = [].some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
    var row = kids.length > 1 && !loose && /flex|grid/.test(getComputedStyle(el).display) && !/inline/.test(getComputedStyle(el).display);
    return row ? parts.filter(function (x) { return x.trim(); }).join(' · ') : parts.join(' ');
  }
  function text(el) {
    return raw(el).replace(/\s+/g, ' ').replace(/(\s*·\s*)+/g, ' · ').replace(/^ · | · $/g, '').replace(/\s+([,.;:)\]])/g, '$1').replace(/([(\[])\s+/g, '$1').trim();
  }
  function href(el) { var a = el.closest('a[href]') || el.querySelector('a[href]'); return a ? a.getAttribute('href') : null; }
  var BLOCKS = (function () {
    var out = [], seen = new Set();
    var roots = [document.querySelector('main')].concat([].slice.call(document.querySelectorAll('[data-drawer]')));
    function take(el) { seen.add(el); el.querySelectorAll('*').forEach(function (e) { seen.add(e); }); }
    roots.forEach(function (root) {
      if (!root) return;
      var drawer = root.hasAttribute('data-drawer');
      root.querySelectorAll('table').forEach(function (t) {                                   // a table row, with its column heads
        var heads = [].map.call(t.querySelectorAll('thead th'), text);
        t.querySelectorAll('tbody tr').forEach(function (tr) {
          var cells = [].map.call(tr.children, text), s = cells.filter(Boolean).join(' · ');
          if (s) out.push({ el: tr, text: s, href: href(tr), drawer: drawer, heads: heads, cells: cells });
          take(tr);
        });
      });
      root.querySelectorAll('[style*="grid-template-columns"]').forEach(function (g) {         // a label and its value, side by side
        if (seen.has(g) || /repeat\(/.test(g.getAttribute('style')) || getComputedStyle(g).gridTemplateColumns.split(' ').length !== 2) return;
        var kids = [].slice.call(g.children); if (kids.length < 2 || kids.length % 2) return;
        if (kids.some(function (k) { return /^(SECTION|ARTICLE|NAV|TABLE|FORM)$/.test(k.tagName); })) return;   // cards side by side, not labels
        var pairs = [];
        for (var i = 0; i < kids.length; i += 2) {
          var l = text(kids[i]), v = text(kids[i + 1]);
          if (!l || !v || l.length >= 40) return;
          pairs.push({ el: kids[i + 1], text: l + ': ' + v, href: href(kids[i + 1]), drawer: drawer });
        }
        out.push.apply(out, pairs); take(g);
      });
      root.querySelectorAll('h1,h2,h3,p,li,div,a,header,label,section,article').forEach(function (e) {   // any other line
        if (seen.has(e) || e.closest('#ask,[data-tab],[data-note],[data-peek]')) return;
        if ([].some.call(e.children, function (k) { return !INLINE.test(k.tagName.toUpperCase()); })) return;
        var s = text(e); if (s.length < 3) return;
        out.push({ el: e, text: s, href: e.tagName === 'A' ? e.getAttribute('href') : href(e), drawer: drawer, title: e.tagName === 'H1',
                   nav: !!e.closest('nav,[data-o11],[role=tablist]') || (e.children.length > 1 && [].every.call(e.children, function (k) { return k.hasAttribute('data-o11'); })) });
        take(e);
      });
    });
    var dup = new Set();
    return out.filter(function (b) { var k = b.text.toLowerCase(); if (dup.has(k)) return false; dup.add(k); return true; });
  })();

  // ---------------- the mock: what the question is after, and the blocks that answer it ----------------
  var STOP = new Set(('a an the is are was were be been of on in to for and or what which who whom whose when where why how do does did i me my mine we us our ' +
    'you your it its this that these those there here any all some with from by at as about can could should would will has have had please show tell give ' +
    'list find page screen madison anything something thing things get got see need needs').split(' '));
  var ASKS = [
    { kind: 'summary', q: /\b(summar|overview|tl;?dr|about this page|explain this|what('?s| is) (this|here|going on|on this))/ },
    { kind: 'mine', q: /\b(me|my|mine|to do|todo|my turn|yours?)\b/, m: /^(?!.*\bNothing\b).*(Needs you|Your task now|Your decision|With you|for you|to decide|^You\b)/ },
    { kind: 'risk', q: /\b(late|overdue|past due|behind|risk|stopped|stuck|blocked|problem|issue|wrong|fail)/, m: /Stopped|At risk|\blate\b|past due|no owner|nothing sent|Declined|Missing|Fail|Insufficient|\bgap/i },
    { kind: 'who', q: /\bwho\b/, m: /^You\b|\b[A-Z][a-z]+ [A-Z][a-z]+\b|\[[^\]]*(owner|reviewer|contact|analyst|administrator)[^\]]*\]/ },
    { kind: 'when', q: /\b(when|due|date|deadline)\b/, m: /\bdue\b|\bsince\b|\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\[(due )?date\]/i },
    { kind: 'madison', q: /\b(madison|agents?|automat\w*|ai)\b/, m: /Madison/ }
  ];
  var LEAD = {
    mine: ['Nothing on this page is waiting on you.', 'This is yours:', 'These are yours:'],
    risk: ['Nothing on this page is late or stopped.', 'Flagged on this page:', 'Flagged on this page:'],
    who: ['I can\'t see who has this on this page.', 'Who is on it:', 'Who is on it:'],
    when: ['There are no dates on this page.', 'The date on this page:', 'The dates on this page:'],
    madison: ['Madison has nothing on this page.', 'What Madison did here:', 'What Madison did here:'],
    words: ['I can\'t find that on this page. Try an id, a name or a word from a row.', 'From this page:', 'From this page:']
  };
  function tokens(q) { return (q.toLowerCase().match(/[a-z0-9][a-z0-9.\-]*[a-z0-9]|[a-z0-9]/g) || []).filter(function (t) { return !STOP.has(t) && t.length > 1; }); }
  function score(b, ts) {
    var s = b.text.toLowerCase(), n = 0;
    ts.forEach(function (t) { if (s.indexOf(t) >= 0) n += /[\d\-.]/.test(t) ? 3 : 1; else if (t.length > 5 && s.indexOf(t.slice(0, 5)) >= 0) n += 0.5; });
    return n && b.cells ? n + 0.5 : n;
  }
  function best(list, ts, cap) {
    var scored = list.map(function (b) { return { b: b, s: score(b, ts) }; }).filter(function (x) { return x.s > 0; });
    var top = scored.reduce(function (m, x) { return Math.max(m, x.s); }, 0);
    return scored.filter(function (x) { return x.s >= top * 0.6; })
      .sort(function (a, b) { return b.s - a.s || a.b.text.length - b.b.text.length; }).slice(0, cap).map(function (x) { return x.b; });
  }
  function reply(kind, found) { var l = LEAD[kind]; return { text: l[Math.min(found.length, 2)], items: found }; }

  function answer(question) {
    var q = question.toLowerCase(), ts = tokens(question), ask = ASKS.find(function (a) { return a.q.test(q); });
    var result;
    if (ask && ask.kind === 'summary') {
      var lines = BLOCKS.filter(function (b) { return !b.title && !b.drawer; });
      var head = document.querySelector('main header'), meta = head ? BLOCKS.filter(function (b) { return head.contains(b.el) && !b.title; }).slice(0, 1) : [];
      var mine = BLOCKS.filter(function (b) { return !b.nav && ASKS[1].m.test(b.text); }).slice(0, 2);
      var risk = BLOCKS.filter(function (b) { return !b.nav && ASKS[2].m.test(b.text) && mine.indexOf(b) < 0; }).slice(0, 2);
      var items = meta.concat(mine, risk); if (!items.length) items = lines.slice(0, 3);
      result = { text: sub.textContent.replace(/[^.?!]$/, '$&.'), items: items.slice(0, 4) };
    } else if (ask) {
      var pool = BLOCKS.filter(function (b) { return !b.title && !b.nav && ask.m.test(b.text); });
      if (ask.kind === 'mine') {                                               // what is yours is raised: each raised card, by its first line
        var cards = [].slice.call(document.querySelectorAll('main [style*="0 18px 40px -16px"]'));
        var firsts = cards.map(function (c) { return BLOCKS.find(function (b) { return c.contains(b.el) && !b.nav; }); })
          .filter(function (b) { return b && !pool.some(function (p) { return cards.some(function (c) { return c.contains(p.el) && c.contains(b.el); }); }); });
        pool = firsts.concat(pool);
      }
      if (ask.kind === 'who') pool.sort(function (a, b) { return b.drawer - a.drawer; });
      var rest = ts.filter(function (t) { return !ask.q.test(t); });
      var hit = rest.length ? best(pool, rest, 4) : [];
      result = reply(ask.kind, hit.length ? hit : pool.slice(0, 4));
    } else {
      result = reply('words', best(BLOCKS.filter(function (b) { return !b.title && !b.nav; }), ts, 4));
    }
    return new Promise(function (done) { setTimeout(function () { done(result); }, 520); });   // as long as a glance at the page
  }

  // ---------------- the panel ----------------
  var thread = [];
  try { thread = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (e) { thread = []; }
  var seed = box.getAttribute('data-seed');                                    // a screen drawn with Ask open starts on its drawn thread
  if (!thread.length && seed) { try { thread = JSON.parse(seed); } catch (e) {} }
  function save() { try { sessionStorage.setItem(key, JSON.stringify(thread)); } catch (e) {} }
  function el(tag, cls, s) { var e = document.createElement(tag); if (cls) e.className = cls; if (s) e.textContent = s; return e; }
  function show(b) {
    open(false);
    var d = b.el.closest('[data-drawer]');
    if (d && d.getAttribute('data-open') !== 'true') { var t = d.querySelector('[data-tab]'); if (t) t.click(); }
    b.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var marks = b.el.tagName === 'TR' ? [].slice.call(b.el.children) : [b.el];
    marks.forEach(function (m) { m.removeAttribute('data-flash'); void m.offsetWidth; m.setAttribute('data-flash', '1'); });
  }
  function draw(m) {
    if (m.who === 'you') { log.appendChild(el('div', 'ask-you', m.text)); return; }
    var row = el('div', 'ask-me'), mark = el('span', 'ask-mark'), col = el('div', 'ask-col');
    mark.innerHTML = MARK; row.appendChild(mark); col.appendChild(el('div', 'ask-text', m.text));
    if (m.cites) col.appendChild(el('div', 'ask-cite', 'Cites: ' + m.cites));
    if (m.items && m.items.length) {
      var refs = el('div', 'ask-refs');
      m.items.forEach(function (i) {
        var b = BLOCKS[i], r = el('div', 'ask-ref'), q = el('button', 'ask-quote', b.text.length > 220 ? b.text.slice(0, 217) + '...' : b.text);
        q.type = 'button'; q.addEventListener('click', function () { show(b); }); r.appendChild(q);
        if (b.href) { var a = el('a', 'ask-go', 'Open'); a.href = b.href; r.appendChild(a); }
        refs.appendChild(r);
      });
      col.appendChild(refs);
    }
    row.appendChild(col); log.appendChild(row);
  }
  function render() {
    log.innerHTML = ''; thread.forEach(draw);
    hints.hidden = thread.length > 0; body.scrollTop = body.scrollHeight;
  }
  function suggest() {
    var s = ['Summarise this page'];
    if (BLOCKS.some(function (b) { return ASKS[1].m.test(b.text); })) s.push('What needs me here?');
    if (BLOCKS.some(function (b) { return ASKS[2].m.test(b.text); })) s.push('What is late or stopped?');
    if (document.querySelector('[data-drawer]')) s.push('Who is on this?');
    hints.innerHTML = '';
    s.slice(0, 3).forEach(function (t) { var h = el('button', 'ask-hint', t); h.type = 'button'; h.addEventListener('click', function () { ask(t); }); hints.appendChild(h); });
  }
  function open(o) { box.setAttribute('data-open', o ? 'true' : 'false'); if (o) { render(); setTimeout(function () { input.focus(); }, 60); } }
  function ready() { send.classList.toggle('go', !!input.value.trim()); send.disabled = !input.value.trim(); }
  function ask(q) {
    q = q.trim(); if (!q) return;
    open(true); thread.push({ who: 'you', text: q }); render(); input.value = ''; ready();
    var wait = el('div', 'ask-me ask-wait'); wait.innerHTML = '<span class="ask-mark">' + MARK + '</span><span class="ask-work">' + WORK + 'Reading this page</span>';
    log.appendChild(wait); body.scrollTop = body.scrollHeight;
    answer(q).then(function (r) {
      thread.push({ who: 'madison', text: r.text, items: r.items.map(function (b) { return BLOCKS.indexOf(b); }) }); save(); render();
    });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', ready);
  input.addEventListener('focus', function () { if (box.getAttribute('data-open') !== 'true') open(true); });
  box.querySelector('.ask-close').addEventListener('click', function () { open(false); input.blur(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.getAttribute('data-open') === 'true') { open(false); input.blur(); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); open(true); }
  });
  suggest(); ready();
  if (box.getAttribute('data-open') === 'true') render();
  window.MadisonAsk = { answer: answer };
})();
