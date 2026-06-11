/**
 * ModalMotion — 疫苗预约应用统一弹窗动效
 */
(function (global) {
  "use strict";

  var CSS_HREF = "css/modal-motion.css";
  var STYLE_ID = "modal-motion-styles";
  var ENTER_MS = 300;
  var LEAVE_MS = 220;

  var stack = [];
  var cssReady = false;

  var BACKDROP_SEL =
    ".modal-backdrop, .body-overlay, .booking-content-overlay, .reminder-date-overlay, " +
    ".reminder-time-overlay, .share-member-overlay";
  var PANEL_SEL =
    ".modal-panel, .growth-add-flow .modal, .booking-modal-stack, .reminder-date-stack, " +
    ".reminder-time-stack, .share-member-stack";

  var ROOT_SEL =
    ".modal-system, .booking-flow, .growth-add-flow, .reminder-date-flow, " +
    ".reminder-time-flow, .share-member-flow";

  function ensureStylesheet(done) {
    if (cssReady || document.getElementById(STYLE_ID)) {
      cssReady = true;
      if (done) done();
      return;
    }
    var link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = CSS_HREF + "?t=" + Date.now();
    link.onload = function () {
      cssReady = true;
      if (done) done();
    };
    link.onerror = function () {
      cssReady = true;
      if (done) done();
    };
    document.head.appendChild(link);
  }

  function isReducedMotion() {
    return (
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function enhanceRoot(root) {
    if (!root || root.getAttribute("data-modal-enhanced") === "1") return;
    root.setAttribute("data-modal-enhanced", "1");
    root.classList.add("modal-system");

    var backdrop = root.querySelector(BACKDROP_SEL);
    var panel = root.querySelector(PANEL_SEL);
    if (backdrop) backdrop.classList.add("modal-backdrop");
    if (panel) panel.classList.add("modal-panel");
  }

  function enhanceAll(root) {
    var scope = root || document;
    scope.querySelectorAll(ROOT_SEL).forEach(enhanceRoot);
  }

  function pushStack(root) {
    if (stack.indexOf(root) === -1) stack.push(root);
  }

  function popStack(root) {
    var idx = stack.indexOf(root);
    if (idx >= 0) stack.splice(idx, 1);
  }

  function open(root, done) {
    if (!root) return;

    ensureStylesheet(function () {
      enhanceRoot(root);
      pushStack(root);

      root.hidden = false;
      root.classList.remove("modal-system-leaving");
      root.setAttribute("aria-hidden", "false");

      if (isReducedMotion()) {
        root.classList.add("is-open");
        if (done) done();
        return;
      }

      global.requestAnimationFrame(function () {
        global.requestAnimationFrame(function () {
          root.classList.add("is-open");
          if (done) {
            global.setTimeout(done, ENTER_MS);
          }
        });
      });
    });
  }

  function close(root, done) {
    if (!root) {
      if (done) done();
      return;
    }

    var finish = function () {
      popStack(root);
      if (done) done();
    };

    if (isReducedMotion() || !root.classList.contains("is-open")) {
      root.classList.remove("is-open", "modal-system-leaving");
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      finish();
      return;
    }

    root.classList.remove("is-open");
    root.classList.add("modal-system-leaving");

    global.setTimeout(function () {
      root.classList.remove("modal-system-leaving");
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      finish();
    }, LEAVE_MS);
  }

  /** 切换弹窗时立即隐藏，不播放关闭动画 */
  function suspend(root) {
    if (!root) return;
    root.classList.remove("is-open", "modal-system-leaving");
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
  }

  /** 恢复被 suspend 的弹窗 */
  function resume(root, done) {
    if (!root) return;
    root.hidden = false;
    root.classList.remove("modal-system-leaving");
    root.setAttribute("aria-hidden", "false");

    if (isReducedMotion()) {
      root.classList.add("is-open");
      if (done) done();
      return;
    }

    global.requestAnimationFrame(function () {
      global.requestAnimationFrame(function () {
        root.classList.add("is-open");
        if (done) global.setTimeout(done, ENTER_MS);
      });
    });
  }

  function openPage(opts, done) {
    var backdrop = document.querySelector(opts && opts.backdrop);
    var panel = document.querySelector(opts && opts.panel);
    if (!backdrop || !panel) return;

    ensureStylesheet(function () {
      backdrop.classList.add("modal-backdrop", "modal-page-backdrop");
      panel.classList.add("modal-panel", "modal-page-panel");

      stack.push({ type: "page", backdrop: backdrop, panel: panel });

      backdrop.classList.remove("modal-system-leaving");
      panel.classList.remove("modal-system-leaving");

      if (isReducedMotion()) {
        backdrop.classList.add("is-open");
        panel.classList.add("is-open");
        if (done) done();
        return;
      }

      global.requestAnimationFrame(function () {
        global.requestAnimationFrame(function () {
          backdrop.classList.add("is-open");
          panel.classList.add("is-open");
          if (done) global.setTimeout(done, ENTER_MS);
        });
      });
    });
  }

  function closePage(opts, done) {
    var backdrop = document.querySelector(opts && opts.backdrop);
    var panel = document.querySelector(opts && opts.panel);
    if (!backdrop || !panel) {
      if (done) done();
      return;
    }

    for (var i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i] && stack[i].type === "page") {
        stack.splice(i, 1);
        break;
      }
    }

    var finish = function () {
      backdrop.classList.remove("is-open", "modal-system-leaving");
      panel.classList.remove("is-open", "modal-system-leaving");
      if (done) done();
    };

    if (isReducedMotion()) {
      finish();
      return;
    }

    backdrop.classList.remove("is-open");
    panel.classList.remove("is-open");
    backdrop.classList.add("modal-system-leaving");
    panel.classList.add("modal-system-leaving");

    global.setTimeout(finish, LEAVE_MS);
  }

  function boot() {
    ensureStylesheet(function () {
      enhanceAll();
    });
  }

  global.ModalMotion = {
    ENTER_MS: ENTER_MS,
    LEAVE_MS: LEAVE_MS,
    open: open,
    close: close,
    suspend: suspend,
    resume: resume,
    openPage: openPage,
    closePage: closePage,
    enhance: enhanceRoot,
    enhanceAll: enhanceAll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
