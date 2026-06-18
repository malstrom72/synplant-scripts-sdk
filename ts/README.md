# TypeScript definitions

`COJSEngine.d.ts` is the authoritative declaration of Synplant's scripting API — the same definitions
Synplant's own interface is built against. Target it to get editor completion and type checking when
writing scripts.

## Usage

With [Node.js](https://nodejs.org/) installed:

```sh
npm install      # installs the TypeScript compiler
npm run build    # type-check and compile *.ts in this folder to ./out (ES3)
npm run watch    # same, in watch mode
```

Place your script's `.ts` next to `COJSEngine.d.ts` (or adjust `tsconfig.json`'s `include`). The
engine runs an ECMAScript 3 subset, so the compiler targets `es3`. The declarations describe the
global functions, constants, and the patch/genome object model documented in
[../docs/Synplant JS Reference.md](../docs/Synplant%20JS%20Reference.md).
