/* The hands-on demos on the home page. Each one is a small simulation of what
   TeamUp really does, with the made-up company Nimbus Labs. Nothing here talks
   to a server. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  const PEOPLE = [
    { name: 'Priya Sharma', i: 'PS', c: 'ps', role: 'Product' },
    { name: 'Arjun Mehta', i: 'AM', c: 'am', role: 'Engineering' },
    { name: 'Neha Gupta', i: 'NG', c: 'ng', role: 'Backend' },
    { name: 'Ananya Rao', i: 'AR', c: 'ar', role: 'Sales' },
    { name: 'Rohan Das', i: 'RD', c: 'rd', role: 'Design' },
    { name: 'Kavya Iyer', i: 'KI', c: 'ki', role: 'Platform' },
    { name: 'Vikram Singh', i: 'VS', c: 'vs', role: 'Sales' },
  ];

  /* ================= Chat ================= */
  (function chat() {
    const root = $('[data-chat-demo]');
    if (!root) return;
    const log = $('[data-chat-log]', root);
    const formEl = $('[data-chat-form]', root);
    const input = $('[data-chat-input]', root);
    const list = $('[data-mention-list]', root);
    let matches = [];
    let active = 0;
    let replyIdx = 0;
    const REPLIES = ['On it. I will update this thread by the afternoon.', 'Got it, looking now.', 'Sure, give me ten minutes.', 'Done! Check the board.'];

    const now = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const tokenBeforeCaret = () => {
      const upto = input.value.slice(0, input.selectionStart ?? input.value.length);
      const m = upto.match(/(^|\s)@([A-Za-z]*)$/);
      return m ? { query: m[2], start: upto.length - m[2].length - 1 } : null;
    };
    const closeList = () => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      matches = [];
    };
    const renderList = () => {
      list.innerHTML = matches.map((p, idx) => `<li role="option" id="mention-${p.c}" aria-selected="${idx === active}" data-idx="${idx}"><span class="av av-xs av-${p.c}" aria-hidden="true">${p.i}</span>${esc(p.name)}<small>${p.role}</small></li>`).join('');
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-activedescendant', `mention-${matches[active].c}`);
    };
    const update = () => {
      const tok = tokenBeforeCaret();
      if (!tok) return closeList();
      const q = tok.query.toLowerCase();
      matches = PEOPLE.filter((p) => p.name.toLowerCase().split(' ').some((w) => w.startsWith(q)) || p.name.toLowerCase().startsWith(q));
      if (!matches.length) return closeList();
      active = Math.min(active, matches.length - 1);
      renderList();
    };
    const choose = (idx) => {
      const tok = tokenBeforeCaret();
      const p = matches[idx];
      if (!tok || !p) return;
      const caret = input.selectionStart ?? input.value.length;
      const before = input.value.slice(0, tok.start);
      const after = input.value.slice(caret);
      input.value = `${before}@${p.name} ${after}`;
      const pos = before.length + p.name.length + 2;
      input.setSelectionRange(pos, pos);
      closeList();
      input.focus();
    };
    input.addEventListener('input', () => { active = 0; update(); });
    input.addEventListener('click', update);
    input.addEventListener('blur', () => setTimeout(closeList, 120));
    input.addEventListener('keydown', (e) => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; renderList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; renderList(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); closeList(); }
    });
    list.addEventListener('pointerdown', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      e.preventDefault();
      choose(Number(li.dataset.idx));
    });

    const scrollDown = () => { log.scrollTop = log.scrollHeight; };
    const addMsg = (html) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      const el = wrap.firstChild;
      log.appendChild(el);
      while (log.children.length > 14) log.removeChild(log.firstElementChild);
      scrollDown();
      return el;
    };
    const withMentions = (text) => {
      let html = esc(text);
      PEOPLE.forEach((p) => { html = html.split(`@${esc(p.name)}`).join(`<span class="mention">@${esc(p.name)}</span>`); });
      return html;
    };

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      closeList();
      input.value = '';
      const mine = addMsg(`<div class="msg is-mine is-new"><div><p class="msg-meta"><b>You</b>${now()}</p><p class="bubble">${withMentions(text)}</p><span class="receipt">Sent</span></div></div>`);
      const receipt = $('.receipt', mine);
      setTimeout(() => { receipt.textContent = 'Seen by 3'; }, 900);
      const mentioned = PEOPLE.find((p) => text.includes(`@${p.name}`));
      if (mentioned) {
        const typing = addMsg(`<p class="typing">${esc(mentioned.name)} is typing…</p>`);
        setTimeout(() => {
          typing.remove();
          const reply = REPLIES[replyIdx++ % REPLIES.length];
          addMsg(`<div class="msg is-new"><span class="av av-${mentioned.c}" aria-hidden="true">${mentioned.i}</span><div><p class="msg-meta"><b>${esc(mentioned.name)}</b>${now()}</p><p class="bubble">${esc(reply)}</p></div></div>`);
        }, 1500);
      } else {
        setTimeout(() => {
          const r = document.createElement('span');
          r.className = 'reactions';
          r.innerHTML = '<button type="button" class="reaction" data-react aria-pressed="false">👍 <b>1</b></button>';
          $('div', mine).appendChild(r);
          scrollDown();
        }, 1100);
      }
    });

    log.addEventListener('click', (e) => {
      const b = e.target.closest('[data-react]');
      if (!b) return;
      const on = b.getAttribute('aria-pressed') !== 'true';
      const n = $('b', b);
      n.textContent = String(Number(n.textContent) + (on ? 1 : -1));
      b.setAttribute('aria-pressed', String(on));
    });
    $('[data-chat-call]', root)?.addEventListener('click', () => {
      document.getElementById('calls')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    });
  })();

  /* ================= Call ================= */
  (function call() {
    const root = $('[data-call-demo]');
    if (!root) return;
    const grid = $('[data-call-grid]', root);
    const tiles = Object.fromEntries($$('[data-tile]', root).map((t) => [t.dataset.tile, t]));
    const you = tiles.you;
    const status = $('[data-call-status]', root);
    const banner = $('[data-call-banner]', root);
    const bannerText = $('[data-call-banner-text]', root);
    const badge = $('[data-badge]', you);
    const signal = $('[data-signal]', you);
    const BG = ['none', 'blur', 'company'];
    const BG_LABEL = { none: 'Background: none', blur: 'Background: blur', company: 'Background: company' };
    const state = { weak: false, hand: false, bg: 0, audio: false, phone: false };
    const order = ['ng', 'am', 'you', 'rd'];
    let speaker = 0;
    let timer = null;

    const say = (msg) => { status.textContent = msg; };
    const render = () => {
      const remote = ['am', 'ng', 'rd'];
      you.classList.toggle('cam-off', state.weak || state.audio);
      remote.forEach((k) => tiles[k].classList.toggle('cam-off', state.weak || state.audio));
      tiles.phone.classList.toggle('cam-off', state.audio);
      const bg = BG[state.bg];
      [you, tiles.phone].forEach((t) => { t.classList.toggle('bg-blur', bg === 'blur'); t.classList.toggle('bg-company', bg === 'company'); });
      $('[data-nameplate]', you).hidden = bg !== 'company';
      $('[data-bg-label]', root).textContent = BG_LABEL[bg];
      $('[data-hand]', you).hidden = !state.hand;
      if (state.audio) { badge.hidden = false; badge.textContent = 'Audio only'; badge.classList.add('is-info'); }
      else if (state.weak) { badge.hidden = false; badge.textContent = 'Camera paused: weak connection'; badge.classList.remove('is-info'); }
      else badge.hidden = true;
      signal.classList.toggle('is-weak', state.weak);
      $('use', signal).setAttribute('href', state.weak ? '#i-wifi-low' : '#i-wifi');
      banner.hidden = !(state.weak || state.audio);
      bannerText.textContent = state.audio ? 'Audio only is on: no video either way, to save data' : 'Video paused: your connection is weak';
      tiles.phone.hidden = !state.phone;
      grid.classList.toggle('has-5', state.phone);
      $$('[data-ctrl]', root).forEach((b) => {
        const k = b.dataset.ctrl;
        b.setAttribute('aria-pressed', String(k === 'bg' ? state.bg > 0 : !!state[k]));
      });
    };
    const speak = () => {
      Object.values(tiles).forEach((t) => t.classList.remove('is-speaking'));
      tiles[order[speaker % order.length]].classList.add('is-speaking');
    };
    const tick = () => { speaker++; speak(); };
    const start = () => { if (!timer && !reduced()) timer = setInterval(tick, 2600); };
    const stop = () => { clearInterval(timer); timer = null; };
    speak();
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(root);

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ctrl]');
      if (!b) return;
      const k = b.dataset.ctrl;
      if (k === 'weak') {
        state.weak = !state.weak;
        say(state.weak
          ? 'Your camera paused and others see why on your tile. Videos stop coming to you, and the voice bars keep moving.'
          : 'Your connection is better, so video is back on.');
      } else if (k === 'hand') {
        state.hand = !state.hand;
        say(state.hand ? 'Your hand is up, first in the queue. Everybody sees it on your tile.' : 'Hand lowered.');
      } else if (k === 'bg') {
        state.bg = (state.bg + 1) % BG.length;
        const bg = BG[state.bg];
        say(bg === 'blur' ? 'Your room is blurred. The video keeps going while the background switches.'
          : bg === 'company' ? 'A company background with your name and title on it, set up by your organization.'
          : 'No background.');
      } else if (k === 'audio') {
        state.audio = !state.audio;
        say(state.audio ? 'Audio only: no video either way, to save data. The others see that you are on audio only.' : 'Audio only is off.');
      } else if (k === 'phone') {
        state.phone = !state.phone;
        say(state.phone ? 'Your phone joins as a second angle with its sound off, so nothing echoes. Everybody still counts you once: 4 people.' : 'Your phone left. You are still in from your laptop.');
      }
      render();
    });
    render();
  })();

  /* ================= Meeting notes ================= */
  (function notes() {
    const root = $('[data-notes-demo]');
    if (!root) return;
    const btn = $('[data-notes-end]', root);
    const empty = $('[data-minutes-empty]', root);
    const body = $('[data-minutes-body]', root);
    const minutes = $('[data-minutes]', root);
    const modelOut = $('[data-minutes-model]', root);
    const live = $('.live-dot', root);
    let ended = false;
    let timers = [];
    const model = () => $('input[name="model"]:checked', root).value;
    const label = () => (model() === 'your own model' ? 'Your own model' : model());
    $$('input[name="model"]', root).forEach((r) => r.addEventListener('change', () => { modelOut.textContent = label(); }));
    const reset = () => {
      timers.forEach(clearTimeout); timers = [];
      ended = false;
      body.hidden = true; empty.hidden = false;
      $('p', empty).textContent = 'Minutes appear here when the call ends.';
      $$('[data-type]', body).forEach((el) => el.classList.remove('is-shown'));
      live.textContent = 'In call'; live.classList.remove('is-ended');
      btn.innerHTML = '<svg aria-hidden="true"><use href="#i-phone-call"/></svg> End the call';
      btn.classList.add('btn-danger'); btn.classList.remove('btn-soft');
    };
    btn.addEventListener('click', () => {
      if (ended) { reset(); return; }
      ended = true;
      live.textContent = 'Call ended'; live.classList.add('is-ended');
      $('p', empty).textContent = `${label()} is writing the minutes…`;
      minutes.setAttribute('aria-busy', 'true');
      btn.innerHTML = '<svg aria-hidden="true"><use href="#i-refresh"/></svg> Run it again';
      btn.classList.remove('btn-danger'); btn.classList.add('btn-soft');
      modelOut.textContent = label();
      const fast = reduced();
      timers.push(setTimeout(() => {
        empty.hidden = true; body.hidden = false;
        minutes.setAttribute('aria-busy', 'false');
        $$('[data-type]', body).forEach((el, i) => timers.push(setTimeout(() => el.classList.add('is-shown'), fast ? 0 : 300 + i * 450)));
      }, fast ? 0 : 1300));
    });
  })();

  /* ================= Scrum table ================= */
  (function scrum() {
    const root = $('[data-scrum-demo]');
    if (!root) return;
    const tbody = $('[data-scrum-body]', root);
    const live = $('[data-scrum-live]', root);
    const menu = $('[data-task-menu]');
    const menuTitle = $('[data-task-menu-title]', menu);
    const menuActions = $('[data-task-menu-actions]', menu);
    const blockForm = $('[data-block-form]', menu);
    const reasonInput = $('#block-reason');
    const SEED = [
      { id: 'am', name: 'Arjun Mehta', i: 'AM', lead: 'Priya Sharma', open: [
        { id: 't1', t: 'Payments API v2', d: 'Due Mon · In progress' },
        { id: 't2', t: 'Fix login rate limit', d: 'Due Tue · In review' },
        { id: 't3', t: 'Load test at 1,000', d: 'Overdue · since Fri', late: true }], done: ['Release checklist'], blocked: [] },
      { id: 'ng', name: 'Neha Gupta', i: 'NG', lead: 'Arjun Mehta', open: [
        { id: 't4', t: 'Merge payments API', d: 'Due Wed · In progress' },
        { id: 't5', t: 'Webhook retries', d: 'Due Thu · To do' }], done: [], blocked: [] },
      { id: 'rd', name: 'Rohan Das', i: 'RD', lead: 'Priya Sharma', open: [
        { id: 't6', t: 'Landing page feedback', d: 'Due Thu · In progress' },
        { id: 't7', t: 'Pricing page layout', d: 'Due Fri · To do' }], done: ['Design crit notes'], blocked: [] },
      { id: 'ki', name: 'Kavya Iyer', i: 'KI', lead: 'Arjun Mehta', open: [
        { id: 't8', t: 'Nightly backup check', d: 'Due Tue · To do' }], done: [], blocked: [
        { id: 't9', t: 'Renew SSL certificates', d: 'Due Mon', reason: 'DNS access from IT', at: 0 }] },
      { id: 'vs', name: 'Vikram Singh', i: 'VS', lead: 'Priya Sharma', open: [
        { id: 't10', t: 'Webinar outline', d: 'Due Wed · To do' }], done: [], blocked: [] },
    ];
    let rows = structuredClone(SEED);
    let openTask = null;
    let grabbed = null;
    let grabbedFrom = -1;

    const taskBtn = (task, kind) => {
      const cls = kind === 'blocked' ? 'is-blocked' : task.late ? 'is-late' : '';
      const sub = kind === 'blocked' ? `Blocked: ${esc(task.reason)}` : esc(task.d);
      return `<button type="button" class="task ${cls}" data-task="${task.id}" aria-haspopup="dialog"><b>${esc(task.t)}</b><small>${sub}</small></button>`;
    };
    const render = (focusSel) => {
      tbody.innerHTML = rows.map((r, idx) => {
        const cells = [0, 1, 2].map((n) => `<td>${r.open[n] ? taskBtn(r.open[n], 'open') : '<span class="empty-cell" aria-label="No task">·</span>'}</td>`).join('');
        const done = r.done.length ? `<div class="cell-stack">${r.done.map((t) => `<div class="task is-done"><b>${esc(t)}</b><small>Done</small></div>`).join('')}</div>` : '<span class="empty-cell" aria-label="Nothing yet">·</span>';
        const blocked = r.blocked.length ? `<div class="cell-stack">${r.blocked.map((t) => taskBtn(t, 'blocked')).join('')}</div>` : '<span class="empty-cell" aria-label="Nothing blocked">·</span>';
        return `<tr data-row="${r.id}" class="${grabbed === r.id ? 'is-dragging' : ''}">
          <td><button type="button" class="handle" data-handle="${r.id}" aria-pressed="${grabbed === r.id}" aria-label="Move ${esc(r.name)}, position ${idx + 1} of ${rows.length}"><svg aria-hidden="true"><use href="#i-grip"/></svg></button></td>
          <th scope="row"><span class="who"><span class="av av-xs av-${r.id}" aria-hidden="true">${r.i}</span><span>${esc(r.name)}<span class="who-lead">Lead: ${esc(r.lead)}</span></span></span></th>
          <td class="lead">${esc(r.lead)}</td>${cells}<td>${done}</td><td>${blocked}</td></tr>`;
      }).join('');
      if (focusSel) $(focusSel, tbody)?.focus();
    };
    const announce = (msg) => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); };
    const findTask = (id) => {
      for (const r of rows) {
        const o = r.open.find((t) => t.id === id); if (o) return { row: r, task: o, kind: 'open' };
        const b = r.blocked.find((t) => t.id === id); if (b) return { row: r, task: b, kind: 'blocked' };
      }
      return null;
    };

    /* Task menu */
    const closeMenu = (refocus = true) => {
      if (menu.hidden) return;
      menu.hidden = true;
      const id = openTask?.task.id;
      openTask = null;
      if (refocus && id) $(`[data-task="${id}"]`, tbody)?.focus();
    };
    const placeMenu = (btn) => {
      const r = btn.getBoundingClientRect();
      const w = Math.min(280, window.innerWidth - 32);
      let left = r.left + window.scrollX;
      left = Math.max(16 + window.scrollX, Math.min(left, window.scrollX + window.innerWidth - w - 16));
      menu.style.left = `${left}px`;
      menu.style.top = `${r.bottom + window.scrollY + 6}px`;
    };
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-task]');
      if (!btn) return;
      openTask = findTask(btn.dataset.task);
      if (!openTask) return;
      menuTitle.textContent = openTask.task.t;
      blockForm.hidden = true;
      menuActions.hidden = false;
      const isBlocked = openTask.kind === 'blocked';
      menuActions.innerHTML = isBlocked
        ? '<button type="button" class="btn btn-soft btn-sm" data-task-act="unblock"><svg aria-hidden="true"><use href="#i-refresh"/></svg> Unblock</button><button type="button" class="btn btn-soft btn-sm" data-task-act="done"><svg aria-hidden="true"><use href="#i-check"/></svg> Mark done</button>'
        : '<button type="button" class="btn btn-soft btn-sm" data-task-act="done"><svg aria-hidden="true"><use href="#i-check"/></svg> Mark done</button><button type="button" class="btn btn-soft btn-sm danger" data-task-act="block"><svg aria-hidden="true"><use href="#i-blocked"/></svg> Mark blocked</button>';
      menu.hidden = false;
      placeMenu(btn);
      $('button', menuActions).focus();
    });
    menu.addEventListener('click', (e) => {
      const act = e.target.closest('[data-task-act]')?.dataset.taskAct;
      if (e.target.closest('[data-task-cancel]')) { closeMenu(); return; }
      if (!act || !openTask) return;
      const { row, task, kind } = openTask;
      if (act === 'block') {
        menuActions.hidden = true; blockForm.hidden = false; reasonInput.value = ''; reasonInput.focus();
        return;
      }
      if (act === 'done') {
        row[kind] = row[kind].filter((t) => t !== task);
        row.done.push(task.t);
        closeMenu(false); render();
        announce(`${task.t} is done and moved to Done.`);
        $(`[data-row="${row.id}"] [data-handle]`, tbody)?.focus();
      }
      if (act === 'unblock') {
        row.blocked = row.blocked.filter((t) => t !== task);
        const back = { id: task.id, t: task.t, d: `${task.d} · In progress` };
        row.open.splice(Math.min(task.at ?? 0, row.open.length), 0, back);
        closeMenu(false); render(`[data-task="${task.id}"]`);
        announce(`${task.t} is unblocked and back in its place.`);
      }
    });
    blockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!openTask) return;
      const reason = reasonInput.value.trim();
      if (!reason) { reasonInput.focus(); return; }
      const { row, task } = openTask;
      const at = row.open.indexOf(task);
      row.open = row.open.filter((t) => t !== task);
      row.blocked.push({ id: task.id, t: task.t, d: task.d.split(' · ')[0], reason, at });
      closeMenu(false); render(`[data-task="${task.id}"]`);
      $(`[data-task="${task.id}"]`, tbody)?.classList.add('is-new');
      announce(`${task.t} moved to Blocked on: ${reason}.`);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-task]')) closeMenu(false); });
    window.addEventListener('resize', () => closeMenu(false));

    /* Reordering people: keyboard */
    const move = (id, delta) => {
      const from = rows.findIndex((r) => r.id === id);
      const to = Math.max(0, Math.min(rows.length - 1, from + delta));
      if (from === to) return false;
      const [r] = rows.splice(from, 1);
      rows.splice(to, 0, r);
      return true;
    };
    tbody.addEventListener('keydown', (e) => {
      const h = e.target.closest('[data-handle]');
      if (!h) return;
      const id = h.dataset.handle;
      const name = rows.find((r) => r.id === id).name;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (grabbed === id) {
          grabbed = null; render(`[data-handle="${id}"]`);
          announce(`${name} dropped at position ${rows.findIndex((r) => r.id === id) + 1}. Your order is kept just for you.`);
        } else {
          grabbed = id; grabbedFrom = rows.findIndex((r) => r.id === id); render(`[data-handle="${id}"]`);
          announce(`Picked up ${name}. Use the up and down arrows to move, Space to drop, Escape to cancel.`);
        }
      } else if (grabbed === id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (move(id, e.key === 'ArrowUp' ? -1 : 1)) {
          render(`[data-handle="${id}"]`);
          announce(`Position ${rows.findIndex((r) => r.id === id) + 1} of ${rows.length}.`);
        }
      } else if (grabbed === id && e.key === 'Escape') {
        e.preventDefault();
        const cur = rows.findIndex((r) => r.id === id);
        move(id, grabbedFrom - cur);
        grabbed = null; render(`[data-handle="${id}"]`);
        announce(`Move cancelled. ${name} is back at position ${grabbedFrom + 1}.`);
      }
    });

    /* Reordering people: mouse and touch */
    tbody.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('[data-handle]');
      if (!h || e.button > 0) return;
      e.preventDefault();
      const id = h.dataset.handle;
      let moved = false;
      const tr = h.closest('tr');
      tr.classList.add('is-dragging');
      const onMove = (ev) => {
        const trs = $$('tr', tbody);
        const cur = trs.findIndex((t) => t.dataset.row === id);
        const y = ev.clientY;
        const above = trs[cur - 1]; const below = trs[cur + 1];
        if (above && y < above.getBoundingClientRect().top + above.offsetHeight / 2) {
          tbody.insertBefore(trs[cur], above); move(id, -1); moved = true;
        } else if (below && y > below.getBoundingClientRect().top + below.offsetHeight / 2) {
          tbody.insertBefore(below, trs[cur]); move(id, 1); moved = true;
        }
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        render();
        const row = $(`[data-row="${id}"]`, tbody);
        if (moved) {
          row?.classList.add('is-moved');
          announce(`${rows.find((r) => r.id === id).name} moved to position ${rows.findIndex((r) => r.id === id) + 1}. Your order is kept just for you.`);
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });

    $('[data-scrum-reset]', root).addEventListener('click', () => {
      rows = structuredClone(SEED); grabbed = null; closeMenu(false); render();
      announce('The scrum is back to how it started.');
    });
    render();
  })();

  /* ================= Leave toggle ================= */
  (function leave() {
    const btn = $('[data-leave-toggle]');
    const st = $('[data-kavya-state]');
    if (!btn || !st) return;
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      st.className = `att ${on ? 'att-leave' : 'att-out'}`;
      st.textContent = on ? 'On leave' : 'Not joined';
      btn.textContent = on ? 'Undo Kavya\'s leave' : 'Record Kavya\'s leave for today';
    });
  })();

  /* ================= Calendar day ================= */
  (function day() {
    const root = $('[data-day-demo]');
    if (!root) return;
    const col = $('[data-day-col]', root);
    const nowLine = $('[data-day-now]', root);
    const play = $('[data-day-play]', root);
    const toggle = $('[data-day-toggle]', root);
    const clock = $('[data-day-clock]', root);
    const result = $('[data-day-result]', root);
    const START = 9 * 60; const END = 12 * 60; const SPAN = END - START;
    const MERGE = 10;
    const fmt = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`;
    const pct = (m) => ((m - START) / SPAN) * 100;
    let t = START; let raf = 0; let last = 0; let blocks = []; let inCall = false; let touched = false; let merged = false;
    const sched = document.createElement('div');
    sched.className = 'day-block is-sched';
    sched.style.top = `${pct(9 * 60 + 30)}%`;
    sched.style.height = `${pct(9 * 60 + 45) - pct(9 * 60 + 30)}%`;
    sched.textContent = 'Stand-up 09:30';
    col.appendChild(sched);

    const draw = () => {
      $$('.day-block:not(.is-sched)', col).forEach((b) => b.remove());
      blocks.forEach((b) => {
        const el = document.createElement('div');
        el.className = 'day-block';
        const end = b.end ?? t;
        el.style.top = `${pct(b.start)}%`;
        el.style.height = `${Math.max(pct(end) - pct(b.start), 0.8)}%`;
        if (end - b.start >= 9) el.textContent = `In the call ${fmt(b.start)}`;
        col.appendChild(el);
      });
      nowLine.style.top = `${pct(t)}%`;
      clock.textContent = fmt(t);
    };
    const join = () => {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.end != null && t - prev.end <= MERGE) { prev.end = null; merged = true; }
      else blocks.push({ start: t, end: null });
      inCall = true;
      toggle.textContent = 'Leave the call';
    };
    const leaveCall = () => {
      const b = blocks[blocks.length - 1];
      if (b) b.end = t;
      inCall = false;
      toggle.textContent = 'Look in again';
    };
    const finish = () => {
      if (inCall) leaveCall();
      cancelAnimationFrame(raf); raf = 0;
      toggle.disabled = true;
      play.disabled = false;
      $('span', play).textContent = 'Play again';
      draw();
      const parts = blocks.map((b) => `${fmt(b.start)} to ${fmt(b.end)}`);
      const n = blocks.length;
      result.textContent = n === 0 ? 'You never joined, so nothing shows on your calendar.'
        : `Your calendar shows ${n === 1 ? 'one block' : `${n} blocks`}: ${parts.join(' and ')}.${merged ? ' Back within ten minutes, so that stayed one block.' : ''}${n > 1 ? ' Not one long block from morning to noon.' : ''}`;
    };
    const step = (ts) => {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 100); last = ts;
      const prevT = t;
      t = Math.min(END, t + dt * 0.015); // 15 minutes a second
      if (prevT < 570 && t >= 570) { join(); toggle.disabled = false; }
      if (!touched) {
        // Left alone, the morning plays out: the stand-up ends, then you look into the room again later.
        if (prevT < 585 && t >= 585 && inCall) leaveCall();
        if (prevT < 660 && t >= 660 && !inCall) join();
        if (prevT < 672 && t >= 672 && inCall) leaveCall();
      }
      draw();
      if (t >= END) { finish(); return; }
      raf = requestAnimationFrame(step);
    };
    play.addEventListener('click', () => {
      cancelAnimationFrame(raf);
      t = START; last = 0; blocks = []; inCall = false; touched = false; merged = false;
      toggle.disabled = true; toggle.textContent = 'Leave the call';
      play.disabled = true;
      nowLine.classList.add('is-on');
      result.textContent = 'You join the stand-up at 09:30. Leave whenever you like, then look in again.';
      raf = requestAnimationFrame(step);
    });
    toggle.addEventListener('click', () => {
      touched = true;
      if (inCall) leaveCall(); else join();
      draw();
    });
    draw();
  })();

  /* ================= Data flow ================= */
  (function flow() {
    const root = $('[data-flow-demo]');
    if (!root) return;
    const svg = $('[data-flow-svg]', root);
    const dots = $('[data-flow-dots]', svg);
    const caption = $('[data-flow-caption]', root);
    const FLOWS = {
      message: { seq: [['p-in'], ['p-db', 'p-redis'], ['p-out']], nodes: ['team', 'core', 'pg', 'redis', 'mates'],
        text: 'A message goes from your browser to TeamUp, is saved in Postgres, and Redis hands it to every teammate\'s open connection. It never leaves your server.' },
      file: { seq: [['p-in'], ['p-sign'], ['p-s3'], ['p-s3b']], nodes: ['team', 'core', 's3', 'mates'],
        text: 'TeamUp only signs a link. The file goes straight from the browser to your S3 storage, and teammates download it from there. The bytes never pass through the app.' },
      call: { seq: [['p-in'], ['p-sign'], ['p-lk', 'p-lk2']], nodes: ['team', 'core', 'lk', 'mates'],
        text: 'TeamUp signs a call token. Then voice, video and screens flow between browsers and LiveKit, on your server.' },
      minutes: { seq: [['p-lk'], ['p-ext']], nodes: ['team', 'lk', 'ext'], ext: true,
        text: 'The one flow that can leave: with the note-taker on, call audio goes to Sarvam for speech to text, and the transcript to the minutes model your administrator picks, or to your own. Turn the note-taker off and it stays home.' },
    };
    let current = 'message'; let raf = 0; let inView = false;
    const highlight = (name) => {
      const f = FLOWS[name];
      const on = new Set(f.seq.flat());
      $$('.fp', svg).forEach((p) => p.classList.toggle('is-on', on.has(p.id)));
      $$('[data-node]', svg).forEach((n) => n.classList.toggle('is-hot', f.nodes.includes(n.dataset.node)));
      caption.textContent = f.text;
      $$('[data-flow]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flow === name)));
    };
    const animate = () => {
      cancelAnimationFrame(raf);
      dots.innerHTML = '';
      if (reduced() || !inView) return;
      const f = FLOWS[current];
      const LEG = 900; const GAP = 250;
      const total = f.seq.length * (LEG + GAP) + 600;
      const circles = f.seq.map((leg) => leg.map((id) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '7');
        c.setAttribute('class', `flow-dot${id === 'p-ext' ? ' is-ext' : ''}`);
        c.style.opacity = '0';
        dots.appendChild(c);
        return { c, p: document.getElementById(id) };
      }));
      let t0 = 0;
      const frame = (ts) => {
        if (!t0) t0 = ts;
        const t = (ts - t0) % total;
        circles.forEach((leg, i) => {
          const local = (t - i * (LEG + GAP)) / LEG;
          leg.forEach(({ c, p }) => {
            if (local < 0 || local > 1) { c.style.opacity = '0'; return; }
            const e = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
            const pt = p.getPointAtLength(e * p.getTotalLength());
            c.setAttribute('cx', pt.x.toFixed(1));
            c.setAttribute('cy', pt.y.toFixed(1));
            c.style.opacity = '1';
          });
        });
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-flow]');
      if (!b) return;
      current = b.dataset.flow;
      highlight(current); animate();
    });
    highlight(current);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) animate(); else cancelAnimationFrame(raf); }).observe(root);
    }
  })();

  /* ================= One payment vs paying per person ================= */
  (function roi() {
    const root = $('[data-roi]');
    if (!root) return;
    const f = (sel) => $(sel, root);
    const people = f('[data-roi-people]'); const years = f('[data-roi-years]');
    const seat = f('[data-roi-seat]'); const licence = f('[data-roi-licence]');
    const maint = f('[data-roi-maint]'); const server = f('[data-roi-server]');
    const cur = f('[data-roi-cur]');
    const out = f('[data-roi-result]');
    const barSeat = f('[data-roi-bar-seat]'); const barUs = f('[data-roi-bar-us]');
    const nf = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
    const num = (el) => Math.max(0, Number(el.value) || 0);
    const calc = () => {
      const n = num(people); const y = num(years) || 1; const c = cur.value;
      $$('[data-roi-cur-label]', root).forEach((l) => { l.textContent = c; });
      f('[data-roi-people-out]').textContent = nf.format(n);
      f('[data-roi-years-out]').textContent = String(y);
      people.setAttribute('aria-valuetext', `${nf.format(n)} people`);
      years.setAttribute('aria-valuetext', `${y} ${y === 1 ? 'year' : 'years'}`);
      const perPerson = n * num(seat) * 12 * y;
      const ours = num(licence) + num(maint) * y + num(server) * 12 * y;
      const max = Math.max(perPerson, ours, 1);
      barSeat.style.transform = `scaleX(${Math.max(perPerson / max, 0.01)})`;
      barUs.style.transform = `scaleX(${Math.max(ours / max, 0.01)})`;
      const span = `${y} ${y === 1 ? 'year' : 'years'}`;
      const diff = perPerson - ours;
      out.innerHTML = diff > 0
        ? `<strong>${c}${nf.format(diff)} less over ${span}</strong>Paying per person: ${c}${nf.format(perPerson)}. TeamUp, with the example licence, maintenance and server: ${c}${nf.format(ours)}.`
        : `<strong>Paying per person costs less here</strong>Over ${span}: ${c}${nf.format(perPerson)} per person, against ${c}${nf.format(ours)} for TeamUp. A one-time licence pays off with more people or more years.`;
    };
    [people, years, seat, licence, maint, server, cur].forEach((el) => el.addEventListener('input', calc));
    calc();
  })();
})();
