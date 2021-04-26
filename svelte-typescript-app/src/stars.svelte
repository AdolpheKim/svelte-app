<script lang="ts">
import { onMount } from "svelte";

    export let star : any;

    let starlist = {star : ['','','','','']};

    onMount(() => {
        for(let i = 0; i < star; i++){
            starlist.star[i] = 'star';
        }
    })
    
</script>

{#each starlist.star as i}
    {#if i == "star"}
        <img src="/img/fill.png" alt="not found"/>
    {:else}
        <img src="/img/unfill.png" alt="not found"/>
    {/if}
{/each}

<style lang="scss">
    img{
        width: 1em;
        height: 1em;
    }
</style>