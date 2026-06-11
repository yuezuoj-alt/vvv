/**
 * 添加共享成员弹窗 — 我的页遮罩层（Figma 1-4100）
 */
(function (global) {
  "use strict";

  var SHARE_LINK = "https://vaccine.app/invite/abc123";

  var state = {
    elements: null,
    onClose: null,
    mounted: false
  };

  function open() {
    if (!state.elements) return false;
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
    state.elements.root.hidden = true;
    state.elements.root.classList.remove("is-open");
    state.elements.root.setAttribute("aria-hidden", "true");
    if (typeof state.onClose === "function") {
      state.onClose();
    }
  }

  function isOpen() {
    return !!(state.elements && state.elements.root && !state.elements.root.hidden);
  }

  function copyLink() {
    if (global.navigator && global.navigator.clipboard) {
      return global.navigator.clipboard.writeText(SHARE_LINK).then(function () {
        global.alert("链接已复制");
      }).catch(function () {
        global.prompt("复制以下链接", SHARE_LINK);
      });
    }
    global.prompt("复制以下链接", SHARE_LINK);
    return Promise.resolve();
  }

  function bindEvents() {
    var els = state.elements;
    if (!els || state.mounted) return;
    state.mounted = true;

    els.contentOverlay.addEventListener("click", close);
    els.btnCopyLink.addEventListener("click", function () {
      copyLink();
    });
    els.btnShareWechat.addEventListener("click", function () {
      global.alert("分享到微信");
    });
  }

  function mount(options) {
    if (!options || !options.rootEl) return false;

    state.elements = {
      root: options.rootEl,
      contentOverlay: options.rootEl.querySelector("#shareMemberContentOverlay"),
      btnCopyLink: options.rootEl.querySelector("#shareMemberCopyLinkBtn"),
      btnShareWechat: options.rootEl.querySelector("#shareMemberShareWechatBtn")
    };

    state.onClose = options.onClose || null;

    bindEvents();
    return true;
  }

  global.ShareMemberModal = {
    mount: mount,
    open: open,
    close: close,
    isOpen: isOpen,
    SHARE_LINK: SHARE_LINK
  };
})(window);
