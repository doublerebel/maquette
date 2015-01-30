﻿var Q = require('q');
var expect = require("chai").expect;
var wd = require("wd");

// double click is not 'natively' supported, so we need to send the
// event direct to the element see:
// http://stackoverflow.com/questions/3982442/selenium-2-webdriver-how-to-double-click-a-table-row-which-opens-a-new-window
var doubleClickScript = 'var evt = document.createEvent("MouseEvents");' +
  'evt.initMouseEvent("dblclick",true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0,null);' +
  'document.querySelectorAll("#todo-list li label")[arguments[0]].dispatchEvent(evt);';

module.exports = function (browser, chain) {

  chain = chain
    .waitForElementByCss('#new-todo');

  var getItemInputField = function () {
    return chain.waitForElementByCss('#new-todo');
  };

  var getItemTexts = function () {
    return browser
      .elementsByCss("#todo-list li label")
      .then(function (labels) {
        return Q.all(labels.map(function (label) {
          return label.text();
        }));
    });
  };

  var waitForAnimationFrame = function () {
    chain = chain.executeAsync("window.requestAnimationFrame(arguments[arguments.length - 1]);");
    return page;
  };

  var page = {
    waitForAnimationFrame: waitForAnimationFrame,
    assertFocussedElementId: function (expectedId) {
      return browser.waitForConditionInBrowser("document.activeElement.id === '"+expectedId+"'");
    },
    enterItem: function (itemText) {
      chain = getItemInputField()
        .sendKeys(itemText)
        .sendKeys('\uE007'); // enter
      return page;
    },
    assertItems: function (itemTexts) {
      waitForAnimationFrame();
      chain = chain
        .then(function () {
          return getItemTexts().then(function (foundTexts) {
            expect(foundTexts.length).to.equal(itemTexts.length);
            for (var i = 0; i < itemTexts.length; i++) {
              expect(foundTexts[i]).to.equal(itemTexts[i]);
            }
          });
        });
      return page;
    },
    assertMainSectionIsHidden: function () {
      chain = chain
        .elementsByCss("#main")
        .then(function (elements) { expect(elements.length).to.equal(0); });
      return page;
    },
    assertFooterIsHidden: function () {
      chain = chain
        .elementsByCss("#footer")
        .then(function (elements) { expect(elements.length).to.equal(0); });
      return page;
    },
    assertMainSectionIsVisible: function () {
      chain = chain
        .elementsByCss("#main")
        .then(function (elements) { expect(elements.length).to.equal(1); });
      return page;
    },
    assertFooterIsVisible: function () {
      chain = chain
        .elementsByCss("#footer")
        .then(function (elements) { expect(elements.length).to.equal(1); });
      return page;
    },
    assertItemInputFieldText: function (text) {
      chain = getItemInputField()
        .getAttribute("value").should.become(text);
      return page;
    },

    clickMarkAllCompletedCheckBox: function () {
      chain = chain.elementByCss("#toggle-all").click();
      return page;
    },

    assertItemsToBeCompleted: function (completeds) {
      chain = chain.elementsByCss("#todo-list li").then(function (items) {
        return Q.all(items.map(function (item) {
          return item.getAttribute("class");
        })).then(function (classes) {
          expect(classes.length).to.equal(completeds.length);
          return classes.map(function (cssClass, index) {
            var completed = !!cssClass && (cssClass.indexOf("completed") !== -1);
            expect(completed).to.equal(completeds[index]);
          });
        });
      });
      return page;
    },

    assertCompleteAllIsChecked: function () {
      chain = chain.elementByCss("#toggle-all").isSelected().should.become(true);
      return page;
    },

    assertCompleteAllIsClear: function () {
      chain = chain.elementByCss("#toggle-all").isSelected().should.become(false);
      return page;
    },

    toggleItemAtIndex: function (index) {
      chain = chain.elementsByCss("#todo-list input.toggle").then(function (items) {
        expect(items.length).to.be.above(index);
        return items[index].click();
      });
      return page;
    },

    doubleClickItemAtIndex: function (index) {
      chain = chain.elementsByCss("#todo-list li label").then(function (labels) {
        expect(labels.length).to.be.above(index);
        return browser.execute(doubleClickScript, [index]);
      });
      return page;
    },

    editItem: function (text) {
      chain = chain.elementByCss("#todo-list input.edit")
        .sendKeys(text);
      return page;
    },

    assertItemToggleIsHidden: function (index) {
      chain.elementsByCss("#todo-list li")
        .then(function (items) {
          return items[index].elementsByCss("input.toggle").then(function (candidates) {
            expect(candidates.length).to.be.empty();
          });
        });
      return page;
    },

    assertItemLabelIsHidden: function (index) {
      chain.elementsByCss("#todo-list li")
        .then(function (items) {
          return items[index].elementsByCss("label").then(function (candidates) {
            expect(candidates.length).to.be.empty();
          });
        });
      return page;
    },

    then: function (onFulfilled, onRejected) {
      chain = chain.then(onFulfilled, onRejected);
      return page;
    }
  };

  return page;
};