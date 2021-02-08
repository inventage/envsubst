#!/usr/bin/env node
const meow = require('meow');
const globby = require('globby');
const replace = require('replace-in-file');
const Table = require('cli-table3');

const cli = meow(
  `
  Usage
    $ envsubst <glob>
    
  Options
    --dry-run, -d  Do not edit any files

  Examples
    $ envsubst 'dist/**/*.js'
`,
  {
    flags: {
      dryRun: {
        type: 'boolean',
        alias: 'd',
      },
    },
  }
);

(async () => {
  const files = await globby(cli.input);
  const replacements = [];

  await replace({
    files,
    from: /\${(\w+)(:-(\w+))?}/gm,
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

  console.info(`Made ${replacements.length} replacement${replacements.length > 1 ? 's' : ''}:`);
  replacements.forEach(replacement => {
    const { filename, name, value } = replacement;
    table.push([filename, name, value]);
  });
  console.info(table.toString());
})();
