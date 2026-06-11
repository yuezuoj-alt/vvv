/**
 * BabyProfile — 全局儿童档案 Store（localStorage + subscribe）
 * 参考 Figma node 1-1548（孩子切换）、1-2017（年龄展示）
 */
(function (global) {
  "use strict";

  function ensureProfileStyles() {
    var link = document.getElementById("baby-profile-styles");
    if (link) {
      scheduleProfileTextOffset();
      return;
    }

    link = document.createElement("link");
    link.id = "baby-profile-styles";
    link.rel = "stylesheet";
    link.href = "css/baby-profile.css?t=" + Date.now();
    link.onload = scheduleProfileTextOffset;
    link.onerror = scheduleProfileTextOffset;
    document.head.appendChild(link);
    if (link.sheet) scheduleProfileTextOffset();
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

  function scheduleProfileTextOffset() {
    if (!global.applyProfileTextOffset) {
      global.applyProfileTextOffset = applyProfileTextOffset;
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyProfileTextOffset);
    } else {
      applyProfileTextOffset();
    }
  }

  ensureProfileStyles();

  const STORAGE_KEY = "activeChildId";
  const CHILD_DATA_KEY = "babyProfileChildData";

  /** Figma 1-1548：皮皮狗（大）/ 皮皮虾（小）各用固定头像，位置按年龄从左到右 */
  const AVATAR_GOU = "images/avatar-gou.png";
  const AVATAR_XIA = "images/unsplash_JfolIjRnveY.svg";

  const CHILDREN = [
    {
      id: "xia",
      name: "皮皮虾",
      birthText: "2026年4月8号出生",
      birth: new Date(2026, 3, 8),
      avatar: AVATAR_XIA,
      avatarSmall: AVATAR_XIA,
      avatarLarge: AVATAR_XIA
    },
    {
      id: "gou",
      name: "皮皮狗",
      birthText: "2025年12月8号出生",
      birth: new Date(2025, 11, 8),
      avatar: AVATAR_GOU,
      avatarSmall: AVATAR_GOU,
      avatarLarge: AVATAR_GOU
    }
  ];

  const pillBg = "images/profile-pill-bg.svg";

  /** 成长记录图标 — 本地 images/height.png、images/weight.png */
  const GROWTH_ICONS = {
    heightParts: ["images/height.png"],
    weightFrame: "images/weight.png",
    weightParts: [],
    weightDial: "",
    heightPickerLine: "images/height-picker-line.svg",
    heightPickerRuler: "images/height-picker-ruler.svg"
  };

  function renderGrowthIconLayers(parts) {
    return (parts || []).map(function (url) {
      return '<img class="growth-icon__layer" src="' + url + '" alt="" />';
    }).join("");
  }

  function renderGrowthHeightIconHTML(extraClass) {
    const cls = "growth-icon growth-icon--height" + (extraClass ? " " + extraClass : "");
    return (
      '<div class="' + cls + '">' +
        renderGrowthIconLayers(GROWTH_ICONS.heightParts) +
      "</div>"
    );
  }

  function renderGrowthWeightIconHTML(extraClass) {
    const cls = "growth-icon growth-icon--weight" + (extraClass ? " " + extraClass : "");
    return (
      '<div class="' + cls + '">' +
        '<img class="growth-icon__layer" src="' + GROWTH_ICONS.weightFrame + '" alt="" />' +
        renderGrowthIconLayers(GROWTH_ICONS.weightParts) +
      "</div>"
    );
  }

  const GROWTH_SEED_VERSION = 2;

  /** 首页固定展示，不可隐藏 */
  const PINNED_VACCINES = ["卡介苗", "乙肝疫苗"];

  /** 与 index 首页演示数据一致的默认已种针次 */
  const INDEX_SEED_DONE_DOSES = {
    "卡介苗": { "1": true },
    "乙肝疫苗": { "1": true }
  };

  function sanitizeHiddenVaccines(list) {
    return (list || []).filter(function (name) {
      return PINNED_VACCINES.indexOf(name) === -1;
    });
  }

  /** 皮皮虾首条记录 — 参考 Figma node 1-2017 */
  const XIA_SEED_RECORD = {
    id: "gr_xia_birth_24h",
    ageLabel: "出生24小时",
    date: "2026-04-08",
    height: 52.3,
    weight: 3.2,
    createdAt: "2026-04-08T00:00:00.000Z"
  };

  const listeners = new Set();
  let switcherSelector = null;
  let switcherHasMounted = false;

  function defaultChildData() {
    return {
      addedVaccines: [],
      hiddenVaccines: [],
      growthRecords: [],
      bookedDoses: {},
      completedDoses: {}
    };
  }

  function loadAllChildData() {
    try {
      const raw = localStorage.getItem(CHILD_DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }

  function saveAllChildData(all) {
    try {
      localStorage.setItem(CHILD_DATA_KEY, JSON.stringify(all));
    } catch (e) { /* ignore */ }
  }

  function migrateLegacySessionData() {
    const all = loadAllChildData();
    let changed = false;
    CHILDREN.forEach(function (child) {
      if (!all[child.id]) {
        all[child.id] = defaultChildData();
        changed = true;
      } else if (!all[child.id].bookedDoses) {
        all[child.id].bookedDoses = {};
        changed = true;
      }
      if (!all[child.id].completedDoses) {
        all[child.id].completedDoses = {};
        changed = true;
      }
    });
    try {
      const legacyAdded = sessionStorage.getItem("addedVaccines");
      const legacyHidden = sessionStorage.getItem("hiddenVaccines");
      if (legacyAdded && !all.xia.addedVaccines.length) {
        all.xia.addedVaccines = JSON.parse(legacyAdded);
        changed = true;
      }
      if (legacyHidden && !all.xia.hiddenVaccines.length) {
        all.xia.hiddenVaccines = JSON.parse(legacyHidden);
        changed = true;
      }
    } catch (e) { /* ignore */ }
    if (ensureGrowthSeeds(all)) changed = true;
    if (ensureCalendarSeeds(all)) changed = true;
    if (ensureIndexBookedReset(all)) changed = true;
    CHILDREN.forEach(function (child) {
      const data = all[child.id];
      if (!data || !data.hiddenVaccines) return;
      const cleaned = sanitizeHiddenVaccines(data.hiddenVaccines);
      if (cleaned.length !== data.hiddenVaccines.length) {
        data.hiddenVaccines = cleaned;
        changed = true;
      }
    });
    if (changed) saveAllChildData(all);
    return all;
  }

  function ensureGrowthSeeds(all) {
    let changed = false;

    if (!all.xia) {
      all.xia = defaultChildData();
      changed = true;
    }

    if (all.xia.growthSeedVersion !== GROWTH_SEED_VERSION) {
      // Figma 1-2017：皮皮虾初始仅一条「出生24小时」记录
      all.xia.growthRecords = [Object.assign({}, XIA_SEED_RECORD)];
      all.xia.growthSeedVersion = GROWTH_SEED_VERSION;
      changed = true;
    } else if (!all.xia.growthRecords || !all.xia.growthRecords.length) {
      all.xia.growthRecords = [Object.assign({}, XIA_SEED_RECORD)];
      changed = true;
    }

    CHILDREN.forEach(function (child) {
      if (child.id === "xia") return;
      if (!all[child.id]) {
        all[child.id] = defaultChildData();
        changed = true;
        return;
      }
      if (all[child.id].growthSeedVersion !== GROWTH_SEED_VERSION) {
        all[child.id].growthRecords = [];
        all[child.id].growthSeedVersion = GROWTH_SEED_VERSION;
        changed = true;
      }
    });

    return changed;
  }

  const CALENDAR_SEED_VERSION = 2;

  /** 首页预约球重置：清空所有儿童的 bookedDoses，恢复虚线球 */
  const INDEX_BOOKED_RESET_VERSION = 1;

  function ensureIndexBookedReset(all) {
    let changed = false;
    CHILDREN.forEach(function (child) {
      if (!all[child.id]) {
        all[child.id] = defaultChildData();
        changed = true;
      }
      const data = all[child.id];
      if (data.indexBookedResetVersion !== INDEX_BOOKED_RESET_VERSION) {
        data.bookedDoses = {};
        data.indexBookedResetVersion = INDEX_BOOKED_RESET_VERSION;
        changed = true;
      }
    });
    return changed;
  }

  /** 日历演示：双孩预约 + 同孩同日多针对齐 Figma 69-4258 */
  function ensureCalendarSeeds(all) {
    let changed = false;

    if (!all.gou) {
      all.gou = defaultChildData();
      changed = true;
    }
    if (!all.xia) {
      all.xia = defaultChildData();
      changed = true;
    }

    const gou = all.gou;
    if (gou.calendarSeedVersion !== CALENDAR_SEED_VERSION) {
      const gouBooked = gou.bookedDoses || {};
      const gouHasBooking = Object.keys(gouBooked).some(function (vaccineName) {
        return Object.keys(gouBooked[vaccineName] || {}).length > 0;
      });

      if (!gouHasBooking) {
        gou.bookedDoses = Object.assign({}, gouBooked, {
          "乙肝疫苗": {
            "3": {
              date: "2026-04-17",
              clinic: "红凌路预防接种站",
              remark: "",
              bookedAt: new Date().toISOString()
            }
          }
        });
        changed = true;
      }
      gou.calendarSeedVersion = CALENDAR_SEED_VERSION;
      changed = true;
    }

    const xia = all.xia;
    if (xia.calendarSeedVersion !== CALENDAR_SEED_VERSION) {
      const xiaBooked = Object.assign({}, xia.bookedDoses || {});
      if (!xiaBooked["五联疫苗"]) xiaBooked["五联疫苗"] = {};
      if (!xiaBooked["五联疫苗"]["1"]) {
        xiaBooked["五联疫苗"]["1"] = {
          date: "2026-04-17",
          clinic: "红凌路预防接种站",
          remark: "",
          bookedAt: new Date().toISOString()
        };
        changed = true;
      }
      if (!xiaBooked["百白破疫苗"]) xiaBooked["百白破疫苗"] = {};
      if (!xiaBooked["百白破疫苗"]["1"]) {
        xiaBooked["百白破疫苗"]["1"] = {
          date: "2026-04-17",
          clinic: "红凌路预防接种站",
          remark: "",
          bookedAt: new Date().toISOString()
        };
        changed = true;
      }
      xia.bookedDoses = xiaBooked;
      xia.calendarSeedVersion = CALENDAR_SEED_VERSION;
      changed = true;
    }

    return changed;
  }

  let childDataCache = migrateLegacySessionData();

  function getActiveChildId() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CHILDREN.some(function (c) { return c.id === saved; })) {
        return saved;
      }
    } catch (e) { /* ignore */ }
    return CHILDREN[0].id;
  }

  function getActiveChild() {
    const id = getActiveChildId();
    return CHILDREN.find(function (c) { return c.id === id; }) || CHILDREN[0];
  }

  function getInactiveChild() {
    const active = getActiveChild();
    return (
      getChildrenSortedByAge().find(function (c) {
        return c.id !== active.id;
      }) || CHILDREN[1]
    );
  }

  /** 按年龄从大到小（出生日期从早到晚） */
  function getChildrenSortedByAge() {
    return CHILDREN.slice().sort(function (a, b) {
      return a.birth.getTime() - b.birth.getTime();
    });
  }

  function getChildAvatar(child) {
    if (!child) return "";
    return child.avatar || child.avatarLarge || child.avatarSmall || "";
  }

  function renderInactiveAvatar(child) {
    return (
      '<button class="avatar-side" type="button" data-switch-child="' +
        child.id +
        '" aria-label="切换到' +
        child.name +
        '">' +
        '<img src="' +
        getChildAvatar(child) +
        '" alt="" />' +
      "</button>"
    );
  }

  function renderActivePill(child) {
    return (
      '<div class="profile-pill is-active" data-child-id="' +
        child.id +
        '">' +
        '<img class="pill-bg" src="' +
        pillBg +
        '" alt="" />' +
        '<div class="avatar-large">' +
          '<img src="' +
          getChildAvatar(child) +
          '" alt="" />' +
        "</div>" +
        '<div class="text-wrap">' +
          '<span class="name">' +
          child.name +
          "</span>" +
          '<span class="birth">' +
          child.birthText +
          "</span>" +
        "</div>" +
      "</div>"
    );
  }

  function renderSwitcherHTML() {
    const activeId = getActiveChildId();
    return (
      '<div class="child-switcher" id="childSwitcher">' +
        getChildrenSortedByAge()
          .map(function (child) {
            if (child.id === activeId) {
              return renderActivePill(child);
            }
            return renderInactiveAvatar(child);
          })
          .join("") +
      "</div>"
    );
  }

  function bindSwitcher(root) {
    const el = root ? root.querySelector("#childSwitcher") || root : document.getElementById("childSwitcher");
    if (!el) return;

    el.querySelectorAll("[data-switch-child]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-switch-child");
        setActiveChildId(id);
      });
    });
  }

  function mountSwitcher(containerSelector, options) {
    const opts = options || {};
    switcherSelector = containerSelector;
    const host = document.querySelector(containerSelector);
    if (!host) return;

    const shouldAnimate = opts.animate !== false && switcherHasMounted;
    host.innerHTML = renderSwitcherHTML();
    bindSwitcher(host);

    const switcher = host.querySelector("#childSwitcher");
    switcherHasMounted = true;
    if (switcher && shouldAnimate) {
      switcher.classList.add("is-animating");
      switcher.addEventListener(
        "animationend",
        function onEnd() {
          switcher.classList.remove("is-animating");
        },
        { once: true }
      );
      window.setTimeout(function () {
        switcher.classList.remove("is-animating");
      }, 450);
    }

    if (global.applyProfileTextOffset) global.applyProfileTextOffset();
  }

  function getChildById(id) {
    return CHILDREN.find(function (c) { return c.id === id; }) || null;
  }

  function getChildData(childId) {
    const id = childId || getActiveChildId();
    if (!childDataCache[id]) {
      childDataCache[id] = defaultChildData();
      saveAllChildData(childDataCache);
    }
    return childDataCache[id];
  }

  function setChildData(childId, patch, options) {
    const id = childId || getActiveChildId();
    const current = getChildData(id);
    childDataCache[id] = Object.assign({}, current, patch);
    saveAllChildData(childDataCache);
    if (!options || !options.silent) {
      notify({ type: "data", childId: id, data: childDataCache[id] });
    }
  }

  function getAddedVaccines(childId) {
    return getChildData(childId).addedVaccines.slice();
  }

  function setAddedVaccines(list, childId) {
    setChildData(childId, { addedVaccines: list.slice() });
  }

  function getHiddenVaccines(childId) {
    return getChildData(childId).hiddenVaccines.slice();
  }

  function setHiddenVaccines(list, childId) {
    setChildData(childId, { hiddenVaccines: sanitizeHiddenVaccines(list) });
  }

  function getGrowthRecords(childId) {
    return getChildData(childId).growthRecords.slice();
  }

  function formatGrowthHeight(value) {
    if (value == null || value === "") return "--";
    return Number(value).toFixed(1) + "cm";
  }

  function formatGrowthWeight(value) {
    if (value == null || value === "") return "--";
    return Number(value).toFixed(1) + "kg";
  }

  function normalizeGrowthRecord(record) {
    return {
      date: record.date || "",
      ageLabel: record.ageLabel || "",
      height: record.height != null ? Number(record.height) : null,
      weight: record.weight != null ? Number(record.weight) : null
    };
  }

  function formatDoseDate(dateStr) {
    if (!dateStr) return "--/--/--";
    const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      const yy = String(parseInt(m[1], 10) % 100);
      const mm = String(parseInt(m[2], 10));
      const dd = String(parseInt(m[3], 10));
      return yy + "/" + mm + "/" + dd;
    }
    return dateStr;
  }

  function getBookedDoses(childId) {
    const data = getChildData(childId);
    return Object.assign({}, data.bookedDoses || {});
  }

  function getBookedDose(vaccineName, doseNum, childId) {
    const booked = getBookedDoses(childId);
    const vaccineBooked = booked[vaccineName];
    if (!vaccineBooked) return null;
    return vaccineBooked[String(doseNum)] || null;
  }

  function setBookedDose(vaccineName, doseNum, info, childId) {
    if (!vaccineName || !doseNum) return null;
    const id = childId || getActiveChildId();
    const data = getChildData(id);
    const booked = Object.assign({}, data.bookedDoses || {});
    if (!booked[vaccineName]) booked[vaccineName] = {};
    const entry = {
      date: info.date || "",
      clinic: info.clinic || "",
      remark: info.remark || "",
      bookedAt: new Date().toISOString()
    };
    booked[vaccineName][String(doseNum)] = entry;
    setChildData(id, { bookedDoses: booked });
    return entry;
  }

  function getCompletedDoses(childId) {
    const data = getChildData(childId);
    return Object.assign({}, data.completedDoses || {});
  }

  function getCompletedDose(vaccineName, doseNum, childId) {
    const completed = getCompletedDoses(childId);
    const vaccineDone = completed[vaccineName];
    if (!vaccineDone) return null;
    return vaccineDone[String(doseNum)] || null;
  }

  /** 首页该针是否已为已种球（与 index 逻辑一致） */
  function isVaccineDoseDone(vaccineName, doseNum, now, childId) {
    const doseKey = String(doseNum);
    const seed = INDEX_SEED_DONE_DOSES[vaccineName];
    if (seed && seed[doseKey]) {
      return true;
    }
    if (getCompletedDose(vaccineName, doseNum, childId)) {
      return true;
    }
    if (global.VaccineSchedule && global.VaccineSchedule.isRecommendedDatePassed) {
      const id = childId || getActiveChildId();
      const child = getChildById(id);
      const birth =
        child && child.birth
          ? child.birth
          : global.VaccineSchedule.parseBirthFromPage();
      return global.VaccineSchedule.isRecommendedDatePassed(
        vaccineName,
        parseInt(doseNum, 10),
        now || (global.SystemTime ? global.SystemTime.getNow() : new Date()),
        birth
      );
    }
    return false;
  }

  function setCompletedDose(vaccineName, doseNum, info, childId, options) {
    if (!vaccineName || !doseNum) return null;
    const id = childId || getActiveChildId();
    const data = getChildData(id);
    const completed = Object.assign({}, data.completedDoses || {});
    if (!completed[vaccineName]) completed[vaccineName] = {};
    const prev = completed[vaccineName][String(doseNum)];
    const entry = {
      date: (info && info.date) || (prev && prev.date) || "",
      completedAt: (prev && prev.completedAt) || new Date().toISOString()
    };
    completed[vaccineName][String(doseNum)] = entry;
    setChildData(id, { completedDoses: completed }, options);
    return entry;
  }

  /** 将已种针次合并进疫苗列表（优先级高于预约 / 虚线球） */
  function applyCompletedDosesToVaccines(vaccines, childId) {
    const id = childId || getActiveChildId();
    const completed = getCompletedDoses(id);

    return vaccines.map(function (vaccine) {
      const vaccineDone = completed[vaccine.name] || {};
      return {
        name: vaccine.name,
        doses: vaccine.doses.map(function (dose) {
          if (dose.type === "done") {
            return Object.assign({}, dose);
          }
          const info = vaccineDone[String(dose.num)];
          if (!info) {
            return Object.assign({}, dose);
          }
          return {
            type: "done",
            num: dose.num,
            date: info.date || dose.date || "--/--/--"
          };
        })
      };
    });
  }

  /** 根据当前疫苗列表回写已种记录，并清理已种针对应预约 */
  function syncCompletedDosesFromVaccineList(vaccines, childId) {
    const id = childId || getActiveChildId();
    const data = getChildData(id);
    const completed = Object.assign({}, data.completedDoses || {});
    const booked = Object.assign({}, data.bookedDoses || {});
    let changed = false;

    vaccines.forEach(function (vaccine) {
      const allDone =
        vaccine.doses.length > 0 &&
        vaccine.doses.every(function (d) {
          return d.type === "done";
        });

      vaccine.doses.forEach(function (dose) {
        if (dose.type !== "done") return;

        const doseKey = String(dose.num);
        if (!completed[vaccine.name]) completed[vaccine.name] = {};
        const prev = completed[vaccine.name][doseKey];
        const entry = {
          date: dose.date || (prev && prev.date) || "",
          completedAt: (prev && prev.completedAt) || new Date().toISOString()
        };

        if (!prev || prev.date !== entry.date) {
          completed[vaccine.name][doseKey] = entry;
          changed = true;
        }

        if (booked[vaccine.name] && booked[vaccine.name][doseKey]) {
          delete booked[vaccine.name][doseKey];
          if (!Object.keys(booked[vaccine.name]).length) {
            delete booked[vaccine.name];
          }
          changed = true;
        }
      });

      if (allDone && booked[vaccine.name]) {
        delete booked[vaccine.name];
        changed = true;
      }
    });

    if (changed) {
      setChildData(
        id,
        { completedDoses: completed, bookedDoses: booked },
        { silent: true }
      );
    }
  }

  function parseIsoDateParts(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    return {
      year: parseInt(m[1], 10),
      month: parseInt(m[2], 10) - 1,
      day: parseInt(m[3], 10)
    };
  }

  /** 日历横条颜色：皮皮虾粉、皮皮狗蓝（Figma 119-4964） */
  function getChildCalendarBarColor(childId) {
    return childId === "xia" ? "pink" : "blue";
  }

  function sortCalendarAppointments(list) {
    return list.sort(function (a, b) {
      if (a.day !== b.day) return a.day - b.day;
      const childOrder = { xia: 0, gou: 1 };
      const ca = childOrder[a.childId] != null ? childOrder[a.childId] : 9;
      const cb = childOrder[b.childId] != null ? childOrder[b.childId] : 9;
      if (ca !== cb) return ca - cb;
      if (a.vaccine !== b.vaccine) return a.vaccine.localeCompare(b.vaccine, "zh-CN");
      return a.dose - b.dose;
    });
  }

  /** 汇总某月/某日 index 预约球数据（皮皮虾粉、皮皮狗蓝） */
  function collectCalendarAppointments(year, month, day) {
    const list = [];
    const now = global.SystemTime ? global.SystemTime.getNow() : new Date();

    CHILDREN.forEach(function (child) {
      const booked = getBookedDoses(child.id);

      Object.keys(booked).forEach(function (vaccineName) {
        const doseMap = booked[vaccineName] || {};
        Object.keys(doseMap).forEach(function (doseNum) {
          if (isVaccineDoseDone(vaccineName, doseNum, now, child.id)) return;
          const info = doseMap[doseNum];
          const parts = parseIsoDateParts(info && info.date);
          if (!parts || parts.year !== year || parts.month !== month) return;
          if (day != null && parts.day !== day) return;

          list.push({
            childId: child.id,
            childName: child.name,
            vaccine: vaccineName,
            dose: parseInt(doseNum, 10) || 1,
            day: parts.day,
            date: info.date,
            clinic: info.clinic || "",
            remark: info.remark || "",
            theme: getChildCalendarBarColor(child.id),
            avatar: getChildAvatar(child)
          });
        });
      });
    });

    return sortCalendarAppointments(list);
  }

  /** 某月每日横条：每针预约一条（同孩同日可多条同色横条） */
  function getCalendarDayMarkers(year, month) {
    const markers = {};

    collectCalendarAppointments(year, month).forEach(function (apt) {
      if (!markers[apt.day]) markers[apt.day] = [];
      markers[apt.day].push(apt.theme);
    });

    return markers;
  }

  /** 本月全部孩子的预约（日历下方条形卡片） */
  function getAppointmentsForMonth(year, month) {
    return collectCalendarAppointments(year, month);
  }

  /** 某日全部孩子的预约 */
  function getAppointmentsForDate(year, month, day) {
    return collectCalendarAppointments(year, month, day);
  }

  /** 将已预约针次合并进疫苗列表（future → booked） */
  function applyBookedDosesToVaccines(vaccines, childId) {
    const id = childId || getActiveChildId();
    const booked = getBookedDoses(id);
    return vaccines.map(function (vaccine) {
      const vaccineBooked = booked[vaccine.name] || {};
      return {
        name: vaccine.name,
        doses: vaccine.doses.map(function (dose) {
          if (dose.type === "done") {
            return Object.assign({}, dose);
          }
          const info = vaccineBooked[String(dose.num)];
          if (info) {
            return {
              type: "booked",
              num: dose.num,
              label: "预约",
              date: formatDoseDate(info.date)
            };
          }
          return Object.assign({}, dose);
        })
      };
    });
  }

  function addGrowthRecord(record, childId) {
    const id = childId || getActiveChildId();
    const data = getChildData(id);
    const normalized = normalizeGrowthRecord(record);
    const entry = Object.assign(
      {
        id: "gr_" + Date.now(),
        createdAt: new Date().toISOString()
      },
      normalized
    );
    const next = data.growthRecords.concat([entry]);
    setChildData(id, { growthRecords: next });
    return entry;
  }

  function removeGrowthRecord(recordId, childId) {
    if (!recordId) return false;
    const id = childId || getActiveChildId();
    const data = getChildData(id);
    const next = data.growthRecords.filter(function (record) {
      return record.id !== recordId;
    });
    if (next.length === data.growthRecords.length) return false;
    setChildData(id, { growthRecords: next });
    return true;
  }

  function notify(event) {
    listeners.forEach(function (fn) {
      try {
        fn(event);
      } catch (err) {
        console.error("[BabyProfile] listener error:", err);
      }
    });
  }

  function setActiveChildId(id, options) {
    const opts = options || {};
    if (!id || id === getActiveChildId()) return;
    if (!CHILDREN.some(function (c) { return c.id === id; })) return;

    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) { /* ignore */ }

    notify({
      type: "child",
      childId: id,
      child: getActiveChild()
    });

    if (switcherSelector) {
      mountSwitcher(switcherSelector);
    }

    if (opts.reload) {
      window.location.reload();
    }
  }

  /**
   * @param {(event: { type: string, childId?: string, child?: object, data?: object }) => void} callback
   * @returns {() => void}
   */
  function subscribe(callback) {
    listeners.add(callback);
    return function unsubscribe() {
      listeners.delete(callback);
    };
  }

  function parseBirthFromPage() {
    return getActiveChild().birth;
  }

  function getAgeParts(now, birth) {
    const b = birth || parseBirthFromPage();
    const n = now || new Date();
    let months =
      (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) months -= 1;
    months = Math.max(0, months);

    const anchor = new Date(b.getFullYear(), b.getMonth() + months, b.getDate());
    let days = Math.floor((n.getTime() - anchor.getTime()) / 86400000);
    if (days < 0) {
      months = Math.max(0, months - 1);
      const prev = new Date(b.getFullYear(), b.getMonth() + months, b.getDate());
      days = Math.floor((n.getTime() - prev.getTime()) / 86400000);
    }

    return { months: months, days: Math.max(0, days) };
  }

  function formatAgeZh(now, birth) {
    const p = getAgeParts(now, birth);
    if (p.months >= 12) {
      const years = Math.floor(p.months / 12);
      const rem = p.months % 12;
      if (rem === 0) return years + "岁" + p.days + "天";
      return years + "岁" + rem + "个月" + p.days + "天";
    }
    return p.months + "个月" + p.days + "天";
  }

  function ageLabelToMonths(age) {
    if (age === "24小时内") return 0;
    const m = age.match(/^(\d+)月龄$/);
    if (m) return parseInt(m[1], 10);
    const y = age.match(/^(\d+)岁$/);
    if (y) return parseInt(y[1], 10) * 12;
    return -1;
  }

  /** 接种时间表：当前精确年龄对应的高亮行 */
  function getScheduleHighlightAge(scheduleRows, now, birth) {
    const p = getAgeParts(now, birth);
    if (p.months === 0 && p.days === 0) return "24小时内";

    let match = null;
    scheduleRows.forEach(function (row) {
      const rowMonths = ageLabelToMonths(row.age);
      if (rowMonths >= 0 && rowMonths <= p.months) match = row.age;
    });

    if (p.days > 0 && p.months >= 0) {
      const next = scheduleRows.find(function (row) {
        return ageLabelToMonths(row.age) === p.months + 1;
      });
      if (next) return next.age;
    }

    return match;
  }

  function updateAgeLabels(selector) {
    const sel = selector || "[data-baby-age]";
    const child = getActiveChild();
    const text = formatAgeZh(
      global.SystemTime ? global.SystemTime.getNow() : new Date(),
      child.birth
    );
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = text;
    });
  }

  function initAgeLabels(selector) {
    updateAgeLabels(selector);
    if (global.SystemTime) {
      global.SystemTime.subscribe(function () {
        updateAgeLabels(selector);
      });
    }
    subscribe(function (event) {
      if (event.type === "child") updateAgeLabels(selector);
    });
  }

  var GROWTH_HIDE_ICON_SVG =
    '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M18 8.5C11.5 8.5 6.2 12.4 4 18c2.2 5.6 7.5 9.5 14 9.5s11.8-3.9 14-9.5c-2.2-5.6-7.5-9.5-14-9.5z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<circle cx="18" cy="18" r="4.5" stroke="currentColor" stroke-width="2.2"/>' +
      '<path d="M8 8l20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    "</svg>";

  var GROWTH_SWIPE_WIDTH = 110;
  var GROWTH_SWIPE_SNAP_RATIO = 0.35;

  function renderGrowthRecordCard(record) {
    const height = formatGrowthHeight(record.height);
    const weight = formatGrowthWeight(record.weight);
    return (
      '<div class="record-card">' +
        '<div class="record-row">' +
          renderGrowthHeightIconHTML("icon-wrap") +
          '<span class="label">身高</span>' +
          '<span class="value">' + height + '</span>' +
        '</div>' +
        '<div class="record-divider"></div>' +
        '<div class="record-row record-row--weight">' +
          renderGrowthWeightIconHTML("icon-wrap") +
          '<span class="label">体重</span>' +
          '<span class="value">' + weight + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function sortGrowthRecords(records) {
    return records.slice().sort(function (a, b) {
      const dateCompare = (a.date || "").localeCompare(b.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }

  function renderGrowthTimelineHTML(options) {
    const opts = options || {};
    const readOnly = opts.readOnly === true;
    const child = getActiveChild();
    const now = global.SystemTime ? global.SystemTime.getNow() : new Date();
    const currentAge = formatAgeZh(now, child.birth);
    const records = sortGrowthRecords(getGrowthRecords(child.id));
    const parts = [];

    records.forEach(function (record) {
      const card = renderGrowthRecordCard(record);
      if (readOnly) {
        parts.push(
          '<article class="timeline-item timeline-item--has-record">' +
            '<p class="age-label">' + (record.ageLabel || currentAge) + '</p>' +
            card +
          '</article>'
        );
        return;
      }
      parts.push(
        '<article class="timeline-item timeline-item--has-record" data-record-id="' + record.id + '">' +
          '<p class="age-label">' + (record.ageLabel || currentAge) + '</p>' +
          '<div class="record-swipe-container">' +
            '<div class="swipe-hide" aria-hidden="true">' +
              '<span class="hide-icon">' + GROWTH_HIDE_ICON_SVG + '</span>' +
              '<button class="swipe-hide-btn" type="button" aria-label="删除记录"></button>' +
            '</div>' +
            '<div class="swipe-panel">' +
              card +
            '</div>' +
          '</div>' +
        '</article>'
      );
    });

    parts.push(
      '<article class="timeline-item timeline-item--add">' +
        '<p class="age-label" data-baby-age>' + currentAge + '</p>' +
        '<button class="add-card" type="button" aria-label="添加记录" data-growth-add>' +
          '<span class="add-icon">' +
            '<span class="bar-h"></span>' +
            '<span class="bar-v"></span>' +
          '</span>' +
        '</button>' +
      '</article>'
    );

    return parts.join("");
  }

  function closeAllGrowthSwipePanels(exceptPanel) {
    document.querySelectorAll("#growthTimeline .swipe-panel.open").forEach(function (panel) {
      if (panel !== exceptPanel) {
        panel.classList.remove("open", "dragging");
        panel.style.transform = "";
      }
    });
  }

  function initGrowthRecordSwipe(containerSelector) {
    const host = document.querySelector(containerSelector);
    if (!host || host.dataset.swipeBound === "1") return;
    host.dataset.swipeBound = "1";

    let activeSwipe = null;

    function clearActiveSwipe() {
      if (!activeSwipe) return;
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      activeSwipe = null;
    }

    function readPanelOffset(panel) {
      if (panel.classList.contains("open")) return -GROWTH_SWIPE_WIDTH;
      const match = panel.style.transform.match(/translateX\((-?\d+(?:\.\d+)?)px\)/);
      return match ? parseFloat(match[1]) : 0;
    }

    function applyPanelOffset(panel, offset, dragging) {
      const clamped = Math.max(-GROWTH_SWIPE_WIDTH, Math.min(0, offset));
      panel.classList.toggle("dragging", dragging);
      if (dragging) {
        panel.classList.remove("open");
        panel.style.transform = "translateX(" + clamped + "px)";
      } else {
        panel.style.transform = "";
        panel.classList.toggle("open", clamped <= -GROWTH_SWIPE_WIDTH * GROWTH_SWIPE_SNAP_RATIO);
      }
    }

    function onPointerMove(e) {
      if (!activeSwipe) return;
      const point = e.touches ? e.touches[0] : e;
      const dx = point.clientX - activeSwipe.startX;
      const dy = point.clientY - activeSwipe.startY;

      if (!activeSwipe.axisLock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        activeSwipe.axisLock = Math.abs(dx) > Math.abs(dy) * 1.25 ? "x" : "y";
        if (activeSwipe.axisLock !== "x") {
          clearActiveSwipe();
          return;
        }
      }

      if (activeSwipe.axisLock !== "x") return;
      if (e.cancelable) e.preventDefault();
      applyPanelOffset(activeSwipe.panel, activeSwipe.originX + dx, true);
    }

    function onPointerUp(e) {
      if (!activeSwipe) return;
      const point = e.changedTouches ? e.changedTouches[0] : e;
      if (activeSwipe.axisLock === "x") {
        const dx = point.clientX - activeSwipe.startX;
        applyPanelOffset(activeSwipe.panel, activeSwipe.originX + dx, false);
      } else if (activeSwipe.panel) {
        activeSwipe.panel.classList.remove("dragging");
      }
      clearActiveSwipe();
    }

    function beginSwipe(panel, clientX, clientY) {
      const isOpen = panel.classList.contains("open");
      closeAllGrowthSwipePanels(isOpen ? panel : null);
      activeSwipe = {
        panel: panel,
        startX: clientX,
        startY: clientY,
        originX: readPanelOffset(panel),
        axisLock: null
      };
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);
    }

    host.addEventListener("mousedown", function (e) {
      const panel = e.target.closest(".timeline-item--has-record .swipe-panel");
      if (!panel || !host.contains(panel)) return;
      if (e.button !== 0) return;
      e.preventDefault();
      beginSwipe(panel, e.clientX, e.clientY);
    });

    host.addEventListener("touchstart", function (e) {
      const panel = e.target.closest(".timeline-item--has-record .swipe-panel");
      if (!panel || !host.contains(panel)) return;
      beginSwipe(panel, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    host.addEventListener("click", function (e) {
      const hideBtn = e.target.closest(".swipe-hide-btn");
      if (hideBtn) {
        e.stopPropagation();
        const item = hideBtn.closest(".timeline-item--has-record");
        const recordId = item && item.dataset.recordId;
        if (!recordId) return;
        item.classList.add("is-removing");
        window.setTimeout(function () {
          removeGrowthRecord(recordId);
        }, 220);
        return;
      }

      const openPanel = e.target.closest(".swipe-panel.open");
      if (!openPanel || !host.contains(openPanel)) return;
      openPanel.classList.remove("open", "dragging");
      openPanel.style.transform = "";
    });
  }

  function mountGrowthTimeline(containerSelector, options) {
    const host = document.querySelector(containerSelector);
    if (!host) return;
    const opts = options || {};
    const readOnly = opts.readOnly === true;

    function render() {
      host.innerHTML = renderGrowthTimelineHTML({ readOnly: readOnly });
      const addBtn = host.querySelector("[data-growth-add]");
      if (addBtn && !readOnly) {
        addBtn.addEventListener("click", function () {
          const bodyArea = document.querySelector(".body-area, .growth-record-body");
          if (bodyArea) {
            sessionStorage.setItem("growthRecordScrollTop", String(bodyArea.scrollTop));
          }
          window.location.href = "成长记录添加.html";
        });
      }
      updateAgeLabels("[data-baby-age]");
      if (!readOnly) {
        initGrowthRecordSwipe(containerSelector);
      }
    }

    render();
    if (readOnly) return;
    subscribe(function (event) {
      if (event.type === "child" || event.type === "data") render();
    });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY || e.key === CHILD_DATA_KEY) {
      if (e.key === CHILD_DATA_KEY) {
        childDataCache = loadAllChildData();
      }
      notify({
        type: e.key === STORAGE_KEY ? "child" : "data",
        childId: getActiveChildId(),
        child: getActiveChild()
      });
      if (switcherSelector) mountSwitcher(switcherSelector);
    }
  });

  global.BabyProfile = {
    CHILDREN: CHILDREN,
    AVATAR_XIA: AVATAR_XIA,
    AVATAR_GOU: AVATAR_GOU,
    pillBg: pillBg,
    GROWTH_ICONS: GROWTH_ICONS,
    getActiveChild: getActiveChild,
    getActiveChildId: getActiveChildId,
    getInactiveChild: getInactiveChild,
    getChildrenSortedByAge: getChildrenSortedByAge,
    getChildAvatar: getChildAvatar,
    getChildById: getChildById,
    setActiveChildId: setActiveChildId,
    subscribe: subscribe,
    getChildData: getChildData,
    setChildData: setChildData,
    getAddedVaccines: getAddedVaccines,
    setAddedVaccines: setAddedVaccines,
    getHiddenVaccines: getHiddenVaccines,
    setHiddenVaccines: setHiddenVaccines,
    getGrowthRecords: getGrowthRecords,
    addGrowthRecord: addGrowthRecord,
    removeGrowthRecord: removeGrowthRecord,
    formatDoseDate: formatDoseDate,
    getBookedDoses: getBookedDoses,
    getBookedDose: getBookedDose,
    setBookedDose: setBookedDose,
    getCompletedDoses: getCompletedDoses,
    getCompletedDose: getCompletedDose,
    isVaccineDoseDone: isVaccineDoseDone,
    setCompletedDose: setCompletedDose,
    applyCompletedDosesToVaccines: applyCompletedDosesToVaccines,
    syncCompletedDosesFromVaccineList: syncCompletedDosesFromVaccineList,
    getChildCalendarBarColor: getChildCalendarBarColor,
    getCalendarDayMarkers: getCalendarDayMarkers,
    getAppointmentsForMonth: getAppointmentsForMonth,
    getAppointmentsForDate: getAppointmentsForDate,
    applyBookedDosesToVaccines: applyBookedDosesToVaccines,
    parseBirthFromPage: parseBirthFromPage,
    getAgeParts: getAgeParts,
    formatAgeZh: formatAgeZh,
    formatGrowthHeight: formatGrowthHeight,
    formatGrowthWeight: formatGrowthWeight,
    renderGrowthRecordCard: renderGrowthRecordCard,
    ageLabelToMonths: ageLabelToMonths,
    getScheduleHighlightAge: getScheduleHighlightAge,
    renderSwitcherHTML: renderSwitcherHTML,
    mountSwitcher: mountSwitcher,
    bindSwitcher: bindSwitcher,
    initAgeLabels: initAgeLabels,
    renderGrowthTimelineHTML: renderGrowthTimelineHTML,
    renderGrowthHeightIconHTML: renderGrowthHeightIconHTML,
    renderGrowthWeightIconHTML: renderGrowthWeightIconHTML,
    mountGrowthTimeline: mountGrowthTimeline,
    initGrowthRecordSwipe: initGrowthRecordSwipe
  };
})(typeof window !== "undefined" ? window : globalThis);
