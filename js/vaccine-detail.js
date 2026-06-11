/**
 * VaccineDetail — 疫苗详情页渲染（Figma 1-1781 / 1-1849）
 */
(function (global) {
  "use strict";

  function renderScheduleTable(rows) {
    if (!rows || !rows.length) {
      return "<p style='color:#707a87;font-size:14px;'>请咨询接种门诊了解具体接种时间。</p>";
    }
    const body = rows.map(function (r) {
      return "<tr><td>" + r.dose + "</td><td>" + r.time + "</td><td>" + r.note + "</td></tr>";
    }).join("");
    return (
      '<table class="vax-schedule-table">' +
        "<thead><tr><th>针次</th><th>推荐接种时间</th><th>说明</th></tr></thead>" +
        "<tbody>" + body + "</tbody>" +
      "</table>"
    );
  }

  function renderReasons(reasons) {
    return (reasons || []).map(function (text, i) {
      return '<li><span class="num">' + (i + 1) + '</span><span>' + text + "</span></li>";
    }).join("");
  }

  function renderPrecautions(p) {
    if (!p) return "<p>请咨询接种门诊。</p>";
    if (typeof p === "string") return "<p>" + p + "</p>";
    const delayList = (p.delay.items || []).map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");
    return (
      '<div class="vax-precaution-block">' +
        '<div class="vax-precaution-label">' + p.health.title + "</div>" +
        "<p>" + p.health.text + "</p>" +
      "</div>" +
      '<div class="vax-precaution-block">' +
        '<div class="vax-precaution-label">' + p.allergy.title + "</div>" +
        "<p>" + p.allergy.text + "</p>" +
      "</div>" +
      '<div class="vax-precaution-block">' +
        '<div class="vax-precaution-label">' + p.delay.title + "</div>" +
        '<p class="delay-intro">' + p.delay.intro + "</p>" +
        "<ul>" + delayList + "</ul>" +
      "</div>"
    );
  }

  function renderSideEffects(se) {
    if (!se) return "<p>请咨询接种门诊。</p>";
    return (
      "<h4>常见反应：</h4><p>" + (se.common || "") + "</p>" +
      "<h4>极罕见反应：</h4><p>" + (se.rare || "") + "</p>"
    );
  }

  function switchTab(tabName) {
    document.querySelectorAll(".vax-detail-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    document.getElementById("vaxPanelIntro").classList.toggle("active", tabName === "intro");
    document.getElementById("vaxPanelPrecautions").classList.toggle("active", tabName === "precautions");
    const scroll = document.getElementById("vaxDetailScroll");
    if (scroll) scroll.scrollTop = 0;
  }

  function mount(options) {
    const opts = options || {};
    const params = new URLSearchParams(window.location.search);
    const vaccineName = opts.vaccine || params.get("vaccine") || "";
    const from = opts.from || params.get("from") || "index.html";
    const initialTab = opts.tab || params.get("tab") || "intro";
    const info = global.VaccineInfo ? global.VaccineInfo.getInfo(vaccineName) : null;

    document.getElementById("vaxDetailBack").addEventListener("click", function () {
      window.location.href = from;
    });

    document.querySelectorAll(".vax-detail-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchTab(tab.dataset.tab);
      });
    });

    if (!info) {
      document.getElementById("vaxDetailIntro").textContent =
        "暂无「" + vaccineName + "」的科普内容，请咨询接种门诊。";
      document.getElementById("vaxScheduleCard").innerHTML = "";
      document.getElementById("vaxReasonList").innerHTML = "";
      document.getElementById("vaxSideEffects").innerHTML = "";
      document.getElementById("vaxPrecautions").innerHTML =
        "<p>请咨询接种门诊了解注意事项。</p>";
      switchTab("intro");
      return;
    }

    document.title = info.title + " — 疫苗详情";
    document.getElementById("vaxDetailIntro").textContent = info.intro;
    document.getElementById("vaxScheduleCard").innerHTML = renderScheduleTable(info.schedule);
    document.getElementById("vaxReasonList").innerHTML = renderReasons(info.reasons);
    document.getElementById("vaxSideEffects").innerHTML = renderSideEffects(info.sideEffects);
    document.getElementById("vaxPrecautions").innerHTML = renderPrecautions(info.precautions);
    switchTab(initialTab === "precautions" ? "precautions" : "intro");
  }

  function buildDetailUrl(vaccineName, from, tab) {
    const params = new URLSearchParams({
      vaccine: vaccineName || "",
      from: from || "index.html"
    });
    if (tab === "precautions") params.set("tab", "precautions");
    return "疫苗详情.html?" + params.toString();
  }

  global.VaccineDetail = {
    mount: mount,
    buildDetailUrl: buildDetailUrl,
    renderScheduleTable: renderScheduleTable,
    renderReasons: renderReasons,
    renderPrecautions: renderPrecautions,
    renderSideEffects: renderSideEffects
  };
})(typeof window !== "undefined" ? window : globalThis);
