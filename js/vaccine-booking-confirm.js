/**
 * 预定内容确认弹窗 — index 遮罩层（Figma 57-4841）
 */
(function (global) {
  "use strict";

  var DEFAULT_REMARK = "带一条防风外套";

  var state = {
    vaccine: "",
    dose: "",
    date: "",
    clinic: "",
    remark: DEFAULT_REMARK,
    elements: null,
    onConfirm: null,
    onClose: null,
    mounted: false
  };

  function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    var parts = dateStr.split("-");
    if (parts.length === 3) {
      return parts[0] + "." + parts[1] + "." + parts[2];
    }
    return dateStr.replace(/-/g, ".");
  }

  function syncProfile() {
    var els = state.elements;
    if (!els || !global.BabyProfile) return;

    var child = global.BabyProfile.getActiveChild();
    if (!child) return;

    if (els.babyName) els.babyName.textContent = child.name || "";
    if (els.babyBirth) els.babyBirth.textContent = child.birthText || "";
    if (els.babyAvatar) {
      els.babyAvatar.src =
        child.avatarLarge || child.avatar || child.avatarSmall ||
        (global.BabyProfile && global.BabyProfile.AVATAR_XIA) ||
        "images/unsplash_JfolIjRnveY.svg";
    }
  }

  function syncFields() {
    var els = state.elements;
    if (!els) return;

    if (els.vaccineValue) els.vaccineValue.textContent = state.vaccine || "";
    if (els.dateValue) els.dateValue.textContent = formatDateDisplay(state.date);
    if (els.clinicValue) els.clinicValue.textContent = state.clinic || "";
    if (els.remarkValue) els.remarkValue.textContent = state.remark || DEFAULT_REMARK;
  }

  function getContext() {
    return {
      vaccine: state.vaccine,
      dose: state.dose,
      date: state.date,
      clinic: state.clinic,
      remark: state.remark
    };
  }

  function open(opts) {
    if (!state.elements) return;

    var options = opts || {};
    state.vaccine = options.vaccine || "";
    state.dose = options.dose || "";
    state.date = options.date || "";
    state.clinic = options.clinic || "";
    state.remark = options.remark || DEFAULT_REMARK;

    syncProfile();
    syncFields();

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

    els.btnConfirm.addEventListener("click", function () {
      if (typeof state.onConfirm === "function") {
        state.onConfirm(getContext());
      }
    });

    if (els.remarkArrow) {
      els.remarkArrow.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!global.VaccineBookingRemark) return;
        global.VaccineBookingRemark.open({
          remark: state.remark || DEFAULT_REMARK,
          parentFlow: state.elements.root,
          onComplete: function (text) {
            state.remark = text || DEFAULT_REMARK;
            syncFields();
          },
          onCancel: function () {}
        });
      });
    }
  }

  function mount(config) {
    state.elements = {
      root: config.rootEl,
      contentOverlay: config.rootEl.querySelector(".booking-content-overlay"),
      babyAvatar: config.rootEl.querySelector("#confirmModalBabyAvatar"),
      babyName: config.rootEl.querySelector("#confirmModalBabyName"),
      babyBirth: config.rootEl.querySelector("#confirmModalBabyBirth"),
      vaccineValue: config.rootEl.querySelector("#confirmModalVaccine"),
      dateValue: config.rootEl.querySelector("#confirmModalDate"),
      clinicValue: config.rootEl.querySelector("#confirmModalClinic"),
      remarkValue: config.rootEl.querySelector("#confirmModalRemark"),
      remarkArrow: config.rootEl.querySelector("#confirmModalRemarkArrow"),
      btnCancel: config.rootEl.querySelector("#confirmModalBtnCancel"),
      btnConfirm: config.rootEl.querySelector("#confirmModalBtnConfirm")
    };
    state.onConfirm = config.onConfirm;
    state.onClose = config.onClose;

    bindEvents();
  }

  global.VaccineBookingConfirm = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    DEFAULT_REMARK: DEFAULT_REMARK
  };
})(window);
