<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    export let filledGoodImg;
    export let filledBadImg;

    const dispatch  = createEventDispatcher();

    function dispatchGoodImage(){
        dispatch('message',{
            goodImg : true,
            badImg : false
        });
    }
    
    function dispatchBadImage(){
        dispatch('message',{
            goodImg : false,
            badImg : true
        });
    }
</script>

{#if filledGoodImg}
    <img src="/img/fillgood.png" alt="not found"/>
{:else}
    <img src="/img/good.png" alt="not found" on:click='{dispatchGoodImage}'/>
{/if}

{#if filledBadImg}
    <img src="/img/fillbad.png" alt="not found"/>
{:else}
    <img src="/img/bad.png" alt="not found" on:click='{dispatchBadImage}'/>
{/if}

<style lang="scss">
    img{
        width : 5em;
        height : 5em;
    }
</style>