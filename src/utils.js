const matchAll = require('string.prototype.matchall');
matchAll.shim();

/**
 * Regex pattern with an optional prefix.
 *
 * @see https://regex101.com/r/xt0dVf/1
 * @param prefix
 * @returns {string}
 */
const regexPattern = (prefix = '') => {
  return `\\\${(${prefix ? prefix : ''}\\w+)(:-([^\\s}]+))?}`;
};

/**
 * Replaces all variable placeholders in the given string with either variable values
 * found in the variables parameter OR with the given default in the variable string.
 *
 * @param {string} string
 * @param {object} variables
 * @param {string} prefix
 * @returns {Promise<string>}
 */
const replaceVars = (string, variables = {}, prefix = '') =>
  new Promise(resolve => {
    const regex = new RegExp(regexPattern(prefix), 'gm');
    const matches = [...string.matchAll(regex)];

    let replaced = string;
    const replacements = [];
    for (const match of matches) {
      const [original, name, , fallback] = match;
      const value = Object.hasOwnProperty.call(variables || {}, name) ? variables[name] : fallback;
      if (value) {
        const replacement = replacements.find(r => r.from === original && r.to === value);
        if (replacement) {
          replacement.count = replacement.count + 1;
        } else {
          replacements.push({ from: original, to: value, count: 1 });
        }

        replaced = replaced.split(original).join(value);
      }
    }

    resolve([replaced, replacements]);
  });

module.exports = {
  regexPattern,
  replaceVars,
};
