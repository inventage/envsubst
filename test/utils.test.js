const test = require('ava');
const { variableRegexPattern, replaceVars } = require('../src/utils');

test('pattern without placeholder', t => {
  t.is(variableRegexPattern(), '\\${(\\w+)(:-([^\\s}]*))?}');
});

test('pattern with placeholder', t => {
  t.is(variableRegexPattern('FOO_'), '\\${(FOO_\\w+)(:-([^\\s}]*))?}');
});

test('simple replacements ', async t => {
  let [replaced, replacements] = await replaceVars('${VAR}');
  t.is(replaced, '${VAR}');
  t.deepEqual(replacements, []);

  [replaced, replacements] = await replaceVars('${VAR}', { VAR: 'foo' });
  t.is(replaced, 'foo');
  t.deepEqual(replacements, [{ from: '${VAR}', to: 'foo', count: 1 }]);

  [replaced, replacements] = await replaceVars('${VAR}${VAR}', { VAR: 'foo' });
  t.is(replaced, 'foofoo');
  t.deepEqual(replacements, [{ from: '${VAR}', to: 'foo', count: 2 }]);

  [replaced, replacements] = await replaceVars('${VAR?}', { VAR: 'foo' });
  t.is(replaced, '${VAR?}');
  t.deepEqual(replacements, []);
});

test('prefix replacements', async t => {
  let [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo' }, 'FOO_');
  t.is(replaced, `\${VAR}\n\${FOO:-bar}`);
  t.deepEqual(replacements, []);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' }, 'FOO_');
  t.is(replaced, `\${VAR}\n\${FOO:-bar}`);
  t.deepEqual(replacements, []);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO_2:-bar}`, { VAR: 'foo', FOO_2: 'baz' }, 'FOO_');
  t.is(replaced, `\${VAR}\nbaz`);
  t.deepEqual(replacements, [{ from: '${FOO_2:-bar}', to: 'baz', count: 1 }]);
});

test('empty variable after prefix', async t => {
  const [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO_:-bar}`, { VAR: 'foo', FOO_: 'baz' }, 'FOO_');
  t.is(replaced, `\${VAR}\n\${FOO_:-bar}`);
  t.deepEqual(replacements, []);
});

test('complex prefix', async t => {
  let prefix = 'window.__FOO';
  let variable = `${prefix}_BLA`;
  let variableString = `\${${variable}:-bar}`;

  [replaced, replacements] = await replaceVars(variableString, { [variable]: 'baz' }, prefix);
  t.is(replaced, 'baz');
  t.deepEqual(replacements, [{ from: variableString, to: 'baz', count: 1 }]);

  prefix = 'window.__ENV_VARS__.ENABLE_FEATURE_X';
  variable = `${prefix}_BLA`;
  variableString = `\${${variable}:-bar}`;

  [replaced, replacements] = await replaceVars(variableString, { [variable]: 'baz' }, prefix);
  t.is(replaced, 'baz');
  t.deepEqual(replacements, [{ from: variableString, to: 'baz', count: 1 }]);
});

test('empty variable after complex prefix', async t => {
  const prefix = 'window.__ENV_VARS__.ENABLE_FEATURE_X';
  const variable = prefix;
  const variableString = `\${${variable}:-bar}`;

  [replaced, replacements] = await replaceVars(variableString, { [variable]: 'baz' }, prefix);
  t.is(replaced, variableString);
  t.deepEqual(replacements, []);
});

test('complex replacements', async t => {
  let [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}\n\${BAZ:-}`, { VAR: 'foo' });
  t.is(replaced, `foo\nbar\n`);
  t.deepEqual(replacements, [
    { from: '${VAR}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'bar', count: 1 },
    { from: '${BAZ:-}', to: '', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}\${FOO:-bar}\${FOO}`, { VAR: 'foo', FOO: 'baz' });
  t.is(replaced, `foo\nbazbazbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 2 },
    { from: '${FOO}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR:-yes?}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR:-yes?}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR:-yes? }\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
  t.is(replaced, `\${VAR:-yes? }\nbaz`);
  t.deepEqual(replacements, [{ from: '${FOO:-bar}', to: 'baz', count: 1 }]);

  [replaced, replacements] = await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR:-yes}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { FOO: 'baz' });
  t.is(replaced, `yes\nbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR:-yes}', to: 'yes', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 1 },
  ]);
});
