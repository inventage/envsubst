#!/usr/bin/env node
const meow = require('meow');
const fs = require('fs');
const globby = require('globby');
const Table = require('cli-table3');
const { replaceVars } = require('../src/utils');

const cli = meow(
  `
  Usage
    $ envsubst <glob>
    
  Options
    --dry-run, -d  Do not edit any files
    --prefix, -p   Only replace variable names with the given prefix
    --window, -w   Replace variables using the window syntax window["\${VAR}"]

  Examples
    $ envsubst 'dist/**/*.js'
    $ envsubst 'dist/**/*.js' -p FOO_
`,
  {
    flags: {
      dryRun: {
        type: 'boolean',
        alias: 'd',
        default: false,
      },
      prefix: {
        type: 'string',
        alias: 'p',
        default: '',
      },
      window: {
        type: 'boolean',
        alias: 'w',
        default: false,
      },
    },
  }
);

(async () => {
  /** @type string[] */
  const files = await globby(cli.input);
  const replacements = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const [replaced, replacementsMade] = await replaceVars(content, process.env, cli.flags.prefix, cli.flags.window);

    replacementsMade.forEach(r =>
      replacements.push({
        filename: file,
        name: r.from,
        value: r.to,
      })
    );

    if (!cli.flags.dryRun) {
      fs.writeFileSync(file, replaced, 'utf-8');
    }
  }

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
