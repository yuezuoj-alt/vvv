/**
 * GrowthRecordAdd — 成长记录添加弹窗（叠在成长记录页上）
 */
(function (global) {
  "use strict";

  var ITEM_H = 42;
  var HEIGHT_ITEM_H = 77;
  var flow = null;
  var overlay = null;
  var modal = null;
  var initialized = false;
  var yearWheel, monthWheel, dayWheel, heightWheel, weightDial;
  var selectedYear, selectedMonth;
  var years, months;

class VerticalWheel {
      constructor(col, options) {
        this.col = col;
        this.itemHeight = options.itemHeight || ITEM_H;
        this.items = options.items;
        this.defaultIndex = options.defaultIndex || 0;
        this.formatActive = options.formatActive || ((v) => String(v));
        this.formatItem = options.formatItem || ((v) => String(v));
        this.onChange = options.onChange || (() => {});
        this.scrollTimer = null;
        this.build();
        this.bind();
        requestAnimationFrame(() => {
          this.scrollToIndex(this.defaultIndex, false);
          this.updateActive();
        });
      }

      build() {
        const pad = this.getPadding();
        this.col.style.paddingTop = pad + "px";
        this.col.style.paddingBottom = pad + "px";
        this.col.innerHTML = "";
        this.items.forEach((val, i) => {
          const el = document.createElement("div");
          el.className = "wheel-item";
          el.textContent = this.formatItem(val, i);
          this.col.appendChild(el);
        });
      }

      getPadding() {
        const visible = this.col.clientHeight || (this.itemHeight === HEIGHT_ITEM_H ? 224 : 126);
        return Math.max(0, (visible - this.itemHeight) / 2);
      }

      getIndex() {
        const idx = Math.round(this.col.scrollTop / this.itemHeight);
        return Math.max(0, Math.min(this.items.length - 1, idx));
      }

      scrollToIndex(index, smooth = true) {
        this.col.style.scrollBehavior = smooth ? "smooth" : "auto";
        this.col.scrollTop = index * this.itemHeight;
        if (!smooth) this.col.style.scrollBehavior = "smooth";
      }

      updateActive() {
        const idx = this.getIndex();
        this.col.querySelectorAll(".wheel-item").forEach((el, i) => {
          const active = i === idx;
          el.classList.toggle("active", active);
          el.textContent = active
            ? this.formatActive(this.items[i], i)
            : this.formatItem(this.items[i], i);
        });
        this.onChange(this.items[idx], idx);
      }

      snap() {
        this.scrollToIndex(this.getIndex());
        setTimeout(() => this.updateActive(), 100);
      }

      bind() {
        this.col.addEventListener("scroll", () => {
          clearTimeout(this.scrollTimer);
          this.updateActive();
          this.scrollTimer = setTimeout(() => this.snap(), 80);
        });

        this.col.addEventListener("wheel", (e) => {
          e.preventDefault();
          this.col.scrollTop += e.deltaY;
        }, { passive: false });

        this.col.addEventListener("touchend", () => {
          setTimeout(() => this.snap(), 50);
        });
      }

      setItems(items, nextIndex) {
        this.items = items;
        this.defaultIndex = nextIndex;
        this.build();
        this.scrollToIndex(nextIndex, false);
        this.updateActive();
      }
    }

    class DialWheel {
      constructor(viewport, ring, options) {
        this.viewport = viewport;
        this.ring = ring;
        this.min = options.min;
        this.max = options.max;
        this.step = options.step || 0.1;
        this.defaultValue = options.defaultValue;
        this.kgStepAngle = options.kgStepAngle || 20;
        this.stepAngle = this.kgStepAngle / 10;
        this.visibleHalfSteps = options.visibleHalfSteps || 80;
        this.cx = 186;
        this.cy = 186;
        this.tickOuter = 180;
        this.tickMajorInner = 163;
        this.tickMidInner = 168;
        this.tickMinorInner = 173;
        this.labelRadius = 196;
        this.totalSteps = Math.round((this.max - this.min) / this.step);
        this.offsetSteps = Math.round((this.defaultValue - this.min) / this.step);
        this.offsetSteps = Math.max(0, Math.min(this.totalSteps, this.offsetSteps));
        this.dragging = false;
        this.startX = 0;
        this.startOffsetSteps = 0;
        this.tickGroup = null;
        this.labelGroup = null;
        this.buildShell();
        this.bind();
        this.paint(this.offsetSteps, false);
      }

      getValue() {
        const index = Math.round(this.offsetSteps);
        return Math.round((this.min + index * this.step) * 10) / 10;
      }

      clampOffsetSteps(steps) {
        return Math.max(0, Math.min(this.totalSteps, steps));
      }

      angleForStep(stepIndex, centerSteps) {
        return (stepIndex - centerSteps) * this.stepAngle - 90;
      }

      polarXY(radius, angleDeg) {
        const rad = (angleDeg * Math.PI) / 180;
        return {
          x: this.cx + radius * Math.cos(rad),
          y: this.cy + radius * Math.sin(rad)
        };
      }

      buildShell() {
        this.ring.innerHTML = "";
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "weight-dial-svg");
        svg.setAttribute("viewBox", "0 -28 372 372");

        this.tickGroup = document.createElementNS(svgNS, "g");
        this.tickGroup.setAttribute("class", "dial-ticks");
        this.labelGroup = document.createElementNS(svgNS, "g");
        this.labelGroup.setAttribute("class", "dial-labels");

        svg.appendChild(this.tickGroup);
        svg.appendChild(this.labelGroup);
        this.ring.appendChild(svg);
      }

      paint(centerSteps, animate) {
        const svgNS = "http://www.w3.org/2000/svg";
        const center = this.clampOffsetSteps(centerSteps);
        const iMin = Math.max(0, Math.floor(center - this.visibleHalfSteps));
        const iMax = Math.min(this.totalSteps, Math.ceil(center + this.visibleHalfSteps));
        const currentValue = Math.round((this.min + center * this.step) * 10) / 10;

        this.offsetSteps = center;
        this.ring.classList.toggle("snapping", animate);
        this.tickGroup.innerHTML = "";
        this.labelGroup.innerHTML = "";

        for (let i = iMin; i <= iMax; i++) {
          const tenth = i % 10;
          let inner;
          let cls;
          if (tenth === 0) {
            inner = this.tickMajorInner;
            cls = "tick-major";
          } else if (tenth === 5) {
            inner = this.tickMidInner;
            cls = "tick-mid";
          } else {
            inner = this.tickMinorInner;
            cls = "tick-minor";
          }

          const angleDeg = this.angleForStep(i, center);
          const innerPt = this.polarXY(inner, angleDeg);
          const outerPt = this.polarXY(this.tickOuter, angleDeg);
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", innerPt.x.toFixed(2));
          line.setAttribute("y1", innerPt.y.toFixed(2));
          line.setAttribute("x2", outerPt.x.toFixed(2));
          line.setAttribute("y2", outerPt.y.toFixed(2));
          line.setAttribute("class", cls);
          this.tickGroup.appendChild(line);
        }

        const kgMin = Math.max(this.min, Math.floor(this.min + iMin * this.step));
        const kgMax = Math.min(this.max, Math.ceil(this.min + iMax * this.step));
        for (let kg = kgMin; kg <= kgMax; kg += 1) {
          const stepIndex = Math.round((kg - this.min) / this.step);
          const angleDeg = this.angleForStep(stepIndex, center);
          if (angleDeg < -145 || angleDeg > -35) continue;
          if (Math.abs(angleDeg + 90) < 16) continue;

          const pt = this.polarXY(this.labelRadius, angleDeg);
          const text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", pt.x.toFixed(2));
          text.setAttribute("y", pt.y.toFixed(2));
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("dominant-baseline", "middle");
          text.setAttribute("class", "dial-label");
          text.setAttribute(
            "transform",
            "rotate(" + (angleDeg + 90).toFixed(2) + " " + pt.x.toFixed(2) + " " + pt.y.toFixed(2) + ")"
          );
          text.textContent = String(Math.round(kg));
          this.labelGroup.appendChild(text);
        }

        const centerPt = this.polarXY(this.labelRadius, -90);
        const centerText = document.createElementNS(svgNS, "text");
        centerText.setAttribute("x", centerPt.x.toFixed(2));
        centerText.setAttribute("y", centerPt.y.toFixed(2));
        centerText.setAttribute("text-anchor", "middle");
        centerText.setAttribute("dominant-baseline", "middle");
        centerText.setAttribute("class", "dial-label active");
        centerText.setAttribute(
          "transform",
          "rotate(0 " + centerPt.x.toFixed(2) + " " + centerPt.y.toFixed(2) + ")"
        );
        centerText.textContent = Number.isInteger(currentValue)
          ? String(currentValue)
          : currentValue.toFixed(1);
        this.labelGroup.appendChild(centerText);
      }

      bind() {
        const self = this;

        const onDown = (x) => {
          self.dragging = true;
          self.startX = x;
          self.startOffsetSteps = self.offsetSteps;
          self.viewport.classList.add("dragging");
          self.ring.classList.remove("snapping");
        };

        const onMove = (x) => {
          if (!self.dragging) return;
          const delta = x - self.startX;
          self.offsetSteps = self.clampOffsetSteps(
            self.startOffsetSteps - (delta * 0.55) / self.stepAngle
          );
          self.paint(self.offsetSteps, false);
        };

        const onUp = () => {
          if (!self.dragging) return;
          self.dragging = false;
          self.viewport.classList.remove("dragging");
          self.offsetSteps = Math.round(self.offsetSteps);
          self.paint(self.offsetSteps, true);
        };

        this.viewport.addEventListener("mousedown", (e) => {
          e.preventDefault();
          onDown(e.clientX);
        });

        window.addEventListener("mousemove", (e) => onMove(e.clientX));
        window.addEventListener("mouseup", onUp);

        this.viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
        this.viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
        this.viewport.addEventListener("touchend", onUp);

        this.viewport.addEventListener("wheel", (e) => {
          e.preventDefault();
          const direction = e.deltaY > 0 ? 1 : -1;
          self.offsetSteps = self.clampOffsetSteps(self.offsetSteps + direction * 0.8);
          self.offsetSteps = Math.round(self.offsetSteps);
          self.paint(self.offsetSteps, true);
        }, { passive: false });
      }
    }

    function getDaysInMonth(year, month) {
      return new Date(year, month, 0).getDate();
    }

    function buildDays(year, month) {
      const total = getDaysInMonth(year, month);
      return Array.from({ length: total }, (_, i) => String(i + 1).padStart(2, "0"));
    }

    
  function ensurePickers() {
    if (initialized) return;
    initialized = true;

    years = [2024, 2025, 2026, 2027, 2028];
    months = Array.from({ length: 12 }, function (_, i) {
      return String(i + 1).padStart(2, "0");
    });

    var today = global.SystemTime.getNow();
    selectedYear = today.getFullYear();
    selectedMonth = today.getMonth() + 1;
    var todayDay = today.getDate();

    if (years.indexOf(selectedYear) < 0) {
      years.push(selectedYear);
      years.sort(function (a, b) { return a - b; });
    }

    yearWheel = new VerticalWheel(document.getElementById("growthYearCol"), {
      items: years,
      defaultIndex: Math.max(0, years.indexOf(selectedYear)),
      onChange: function (val) {
        selectedYear = val;
        refreshDays();
      }
    });

    monthWheel = new VerticalWheel(document.getElementById("growthMonthCol"), {
      items: months,
      defaultIndex: selectedMonth - 1,
      onChange: function (val) {
        selectedMonth = Number(val);
        refreshDays();
      }
    });

    document.getElementById("growthMonthCol").classList.add("month");
    document.getElementById("growthDayCol").classList.add("day");

    dayWheel = new VerticalWheel(document.getElementById("growthDayCol"), {
      items: buildDays(selectedYear, selectedMonth),
      defaultIndex: todayDay - 1
    });

    var heights = [];
    for (var h = 100; h >= 50; h -= 0.5) heights.push(h);

    heightWheel = new VerticalWheel(document.getElementById("growthHeightCol"), {
      items: heights,
      itemHeight: HEIGHT_ITEM_H,
      defaultIndex: 60,
      formatActive: function (v) { return v.toFixed(1); },
      formatItem: function (v) { return v.toFixed(1); }
    });

    weightDial = new DialWheel(
      document.getElementById("growthWeightDialViewport"),
      document.getElementById("growthWeightDialRing"),
      { min: 0, max: 100, step: 0.1, defaultValue: 3.2, kgStepAngle: 20 }
    );
  }

  function bindUi() {
    flow = document.getElementById("growthAddFlow");
    overlay = document.getElementById("growthAddOverlay");
    modal = flow ? flow.querySelector(".growth-add-modal") : null;
    if (!flow || !overlay || !modal) return;

    document.getElementById("growthAddConfirmBtn").addEventListener("click", saveRecord);
    overlay.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  function close() {
    if (!flow) return;
    if (global.ModalMotion) {
      global.ModalMotion.close(flow);
    } else {
      flow.hidden = true;
      flow.classList.remove("is-open");
      flow.setAttribute("aria-hidden", "true");
    }
  }

  function open() {
    if (!flow) bindUi();
    if (!flow) return;
    ensurePickers();
    if (global.ModalMotion) {
      global.ModalMotion.open(flow);
    } else {
      flow.hidden = false;
      flow.classList.add("is-open");
      flow.setAttribute("aria-hidden", "false");
    }
  }

  function init() {
    bindUi();
    if (global.location.hash === "#add") {
      global.history.replaceState(null, "", global.location.pathname + global.location.search);
      open();
    }
  }

  global.GrowthRecordAdd = { init: init, open: open, close: close };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
