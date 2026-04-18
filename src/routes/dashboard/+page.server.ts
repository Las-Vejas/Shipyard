import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { auth } from '$lib/auth';
import { fetchBuildApprovedProjects } from '$lib/server/forge';

export const load: PageServerLoad = async ({ request }) => {
	const authSession = await auth.api.getSession({ headers: request.headers });
	if (!authSession?.user) {
		throw redirect(302, '/');
	}

	const userName = (authSession.user.name ?? '').trim().toLowerCase();

	try {
		const allApproved = await fetchBuildApprovedProjects(100);
		const shippedProjects = allApproved
			.filter((project) => project.user.display_name.trim().toLowerCase() === userName)
			.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

		return {
			shippedProjects,
			viewerName: authSession.user.name,
			loadError: null
		};
	} catch (error) {
		console.error('Failed to load user shipped projects', error);
		return {
			shippedProjects: [],
			viewerName: authSession.user.name,
			loadError: 'Could not load your shipped projects right now.'
		};
	}
};
