# React WASM Demo

This app is a demo how to integrate a wasm files that is written in `Rust` using React.
The app mainly try to compress files into zip files using `zip` package on `Rust` and compare it with `jszip`.

`zip` can compress 400 files with size of 200MB just in `0.55 seconds`, while `jszip` needs `18 seconds` to finish the same task.

## Run App locally

```bash
# Install package
yarn

# Run App
yarn dev
```

## Working with Wasm

### Install wasm-pack

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Build the wasm files

```bash
# Build the rust files into wasm
yarn build:core

# Re-install dependencies to make sure the wasm file is updated
yarn
```
