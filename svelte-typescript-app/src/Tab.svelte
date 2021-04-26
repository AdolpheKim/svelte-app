<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    export let check;

    const dispatch  = createEventDispatcher();

    function dispatchCheck(i : number){
        dispatch('message',{
            check : i
        });
    }
</script>

{#if check === 1}
    <img src="/img/filledinfo.png" alt="not found"/>
    <img src="/img/review.png" alt="not found"  on:click={()=>{dispatchCheck(2)}}/>
{:else}
    <img src="/img/info.png" alt="not found" on:click={()=>{dispatchCheck(1)}}/>
    <img src="/img/filledreview.png" alt="not found" />
{/if}

<style lang="scss">
    img{
        width : 200px;
        height : 100px;
    }
</style>