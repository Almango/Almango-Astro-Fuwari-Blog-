import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

/**
 * 自动生成永久链接（短版本，避免重复）
 * @param title 文章标题
 * @param existingSlugs 已存在的slug列表，用于避免重复
 * @returns 生成的slug
 */
function generateAutoSlug(title: string, existingSlugs: string[] = []): string {
	// 使用标题生成基础哈希
	let hash = 0;
	for (let i = 0; i < title.length; i++) {
		const char = title.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	
	let baseSlug = Math.abs(hash).toString(36).slice(0, 8);
	let slug = baseSlug;
	let counter = 1;
	
	// 确保唯一性，如果重复则添加后缀
	while (existingSlugs.includes(slug)) {
		const suffix = counter.toString(36);
		slug = baseSlug.slice(0, 8 - suffix.length) + suffix;
		counter++;
	}
	
	return slug;
}

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	// 收集已存在的slug，用于避免重复
	const existingSlugs: string[] = [];
	
	// 第一遍：收集已有slug
	allBlogPosts.forEach((post) => {
		if (post.data.slug) {
			existingSlugs.push(post.data.slug);
		}
	});
	
	// 第二遍：为没有slug的文章生成唯一slug
	allBlogPosts.forEach((post) => {
		if (!post.data.slug) {
			// 使用默认的slug（基于文件路径），但确保唯一性
			let slug = post.slug;
			let counter = 1;
			while (existingSlugs.includes(slug)) {
				slug = `${post.slug}-${counter}`;
				counter++;
			}
			post.data.slug = slug;
			existingSlugs.push(slug); // 添加到已存在列表
		}
		// 使用最终的slug（自定义或自动生成的）
		post.slug = post.data.slug;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
