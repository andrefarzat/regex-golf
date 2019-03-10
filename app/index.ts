import ILS_Shrink from '../src/localsearch/ILS_Shrink';

declare const window: any;


async function init() {
    const data = () => {
        return {
            matchList: '' as string,
            unmatchList: '' as string,
            budget: 500000,
            depth: 5,
            seed: "2967301147",
            timeout: 120000,
        };
    };

    const created = () => {
        
    };

    const vue = new Vue({ el: '#app', data, created });
}


async function main(left: string[], right: string[]) {
    let program = new ILS_Shrink(left, right);
    program.env = 'browser';


    console.log(program);
    program.init();
    console.log(program);
}


window.init = init;
window.main = main;