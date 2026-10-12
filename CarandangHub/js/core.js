/* core.js
   Two small tools the other files share:
   1. Icons  - small vector icons (heart, trophy, power, the four button symbols) and the
               generated cover art for apps that have no picture. All are inline SVG, no files.
   2. h()    - tiny helper to build DOM elements safely (uses text nodes, never innerHTML)
*/
(function () {
  'use strict';

  /* ---------- Icons ---------- */
  var W = '#ffffff', GOLD = '#f2c14e';
  function stroke(d, color, w) {
    return '<path d="' + d + '" fill="none" stroke="' + (color || W) + '" stroke-width="' + (w || 2) +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var HEART = 'M12 20.5s-7.3-4.5-9.4-9.1C1.2 8.2 2.9 4.6 6.6 4.6c2 0 3.7 1.1 5.4 3.2 1.7-2.1 3.4-3.2 5.4-3.2 3.7 0 5.4 3.6 4 6.8-2.1 4.6-9.4 9.1-9.4 9.1z';

  var ICONS = {
    'heart-on': '<path d="' + HEART + '" fill="#ff5b78"/>',
    'heart-off': stroke(HEART, W, 1.8),
    bubble: stroke('M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', W, 1.8),
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="' + GOLD + '"/>' +
      stroke('M7 5H3.5v2a3.5 3.5 0 0 0 3.6 3.5M17 5h3.5v2a3.5 3.5 0 0 1-3.6 3.5', GOLD, 1.8) +
      stroke('M12 14v4M9 18h6M8 21h8', GOLD, 1.8),
    power: stroke('M12 3.5v8.5', W, 2.2) + stroke('M6.4 6.9a8 8 0 1 0 11.2 0', W, 2.2),
    // the four button symbols
    triangle: stroke('M12 4.6 20 18.6H4z', W, 2.2),
    circle: '<circle cx="12" cy="12" r="7.4" fill="none" stroke="' + W + '" stroke-width="2.2"/>',
    cross: stroke('M5.8 5.8l12.4 12.4M18.2 5.8 5.8 18.2', W, 2.2),
    square: '<rect x="5.2" y="5.2" width="13.6" height="13.6" fill="none" stroke="' + W + '" stroke-width="2.2"/>'
  };

  var cache = {};
  function url(name) {
    if (cache[name]) return cache[name];
    var body = ICONS[name];
    if (!body) return '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + body + '</svg>';
    cache[name] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    return cache[name];
  }

  // Cover art for apps without a picture: a gradient square with one big glyph.
  var COVERS = {
    bag: {
      a: '#12a0e0', b: '#5a3fd0',
      art: '<path d="M126 176h148l14 148a14 14 0 0 1-14 15H126a14 14 0 0 1-14-15z" fill="#fff"/>' +
        '<path d="M158 176v-22a42 42 0 0 1 84 0v22" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M200 230c-16-14-34-4-26 12 6 12 26 24 26 24s20-12 26-24c8-16-10-26-26-12z" fill="#5a3fd0"/>'
    },
    mail: {
      a: '#e2528f', b: '#5b3fd0',
      art: '<rect x="82" y="128" width="236" height="152" rx="8" fill="#fff"/>' +
        '<path d="M88 138l112 88 112-88" fill="none" stroke="#5b3fd0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="306" cy="132" r="26" fill="#ffd44d"/><path d="M306 118v18" stroke="#5b3fd0" stroke-width="7" stroke-linecap="round"/><circle cx="306" cy="146" r="4" fill="#5b3fd0"/>'
    }
  };
  function cover(name) {
    var c = COVERS[name];
    if (!c) return '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.a + '"/><stop offset="1" stop-color="' + c.b + '"/></linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#g)"/>' +
      '<circle cx="330" cy="70" r="150" fill="#fff" opacity=".09"/><circle cx="40" cy="380" r="120" fill="#fff" opacity=".08"/>' +
      c.art + '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // Icons.el('trophy', 24)  or  Icons.el('img:path/to/pic.png', 32)
  function iconEl(name, size, cls) {
    var i = document.createElement('img');
    i.src = name.indexOf('img:') === 0 ? name.slice(4) : url(name);
    i.width = size || 24; i.height = size || 24;
    i.alt = ''; i.draggable = false;
    if (cls) i.className = cls;
    return i;
  }

  /* ---------- h(): build elements without innerHTML ---------- */
  var PROPS = { value: 1, checked: 1, disabled: 1, hidden: 1, selected: 1 };
  function h(tag, props) {
    var el = document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROPS[k]) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    function add(kid) {
      if (kid === null || kid === undefined || kid === false) return;
      if (Array.isArray(kid)) kid.forEach(add);
      else if (kid instanceof Node) el.appendChild(kid);
      else el.appendChild(document.createTextNode(String(kid)));
    }
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  }

  window.Hub = { h: h, Icons: { url: url, el: iconEl, cover: cover } };
})();
