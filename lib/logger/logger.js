import isArrayLikeObject from 'lodash.isarraylikeobject';
import isNumber from 'lodash.isnumber';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import isUndefined from 'lodash.isundefined';
import { v4 as uuid } from 'uuid';

const sysLogLevels = {
  emerg: { value: 0, console: 'error' },
  alert: { value: 1, console: 'error' },
  crit: { value: 2, console: 'error' },
  error: { value: 3, console: 'error' },
  warning: { value: 4, console: 'warn' },
  notice: { value: 5, console: 'info' },
  info: { value: 6, console: 'info', default: true, defaultMax: true },
  debug: { value: 7, console: 'debug' },
};

// Return first level with default property set to true or with lowest value
// property if no default property found.
const getDefaultLevel = (levels) => {
  const defaultLevel = Object.keys(levels).find(
    (level) => !!levels[level].default
  );
  if (defaultLevel) return defaultLevel;

  const lowestValue = Math.min(
    ...Object.values(levels).map(({ value }) => value)
  );
  return Object.keys(levels).find(
    (level) => levels[level].value === lowestValue
  );
};

// Return first level with defaultMax property set to true or with highest value
// property if no defaultMax property found.
const getDefaultMaxLevel = (levels) => {
  const defaultMaxLevel = Object.keys(levels).find(
    (level) => !!levels[level].defaultMax
  );
  if (defaultMaxLevel) return defaultMaxLevel;

  const highestValue = Math.max(
    ...Object.values(levels).map(({ value }) => value)
  );
  return Object.keys(levels).find(
    (level) => levels[level].value === highestValue
  );
};

const getJsonFns = () => {
  const seen = new WeakSet();
  const undefinedToken = uuid();

  const replacer = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return 'CIRCULAR REFERENCE';
      }
      seen.add(value);

      if (!isArrayLikeObject(value))
        return Object.getOwnPropertyNames(value).reduce(
          (v, p) => ({ ...v, [p]: value[p] }),
          {}
        );
    }
    return isUndefined(value) ? undefinedToken : value;
  };

  const reviver = (key, value) =>
    value === undefinedToken ? undefined : value;

  return { replacer, reviver };
};

// Recursively truncate long string properties of object items.
const truncate = (maxStringLen, item) => {
  if (!isPlainObject(item) && !isArrayLikeObject(item)) return;

  const leftLength = Math.ceil(maxStringLen / 2 - 1);
  const rightLength = Math.floor(maxStringLen / 2 - 2);

  for (const key in item) {
    if (isString(item[key]) && item[key].length > maxStringLen) {
      item[key] = `${item[key].slice(0, leftLength)}...${item[key].slice(
        -rightLength
      )}`;
    } else truncate(maxStringLen, item[key]);
  }
};

export class Logger {
  #defaultLevel;
  #items = [];
  #maxLevel;
  #levels;

  constructor({ defaultLevel, levels = sysLogLevels, maxLevel } = {}) {
    // Set levels.
    if (!isPlainObject(levels)) throw new Error('invalid levels value');
    this.#levels = levels;

    // Calculate max level length.
    const maxLevelLength = Math.max(
      ...Object.keys(this.#levels).map((level) => level.length)
    );

    // Calculate label for each level.
    for (const level in this.#levels)
      this.#levels[level].label = `${level}:${' '.repeat(
        maxLevelLength - level.length + 1
      )}`;

    // Set defaultLevel.
    if (isUndefined(defaultLevel))
      this.#defaultLevel = getDefaultLevel(this.#levels);
    else if (!this.#levels[defaultLevel])
      throw new Error('invalid defaultLevel value');
    else this.#defaultLevel = defaultLevel;

    // Set maxLevel.
    if (isUndefined(maxLevel))
      this.#maxLevel = getDefaultMaxLevel(this.#levels);
    else if (!this.#levels[maxLevel]) throw new Error('invalid maxLevel value');
    else this.#maxLevel = maxLevel;

    // Add level methods.
    for (const level in this.#levels)
      this[level] = function (...items) {
        return this.logLevel(level, ...items);
      };

    if (!this.#levels.log)
      this.log = function (...items) {
        return this.logLevel(this.#defaultLevel, ...items);
      };
  }

  #ingest(items = []) {
    if (items.length) {
      const { replacer, reviver } = getJsonFns();
      this.#items = items.map((item) =>
        JSON.parse(JSON.stringify(item, replacer), reviver)
      );
    }
  }

  jsonify(...items) {
    this.#ingest(items);
    this.info();
    return (this.#items.length > 1 ? this.#items : this.#items[0]) ?? undefined;
  }

  logLevel(level, ...items) {
    this.#ingest(items);

    const thisLevel = this.#levels[level];
    if (!thisLevel) throw new Error('invalid level');

    const maxLevel = this.#levels[this.#maxLevel];
    if (thisLevel.value <= maxLevel.value)
      console[thisLevel.console ?? 'log'](this.render(level));

    return this;
  }

  render(level, ...items) {
    this.#ingest(items);

    const thisLevel = this.#levels[level];
    if (!thisLevel) throw new Error('invalid level');

    const maxLevel = this.#levels[this.#maxLevel];
    if (thisLevel.value <= maxLevel.value)
      return this.#items
        .reduce(
          (renderItems, item) => [
            ...renderItems,
            ...(isPlainObject(item) || isArrayLikeObject(item)
              ? JSON.stringify(item, undefined, 2)
              : String(item)
            ).split(/\r?\n/),
          ],
          []
        )
        .map((item) => `${thisLevel.label} ${item}`)
        .join('\n');
  }

  truncate(maxStringLen, ...items) {
    if (!isNumber(maxStringLen)) {
      throw new Error('invalid maxStringLength value');
    }

    this.#ingest(items);

    truncate(maxStringLen, this.#items);

    return this;
  }
}
