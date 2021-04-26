<script lang="ts">

    export let recommend : any;
    
</script>

{#if recommend}
    <img src="/img/fillgood.png" alt="not found"/>
{:else}
    <img src="/img/fillbad.png" alt="not found"/>
{/if}

<style lang="scss">
    img{
        width: 2em;
        height: 2em;
    }
</style>   