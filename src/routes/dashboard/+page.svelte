<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-6">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold text-slate-900">Your Shipped Projects</h1>
		<p class="text-slate-600">Projects from Forge marked as build approved and attributed to {data.viewerName}.</p>
	</header>

	{#if data.loadError}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{data.loadError}</p>
	{/if}

	{#if data.shippedProjects.length === 0}
		<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
			No shipped projects found yet.
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.shippedProjects as project}
				<article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
					{#if project.cover_image_url}
						<img src={project.cover_image_url} alt={project.name} class="h-44 w-full object-cover" />
					{/if}
					<div class="space-y-2 p-4">
						<h2 class="text-lg font-semibold text-slate-900">{project.name}</h2>
						{#if project.subtitle}
							<p class="text-sm text-slate-600">{project.subtitle}</p>
						{/if}
						<p class="text-xs text-slate-500">Tier: {project.tier.replace('_', ' ')}</p>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
