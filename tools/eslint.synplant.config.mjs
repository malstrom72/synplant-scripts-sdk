// ESLint flat config for Sonic Charge script packages (ES5 "script" syntax).
//
// This file is shared between the Microtonic and Synplant script SDKs. Only the
// product configuration block below differs between the two copies; keep the
// rest byte-identical.

// ---- Product configuration (Synplant) ---------------------------------------
const PRODUCT_NAME = "Synplant";
const RESOURCES_DIR = "Synplant Resources";

// Host API that only this product provides: native API and constants from
// ts/COJSEngine.d.ts, plus the host helper layer from
// Synplant Resources/Synplant2_main.js and the JS Reference's Host Script
// Helpers section.
const PRODUCT_GLOBALS = {
  BRANCH_COUNT: "readonly",
  CONTROLS: "readonly",
  DIR_SLASH: "readonly",
  GENES: "readonly",
  GROWABLE_GENE_COUNT: "readonly",
  PARAM_INDEXES: "readonly",
  analyzePatchAudio: "readonly",
  copyFile: "readonly",
  deriveOpenPatchDir: "readonly",
  editCushyVariable: "readonly",
  eraseFile: "readonly",
  fileInfo: "readonly",
  gc: "readonly",
  getMonotonicTime: "readonly",
  handleCushyPreparation: "writable",
  makeDir: "readonly",
  moveFile: "readonly",
  papageno: "readonly",
  sendMidi: "readonly",
  setPreview: "readonly",
  spawnPatch: "readonly",
  splitPath: "readonly",

  Color: "readonly",
  ComputedGUIVariable: "readonly",
  Filtered: "readonly",
  Xorshift: "readonly",
  addModPatcher: "readonly",
  bisect: "readonly",
  calcPostSoftClipGain: "readonly",
  calcPreSoftClipGain: "readonly",
  calcPreSoftClipParam: "readonly",
  calcVolumeGain: "readonly",
  calcVolumeParam: "readonly",
  deepClone: "readonly",
  displayHint: "readonly",
  exp2: "readonly",
  floorMod: "readonly",
  fromDecibel: "readonly",
  getCachedPatch: "readonly",
  getDisplayedCushy: "readonly",
  globals: "readonly",
  inverseSignedSquare: "readonly",
  loadPatch: "readonly",
  loadSynplantPatch: "readonly",
  log2: "readonly",
  logScale: "readonly",
  main: "readonly",
  mods: "writable",
  openAudioFile: "readonly",
  openCushy: "readonly",
  papagenoUI: "readonly",
  rescaleVolumeAndClipAdjust: "readonly",
  signedSquare: "readonly",
  toDecibel: "readonly",
  toMousePosition: "readonly"
};

// Bundled examples and the JS Console keep persistent state in package globals
// that span several files; external scripts can add their own
// /* global name:writable */ comments instead.
const EXAMPLE_GLOBALS = {
  _: "writable",
  MyKnob: "writable",
  fourKnobs: "writable",
  genobatch: "writable",
  jsConsole: "writable",
  patchStack: "writable",
  skinChooser: "writable",
  tuningFork: "writable"
};
// ---- End of product configuration --------------------------------------------

// Engine API and host helpers that both products provide.
const SHARED_GLOBALS = {
  // Standard ES5 addition that NuXJS scripts may use.
  JSON: "readonly",

  // Engine API.
  PARAMS: "readonly",
  PROGRAM_COUNT: "readonly",
  ask: "readonly",
  browse: "readonly",
  composeNumbstrict: "readonly",
  createElement: "readonly",
  dir: "readonly",
  display: "readonly",
  editParam: "readonly",
  fullPath: "readonly",
  getCushyVariable: "readonly",
  getElement: "readonly",
  getElementId: "readonly",
  getParam: "readonly",
  isMarshaledFormat: "readonly",
  load: "readonly",
  marshal: "readonly",
  paramText: "readonly",
  paramValue: "readonly",
  parseNumbstrict: "readonly",
  performCushyAction: "readonly",
  print: "writable",
  readClipboard: "readonly",
  run: "readonly",
  save: "readonly",
  saveUndo: "readonly",
  setCushyVariable: "readonly",
  setElement: "readonly",
  setParam: "readonly",
  translate: "readonly",
  unmarshal: "readonly",
  writeClipboard: "readonly",

  // Optional hook a script may install.
  handleCushyTrace: "writable",

  // Host helper layer defined by the product's main script.
  BUILD: "readonly",
  DIRS: "readonly",
  PLATFORM: "readonly",
  StringBuilder: "readonly",
  assert: "readonly",
  bounce: "readonly",
  clamp: "readonly",
  closeCushy: "readonly",
  createClass: "readonly",
  cube: "readonly",
  displayCushy: "readonly",
  fract: "readonly",
  isRepeating: "readonly",
  lerp: "readonly",
  random: "readonly",
  scale: "readonly",
  select: "readonly",
  selected: "readonly",
  square: "readonly",
  toggleCushy: "readonly",
  unescape: "readonly"
};

export default [
  {
    files: ["**/*.js"],
    ignores: [
      "IVG/**",
      RESOURCES_DIR + "/**",
      "CushyLint/**",
      "tmLanguages/**",
      "tools/IVG2PNG/**",
      "tools/jsconsole-bridge-mcp/**"
    ],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",
      globals: Object.assign({}, SHARED_GLOBALS, PRODUCT_GLOBALS, EXAMPLE_GLOBALS)
    },
    rules: {
      "no-undef": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[kind='get'], Property[kind='set']",
          message: "Getter/setter object literal syntax is not supported by " + PRODUCT_NAME + " scripts."
        }
      ],
      "no-with": "error"
    }
  }
];
