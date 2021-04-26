<script lang="ts">
    export let name : string;
    export let id : string;
</script>

<ul>
    <!-- svelte-ignore a11y-missing-content -->
    <img src="./img/{name}.png" alt="not found"/>
    <ul>
        <li>{name}</li>
        <li>{id}</li>
    </ul>
</ul>

<style lang="scss">
    ul{
        list-style: none;
        margin: 0%;
        padding: 0%;
        padding-top: 10%;

        img{
            width: 30em;
            height: 15em;
        }

        ul{
            font-size: 150%;
            list-style: none;
        }
    }
</style>