import type { PageServerLoad } from './$types';

import { fetchBuildApprovedProjects, rankPopularProjects } from '$lib/server/forge';
import { fetchBuildApprovedProjectsFromSupabase } from '$lib/server/projects';

export const load: PageServerLoad = async () => {
	try {
		const projects = await fetchBuildApprovedProjectsFromSupabase(1000);
		const popularProjects = rankPopularProjects(projects);

		return { popularProjects, loadError: null };
	} catch (error) {
		console.error('Failed to load popular projects from Supabase, falling back to Forge', error);

		try {
			const projects = await fetchBuildApprovedProjects(1000);
			const popularProjects = rankPopularProjects(projects);
			return {
				popularProjects,
				loadError: 'Loaded from Forge fallback while Supabase was unavailable.'
			};
		} catch (fallbackError) {
			console.error('Failed to load popular projects fallback', fallbackError);
			return { popularProjects: [], loadError: 'Could not load projects right now.' };
		}
	}
};
