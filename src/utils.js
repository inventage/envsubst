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
  return `\\\${(${prefix ? prefix : ''}\\w+)(:-(\\w+))?}`;
};

/**
 * Replaces all variable placeholders in the given string with either variable values
 * found in the variables parameter OR with the given default in the variable string.
 *
 * @param string
 * @param variables
 * @param prefix
 * @returns {Promise<string>}
 */
const replaceVars = (string, variables = {}, prefix = '') =>
  new Promise(resolve => {
    const regex = new RegExp(regexPattern(prefix), 'gm');
    const matches = [...string.matchAll(regex)];

    let replaced = string;
    for (const match of matches) {
      const [original, name, , fallback] = match;

      // Variable key exists, use that value
      if (Object.hasOwnProperty.call(variables || {}, name)) {
        replaced = replaced.split(original).join(variables[name]);
      }
      // Variable key does not exist, use fallback
      else if (!variables[name] && fallback) {
        replaced = replaced.split(original).join(fallback);
      }
    }

    resolve(replaced);
  });

module.exports = {
  regexPattern,
  replaceVars,
};
