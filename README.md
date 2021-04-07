# envsubst

Environment variables substitution for Node

&nbsp;[![Main Workflow](https://img.shields.io/github/workflow/status/inventage/envsubst/Main%20Workflow?style=flat-square)](https://github.com/inventage/envsubst/actions?query=workflow%3A"Main+Workflow")
&nbsp;[![npm version](https://img.shields.io/npm/v/@inventage/envsubst?style=flat-square)](https://www.npmjs.com/package/@inventage/envsubst)

## Example

Let's say you have a file `test` with the following content:

```
${BAR}
${FOO:-foo}
```

When you run `BAR=baz npx --ignore-existing @inventage/envsubst test`, you will end up with the following content in `test`:

```
baz
foo
```
