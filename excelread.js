const xlsx = require("xlsx");
const fs = require("fs");

const inputPath = "TR.xlsx";
// 读取 Excel 文件
const workbook = xlsx.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 将 Excel 内容解析为 JSON
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// 去掉表头
data.shift();

// 转换为 XML 格式
const result = data
  .map((row) => `<string name="${row[0]}">${row[1]}</string>`)
  .join("\n");

const resultPath = "outputTR.xml";
// 保存为 XML 文件
fs.writeFileSync(resultPath, result, "utf8");

console.log("转换成功，输出保存在" + resultPath + " 文件中。");
