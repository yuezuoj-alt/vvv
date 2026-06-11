/**
 * 本地图片资源路径（images/ 目录，拼音文件名）
 */
(function (global) {
  "use strict";

  var I = "images/";

  var FUTURE_RING_NAMES = ["", "xuxianqiuyi", "xuxianqiuer", "xuxianqiusan", "xuxianqiusi", "xuxianqiuwu"];

  function futureRing(num) {
    var n = Math.min(5, Math.max(1, parseInt(num, 10) || 1));
    return I + FUTURE_RING_NAMES[n] + ".png";
  }

  global.AppAssets = {
    base: I,
    avatarXia: I + "unsplash_JfolIjRnveY.svg",
    avatarGou: I + "avatar-gou.png",
    navAppointmentOn: I + "yuyue.png",
    navAppointmentOff: I + "yuyueweidianji.png",
    navScheduleOn: I + "jiezhongshijianbiao.png",
    navScheduleOff: I + "jiezhongshijianbiaoweidianji.png",
    navGrowthOn: I + "chengzhangquxian.png",
    navGrowthOff: I + "chengzhangquxianno.png",
    navProfileOn: I + "wode.png",
    navProfileOff: I + "wodeweidianji.png",
    statusBarLevels: I + "Levels.png",
    calendar: I + "rili.png",
    timeline: I + "zhentou.png",
    timelineActive: I + "zhentou.png",
    help: I + "kepuwenhao.png",
    addVaccine: I + "jiahao.png",
    doseDone: I + "yizhongqiu.png",
    doseBooked: I + "yuyueqiu.png",
    futureRing: futureRing,
    arrowNext: I + "houyige.png",
    arrowPrev: I + "qianyige.png",
    clinicRow: I + "jiezhongmenzhen.png",
    addressRow: I + "xiangxidizhi.png",
    hoursRow: I + "yingyeshijian.png",
    clinicUnit: I + "zhensuo.png",
    reminder: I + "tixing.png",
    childInfo: I + "haizixinxi.png",
    share: I + "gongxiang.png",
    heightIcon: I + "height.png",
    weightIcon: I + "weight.png",
    vaxDetailBack: I + "fanhui.png",
    nextCardInner: I + "next-card-inner.svg",
    profilePillBg: I + "profile-pill-bg.svg"
  };
})(typeof window !== "undefined" ? window : globalThis);
