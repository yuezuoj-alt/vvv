/**
 * 接种门诊选择弹窗 — index 遮罩层（Figma 57-4605）
 */
(function (global) {
  "use strict";

  var DEFAULT_CLINICS = [
    "红凌路预防接种站",
    "中山区桃源街道社区卫生服务中心",
    "南山街预防接种门诊"
  ];

  var state = {
    vaccine: "",
    dose: "",
    date: "",
    clinic: "",
    elements: null,
    onBack: null,
    onSelect: null,
    onAddClinic: null,
    mounted: false
  };

  function getExtraClinics() {
    try {
      return JSON.parse(sessionStorage.getItem("extraClinics") || "[]");
    } catch (e) {
      return [];
    }
  }

  function getAllClinicNames() {
    var names = DEFAULT_CLINICS.slice();
    getExtraClinics().forEach(function (name) {
      if (names.indexOf(name) === -1) {
        names.push(name);
      }
    });
    if (state.clinic && names.indexOf(state.clinic) === -1) {
      names.push(state.clinic);
    }
    return names;
  }

  function getContext() {
    return {
      vaccine: state.vaccine,
      dose: state.dose,
      date: state.date,
      clinic: state.clinic
    };
  }

  function updateSelection(name) {
    state.clinic = name;
    if (!state.elements || !state.elements.list) return;

    state.elements.list.querySelectorAll(".booking-clinic-option").forEach(function (opt) {
      opt.classList.toggle("selected", opt.dataset.clinic === name);
    });
  }

  function bindClinicOption(opt) {
    opt.addEventListener("click", function () {
      var name = opt.dataset.clinic || "";
      updateSelection(name);
      if (typeof state.onSelect === "function") {
        setTimeout(function () {
          state.onSelect(getContext());
        }, 200);
      }
    });
  }

  function renderList() {
    var els = state.elements;
    if (!els || !els.list) return;

    var names = getAllClinicNames();
    var html = "";

    names.forEach(function (name, index) {
      if (index > 0) {
        html += '<div class="booking-clinic-option-divider"></div>';
      }
      html +=
        '<button class="booking-clinic-option" type="button" data-clinic="' +
        name +
        '">' +
        '<span class="booking-radio-wrap"></span>' +
        '<span class="booking-clinic-option-name">' +
        name +
        "</span>" +
        "</button>";
    });

    els.list.innerHTML = html;
    els.list.querySelectorAll(".booking-clinic-option").forEach(bindClinicOption);
    updateSelection(state.clinic);
  }

  function open(opts) {
    if (!state.elements) return;

    var options = opts || {};
    state.vaccine = options.vaccine || "";
    state.dose = options.dose || "";
    state.date = options.date || "";
    state.clinic = options.clinic || global.VaccineBookingClinic
      ? global.VaccineBookingClinic.DEFAULT_CLINIC
      : "红凌路预防接种站";

    renderList();

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
    }  }

  function close() {
    if (!state.elements) return;

    if (global.ModalMotion) {
      global.ModalMotion.close(state.elements.root);
    } else {
      state.elements.root.hidden = true;
      state.elements.root.classList.remove("is-open");
      state.elements.root.setAttribute("aria-hidden", "true");
    }
  }

  function isOpen() {
    return !!(state.elements && state.elements.root && !state.elements.root.hidden);
  }

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.btnBack.addEventListener("click", function () {
      if (typeof state.onBack === "function") {
        state.onBack(getContext());
      } else {
        close();
      }
    });

    els.contentOverlay.addEventListener("click", function () {
      if (typeof state.onBack === "function") {
        state.onBack(getContext());
      } else {
        close();
      }
    });

    els.btnAddClinic.addEventListener("click", function () {
      if (typeof state.onAddClinic === "function") {
        state.onAddClinic(getContext());
      }
    });
  }

  function mount(config) {
    state.elements = {
      root: config.rootEl,
      contentOverlay: config.rootEl.querySelector(".booking-content-overlay"),
      list: config.rootEl.querySelector("#clinicSelectList"),
      btnBack: config.rootEl.querySelector("#clinicSelectBtnBack"),
      btnAddClinic: config.rootEl.querySelector("#clinicSelectBtnAdd")
    };
    state.onBack = config.onBack;
    state.onSelect = config.onSelect;
    state.onAddClinic = config.onAddClinic;

    bindEvents();
  }

  global.VaccineBookingClinicSelect = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    DEFAULT_CLINICS: DEFAULT_CLINICS
  };
})(window);
