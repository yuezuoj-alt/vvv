const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const levelsHtml =
  '<div class="levels"><img src="images/Levels.png" alt="" class="levels-strip" /></div>';

function buildCalendarButton(attrs) {
  const extra = attrs || 'class="calendar-btn" type="button" aria-label="日历"';
  return "<button " + extra + '><img src="images/rili.png" alt="" /></button>';
}

const files = fs.readdirSync(root).filter(function (f) {
  return f.endsWith(".html");
});

files.forEach(function (file) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, "utf8");
  const before = html;

  html = html.replace(/<div class="levels"[^>]*>[\s\S]*?<\/div>/g, function (block) {
    if (block.includes("Levels.png")) return block;
    return levelsHtml;
  });

  html = html.replace(/<button class="calendar-btn"[^>]*>[\s\S]*?<\/button>/g, function (block) {
    if (block.includes("images/rili.png")) return block;
    const open = block.match(/<button[^>]*>/)[0];
    const attrs = open.slice(8, -1);
    return buildCalendarButton(attrs);
  });

  html = html.replace(/<div class="calendar-btn"><\/div>/g, buildCalendarButton());

  html = html.replace(
    /\n\s*\.status-bar \.levels \.wifi[^\{]*\{[^}]*\}\s*\n/g,
    "\n"
  );
  html = html.replace(/\n\s*\.status-bar \.wifi[^\{]*\{[^}]*\}\s*\n/g, "\n");

  if (html !== before) {
    fs.writeFileSync(fp, html, "utf8");
    console.log("updated:", file);
  } else {
    console.log("skip:", file);
  }
});
