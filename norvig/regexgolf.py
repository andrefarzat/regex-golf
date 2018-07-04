#!/usr/bin/env python

##
# Extracted from: https://www.oreilly.com/learning/regex-golf-with-peter-norvig
##

from __future__ import division, print_function
from pprint import pprint
import re
import itertools
import sys
import os


def mistakes(regex, left_list, right_list):
    "The set of mistakes made by this regex in classifying winners and losers."
    return ({"Should have matched: " + W for W in left_list if not re.search(regex, W)} |
            {"Should not have matched: " + L for L in right_list if re.search(regex, L)})


def verify(regex, left_list, right_list):
    assert not mistakes(regex, left_list, right_list)
    return True


def findregex(winners, losers, k=4):
    "Find a regex that matches all winners but no losers (sets of strings)."
    # Make a pool of regex parts, then pick from them to cover winners.
    # On each iteration, add the 'best' part to 'solution',
    # remove winners covered by best, and keep in 'pool' only parts
    # that still match some winner.
    pool = regex_parts(winners, losers)
    solution = []
    def score(part): return k * len(matches(part, winners)) - len(part)
    while winners:
        best = max(pool, key=score)
        solution.append(best)
        winners = winners - matches(best, winners)
        pool = {r for r in pool if matches(r, winners)}
    return OR(solution)


def matches(regex, strings):
    "Return a set of all the strings that are matched by regex."
    result = set()
    for s in strings:
        try:
            if re.search(regex, s):
                result.add(s)
        except:
            pass
    return result


OR = '|'.join # Join a sequence of strings with '|' between them


def regex_parts(winners, losers):
    "Return parts that match at least one winner, but no loser."
    wholes = {'^' + w + '$'  for w in winners}
    parts = {d
        for w in wholes
            for p in subparts(w)
                for d in dotify(p)}
    return wholes | {p for p in parts if not matches(p, losers)}


def subparts(word, N=4):
    "Return a set of subparts of word: consecutive characters up to length N (default 4)."
    return set(word[i:i+n+1] for i in range(len(word)) for n in range(N))


def dotify(part):
    "Return all ways to replace a subset of chars in part with '.'."
    choices = map(replacements, part)
    return {cat(chars) for chars in itertools.product(*choices)}


def replacements(c):
    return c if c in '^$' else c + '.'


cat = ''.join


def file_get_contents(instance_name, filename):
    filepath = os.path.join(os.path.dirname(__file__), '..', 'instances', instance_name, filename)

    with open(filepath) as f:
        content = f.read()

    lines = []
    for line in content.split('\n'):
        line = line.strip()
        if line != '':
            lines.append(line.replace("*", r"\*"))
    return set(lines)

def main():
    ## Importing the instance
    instance_name = sys.argv[1]
    left_list = file_get_contents(instance_name, 'left.txt')
    right_list = file_get_contents(instance_name, 'right.txt')

    solution = findregex(left_list, right_list)
    # verify(solution, left_list, right_list)

    anwser = (len(solution), solution)
    pprint(anwser)


if __name__ == '__main__':
    main()