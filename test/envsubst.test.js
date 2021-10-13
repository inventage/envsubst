const { spawn } = require('child_process');
const fs = require('fs');
const fse = require('fs-extra');
const rimraf = require('rimraf');
const path = require('path');
const pkg = require('../package.json');
const dotenv = require('dotenv');

const REPO_DIR = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const TEMP_DIR = path.resolve(__dirname, '__tmp');
const CLI_FILE = `${REPO_DIR}/bin/envsubst.js`;

// Copy fixtures into a temporary directory
fse.mkdirsSync(TEMP_DIR);
fse.copySync(FIXTURES_DIR, TEMP_DIR);

// Cleanup by removing the temporary directory after we're done
afterAll(() => {
  rimraf.sync(TEMP_DIR);
});

describe('envsubst CLI execution', () => {
  it('writes a message when no parameters were given', done => {
    const child = spawn('node', [CLI_FILE]);
    child.stdout.on('data', data => {
      expect(`${data}`).toBe(`No variable replacements made.\n`);
    });

    child.on('close', code => {
      expect(code).toEqual(0);
      done();
    });
  });

  it('shows a help text', done => {
    const child = spawn('node', [CLI_FILE, '--help']);

    child.stdout.on('data', data => {
      expect(`${data}`).toContain(pkg.description);
      expect(`${data}`).toContain('$ envsubst <glob>');
    });

    child.on('close', code => {
      expect(code).toEqual(0);
      done();
    });
  });

  it('shows a version', done => {
    const child = spawn('node', [CLI_FILE, '--version']);

    child.stdout.on('data', data => {
      expect(`${data}`).toEqual(pkg.version);
    });

    child.on('close', code => {
      expect(code).toEqual(0);
      done();
    });
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

    it(`all fixture files exists in fixture directory "${fixtureBasename}"`, () => {
      expect(fs.existsSync(given)).toEqual(true);
      expect(fs.existsSync(envFile)).toEqual(true);
      expect(fs.existsSync(expected)).toEqual(true);
    });

    it.only(`replaces variables in fixture "${fixtureBasename}"`, done => {
      dotenv.config({ path: envFile });
      const child = spawn('node', [CLI_FILE, given], {
        env: process.env,
      });

      child.on('close', code => {
        expect(code).toEqual(0);
        expect(fs.readFileSync(given, 'utf8')).toEqual(fs.readFileSync(expected, 'utf8'));
        done();
      });
    });
  });
});
