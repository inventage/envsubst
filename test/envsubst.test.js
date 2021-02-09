const { spawn } = require('child_process');
const fse = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');

const REPO_DIR = path.resolve(__dirname, '..');
const MOCKS_DIR = path.resolve(__dirname, 'mocks');
const TEMP_DIR = path.resolve(__dirname, '__tmp');

const CLI_FILE = `${REPO_DIR}/bin/envsubst.js`;

beforeAll(() => {
  fse.mkdirsSync(TEMP_DIR);
  fse.copySync(MOCKS_DIR, TEMP_DIR);
});

beforeEach(() => {
  console.info = jest.fn();
});

// afterAll(async () => {
//   await fs.rmdir('./tmp');
// });

describe('envsubst CLI execution', () => {
  it('logs a message without parameters', done => {
    const child = spawn('node', [CLI_FILE]);
    child.stdout.on('data', data => {
      expect(`${data}`).toBe(`No variable replacements made.\n`);
      child.kill('SIGINT');
      done();
    });
  });

  it('shows a help text', done => {
    const child = spawn('node', [CLI_FILE, '--help']);

    child.stdout.on('data', data => {
      expect(`${data}`).toContain(pkg.description);
      expect(`${data}`).toContain('$ envsubst <glob>');
      child.kill('SIGINT');
      done();
    });
  });

  it('replaces variables', done => {
    const child = spawn('node', [CLI_FILE, `${TEMP_DIR}/**/*.js`]);

    child.stdout.on('data', data => {
      expect(`${data}`).toContain('Made 1 replacement');
      // expect(`${data}`).toContain('FOO');
      // expect(`${data}`).toContain('foo');
      child.kill('SIGINT');
      done();
    });
  });
});
