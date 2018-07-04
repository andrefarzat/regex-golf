import { Expect, Test, TestCase, TestFixture, FocusTest, IgnoreTest } from "alsatian";


import Constructed_RRLS from "../../src/localsearch/Constructed_RRLS";



export default class Constructed_RRLSTest {

    @Test("from python file")
    @TestCase('warmup', 'f.o')
    public testGenerateInitialIndividual(instanceName: string, expectedResult: string) {
        let rrls = new Constructed_RRLS(instanceName);
        rrls.init();

        let result = rrls.generateInitialIndividual();
        Expect(result.toString()).toEqual(expectedResult);
    }

    @Test("subparts")
    public testSubparts() {
        let rrls = new Constructed_RRLS('warmup');

        let expectedResult = new Set(['a', 'an', 'and', 'andr', 'd',  'dr', 'dre', 'e', 'n', 'nd', 'ndr', 'ndre', 'r', 're']);
        let result = rrls.subparts('andre');
        Expect(Array.from(result)).toEqual(Array.from(expectedResult));
    }

    @Test("dotify")
    public testDotify() {
        let rrls = new Constructed_RRLS('warmup');

        let expectedResult = new Set(['...', '..d', '.n.', '.nd', 'a..', 'a.d', 'an.', 'and']);
        let result = rrls.dotify('and');
        Expect(Array.from(result)).toEqual(Array.from(expectedResult));
    }

    @Test("product")
    public testProduct() {
        let rrls = new Constructed_RRLS('warmup');

        let expectedResult = [
            ['f', 'a', '1'],
            ['f', 'a', '2'],
            ['f', 'a', '3'],
            ['f', 'b', '1'],
            ['f', 'b', '2'],
            ['f', 'b', '3'],
            ['f', 'c', '1'],
            ['f', 'c', '2'],
            ['f', 'c', '3'],
            ['o', 'a', '1'],
            ['o', 'a', '2'],
            ['o', 'a', '3'],
            ['o', 'b', '1'],
            ['o', 'b', '2'],
            ['o', 'b', '3'],
            ['o', 'c', '1'],
            ['o', 'c', '2'],
            ['o', 'c', '3'],
            ['o', 'a', '1'],
            ['o', 'a', '2'],
            ['o', 'a', '3'],
            ['o', 'b', '1'],
            ['o', 'b', '2'],
            ['o', 'b', '3'],
            ['o', 'c', '1'],
            ['o', 'c', '2'],
            ['o', 'c', '3']
        ];
        let result = rrls.product(['f', 'o', 'o'], ['a', 'b', 'c'], ['1', '2', '3']);
        Expect(result).toEqual(expectedResult);
    }

