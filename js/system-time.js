/**
 * SystemTime — 与设备系统时钟保持同步的全局时间 Hook
 * 用法：
 *   SystemTime.getNow()           获取当前系统时间
 *   SystemTime.hookStatusBar()    绑定状态栏并每秒刷新
 *   SystemTime.subscribe(fn)      订阅每秒 tick（页面卸载时自动取消）
 */
(function (global) {
  "use strict";

  function ensureStatusBarStyles() {
    if (document.getElementById("status-bar-styles")) return;
    var link = document.createElement("link");
    link.id = "status-bar-styles";
    link.rel = "stylesheet";
    link.href = "css/status-bar.css?t=" + Date.now();
    document.head.appendChild(link);
  }

  ensureStatusBarStyles();

  const listeners = new Set();
  let timerId = null;
  let started = false;

  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function getNow() {
    return new Date();
  }

  function formatStatusBar(date) {
    const d = date || getNow();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDateYMD(date) {
    const d = date || getNow();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatWeekday(date) {
    return WEEKDAYS[(date || getNow()).getDay()];
  }

  function notifyAll() {
    const now = getNow();
    listeners.forEach((fn) => {
      try {
        fn(now);
      } catch (err) {
        console.error("[SystemTime] listener error:", err);
      }
    });
  }

  function start() {
    if (started) return;
    started = true;
    notifyAll();
    timerId = setInterval(notifyAll, 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function stop() {
    if (!started) return;
    started = false;
    clearInterval(timerId);
    timerId = null;
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  function onVisibilityChange() {
    if (!document.hidden) notifyAll();
  }

  /**
   * 订阅系统时间 tick（立即触发一次，之后每秒同步）
   * @param {(now: Date) => void} callback
   * @returns {() => void} unsubscribe
   */
  function subscribe(callback) {
    listeners.add(callback);
    start();
    callback(getNow());
    return function unsubscribe() {
      listeners.delete(callback);
      if (listeners.size === 0) stop();
    };
  }

  /**
   * 将状态栏 .time 元素与系统时间绑定，每秒刷新
   * @param {string} [selector='.status-bar .time']
   */
  function hookStatusBar(selector) {
    const sel = selector || ".status-bar .time";
    return subscribe(function updateStatusBar(now) {
      const text = formatStatusBar(now);
      document.querySelectorAll(sel).forEach(function (el) {
        el.textContent = text;
      });
    });
  }

  global.SystemTime = {
    getNow: getNow,
    formatStatusBar: formatStatusBar,
    formatDateYMD: formatDateYMD,
    formatWeekday: formatWeekday,
    subscribe: subscribe,
    hookStatusBar: hookStatusBar,
    start: start,
    stop: stop
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".status-bar .time")) {
      hookStatusBar();
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
