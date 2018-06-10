#!/usr/bin/env python3

##
# Manipulating: http://regex.inginf.units.it/golf/
##

from __future__ import division, print_function
from pprint import pprint
from splinter import Browser
from time import sleep
import sys
import os
import re



class Page:

    def __init__(self, browser):
        self.browser = browser

    @property
    def remove_all_btn(self):
        return self.browser.find_by_css('[ng-click="removeAll()"]')

    @property
    def add_row_at_bottom_btn(self):
        return self.browser.find_by_css('[ng-click="addRowAtBottom()"]')

    @property
    def evolve_btn(self):
        return self.browser.find_by_css('[ng-click="evolve()"]')

    def get_final_result(self):
        return self.browser.find_by_id('message').text

    def add_line(self, left_value, right_value):
        self.add_row_at_bottom_btn.click()
        self.browser.evaluate_script("document.querySelector('.ngViewport').scrollTop = 1000");

        cells = self.browser.find_by_css('.ngCellText')
        left_cell = cells[-2]
        right_cell = cells[-1]

        left_cell.double_click()
        self.browser.find_by_css('input[ng-input]').fill(left_value)

        right_cell.double_click()
        self.browser.find_by_css('input[ng-input]').fill(right_value)


    def has_finished(self):
        html = self.browser.find_by_css('.progress-bar')[0].outer_html
        print(re.search("(\d{1,3}\%)", html)[0], end="\r")
        return '100%' in html


def get_as_js(left, right):
    return """
    (function() {
        var left = %s;
        var right = %s;

        var scope = angular.element('.ngHeaderCell.ng-scope.col0.colt0 .ngVerticalBar').scope();

        scope.$apply(function() {
        var len = Math.max(left.length, right.length);
            for (var i = 0; i < len; i++) {
                if (!scope.myData[i]) scope.addRowAtBottom();
                scope.myData[i].positive = left[i] || '';
                scope.myData[i].negative = right[i] || '';
            }
        });
    })();
    """ % (list(left), list(right))

def file_get_contents(instance_name, filename):
    filepath = os.path.join(os.path.dirname(__file__), '..', 'instances', instance_name, filename)

    with open(filepath) as f:
        content = f.read()

    lines = []
    for line in content.split('\n'):
        line = line.strip()
        if line != '':
            lines.append(line)
    return set(lines)


def main():
    ## Importing the instance
    instance_name = sys.argv[1]
    left_list = file_get_contents(instance_name, 'left.txt')
    right_list = file_get_contents(instance_name, 'right.txt')

    with Browser('chrome') as browser:
        # Visit URL
        url = "http://regex.inginf.units.it/golf/"
        browser.visit(url)
        # browser.driver.maximize_window()

        page = Page(browser)
        page.remove_all_btn.click()

        length = max(len(left_list), len(right_list)) + 1

        for i in range(1, length):
            try:
                left_value = left_list.pop()
            except KeyError:
                left_value = ''

            try:
                right_value = right_list.pop()
            except KeyError:
                right_value = ''

            page.add_line(left_value, right_value)

        page.evolve_btn.click()

        while not page.has_finished():
            sleep(10)

        try:
            final_regex = page.get_final_result()
            pprint('Final regex ' + final_regex)
        except:
            pprint('Error request final result. Has finished: ' + str(final_regex))


if __name__ == '__main__':
    main()