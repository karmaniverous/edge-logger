# edge-logger

The [Next.js Edge Runtime](https://nextjs.org/docs/api-reference/edge-runtime) is extremely limited as to the packages it can load.

This can pose a challenge for common logging and utility packages like [`winston`](https://www.npmjs.com/package/winston) and [`lodash`](https://www.npmjs.com/package/lodash), which will fail when loaded into an edge resource.

Logging is a cross-cutting concern, and shouldn't have to care where it is executed. So this package is a simple, flexible logging utility that...

- formats logs attractively, whether output to the console or cloud services like AWS CloudWatch.
- features configurable logging levels (defaults to [SysLog](https://en.wikipedia.org/wiki/Syslog#Severity_level)).
- can handle virtually any input, including circular object references.
- can truncate long strings for readability.

## Installation

```bash
npm install @karmaniverous/edge-logger
```

## Usage

```js
import Logger from `@karmaniverous/edge-logger`;
const logger = new Logger();

logger.emerg('emergency message', { foo: 'bar' }); // rendered with console.error()
logger.alert('alert message');                     // rendered with console.error()
logger.crit('critical message');                   // rendered with console.error()
logger.error('error message');                     // rendered with console.error()
logger.warning('warning message');                 // rendered with console.warn()
logger.notice('notice message');                   // rendered with console.info()
logger.info('info message');                       // rendered with console.info()
logger.debug('debug message');                     // rendered with console.debug()
logger.log('log message');                     // rendered with console.info()

// emerg:   emergency message
// emerg:   {
// emerg:     "foo": "bar"
// emerg:   }
// alert:   alert message
// crit:    critical message
// error:   error message
// warning: warning message
// notice:  notice message
// info:    info message
// info:    log message

// debug level not rendered by default.
// Set LOG_LEVEL to 'debug' to see these.
```

## Configuration

Set your minimum logging level with environment variable `LOG_LEVEL` (by default it is `info`).

The optional constructor `config` argument has the following keys:

| Key            | Description                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `defaultLevel` | Default logging level (invoked by the `log` method). Default value set in `levels` object (`info` for default `levels`). |
| `maxLevel`     | Maximum logging level. Default value set in `levels` object (`info` for default `levels`).                               |
| `levels`       | An alternate levels definition. See below for details.                                                                   |

### Levels Config

Here is the default levels object:

```js
{
  emerg: { value: 0, console: 'error' },
  alert: { value: 1, console: 'error' },
  crit: { value: 2, console: 'error' },
  error: { value: 3, console: 'error' },
  warning: { value: 4, console: 'warn' },
  notice: { value: 5, console: 'info' },
  info: { value: 6, console: 'info', default: true, defaultMax: true },
  debug: { value: 7, console: 'debug' },
}
```

Each key will be rendered as a function on the `Logger` instance that takes a list of items, just like `console.log()`.

The keys on each log level:

| Key          | Description                                           |
| ------------ | ----------------------------------------------------- |
| `value`      | Supports setting the logging threshold.               |
| `console`    | The console function invoked by the log level.        |
| `default`    | `true` if the `log` method should trigger this level. |
| `defaultMax` | `true` if default max level.                          |

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
