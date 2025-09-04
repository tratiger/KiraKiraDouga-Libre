import { readFile, writeFile } from "fs/promises";

let svgPath = process.argv[2];
if (svgPath === "--") svgPath = process.argv[3];
if (!svgPath) throw new ReferenceError("SVGファイルが指定されていません。");
let svg = await readFile(svgPath, "utf-8");

// 簡単な処理のみを記述しており、複雑なものにはまだ完全に対応できません。

svg = svg.replaceAll(/\sfill="[^"]*"/g, "").replaceAll(/\s*<\/?g.*>/g, "").replaceAll(/\s*<defs>.*<\/defs>/gs, "").replaceAll(/\t+/g, "\t");
writeFile(svgPath, svg);
