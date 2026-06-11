/**
 * 提醒日期弹窗 — Figma 1-3945
 */
(function (global) {
  "use strict";

  var ITEM_H = 42;
  var WHEEL_H = 168;
  var DAYS = Array.from({ length: 30 }, function (_, i) {
    return i + 1;
  });

  var state = {
    elements: null,
    dayWheel: null,
    onClose: null,
    onConfirm: null,
    mounted: false
  };

  function loadCustomDays() {
    var stored = sessionStorage.getItem("customReminderDays");
    var days = stored ? parseInt(stored, 10) : 10;
    if (DAYS.indexOf(days) < 0) days = 10;
    return days;
  }

  function DayWheel(col, options) {
    this.col = col;
    this.itemHeight = ITEM_H;
    this.items = options.items;
    this.onChange = options.onChange || function () {};
    this.scrollTimer = null;
    this.bound = false;
  }

  DayWheel.prototype.getPadding = function () {
    var visible = this.col.clientHeight || WHEEL_H;
    return Math.max(0, (visible - this.itemHeight) / 2);
  };

  DayWheel.prototype.build = function () {
    var pad = this.getPadding();
    this.col.style.paddingTop = pad + "px";
    this.col.style.paddingBottom = pad + "px";
    this.col.innerHTML = "";
    var self = this;
    this.items.forEach(function (val) {
      var el = document.createElement("div");
      el.className = "wheel-item";
      el.textContent = String(val);
      self.col.appendChild(el);
    });
  };

  DayWheel.prototype.getIndex = function () {
    var idx = Math.round(this.col.scrollTop / this.itemHeight);
    return Math.max(0, Math.min(this.items.length - 1, idx));
  };

  DayWheel.prototype.getValue = function () {
    return this.items[this.getIndex()];
  };

  DayWheel.prototype.scrollToIndex = function (index, smooth) {
    if (smooth === undefined) smooth = true;
    this.col.style.scrollBehavior = smooth ? "smooth" : "auto";
    this.col.scrollTop = index * this.itemHeight;
    if (!smooth) this.col.style.scrollBehavior = "smooth";
  };

  DayWheel.prototype.updateActive = function () {
    var idx = this.getIndex();
    var items = this.col.querySelectorAll(".wheel-item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", i === idx);
    }
    this.onChange(this.items[idx], idx);
  };

  DayWheel.prototype.snap = function () {
    var self = this;
    this.scrollToIndex(this.getIndex());
    window.setTimeout(function () {
      self.updateActive();
    }, 100);
  };

  DayWheel.prototype.bind = function () {
    if (this.bound) return;
    this.bound = true;
    var self = this;
    this.col.addEventListener("scroll", function () {
      window.clearTimeout(self.scrollTimer);
      self.updateActive();
      self.scrollTimer = window.setTimeout(function () {
        self.snap();
      }, 80);
    });

    this.col.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        self.col.scrollTop += e.deltaY;
      },
      { passive: false }
    );

    this.col.addEventListener("touchend", function () {
      window.setTimeout(function () {
        self.snap();
      }, 50);
    });
  };

  DayWheel.prototype.setDays = function (days) {
    var index = DAYS.indexOf(days);
    if (index < 0) index = DAYS.indexOf(10);
    this.build();
    this.bind();
    this.scrollToIndex(index, false);
    this.updateActive();
  };

  function syncPreview(days) {
    if (state.elements && state.elements.previewDays) {
      state.elements.previewDays.textContent = "提前" + days + "天";
    }
  }

  function ensureWheel() {
    if (state.dayWheel) return;
    state.dayWheel = new DayWheel(state.elements.dayCol, {
      items: DAYS,
      onChange: function (val) {
        syncPreview(val);
      }
    });
  }

  function applyDays(days) {
    syncPreview(days);
    ensureWheel();
    state.dayWheel.setDays(days);
  }

  function open() {
    if (!state.elements) return false;
    var initialDays = loadCustomDays();
    var apply = function () {
      applyDays(initialDays);
    };

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root, apply);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(apply);
      });
    }
    return true;
  }

  function close() {
    if (!state.elements) return;

    var done = function () {
      if (typeof state.onClose === "function") {
        state.onClose();
      }
    };

    if (global.ModalMotion) {
      global.ModalMotion.close(state.elements.root, done);
    } else {
      state.elements.root.hidden = true;
      state.elements.root.classList.remove("is-open");
      state.elements.root.setAttribute("aria-hidden", "true");
      done();
    }
  }

  function isOpen() {
    return !!(state.elements && state.elements.root && !state.elements.root.hidden);
  }

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.contentOverlay.addEventListener("click", close);
    els.btnCancel.addEventListener("click", close);
    els.btnConfirm.addEventListener("click", function () {
      var days = state.dayWheel ? state.dayWheel.getValue() : loadCustomDays();
      if (typeof state.onConfirm === "function") {
        state.onConfirm({ days: days });
      }
    });
  }

  function mount(options) {
    if (!options || !options.rootEl) return false;

    state.elements = {
      root: options.rootEl,
      contentOverlay: options.rootEl.querySelector("#reminderDateContentOverlay"),
      previewDays: options.rootEl.querySelector("#reminderDatePreviewDays"),
      dayCol: options.rootEl.querySelector("#reminderDateDayCol"),
      btnCancel: options.rootEl.querySelector("#reminderDateBtnCancel"),
      btnConfirm: options.rootEl.querySelector("#reminderDateBtnConfirm")
    };

    state.onClose = options.onClose || null;
    state.onConfirm = options.onConfirm || null;

    bindEvents();
    return true;
  }

  global.ReminderDateModal = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    loadCustomDays: loadCustomDays
  };
})(window);