    @IgnoreTest('Not implemented')
    @Test("regex_parts")
    public testRegexParts() {
        let rrls = new Constructed_RRLS('warmup');

        let expectedResult = new Set(['aw.o', '..te', '.tle', 'ot.e', '.wf.', '.ot.', '^.oo', '..le', 'foo$', 'os..', '^.af', 'otfo', '.ad$', '..ot', 'catf', 'li.h', '^foothot$', 'ge$', 'o.y', 'o.te', 'oo.$', '.h.t', 'od$', 'tho', 'af.o', '^.og', 'ca..', 'gf', '^s.o', '.ste', 'ood', 'ole.', '^.aw', 'ler.', '.tag', 'n.nf', 'te.$', 'l.r.', '.ood', 'hot.', '^foolish$', 'af.', 'otp', '.ag', 't..o', '^footpad$', 'pad.', 'ry$', 'o.l.', 'o.i.', 'pad', 'ootw', 'o.le', 'og..', '.wa', '.ost', 'ody', 'wa.$', '..nf', '^fan', 'o..p', 'oo.i', '.oot', 'e.oo', '^afo', 'oth.', 'awfo', 'ster', 'oo.t', '.ay', 'le..', 'oot', 'r.f.', '.sh', 'dy', '.gfo', '..is', 'onfo', 'on.o', 'j.w', 's.oo', '.e.o', 'ho', '..tw', 'og.o', '.i.h', 'fo.$', 'sf.o', 'ge', '.w.o', '.onf', 'ja..', 'maf.', 'otle', 'otf.', 'o.ho', '..tf', 'do.f', '..dy', 'ot.', 'l.sh', 'e.y', 's.e', 'tfo.', '.s..', 'te.', 'fool', '^prefool$', 'p.e', '^..w', 'w.y$', '^.fo', '^.f', '^d', 'ay$', 'er$', 'le$', 'fan', '.is.', '.w', '^foo', '^no', 'tfo', 'oota', '^unfool$', 'j..', 'dogf', 'af', 'otp.', 'onf.', 'ja.f', 'd..o', 'm.fo', 'nonf', 'o.s.', '^afoot$', 'ool$', '.on.', 'otw.', '.ef', 'ef..', '.oos', 'tpa', 'o.h', 'afoo', '^non', 'age', '.ef.', 'oth', 's.er', 't.ay', 'w.y', 'fa.f', '.gf.', '.ge', 'a.fo', 'ogf', 'd.gf', '..df', 'pre.', 'd.o.', 'ery', '.od.', 'f.o$', 'o.ag', 'pa.f', '.is', '.o.p', 'oody', 'h.t.', 'o..a', '.ref', 'wf', 'w...', 'anf', '.a.f', 'ooli', 'nf.o', '.ag.', 'i.h', '..r$', 'otpa', 'ooth', '.ad.', 'anfo', 'ste.', 'ad', 'c.t', '.g.$', '..gf', 'maf', 'hotf', 'lis.', 'o.dy', '.te', 'ag.$', 'oli', 'dfoo', 'p.d', 'o..l', '.ot$', '.oli', '.tp', 'no', 'ry', 'df..', '.way', '^hotfoot$', 't.ge', 'o..t', '.awf', 's..o', 'jawf', 'sf', 'er.$', 't..$', '^pre', '^m.f', 'hot', 'ool', 'olis', 'wfoo', 'o.l$', 'adf.', '.foo', '.s.e', 'w.', 'p.e.', 'ca', 's.o.', 'hot$', '.o.w', '.aw.', '.atf', 'ref.', 'l.ry', '..ad', 'oo.p', '.tpa', '.o.f', 'o..i', 'sfoo', 's.o', 'w.o.', 'jaw.', '..tl', '^ho', 'j', '.th.', 'ole', 'a.o', 'l.r', 'o.ta', 'f..f', 'ho.', 'g.$', 't.ot', '.o.y', 'otwa', '^maf', 's.e.', '.ot', '^p.e', 'foo.', '.le.', '^do.', '.tfo', 'o.w', 'gf.', 'f..s', '.at.', 'sf.', 'g.oo', 'e.o', 'sh', 'lis', 'og.', '^n.n', 'ler', '..ge', '.ter', '.od', 'aw.', '.ho.', 'g.o', 't.o.', 'e.y$', '.tw', 'way$', 'd.oo', 'efo', '.o.t', 'onf', 'tpa.', 'o.f.', 'tp.d', 'r.f', 'ho..', '^n..', 'ca.', 'padf', 'ish$', 'ery$', 'w..o', 'ol$', '.o.a', '^catfoot$', '..ay', 'tag', 'ay', 'od', '.anf', 'tw', 'oos', '.ry$', '.wa.', '^ca.', 'f.os', 'anf.', 'wf.o', '^jawfoot$', 'gfo.', '^j.w', '.te.', 'th', '.ler', '.o.s', '..ry', 'wa', '^fanfoot$', 'o.is', 'od.', 'tf.', 'h.tf', 'ef.o', '.ol$', '.dy$', '.ogf', '.efo', 'tp', 'oli.', '.otp', '^d..', 'wa.', 'no.', '.tf.', 'awf', 'age$', 't.g', '.o.h', 'dog', '^foolery$', 'atfo', 'a.f', 'efoo', 'o.th', 'tage', 'f.n.', '^dogfoot$', 'jaw', 'ca.f', 'j.w.', 'o.t', 'w.o', 'ag', 'o.t$', 'f.od', 'oo.a', '.on', '.gf', 'th.t', 'ho.f', 'aw', 'pre', 'twa', '.otl', 'p.ef', 'pr', '.wf', 'nfoo', '^hot', 'ad.', 'ost', 'st.', 'efo.', 'ag.', 'tw.y', 'foo', 'ish', '^af.', 'og', '.df.', '.ish', 'w..', 'n.n', 'h..f', 'tho.', 'o..g', 'o.f', 'h.t$', 'ad$', '..w.', 'p.d$', '..wf', 'otl.', '^..d', 'f..t', 'adf', 'ool.', 'ho.$', '.aw', 'df.', 'dfo', '.af', 'thot', 'oo.l', '^sf', '.tw.', '^footway$', '^ca', '.t.g', 'atf', '.le', 'o.li', 'o.d.', 'ood.', 'j.', 'oos.', 'i.h$', 'wfo', 'fo.t', 'mafo', 'otl', 'r$', '.df', 'e..o', 'foos', 'pr.', 'l..h', 'm.f', 'tpad', '.tp.', 'fo.l', 'non.', 'ter', 'st..', 'm.f.', 're.o', 'ootp', '.ole', 'g.o.', 'ad.o', '.os', '^.at', 'tag.', 'ot.o', '.ody', 'o.i', '^padfoot$', '.lis', '^do', 'o.a', '.o.l', 'os.', '.wfo', 'afo', 'f..l', '^p.d', 'ef', '.afo', '^pr', '^d.', 'on..', 'tw.', 'oler', 't..d', 'le.', 'wfo.', 'f.nf', '..ho', 'd..f', '..os', 'o.pa', '^j..', '..tp', 'at', '.t.e', 'ste', 't.ad', 'o..h', 'o..y', 'lery', '^mafoo$', 'ogfo', '.f.o', 'od.$', '.twa', '.hot', 'st.r', '.dy', 'sf..', 'r..o', 'd.g.', 'oot.', 'ad..', 'o.t.', 'otw', 'otho', '.ery', '.ota', '.adf', '..od', 'a.o.', 'oo.y', 't.o', '^sfoot$', 'sfo', '.od$', 'w', 'os.e', '^cat', 'ot', 'o.y$', 't..y', 'ma.o', 'sh$', 'o.l', 'r.fo', 't.e$', 'tp.', 'f.o', '.dfo', '.og.', 'food', 'f.n', 'tw..', 't.oo', '.sh$', 'o..r', '.ho', 'tf.o', 'j.wf', 'do..', '^fooster$', 'f.o.', 'ja.', '^.on', 'lish', '^jaw', '..w', 'ja', 'g..o', 'tp..', '.pad', 'afo.', 'foot', 'f.ot', '^j.', 'ref', '^dog', '^af', '^footage$', 'dy$', '.t.o', '^.ad', 'j..f', '^ja', 'at.o', '..ef', 'fanf', 'sfo.', 't.r$', 'ot.g', 'tle', 'dfo.', 'o.p.', 'j...', '..wa', 'on', 'no..', 'aw..', 'pr..', 'ota', '.w.', 'refo', '.o.i', 'is.', '^d.g', '.l.r', '.er$', 'ota.', 'oot$', 'tf', 'oste', '.ay$', 'otf', '^a.o', 'o.tw', '.p.d', 'df', 'on.', 'no.f', '.otw', 'w..$', 'tf..', '.at', 'df.o', '^sfo', 'ot$', '^pad', 'f.ol', '^h.t', '.th', 'oo.w', 'h.t', 'cat.', 'p.d.', 'e.o.', 'tfoo', 'cat', 'th..', '.tho', 'oost', '^n', '^.f.', 'o..w', '.os.', 'o.st', 'n..f', 's..r', 'a.e$', 'th.', 'pref', 'oo.h', 'atf.', '.g.o', 'os', 'p.df', 'wf.', 'pad$', 'n.n.', 'ol.r', '.w..', 'p..f', '..ag', '.af.', 'd.g', 'o.w.', '.r$', '..th', '.tf', 'o.s', 'at..', '^ho.', 'is.$', '^c.t', 'o.er', 'oole', 'ood$', 'adfo', 'le.y', 'ody$', '.ry', 'a.oo', '^pr.', 'o.p', 'ot..', '.a.o', 'gf..', 'ogf.', 'at.', 'o.tp', 'te', 'f..$', 'g...', '.ge$', '...w', '.otf', '.age', 'gf.o', 'o.tl', 'o.a.', 'ef.', '^j', 'gfo', 'o..o', '^nonfood$', 'o.fo', 'gfoo', '^ja.', '^footle$', 'ootl', 'ot.a', 'c.t.', '..sh', '.e.y', '.st.', '.ad', 'is', '^.ot', 'le', '^f.o', 'ost.', '.og', 'dog.', 'twa.', '^foody$', '^f.n', 'tway', 'wf..', '.le$', 'non', '^n.', '.w.y', 'c.tf', 'fo.s', 'pr.f', '^sf.', '...g', '.oth', 'otag', 'tl.$', 't.e', 'way', 'a.f.', 'af..', 'ter$', '.r.f', 'w.oo', 'h..$', 'c..f', '.ool', 't..t', '^no.', 'o.h.', 'tle$', 'fan.', 't.g.', 'o.wa', 'awf.']);
        let result = rrls.regex_parts(rrls.left, rrls.right);
        Expect(result.size).toEqual(expectedResult.size);
        // Expect(Array.from(result)).toEqual(Array.from(expectedResult));
    }

    // @Test("findregex")
    // public testFindRegex() {
    //     let rrls = new Constructed_RRLS('warmup');

    //     let expectedResult = 'f.o';
    //     let result = rrls.findregex(rrls.left, rrls.right);
    //     Expect(result).toEqual(expectedResult);
    // }
}