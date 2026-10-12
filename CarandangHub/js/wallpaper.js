/* wallpaper.js
   Draws the blue "waves" background onto a canvas: a deep blue gradient, a soft glow in the
   lower left, and a few slow translucent ribbons. It renders at half size and is scaled up
   by CSS, so it stays cheap. With "reduce motion" turned on it draws one still frame.

   To re-theme it, change the BG colors (top to bottom) and the GLOW color below.
*/
(function () {
  'use strict';

  var BG = ['#051d52', '#093a96', '#1462cc'];
  var GLOW = 'rgba(80, 160, 255, 0.55)';
  var SCALE = 0.5;    // canvas pixels per screen pixel
  var FPS = 30;

  // each ribbon: vertical position (0-1), wave height, wave length, speed, thickness, opacity
  var RIBBONS = [
    { y: 0.62, amp: 0.10, len: 1.3, spd: 0.045, th: 0.20, a: 0.10, ph: 0.0 },
    { y: 0.70, amp: 0.13, len: 1.0, spd: -0.035, th: 0.16, a: 0.08, ph: 1.7 },
    { y: 0.55, amp: 0.08, len: 1.8, spd: 0.028, th: 0.26, a: 0.06, ph: 3.1 },
    { y: 0.80, amp: 0.09, len: 1.5, spd: 0.05, th: 0.12, a: 0.10, ph: 4.4 },
    { y: 0.45, amp: 0.07, len: 2.2, spd: -0.022, th: 0.20, a: 0.05, ph: 5.6 }
  ];

  function start(canvas) {
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, raf = 0, last = 0, t0 = performance.now();

    function size() {
      W = Math.max(2, Math.ceil(window.innerWidth * SCALE));
      H = Math.max(2, Math.ceil(window.innerHeight * SCALE));
      canvas.width = W; canvas.height = H;
    }

    function ribbon(r, t) {
      var step = 6, x, y, top = [], bot = [];
      var phase = r.ph + t * r.spd * 6.283;
      for (x = 0; x <= W + step; x += step) {
        var u = x / W * 6.283 / r.len;
        var wave = Math.sin(u + phase) * 0.6 + Math.sin(u * 2.1 + phase * 1.3 + 1.2) * 0.4;
        y = (r.y + wave * r.amp) * H;
        var th = r.th * H * (0.7 + 0.3 * Math.sin(u * 0.8 + phase * 0.7));
        top.push([x, y]); bot.push([x, y + th]);
      }
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      top.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
      for (var i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath();
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.35, 'rgba(255,255,255,' + r.a + ')');
      g.addColorStop(0.75, 'rgba(255,255,255,' + r.a * 0.6 + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fill();
    }

    function frame(now) {
      var t = (now - t0) / 1000;
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, BG[0]); g.addColorStop(0.55, BG[1]); g.addColorStop(1, BG[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      var glow = ctx.createRadialGradient(W * 0.12, H * 1.08, 0, W * 0.12, H * 1.08, Math.max(W, H) * 0.85);
      glow.addColorStop(0, GLOW); glow.addColorStop(1, 'rgba(80,160,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      RIBBONS.forEach(function (r) { ribbon(r, t); });
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      frame(now);
    }

    size();
    if (reduce) frame(t0 + 4000);
    else raf = requestAnimationFrame(loop);

    var timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { size(); if (reduce) frame(t0 + 4000); }, 120);
    });
  }

  window.Wallpaper = { start: start };
})();
