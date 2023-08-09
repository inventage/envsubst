#!/usr/bin/env node
import * as fs from 'node:fs';
import meow from 'meow';
import { globby } from 'globby';
import Table from 'cli-table3';

import { replaceVariables } from '../src/utils.js';

const cli = meow(
  `
  Usage
    $ envsubst <glob>
    
  Options
    --dry-run, -d       Do not edit any files
    --prefix, -p        Only replace variable names with the given prefix
    --ignore-case, -i   Ignore case when replacing variables
    --window, -w        Replace variables using the window syntax window["\${VAR}"]

  Examples
    $ envsubst 'dist/**/*.js'
    $ envsubst 'dist/**/*.js' -p FOO_
`,
  {
    importMeta: import.meta,
    flags: {
      dryRun: {
        type: 'boolean',
        shortFlag: 'd',
        default: false,
      },
      prefix: {
        type: 'string',
        shortFlag: 'p',
        default: '',
      },
      window: {
        type: 'boolean',
        shortFlag: 'w',
        default: false,
      },
      ignoreCase: {
        type: 'boolean',
        shortFlag: 'i',
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
    const content = fs.readFileSync(file, 'utf8');
    const [replaced, replacementsMade] = await replaceVariables(content, process.env, cli.flags.prefix, cli.flags.window, cli.flags.ignoreCase);

    for (const r of replacementsMade)
      replacements.push({
        filename: file,
        name: r.from,
        value: r.to,
      });

    if (!cli.flags.dryRun) {
      fs.writeFileSync(file, replaced, 'utf8');
    }
  }

  if (replacements.length === 0) {
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
  for (const replacement of replacements) {
    const { filename, name, value } = replacement;
    table.push([filename, name, value]);
  }
  console.info(table.toString());
})();
