
export let reviewList = [
    { id: 'korea', review: [{name:"김태훈", review : "음", star : 3, good: true},{name:"박 앤세일", review : "메우!", star : 5, good: false}]},
    { id: 'japan', review: [{name:"김태훈", review : "음", star : 5, good: true}]},
    { id: 'china', review: [{name:"김태훈", review : "음", star : 5, good: true}]},
    { id: 'america', review: [{name:"김태훈",review : "음", star : 5, good: true}]},
    { id: 'yeongdeok', review: [{name:"김태훈",review : "별로에요!", star : 0, good: false}]},
    { id: 'taiwan', review: [{name:"김태훈",review : "별로에요!", star : 4, good: false}]}
]

export function addReview(num: number, n: string, r : string, s : number, g : boolean){
    let rv ={
        name : n,
        review : r,
        star : s,
        good : g
    }
    reviewList[num].review.push(rv);
}

export function getReview(i){
    let j;
    for(j = 0; j < reviewList.length; j++)
    {
        if(reviewList[j].id == i)
            break;
    }
    return [j ,reviewList[j].review]
}