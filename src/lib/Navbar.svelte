<script lang="ts">
	import { onMount } from 'svelte';
	import type { Session, User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabaseClient';

	let session = $state<Session | null>(null);
	let user = $state<User | null>(null);
	let avatarUrl = $state('');

	function getSlackUserId(currentUser: User) {
		const identity = currentUser.identities?.find((item) => {
			const provider = item.provider.toLowerCase();
			return provider.includes('slack') || provider.startsWith('custom:');
		});

		return (
			identity?.identity_data?.sub ??
			identity?.identity_data?.user_id ??
			identity?.identity_data?.id ??
			currentUser.user_metadata?.slack_id ??
			''
		);
	}

	async function loadAvatar(currentUser: User | null) {
		const slackUserId = currentUser ? getSlackUserId(currentUser) : '';

		if (!slackUserId) {
			avatarUrl = '';
			return;
		}

		const response = await fetch(`https://cachet.dunkirk.sh/users/${encodeURIComponent(slackUserId)}`);

		if (!response.ok) {
			avatarUrl = `https://cachet.dunkirk.sh/users/${encodeURIComponent(slackUserId)}/r`;
			return;
		}

		const data = await response.json();
		avatarUrl = data.imageUrl ?? `https://cachet.dunkirk.sh/users/${encodeURIComponent(slackUserId)}/r`;
	}

	onMount(() => {
		const init = async () => {
			const [{ data: sessionData }, { data: userData }] = await Promise.all([
				supabase.auth.getSession(),
				supabase.auth.getUser()
			]);

			session = sessionData.session;
			user = userData.user;
			await loadAvatar(user);
		};

		void init();

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			session = nextSession;
			user = nextSession?.user ?? null;
			void loadAvatar(user);
		});

		return () => subscription.unsubscribe();
	});

	async function signOut() {
		await supabase.auth.signOut();
	}
</script>

<nav class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
		<a href="/" class="text-sm font-semibold tracking-[0.24em] uppercase text-slate-900">
			Shipyard
		</a>

		<div class="flex items-center gap-3 text-sm">
			<a href="#countries" class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
				Countries
			</a>
			{#if session}
				{#if avatarUrl}
					<img
						src={avatarUrl}
								alt={user?.email ?? 'Signed in user'}
						class="h-9 w-9 rounded-full border border-slate-200 object-cover"
					/>
				{/if}
				<button class="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700" onclick={signOut}>
					Log out
				</button>
			{:else}
				<a
					href="/login"
					class="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
				>
					Log in
				</a>
			{/if}
		</div>
	</div>
</nav>