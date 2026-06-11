const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const map = {
  "疫苗隐藏确认.html": ["预约on.png", "表off.png", "成长off.png", "我的off.png"],
  "疫苗修改计划.html": ["预约on.png", "表off.png", "成长off.png", "我的off.png"],
  "添加共享成员.html": ["预约off.png", "表off.png", "成长off.png", "我的on.png"],
  "提醒时间.html": ["预约off.png", "表off.png", "成长off.png", "我的on.png"],
  "提醒日期.html": ["预约off.png", "表off.png", "成长off.png", "我的on.png"]
};

Object.keys(map).forEach((file) => {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, "utf8");
  let i = 0;
  html = html.replace(/<span class="nav-icon"><\/span>/g, () => {
    const src = "images/" + map[file][i++];
    return '<span class="nav-icon"><img src="' + src + '" alt="" /></span>';
  });
  fs.writeFileSync(p, html);
  console.log("fixed", file);
});
