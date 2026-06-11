/**
 * 加载 css/baby-profile.css（file:// 与 http 均可用）
 * 并把 --profile-text-offset-x 同步为内联 transform，确保改 CSS 一定生效
 */
(function (global) {
  "use strict";

  var STYLE_ID = "baby-profile-styles";
  var CSS_HREF = "css/baby-profile.css";
  var DEFAULT_OFFSET = "3px";

  function readOffsetFromCss() {
    try {
      var value = getComputedStyle(document.documentElement)
        .getPropertyValue("--profile-text-offset-x")
        .trim();
      if (value) return value;
    } catch (e) { /* ignore */ }
    return DEFAULT_OFFSET;
  }

  function applyProfileTextOffset() {
    var offset = "0px";
    try {
      var value = getComputedStyle(document.documentElement)
        .getPropertyValue("--profile-text-offset-x")
        .trim();
      if (value) offset = value;
    } catch (e) { /* ignore */ }
    document.querySelectorAll(".profile-pill .text-wrap").forEach(function (el) {
      el.style.transform = "translateX(" + offset + ")";
    });
  }

  function scheduleApply() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyProfileTextOffset);
    } else {
      applyProfileTextOffset();
    }
  }

  function ensureStylesheet() {
    var link = document.getElementById(STYLE_ID);
    if (link) {
      scheduleApply();
      return;
    }

    link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = CSS_HREF + "?t=" + Date.now();
    link.onload = scheduleApply;
    link.onerror = scheduleApply;
    document.head.appendChild(link);

    if (link.sheet) scheduleApply();
  }

  global.applyProfileTextOffset = applyProfileTextOffset;
  function ensureAppAssets() {
    if (document.getElementById("app-assets-script")) return;
    var script = document.createElement("script");
    script.id = "app-assets-script";
    script.src = "js/app-assets.js?t=" + Date.now();
    document.head.appendChild(script);
  }

  ensureAppAssets();
  ensureStylesheet();
})(window);
