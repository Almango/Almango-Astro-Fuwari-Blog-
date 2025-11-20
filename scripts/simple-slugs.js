import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// 生成8位slug
function generateSlug(title) {
	const hash = crypto.createHash("md5").update(title).digest("hex");
	return hash.substring(0, 8);
}

// 处理单个文件
function processFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf8");

		// 检查是否有任何slug（无论有无引号）
		const hasSlug = content.includes('slug: "') || content.includes('slug:');
		
		// 检查是否有重复的slug
		const slugMatches = content.match(/^slug:\s*[^\n]*\n?/gm);
		const hasDuplicateSlug = slugMatches && slugMatches.length > 1;
		
		if (hasSlug && !hasDuplicateSlug && content.includes('slug: "')) {
			console.log(`✅ 跳过（已有正确的slug）: ${path.basename(filePath)}`);
			return false;
		}
		
		const action = hasDuplicateSlug ? '清理重复' : (hasSlug ? '替换' : '添加');

		// 提取标题
		const titleMatch = content.match(/^title:\s*(.+)$/m);
		if (!titleMatch) {
			console.log(`❌ 跳过（无标题）: ${path.basename(filePath)}`);
			return false;
		}

		const title = titleMatch[1].trim();
		const slug = generateSlug(title);

		console.log(`📝 ${action}slug: ${path.basename(filePath)}`);
		console.log(`   标题: ${title}`);
		console.log(`   ${action}slug: ${slug}`);

		// 查找frontmatter结束位置
		const frontmatterEnd = content.indexOf("---", 3);
		if (frontmatterEnd === -1) {
			console.log(`❌ 跳过（无frontmatter）: ${path.basename(filePath)}`);
			return false;
		}

		// 移除旧的slug（无论有无引号）
		let updatedContent = content.replace(/^slug:\s*[^\n]*\n?/gm, '');
		
		// 重新查找frontmatter结束位置（因为内容可能已改变）
		const newFrontmatterEnd = updatedContent.indexOf("---", 3);
		if (newFrontmatterEnd === -1) {
			console.log(`❌ 跳过（无frontmatter）: ${path.basename(filePath)}`);
			return false;
		}
		
		// 在frontmatter结束前插入slug
		const beforeFrontmatterEnd = updatedContent.substring(0, newFrontmatterEnd);
		const afterFrontmatterEnd = updatedContent.substring(newFrontmatterEnd);

		// 确保最后一行有换行符
		const insertText = beforeFrontmatterEnd.endsWith("\n")
			? `slug: "${slug}"\n`
			: `\nslug: "${slug}"`;

		const newContent = beforeFrontmatterEnd + insertText + afterFrontmatterEnd;

		// 写入文件
		fs.writeFileSync(filePath, newContent, "utf8");
		console.log(`✅ 成功${action}slug: ${path.basename(filePath)}`);
		return true;
	} catch (error) {
		console.log(`❌ 处理失败: ${path.basename(filePath)} - ${error.message}`);
		return false;
	}
}

// 主函数
async function main() {
	const postsDir = "src/content/posts";

	if (!fs.existsSync(postsDir)) {
		console.log(`❌ 目录不存在: ${postsDir}`);
		return;
	}

	console.log("🚀 开始批量生成slug...\n");

	const files = fs
		.readdirSync(postsDir)
		.filter((file) => file.endsWith(".md"))
		.filter((file) => !file.includes("guide/"))
		.map((file) => path.join(postsDir, file));

	console.log(`📁 找到 ${files.length} 个.md文件\n`);

	let processed = 0;
	let success = 0;

	for (const file of files) {
		processed++;
		if (processFile(file)) {
			success++;
		}
		console.log(""); // 空行分隔
	}

	console.log("📊 处理完成！");
	console.log(`   总文件数: ${processed}`);
	console.log(`   成功处理: ${success}`);
	console.log(`   跳过文件: ${processed - success}`);
}

// 运行脚本
if (
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1].endsWith("simple-slugs.js")
) {
	main().catch(console.error);
}

export { processFile, generateSlug };
