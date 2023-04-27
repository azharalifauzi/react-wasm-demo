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
