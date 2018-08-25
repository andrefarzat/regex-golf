import fs = require('fs');
import { TapBark } from "tap-bark";
import { TestSet, TestRunner } from "alsatian";

(async () => {
    const testSet = TestSet.create();
    testSet.addTestsFromFiles('./tests/**/*.ts');

    const testRunner = new TestRunner();

    let f = fs.createWriteStream('log.txt');

    testRunner.outputStream
        .pipe(process.stdout);

    await testRunner.run(testSet);
})().catch(e => {
    console.error(e);
    process.exit(1);
});