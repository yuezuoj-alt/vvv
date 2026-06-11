/**
 * 修改计划弹窗 — index 遮罩层（Figma 64-5769）
 */
(function (global) {
  "use strict";

  var DEFAULT_REMARK = "带一条防风外套";
  var DEFAULT_CLINIC = "红凌路预防接种站";

  var state = {
    vaccine: "",
    dose: "",
    date: "",
    clinic: "",
    remark: DEFAULT_REMARK,
    elements: null,
    getAppointment: null,
    onClose: null,
    onDelete: null,
    onComplete: null,
    onEditTime: null,
    onEditClinic: null,
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
    if (els.timeValue) els.timeValue.textContent = formatDateDisplay(state.date);
    if (els.clinicValue) els.clinicValue.textContent = state.clinic || DEFAULT_CLINIC;
    if (els.noteValue) els.noteValue.textContent = state.remark || DEFAULT_REMARK;
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

  function loadFromGetter() {
    if (typeof state.getAppointment !== "function") return false;
    var data = state.getAppointment();
    if (!data) return false;

    state.vaccine = data.vaccine || "";
    state.dose = data.dose || "";
    state.date = data.date || "";
    state.clinic = data.clinic || DEFAULT_CLINIC;
    state.remark = data.remark || DEFAULT_REMARK;
    return true;
  }

  function open(opts) {
    if (!state.elements) return false;

    if (opts) {
      state.vaccine = opts.vaccine || "";
      state.dose = opts.dose || "";
      state.date = opts.date || "";
      state.clinic = opts.clinic || DEFAULT_CLINIC;
      state.remark = opts.remark || DEFAULT_REMARK;
    } else if (!loadFromGetter()) {
      return false;
    }

    syncProfile();
    syncFields();

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
    }
    return true;
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

  function saveCurrentBooking() {
    if (!state.vaccine || !state.dose || !global.BabyProfile) return;
    global.BabyProfile.setBookedDose(state.vaccine, state.dose, {
      date: state.date,
      clinic: state.clinic,
      remark: state.remark
    });
  }

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.contentOverlay.addEventListener("click", close);
    els.btnDelete.addEventListener("click", function () {
      if (typeof state.onDelete === "function") {
        state.onDelete(getContext());
      }
    });
    els.btnComplete.addEventListener("click", function () {
      saveCurrentBooking();
      if (typeof state.onComplete === "function") {
        state.onComplete(getContext());
      }
    });

    if (els.timeRow) {
      els.timeRow.addEventListener("click", function () {
        saveCurrentBooking();
        if (typeof state.onEditTime === "function") {
          state.onEditTime(getContext());
        }
      });
    }

    if (els.clinicRow) {
      els.clinicRow.addEventListener("click", function () {
        saveCurrentBooking();
        if (typeof state.onEditClinic === "function") {
          state.onEditClinic(getContext());
        }
      });
    }

    if (els.noteArrow) {
      els.noteArrow.addEventListener("click", function (e) {
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
      babyAvatar: config.rootEl.querySelector("#editPlanBabyAvatar"),
      babyName: config.rootEl.querySelector("#editPlanBabyName"),
      babyBirth: config.rootEl.querySelector("#editPlanBabyBirth"),
      timeRow: config.rootEl.querySelector("#editPlanTimeRow"),
      clinicRow: config.rootEl.querySelector("#editPlanClinicRow"),
      noteArrow: config.rootEl.querySelector("#editPlanNoteArrow"),
      vaccineValue: config.rootEl.querySelector("#editPlanVaccineValue"),
      timeValue: config.rootEl.querySelector("#editPlanTimeValue"),
      clinicValue: config.rootEl.querySelector("#editPlanClinicValue"),
      noteValue: config.rootEl.querySelector("#editPlanNoteValue"),
      btnDelete: config.rootEl.querySelector("#editPlanBtnDelete"),
      btnComplete: config.rootEl.querySelector("#editPlanBtnComplete")
    };
    state.getAppointment = config.getAppointment;
    state.onClose = config.onClose;
    state.onDelete = config.onDelete;
    state.onComplete = config.onComplete;
    state.onEditTime = config.onEditTime;
    state.onEditClinic = config.onEditClinic;

    bindEvents();
  }

  global.VaccineEditPlan = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    DEFAULT_REMARK: DEFAULT_REMARK,
    DEFAULT_CLINIC: DEFAULT_CLINIC
  };
})(window);
