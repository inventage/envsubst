#!/usr/bin/env node
const meow = require('meow');
const globby = require('globby');
const replace = require('replace-in-file');
const Table = require('cli-table3');
const { regexPattern } = require('../src/utils');

const cli = meow(
  `
  Usage
    $ envsubst <glob>
    
  Options
    --dry-run, -d  Do not edit any files
    --prefix, -p   Only replace variable names with the given prefix

  Examples
    $ envsubst 'dist/**/*.js'
    $ envsubst 'dist/**/*.js' -p FOO_
`,
  {
    flags: {
      dryRun: {
        type: 'boolean',
        alias: 'd',
      },
      prefix: {
        type: 'string',
        alias: 'p',
      },
    },
  }
);

(async () => {
  const files = await globby(cli.input);
  const pattern = regexPattern(cli.flags.prefix);
  const regex = new RegExp(pattern, 'gm');
  const replacements = [];

  await replace({
    files,
    from: regex,
    dry: !!cli.flags.dryRun,
    to: (...args) => {
      const [string, name, , fallback] = args;
      const { length, [length - 1]: filename } = args;

      // Check if the found variable name is available in process.env
      const value = process.env[name] || fallback;
      if (!value) {
        return string;
      }

      replacements.push({
        filename,
        name,
        value,
      });

      return value;
    },
  });

  if (replacements.length < 1) {
    console.info('No variable replacements made.');
    return;
  }

  const table = new Table({
    head: ['File', 'Variable', 'Value'],
    style: {
      // No colors
      head: [],
      border: [],
    },
  });

  console.info(`Made ${replacements.length} replacement${replacements.length > 1 ? 's' : ''}:\n`);
  replacements.forEach(replacement => {
    const { filename, name, value } = replacement;
    table.push([filename, name, value]);
  });
  console.info(table.toString());
})();
