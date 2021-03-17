export interface instance {
    name: string;
    left: string[];
    right: string[];
    selected?: boolean;
}

export const INSTANCES: instance[] = [
    {
        name: 'warmup',
        left: ["afoot", "catfoot", "dogfoot", "fanfoot", "foody", "foolery", "foolish", "fooster", "footage", "foothot", "footle", "footpad", "footway", "hotfoot", "jawfoot", "mafoo", "nonfood", "padfoot", "prefool", "sfoot", "unfool"],
        right: ["Atlas", "Aymoro", "Iberic", "Mahran", "Ormazd", "Silipan", "altared", "chandoo", "crenel", "crooked", "fardo", "folksy", "forest", "hebamic", "idgah", "manlike", "marly", "palazzi", "sixfold", "tarrock", "unfold"],
        selected: true,
    },
    {
        name: 'anchors',
        left: ["Mick", "Rick", "allocochick", "backtrick", "bestick", "candlestick", "counterprick", "heartsick", "lampwick", "lick", "lungsick", "potstick", "quick", "rampick", "rebrick", "relick", "seasick", "slick", "tick", "unsick", "upstick"],
        right: ["Kickapoo", "Nickneven", "Rickettsiales", "billsticker", "borickite", "chickell", "fickleness", "finickily", "kilbrickenite", "lickpenny", "mispickel", "quickfoot", "quickhatch", "ricksha", "rollicking", "slapsticky", "snickdrawing", "sunstricken", "tricklingly", "unlicked", "unnickeled"],
    }
];
