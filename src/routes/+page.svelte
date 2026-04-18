<script>
  let { data } = $props();
</script>

<ul id="countries">
  {#each data.countries as country}
    <li>{country.name}</li>
  {/each}
</ul>

<div id="hero" class="flex flex-col items-center justify-center text-center gap-2">
    <h1 class="text-3xl ">Shipyard</h1>
    <h2>A collection of Hack Clubs hardware projects</h2>
    <div>
        <button class="px-2 py-1 border  rounded-4xl">Get started</button>
        <button class="p-2 rounded">Log in</button>
    </div>
</div>