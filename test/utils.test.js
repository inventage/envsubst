const { regexPattern, replaceVars } = require('../src/utils');

describe('dynamic regex pattern', () => {
  it('pattern without placeholder', () => {
    expect(regexPattern()).toEqual('\\${(\\w+)(:-(\\w+))?}');
  });

  it('pattern with placeholder', () => {
    expect(regexPattern('FOO_')).toEqual('\\${(FOO_\\w+)(:-(\\w+))?}');
  });
});

describe('variable replacement', () => {
  it('simple replacements ', async () => {
    expect(await replaceVars('${VAR}')).toEqual('${VAR}');
    expect(await replaceVars('${VAR}', { VAR: 'foo' })).toEqual('foo');
    expect(await replaceVars('${VAR?}', { VAR: 'foo' })).toEqual('${VAR?}');
  });

  it('complex replacements', async () => {
    expect(await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo' })).toEqual(`foo\nbar`);
    expect(await replaceVars(`\${VAR}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' })).toEqual(`foo\nbaz`);
    expect(await replaceVars(`\${VAR:-yes?}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' })).toEqual(`\${VAR:-yes?}\nbaz`);
    expect(await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { VAR: 'foo', FOO: 'baz' })).toEqual(`foo\nbaz`);
    expect(await replaceVars(`\${VAR:-yes}\n\${FOO:-bar}`, { FOO: 'baz' })).toEqual(`yes\nbaz`);
  });
});
