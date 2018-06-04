#!/usr/bin/env python3

##
# Manipulating: http://regex.inginf.units.it/golf/
##

from __future__ import division, print_function
from pprint import pprint
from splinter import Browser
import sys
import os



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
        return self.browser.find_by_css('[ng-click="evolve"]')

    def get_final_result(self):
        return self.browser.find_by_id('message').text

    def add_line(self, left_value, right_value):
        self.add_row_at_bottom_btn.click()

        cells = self.browser.find_by_css('.ngCellText')
        left_cell = cells[-2]
        right_cell = cells[-1]

        left_cell.double_click()
        self.browser.find_by_css('input[ng-input]').fill(left_value)

        right_cell.double_click()
        self.browser.find_by_css('input[ng-input]').fill(right_value)


    def has_finished(self):
        return '100%' in self.browser.find_by_css('.progress-bar')[0].outer_html



def get_as_js_var(self, name, instances):
    return "var %(name)s = [%(instances)s]".format({name: name, })
    """
    var scope = angular.element('.ngHeaderCell.ng-scope.col0.colt0 .ngVerticalBar').scope();

    scope.$apply(function() {
        var len = Math.max(left.length, right.length);
        for (var i = 0; i < len; i++) {
            if (!scope.myData[i]) scope.addRowAtBottom();
            scope.myData[i].positive = left[i] || '';
            scope.myData[i].negative = right[i] || '';
        }
    });
    """


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

    with Browser('firefox', fullscreen=True) as browser:
        # Visit URL
        url = "http://regex.inginf.units.it/golf/"
        browser.visit(url)

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

        max_tries = 20
        has_finised = page.has_finished()
        while not has_finised:
            sleep(10)

            max_tries -= 1
            if max_tries < 0:
                break
            else:
                has_finised = page.has_finished()

        try:
            final_regex = page.get_final_result()
            pprint('Final regex ' + final_regex)
        except:
            pprint('Error request final result. Has finished: ' + str(final_regex))






if __name__ == '__main__':
    main()