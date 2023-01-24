# envsubst

Bash-like environment variables substitution

&nbsp;[![Main Workflow](https://img.shields.io/github/actions/workflow/status/inventage/envsubst/main.yml?branch=main&style=flat-square)](https://github.com/inventage/envsubst/actions?query=workflow%3A"Main+Workflow")
&nbsp;[![npm version](https://img.shields.io/npm/v/@inventage/envsubst?style=flat-square)](https://www.npmjs.com/package/@inventage/envsubst)

## Example

Let's say you have a file `temp` with the following content:

```
${BAR}
${FOO:-foo}
```

When you run `BAR=baz npx --ignore-existing @inventage/envsubst temp`, you will end up with the following content in `temp`:

```
baz
foo
```

and the following output:

```
Made 2 replacements:

┌──────┬─────────────┬───────┐
│ File │ Variable    │ Value │
├──────┼─────────────┼───────┤
│ temp │ ${BAR}      │ baz   │
├──────┼─────────────┼───────┤
│ temp │ ${FOO:-foo} │ foo   │
└──────┴─────────────┴───────┘
```
