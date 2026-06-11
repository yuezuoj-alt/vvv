/**
 * 疫苗隐藏确认弹窗 — index 遮罩层（Figma 58-6939）
 */
(function (global) {
  "use strict";

  var state = {
    vaccine: "",
    elements: null,
    onClose: null,
    onConfirm: null,
    mounted: false
  };

  function open(opts) {
    if (!state.elements) return false;

    state.vaccine = (opts && opts.vaccine) || "";

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

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.contentOverlay.addEventListener("click", close);
    els.btnCancel.addEventListener("click", close);
    els.btnConfirm.addEventListener("click", function () {
      if (typeof state.onConfirm === "function") {
        state.onConfirm({ vaccine: state.vaccine });
      }
    });
  }

  function mount(options) {
    if (!options || !options.rootEl) return false;

    state.elements = {
      root: options.rootEl,
      contentOverlay: options.rootEl.querySelector("#hideConfirmContentOverlay"),
      btnCancel: options.rootEl.querySelector("#hideConfirmBtnCancel"),
      btnConfirm: options.rootEl.querySelector("#hideConfirmBtnConfirm")
    };

    state.onClose = options.onClose || null;
    state.onConfirm = options.onConfirm || null;

    bindEvents();
    return true;
  }

  global.VaccineHideConfirm = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen
  };
})(window);
