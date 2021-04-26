<script lang="ts">
	import { landMarks, ChangeCurrent } from "@/landmark";
	import router from "page";
	import Item from "@/Item.svelte";

	function onClick(id, name){
		ChangeCurrent(id, name);
		router.show('/info');
	}

</script>
	<ul>
		{#each landMarks as {name, id}}
			<li href="/" on:click = {() => onClick(id, name)}>
				<Item name={id} id={name}/>
			</li>
		{/each}
	</ul>
<style lang="scss">
	ul{
		margin: 0%;
		margin-top: 5em;
		padding: 0%;
		list-style: none;
		text-align: center;
		width: 120em;
		li{
			width: 50em;
			height: 25em;
			display: inline-block;
			border: 1px solid #d3d3d3;
			padding-bottom: 5em;
			margin-bottom: 2em;
			margin-right: 2em;
		}
	}
</style>