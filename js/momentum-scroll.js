/**
 * 列表惯性滚动 — 越界拉伸 + 边缘回弹（微信列表手感）
 */
(function (global) {
  "use strict";

  /* ========== 【首页列表惯性 / 越界回弹 — 在这里改】 ==========
   * maxRubber      越界最多能拉多长（像素）
   * rubberGain     同样手势下越界力度
   * rubberDamp     冲到边缘时还剩多少惯性（越大越顺、滑出越远）
   * springReturn   回弹柔和度（越小回弹越慢越软，越大越快）
   * friction       列表惯性滑行衰减（越大滑得越久）
   * touchBoost     手指松手后的滑行力度
   * ============================================================= */
  var WECHAT_PRESET = {
    maxRubber: 148,
    rubberGain: 0.54,
    rubberDamp: 0.9,
    springReturn: 0.072,
    friction: 0.962,
    touchBoost: 0.76
  };

  var DEFAULTS = Object.assign(
    {
      friction: 0.962,
      minVelocity: 0.28,
      maxVelocity: 72,
      wheelStopMs: 85,
      touchBoost: 0.76,
      wheelBoost: 0.1,
      bindWheel: true
    },
    WECHAT_PRESET
  );

  function prefersReducedMotion() {
    return (
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function ensureInnerWrapper(el) {
    var existing = el.querySelector("[data-momentum-inner]");
    if (existing) return existing;

    var inner = document.createElement("div");
    inner.className = "momentum-scroll-inner";
    inner.setAttribute("data-momentum-inner", "1");
    while (el.firstChild) {
      inner.appendChild(el.firstChild);
    }
    el.appendChild(inner);
    return inner;
  }

  function attach(el, options) {
    if (!el) return null;

    var opts = Object.assign({}, DEFAULTS, options || {});

    /* 兼容旧参数名 springStiffness / springDamping */
    if (options && options.springStiffness != null && options.springReturn == null) {
      opts.springReturn = options.springStiffness;
    }

    var contentEl = ensureInnerWrapper(el);
    var velocity = 0;
    var rubberY = 0;
    var rafId = null;
    var wheelAcc = 0;
    var wheelTimer = null;
    var touchTrack = [];
    var lastTouchY = 0;

    function maxScroll() {
      return Math.max(0, el.scrollHeight - el.clientHeight);
    }

    function cancel() {
      if (rafId) {
        global.cancelAnimationFrame(rafId);
        rafId = null;
      }
      velocity = 0;
      wheelAcc = 0;
      if (wheelTimer) {
        global.clearTimeout(wheelTimer);
        wheelTimer = null;
      }
    }

    function applyRubber() {
      if (Math.abs(rubberY) < 0.01) {
        contentEl.style.transform = "";
        rubberY = 0;
        return;
      }
      contentEl.style.transform = "translate3d(0," + rubberY + "px,0)";
    }

    function resetRubber() {
      rubberY = 0;
      applyRubber();
    }

    function rubberResistance() {
      var ratio = Math.abs(rubberY) / opts.maxRubber;
      return 1 / (1 + ratio * ratio * 2.4);
    }

    function addRubber(delta) {
      if (prefersReducedMotion()) {
        resetRubber();
        return;
      }

      rubberY += delta * opts.rubberGain * rubberResistance();

      if (rubberY > opts.maxRubber) {
        rubberY = opts.maxRubber + (rubberY - opts.maxRubber) * 0.06;
      } else if (rubberY < -opts.maxRubber) {
        rubberY = -opts.maxRubber + (rubberY + opts.maxRubber) * 0.06;
      }
    }

    function easeRubberBack() {
      if (Math.abs(rubberY) < 0.2) {
        resetRubber();
        return false;
      }

      /* 指数缓动回弹：无来回弹跳，接近微信列表 */
      rubberY += (0 - rubberY) * opts.springReturn;
      applyRubber();
      return true;
    }

    function shouldSkipTouch() {
      return opts.shouldSkipTouch && opts.shouldSkipTouch();
    }

    function tick() {
      var max = maxScroll();
      var moving = false;

      if (Math.abs(velocity) >= opts.minVelocity) {
        var next = el.scrollTop + velocity;

        if (next < 0) {
          el.scrollTop = 0;
          addRubber(-next * 0.85);
          velocity *= opts.rubberDamp;
        } else if (next > max) {
          el.scrollTop = max;
          addRubber(-(next - max) * 0.85);
          velocity *= opts.rubberDamp;
        } else {
          el.scrollTop = next;
          velocity *= opts.friction;
        }

        moving = true;
      }

      if (Math.abs(rubberY) > 0.01) {
        if (prefersReducedMotion()) {
          resetRubber();
        } else if (easeRubberBack()) {
          moving = true;
        }
      }

      if (!moving) {
        cancel();
        return;
      }

      rafId = global.requestAnimationFrame(tick);
    }

    function ensureAnimating() {
      if (!rafId) {
        rafId = global.requestAnimationFrame(tick);
      }
    }

    function start(rawVelocity) {
      if (prefersReducedMotion()) return;
      cancel();
      velocity = Math.max(
        -opts.maxVelocity,
        Math.min(opts.maxVelocity, rawVelocity)
      );
      if (Math.abs(velocity) < opts.minVelocity && Math.abs(rubberY) < 0.5) {
        return;
      }
      ensureAnimating();
    }

    function noteWheel(delta) {
      if (prefersReducedMotion()) return;
      if (rafId) cancel();
      wheelAcc += delta;
      if (wheelTimer) global.clearTimeout(wheelTimer);
      wheelTimer = global.setTimeout(function () {
        var v = wheelAcc * opts.wheelBoost;
        wheelAcc = 0;
        wheelTimer = null;
        start(v);
      }, opts.wheelStopMs);
    }

    function noteTouchEnd() {
      if (shouldSkipTouch() || touchTrack.length < 2) {
        touchTrack = [];
        if (Math.abs(rubberY) > 0.5) ensureAnimating();
        return;
      }

      var first = touchTrack[0];
      var last = touchTrack[touchTrack.length - 1];
      var dt = last.t - first.t;
      var scrollBefore = el.scrollTop;
      touchTrack = [];

      if (Math.abs(rubberY) > 0.5) {
        ensureAnimating();
      }

      if (dt < 12) return;

      global.setTimeout(function () {
        if (Math.abs(el.scrollTop - scrollBefore) > 1.5 && Math.abs(rubberY) < 0.5) {
          return;
        }
        var dy = first.y - last.y;
        start((dy / dt) * 16 * opts.touchBoost);
      }, 16);
    }

    el.addEventListener(
      "touchstart",
      function (e) {
        if (shouldSkipTouch()) return;
        cancel();
        lastTouchY = e.touches[0].clientY;
        touchTrack = [{ y: lastTouchY, t: global.performance.now() }];
      },
      { passive: true }
    );

    el.addEventListener(
      "touchmove",
      function (e) {
        if (shouldSkipTouch()) {
          touchTrack = [];
          return;
        }

        var y = e.touches[0].clientY;
        var dy = y - lastTouchY;
        lastTouchY = y;
        var now = global.performance.now();
        var max = maxScroll();

        touchTrack.push({ y: y, t: now });
        while (touchTrack.length > 6) touchTrack.shift();
        while (touchTrack.length > 1 && now - touchTrack[0].t > 120) {
          touchTrack.shift();
        }

        if (dy === 0) return;

        if (el.scrollTop <= 0 && dy > 0) {
          cancel();
          addRubber(dy);
          applyRubber();
          return;
        }

        if (el.scrollTop >= max - 1 && dy < 0) {
          cancel();
          addRubber(dy);
          applyRubber();
        }
      },
      { passive: true }
    );

    el.addEventListener(
      "touchend",
      function () {
        noteTouchEnd();
      },
      { passive: true }
    );

    el.addEventListener(
      "touchcancel",
      function () {
        touchTrack = [];
        cancel();
        if (Math.abs(rubberY) > 0.5) ensureAnimating();
      },
      { passive: true }
    );

    if (opts.bindWheel !== false) {
      el.addEventListener(
        "wheel",
        function (e) {
          var dy = e.deltaY;
          if (e.deltaMode === 1) dy *= 16;
          else if (e.deltaMode === 2) dy *= el.clientHeight;
          noteWheel(dy);
        },
        { passive: true }
      );
    }

    return {
      cancel: cancel,
      noteWheel: noteWheel
    };
  }

  global.MomentumScroll = {
    attach: attach,
    WECHAT_PRESET: WECHAT_PRESET
  };
})(typeof window !== "undefined" ? window : globalThis);
