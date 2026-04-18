<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-white text-slate-900">
	<Navbar />

	<main class="mx-auto w-full max-w-6xl px-6 py-8">
		{@render children()}
	</main>
</div>
