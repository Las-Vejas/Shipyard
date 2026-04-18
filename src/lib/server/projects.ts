import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

import type { ForgeProject } from '$lib/server/forge';

type ProjectRow = {
	id: string;
	name: string | null;
	subtitle: string | null;
	description: string | null;
	status: string | null;
	tier: string | null;
	tags: unknown;
	repo_link: string | null;
	cover_image_url: string | null;
	coin_rate: number | null;
	total_hours: number | null;
	coins_earned: number | null;
	built_at: string | null;
	build_proof_url: string | null;
	devlog_count: number | null;
	user_id: string | null;
	user_display_name: string | null;
	user_avatar: string | null;
	created_at: string | null;
	updated_at: string | null;
};

function parseTags(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (Array.isArray(parsed)) {
				return parsed.filter((item): item is string => typeof item === 'string');
			}
		} catch {
			return [];
		}
	}

	return [];
}

function mapRowToForgeProject(row: ProjectRow): ForgeProject {
	const numericId = Number(row.id);

	return {
		id: Number.isFinite(numericId) ? numericId : 0,
		name: row.name ?? 'Untitled Project',
		subtitle: row.subtitle,
		description: row.description,
		status: row.status ?? 'submitted',
		tier: row.tier ?? '',
		tags: parseTags(row.tags),
		repo_link: row.repo_link,
		cover_image_url: row.cover_image_url,
		coin_rate: row.coin_rate,
		total_hours: row.total_hours,
		coins_earned: row.coins_earned,
		built_at: row.built_at,
		build_proof_url: row.build_proof_url,
		devlog_count: row.devlog_count ?? 0,
		user: {
			id: 0,
			display_name: row.user_display_name ?? 'Unknown Builder',
			avatar: row.user_avatar
		},
		created_at: row.created_at ?? new Date(0).toISOString(),
		updated_at: row.updated_at ?? row.created_at ?? new Date(0).toISOString()
	};
}

function getSupabaseServerClient() {
	const supabaseUrl = env.SUPABASE_URL ?? PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_KEY ?? env.SUPABASE_ANON_KEY ?? PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase URL/key is missing for projects table reads.');
	}

	return createClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export async function fetchBuildApprovedProjectsFromSupabase(limit = 24): Promise<ForgeProject[]> {
	const supabase = getSupabaseServerClient();

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.eq('status', 'build_approved')
		.order('built_at', { ascending: false, nullsFirst: false })
		.limit(limit);

	if (error) {
		throw new Error(`Supabase projects query failed: ${error.message}`);
	}

	return (data as ProjectRow[]).map(mapRowToForgeProject);
}

export async function fetchShippedProjectsForDisplayName(userName: string | null | undefined, limit = 100): Promise<ForgeProject[]> {
	if (!userName?.trim()) return [];

	const supabase = getSupabaseServerClient();

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.eq('status', 'build_approved')
		.ilike('user_display_name', userName.trim())
		.order('updated_at', { ascending: false, nullsFirst: false })
		.limit(limit);

	if (error) {
		throw new Error(`Supabase user projects query failed: ${error.message}`);
	}

	return (data as ProjectRow[]).map(mapRowToForgeProject);
}