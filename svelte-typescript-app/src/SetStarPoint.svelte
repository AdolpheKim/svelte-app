<script lang="ts">
    import {createEventDispatcher } from "svelte";

    const dispatch  = createEventDispatcher();

    export let LastStarPoint;

    let fillStars=[
        "/img/unfill.png",
        "/img/unfill.png",
        "/img/unfill.png",
        "/img/unfill.png",
        "/img/unfill.png",
        "/img/unfill.png"
    ];
    
    function onClick(index){
        if(LastStarPoint == index)  index = 0;
        for(let i = 1; i <= 5; i++){
            if(i <= index) fillStars[i] = "/img/fill.png";
            else fillStars[i] = "/img/unfill.png";
        }

        dispatch("message",{
            starPoints : index 
        })
    }
</script>

<img src="{fillStars[1]}" alt="not found" on:click={() => onClick(1)}/>
<img src="{fillStars[2]}" alt="not found" on:click={() => onClick(2)}/>
<img src="{fillStars[3]}" alt="not found" on:click={() => onClick(3)}/>
<img src="{fillStars[4]}" alt="not found" on:click={() => onClick(4)}/>
<img src="{fillStars[5]}" alt="not found" on:click={() => onClick(5)}/>

<style lang="scss">
    img{
        width : 5em;
        height : 5em;
    }
</style>