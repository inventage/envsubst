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
