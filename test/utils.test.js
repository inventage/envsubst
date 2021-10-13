const { variableRegexPattern, replaceVars } = require('../src/utils');

describe('dynamic regex pattern', () => {
  it('pattern without placeholder', () => {
    expect(variableRegexPattern()).toEqual('\\${(\\w+)(:-([^\\s}]*))?}');
  });

  it('pattern with placeholder', () => {
    expect(variableRegexPattern('FOO_')).toEqual('\\${(FOO_\\w+)(:-([^\\s}]*))?}');
  });
});

describe('variable replacement', () => {
  it('simple replacements ', async () => {
    let [replaced, replacements] = await replaceVars('${VAR}');
    expect(replaced).toEqual('${VAR}');
    expect(replacements).toEqual([]);

    [replaced, replacements] = await replaceVars('${VAR}', { VAR: 'foo' });
    expect(replaced).toEqual('foo');
    expect(replacements).toEqual([{ from: '${VAR}', to: 'foo', count: 1 }]);

    [replaced, replacements] = await replaceVars('${VAR}${VAR}', { VAR: 'foo' });
    expect(replaced).toEqual('foofoo');
    expect(replacements).toEqual([{ from: '${VAR}', to: 'foo', count: 2 }]);

    [replaced, replacements] = await replaceVars('${VAR?}', { VAR: 'foo' });
    expect(replaced).toEqual('${VAR?}');
    expect(replacements).toEqual([]);
  });

  it('complex replacements', async () => {
    let [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}\n\${BAZ:-}`, { VAR: 'foo' });
    expect(replaced).toEqual(`foo\nbar\n`);
    expect(replacements).toEqual([
      { from: '${VAR}', to: 'foo', count: 1 },
      { from: '${FOO:-bar}', to: 'bar', count: 1 },
      { from: '${BAZ:-}', to: '', count: 1 },
    ]);

    [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
    expect(replaced).toEqual(`foo\nbaz`);
    expect(replacements).toEqual([
      { from: '${VAR}', to: 'foo', count: 1 },
      { from: '${FOO:-bar}', to: 'baz', count: 1 },
    ]);

    [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}\${FOO:-bar}\${FOO}`, { VAR: 'foo', FOO: 'baz' });
    expect(replaced).toEqual(`foo\nbazbazbaz`);
    expect(replacements).toEqual([
      { from: '${VAR}', to: 'foo', count: 1 },
      { from: '${FOO:-bar}', to: 'baz', count: 2 },
      { from: '${FOO}', to: 'baz', count: 1 },
    ]);

    [replaced, replacements] = await replaceVars(`\${VAR:-yes?}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
    expect(replaced).toEqual(`foo\nbaz`);
    expect(replacements).toEqual([
      { from: '${VAR:-yes?}', to: 'foo', count: 1 },
      { from: '${FOO:-bar}', to: 'baz', count: 1 },
    ]);

    [replaced, replacements] = await replaceVars(`\${VAR:-yes? }\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
    expect(replaced).toEqual(`\${VAR:-yes? }\nbaz`);
    expect(replacements).toEqual([{ from: '${FOO:-bar}', to: 'baz', count: 1 }]);

    [replaced, replacements] = await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' });
    expect(replaced).toEqual(`foo\nbaz`);
    expect(replacements).toEqual([
      { from: '${VAR:-yes}', to: 'foo', count: 1 },
      { from: '${FOO:-bar}', to: 'baz', count: 1 },
    ]);

    [replaced, replacements] = await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { FOO: 'baz' });
    expect(replaced).toEqual(`yes\nbaz`);
    expect(replacements).toEqual([
      { from: '${VAR:-yes}', to: 'yes', count: 1 },
      { from: '${FOO:-bar}', to: 'baz', count: 1 },
    ]);
  });

  it('prefix replacements', async () => {
    let [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo' }, 'FOO_');
    expect(replaced).toEqual(`\${VAR}\n\${FOO:-bar}`);
    expect(replacements).toEqual([]);

    [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' }, 'FOO_');
    expect(replaced).toEqual(`\${VAR}\n\${FOO:-bar}`);
    expect(replacements).toEqual([]);

    [replaced, replacements] = await replaceVars(`\${VAR}\n\${FOO_2:-bar}`, { VAR: 'foo', FOO_2: 'baz' }, 'FOO_');
    expect(replaced).toEqual(`\${VAR}\nbaz`);
    expect(replacements).toEqual([{ from: '${FOO_2:-bar}', to: 'baz', count: 1 }]);
  });
});
