/* eslint-env mocha */

// test imports
import chai from 'chai';
const should = chai.should();

import { Logger } from './logger.js';
const logger = new Logger();

class TestClass {
  constructor() {
    this.a = 1;
    this.b = 2;
  }
}

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
  });

  it('should render plain test', function () {
    const message = `{
  "foo": "bar",
}`;

    logger.render('info', message).should.equal(`info:     {
info:       "foo": "bar",
info:     }`);
  });

  it('should render null', function () {
    const message = null;

    logger.render('info', message).should.equal(`info:     null`);
  });

  it('should render undefined', function () {
    const message = undefined;

    logger.render('info', message).should.equal(`info:     undefined`);
  });

  it('should render Error', function () {
    const result = logger.render('info', new Error('foo'));
    result.should.not.equal('');
  });

  it('should render TestClass', function () {
    const result = logger.render('info', new TestClass());
    result.should.equal(
      'info:     {\ninfo:       "a": 1,\ninfo:       "b": 2\ninfo:     }'
    );
  });

  it('should not render undefined property', function () {
    const message = { foo: undefined };

    logger.render('info', message).should.equal(`info:     {}`);
  });

  it('should jsonify error', function () {
    const result = logger.jsonify(new Error('foo'));
    result.message.should.equal('foo');
  });

  it('should print to console', function () {
    const logger = new Logger();

    logger.emerg('emergency message', { foo: 'bar' }); // rendered with console.error()
    logger.alert('alert message'); // rendered with console.error()
    logger.crit('critical message'); // rendered with console.error()
    logger.error('error message'); // rendered with console.error()
    logger.warning('warning message'); // rendered with console.warn()
    logger.notice('notice message'); // rendered with console.info()
    logger.info('info message'); // rendered with console.info()
    logger.debug('debug message'); // rendered with console.debug()
    logger.log('log message'); // rendered with console.info()

    true.should.equal(true); // set breakpoint here to inspect console output
  });
});
