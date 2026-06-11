const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const statusBarBlock =
  /\n\s*<div class="status-bar">\s*\n\s*<span class="time"[^>]*>[^<]*<\/span>\s*\n\s*<div class="dynamic-island"[^>]*><\/div>\s*\n\s*<div class="levels"><img src="images\/Levels\.png" alt="" class="levels-strip" \/><\/div>\s*\n\s*<\/div>\s*\n/g;

function patchHtml(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const before = html;

  html = html.replace(/\r\n/g, "\n");
  html = html.replace(/  <link rel="stylesheet" href="css\/status-bar\.css" \/>\n/g, "");
  html = html.replace(/--phone-h:\s*956px/g, "--phone-h: 894px");
  html = html.replace(statusBarBlock, "\n");
  html = html.replace(/\n\s*\.profile-top \.status-bar\s*\{[^}]*\}\s*\n/g, "\n");

  // Headers that included the 62px status bar
  html = html.replace(/height:\s*205px/g, "height: 143px");
  html = html.replace(/min-height:\s*173px/g, "min-height: 111px");
  html = html.replace(/height:\s*173px/g, "height: 111px");
  html = html.replace(/min-height:\s*208px/g, "min-height: 146px");
  html = html.replace(/height:\s*208px/g, "height: 146px");
  html = html.replace(/\.profile-top\s*\{[^}]*height:\s*185px/g, (m) =>
    m.replace("height: 185px", "height: 123px")
  );
  html = html.replace(/\.header\s*\{[^}]*height:\s*140px/g, (m) =>
    m.replace("height: 140px", "height: 78px")
  );

  // Personal info page: absolute positions included status bar offset
  if (path.basename(filePath) === "个人信息.html") {
    html = html.replace(/top:\s*73px/g, "top: 11px");
    html = html.replace(/top:\s*74px/g, "top: 12px");
  }

  html = html.replace(/205px，不与下方重叠/g, "143px，不与下方重叠");
  html = html.replace(/<!-- 粉色头部 205px -->/g, "<!-- 粉色头部 143px -->");

  if (html !== before) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log("updated:", path.basename(filePath));
  }
}

function patchCss(filePath) {
  let css = fs.readFileSync(filePath, "utf8");
  const before = css;

  css = css.replace(/--phone-h:\s*956px/g, "--phone-h: 894px");
  css = css.replace(/height:\s*205px/g, "height: 143px");
  css = css.replace(/\n\.vax-detail-header \.status-bar\s*\{[^}]*\}\s*\n/g, "\n");

  if (css !== before) {
    fs.writeFileSync(filePath, css, "utf8");
    console.log("updated:", path.basename(filePath));
  }
}

fs.readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .forEach((f) => patchHtml(path.join(root, f)));

patchCss(path.join(root, "css", "vaccine-detail.css"));
