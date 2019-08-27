import { ILS_Shrink } from "../localsearch/ILS_shrink";

const WEIGHTS: {[key: string]: number} = {
    "warmup": 10,
    "anchors": 10,
    "ranges": 10,
    "backrefs": 10,
    "abba": 10,
    "aman-aplan": 10,
    "prime": 15,
    "four": 10,
    "order": 10,
    "triples": 30,
    "glob": 20,
    "balance": 10,
    "powers": 10,
    "long-count": 270,
    "alphabetical": 20,
};

// Humanos
const SOLUTIONS = {
    "warmup": "foo",
    "anchors": "k$",
    "ranges": "^[a-f]*$",
    "backrefs": "(...).*\\1",
    "abba": "^(?!.*(.)\\1)|ef",
    "aman-aplan": "^(.)[^p].*\\1$",
    "prime": "^(?!(..+)\\1+$)",
    "four": "(.)(.\\1){3}",
    "order": "^.{5}[^e]?$",
    "triples": "00($|3|6|9|12|15)|4.2|.1.+4|55|.17",
    "glob": "ai|c$|^p|[bcnrw][bnopr]",
    "balance": ".{37}|^(<(..(?!<.>$))*>)*$",
    "powers": "^(?!(.(..)+)\\1*$)",
    "long-count": "((.+)0\\2+1){8}",
    "alphabetical": ".r.{32}r|a.{10}te|n.n..",
};

// Busca local
const _SOLUTIONS = {
    "warmup": "foo",
    "anchors": "k$",
    "ranges": "^[a-f]*$",
    "backrefs": "ho|ea|oc|ry|rp|te|tr|en|^[lm]|rou|.la*$",
    "abba": "rit|rs|st|z|ph|.u|te*$",
    "aman-aplan": "mu|ic|ev|oo|x|^[^cims]*$",
    "prime": "x{33}|^xx.?$",
    "four": "lit|ev|de|vi|ara|o.o",
    "order": "ce|ch|lo|^.[^ar]*$",
    "triples": "0{9}|472|775|0[12]5|003|900|009|06|5[45]|2[34]|[01]2$",
    "glob": "ro|rr|eat|lle|tl|de|co|gen|ow|fa|lo",
    "balance": ">>><>><<|<<>><>>|<>{4}<<|<>{4}$",
    "powers": "^..?$",
    "long-count": "0{4} 0001 0010 0011 0100 0101 0110 0111 1000 1001 1010 101",
    "alphabetical": "ar t[ -e]|a t|r sn|rt r|t tes|esen|e .r",
};

function evaluate(program: ILS_Shrink, regex: RegExp) {
    const result = {
        leftPoints: 0,
        rightPoints: 0,
        matchesOnLeft: 0,
        matchesOnRight: 0,
    };

    for (const name of program.left) {
        if (regex.test(name)) {
            result.leftPoints += name.length;
            result.matchesOnLeft += 1;
        }
    }

    for (const name of program.right) {
        if (regex.test(name)) {
            result.matchesOnRight += 1;
        } else {
            result.rightPoints += name.length;
        }
    }

    return result;
}

Object.entries(SOLUTIONS).forEach(async ([instance, text]) => {
    const program = new ILS_Shrink(instance).init();
    const regex = new RegExp(text);
    const result = evaluate(program, regex);

    const weight = WEIGHTS[instance];
    const fitness = weight * (result.matchesOnLeft - result.matchesOnRight) - text.length;

    // tslint:disable-next-line
    // console.log(instance, `[${fitness} of ${program.left.length * weight}]`, `[${result.matchesOnLeft} of ${program.left.length}]`, `[${result.matchesOnRight} of ${program.right.length}]`);
    console.log(`"${instance}": [${result.matchesOnLeft - result.matchesOnRight}, ${fitness}],`);
});
