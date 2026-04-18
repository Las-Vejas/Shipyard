import type { PageServerLoad } from './$types';

import { fetchBuildApprovedProjects } from '$lib/server/forge';

export const load: PageServerLoad = async () => {
	try {
		const projects = await fetchBuildApprovedProjects(24);

		const popularProjects = [...projects].sort((a, b) => {
			const byHours = (b.total_hours ?? 0) - (a.total_hours ?? 0);
			if (byHours !== 0) return byHours;

			const byDevlogs = (b.devlog_count ?? 0) - (a.devlog_count ?? 0);
			if (byDevlogs !== 0) return byDevlogs;

			return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
		});

		return { popularProjects, loadError: null };
	} catch (error) {
		console.error('Failed to load popular projects', error);
		return { popularProjects: [], loadError: 'Could not load projects right now.' };
	}
};
