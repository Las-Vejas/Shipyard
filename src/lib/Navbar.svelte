<script lang="ts">
	import { authClient } from '$lib/auth-client';

	const session = authClient.useSession();
	let profileMenuOpen = $state(false);

	async function signInWithHackClub() {
		try {
			await authClient.signIn.oauth2({
				providerId: 'hackclub',
				callbackURL: '/'
			});
		} catch (error) {
			console.error('Hack Club OAuth sign-in failed', error);
		}
	}

	async function signOut() {
		profileMenuOpen = false;
		await authClient.signOut();
	}

	function toggleProfileMenu() {
		profileMenuOpen = !profileMenuOpen;
	}

	function getAvatarUrl(user: { image?: string | null } | null | undefined): string | null {
		const withCustomAvatar = user as ({ avatar_url?: string | null; image?: string | null } | null | undefined);
		return withCustomAvatar?.avatar_url ?? withCustomAvatar?.image ?? null;
	}
</script>

<nav class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
		<a href="/" class="text-sm font-semibold tracking-[0.24em] uppercase monospaced text-slate-900">
			Shipyard
		</a>

		<div class="flex items-center gap-3 text-sm">
			<a href="/" class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
				Home
			</a>

			{#if $session.data?.user}
				<a href="/dashboard" class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
					Dashboard
				</a>
			{/if}

			{#if $session.data?.user}
				<div class="relative">
					<button
						type="button"
						onclick={toggleProfileMenu}
						class="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-slate-700 transition hover:bg-slate-100"
					>
						{#if getAvatarUrl($session.data.user)}
							<img
								src={getAvatarUrl($session.data.user) ?? undefined}
								alt="Profile"
								class="h-8 w-8 rounded-full object-cover"
							/>
						{:else}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
								{$session.data.user.name?.slice(0, 1).toUpperCase() ?? '?'}
							</div>
						{/if}

						<span class="hidden pr-1 text-slate-600 sm:inline">{$session.data.user.name}</span>
					</button>

					{#if profileMenuOpen}
						<div class="absolute top-12 right-0 z-50 min-w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
							<button
								type="button"
								onclick={signOut}
								class="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
							>
								Sign out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button
					type="button"
					onclick={signInWithHackClub}
					class="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
				>
					Continue with Hack Club
				</button>
			{/if}
		</div>
	</div>
</nav>