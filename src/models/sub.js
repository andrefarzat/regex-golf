process.on('message', function({regex, index, left, right}) {
    if (regex === '') {
        process.send('');
        return;
    }

    let result = {
        index,
        leftPoints: 0,
        rightPoints: 0,
        matchesOnLeft: 0,
        matchesOnRight: 0,
    };

    regex = new RegExp(regex);

    for (let name of left) {
        if (regex.test(name)) {
            result.leftPoints += name.length;
            result.matchesOnLeft += 1;
        }
    }

    for (let name of right) {
        if (regex.test(name)) {
            result.matchesOnRight += 1;
        } else {
            result.rightPoints += name.length;
        }
    }

    process.send(result);
});