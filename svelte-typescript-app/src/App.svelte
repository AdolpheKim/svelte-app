<script lang="ts">
 
    import router from "page";
    import Main from "@/Main.svelte";
    import Write from '@/Write.svelte';
    import Info from '@/Info.svelte';

    let page : any;
    let params : any;

    router('/', () => (page = Main))
    router('/info', () => (page = Info))
    router('/write', () => (page = Write))
    router.start()

</script>

<center></center>
<main>
    <h1>SvelteExample</h1>
    <center>
        <svelte:component this="{page}" params="{params}" />
    </center>
</main>

<style lang="scss">
    main{
        padding: 0%;
        margin: 0%;
        text-align: left;
    }
    h1{
        font-size: 500%;
        margin: 0%;
        color: #000000;
        padding-left: 0.5em;
        padding-bottom: 0.5em;
        border-bottom: 2px solid #000000;
    }
</style>