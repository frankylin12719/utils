const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");

const OUTPUT_DIR = "vsix_files";
const CONFIG = {
  delay: 1500, // 请求间隔
  retries: 3, // 失败重试次数
  timeout: 30000, // 下载超时
};

async function downloadExtension(ext, index, total) {
  try {
    // 解析插件信息
    const [publisher, ...nameParts] = ext.id.split(".");
    const extName = nameParts.join(".");
    const fileName = `${publisher}-${extName}-${ext.version}.vsix`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    // 构造下载URL
    // const url = `https://${publisher}.gallery.vsassets.io/_apis/public/gallery/publisher/${publisher}/extension/${extName}/${ext.version}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`;

    const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extName}/${ext.version}/vspackage`;
    console.log(`[${index + 1}/${total}] 正在下载 ${ext.id}@${ext.version}`);

    // 创建可重试的下载请求
    let retryCount = 0;
    while (retryCount <= CONFIG.retries) {
      try {
        const response = await axios({
          method: "get",
          url,
          responseType: "stream",
          timeout: CONFIG.timeout,
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/octet-stream",
          },
        });

        // 创建写入流
        const writer = (await fs.open(filePath, "w")).createWriteStream();

        // 使用管道传输数据
        await pipeline(response.data, writer);

        console.log(`✅ 下载完成: ${fileName}`);
        return true;
      } catch (error) {
        if (retryCount === CONFIG.retries) throw error;
        console.log(
          `⚠️ 重试下载 (${retryCount + 1}/${CONFIG.retries}): ${ext.id}`
        );
        retryCount++;
        await new Promise((r) => setTimeout(r, 2000 * retryCount));
      }
    }
  } catch (error) {
    console.error(`❌ 下载失败: ${ext.id}@${ext.version}`, error.message);
    return false;
  }
}

async function main() {
  try {
    // 读取配置文件
    const extensions = [
      { id: "ecmel.vscode-html-css", version: "2.0.13" },
      { id: "esbenp.prettier-vscode", version: "9.0.0" },
      { id: "exodiusstudios.comment-anchors", version: "1.10.4" },
      { id: "formulahendry.auto-close-tag", version: "0.5.5" },
      { id: "formulahendry.auto-rename-tag", version: "0.5.5" },
      { id: "formulahendry.code-runner", version: "0.9.10" },
      { id: "redhat.vscode-xml", version: "0.15.0" },
      { id: "ritwickdey.liveserver", version: "5.7.4" },
      { id: "rvest.vs-code-prettier-eslint", version: "1.0.0" },
    ];

    // 创建输出目录
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 批量下载
    for (const [index, ext] of extensions.entries()) {
      await downloadExtension(ext, index, extensions.length);
      await new Promise((r) => setTimeout(r, CONFIG.delay));
    }

    console.log("🎉 所有插件下载完成！");
    console.log(`输出目录：${path.resolve(OUTPUT_DIR)}`);
  } catch (error) {
    console.error("❌ 发生严重错误:", error.message);
    process.exit(1);
  }
}

// 执行主程序
main();
