import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { auth } from '$lib/auth';
import { fetchBuildApprovedProjects, filterShippedProjectsByUserName } from '$lib/server/forge';
import { fetchShippedProjectsForDisplayName } from '$lib/server/projects';

export const load: PageServerLoad = async ({ request }) => {
	const authSession = await auth.api.getSession({ headers: request.headers });
	if (!authSession?.user) {
		throw redirect(302, '/');
	}

	try {
		const shippedProjects = await fetchShippedProjectsForDisplayName(authSession.user.name, 100);

		return {
			shippedProjects,
			viewerName: authSession.user.name,
			loadError: null
		};
	} catch (error) {
		console.error('Failed to load user shipped projects from Supabase, falling back to Forge', error);

		try {
			const allApproved = await fetchBuildApprovedProjects(100);
			const shippedProjects = filterShippedProjectsByUserName(allApproved, authSession.user.name);
			return {
				shippedProjects,
				viewerName: authSession.user.name,
				loadError: 'Loaded from Forge fallback while Supabase was unavailable.'
			};
		} catch (fallbackError) {
			console.error('Failed to load user shipped projects fallback', fallbackError);
			return {
				shippedProjects: [],
				viewerName: authSession.user.name,
				loadError: 'Could not load your shipped projects right now.'
			};
		}
	}
};
