const matchAll = require('string.prototype.matchall');
matchAll.shim();

const escapeStringRegexp = require('escape-string-regexp');

/**
 * Regex pattern with an optional prefix.
 *
 * @see https://regex101.com/r/M3dVAW/1
 * @param prefix
 * @returns {string}
 */
const variableRegexPattern = (prefix = '') => {
  return `\\\${(${prefix ? escapeStringRegexp(prefix) : ''}\\w+)(:-([^\\s}]*))?}`;
};

/**
 * Regex pattern that wraps the variable regex pattern with a window variable statement:
 *
 *     window['${VAR}'] or window["${VAR}"]
 *
 * @see https://regex101.com/r/ND057d/1
 * @param prefix
 * @returns {string}
 */
const windowVariableRegexPattern = (prefix = '') => {
  return `(window\\[['"]{1})?${variableRegexPattern(prefix)}(['"]{1}\\])?`;
};

/**
 * Replaces all variable placeholders in the given string with either variable values
 * found in the variables parameter OR with the given default in the variable string.
 *
 * @param {string} string
 * @param {object} variables
 * @param {string} prefix
 * @param {boolean} trimWindow
 * @returns {Promise<unknown[]>}
 */
const replaceVars = (string, variables = {}, prefix = '', trimWindow = false) =>
  new Promise(resolve => {
    resolve(replaceVarsSync(string, variables, prefix, trimWindow));
  });

/**
 * Replaces all variable placeholders in the given string with either variable values
 * found in the variables parameter OR with the given default in the variable string.
 *
 * @param {string} string
 * @param {object} variables
 * @param {string} prefix
 * @param {boolean} trimWindow
 * @returns {unknown[]}
 */
const replaceVarsSync = (string, variables = {}, prefix = '', trimWindow = false) => {
  const regex = new RegExp(trimWindow ? windowVariableRegexPattern(prefix) : variableRegexPattern(prefix), 'gm');
  const matches = [...string.matchAll(regex)];

  let replaced = string;
  const replacements = [];
  for (const match of matches) {
    if (trimWindow) {
      const [original, windowStart, name, , fallback, windowEnd] = match;
      const valueStartQuote = windowStart.replace('window[', '');
      const valueEndQuote = windowEnd.replace(']', '');
      const withoutWindow = original.replace(windowStart, '').replace(windowEnd, '');

      const value = Object.hasOwnProperty.call(variables || {}, name) ? variables[name] : fallback;
      if (value !== undefined) {
        const quotedValue = `${valueStartQuote}${value}${valueEndQuote}`;
        const replacement = replacements.find(r => r.from === original && r.to === quotedValue);
        if (replacement) {
          replacement.count = replacement.count + 1;
        } else {
          replacements.push({ from: original, to: quotedValue, count: 1 });
        }

        replaced = replaced.split(original).join(withoutWindow.split(withoutWindow).join(quotedValue));
      }
    } else {
      const [original, name, , fallback] = match;

      const value = Object.hasOwnProperty.call(variables || {}, name) ? variables[name] : fallback;
      if (value !== undefined) {
        const replacement = replacements.find(r => r.from === original && r.to === value);
        if (replacement) {
          replacement.count = replacement.count + 1;
        } else {
          replacements.push({ from: original, to: value, count: 1 });
        }

        replaced = replaced.split(original).join(value);
      }
    }
  }

  return [replaced, replacements];
};

module.exports = {
  variableRegexPattern,
  replaceVars,
  replaceVarsSync,
};
