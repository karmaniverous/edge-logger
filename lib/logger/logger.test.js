/* eslint-env mocha */

// test imports
import chai from 'chai';
const should = chai.should();

import { Logger } from './logger.js';
const logger = new Logger();

const items = [
  'message',
  {
    a: 1,
    b: 2,
    c: {
      a: 1,
      b: 2,
      c: [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
        { a: 1, b: 2 },
        { a: 1, b: 2 },
      ],
    },
  },
];

const renderedItems = `zzzzzzzz  message
zzzzzzzz  {
zzzzzzzz    "a": 1,
zzzzzzzz    "b": 2,
zzzzzzzz    "c": {
zzzzzzzz      "a": 1,
zzzzzzzz      "b": 2,
zzzzzzzz      "c": [
zzzzzzzz        {
zzzzzzzz          "a": 1,
zzzzzzzz          "b": 2
zzzzzzzz        },
zzzzzzzz        {
zzzzzzzz          "a": 1,
zzzzzzzz          "b": 2
zzzzzzzz        },
zzzzzzzz        {
zzzzzzzz          "a": 1,
zzzzzzzz          "b": 2
zzzzzzzz        },
zzzzzzzz        {
zzzzzzzz          "a": 1,
zzzzzzzz          "b": 2
zzzzzzzz        }
zzzzzzzz      ]
zzzzzzzz    }
zzzzzzzz  }`;

describe('logger', function () {
  it('should render emerg', function () {
    logger
      .render('emerg', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'emerg:  '));
  });

  it('should render alert', function () {
    logger
      .render('alert', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'alert:  '));
  });

  it('should render crit', function () {
    logger
      .render('crit', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'crit:   '));
  });

  it('should render error', function () {
    logger
      .render('error', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'error:  '));
  });

  it('should render warning', function () {
    logger
      .render('warning', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'warning:'));
  });

  it('should render notice', function () {
    logger
      .render('notice', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'notice: '));
  });

  it('should render info', function () {
    logger
      .render('info', ...items)
      .should.equal(renderedItems.replace(/zzzzzzzz/g, 'info:   '));
  });

  it('should not render debug', function () {
    should.not.exist(logger.render('debug', ...items));
  });

  it('should truncate', function () {
    logger
      .truncate(10, 'abcdefghijklmnopqrstuvwxyz', {
        value: 'abcdefghijklmnopqrstuvwxyz',
      })
      .render('info').should.equal(`info:     abcd...xyz
info:     {
info:       "value": "abcd...xyz"
info:     }`);
  });

  it('should label circular reference', function () {
    const a = { a: 1 };
    a.b = a;

    logger.render('info', a).should.equal(`info:     {
info:       "a": 1,
info:       "b": "CIRCULAR REFERENCE"
info:     }`);

    true.should.be.ok;
  });
});
