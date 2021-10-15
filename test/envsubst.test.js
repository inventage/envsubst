const fs = require('fs');
const fse = require('fs-extra');
const rimraf = require('rimraf');
const path = require('path');
const dotenv = require('dotenv');
const test = require('ava');
const execa = require('execa');

const pkg = require('../package.json');

const REPO_DIR = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const TEMP_DIR = path.resolve(__dirname, '__tmp');
const CLI_FILE = `${REPO_DIR}/bin/envsubst.js`;

// Copy fixtures into a temporary directory
fse.mkdirsSync(TEMP_DIR);
fse.copySync(FIXTURES_DIR, TEMP_DIR);

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
  t.assert(stdout.includes(pkg.description));
  t.assert(stdout.includes('$ envsubst <glob>'));
});

test('shows a version', async t => {
  const { stdout } = await execa(CLI_FILE, ['--version']);
  t.is(stdout, pkg.version);
});

const fixturesDir = fs
  .readdirSync(TEMP_DIR)
  .map(file => path.resolve(TEMP_DIR, file))
  .filter(path => fs.lstatSync(path).isDirectory());

fixturesDir.forEach(fixtureDir => {
  const fixtureBasename = path.basename(fixtureDir);
  const given = path.resolve(fixtureDir, `${fixtureBasename}`);
  const envFile = path.resolve(fixtureDir, `${fixtureBasename}.env`);
  const expected = path.resolve(fixtureDir, `${fixtureBasename}_expected`);

  test(`all fixture files exists in fixture directory "${fixtureBasename}"`, t => {
    t.assert(fs.existsSync(given));
    t.assert(fs.existsSync(envFile));
    t.assert(fs.existsSync(expected));
  });

  test(`replaces variables in fixture "${fixtureBasename}"`, async t => {
    dotenv.config({ path: envFile });
    await execa(CLI_FILE, [given], {
      env: process.env,
    });

    t.is(fs.readFileSync(given, 'utf8'), fs.readFileSync(expected, 'utf8'));
  });
});
