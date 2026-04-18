#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const EXPORTS_DIR = resolve('exports');
const OUT_PATH = resolve('exports/forge-like-projects-merged.csv');

function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = '';
	let i = 0;
	let inQuotes = false;

	while (i < text.length) {
		const char = text[i];

		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i += 1;
				continue;
			}

			field += char;
			i += 1;
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			i += 1;
			continue;
		}

		if (char === ',') {
			row.push(field);
			field = '';
			i += 1;
			continue;
		}

		if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			i += 1;
			continue;
		}

		if (char === '\r') {
			i += 1;
			continue;
		}

		field += char;
		i += 1;
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	if (rows.length === 0) return [];

	const headers = rows[0];
	return rows.slice(1).filter((r) => r.some((cell) => cell !== '')).map((r) => {
		const obj = {};
		headers.forEach((header, idx) => {
			obj[header] = r[idx] ?? '';
		});
		return obj;
	});
}

function escapeCsvValue(value) {
	const stringValue = String(value ?? '');
	if (/[",\n]/.test(stringValue)) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

function toCsv(rows) {
	if (rows.length === 0) return '';
	const headers = Object.keys(rows[0]);
	const lines = [headers.join(',')];

	for (const row of rows) {
		lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
	}

	return lines.join('\n');
}

function toIsoFromUnix(seconds) {
	if (!seconds) return '';
	const num = Number(seconds);
	if (!Number.isFinite(num) || num <= 0) return '';
	return new Date(num * 1000).toISOString();
}

function deriveName(codeUrl, ysws, id) {
	if (codeUrl) {
		try {
			const url = new URL(codeUrl);
			const parts = url.pathname.split('/').filter(Boolean);
			const repo = parts.at(-1);
			if (repo) return repo.replace(/[-_]+/g, ' ');
		} catch {
			// noop
		}
	}
	return `${ysws || 'Project'} ${String(id).slice(-6)}`;
}

function clean(value) {
	return String(value ?? '').trim();
}

async function main() {
	const files = (await readdir(EXPORTS_DIR))
		.filter((name) => name.startsWith('ships-projects-') && name.endsWith('.csv'))
		.map((name) => join(EXPORTS_DIR, name));

	if (files.length === 0) {
		throw new Error('No ships-projects-*.csv files found in exports/.');
	}

	const byId = new Map();

	for (const filePath of files) {
		const text = await readFile(filePath, 'utf8');
		const rows = parseCsv(text);
		for (const row of rows) {
			const id = clean(row.id);
			if (!id || byId.has(id)) continue;
			byId.set(id, row);
		}
	}

	const merged = [...byId.values()].map((row) => {
		const ysws = clean(row.ysws);
		const approvedAtIso = toIsoFromUnix(clean(row.approved_at));
		const codeUrl = clean(row.code_url);
		const displayName = clean(row.display_name) || clean(row.github_username);

		return {
			id: clean(row.id),
			name: deriveName(codeUrl, ysws, row.id),
			subtitle: ysws,
			description: clean(row.description),
			status: approvedAtIso ? 'build_approved' : 'pending',
			tier: '',
			tags: JSON.stringify([ysws, clean(row.country)].filter(Boolean)),
			repo_link: codeUrl,
			cover_image_url: clean(row.screenshot_url),
			coin_rate: '',
			total_hours: clean(row.hours),
			coins_earned: '',
			built_at: approvedAtIso,
			build_proof_url: clean(row.demo_url) || clean(row.archived_demo),
			devlog_count: '',
			user_id: '',
			user_display_name: displayName,
			user_avatar: '',
			created_at: approvedAtIso,
			updated_at: approvedAtIso,
			source_ysws: ysws,
			source_archived_repo: clean(row.archived_repo)
		};
	});

	merged.sort((a, b) => (b.built_at || '').localeCompare(a.built_at || ''));

	await mkdir(dirname(OUT_PATH), { recursive: true });
	await writeFile(OUT_PATH, toCsv(merged) + (merged.length ? '\n' : ''));

	console.log(`Merged ${files.length} file(s) into ${OUT_PATH}`);
	console.log(`Unique projects: ${merged.length}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
