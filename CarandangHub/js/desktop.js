/* desktop.js
   The home screen: a row of app tiles, the top bar, full-screen apps, and the power menu.

   TO ADD AN APP: add one object to the APPS list below.
     art:            the tile picture (a file path, or Icons.cover('bag') for generated art)
     kind: 'frame'   opens one of your pages full screen (iframe). Use for your own pages in /apps.
     kind: 'custom'  builds its own content with a mount function.
     kind: 'link'    opens a web address in a new tab (use for sites that block iframes).
*/
(function () {
  'use strict';

  var h = window.Hub.h;
  var Icons = window.Hub.Icons;

  var HUB_NAME = 'Carandang-Hub';
  var USER_NAME = 'Vincent';
  var AVATAR = 'apps/portfolio/Images/Me2.png';
  var FACEBOOK = 'https://www.facebook.com/vincentnino.carandang';
  var GITHUB = 'https://github.com/RaijnNeo';
  var ITCH = 'https://raijin-neo.itch.io/test';

  /* ---------- simple app content ---------- */
  function aboutMount(root) {
    root.appendChild(h('div', { class: 'about' },
      h('div', { class: 'about-photo' },
        h('img', { src: AVATAR, alt: 'Vincent Ni\u00F1o Carandang' })),
      h('div', { class: 'about-text' },
        h('h1', {}, 'Vincent Ni\u00F1o E. Carandang'),
        h('p', { class: 'sub' }, 'BSIT student at Universidad de Manila'),
        h('p', {}, 'I like staying active, whether that is games, soccer, or volleyball. I enjoy a good challenge and I like learning new things that make me better at what I do.'),
        h('p', {}, 'Open My Portfolio to see what I have built, or try the Marketplace app.'))));
  }

  function contactMount(root) {
    root.appendChild(h('div', { class: 'contact' },
      h('p', {}, 'The fastest way to reach me is Facebook.'),
      h('div', { class: 'contact-links' },
        h('a', { class: 'btn primary', href: FACEBOOK, target: '_blank', rel: 'noopener' }, 'Facebook'),
        h('a', { class: 'btn', href: GITHUB, target: '_blank', rel: 'noopener' }, 'GitHub'))));
  }

  /* ---------- the app list ---------- */
  var APPS = [
    { id: 'portfolio', title: 'My Portfolio', desc: 'Projects, skills, and a contact form.',
      art: 'assets/project icon.png', kind: 'frame', src: 'apps/portfolio/index.html' },
    { id: 'isaac', title: 'Isaac Roster', desc: 'Every character in The Binding of Isaac: Repentance, with stats and unlocks.',
      art: 'apps/isaac/images/isaac.png', pixel: true, kind: 'frame', src: 'apps/isaac/isaac.html' },
    { id: 'market', title: 'Marketplace', desc: 'Sell an item, like listings, and ask sellers questions.',
      art: 'assets/shop_icon.png', kind: 'custom', mount: function (root, ctx) { window.Marketplace.mount(root, ctx); } },
    { id: 'about', title: 'About Me', desc: 'BSIT student at Universidad de Manila.',
      art: AVATAR, artPos: '50% 18%', kind: 'custom', status: false, mount: aboutMount },
    { id: 'contact', title: 'Contact', desc: 'Reach me on Facebook.',
      art: Icons.cover('mail'), kind: 'custom', status: false, mount: contactMount },
    { id: 'game', title: 'Obstacle Game', desc: 'Dodge the obstacles. Opens on itch.io in a new tab.',
      art: 'assets/tile-game.png', kind: 'link', href: ITCH }
  ];

  /* ---------- basics ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var home = $('#home'), track = $('#track'), hints = $('#hints');
  var slot = $('#app-slot'), notices = $('#notices');
  var powerBtn = $('#powerbtn'), powerMenu = $('#powermenu');
  var profileBtn = $('#profilebtn'), profileMenu = $('#profilemenu');
  var profileSignout = $('#profile-signout');
  var startBtn = $('#startbtn'), dTitle = $('#dtitle'), dDesc = $('#ddesc');
  var boot = $('#boot'), off = $('#off');

  var tiles = [], index = 0, view = null;
  var opened = {}, earned = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tiles ---------- */
  function buildTiles() {
    APPS.forEach(function (app, i) {
      var img = h('img', { src: app.art, alt: '', draggable: 'false', class: app.pixel ? 'pix' : '' });
      if (app.artPos) img.style.objectPosition = app.artPos;
      var t = h('button', { class: 'tile', type: 'button', title: app.title, 'aria-label': app.title }, img);
      // First click on a tile selects it, a click on the selected tile starts it (Enter always starts it).
      var wasSelected = false;
      t.addEventListener('pointerdown', function () { wasSelected = (i === index); });
      t.addEventListener('click', function (e) {
        if (e.detail === 0 || wasSelected) launch(app); else select(i);
        wasSelected = false;
      });
      t.addEventListener('focus', function () { select(i); });
      track.appendChild(t);
      tiles.push(t);
    });
  }

  function select(i) {
    i = Math.max(0, Math.min(APPS.length - 1, i));
    index = i;
    tiles.forEach(function (t, n) {
      var on = n === i;
      t.classList.toggle('sel', on);
      t.tabIndex = on ? 0 : -1;
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    scrollRow();
    var app = APPS[i];
    dTitle.textContent = app.title;
    dDesc.textContent = app.desc;
    startBtn.textContent = app.kind === 'link' ? 'Open in new tab' : 'Start';
    startBtn.setAttribute('aria-label', (app.kind === 'link' ? 'Open ' : 'Start ') + app.title);
  }

  // Slide the row left only when the selected tile would run past the right edge.
  function scrollRow() {
    var cs = getComputedStyle(track);
    var t = $('#probe').offsetWidth, gap = parseFloat(cs.columnGap) || 0, left = parseFloat(cs.paddingLeft) || 0;
    var right = left + index * (t + gap) + t * 1.3 + 8;
    var shift = Math.max(0, right - (window.innerWidth - 16));
    track.style.setProperty('--shift', shift + 'px');
  }

  function move(step) {
    var next = Math.max(0, Math.min(APPS.length - 1, index + step));
    select(next);
    tiles[next].focus({ preventScroll: true });
  }

  /* ---------- bottom hints ---------- */
  function setHints(mode) {
    hints.replaceChildren();
    if (mode === 'app') {
      hints.appendChild(h('button', { class: 'hint', type: 'button', onclick: closeView },
        Icons.el('circle', 22), h('span', {}, 'Back')));
    } else {
      hints.appendChild(h('span', { class: 'hint' }, Icons.el('cross', 22), h('span', {}, 'Start')));
    }
  }

  /* ---------- launching apps ---------- */
  function launch(app) {
    hideMenu();
    markOpened(app);
    if (app.kind === 'link') { window.open(app.href, '_blank', 'noopener'); return; }
    openView(app);
  }

  function openView(app) {
    if (view) closeView();
    var sub = h('p', { class: 'app-sub' });
    var body = h('div', { class: 'app-body' + (app.kind === 'frame' ? ' is-frame' : '') });
    var actions = h('div', { class: 'app-actions' });

    if (app.kind === 'frame') {
      var frame = h('iframe', { src: app.src, title: app.title });
      body.appendChild(frame);
      actions.append(
        h('a', { class: 'btn', href: app.src, target: '_blank', rel: 'noopener' }, 'Open in new tab'),
        h('button', { class: 'btn', type: 'button', onclick: function () { frame.src = app.src; } }, 'Reload'));
    } else {
      app.mount(body, {
        setStatus: function (t) { sub.textContent = app.status === false ? '' : t; },
        close: closeView
      });
    }

    var el = h('section', { id: 'app', 'aria-label': app.title, tabindex: '-1' },
      h('div', { class: 'app-head' },
        h('img', { src: app.art, alt: '', class: app.pixel ? 'pix' : '', style: app.artPos ? 'object-position:' + app.artPos : '' }),
        h('div', {}, h('h1', { class: 'app-title' }, app.title), sub),
        actions),
      body);
    slot.appendChild(el);
    home.hidden = true;
    setHints('app');
    view = { el: el, app: app };
    el.focus({ preventScroll: true });
  }

  function closeView() {
    if (!view) return;
    view.el.remove();
    view = null;
    home.hidden = false;
    setHints('home');
    tiles[index].focus({ preventScroll: true });
  }

  /* ---------- notices and trophies ---------- */
  function notify(title, text) {
    while (notices.children.length > 1) notices.firstChild.remove();
    var n = h('div', { class: 'notice' },
      Icons.el('trophy', 24),
      h('div', {}, h('strong', {}, title), h('span', {}, ' ' + text)));
    notices.appendChild(n);
    setTimeout(function () {
      n.classList.add('out');
      setTimeout(function () { n.remove(); }, reduce ? 0 : 400);
    }, 5200);
  }

  function count() { return Object.keys(opened).length; }
  function paintTrophies() {
    var box = $('#trophies');
    box.replaceChildren(Icons.el('trophy', 22),
      h('span', {}, count() + ' of ' + APPS.length + ' apps opened'));
    box.title = 'Apps you have opened this visit';
  }
  function markOpened(app) {
    opened[app.id] = true;
    paintTrophies();
    if (!earned && count() === APPS.length) {
      earned = true;
      notify('Trophy earned!', 'Explorer: you opened every app.');
    }
  }

  /* ---------- power menu, boot, and off screen ---------- */
  function buildPower() {
    powerBtn.appendChild(Icons.el('power', 22));
    [['Turn off', turnOff], ['Restart', restart]].forEach(function (it) {
      powerMenu.appendChild(h('button', { type: 'button', role: 'menuitem', onclick: it[1] }, it[0]));
    });
    powerBtn.addEventListener('click', function () { if (powerMenu.hidden) showMenu(); else hideMenu(); });
  }

  function buildProfile() {
    profileBtn.addEventListener('click', function () {
      profileMenu.hidden = !profileMenu.hidden;
      profileBtn.setAttribute('aria-expanded', profileMenu.hidden ? 'false' : 'true');
      if (!profileMenu.hidden) profileSignout.focus();
    });
    profileSignout.addEventListener('click', function () {
      if (window.FB) window.FB.signOut(window.FB.auth);
      profileMenu.hidden = true;
      profileBtn.setAttribute('aria-expanded', 'false');
    });
  }
  function showMenu() {
    powerMenu.hidden = false;
    powerBtn.setAttribute('aria-expanded', 'true');
    powerMenu.firstChild.focus();
  }
  function hideMenu(refocus) {
    if (powerMenu.hidden) return;
    powerMenu.hidden = true;
    powerBtn.setAttribute('aria-expanded', 'false');
    if (refocus) powerBtn.focus();
  }

  function buildBoot() {
    ['triangle', 'circle', 'cross', 'square'].forEach(function (s, n) {
      var i = Icons.el(s, 56, 'boot-sym');
      i.style.animationDelay = (0.15 + n * 0.18) + 's';
      boot.appendChild(i);
    });
  }

  function runBoot(done) {
    hideMenu();
    if (reduce) { done(); return; }
    boot.hidden = false;
    boot.classList.remove('run'); void boot.offsetWidth; boot.classList.add('run');
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', finish);
      boot.removeEventListener('click', finish);
      boot.hidden = true;
      done();
    }
    var timer = setTimeout(finish, 2100);
    document.addEventListener('keydown', finish);
    boot.addEventListener('click', finish);
  }

  function welcome() {
    notify('Trophy earned!', 'Welcome to ' + HUB_NAME + '.');
    tiles[index].focus({ preventScroll: true });
  }

  function restart() {
    closeView();
    hideMenu();
    home.hidden = true; hints.hidden = true;
    runBoot(function () { home.hidden = false; hints.hidden = false; welcome(); });
  }

  function turnOff() {
    closeView();
    hideMenu();
    home.hidden = true; hints.hidden = true;
    off.hidden = false;
    function on() {
      off.hidden = true;
      off.removeEventListener('click', on);
      document.removeEventListener('keydown', on);
      runBoot(function () { home.hidden = false; hints.hidden = false; welcome(); });
    }
    setTimeout(function () {
      off.addEventListener('click', on);
      document.addEventListener('keydown', on);
    }, 400);
  }

  /* ---------- keyboard ---------- */
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = e.target && e.target.tagName;
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === 'Escape') {
      if (!powerMenu.hidden) { hideMenu(true); return; }
      if (view) { closeView(); }
      return;
    }
    if (view || typing || home.hidden) return;

    var inMenu = powerMenu.contains(e.target);
    if (inMenu) {
      var items = Array.prototype.slice.call(powerMenu.children), at = items.indexOf(e.target);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(at + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(at - 1 + items.length) % items.length].focus(); }
      return;
    }

    var onTile = tiles.indexOf(e.target) !== -1;
    var atRoot = e.target === document.body || e.target === document.documentElement;   // nothing focused
    var inRow = onTile || atRoot || e.target === startBtn;
    if (e.key === 'ArrowRight' && inRow) { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft' && inRow) { e.preventDefault(); move(-1); }
    else if (e.key === 'Home' && (onTile || atRoot)) { e.preventDefault(); move(-APPS.length); }
    else if (e.key === 'End' && (onTile || atRoot)) { e.preventDefault(); move(APPS.length); }
    else if (e.key === 'Enter' && atRoot) { e.preventDefault(); launch(APPS[index]); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.target === powerBtn) tiles[index].focus({ preventScroll: true });
      else if (onTile || atRoot) startBtn.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.target === startBtn) tiles[index].focus({ preventScroll: true });
      else if (onTile || atRoot) powerBtn.focus();
    }
  }

  /* ---------- start up ---------- */
  function tick() {
    $('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function init() {
    document.title = HUB_NAME;
    $('#avatar').src = AVATAR;
    $('#username').textContent = USER_NAME;
    window.addEventListener('hub-auth-changed', function (e) {
      $('#username').textContent = e.detail && e.detail.username ? e.detail.username : USER_NAME;
    });
    paintTrophies();
    buildTiles();
    buildPower();
    buildProfile();
    buildBoot();
    setHints('home');
    select(0);
    tick(); setInterval(tick, 15000);

    window.Wallpaper.start($('#wallpaper'));
    window.addEventListener('resize', scrollRow);

    startBtn.addEventListener('click', function () { launch(APPS[index]); });
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', function (e) {
      if (!powerMenu.hidden && !e.target.closest('#functions')) hideMenu();
      if (!profileMenu.hidden && !e.target.closest('.profile')) {
        profileMenu.hidden = true;
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    home.hidden = true; hints.hidden = true;
    runBoot(function () { home.hidden = false; hints.hidden = false; welcome(); });
  }

  init();
})();
