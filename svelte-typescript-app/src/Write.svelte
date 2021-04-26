<script lang="ts">
    import router from "page";
    import { LoadCurrent} from "@/landmark";
    import { getReview, addReview} from "@/reviewList";
    import ToggleR from "@/ToggleRecommend.svelte";
    import SetSP from "@/SetStarPoint.svelte";
    import { onMount } from "svelte";

    let id;
    let name;
    let length
    let setName;
    let filledGoodImg : boolean = false;
    let filledBadImg : boolean = false;
    let lastFilledImg;
    let starPoints : number = 0;
    let review;
    let reviewlist
    
    onMount(async ()=>{
        [id, name] = LoadCurrent();
        [length, reviewlist] = getReview(id);
    })

    function callBackRecommend(event){
        filledGoodImg = event.detail.goodImg;
        filledBadImg = event.detail.badImg;
        console.log(filledGoodImg, filledBadImg)
    }
    
    function callBackStarPoint(event){
        starPoints = event.detail.starPoints
    }
    

    function onClick(){

        if( setName == null ){
            alert("이름을 작성해주세요.")
        }
        else if(!filledGoodImg && !filledBadImg){
            alert("추천을 선택하여 주세요")
        }
        else{
            if(review == null) review = ""
            if(filledGoodImg) lastFilledImg = true;
            else lastFilledImg = false; 
            addReview(length, setName, review, starPoints, lastFilledImg);
            router.show("/info")
        }
    }

</script>
<div id="BlockWrite">
    {#if reviewlist != null}
        <div>
            <br>
            장소 : {name}
            <br>
            <br>
            국가 : {id}
        </div>
    {/if}
    <br>
    <div>
        작성자 이름 :
        <input type="text" placeholder="EX)홍길동" bind:value="{setName}"/>
    </div>
    <br>
    <div>
        추천 :
        <br>
        <ToggleR filledGoodImg="{filledGoodImg}" filledBadImg="{filledBadImg}" on:message="{callBackRecommend}"/>
    </div>
    <br>
    <div>
        별점 :
        <br>
        <SetSP LastStarPoint="{starPoints}" on:message="{callBackStarPoint}"/>
    </div>
    <br>
    <div>
        내용 :
        <br>
        <textarea id="rev" bind:value="{review}"/>
    </div>
    <center>
        <button on:click="{onClick}">완료</button>
    </center>
</div>

<style lang="scss">
    #BlockWrite{
        margin: 0%;
        margin-top: 5em;
        padding: 0%;
        padding-left: 1em;
        width: 50em;
        text-align: left;
        border: 1px solid #000000;
    }
    #rev{
        margin-left: 1em;
        height: 40em;
        width: 48em;
    }
</style>