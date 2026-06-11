/**
 * 接种门诊弹窗 — index 遮罩层 + 门诊信息（Figma 57-4363）
 */
(function (global) {
  "use strict";

  var DEFAULT_CLINIC = "红凌路预防接种站";

  var state = {
    vaccine: "",
    dose: "",
    date: "",
    clinic: DEFAULT_CLINIC,
    elements: null,
    onNext: null,
    onSelectClinic: null,
    onClose: null,
    mounted: false
  };

  function open(opts) {
    if (!state.elements) return;

    var options = opts || {};
    state.vaccine = options.vaccine || "";
    state.dose = options.dose || "";
    state.date = options.date || "";
    state.clinic = options.clinic || DEFAULT_CLINIC;

    if (state.elements.clinicName) {
      state.elements.clinicName.textContent = state.clinic;
    }

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
    }  }

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

    els.btnCancel.addEventListener("click", close);
    els.contentOverlay.addEventListener("click", close);

    els.clinicSelectRow.addEventListener("click", function () {
      if (typeof state.onSelectClinic !== "function") return;
      state.onSelectClinic({
        vaccine: state.vaccine,
        dose: state.dose,
        date: state.date,
        clinic: state.clinic
      });
    });

    els.btnNext.addEventListener("click", function () {
      if (typeof state.onNext !== "function") return;
      state.onNext({
        vaccine: state.vaccine,
        dose: state.dose,
        date: state.date,
        clinic: state.clinic
      });
    });
  }

  function mount(config) {
    var rootEl = config.rootEl;
    state.elements = {
      root: rootEl,
      contentOverlay: rootEl.querySelector(".booking-content-overlay"),
      clinicName: rootEl.querySelector("#clinicModalClinicName"),
      clinicSelectRow: rootEl.querySelector("#clinicModalSelectRow"),
      btnCancel: rootEl.querySelector("#clinicModalBtnCancel"),
      btnNext: rootEl.querySelector("#clinicModalBtnNext")
    };
    state.onNext = config.onNext;
    state.onSelectClinic = config.onSelectClinic;
    state.onClose = config.onClose;

    bindEvents();
  }

  global.VaccineBookingClinic = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    DEFAULT_CLINIC: DEFAULT_CLINIC
  };
})(window);
