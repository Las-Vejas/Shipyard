<script lang="ts">
	import { onMount } from 'svelte';
	import type { Session } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabaseClient';

	let session = $state<Session | null>(null);
	const provider = 'custom:hackclub';

	onMount(() => {
		const init = async () => {
			const { data } = await supabase.auth.getSession();
			session = data.session;
		};

		void init();

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			session = nextSession;
		});

		return () => subscription.unsubscribe();
	});

	async function signIn() {
		await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${window.location.origin}/`
			}
		});
	}

	async function signOut() {
		await supabase.auth.signOut();
		session = null;
	}
</script>

<svelte:head>
	<title>Log in | Shipyard</title>
</svelte:head>

<div class="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6">
	<div class="space-y-2 text-center">
		<h1 class="text-3xl font-semibold text-slate-900">Log in</h1>
		<p class="text-sm text-slate-600">Continue with Hack Club.</p>
	</div>

	{#if session}
		<div class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
			<p class="text-sm text-slate-700">Signed in as {session.user.email}</p>
			<button class="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700" onclick={signOut}>
				Log out
			</button>
		</div>
	{:else}
		<button
			class="rounded-full bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-700"
			onclick={signIn}
		>
			Continue with Hack Club
		</button>
	{/if}
</div>