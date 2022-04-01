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

test('simple replacements (case insensitive)', async t => {
  [replaced, replacements] = await replaceVars('${var}', { VAR: 'foo' }, '', false, true);
  t.is(replaced, 'foo');
  t.deepEqual(replacements, [{ from: '${var}', to: 'foo', count: 1 }]);

  [replaced, replacements] = await replaceVars('${VAR}', { var: 'foo' }, '', false, true);
  t.is(replaced, 'foo');
  t.deepEqual(replacements, [{ from: '${VAR}', to: 'foo', count: 1 }]);

  [replaced, replacements] = await replaceVars('${var}${VAR}', { VAR: 'foo' }, '', false, true);
  t.is(replaced, 'foofoo');
  t.deepEqual(replacements, [
    { from: '${var}', to: 'foo', count: 1 },
    { from: '${VAR}', to: 'foo', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars('${var}${VAR}', { var: 'foo' }, '', false, true);
  t.is(replaced, 'foofoo');
  t.deepEqual(replacements, [
    { from: '${var}', to: 'foo', count: 1 },
    { from: '${VAR}', to: 'foo', count: 1 },
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

test('prefix replacements (case insensitive)', async t => {
  [replaced, replacements] = await replaceVars(`\${VAR}\n\${foo_2:-bar}`, { VAR: 'foo', foO_2: 'baz' }, 'FOO_', false, true);
  t.is(replaced, `\${VAR}\nbaz`);
  t.deepEqual(replacements, [{ from: '${foo_2:-bar}', to: 'baz', count: 1 }]);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO_2:-bar}`, { VAR: 'foo', foO_2: 'baz' }, 'foo_', false, true);
  t.is(replaced, `\${VAR}\nbaz`);
  t.deepEqual(replacements, [{ from: '${FOO_2:-bar}', to: 'baz', count: 1 }]);

  [replaced, replacements] = await replaceVars(`\${VAR}\n\${foo_2:-bar}`, { VAR: 'foo', Foo_2: 'baz' }, 'FOO_', false, true);
  t.is(replaced, `\${VAR}\nbaz`);
  t.deepEqual(replacements, [{ from: '${foo_2:-bar}', to: 'baz', count: 1 }]);
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

test('complex replacements (case insensitive)', async t => {
  let [replaced, replacements] = await replaceVars(`\${VAR}\n\${foo:-bar}\n\${BAZ:-}`, { var: 'foo' }, '', false, true);
  t.is(replaced, `foo\nbar\n`);
  t.deepEqual(replacements, [
    { from: '${VAR}', to: 'foo', count: 1 },
    { from: '${foo:-bar}', to: 'bar', count: 1 },
    { from: '${BAZ:-}', to: '', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${vAr}\n\${foo:-bar}`, { VAR: 'foo', Foo: 'baz' }, '', false, true);
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${vAr}', to: 'foo', count: 1 },
    { from: '${foo:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${var}\n\${FOO:-bar}\${foo:-bar}\${FOO}\${foo}`, { VAR: 'foo', FOO: 'baz' }, '', false, true);
  t.is(replaced, `foo\nbazbazbazbaz`);
  t.deepEqual(replacements, [
    { from: '${var}', to: 'foo', count: 1 },
    { from: '${FOO:-bar}', to: 'baz', count: 1 },
    { from: '${foo:-bar}', to: 'baz', count: 1 },
    { from: '${FOO}', to: 'baz', count: 1 },
    { from: '${foo}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${VAR:-yes?}\n\${foo:-bar}`, { var: 'foo', FOO: 'baz' }, '', false, true);
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${VAR:-yes?}', to: 'foo', count: 1 },
    { from: '${foo:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${var:-yes? }\n\${foo:-bar}`, { VAR: 'foo', FOO: 'baz' }, '', false, true);
  t.is(replaced, `\${var:-yes? }\nbaz`);
  t.deepEqual(replacements, [{ from: '${foo:-bar}', to: 'baz', count: 1 }]);

  [replaced, replacements] = await replaceVars(`\${Var:-yes}\n\${fOO:-bar}`, { var: 'foo', foo: 'baz' }, '', false, true);
  t.is(replaced, `foo\nbaz`);
  t.deepEqual(replacements, [
    { from: '${Var:-yes}', to: 'foo', count: 1 },
    { from: '${fOO:-bar}', to: 'baz', count: 1 },
  ]);

  [replaced, replacements] = await replaceVars(`\${var:-yes}\n\${fOO:-bar}`, { FOO: 'baz' }, '', false, true);
  t.is(replaced, `yes\nbaz`);
  t.deepEqual(replacements, [
    { from: '${var:-yes}', to: 'yes', count: 1 },
    { from: '${fOO:-bar}', to: 'baz', count: 1 },
  ]);
});

test('replacements with window[] trimming', async t => {
  const testCases = [
    ['window["{VAR}"]', { VAR: 'foo' }, 'window["{VAR}"]', []],
    ['window["${VAR_FOO}"]', { VAR: 'foo' }, 'window["${VAR_FOO}"]', []],
    ['window["$VAR"]', { VAR: 'foo' }, 'window["$VAR"]', []],
    ['window["${VAR:-bla}"]', { VAR: 'foo' }, '"foo"', [{ from: 'window["${VAR:-bla}"]', to: '"foo"', count: 1 }]],
    ['window["${VAR:-bla}"]; window["${BAZ}"]', { VAR: 'foo' }, '"foo"; window["${BAZ}"]', [{ from: 'window["${VAR:-bla}"]', to: '"foo"', count: 1 }]],
    ['window["${VAR:-bla}"]', { FOO: 'bar' }, '"bla"', [{ from: 'window["${VAR:-bla}"]', to: '"bla"', count: 1 }]],
    ['window["${VAR:-}"]', { VAR: 'foo' }, '"foo"', [{ from: 'window["${VAR:-}"]', to: '"foo"', count: 1 }]],
    ['window["${VAR:-}"]', { FOO: 'bar' }, '""', [{ from: 'window["${VAR:-}"]', to: '""', count: 1 }]],
    ['window["${VAR:-bla?}"]', { VAR: 'foo' }, '"foo"', [{ from: 'window["${VAR:-bla?}"]', to: '"foo"', count: 1 }]],
    ['window["${VAR:-bla?}"]', { FOO: 'bar' }, '"bla?"', [{ from: 'window["${VAR:-bla?}"]', to: '"bla?"', count: 1 }]],
    ['window["${VAR:bla}"]', { VAR: 'foo' }, 'window["${VAR:bla}"]', []],

    // Some test cases with single quotes…
    // prettier-ignore
    ['window[\'{VAR}\']', { VAR: 'foo' }, 'window[\'{VAR}\']', []],
    // prettier-ignore
    ['window[\'${VAR_FOO}\']', { VAR: 'foo' }, 'window[\'${VAR_FOO}\']', []],
    // prettier-ignore
    ['window[\'$VAR\']', { VAR: 'foo' }, 'window[\'$VAR\']', []],
    // prettier-ignore
    ['window[\'${VAR:-bla}\']', { VAR: 'foo' }, '\'foo\'', [{ from: 'window[\'${VAR:-bla}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${VAR:-}\']', { VAR: 'foo' }, '\'foo\'', [{ from: 'window[\'${VAR:-}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${VAR:-bla?}\']', { VAR: 'foo' }, '\'foo\'', [{ from: 'window[\'${VAR:-bla?}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${VAR:bla}\']', { VAR: 'foo' }, 'window[\'${VAR:bla}\']', []],
  ];

  t.plan(testCases.length * 2);

  for (const [input, vars, output, replacementsShould] of testCases) {
    const [replaced, replacements] = await replaceVars(input, vars, '', true);
    t.is(replaced, output, `Failed replacing variables for ${input}`);
    t.deepEqual(replacements, replacementsShould);
  }
});

test.only('replacements with window[] trimming (case insensitive)', async t => {
  const testCases = [
    ['window["${var:-bla}"]', { VAR: 'foo' }, '"foo"', [{ from: 'window["${var:-bla}"]', to: '"foo"', count: 1 }]],
    ['window["${VAR:-bla}"]; window["${BAZ}"]', { var: 'foo' }, '"foo"; window["${BAZ}"]', [{ from: 'window["${VAR:-bla}"]', to: '"foo"', count: 1 }]],
    ['window["${var:-bla}"]', { FOO: 'bar' }, '"bla"', [{ from: 'window["${var:-bla}"]', to: '"bla"', count: 1 }]],
    ['window["${var:-}"]', { VAR: 'foo' }, '"foo"', [{ from: 'window["${var:-}"]', to: '"foo"', count: 1 }]],
    ['window["${var:-}"]', { FOO: 'bar' }, '""', [{ from: 'window["${var:-}"]', to: '""', count: 1 }]],
    ['window["${vAr:-bla?}"]', { VaR: 'foo' }, '"foo"', [{ from: 'window["${vAr:-bla?}"]', to: '"foo"', count: 1 }]],
    ['window["${var:-bla?}"]', { FOO: 'bar' }, '"bla?"', [{ from: 'window["${var:-bla?}"]', to: '"bla?"', count: 1 }]],
    ['window["${vaR:bla}"]', { Var: 'foo' }, 'window["${vaR:bla}"]', []],

    // Some test cases with single quotes…
    // prettier-ignore
    ['window[\'{var}\']', { VAR: 'foo' }, 'window[\'{var}\']', []],
    // prettier-ignore
    ['window[\'${var_FOO}\']', { VAR: 'foo' }, 'window[\'${var_FOO}\']', []],
    // prettier-ignore
    ['window[\'$var\']', { VAR: 'foo' }, 'window[\'$var\']', []],
    // prettier-ignore
    ['window[\'${vAr:-bla}\']', { VAR: 'foo' }, '\'foo\'', [{ from: 'window[\'${vAr:-bla}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${VAR:-}\']', { var: 'foo' }, '\'foo\'', [{ from: 'window[\'${VAR:-}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${var:-bla?}\']', { VAR: 'foo' }, '\'foo\'', [{ from: 'window[\'${var:-bla?}\']', to: '\'foo\'', count: 1 }]],
    // prettier-ignore
    ['window[\'${VAR:bla}\']', { var: 'foo' }, 'window[\'${VAR:bla}\']', []],
  ];

  t.plan(testCases.length * 2);

  for (const [input, vars, output, replacementsShould] of testCases) {
    const [replaced, replacements] = await replaceVars(input, vars, '', true, true);
    t.is(replaced, output, `Failed replacing variables for ${input}`);
    t.deepEqual(replacements, replacementsShould);
  }
});
