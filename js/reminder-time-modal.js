/**
 * 提醒时间弹窗 — Figma 1-3780
 */
(function (global) {
  "use strict";

  var ITEM_H = 42;
  var WHEEL_H = 168;
  var STORAGE_KEY = "reminderTime";
  var PERIODS = ["上午", "下午"];
  var HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var MINUTES = Array.from({ length: 60 }, function (_, i) {
    return i;
  });
  var DEFAULT_TIME = { period: "上午", hour: 10, minute: 0 };

  var state = {
    elements: null,
    wheels: null,
    draft: null,
    onClose: null,
    onConfirm: null,
    mounted: false
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function loadReminderTime() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && PERIODS.indexOf(parsed.period) !== -1) {
          return {
            period: parsed.period,
            hour: Math.min(12, Math.max(1, parseInt(parsed.hour, 10) || DEFAULT_TIME.hour)),
            minute: Math.min(59, Math.max(0, parseInt(parsed.minute, 10) || 0))
          };
        }
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULT_TIME);
  }

  function formatBadge(time) {
    return time.period + " " + pad2(time.hour) + ":" + pad2(time.minute);
  }

  function TimeWheel(col, options) {
    this.col = col;
    this.itemHeight = ITEM_H;
    this.items = options.items;
    this.formatItem = options.formatItem || function (value) {
      return String(value);
    };
    this.formatActive = options.formatActive || this.formatItem;
    this.onChange = options.onChange || function () {};
    this.scrollTimer = null;
    this.bound = false;
  }

  TimeWheel.prototype.getPadding = function () {
    var visible = this.col.clientHeight || WHEEL_H;
    return Math.max(0, (visible - this.itemHeight) / 2);
  };

  TimeWheel.prototype.build = function () {
    var pad = this.getPadding();
    this.col.style.paddingTop = pad + "px";
    this.col.style.paddingBottom = pad + "px";
    this.col.innerHTML = "";
    var self = this;
    this.items.forEach(function (value, index) {
      var item = document.createElement("div");
      item.className = "wheel-item";
      item.textContent = self.formatItem(value, index);
      self.col.appendChild(item);
    });
  };

  TimeWheel.prototype.getIndex = function () {
    var index = Math.round(this.col.scrollTop / this.itemHeight);
    return Math.max(0, Math.min(this.items.length - 1, index));
  };

  TimeWheel.prototype.getValue = function () {
    return this.items[this.getIndex()];
  };

  TimeWheel.prototype.scrollToIndex = function (index, smooth) {
    if (smooth === undefined) smooth = true;
    this.col.style.scrollBehavior = smooth ? "smooth" : "auto";
    this.col.scrollTop = index * this.itemHeight;
    if (!smooth) this.col.style.scrollBehavior = "smooth";
  };

  TimeWheel.prototype.updateActive = function () {
    var index = this.getIndex();
    var self = this;
    this.col.querySelectorAll(".wheel-item").forEach(function (node, i) {
      var active = i === index;
      node.classList.toggle("active", active);
      node.textContent = active
        ? self.formatActive(self.items[i], i)
        : self.formatItem(self.items[i], i);
    });
    this.onChange(this.items[index], index);
  };

  TimeWheel.prototype.snap = function () {
    var self = this;
    this.scrollToIndex(this.getIndex());
    window.setTimeout(function () {
      self.updateActive();
    }, 100);
  };

  TimeWheel.prototype.bind = function () {
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
      function (event) {
        event.preventDefault();
        self.col.scrollTop += event.deltaY;
      },
      { passive: false }
    );

    this.col.addEventListener("touchend", function () {
      window.setTimeout(function () {
        self.snap();
      }, 50);
    });
  };

  TimeWheel.prototype.setIndex = function (index) {
    this.build();
    this.bind();
    this.scrollToIndex(index, false);
    this.updateActive();
  };

  function syncPreview() {
    if (state.elements && state.elements.previewTime && state.draft) {
      state.elements.previewTime.textContent = formatBadge(state.draft);
    }
  }

  function ensureWheels() {
    if (state.wheels) return;
    var els = state.elements;
    state.wheels = {
      period: new TimeWheel(els.periodCol, {
        items: PERIODS,
        onChange: function (value) {
          state.draft.period = value;
          syncPreview();
        }
      }),
      hour: new TimeWheel(els.hourCol, {
        items: HOURS,
        formatItem: function (value) {
          return String(value);
        },
        formatActive: function (value) {
          return pad2(value);
        },
        onChange: function (value) {
          state.draft.hour = value;
          syncPreview();
        }
      }),
      minute: new TimeWheel(els.minuteCol, {
        items: MINUTES,
        formatItem: pad2,
        formatActive: pad2,
        onChange: function (value) {
          state.draft.minute = value;
          syncPreview();
        }
      })
    };
  }

  function applyTime(initial) {
    state.draft = {
      period: initial.period,
      hour: initial.hour,
      minute: initial.minute
    };
    syncPreview();
    ensureWheels();
    state.wheels.period.setIndex(PERIODS.indexOf(initial.period));
    state.wheels.hour.setIndex(HOURS.indexOf(initial.hour));
    state.wheels.minute.setIndex(initial.minute);
  }

  function getSelectedTime() {
    if (state.wheels) {
      return {
        period: state.wheels.period.getValue(),
        hour: state.wheels.hour.getValue(),
        minute: state.wheels.minute.getValue()
      };
    }
    return loadReminderTime();
  }

  function open() {
    if (!state.elements) return false;
    var initial = loadReminderTime();
    var apply = function () {
      applyTime(initial);
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
    if (!state.elements || state.mounted) return;
    state.mounted = true;

    state.elements.contentOverlay.addEventListener("click", close);
    state.elements.btnCancel.addEventListener("click", close);
    state.elements.btnConfirm.addEventListener("click", function () {
      if (typeof state.onConfirm === "function") {
        state.onConfirm(getSelectedTime());
      }
    });
  }

  function mount(options) {
    if (!options || !options.rootEl) return false;

    state.elements = {
      root: options.rootEl,
      contentOverlay: options.rootEl.querySelector("#reminderTimeContentOverlay"),
      previewTime: options.rootEl.querySelector("#reminderTimePreviewTime"),
      periodCol: options.rootEl.querySelector("#reminderTimePeriodCol"),
      hourCol: options.rootEl.querySelector("#reminderTimeHourCol"),
      minuteCol: options.rootEl.querySelector("#reminderTimeMinuteCol"),
      btnCancel: options.rootEl.querySelector("#reminderTimeBtnCancel"),
      btnConfirm: options.rootEl.querySelector("#reminderTimeBtnConfirm")
    };

    state.onClose = options.onClose || null;
    state.onConfirm = options.onConfirm || null;

    bindEvents();
    return true;
  }

  global.ReminderTimeModal = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    loadReminderTime: loadReminderTime,
    DEFAULT_TIME: DEFAULT_TIME
  };
})(window);
