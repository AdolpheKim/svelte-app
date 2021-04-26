<script lang="ts">
    import router from "page";
    import Recommend from "@/recommend.svelte";
    import Stars from "@/stars.svelte";
    import Tab from "@/Tab.svelte"
    import { LoadCurrent, ChangeCurrent} from "@/landmark";
    import { getReview} from "@/reviewList";
    import { onMount } from "svelte";
    
    let cName : string;
    let id : string;
    let num : number;
    let check : number = 0;
    let Rlist;

    onMount(async ()=>{
        [id, cName] = LoadCurrent();
        [num, Rlist] = getReview(id);
        check = 1;
    });

    function onClick(){
        ChangeCurrent(id, cName);
        router.show('/write');
    }

    function backClick(){
        router.show('/');
    }

    function callBackcheck(event){
        check = event.detail.check;
    }
</script>

<div id="bt">
    <img src="/img/back.png" alt="not found" on:click="{backClick}"/>
</div>

<div id="tb">
    <Tab check={check} on:message="{callBackcheck}"/>
</div>

{#if check == 1} 
    <div>
        <ul id="info">
            <!-- svelte-ignore a11y-missing-content -->
            <img src="./img/{id}.png" alt="not found"/>
            <ul>
                <li>장소 : {cName}</li>
                <li>국가 : {id}</li>
            </ul>
        </ul>
    </div>
{:else if check == 2}
    <nav>
        <div id="btn"><img src="/img/writeReview.png" alt="not found" on:click="{onClick}"/></div>
    </nav>
    <br>`
    <div>
        <ul id="review">    
            {#each Rlist as {name, review, star, good}}
                <div id="once">
                    <ul id="rv">
                        <div id= "hms">
                            <Stars star="{star}"/>
                        </div>
                        <li>
                            <Recommend recommend="{good}"/>
                        </li>
                        <li>
                            <h3>{review}</h3>
                        </li>
                        <li>
                            {name} 
                        </li>
                    </ul>
                </div>
            {/each} 
        </ul>
    </div>
{/if}
<style lang="scss">
    #bt{
        margin: 0%;
        padding: 0%;
        
        img{
            margin-left: 1em;
            margin-top: 1em;
            width: 2em;
            height: 2em;
            float: left;
        }
    }
    #tb{
        margin: 0%;
        padding: 0%;
        margin-left: 50%;
        float: right;
    }
    #info{
        margin: 0%;
        padding: 0%;
        
        img{
            width: 50em;
            height: 40em;
        }

        ul{
            font-size: 150%;
            list-style: none;
        }
    }
    
    #btn{
        margin: 0%;
        padding: 0%;
        width: 50em;

        img{
            width: 5em;
            height: 2.5em;
            margin-right: 90%;
        }
    }
    #review{
        margin: 0%;
        padding: 0%;
        #once{
            border: 1px solid #000000;
            width: 50em;
            text-align: left;

            #rv{
                padding: 0%;
                list-style: none;
            }
            #hms{
                float: right;
            }
        }
    }
</style>