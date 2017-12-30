// Borrowed from https://github.com/airbnb/enzyme/blob/master/docs/guides/jsdom.md
// Needs to be called from the mocha test runner with --require

const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
    const props = Object.getOwnPropertyNames(src)
          .filter(prop => typeof target[prop] === 'undefined')
          .reduce((result, prop) => ({
              ...result,
              [prop]: Object.getOwnPropertyDescriptor(src, prop)
          }), {});
    Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
    userAgent: 'node.js'
};
// Polyfill for requestAnimationFrame. From https://github.com/facebook/jest/issues/4545
global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
};
copyProps(window, global);
