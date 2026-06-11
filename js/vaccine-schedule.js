/**
 * VaccineSchedule — 接种时间表月龄映射与卡片状态计算
 * 月龄数据与 接种时间表.html 保持一致
 */
(function (global) {
  "use strict";

  /** 各疫苗每一针对应的推荐月龄（0 = 出生/24小时内） */
  const DOSE_AGE_MONTHS = {
    "卡介苗": [0],
    "乙肝疫苗": [0, 1, 6],
    "脊髓灰质炎疫苗": [2, 3, 4, 36],
    "百白破疫苗": [2, 4, 6, 18, 72],
    "A群脑流疫苗": [6, 9],
    "麻腮风疫苗": [8],
    "乙脑减毒疫苗": [8, 48],
    "乙脑灭活疫苗": [2, 4, 6, 12],
    "甲肝减毒疫苗": [18],
    "甲肝灭活疫苗": [18, 24],
    "A+C群脑流疫苗": [6, 9],
    "五联疫苗": [2, 3, 4, 18],
    "五价轮状疫苗": [2, 3, 4],
    "13价肺炎疫苗": [2, 4, 6, 12],
    "手足口疫苗": [6, 7],
    "水痘疫苗": [12, 72],
    "流感疫苗": [6]
  };

  /** 接种时间表行数据 — 与 接种时间表.html 保持一致 */
  const SCHEDULE_ROWS = [
    {
      age: "24小时内",
      height: 42,
      vaccines: [
        { name: "乙肝疫苗1/3", color: "pink", col: 0 },
        { name: "卡介疫苗", color: "yellow", col: 1 }
      ]
    },
    {
      age: "1月龄",
      height: 42,
      vaccines: [{ name: "乙肝疫苗2/3", color: "pink", col: 0 }]
    },
    {
      age: "2月龄",
      height: 84,
      vaccines: [
        { name: "脊灰疫苗1/4", color: "mint", col: 0, row: 0 },
        { name: "百白破1/4", color: "peach", col: 1, row: 0 },
        { name: "五联疫苗1/4", dashed: true, col: 0, row: 1 },
        { name: "五价轮状1/3", dashed: true, col: 1, row: 1 },
        { name: "13价肺炎1/4", dashed: true, col: 2, row: 1 }
      ]
    },
    {
      age: "3月龄",
      height: 84,
      vaccines: [
        { name: "脊灰疫苗2/4", color: "mint", col: 0, row: 0 },
        { name: "五联疫苗2/4", dashed: true, col: 0, row: 1 },
        { name: "五价轮状2/3", dashed: true, col: 1, row: 1 }
      ]
    },
    {
      age: "4月龄",
      height: 84,
      vaccines: [
        { name: "脊灰疫苗3/4", color: "mint", col: 0, row: 0 },
        { name: "百白破2/4", color: "peach", col: 1, row: 0 },
        { name: "五联疫苗3/4", dashed: true, col: 0, row: 1 },
        { name: "五价轮状1/3", dashed: true, col: 1, row: 1 },
        { name: "13价肺炎2/4", dashed: true, col: 2, row: 1 }
      ]
    },
    {
      age: "6月龄",
      height: 84,
      vaccines: [
        { name: "乙肝疫苗3/3", color: "pink", col: 0, row: 0 },
        { name: "百白破3/4", color: "peach", col: 1, row: 0 },
        { name: "A群流脑1/2", color: "light-pink", col: 2, row: 0 },
        { name: "A+C结合流脑1/2", dashed: true, col: 0, row: 1 },
        { name: "手足口1/2", dashed: true, col: 1, row: 1 },
        { name: "13价肺炎3/4", dashed: true, col: 2, row: 1 }
      ]
    },
    {
      age: "7月龄",
      height: 42,
      vaccines: [{ name: "手足口1/2", dashed: true, col: 1, row: 0 }]
    },
    {
      age: "8月龄",
      height: 42,
      vaccines: [
        { name: "麻腮风1/2", color: "cyan", col: 0, row: 0 },
        { name: "乙脑减毒1/2", color: "light-green", col: 1, row: 0 }
      ]
    },
    {
      age: "9月龄",
      height: 84,
      vaccines: [
        { name: "A群流脑2/2", color: "light-pink", col: 2, row: 0 },
        { name: "A+C结合流脑1/2", dashed: true, col: 0, row: 1 }
      ]
    },
    {
      age: "12月龄",
      height: 42,
      vaccines: [
        { name: "水痘疫苗1/2", dashed: true, col: 1, row: 0 },
        { name: "13价肺炎4/4", dashed: true, col: 2, row: 0 }
      ]
    },
    {
      age: "18月龄",
      height: 84,
      vaccines: [
        { name: "麻腮风2/2", color: "cyan", col: 0, row: 0 },
        { name: "百白破4/4", color: "peach", col: 1, row: 0 },
        { name: "甲肝灭活1/2", color: "blue", col: 2, row: 0 },
        { name: "五联疫苗4/4", dashed: true, col: 0, row: 1 },
        { name: "甲肝减毒", dashed: true, col: 2, row: 1 }
      ]
    },
    {
      age: "2岁",
      height: 42,
      vaccines: [
        { name: "乙脑减毒2/2", color: "light-green", col: 1, row: 0 },
        { name: "甲肝灭活2/2", color: "blue", col: 2, row: 0 }
      ]
    },
    {
      age: "3岁",
      height: 84,
      vaccines: [
        { name: "AC流脑多糖1/2", color: "purple", col: 0, row: 0 },
        { name: "ACYW135多糖1/2", dashed: true, col: 0, row: 1 }
      ]
    },
    {
      age: "4岁",
      height: 84,
      vaccines: [
        { name: "脊灰疫苗4/4", color: "mint", col: 0, row: 0 },
        { name: "水痘疫苗2/2", dashed: true, col: 1, row: 1 }
      ]
    },
    {
      age: "6岁",
      height: 85,
      vaccines: [
        { name: "AC流脑多糖2/2", color: "purple", col: 0, row: 0 },
        { name: "白破疫苗", color: "peach", col: 1, row: 0 },
        { name: "ACYW135多糖2/2", dashed: true, col: 0, row: 1 }
      ]
    }
  ];

  /** 接种时间表月龄标签 → 数字月龄（与 baby-profile ageLabelToMonths 一致） */
  function ageLabelToMonths(age) {
    if (age === "24小时内") return 0;
    const m = age.match(/^(\d+)月龄$/);
    if (m) return parseInt(m[1], 10);
    const y = age.match(/^(\d+)岁$/);
    if (y) return parseInt(y[1], 10) * 12;
    return -1;
  }

  /** 时间表 pill 如「乙肝疫苗2/3」→ 针次 2 */
  function parsePillDoseNum(pillName) {
    const m = String(pillName).match(/(\d+)\s*\/\s*\d+/);
    if (m) return parseInt(m[1], 10);
    return 1;
  }

  const DEFAULT_BIRTH = new Date(2026, 3, 8);

  function parseBirthFromPage() {
    if (global.BabyProfile) {
      return global.BabyProfile.parseBirthFromPage();
    }
    const el = document.querySelector(".profile-pill .birth, .profile-row .birth");
    if (!el) return DEFAULT_BIRTH;
    const m = el.textContent.match(/(\d{4})年(\d{1,2})月(\d{1,2})/);
    if (!m) return DEFAULT_BIRTH;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  function getBabyAgeMonths(now, birth) {
    const b = birth || parseBirthFromPage();
    const n = now || new Date();
    let months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) months -= 1;
    return Math.max(0, months);
  }

  function getDoseScheduleMonth(vaccineName, doseIndex) {
    const ages = DOSE_AGE_MONTHS[vaccineName];
    if (!ages || !ages.length) return 999;
    const idx = Math.max(0, Math.min(doseIndex - 1, ages.length - 1));
    return ages[idx];
  }

  function getNextPendingDose(vaccine) {
    return vaccine.doses.find(function (d) {
      return d.type !== "done";
    }) || null;
  }

  function isVaccineCompleted(vaccine) {
    return vaccine.doses.every(function (d) {
      return d.type === "done";
    });
  }

  function isDueNow(vaccine, now, birth) {
    if (isVaccineCompleted(vaccine)) return false;
    const next = getNextPendingDose(vaccine);
    if (!next) return false;
    const doseNum = parseInt(next.num || String(vaccine.doses.indexOf(next) + 1), 10);
    const scheduleMonth = getDoseScheduleMonth(vaccine.name, doseNum);
    return getBabyAgeMonths(now, birth) >= scheduleMonth;
  }

  /** 首页疫苗卡片固定顺序（卡介苗、乙肝之后） */
  const HOME_VACCINE_ORDER = [
    "卡介苗",
    "乙肝疫苗",
    "脊髓灰质炎疫苗",
    "百白破疫苗",
    "A群脑流疫苗",
    "麻腮风疫苗",
    "乙脑减毒疫苗",
    "乙脑灭活疫苗",
    "甲肝减毒疫苗",
    "甲肝灭活疫苗",
    "A+C群脑流疫苗"
  ];

  function getHomeDisplayOrder(vaccineName) {
    const idx = HOME_VACCINE_ORDER.indexOf(vaccineName);
    return idx === -1 ? HOME_VACCINE_ORDER.length : idx;
  }

  /** 首页列表：按 HOME_VACCINE_ORDER 固定排列，自选疫苗排在最后 */
  function sortVaccinesForHome(list) {
    return list.slice().sort(function (a, b) {
      const oa = getHomeDisplayOrder(a.name);
      const ob = getHomeDisplayOrder(b.name);
      if (oa !== ob) return oa - ob;
      return a.name.localeCompare(b.name, "zh-CN");
    });
  }

  function getSortKey(vaccine, now, birth) {
    const next = getNextPendingDose(vaccine);
    if (!next) return Infinity;
    const doseNum = parseInt(
      next.num || String(vaccine.doses.indexOf(next) + 1),
      10
    );
    return getDoseScheduleMonth(vaccine.name, doseNum);
  }

  function sortVaccines(list, now, birth) {
    const birthDate = birth || parseBirthFromPage();
    const n = now || new Date();
    return list.slice().sort(function (a, b) {
      const ka = getSortKey(a, n, birthDate);
      const kb = getSortKey(b, n, birthDate);
      if (ka !== kb) return ka - kb;
      return getHomeDisplayOrder(a.name) - getHomeDisplayOrder(b.name);
    });
  }

  function scheduleMonthToDate(birth, monthOffset) {
    const d = new Date(birth.getTime());
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }

  function startOfDay(date) {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** 接种时间表 pill 名称 → 首页疫苗卡片名称 */
  function schedulePillToHomeName(pillName) {
    if (!pillName) return "";
    if (/卡介/.test(pillName)) return "卡介苗";
    if (/乙肝疫苗/.test(pillName)) return "乙肝疫苗";
    if (/脊灰疫苗|脊髓灰质炎/.test(pillName)) return "脊髓灰质炎疫苗";
    if (/百白破/.test(pillName)) return "百白破疫苗";
    if (/A群流脑|A群脑流/.test(pillName)) return "A群脑流疫苗";
    if (/A\+C结合流脑|AC流脑|A群C群/.test(pillName)) return "A+C群脑流疫苗";
    if (/麻腮风/.test(pillName)) return "麻腮风疫苗";
    if (/乙脑减毒/.test(pillName)) return "乙脑减毒疫苗";
    if (/乙脑灭活/.test(pillName)) return "乙脑灭活疫苗";
    if (/甲肝减毒/.test(pillName)) return "甲肝减毒疫苗";
    if (/甲肝灭活/.test(pillName)) return "甲肝灭活疫苗";
    if (/五联疫苗/.test(pillName)) return "五联疫苗";
    if (/五价轮状/.test(pillName)) return "五价轮状疫苗";
    if (/13价肺炎/.test(pillName)) return "13价肺炎疫苗";
    if (/手足口/.test(pillName)) return "手足口疫苗";
    if (/水痘疫苗/.test(pillName)) return "水痘疫苗";
    if (/流感/.test(pillName)) return "流感疫苗";
    return pillName.replace(/\d+\/\d+$/, "").trim();
  }

  /** 接种时间表 pill 对应针次在 index 是否已为已种球 */
  function isSchedulePillDone(pillName, now, birth, childId) {
    const homeName = schedulePillToHomeName(pillName);
    if (!homeName) return false;
    const doseNum = parsePillDoseNum(pillName);
    if (global.BabyProfile && global.BabyProfile.isVaccineDoseDone) {
      return global.BabyProfile.isVaccineDoseDone(
        homeName,
        doseNum,
        now,
        childId
      );
    }
    return false;
  }

  /** 从接种时间表 SCHEDULE_ROWS 解析「疫苗 + 针次 → 推荐月龄」 */
  let scheduleDoseMonthsCache = null;
  function getScheduleDoseMonthsMap() {
    if (scheduleDoseMonthsCache) return scheduleDoseMonthsCache;
    const map = {};
    SCHEDULE_ROWS.forEach(function (row) {
      const monthOffset = ageLabelToMonths(row.age);
      if (monthOffset < 0) return;
      (row.vaccines || []).forEach(function (pill) {
        const homeName = schedulePillToHomeName(pill.name);
        if (!homeName) return;
        const doseNum = parsePillDoseNum(pill.name);
        if (!map[homeName]) map[homeName] = {};
        if (map[homeName][doseNum] == null) {
          map[homeName][doseNum] = monthOffset;
        }
      });
    });
    scheduleDoseMonthsCache = map;
    return map;
  }

  function getDoseMonthOffsetFromSchedule(vaccineName, doseNum) {
    const scheduleMap = getScheduleDoseMonthsMap();
    const doseKey = parseInt(doseNum, 10);
    if (scheduleMap[vaccineName] && scheduleMap[vaccineName][doseKey] != null) {
      return scheduleMap[vaccineName][doseKey];
    }
    const ages = DOSE_AGE_MONTHS[vaccineName];
    if (!ages || !ages.length) return null;
    const idx = Math.max(0, Math.min(doseKey - 1, ages.length - 1));
    return ages[idx];
  }

  /** 某针次推荐接种日（出生日 + 接种时间表月龄） */
  function getRecommendedDoseDate(vaccineName, doseNum, birth) {
    const monthOffset = getDoseMonthOffsetFromSchedule(vaccineName, doseNum);
    if (monthOffset == null) return null;
    return scheduleMonthToDate(birth || parseBirthFromPage(), monthOffset);
  }

  /** 推荐接种日是否已到（含当天；参考接种时间表） */
  function isRecommendedDatePassed(vaccineName, doseNum, now, birth) {
    const recDate = getRecommendedDoseDate(vaccineName, doseNum, birth);
    if (!recDate) return false;
    return startOfDay(now || new Date()).getTime() >= startOfDay(recDate).getTime();
  }

  function formatScheduleDoseDate(date) {
    if (!date) return "--/--/--";
    const yy = String(date.getFullYear() % 100);
    const mm = String(date.getMonth() + 1);
    const dd = String(date.getDate());
    return yy + "/" + mm + "/" + dd;
  }

  /**
   * 接种时间表推荐日已到：虚线球 / 预约球 → 已种球（index 首页）
   */
  function applyAutoDoneBySchedule(vaccines, now, birth) {
    const n = now || new Date();
    const b = birth || parseBirthFromPage();

    return vaccines.map(function (vaccine) {
      return {
        name: vaccine.name,
        doses: vaccine.doses.map(function (dose) {
          if (dose.type === "done") {
            return Object.assign({}, dose);
          }

          const doseNum = parseInt(dose.num, 10);
          if (!isRecommendedDatePassed(vaccine.name, doseNum, n, b)) {
            return Object.assign({}, dose);
          }

          const recDate = getRecommendedDoseDate(vaccine.name, doseNum, b);
          return {
            type: "done",
            num: dose.num,
            date: formatScheduleDoseDate(recDate)
          };
        })
      };
    });
  }

  /** 当前粉色高亮月龄行内出现的首页疫苗名称集合 */
  function getCurrentScheduleMonthVaccineNames(now, birth) {
    const rows = SCHEDULE_ROWS;
    const b = birth || parseBirthFromPage();
    const n = now || new Date();
    let highlightAge = null;

    if (global.BabyProfile && global.BabyProfile.getScheduleHighlightAge) {
      highlightAge = global.BabyProfile.getScheduleHighlightAge(rows, n, b);
    }

    if (!highlightAge) return new Set();

    const row = rows.find(function (r) {
      return r.age === highlightAge;
    });
    if (!row || !row.vaccines) return new Set();

    const names = new Set();
    row.vaccines.forEach(function (pill) {
      const home = schedulePillToHomeName(pill.name);
      if (home) names.add(home);
    });
    return names;
  }

  /** 该疫苗是否出现在接种时间表当前粉色高亮月龄行 */
  function isInCurrentScheduleMonth(vaccineName, now, birth) {
    return getCurrentScheduleMonthVaccineNames(now, birth).has(vaccineName);
  }

  function getNearestVaccine(list, now, birth) {
    const sorted = sortVaccines(
      list.filter(function (v) {
        return !isVaccineCompleted(v);
      }),
      now,
      birth
    );
    return sorted[0] || null;
  }

  global.VaccineSchedule = {
    DOSE_AGE_MONTHS: DOSE_AGE_MONTHS,
    SCHEDULE_ROWS: SCHEDULE_ROWS,
    parseBirthFromPage: parseBirthFromPage,
    getBabyAgeMonths: getBabyAgeMonths,
    getDoseScheduleMonth: getDoseScheduleMonth,
    getNextPendingDose: getNextPendingDose,
    isVaccineCompleted: isVaccineCompleted,
    isDueNow: isDueNow,
    schedulePillToHomeName: schedulePillToHomeName,
    isSchedulePillDone: isSchedulePillDone,
    getCurrentScheduleMonthVaccineNames: getCurrentScheduleMonthVaccineNames,
    isInCurrentScheduleMonth: isInCurrentScheduleMonth,
    getSortKey: getSortKey,
    sortVaccines: sortVaccines,
    sortVaccinesForHome: sortVaccinesForHome,
    HOME_VACCINE_ORDER: HOME_VACCINE_ORDER,
    scheduleMonthToDate: scheduleMonthToDate,
    getRecommendedDoseDate: getRecommendedDoseDate,
    isRecommendedDatePassed: isRecommendedDatePassed,
    applyAutoDoneBySchedule: applyAutoDoneBySchedule,
    getNearestVaccine: getNearestVaccine
  };
})(typeof window !== "undefined" ? window : globalThis);
