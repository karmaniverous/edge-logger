import isArrayLikeObject from 'lodash.isarraylikeobject';
import isNumber from 'lodash.isnumber';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import isUndefined from 'lodash.isundefined';

const sysLogLevels = {
  emerg: { value: 0, console: 'error' },
  alert: { value: 1, console: 'error' },
  crit: { value: 2, console: 'error' },
  error: { value: 3, console: 'error' },
  warning: { value: 4, console: 'warn' },
  notice: { value: 5, console: 'info' },
  info: { value: 6, console: 'info', defaultMax: true },
  debug: { value: 7, console: 'debug' },
};

// Return first level with default property set to true or with highest value
// property if no default property found.
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

const getCircularReplacer = () => {
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
  #items = [];
  #maxLevel;
  #levels;

  constructor({ levels = sysLogLevels, maxLevel } = {}) {
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

    // Set maxLevel.
    if (isUndefined(maxLevel))
      this.#maxLevel = getDefaultMaxLevel(this.#levels);
    else if (!this.#levels[maxLevel]) throw new Error('invalid maxLevel value');
    else this.#maxLevel = maxLevel;

    // Add level methods.
    for (const level in this.#levels)
      this[level] = function (...items) {
        return this.log(level, ...items);
      };
  }

  #ingest(items = []) {
    if (items.length)
      this.#items = JSON.parse(JSON.stringify(items, getCircularReplacer()));
  }

  log(level, ...items) {
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
              : item
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
