import ILS_Shrink from '../localsearch/ILS_Shrink';


async function main() {
    const left = ['a', 'b', 'c'];
    const right = ['e', 'f', 'g'];

    let program = new ILS_Shrink(left, right);
    console.log(program);
    program.init();
    console.log(program);
}


main();