/* This is a script to create a new post markdown file with front-matter */

import fs from "node:fs";
import path from "node:path";

function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`Error: No filename argument provided
Usage: npm run new-post -- <filename>`);
	process.exit(1); // Terminate the script and return error code 1
}

let fileName = args[0];

// Add .md extension if not present
const fileExtensionRegex = /\.(md|mdx)$/i;
if (!fileExtensionRegex.test(fileName)) {
	fileName += ".md";
}

const targetDir = "./src/content/posts/";
const fullPath = path.join(targetDir, fileName);

if (fs.existsSync(fullPath)) {
	console.error(`Error: File ${fullPath} already exists `);
	process.exit(1);
}

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath);
if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
}

// 自动生成永久链接slug（短版本）
let slug = process.argv[3]
if (!slug) {
  // 使用基于标题的哈希值（短而唯一）
  let hash = 0
  for (let i = 0; i < args[0].length; i++) {
    const char = args[0].charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  slug = Math.abs(hash).toString(36).slice(0, 8)
  
  console.log(`🔗 自动生成永久链接: ${slug}`)
}

const content = `---
title: ${args[0]}
slug: ${slug}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---
`;

fs.writeFileSync(path.join(targetDir, fileName), content);

console.log(`Post ${fullPath} created`);
