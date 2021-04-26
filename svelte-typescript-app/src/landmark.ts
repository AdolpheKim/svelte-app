export const landMarks = [
    { id: 'korea', name: '경복궁' },
    { id: 'japan', name: '천황궁' },
    { id: 'china', name: '자금성' },
    { id: 'america', name: '자유의 여신상'},
    { id: 'yeongdeok', name: '해맞이 공원'},
    { id: 'taiwan', name: '타이페이 어세신즈'},
];

export let currentScreenId;
export let currentScreenName;

export function ChangeCurrent(id, name){
    currentScreenId = id;
    currentScreenName = name;
}

export function LoadCurrent(){
    return [currentScreenId, currentScreenName];
}