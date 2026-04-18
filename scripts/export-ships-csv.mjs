#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const BASE_URL = 'https://ships.hackclub.com/api/v1';

function getArg(name) {
	const index = process.argv.indexOf(name);
	if (index === -1) return null;
	return process.argv[index + 1] ?? null;
}

function hasFlag(name) {
	return process.argv.includes(name);
}

function normalize(value) {
	return String(value ?? '').trim().toLowerCase();
}

function cleanText(value) {
	if (value == null) return '';
	const text = String(value).replace(/\s+/g, ' ').trim();
	if (!text) return '';

	const lowered = text.toLowerCase();
	if (lowered === 'null' || lowered === 'undefined' || lowered === 'n/a') return '';

	return text;
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

async function fetchJson(url, init) {
	const response = await fetch(url, init);
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Request failed (${response.status}): ${body.slice(0, 200)}`);
	}
	return response.json();
}

async function fetchEntriesWithCookie(sessionCookie) {
	const data = await fetchJson(`${BASE_URL}/me`, {
		headers: {
			cookie: `_ships_session=${sessionCookie}`
		}
	});

	if (!Array.isArray(data)) {
		throw new Error('Unexpected /me response format.');
	}

	return data;
}

async function fetchPublicEntries() {
	const data = await fetchJson(`${BASE_URL}/ysws_entries`);
	if (!Array.isArray(data)) {
		throw new Error('Unexpected /ysws_entries response format.');
	}
	return data;
}

function mapRows(entries) {
	return entries.map((entry) => ({
		id: cleanText(entry.id),
		ysws: cleanText(entry.ysws),
		approved_at: entry.approved_at ?? '',
		hours: entry.hours ?? '',
		country: cleanText(entry.country),
		github_username: cleanText(entry.github_username),
		code_url: cleanText(entry.code_url),
		demo_url: cleanText(entry.demo_url),
		description: cleanText(entry.description),
		screenshot_url: cleanText(entry.screenshot_url),
		github_stars: entry.github_stars ?? '',
		display_name: cleanText(entry.display_name),
		archived_demo: cleanText(entry.archived_demo),
		archived_repo: cleanText(entry.archived_repo)
	}));
}

async function main() {
	const githubUsername = getArg('--github') ?? process.env.SHIPS_GITHUB_USERNAME ?? null;
	const displayName = getArg('--display-name') ?? process.env.SHIPS_DISPLAY_NAME ?? null;
	const ysws = getArg('--ysws') ?? process.env.SHIPS_YSWS ?? null;
	const shipsSession = getArg('--ships-session') ?? process.env.SHIPS_SESSION_COOKIE ?? null;
	const includeUnapproved = hasFlag('--include-unapproved');
	const outPathArg = getArg('--out');
	const outPath = resolve(outPathArg ?? 'exports/ships-projects.csv');

	let entries;

	if (shipsSession) {
		entries = await fetchEntriesWithCookie(shipsSession);
	} else {
		entries = await fetchPublicEntries();
		if (!githubUsername && !displayName && !ysws) {
			throw new Error(
				'Missing filter. Provide --github <username>, --display-name <name>, or --ysws <program>, or pass --ships-session for authenticated /me export.'
			);
		}
	}

	let filtered = entries;

	if (!includeUnapproved) {
		filtered = filtered.filter((entry) => entry.approved_at != null);
	}

	if (githubUsername) {
		const wanted = normalize(githubUsername);
		filtered = filtered.filter((entry) => {
			const gh = normalize(entry.github_username);
			const code = normalize(entry.code_url);
			return gh.includes(wanted) || code.includes(wanted);
		});
	}

	if (displayName) {
		const wanted = normalize(displayName);
		filtered = filtered.filter((entry) => normalize(entry.display_name) === wanted);
	}

	if (ysws) {
		const wanted = normalize(ysws);
		filtered = filtered.filter((entry) => normalize(entry.ysws) === wanted);
	}

	const rows = mapRows(filtered);
	const csv = toCsv(rows);

	await mkdir(dirname(outPath), { recursive: true });

	await writeFile(outPath, csv + (csv ? '\n' : ''));

	console.log(`Exported ${rows.length} project(s) to ${outPath}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
