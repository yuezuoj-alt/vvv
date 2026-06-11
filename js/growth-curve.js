/**
 * 成长曲线图 — WHO 参考色带 + 记录数据点/折线
 * 参考 Figma node 1-1869
 */
(function (global) {
  "use strict";

  var PLOT_W = 324;
  var PLOT_H = 444;
  var MAX_MONTHS = 12;

  var WEIGHT_MIN = 2;
  var WEIGHT_MAX = 18;
  var HEIGHT_MIN = 30;
  var HEIGHT_MAX = 100;

  /** 与 Figma 1-1869 网格线对齐：18kg→35px，2kg→415px */
  var WEIGHT_Y_TOP = 35;
  var WEIGHT_Y_BOTTOM = 415;

  /** 100cm→28px，30cm→364px */
  var HEIGHT_Y_TOP = 28;
  var HEIGHT_Y_BOTTOM = 364;

  function parseRecordDate(dateStr) {
    if (!dateStr) return null;
    var m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function getFractionalMonths(birth, recordDate) {
    if (!birth || !recordDate) return 0;
    var parts = global.BabyProfile.getAgeParts(recordDate, birth);
    return parts.months + parts.days / 30.4375;
  }

  function monthToX(months) {
    var clamped = Math.max(0, Math.min(MAX_MONTHS, months));
    return (clamped / MAX_MONTHS) * PLOT_W;
  }

  function weightToY(kg) {
    var clamped = Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, kg));
    var ratio = (WEIGHT_MAX - clamped) / (WEIGHT_MAX - WEIGHT_MIN);
    return WEIGHT_Y_TOP + ratio * (WEIGHT_Y_BOTTOM - WEIGHT_Y_TOP);
  }

  function heightToY(cm) {
    var clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, cm));
    var ratio = (HEIGHT_MAX - clamped) / (HEIGHT_MAX - HEIGHT_MIN);
    return HEIGHT_Y_TOP + ratio * (HEIGHT_Y_BOTTOM - HEIGHT_Y_TOP);
  }

  function buildSeries(records, birth, field, toY) {
    return records
      .map(function (record) {
        var value = record[field];
        if (value == null || isNaN(value)) return null;
        var date = parseRecordDate(record.date);
        if (!date) return null;
        return {
          x: monthToX(getFractionalMonths(birth, date)),
          y: toY(Number(value)),
          value: Number(value)
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return a.x - b.x;
      });
  }

  function polylinePoints(points) {
    return points
      .map(function (p) {
        return p.x.toFixed(2) + "," + p.y.toFixed(2);
      })
      .join(" ");
  }

  function renderDataLayer(svg, records, birth) {
    var heightPoints = buildSeries(records, birth, "height", heightToY);
    var weightPoints = buildSeries(records, birth, "weight", weightToY);
    var parts = [];

    if (heightPoints.length > 1) {
      parts.push(
        '<polyline points="' +
          polylinePoints(heightPoints) +
          '" fill="none" stroke="#f8e56c" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round"/>'
      );
    }

    if (weightPoints.length > 1) {
      parts.push(
        '<polyline points="' +
          polylinePoints(weightPoints) +
          '" fill="none" stroke="#9ebdae" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round"/>'
      );
    }

    heightPoints.forEach(function (p) {
      parts.push(
        '<circle cx="' +
          p.x.toFixed(2) +
          '" cy="' +
          p.y.toFixed(2) +
          '" r="4.5" fill="#fff" stroke="#f8e56c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>'
      );
    });

    weightPoints.forEach(function (p) {
      parts.push(
        '<circle cx="' +
          p.x.toFixed(2) +
          '" cy="' +
          p.y.toFixed(2) +
          '" r="4.5" fill="#fff" stroke="#9ebdae" stroke-width="1.5" vector-effect="non-scaling-stroke"/>'
      );
    });

    svg.innerHTML = parts.join("");
  }

  function mount(svgSelector, childId) {
    var svg = document.querySelector(svgSelector);
    if (!svg || !global.BabyProfile) return;

    var child = childId
      ? global.BabyProfile.getChildById(childId)
      : global.BabyProfile.getActiveChild();
    if (!child) return;

    var records = global.BabyProfile.getGrowthRecords(child.id);
    renderDataLayer(svg, records, child.birth);
  }

  global.GrowthCurve = {
    mount: mount,
    monthToX: monthToX,
    weightToY: weightToY,
    heightToY: heightToY
  };
})(window);
