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
