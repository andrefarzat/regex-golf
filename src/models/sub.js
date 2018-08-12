process.on('message', function({regex, index, left, right}) {

    if (regex === '') {
        process.send('');
        return;
    }


    let result = {
        index,
        matchesOnLeft: 0,
        ourFitness: 0,
        matchesOnRight: 0,
    };

    regex = new RegExp(regex);

    for (let name of left) {
        if (regex.test(name)) {
            result.matchesOnLeft += 1;
            result.ourFitness += 1;
        }
    }

    for (let name of right) {
        if (regex.test(name)) {
            result.matchesOnRight += 1;
        } else {
            result.ourFitness += 1;
        }
    }

    process.send(result);
});