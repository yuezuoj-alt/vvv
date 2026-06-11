/**
 * BottomNav — 底部导航图标：选中 / 未选中均使用 images/ 内 PNG
 */
(function (global) {
  "use strict";

  var I = "images/";

  var NAV_ICONS = {
    appointment: { on: I + "yuyue.png", off: I + "yuyueweidianji.png" },
    schedule: { on: I + "jiezhongshijianbiao.png", off: I + "jiezhongshijianbiaoweidianji.png" },
    growth: { on: I + "chengzhangquxian.png", off: I + "chengzhangquxianno.png" },
    profile: { on: I + "wode.png", off: I + "wodeweidianji.png" }
  };

  function syncNavIcons(navEl) {
    if (!navEl) return;
    navEl.querySelectorAll(".nav-item[data-nav]").forEach(function (item) {
      var key = item.dataset.nav;
      var cfg = NAV_ICONS[key];
      if (!cfg) return;

      var wrap = item.querySelector(".nav-icon");
      if (!wrap) return;

      var img = wrap.querySelector("img");
      if (!img) {
        img = document.createElement("img");
        img.alt = "";
        wrap.textContent = "";
        wrap.appendChild(img);
      }

      img.src = item.classList.contains("active") ? cfg.on : cfg.off;
    });
  }

  function initBottomNav() {
    document.querySelectorAll(".bottom-nav").forEach(syncNavIcons);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBottomNav);
  } else {
    initBottomNav();
  }

  global.BottomNav = {
    NAV_ICONS: NAV_ICONS,
    syncNavIcons: syncNavIcons,
    initBottomNav: initBottomNav
  };
})(typeof window !== "undefined" ? window : globalThis);
