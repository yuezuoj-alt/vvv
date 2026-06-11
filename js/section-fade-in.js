/**
 * SectionFadeIn — section 进入视口时淡入上移
 * 初始 .fade-in：opacity 0 + translateY(20px)
 * 进入视口后加 .show
 */
(function (global) {
  "use strict";

  var CSS_HREF = "css/section-fade-in.css";
  var STYLE_ID = "section-fade-in-styles";
  var observer = null;

  function ensureStylesheet(done) {
    if (document.getElementById(STYLE_ID)) {
      if (done) done();
      return;
    }

    var link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = CSS_HREF + "?t=" + Date.now();
    link.onload = function () {
      if (done) done();
    };
    link.onerror = function () {
      if (done) done();
    };
    document.head.appendChild(link);
  }

  function getSections(root) {
    var scope = root || document;
    return scope.querySelectorAll("section:not([data-fade-in-bound])");
  }

  function createObserver() {
    if (observer) return observer;

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -32px 0px"
      }
    );

    return observer;
  }

  function bindSection(el) {
    if (!el || el.getAttribute("data-fade-in-bound") === "1") return;

    el.setAttribute("data-fade-in-bound", "1");
    if (!el.classList.contains("fade-in")) {
      el.classList.add("fade-in");
    }
    createObserver().observe(el);
  }

  function initSectionFadeIn(root) {
    getSections(root).forEach(bindSection);
  }

  function boot() {
    ensureStylesheet(function () {
      initSectionFadeIn();
    });
  }

  global.SectionFadeIn = {
    init: initSectionFadeIn,
    bind: bindSection
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  if (typeof MutationObserver !== "undefined") {
    var timer = null;
    var mo = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        initSectionFadeIn();
      }, 80);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})(window);
