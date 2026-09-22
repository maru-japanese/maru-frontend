import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

let count = 0;
for (const root of ["shared", "frontend/assets/js", "scripts"]) {
  for (const file of readdirSync(root, { recursive: true }).filter(file => file.endsWith(".js"))) {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
    count++;
  }
}
const css = readFileSync("frontend/assets/css/main.css", "utf8");
for (const match of css.matchAll(/@import\s+"([^"]+)"/g)) readFileSync(path.resolve("frontend/assets/css", match[1]));
console.log(count + " módulos JavaScript válidos; imports de CSS encontrados.");
