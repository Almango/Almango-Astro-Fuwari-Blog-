console.log("🔍 测试脚本运行中...");
console.log("当前工作目录:", process.cwd());
console.log("Node.js版本:", process.version);
console.log("脚本参数:", process.argv);

import fs from "node:fs";
import path from "node:path";

const postsDir = "src/content/posts";
console.log("\n📁 检查目录:", postsDir);
console.log("目录存在:", fs.existsSync(postsDir));

if (fs.existsSync(postsDir)) {
	const files = fs.readdirSync(postsDir);
	const mdFiles = files.filter((file) => file.endsWith(".md"));
	console.log("总文件数:", files.length);
	console.log(".md文件数:", mdFiles.length);

	// 检查前3个文件
	mdFiles.slice(0, 3).forEach((file, index) => {
		const filePath = path.join(postsDir, file);
		const content = fs.readFileSync(filePath, "utf8");
		const hasSlug = content.includes("slug:");
		console.log(`${index + 1}. ${file} - 已有slug: ${hasSlug}`);
	});
}

console.log("\n✅ 测试完成");
