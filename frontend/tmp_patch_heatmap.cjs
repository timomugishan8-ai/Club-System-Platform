const fs = require("fs");
const p = "src/components/GitHubHeatmap.jsx";
let s = fs.readFileSync(p, "utf8");

const oldBlock = [
    "const buildGrid = (activity) => {",
    "  const map = {}",
    "  for (const row of activity) {",
    "    map[row.activity_date] = row.count",
    "  }",
    ""
].join("\n");

const newBlock = [
    "const localDateKey = (date) => {",
    "  const y = date.getFullYear()",
    "  const m = String(date.getMonth() + 1).padStart(2, '0')",
    "  const d = String(date.getDate()).padStart(2, '0')",
    "  return `${y}-${m}-${d}`",
    "}",
    "",
    "const buildGrid = (activity) => {",
    "  const map = {}",
    "  for (const row of activity) {",
    "    map[String(row.activity_date).slice(0, 10)] = row.count",
    "  }",
    ""
].join("\n");

if (!s.includes(oldBlock)) { console.error("OLD NOT FOUND"); process.exit(1); }
s = s.replace(oldBlock, newBlock);

const oldKey = "      const key = date.toISOString().slice(0, 10)\n";
const newKey = "      const key = localDateKey(date)\n";
if (!s.includes(oldKey)) { console.error("KEY NOT FOUND"); process.exit(1); }
s = s.replace(oldKey, newKey);

fs.writeFileSync(p, s);
console.log("PATCHED");