const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const linkTag = '  <link rel="stylesheet" href="css/status-bar.css" />';
const files = fs.readdirSync(root).filter(function (f) {
  return f.endsWith(".html");
});

files.forEach(function (file) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, "utf8");
  const before = html;

  if (!html.includes("css/status-bar.css")) {
    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>\n" + linkTag);
    }
  }

  html = html.replace(
    /\n\s*\/\* Status Bar \*\/[\s\S]*?(?=\n\s*\/\* [^*]|\n\s*\.header-wrap|\n\s*\.profile-row|\n\s*\.top-bar|\n\s*\.tab-bar|\n\s*\.calendar|\n\s*\.page-|\n\s*\.content|\n\s*\.main|\n\s*\.nav|\n\s*@media)/,
    "\n"
  );
  html = html.replace(/\n\s*\.status-bar\s*\{[^}]*\}\s*\n/g, "\n");
  html = html.replace(/\n\s*\.status-bar \.time\s*\{[^}]*\}\s*\n/g, "\n");
  html = html.replace(/\n\s*\.status-bar \.levels\s*\{[^}]*\}\s*\n/g, "\n");
  html = html.replace(/\n\s*\.status-bar \.levels img[^\{]*\{[^}]*\}\s*\n/g, "\n");
  html = html.replace(
    /\n\s*\.status-bar \.levels \.(cellular|wifi|battery)\s*\{[^}]*\}\s*\n/g,
    "\n"
  );
  html = html.replace(
    /\n\s*\.status-bar \.(cellular|wifi|battery)\s*\{[^}]*\}\s*\n/g,
    "\n"
  );
  html = html.replace(/\n\s*\.dynamic-island\s*\{[^}]*\}\s*\n/g, "\n");
  html = html.replace(/\n\s*\.header-wrap \.status-bar[^\{]*\{[^}]*\}\s*\n/g, "\n");

  if (html !== before) {
    fs.writeFileSync(fp, html, "utf8");
    console.log("updated:", file);
  } else {
    console.log("skip:", file);
  }
});
