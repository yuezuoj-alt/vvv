const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const cssLink = '  <link rel="stylesheet" href="css/bottom-nav.css" />';
const jsTag = '  <script src="js/bottom-nav.js"></script>';

const navHtml = [
  { nav: "appointment", label: "预约" },
  { nav: "schedule", label: "接种时间表" },
  { nav: "growth", label: "成长曲线" },
  { nav: "profile", label: "我的" }
];

const activeByFile = {
  "index.html": "appointment",
  "接种时间表.html": "schedule",
  "成长曲线.html": "growth",
  "成长记录.html": "growth",
  "成长记录添加.html": "growth",
  "我的.html": "profile",
  "提醒日期.html": "profile",
  "提醒时间.html": "profile",
  "添加共享成员.html": "profile",
  "疫苗修改计划.html": "appointment",
  "疫苗隐藏确认.html": "appointment",
  "疫苗预约时间.html": "appointment",
  "疫苗预约门诊.html": "appointment",
  "疫苗预约门诊选择.html": "appointment",
  "疫苗预约确认.html": "appointment"
};

function buildNav(active) {
  const items = navHtml
    .map(function (item) {
      const isActive = item.nav === active;
      const cls = isActive ? "nav-item active" : "nav-item";
      return (
        '      <button class="' +
        cls +
        '" data-nav="' +
        item.nav +
        '" type="button">' +
        '<span class="nav-icon"><img src="" alt="" /></span>' +
        '<span class="nav-label">' +
        item.label +
        "</span>" +
        "</button>"
      );
    })
    .join("\n");

  return (
    '    <nav class="bottom-nav" aria-label="主导航">\n' +
    items +
    "\n    </nav>"
  );
}

function buildNavStatic(active) {
  const items = navHtml
    .map(function (item) {
      const isActive = item.nav === active;
      const cls = isActive ? "nav-item active" : "nav-item";
      return (
        '      <div class="' +
        cls +
        '" data-nav="' +
        item.nav +
        '">' +
        '<span class="nav-icon"><img src="" alt="" /></span>' +
        '<span class="nav-label">' +
        item.label +
        "</span></div>"
      );
    })
    .join("\n");

  return (
    '    <nav class="bottom-nav" aria-hidden="true">\n' +
    items +
    "\n    </nav>"
  );
}

const files = fs.readdirSync(root).filter(function (f) {
  return f.endsWith(".html") && fs.readFileSync(path.join(root, f), "utf8").includes("bottom-nav");
});

const staticNavFiles = new Set([
  "疫苗修改计划.html",
  "疫苗隐藏确认.html",
  "成长记录添加.html",
  "添加共享成员.html",
  "提醒日期.html",
  "提醒时间.html"
]);

files.forEach(function (file) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, "utf8");
  const before = html;
  const active = activeByFile[file] || "appointment";
  const isStatic = staticNavFiles.has(file);

  if (!html.includes("css/bottom-nav.css")) {
    html = html.replace(
      /(<link rel="stylesheet" href="css\/status-bar\.css" \/>)/,
      "$1\n" + cssLink
    );
  }

  html = html.replace(/<nav class="bottom-nav"[\s\S]*?<\/nav>/, function () {
    return isStatic ? buildNavStatic(active) : buildNav(active);
  });

  html = html.replace(
    /\.nav-item \.nav-icon img \{[^}]*\}\s*\n/g,
    ""
  );
  html = html.replace(
    /\.nav-item \.nav-icon \{\s*\n\s*width: 42px;\s*\n\s*height: 42px;[^}]*\}\s*\n/g,
    ""
  );

  if (!html.includes("js/bottom-nav.js")) {
    html = html.replace(/<\/body>/, jsTag + "\n</body>");
  }

  if (html !== before) {
    fs.writeFileSync(fp, html, "utf8");
    console.log("updated:", file);
  }
});
