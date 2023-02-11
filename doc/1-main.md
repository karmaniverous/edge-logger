# edge-logger

The [Next.js Edge Runtime](https://nextjs.org/docs/api-reference/edge-runtime)
is extremely limited as to the packages it can load.

This can pose a challenge for common logging and utility packages like
[`winston`](https://www.npmjs.com/package/winston) and
[`lodash`](https://www.npmjs.com/package/lodash), which will fail when loaded
into an edge resource.

Logging is a cross-cutting concern, and shouldn't have to care where it is
executed. So this package is a simple, flexible logging utility that...

- formats logs attractively, whether output to the console or cloud services
  like AWS CloudWatch.
- features configurable logging levels (defaults to
  [SysLog](https://en.wikipedia.org/wiki/Syslog#Severity_level)).
- can handle virtually any input, including circular object references.
- can truncate long strings for readability.

To install:

```bash
npm install @karmaniverous/edge-logger
```

Basic usage:

```js
import Logger from `@karmaniverous/edge-logger`;
const logger = new Logger();

logger.info('message', { foo: 'bar' });
logger.error('Aw snap!');

// info:   message
// info:   {
// info:     "foo": "bar"
// info:   }
// error:  Aw snap!
```
