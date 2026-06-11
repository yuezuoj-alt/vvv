/**
 * 接种预定时间弹窗 — index 遮罩层 + 日历选择
 */
(function (global) {
  "use strict";

  var state = {
    vaccine: "",
    dose: "",
    viewYear: 0,
    viewMonth: 0,
    selectedDate: null,
    elements: null,
    onNext: null,
    onClose: null,
    mounted: false
  };

  function formatMonthLabel(year, month) {
    return year + " 年 " + (month + 1) + " 月";
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function getToday() {
    return global.SystemTime ? global.SystemTime.getNow() : new Date();
  }

  function renderCalendar() {
    var els = state.elements;
    if (!els || !els.grid) return;

    els.monthLabel.textContent = formatMonthLabel(state.viewYear, state.viewMonth);

    var firstDay = new Date(state.viewYear, state.viewMonth, 1);
    var startWeekday = firstDay.getDay();
    var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    var today = getToday();
    var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    els.grid.innerHTML = "";

    for (var i = 0; i < startWeekday; i++) {
      var empty = document.createElement("div");
      empty.className = "day-cell empty";
      els.grid.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      (function (dayNum) {
        var cell = document.createElement("div");
        var date = new Date(state.viewYear, state.viewMonth, dayNum);
        var cellDate = new Date(date);
        cellDate.setHours(0, 0, 0, 0);

        cell.className = "day-cell";

        if (cellDate < todayStart) {
          cell.classList.add("disabled");
        } else {
          cell.classList.add("selectable");
          if (isSameDay(date, state.selectedDate)) {
            cell.classList.add("selected");
          }
          cell.addEventListener("click", function () {
            state.selectedDate = new Date(state.viewYear, state.viewMonth, dayNum);
            renderCalendar();
          });
        }

        if (cell.classList.contains("selected")) {
          var inner = document.createElement("span");
          inner.className = "day-inner";
          inner.textContent = dayNum;
          cell.appendChild(inner);
        } else {
          cell.textContent = dayNum;
        }

        els.grid.appendChild(cell);
      })(day);
    }
  }

  function open(opts) {
    if (!state.elements) return;

    var options = opts || {};
    state.vaccine = options.vaccine || "";
    state.dose = options.dose || "";

    var today = getToday();
    state.viewYear = today.getFullYear();
    state.viewMonth = today.getMonth();
    state.selectedDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    renderCalendar();

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
    }
  }

  function close() {
    if (!state.elements) return;

    var root = state.elements.root;
    var done = function () {
      if (typeof state.onClose === "function") {
        state.onClose();
      }
    };

    if (global.ModalMotion) {
      global.ModalMotion.close(root, done);
    } else {
      root.hidden = true;
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
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

    els.prevMonth.addEventListener("click", function () {
      state.viewMonth -= 1;
      if (state.viewMonth < 0) {
        state.viewMonth = 11;
        state.viewYear -= 1;
      }
      renderCalendar();
    });

    els.nextMonth.addEventListener("click", function () {
      state.viewMonth += 1;
      if (state.viewMonth > 11) {
        state.viewMonth = 0;
        state.viewYear += 1;
      }
      renderCalendar();
    });

    els.btnCancel.addEventListener("click", close);
    els.contentOverlay.addEventListener("click", close);

    els.btnNext.addEventListener("click", function () {
      if (typeof state.onNext !== "function") return;
      var y = state.selectedDate.getFullYear();
      var m = String(state.selectedDate.getMonth() + 1).padStart(2, "0");
      var d = String(state.selectedDate.getDate()).padStart(2, "0");
      state.onNext({
        vaccine: state.vaccine,
        dose: state.dose,
        date: y + "-" + m + "-" + d
      });
    });
  }

  function mount(config) {
    var rootEl = config.rootEl;
    state.elements = {
      root: rootEl,
      contentOverlay: rootEl.querySelector(".booking-content-overlay"),
      modalStack: rootEl.querySelector(".booking-modal-stack"),
      grid: rootEl.querySelector("#bookingCalendarGrid"),
      monthLabel: rootEl.querySelector("#bookingMonthLabel"),
      prevMonth: rootEl.querySelector("#bookingPrevMonth"),
      nextMonth: rootEl.querySelector("#bookingNextMonth"),
      btnCancel: rootEl.querySelector("#bookingBtnCancel"),
      btnNext: rootEl.querySelector("#bookingBtnNext")
    };
    state.onNext = config.onNext;
    state.onClose = config.onClose;

    bindEvents();
  }

  global.VaccineBookingTime = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen
  };
})(window);
