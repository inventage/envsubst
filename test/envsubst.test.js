import fs from 'node:fs';
import { ensureDir, copy } from 'fs-extra/esm';
import { rimraf } from 'rimraf';
import dotenv from 'dotenv';
import test from 'ava';
import { execa } from 'execa';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const package_ = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));

const REPO_DIR = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const TEMP_DIR = path.resolve(__dirname, '__tmp');
const CLI_FILE = `${REPO_DIR}/bin/envsubst.js`;

// Copy fixtures into a temporary directory
await ensureDir(TEMP_DIR);
await copy(FIXTURES_DIR, TEMP_DIR);

// Cleanup by removing the temporary directory after we're done
test.after.always('cleanup', () => {
  rimraf.sync(TEMP_DIR);
});

test('writes a message when no parameters were given', async t => {
  const { stdout } = await execa(CLI_FILE);
  t.is(stdout, 'No variable replacements made.');
});

test('shows a help text', async t => {
  const { stdout } = await execa(CLI_FILE, ['--help']);
  t.assert(stdout.includes(package_.description));
  t.assert(stdout.includes('$ envsubst <glob>'));
});

test('shows a version', async t => {
  const { stdout } = await execa(CLI_FILE, ['--version']);
  t.is(stdout, package_.version);
});

const fixtureDirectories = fs
  .readdirSync(TEMP_DIR)
  .map(file => path.resolve(TEMP_DIR, file))
  .filter(path => fs.lstatSync(path).isDirectory());

for (const fixtureDirectory of fixtureDirectories) {
  const fixtureBasename = path.basename(fixtureDirectory);
  const useWindowSyntaxParameter = fixtureBasename.includes('_w');
  const useIgnoreCaseParameter = fixtureBasename.includes('_i');

  let fixtureBasenameWithoutSuffix = fixtureBasename;
  if (useWindowSyntaxParameter) {
    fixtureBasenameWithoutSuffix = fixtureBasename.replace('_w', '');
  }

  if (useIgnoreCaseParameter) {
    fixtureBasenameWithoutSuffix = fixtureBasename.replace('_i', '');
  }

  const given = path.resolve(fixtureDirectory, `${fixtureBasenameWithoutSuffix}`);
  const environmentFile = path.resolve(fixtureDirectory, `${fixtureBasenameWithoutSuffix}.env`);
  const expected = path.resolve(fixtureDirectory, `${fixtureBasenameWithoutSuffix}_expected`);

  test(`all fixture files exists in fixture directory "${fixtureBasename}"`, t => {
    t.assert(fs.existsSync(given));
    t.assert(fs.existsSync(environmentFile));
    t.assert(fs.existsSync(expected));
  });

  const parameters = [given];
  if (useWindowSyntaxParameter) {
    parameters.unshift('--window');
  }

  if (useIgnoreCaseParameter) {
    parameters.unshift('--ignore-case');
  }

  test(`replaces variables in fixture "${fixtureBasename}"`, async t => {
    await execa(CLI_FILE, parameters, {
      env: dotenv.parse(fs.readFileSync(environmentFile, 'utf8')),
    });

    t.is(fs.readFileSync(given, 'utf8'), fs.readFileSync(expected, 'utf8'));
  });
}
