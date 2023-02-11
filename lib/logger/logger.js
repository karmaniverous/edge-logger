import isArrayLikeObject from 'lodash.isarraylikeobject';
import isNumber from 'lodash.isnumber';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import isUndefined from 'lodash.isundefined';

export class Logger {
  #envLevel;
  #items;
  #levels = {
    emerg: { value: 0, console: 'error' },
    alert: { value: 1, console: 'error' },
    crit: { value: 2, console: 'error' },
    error: { value: 3, console: 'error' },
    warning: { value: 4, console: 'warn' },
    notice: { value: 5, console: 'info' },
    info: { value: 6, console: 'info' },
    debug: { value: 7, console: 'debug' },
  };
  #maxStringLength = 50;

  constructor({ envLevel = process.env.LOG_LEVEL ?? 'info', levels } = {}) {
    // Set levels.
    if (!isUndefined(levels)) {
      if (!isPlainObject(levels)) throw new Error('invalid levels value');
      this.#levels = levels;
    }

    // Calculate max level length.
    const maxLevelLength = Math.max(
      ...Object.keys(this.#levels).map((level) => level.length)
    );

    // Calculate label for each level.
    for (const level in this.#levels)
      this.#levels[level].label = `${level}:${' '.repeat(
        maxLevelLength - level.length + 1
      )}`;

    // Set envLevel.
    if (!this.#levels[envLevel]) throw new Error('invalid envLevel value');
    this.#envLevel = envLevel;

    // Add level methods.
    for (const level in this.#levels)
      this[level] = function (...items) {
        return this.log(level, ...items);
      };
  }

  #ingest(items) {
    const getReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return 'CIRCULAR REFERENCE';
          }
          seen.add(value);
        }
        return value;
      };
    };

    if (items.length)
      this.#items = JSON.parse(JSON.stringify(items, getReplacer()));
  }

  log(level, ...items) {
    this.#ingest(items);

    const thisLevel = this.#levels[level];
    if (!thisLevel) throw new Error('invalid level');

    const envLevel = this.#levels[this.#envLevel];
    if (thisLevel.value <= envLevel.value)
      console[thisLevel.console ?? 'log'](this.render(level, ...items));

    return this;
  }

  render(level, ...items) {
    this.#ingest(items);

    const thisLevel = this.#levels[level];
    if (!thisLevel) throw new Error('invalid level');

    const envLevel = this.#levels[this.#envLevel];
    if (thisLevel.value <= envLevel.value)
      return this.#items
        .reduce(
          (renderItems, item) => [
            ...renderItems,
            ...(isPlainObject(item) || isArrayLikeObject(item)
              ? JSON.stringify(item, undefined, 2).split(/\r?\n/)
              : [item]),
          ],
          []
        )
        .map((item) => `${thisLevel.label} ${item}`)
        .join('\n');
  }

  // Recursively truncate long string properties of object items.
  #truncate(maxStringLen, item) {
    if (!isPlainObject(item) && !isArrayLikeObject(item)) return;

    const leftLength = Math.ceil(maxStringLen / 2 - 1);
    const rightLength = Math.floor(maxStringLen / 2 - 2);

    for (const key in item) {
      if (isString(item[key]) && item[key].length > maxStringLen) {
        item[key] = `${item[key].slice(0, leftLength)}...${item[key].slice(
          -rightLength
        )}`;
      } else this.#truncate(maxStringLen, item[key]);
    }
  }

  truncate(maxStringLen, ...items) {
    // Set maxStringLength.
    if (!isNumber(maxStringLen)) {
      throw new Error('invalid maxStringLength value');
    }

    this.#ingest(items);

    this.#truncate(maxStringLen, this.#items);

    return this;
  }
}
