/**
 * 添加备注弹窗 — index 遮罩层（Figma 227-4175）
 * 背景为疫苗首页，非修改计划/确认弹窗
 */
(function (global) {
  "use strict";

  var state = {
    original: "",
    parentFlow: null,
    elements: null,
    onComplete: null,
    onCancel: null,
    mounted: false
  };

  function suspendParentFlow() {
    if (!state.parentFlow) return;
    if (global.ModalMotion) {
      global.ModalMotion.suspend(state.parentFlow);
    } else {
      state.parentFlow.hidden = true;
      state.parentFlow.classList.remove("is-open");
      state.parentFlow.setAttribute("aria-hidden", "true");
    }
  }

  function restoreParentFlow() {
    if (!state.parentFlow) return;
    var parent = state.parentFlow;
    state.parentFlow = null;
    if (global.ModalMotion) {
      global.ModalMotion.resume(parent);
    } else {
      parent.hidden = false;
      parent.classList.add("is-open");
      parent.setAttribute("aria-hidden", "false");
    }
  }

  function open(opts) {
    if (!state.elements) return;

    var options = opts || {};
    state.original = options.remark || "";
    state.onComplete = options.onComplete || null;
    state.onCancel = options.onCancel || null;
    state.parentFlow = options.parentFlow || null;

    suspendParentFlow();

    state.elements.input.value = state.original;

    var focusInput = function () {
      state.elements.input.focus();
      state.elements.input.setSelectionRange(
        state.elements.input.value.length,
        state.elements.input.value.length
      );
    };

    if (global.ModalMotion) {
      global.ModalMotion.open(state.elements.root, focusInput);
    } else {
      state.elements.root.hidden = false;
      state.elements.root.classList.add("is-open");
      state.elements.root.setAttribute("aria-hidden", "false");
      requestAnimationFrame(focusInput);
    }
  }

  function close() {
    if (!state.elements) return;

    var finish = function () {
      restoreParentFlow();
    };

    if (global.ModalMotion) {
      global.ModalMotion.close(state.elements.root, finish);
    } else {
      state.elements.root.hidden = true;
      state.elements.root.classList.remove("is-open");
      state.elements.root.setAttribute("aria-hidden", "true");
      finish();
    }
  }

  function isOpen() {
    return !!(state.elements && state.elements.root && !state.elements.root.hidden);
  }

  function cancelEdit() {
    if (typeof state.onCancel === "function") {
      state.onCancel(state.original);
    }
    close();
  }

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.btnCancel.addEventListener("click", cancelEdit);
    els.contentOverlay.addEventListener("click", cancelEdit);

    els.btnComplete.addEventListener("click", function () {
      var text = els.input.value.trim();
      if (typeof state.onComplete === "function") {
        state.onComplete(text);
      }
      close();
    });

    els.modalStack.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  function mount(config) {
    state.elements = {
      root: config.rootEl,
      contentOverlay: config.rootEl.querySelector(".booking-content-overlay"),
      modalStack: config.rootEl.querySelector(".booking-modal-stack"),
      input: config.rootEl.querySelector("#remarkInput"),
      btnCancel: config.rootEl.querySelector("#remarkBtnCancel"),
      btnComplete: config.rootEl.querySelector("#remarkBtnComplete")
    };

    bindEvents();
  }

  global.VaccineBookingRemark = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen
  };
})(window);
