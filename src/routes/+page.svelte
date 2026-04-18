<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let search = $state('');
	let programFilter = $state('all');
	let minHours = $state('0');
	let currentPage = $state(1);
	const pageSize = 100;

	const programs = $derived.by(() => {
		const set = new Set<string>();
		for (const project of data.popularProjects) {
			for (const tag of project.tags ?? []) {
				if (typeof tag === 'string' && tag.trim().length > 0) {
					set.add(tag.trim());
				}
			}
		}
		return [...set].sort((a, b) => a.localeCompare(b));
	});

	const filteredProjects = $derived.by(() => {
		const query = search.trim().toLowerCase();
		const min = Number(minHours);

		return data.popularProjects.filter((project) => {
			if (programFilter !== 'all') {
				const projectTags = project.tags ?? [];
				if (!projectTags.includes(programFilter)) return false;
			}

			if (Number.isFinite(min) && min > 0 && (project.total_hours ?? 0) < min) {
				return false;
			}

			if (!query) return true;

			const haystack = [
				project.name,
				project.subtitle ?? '',
				project.description ?? '',
				project.user.display_name
			]
				.join(' ')
				.toLowerCase();

			return haystack.includes(query);
		});
	});

	const totalPages = $derived.by(() => Math.max(1, Math.ceil(filteredProjects.length / pageSize)));

	const pagedProjects = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredProjects.slice(start, start + pageSize);
	});

	$effect(() => {
		search;
		programFilter;
		minHours;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	function nextPage() {
		if (currentPage < totalPages) currentPage += 1;
	}

	function prevPage() {
		if (currentPage > 1) currentPage -= 1;
	}

	function getProgramName(project: PageData['popularProjects'][number]): string {
		if (project.subtitle && project.subtitle.trim().length > 0) return project.subtitle.trim();
		if (project.tags?.length) return project.tags[0];
		return 'Program';
	}

	function getProgramColor(project: PageData['popularProjects'][number]): string {
		const program = getProgramName(project).toLowerCase();

		if (program.includes('blueprint')) {
			return '#1e3a8a';
		}

		let hash = 0;

		for (let i = 0; i < program.length; i += 1) {
			hash = (hash * 31 + program.charCodeAt(i)) | 0;
		}

		const hue = Math.abs(hash) % 360;
		return `hsl(${hue} 72% 45%)`;
	}

	function getProgramLink(project: PageData['popularProjects'][number]): string | null {
		if (project.build_proof_url && project.build_proof_url.trim().length > 0) {
			return project.build_proof_url;
		}

		if (project.id && project.id > 0) {
			return `https://forge.hackclub.com/projects/${project.id}`;
		}

		return null;
	}
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8">
	<header class="space-y-3">
		<h1 class="text-4xl font-semibold text-slate-900 sm:text-5xl">Hardware Projects</h1>
		<p class="max-w-2xl text-base text-slate-600 sm:text-lg">
			Showing shipped hardware projects with build approved status, ranked by activity.
		</p>
	</header>

	{#if data.loadError}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{data.loadError}</p>
	{/if}

	<div class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
		<div class="space-y-1">
			<label for="project-search" class="text-xs font-medium uppercase tracking-wide text-slate-500">Search</label>
			<input
				id="project-search"
				type="text"
				bind:value={search}
				placeholder="Name, description, or builder"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500"
			/>
		</div>

		<div class="space-y-1">
			<label for="program-filter" class="text-xs font-medium uppercase tracking-wide text-slate-500">Program</label>
			<select
				id="program-filter"
				bind:value={programFilter}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500"
			>
				<option value="all">All programs</option>
				{#each programs as program}
					<option value={program}>{program}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-1">
			<label for="min-hours" class="text-xs font-medium uppercase tracking-wide text-slate-500">Minimum hours</label>
			<input
				id="min-hours"
				type="number"
				min="0"
				step="1"
				bind:value={minHours}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500"
			/>
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
		<p>Showing {pagedProjects.length} on page {currentPage} of {totalPages} ({filteredProjects.length} filtered of {data.popularProjects.length} total)</p>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={prevPage}
				disabled={currentPage === 1}
				class="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Prev
			</button>
			<button
				type="button"
				onclick={nextPage}
				disabled={currentPage === totalPages}
				class="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Next
			</button>
		</div>
	</div>

	{#if filteredProjects.length === 0}
		<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
			No projects match your current filters.
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each pagedProjects as project}
				<article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
					{#if project.cover_image_url}
						<img src={project.cover_image_url} alt={project.name} class="h-44 w-full object-cover" />
					{/if}
					<div class="space-y-2 p-4">
						<h2 class="text-lg font-semibold text-slate-900">{project.name}</h2>
						{#if project.subtitle}
							<p class="text-sm text-slate-600">{project.subtitle}</p>
						{/if}
						<p class="text-xs text-slate-500">by {project.user.display_name}</p>
						<p class="text-xs text-slate-500">
							Hours: {project.total_hours ?? 0} • Devlogs: {project.devlog_count}
						</p>

						<div class="flex items-center gap-2 pt-2 text-xs">
							{#if getProgramLink(project)}
								<a
									href={getProgramLink(project) ?? undefined}
									target="_blank"
									rel="noreferrer"
									class="rounded-full border border-transparent px-3 py-1 text-white transition hover:opacity-90"
									style={`background-color: ${getProgramColor(project)};`}
								>
									{getProgramName(project)}
								</a>
							{:else}
								<span
									aria-disabled="true"
									class="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-slate-500 cursor-not-allowed"
								>
									{getProgramName(project)}
								</span>
							{/if}

							{#if project.repo_link}
								<a
									href={project.repo_link}
									target="_blank"
									rel="noreferrer"
									class="rounded-full border border-slate-200 px-3 py-1 text-slate-700 transition hover:bg-slate-100"
								>
									GitHub
								</a>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>