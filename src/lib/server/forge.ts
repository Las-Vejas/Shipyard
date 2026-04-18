export type ForgeProject = {
	id: number;
	name: string;
	subtitle: string | null;
	description: string | null;
	status: string;
	tier: string;
	tags: string[];
	repo_link: string | null;
	cover_image_url: string | null;
	coin_rate: number | null;
	total_hours: number | null;
	coins_earned: number | null;
	built_at: string | null;
	build_proof_url: string | null;
	devlog_count: number;
	user: {
		id: number;
		display_name: string;
		avatar: string | null;
	};
	created_at: string;
	updated_at: string;
};

type ForgeProjectsResponse = {
	data: ForgeProject[];
	pagination: {
		count: number;
		page: number;
		per_page: number;
		pages: number;
		next: number | null;
		prev: number | null;
	};
};

const BASE_URL = 'https://forge.hackclub.com/api/v1';

export async function fetchBuildApprovedProjects(perPage = 24): Promise<ForgeProject[]> {
	const url = `${BASE_URL}/projects?status=build_approved&per_page=${perPage}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Forge API request failed: ${response.status}`);
	}

	const payload = (await response.json()) as ForgeProjectsResponse;
	return payload.data;
}

function normalize(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

export function rankPopularProjects(projects: ForgeProject[]): ForgeProject[] {
	return [...projects].sort((a, b) => {
		const byHours = (b.total_hours ?? 0) - (a.total_hours ?? 0);
		if (byHours !== 0) return byHours;

		const byDevlogs = (b.devlog_count ?? 0) - (a.devlog_count ?? 0);
		if (byDevlogs !== 0) return byDevlogs;

		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});
}

export function filterShippedProjectsByUserName(projects: ForgeProject[], userName: string | null | undefined): ForgeProject[] {
	const targetName = normalize(userName);
	if (!targetName) return [];

	return projects
		.filter((project) => normalize(project.user.display_name) === targetName)
		.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}
