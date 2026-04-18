import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { auth } from '$lib/auth';

export const handle: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({
		auth,
		event,
		resolve,
		building
	});
};