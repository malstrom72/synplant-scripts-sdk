# Synplant JavaScript API Reference v1.0

This reference documents the JavaScript API exposed to scripts running inside Synplant 2. It was
written and verified against **Synplant 2.0.2 (build 309)**. The canonical machine-readable form of
this API is the TypeScript definition file [`ts/COJSEngine.d.ts`](../ts/COJSEngine.d.ts); this
document is the prose companion to it.

## Table of Contents

-   [Engine](#engine)
-   [Runtime Boundaries](#runtime-boundaries)
-   [TypeScript Definitions](#typescript-definitions)
-   [File Access and Permissions](#file-access-and-permissions)
-   [Constants](#constants)
    -   [Build Constants](#build-constants)
    -   [Directory Constants](#directory-constants)
    -   [Synplant Constants](#synplant-constants)
    -   [Parameter Constants](#parameter-constants)
-   [Functions](#functions)
-   [Objects](#objects)
    -   [Patch object](#patch-object)
    -   [Branch object](#branch-object)
    -   [Layer object](#layer-object)
    -   [MidiConfig object](#midiconfig-object)
    -   [FileInfo object](#fileinfo-object)
    -   [GCResults object](#gcresults-object)
-   [Papageno (Genopatch)](#papageno-genopatch)
-   [The DNA / Genome Model](#the-dna--genome-model)
-   [Host Script Helpers](#host-script-helpers)
-   [Cushy Interface](#cushy-interface)
    -   [Script Types](#script-types)
    -   [Script Startup](#script-startup)
    -   [Mods](#mods)
    -   [GUI Variables](#gui-variables)
    -   [GUI Actions](#gui-actions)
    -   [Optional Hooks](#optional-hooks)
    -   [Performance Notes](#performance-notes)

## Engine

The JavaScript engine in Synplant is based on [NuXJS](https://github.com/malstrom72/NuXJS), a
sandboxed JavaScript engine written by Magnus Lidström. It was designed to be small, fast, and easy
to integrate into existing products. It is fully ECMAScript 3 compliant with partial ECMAScript 5
support (`JSON`, `[ ]` indexing of strings, `Object.assign`, `Array.isArray`, getters/setters, and a
few other retrofits).

Every instance of Synplant runs in its own JavaScript environment, but all scripts within one
instance share the same global object. The engine only works while the Synplant window is open. The
entire environment is created when the window opens and destroyed when it closes (all global
variables are lost).

While JavaScript code is executing, the user interface is frozen. If a single script execution runs
for more than **20 seconds**, it is suspended and the user is offered the choice of aborting or
continuing. This limit applies to each individual JavaScript call, not to how long a script window
may stay open. There is a memory cap of **64 MB** per instance (after garbage collection); a script
that exceeds it is terminated. Memory grows faster than raw data size suggests: the smallest
allocated value (e.g. a number) uses 16 bytes before any array, object, or string overhead. Strings
are stored as UTF-16.

For measuring elapsed time inside a script, use [`getMonotonicTime()`](#getmonotonictime) rather than
`Date.now()`. `getMonotonicTime()` returns milliseconds from a monotonic high-resolution timer that
is immune to wall-clock adjustments; reserve `Date.now()` for actual calendar timestamps.

Synplant scripts do not have a step-through debugger. The normal workflow is to use `print(...)` for
trace output and [`display(...)`](#display) for blocking, user-visible checkpoints.

## Runtime Boundaries

Synplant scripts do not run in the real-time audio or MIDI processing callback. A script cannot
receive raw incoming MIDI events or process the live audio stream sample-by-sample. They also cannot
bounce/export rendered audio: [`analyzePatchAudio(...)`](#analyzepatchaudio) synthesizes internally
for pitch/level analysis and returns measurements, not audio buffers or audio files. There is no
network or internet API.

What scripts *can* do is considerable:

-   **Read and write the patch.** The full patch — genome, control parameters, branches (the DNA
    tree), layers — is available through [`getElement('patch')`](#getelement) /
    [`setElement('patch', …)`](#setelement).
-   **Analyze audio offline.** [`analyzePatchAudio(...)`](#analyzepatchaudio) synthesizes a patch
    internally and returns measured pitch and/or volume, without touching the live audio engine.
-   **Drive the AI sound matcher.** The entire Papageno / Genopatch engine is scriptable through the
    [`papageno`](#papageno-genopatch) object — load a reference sound, run an evolutionary search,
    read back solutions.
-   **Send MIDI.** [`sendMidi(...)`](#sendmidi) emits a MIDI message.
-   **Preview patches.** [`setPreview(...)`](#setpreview) auditions a patch without committing it.

File I/O is sandboxed; see [File Access and Permissions](#file-access-and-permissions).

## TypeScript Definitions

The authoritative API is the TypeScript declaration file [`ts/COJSEngine.d.ts`](../ts/COJSEngine.d.ts).
Synplant's own GUI is written in TypeScript compiled to the ES3 subset the engine runs, and the same
definitions are what script authors should target. Two helper aliases appear throughout:

    declare type Byte = number     // an integer 0..255 (used for binary file data)
    declare type Integer = number  // a value that is conceptually an integer

There are effectively **two layers** of API:

1.  **The native engine API** — everything declared in `COJSEngine.d.ts` and listed under
    [Functions](#functions), [Objects](#objects), and [Constants](#constants) below. These are
    guaranteed to exist whenever a script runs.
2.  **Host script helpers** — additional functions (`clamp`, `lerp`, `select`, `displayCushy`,
    `getCachedPatch`, …) defined by Synplant's running main script in the shared global space. They
    are convenient and widely used by scripts and Mods, but they are not part of the engine and are
    not in `COJSEngine.d.ts`. See [Host Script Helpers](#host-script-helpers).

## File Access and Permissions

Synplant sandboxes script file I/O. At startup the engine grants a fixed set of **trusted paths**;
anything outside them triggers a one-time permission prompt.

-   **Trusted read-only** (listing and loading allowed without prompt): the script resources path
    (`DIRS.SCRIPTS` and other external resource folders), the factory patches (`DIRS.PATCHES`), the
    Genopatch support folder (`DIRS.PAPAGENO`), and the skins folder (`DIRS.SKINS`).
-   **Trusted read-write** (full file access without prompt): the Sonic Charge user-documents folder
    **`DIRS.DOCUMENTS`**. This is the only location a script may freely create, write, move, and
    erase files in. Persist your script's data here.

When a script attempts an operation outside the granted set — saving to an arbitrary folder the user
picked with [`browse`](#browse), creating a directory elsewhere, erasing a file — the engine shows a
modal **"Grant permission to … : …"** dialog. If the user approves, the grant is remembered for the
rest of the session; if they decline, the operation throws (`"user canceled"`). There is also an
automatic grant for the directory of the currently open patch.

Practical guidance: read and write under `DIRS.DOCUMENTS` for friction-free persistence, and expect
(and handle) a permission prompt or thrown error when touching user-chosen locations.

## Constants

### Build Constants

    PLATFORM = {
        CPU:        string          // 'arm64' | 'x86-64' | 'x86' | 'ppc'
        OS:         string          // 'mac' | 'windows'
    }

    BUILD = {
        COMPILER:   string
        COPYRIGHT:  string          // e.g. "2008-2024"
        DATE:       string          // e.g. "Aug 30 2024"
        FORMAT:     string          // e.g. "Standalone" | "VST" | "AU" ...
        LIBS:       string
        NUMBER:     number          // build number, e.g. 309
        TARGET:     string          // 'Debug' | 'Beta' | 'Release'
        TIME:       string
        VERSION:    string          // e.g. "2.0.2"
    }

> Note: `PLATFORM`, `BUILD`, and `DIRS` are not injected by the bare engine — they are populated by
> Synplant's main script from Cushy variables (`getCushyVariable('BUILD.NUMBER')`, etc.). They are
> present whenever the standard GUI is loaded, which is always the case for a running script, but
> they belong to the [host helper layer](#host-script-helpers).

### Directory Constants

    DIRS = {
        BINARY:         string      // the folder the plug-in / application resides in
        PATCHES:        string      // factory patches (read-only trusted)
        DOCUMENTS:      string      // Sonic Charge user documents (read-write trusted)
        DOCUMENTATION:  string
        SUPPORT:        string
        SCRIPTS:        string      // the "Synplant Scripts" folder (read-only trusted)
        SKINS:          string      // the "Synplant Skins" folder (read-only trusted)
        PAPAGENO:       string      // Genopatch support folder (read-only trusted)
    }

All are absolute paths ending with a directory separator. Example values on macOS (Synplant 2.0.2):

    BINARY        /Applications/Sonic Charge/Synplant.app/Contents/Resources/
    PATCHES       /Library/Audio/Presets/Sonic Charge/
    DOCUMENTS     /Users/<user>/Documents/Sonic Charge/
    DOCUMENTATION /Library/Documentation/Sonic Charge/
    SUPPORT       /Library/Application Support/Sonic Charge/
    SCRIPTS       /Library/Application Support/Sonic Charge/Synplant Scripts/
    SKINS         /Library/Application Support/Sonic Charge/Synplant Skins/
    PAPAGENO      /Library/Application Support/Sonic Charge/Synplant Genopatch/

`DIR_SLASH` holds the platform directory separator (`'/'` on macOS, `'\'` on Windows).

### Synplant Constants

    BRANCH_COUNT  = 12      // branches (and layers) per patch
    PROGRAM_COUNT = 16      // program slots
    GROWABLE_GENE_COUNT = 43 // genes represented in per-branch explicit morph data

### Parameter Constants

Parameters are normally accessed by symbolic name (e.g. `getParam('flt_freq')`), though the index
form is also accepted. Three arrays expose parameter metadata, all holding `ParamInfo` objects:

    interface ParamInfo {
        NAME:     string                    // symbolic name, e.g. 'flt_freq'
        STEPS:    number | null             // step count if stepped, else null
        CHOICES:  string[] | null           // choice labels for stepped params, else null
        DEFAULT:  number                    // default value, 0..1
    }

    PARAMS    // all 98 parameters, in index order
    CONTROLS  // the 14 control (performance) parameters  == PARAMS[0..13]
    GENES     // the 48 genome parameters                 == PARAMS[50..97]

    PARAM_INDEXES = { <name>: <index>, ... }   // name → index lookup

All parameter values are normalized **0 to 1**. For a *stepped* parameter (`STEPS` is non-null),
convert between the normalized value and the integer step like this:

    paramValue     = steppedInteger / (STEPS - 1)
    steppedInteger = Math.min(Math.floor(paramValue * STEPS), STEPS - 1)

For stepped parameters, `CHOICES[steppedInteger]` is the label, and
[`paramText`](#paramtext) / [`paramValue`](#paramvalue) convert to and from the human-readable text.

**`PARAMS` layout** (index : name, step count in parentheses):

    0..13   Control parameters
            0 modWheel   1 rotation   2 tuning      3 atonality   4 effect      5 release
            6 volume     7 wheelTarget(10)          8 wheelScale  9 velSens    10 glideTime
            11 voiceMode(3)            12 bulbMode(4)              13 tempoSync(8)

    14..25  branch1 .. branch12               // per-branch length (0..1)
    26..37  branchVolume1 .. branchVolume12   // per-branch volume (0..1)
    38..49  enableLayer1 .. enableLayer12 (2) // per-layer on/off (stepped, 2)

    50..97  Genome parameters (48 genes), in order:
            env_time env_loop env_tilt env_kf
            vol_atk vol_dcy vol_sus vol_fade
            mod_atk mod_dcy mod_sh mod_vel
            lfo_rate lfo_amt lfo_bal lfo_dly
            a_form a_noise a_mod a_color a_freq
            fm_mod fm_amt mix_mod osc_mix
            b_form b_noise b_mod sub_am b_freq b_sh
            flt_type flt_q flt_mod flt_sep flt_freq flt_kf
            saturate
            rvb_mix rvb_atk rvb_len rvb_damp rvb_chor rvb_size
            adj_bass adj_treb adj_pan adj_clip

**Stepped control parameters** and their choices:

    wheelTarget (10)  growth +, growth -, filter +, filter -, env time +, env time -,
                      fm amount, lfo amount, effect, volume
    voiceMode (3)     poly, mono, legato
    bulbMode (4)      standard, velocity, ranges, layered
    tempoSync (8)     off, 1/2, 1/4 D, 1/2 T, 1/4, 1/8 D, 1/4 T, 1/8

`enableLayer1..12` are stepped (2): 0 = off, 1 = on. All other control and genome parameters are
continuous. To dump the authoritative parameter list from the running plug-in:

```javascript
var sb = new StringBuilder();
for (var i = 0; i < PARAMS.length; ++i) {
    var p = PARAMS[i];
    sb.append(i + '\t' + p.NAME + '\t' + (p.STEPS != null ? p.STEPS + ' steps' : 'continuous') + '\n');
}
save(DIRS.DOCUMENTS + 'synplant_params.txt', sb.build());
```

## Functions

Signatures follow the [`COJSEngine.d.ts`](../ts/COJSEngine.d.ts) types. Optional arguments are shown
in square brackets, with their default where one applies.

### analyzePatchAudio

    function analyzePatchAudio(patch: Patch, midiNote: Integer, midiVelocity: Integer,
            maxHeld: number, maxSeconds: number, analyzePitch: boolean, analyzeVolume: boolean,
            [sampleRate: number = 44100], [randomSeed: Integer = 1], [initLFOPhase: number = 0.25])
            : { pitch?: number, volume?: number }

Synthesizes `patch` offline for the given MIDI note and velocity and returns the measured pitch
and/or volume. The returned `pitch` is a floating-point MIDI note (60 = C3); `volume` is in decibels
(0 dB = nominal level). `maxHeld` and `maxSeconds` bound the held time and total render in seconds.
Does not affect live playback.

See also: [setPreview](#setpreview).

### ask

    function ask(caption: string, [defaultReply: string]) : string | null

Prompts the user for a single line of text through a simple edit dialog. Returns the entered string,
or `null` if the user cancels.

See also: [display](#display).

### browse

    function browse([browserType: string = "open"], [fileTypes: string|string[]|null = null],
            [initialDir: string|null = null], [defaultFileName: string]) : string | null

Opens a file browser and returns the chosen path, or `null` if cancelled. `browserType` is `"open"`,
`"save"`, or `"folder"`. `fileTypes` is an extension or array of extensions (without the leading
dot); pass `null` to accept all files. Recognized types include `"synplant"`, `"synp"`, `"scmc"`,
`"mid"`, `"wav"`, `"wave"`, `"aiff"`/`"aifc"`/`"aif"`/`"afc"`, `"txt"`, and `"js"`. If `fileTypes`
contains audio extensions a sample preview is enabled; if it is only `"synplant"`/`"synp"` the patch
browser with preview is used. `defaultFileName` (save browser only) should omit the extension. If
`initialDir` is `null`, a directory is chosen automatically from the first extension.

See also: [dir](#dir), [load](#load), [save](#save).

### composeNumbstrict

    function composeNumbstrict(v: string|number|boolean|object, [multiLine: boolean = false],
            [brackets: boolean = true]) : string

Serializes a string, number, boolean, or object to Numbstrict text (Synplant's JSON-like object
notation). `multiLine` pretty-prints with newlines and indentation; `brackets` controls whether the
outermost curly brackets are emitted.

See also: [parseNumbstrict](#parsenumbstrict).

### copyFile

    function copyFile(fromPath: string, toPath: string) : void

Copies a file. Subject to file-access permissions (see
[File Access and Permissions](#file-access-and-permissions)).

### createElement

    function createElement(type: "patch") : Patch
    function createElement(type: "midiConfig") : MidiConfig

Returns a new default element of the given type (an initialized patch, or a default MIDI config),
without altering the current plug-in state.

See also: [getElement](#getelement), [setElement](#setelement), [Objects](#objects).

### deriveOpenPatchDir

    function deriveOpenPatchDir() : string | null

Returns the directory of the currently open patch, or `null` if none. This directory carries an
automatic load/list permission grant.

### dir

    function dir(path: string, [filter: string|string[]]) : FileInfo[]

Lists the contents of a directory, returning an array of [`FileInfo`](#fileinfo-object) objects.
`filter` is an extension or array of extensions (no leading dot); the special filter `"/"` matches
directories. Requires list permission for `path`.

See also: [fileInfo](#fileinfo), [FileInfo object](#fileinfo-object).

### display

    function display(message: string, [alertType: string = "plain"], [buttons: string = "ok"],
            [defaultButton: string]) : string

Shows a modal alert and blocks until it is dismissed, returning the name of the button pressed.
`alertType` is `"plain"`, `"question"`, `"warning"`, `"info"`, or `"error"`. `buttons` is `"ok"`,
`"ok cancel"`, `"retry cancel"`, `"yes no"`, `"yes no cancel"`, or `"abort retry ignore"`. The
return value is one of `"ok"`, `"cancel"`, `"retry"`, `"yes"`, `"no"`, `"abort"`, `"ignore"`.

See also: [ask](#ask), [print](#print).

### editCushyVariable

    function editCushyVariable(guiVariable: string, beginEdit: boolean) : void

Brackets a GUI-variable edit: call with `true` before changing a variable interactively and `false`
after, so the host treats the change as a single user edit (for undo coalescing and parameter
smoothing).

See also: [setCushyVariable](#setcushyvariable), [editParam](#editparam).

### editParam

    function editParam(param: string|number, [beginEdit: boolean]) : void

Marks the beginning and end of an interactive edit of a parameter (by name or index). Notifies the
host that the user is manipulating the parameter, e.g. to bracket automation recording.

See also: [setParam](#setparam), [getParam](#getparam).

### eraseFile

    function eraseFile(path: string) : void

Deletes a file. Subject to file-access permissions.

### fileInfo

    function fileInfo(path: string) : FileInfo | null

Returns a [`FileInfo`](#fileinfo-object) for `path`, or `null` if it does not exist. Useful for
existence checks before [`makeDir`](#makedir) / [`save`](#save).

### fullPath

    function fullPath([base: string], [relative: string]) : string

Resolves `relative` against `base` (or the default scripts directory) into an absolute path.

### gc

    function gc() : GCResults

Runs garbage collection and returns before/after heap statistics (see
[`GCResults`](#gcresults-object)).

### getCushyVariable

    function getCushyVariable(guiVariable: string, [utf8: boolean]) : string

Reads the current value of a Cushy GUI variable as a string. See [GUI Variables](#gui-variables) and
the separate Cushy Variables reference for the available variables.

See also: [setCushyVariable](#setcushyvariable), [performCushyAction](#performcushyaction).

### getElement

    function getElement(type: "patch") : Patch
    function getElement(type: "midiConfig") : MidiConfig

Returns the current patch or MIDI configuration as a plain JavaScript object.

See also: [setElement](#setelement), [getElementId](#getelementid), [Objects](#objects).

### getElementId

    function getElementId(type: "patch") : Integer

Returns the current patch's identity integer, which changes on any modification. Only `"patch"` has
an element id. Use it to cheaply detect whether the patch changed since you last looked.

See also: [getElement](#getelement).

### getMonotonicTime

    function getMonotonicTime() : number

Returns milliseconds from a monotonic high-resolution timer. Use this for elapsed-time measurement
(it is immune to wall-clock changes); use `Date.now()` only for calendar timestamps.

### getParam

    function getParam(param: string|number) : number

Returns the current normalized (0..1) value of a parameter, by name or index.

See also: [setParam](#setparam), [paramText](#paramtext).

### isMarshaledFormat

    function isMarshaledFormat(type: "patch"|"midiConfig", source: string) : boolean

Returns `true` if `source` is the marshaled (file) text form of the given element type. Marshaled
patches begin with `SynplantPatch:` and MIDI configs with `SynplantMIDIConfig:`.

See also: [marshal](#marshal), [unmarshal](#unmarshal).

### load

    function load(filePath: string, encoding: "binary") : Byte[]
    function load(filePath: string, [encoding: string = "utf-8"]) : string

Loads a file. With `"binary"`, returns an array of byte values; otherwise returns text decoded as
`"utf-8"` (default) or `"iso-8859-1"`. Requires load permission for the path.

See also: [save](#save), [dir](#dir), [browse](#browse).

### makeDir

    function makeDir(path: string) : void

Creates a directory. Subject to file-access permissions (allowed without prompt under
`DIRS.DOCUMENTS`).

### marshal

    function marshal(type: "patch", source: Patch, [forFile: boolean]) : string
    function marshal(type: "midiConfig", source: MidiConfig, [forFile: boolean]) : string

Serializes a patch or MIDI config to its Numbstrict text form. Pass `forFile = true` for the on-disk
representation (e.g. before [`save`](#save)).

See also: [unmarshal](#unmarshal), [isMarshaledFormat](#ismarshaledformat).

### moveFile

    function moveFile(fromPath: string, toPath: string) : void

Moves or renames a file. Subject to file-access permissions.

### paramText

    function paramText(param: string|number, value: number, [highPrecision: boolean]) : string

Formats a normalized parameter `value` as the human-readable text Synplant would display, e.g.
`paramText('voiceMode', 0.5)` returns `"mono"` and `paramText('volume', 0.38)` returns `"-7.93 dB"`.

See also: [paramValue](#paramvalue), [getParam](#getparam).

### paramValue

    function paramValue(param: string|number, value: string) : number

Inverse of [`paramText`](#paramtext): parses display text into a normalized value, e.g.
`paramValue('voiceMode', 'mono')` returns `0.5`.

### parseNumbstrict

    function parseNumbstrict(s: string) : string|number|boolean|object

Parses Numbstrict text into a JavaScript value.

See also: [composeNumbstrict](#composenumbstrict).

### performCushyAction

    function performCushyAction(action: string, [params: string]) : boolean

Invokes a built-in Cushy/host action (e.g. `"reload"`, `"register"`, `"launch"`) with an optional
Numbstrict parameter string. Returns whether the action succeeded.

See also: [getCushyVariable](#getcushyvariable), [setCushyVariable](#setcushyvariable).

### print

    function print(v: any) : void

Writes a line of trace output. Accepts any value, coerced to a string.

See also: [display](#display).

### readClipboard

    function readClipboard() : string | null

Returns the clipboard's text contents, or `null` if empty or unavailable.

See also: [writeClipboard](#writeclipboard).

### run

    function run(filePath: string) : void

Loads and executes a JavaScript file in the shared global environment. Used to launch scripts and to
load supporting `.js` files.

### save

    function save(filePath: string, data: string|Byte[], [encoding: string = "utf-8"]) : void

Writes `data` (a string, or a `Byte[]` for binary) to a file, encoded as `"utf-8"` (default),
`"iso-8859-1"`, or `"binary"`. Subject to file-access permissions.

See also: [load](#load).

### saveUndo

    function saveUndo(description: string, [collapse: boolean]) : void

Records an undo checkpoint with the given description before a change. `collapse` merges this step
with the previous one of the same description.

### sendMidi

    function sendMidi(status: Integer, [data1: Integer], [data2: Integer]) : void

Sends a MIDI message with the given status and data bytes.

### setCushyVariable

    function setCushyVariable(guiVariable: string, value: string, [underEdit: boolean],
            [utf8: boolean]) : boolean

Sets a Cushy GUI variable. `underEdit` marks the change as part of an in-progress interactive edit.

See also: [getCushyVariable](#getcushyvariable), [editCushyVariable](#editcushyvariable).

### setElement

    function setElement(type: "patch", patch: Patch) : Integer
    function setElement(type: "midiConfig", config: MidiConfig) : void

Replaces the current patch or MIDI configuration. For `"patch"`, returns the new patch id. If the
patch's `patchId` or `seedId` is `null`, a fresh unique id is assigned automatically — the expected
behavior when creating a distinct new patch from loading, randomization, etc.

See also: [getElement](#getelement), [createElement](#createelement).

### setParam

    function setParam(param: string|number, value: number) : void

Sets a parameter (by name or index) to a normalized 0..1 value.

See also: [getParam](#getparam), [editParam](#editparam).

### setPreview

    function setPreview([patch: Patch]) : void

Auditions `patch` as a non-committal preview, the way the patch browser does on hover. Call with no
argument to stop previewing.

### spawnPatch

    function spawnPatch(patch: Patch, branchNumber: Integer, [newSeedId: Integer]) : Patch

Returns a new patch grown from `patch` at the given branch — the scripted form of planting a seed
from a branch. Optionally assigns a specific `seedId`.

See also: [The DNA / Genome Model](#the-dna--genome-model).

### splitPath

    function splitPath(path: string) : [string, string, string]

Splits a path into `[directory, name, extension]`.

See also: [fullPath](#fullpath).

### translate

    function translate(s: string) : string

Returns the localized translation of `s`, or `s` unchanged if no translation exists.

### unmarshal

    function unmarshal(type: "patch", source: string) : Patch
    function unmarshal(type: "midiConfig", source: string) : MidiConfig

Parses the marshaled text form back into a patch or MIDI config object.

See also: [marshal](#marshal), [isMarshaledFormat](#ismarshaledformat).

### writeClipboard

    function writeClipboard(data: string) : void

Replaces the clipboard's text contents.

See also: [readClipboard](#readclipboard).

## Objects

### Patch object

[`getElement('patch')`](#getelement) / [`createElement('patch')`](#createelement) return:

    {
        implementation: Integer     // engine implementation id
        name:           string
        path:           string|null // source file; filename takes priority over name when updating
        modified:       boolean
        id:             Integer     // identity, auto-incremented on any modification
        patchId:        Integer|null// audio-smoothing id; null → assigned on setElement
        seedId:         Integer|null// atonality/detune seed; null → assigned on setElement
        pitchAdjust:    number
        legacyMode:     boolean     // Synplant 1 compatibility mode
        control:        { [controlName]: number }   // the 14 control params, 0..1
        genome:         { [geneName]:   number }     // the 48 genes, 0..1
        branches:       Branch[]    // BRANCH_COUNT (12) entries
        layers:         Layer[]     // BRANCH_COUNT (12) entries
    }

`control` keys are the 14 [control parameter](#parameter-constants) names; `genome` keys are the 48
gene names. Both hold normalized 0..1 values.

### Branch object

Each entry of `patch.branches`:

    {
        id:        Integer          // unique branch id
        length:    number           // branch length, 0..1
        volume:    number           // branch volume, 0..1
        explicit:  number[] | null  // explicit per-branch morph values, or null
    }

### Layer object

Each entry of `patch.layers`:

    {
        enabled: number             // 0 (off) or 1 (on)
    }

### MidiConfig object

[`getElement('midiConfig')`](#getelement) / [`createElement('midiConfig')`](#createelement) return:

    {
        sourcePath:           string|null
        sourceText:           string|null   // marshaled "SynplantMIDIConfig: { ... }"
        inputChannel:         Integer|null  // null = "any"
        outputChannel:        Integer|null
        programChanges:       boolean
        pitchWheelRange:      Integer
        pitchWheelOnHeldOnly: boolean
        velocityCurve:        "low" | "normal" | "high" | "fixed"
        notesSelectsBranch:   boolean
        mouseClickVelocity:   Integer
        minPolyphony:         Integer
        maxPolyphony:         Integer
        pressureCurve:        "soft" | "normal" | "hard" | "off"
        masterTuning:         number        // Hz, default 440
        controlCC:            { [controlName]: Integer|null }   // CC per control param
        genomeCC:             { [geneName]:   Integer|null }     // CC per gene
        branchesCC:           (Integer|null)[]                   // CC per branch (12)
    }

### FileInfo object

Returned by [`dir`](#dir) and [`fileInfo`](#fileinfo):

    {
        name:        string         // filename including extension (no path)
        size:        Integer        // bytes
        created:     Date
        modified:    Date
        isDirectory: boolean
        isReadOnly:  boolean
        macFileType: string
    }

### GCResults object

Returned by [`gc`](#gc):

    {
        preCount:  Integer          // live values before GC
        preSize:   Integer          // bytes before GC
        pooled:    Integer
        postCount: Integer          // live values after GC
        postSize:  Integer          // bytes after GC
    }

## Papageno (Genopatch)

Papageno is Synplant's AI sound-matching engine (presented to users as **Genopatch**). It takes a
reference sound and runs a multi-threaded evolutionary search across several "stalks", each growing a
set of candidate patches ("solutions") that approximate the reference. The whole engine is scriptable
through the global `papageno` object.

> The methods below mirror Synplant's own Genopatch UI. When no reference is loaded the engine is
> uninitialized (`papageno.isInitialized()` is `false`) and queries such as `getNetInfo()` return
> nothing useful.

    papageno.initialize(config: PapagenoConfiguration): void
    papageno.isInitialized(): boolean
    papageno.loadReference(filePath, maxLength, eraseFile): void
    papageno.updateReferenceRange(start, stop, zeroCrossStartArea?, zeroCrossStopArea?): void
    papageno.startOrStopReferencePlayback(doPlay?): void
    papageno.getReferenceInfo(): PapagenoReferenceInfo | null
    papageno.getReferenceDisplayData(from, to, step): number[]   // min/max pairs per step
    papageno.getReferencePlaybackPosition(): number | null

    papageno.startSearch(): void
    papageno.stopSearch(): void
    papageno.isSearching(): boolean
    papageno.finishedSearching(): boolean

    papageno.getStalkCount(): Integer
    papageno.getStalkInfo(stalkNumber): PapagenoStalkInfo
    papageno.getSolution(stalkNumber, solutionNumber): PapagenoSolution
    papageno.getActiveStalkNumber(): Integer
    papageno.focusOnStalk(stalkNumber | null, iterations?): void
    papageno.respawnStalk(stalkNumber, startingPoint?, startingPointSpread?): void
    papageno.getTacticsSuccessRatios(stalkNumber): { crossOrNet: number[], reviseCounts: number[] }
    papageno.getNetInfo(): { name, date, codeSize, pdResolution }

Key supporting types (see `COJSEngine.d.ts` for the full `PapagenoConfiguration`):

    PapagenoStalkInfo     { id, iterations, height, solutions, seed }
    PapagenoSolution      { patch, iteration, height, error, offset, duration }
    PapagenoReferenceInfo { path, id, length, start, stop, pitch }

A typical scripted flow: `loadReference` → optionally `updateReferenceRange` → `startSearch`, poll
`isSearching()` / `getStalkInfo()`, then read `getSolution(...)` patches and apply the best with
`setElement('patch', solution.patch)`. The bundled example **Export All Genopatch Solutions.js**
walks every stalk/solution and saves them.

## The DNA / Genome Model

A Synplant patch is built from three layers of parameters:

-   **Genome** — 48 genes (`GENES`) that define the *sound* of a voice: envelopes, modulation, the
    two oscillators (A/B), FM, the filter, saturation, reverb, and output adjust. These are the
    "DNA" that Genopatch evolves and that mutate when you grow a plant.
-   **Branches** — up to `BRANCH_COUNT` (12) branches form the visual DNA tree. Each branch has a
    `length`, a `volume`, and optional `explicit` morph data. Branch geometry, together with
    `control.rotation`, `control.atonality`, and `seedId`, determines how a branch maps to pitch and
    detuning.
-   **Control parameters** — 14 performance/global parameters (`CONTROLS`): `tuning`, `atonality`,
    `effect`, `release`, `volume`, `bulbMode`, `voiceMode`, the mod-wheel routing (`wheelTarget`,
    `wheelScale`, `modWheel`), `glideTime`, `velSens`, `tempoSync`, and `rotation`.

`seedId` controls the pseudo-random atonality detuning applied across branches; `patchId` controls
whether the audio engine smooths parameter changes. Setting either to `null` before
`setElement('patch', …)` asks Synplant to assign a fresh unique id — do this when a genuinely new
patch is created (from loading, randomization, Genopatch, etc.). `legacyMode` puts a patch into
Synplant 1 compatibility behavior. [`spawnPatch`](#spawnpatch) grows a new patch from a chosen
branch, the scripted equivalent of planting a seed.

### Gene categories

The 48 genes (`GENES`) are not a flat list; they differ in how they behave across a patch's
branches. `GROWABLE_GENE_COUNT` (43) marks the boundary in `GENES` order: the first 43 genes are
growable, the last 5 are not. A branch's per-branch genome data (its explicit morph) only covers the
growable genes, so `branch.explicit.length === GROWABLE_GENE_COUNT` when it is non-null.
Non-growable genes are always taken from the seed genome and apply to the whole patch.

-   **Growable (per-branch)** — most of the first `GROWABLE_GENE_COUNT` genes. Each branch can carry
    its own morphed value. These mutate as a plant grows and can be shaped independently per branch:
    envelopes, modulation, oscillators A/B, FM, filter, saturation, reverb mix/attack, and so on.
-   **Exclusive** — `rvb_len`, `rvb_chor`, `rvb_damp`. These are growable, so each branch stores its
    own value and they appear in explicit morph data, but their effect is mutually exclusive: they
    parameterize Synplant's single shared reverb tail, so only one configuration is realized at a
    time. The realized value comes from the current **lead branch**: in non-layered bulb modes this is
    the latest triggered branch; in Layered bulb mode it is the first branch in the current rotated
    branch order (the bottom-most branch in the circular GUI), regardless of whether that layer is
    enabled.
-   **Non-growable (global)** — the last 5 genes in `GENES` order: `rvb_size`, `adj_bass`,
    `adj_treb`, `adj_pan`, `adj_clip`. They never grow, never appear in explicit morph data, and are
    taken from the seed genome to apply to the whole patch.

| Category | Genes | Per-branch value | In explicit morph | Realized effect |
| --- | --- | --- | --- | --- |
| Growable | first 43 genes, except the three below | yes | yes | per branch |
| Exclusive | `rvb_len`, `rvb_chor`, `rvb_damp` | yes | yes | one at a time (lead branch) |
| Non-growable | `rvb_size`, `adj_bass`, `adj_treb`, `adj_pan`, `adj_clip` | no | no | whole patch |

The word "exclusive" describes the effect, not the data. The gene value is ordinary per-branch data;
the downstream reverb resource is singular. Avoid treating these as shared gene values — only the
realized reverb-tail effect is shared.

Dump the boundary from the running plug-in:

    for (var i = 0; i < GENES.length; ++i) {
        print(i + '\t' + GENES[i].NAME + (i < GROWABLE_GENE_COUNT ? '\tgrowable' : '\tnon-growable'));
    }

### Explicit branch morphs

By default a branch grows a random variation of the seed: `branch.explicit` is `null`, and the
branch's sound is the seed genome plus pseudo-random mutation that scales with branch length (seeded
by `seedId` and spread by `control.atonality`).

When `branch.explicit` is non-null, the branch follows an **explicit morph** instead. `explicit` is a
`number[]` of length `GROWABLE_GENE_COUNT`, indexed in `GENES` order: `explicit[i]` is the
per-unit-length morph slope for gene `GENES[i].NAME`. Only growable genes participate.
Non-growable genes (indices greater than or equal to `GROWABLE_GENE_COUNT`) are never morphed and
are always taken from the seed.

The realized value of a growable gene on an explicit branch at branch length `L` is:

    value = seedGenome[gene] + explicit[i] * L

At `L = 0` (fully contracted) the branch equals the seed; extending it moves each gene linearly
along its slope. `L` is the branch's live length, so a morphed branch still responds to growth
(mod-wheel `growth +` / `growth -`) by travelling farther along the same slope.

To make a branch reproduce a target genome `T` exactly at length `L`:

    explicit[i] = (T[GENES[i].NAME] - seedGenome[GENES[i].NAME]) / L

Slopes that round to approximately zero may be stored as `0`. This identity — a branch that becomes
a specific target sound at its tip — is the basis of grafting.

### Grafting

**Grafting** attaches the sound of one patch onto a branch of another, written as an explicit morph
so the destination branch grows from its own seed into the source patch's sound at the tip. The
reusable source implementation is
[`snippets/grafting.js`](../snippets/grafting.js). The bundled Mod
[`examples/Mods/Graft Onto Branch.js`](../examples/Mods/Graft%20Onto%20Branch.js) vendors that
implementation so it remains self-contained. The snippet is meant to be copied into a private scope;
it provides three local functions, `calcBranchPitch(...)`, `copyBranchPatch(...)`, and
`graftPatchOntoBranch(...)`, while the remaining math and retuning helpers stay nested inside the
grafting function. The Mod wraps the copy/graft functions as a two-step clipboard flow:

-   **Copy Branch** — `spawnPatch(sourcePatch, selectedBranch)` grows the selected branch into a
    standalone patch, capturing that branch's exact sound and pitch. The Mod then serializes it with
    `marshal('patch', …)` and writes it to the clipboard with `writeClipboard(...)`.
-   **Graft Onto Branch** — `unmarshal('patch', …)` reads the clipboard patch (guarded with
    `isMarshaledFormat('patch', …)`), reconciles it into the destination's frame, then computes
    `explicit[i] = (sourceGene - destSeedGene) / destBranchLength` for each growable gene and stores
    the result on the destination's selected branch. The operation is wrapped in `saveUndo(...)` and
    committed with `setElement('patch', …)`.

The destination branch must have some length; as `L` approaches zero the slope becomes undefined.
The Mod requires the branch to be extended a little.

Grafting is not just a raw per-gene delta. Several genes are interpreted relative to other patch
state, so the source genome is first reconciled into the destination's frame:

-   **Pitch (`a_freq`)** — shifted by the source/destination pitch difference, accounting for
    `pitchAdjust`, `control.tuning`, and the destination branch's mapped pitch (which depends on
    `control.bulbMode` and `control.rotation`). The result is octave-wrapped to stay in range. If the
    wrap forces the destination seed to move, the user is warned because existing branches can
    change.
-   **Envelope key-follow (`env_kf`)** — when active, envelope time is rescaled to compensate for the
    pitch shift.
-   **Filter key-follow (`flt_kf`)** — `flt_freq` is recomputed through the filter cutoff mapping so
    the absolute cutoff is preserved after retuning.
-   **Effect / reverb wet (`rvb_mix` vs `control.effect`)** — the source's effective wet amount is
    converted into the destination's effect context.
-   **Volume** — the grafted branch's `volume` is offset by the source/destination master-volume
    difference in decibels.

Only after these corrections are the per-gene slopes computed and written to `branch.explicit`; the
grafted branch's `id` is copied from the source branch.

Because Layered bulb mode triggers several branches at once, grafting different source patches onto
separate branches — extending each to full length and enabling its layer — creates a stacked patch.
The global/non-growable genes (`rvb_size`, `adj_*`) plus control parameters still come from the
single seed genome, so they are dictated by whichever patch is the base. The exclusive reverb-tail
genes (`rvb_len`, `rvb_chor`, `rvb_damp`) are realized from the lead branch, which in Layered mode is
the bottom-most branch in the current rotated branch order, even if that layer is disabled. Keep
`control.atonality` low if you do not want Layered mode's per-layer detuning.

See also: [`spawnPatch`](#spawnpatch), [`marshal`](#marshal), [`unmarshal`](#unmarshal), and
[Mods](#mods). For distributable scripts, copy the relevant snippet code into your script's own
IIFE/closure instead of depending on `snippets/` being installed beside it.

## Host Script Helpers

These functions are **not** part of the engine API; they are defined by Synplant's running main
script in the shared global space and are available to scripts and Mods while the standard GUI is
loaded. They are convenient but version-dependent — treat them as a softer contract than the native
API, and guard with `typeof` if in doubt.

Math/utility helpers (verified present in build 309): `clamp`, `lerp`, `scale`, `square`, `cube`,
`fract`, `unescape`, `floorMod`, `StringBuilder`, `createClass`, `Color`, and the `random` object.

GUI/state helpers: `displayCushy`, `closeCushy`, `toggleCushy`, `getDisplayedCushy`, `select`,
`selected`, `getCachedPatch`, `displayHint`, `assert`.

In particular `select('program', n)` / `selected('program')` and `selected('branch')` are
host-script helpers, not engine functions — this is why they do not appear in `COJSEngine.d.ts`.

## Cushy Interface

### Script Types

There are three kinds of user script:

1.  **Standalone `.js`** — a single JavaScript file in the Synplant Scripts folder. It runs when
    chosen from the script menu. Good for one-shot operations (e.g. transform the current patch).
2.  **GUI scripts (`.spscript`)** — a directory named `MyScript.spscript` containing a `MyScript.js`
    launcher and one or more `.cushy` layouts (plus optional `.js`, `.schema`, image, and other
    resources). The launcher opens a Cushy window for the script.
3.  **Mods** — scripts in the `Mods` subfolder that run automatically at startup and patch Synplant's
    *own* built-in GUI. See [Mods](#mods) below.

Standalone scripts and GUI scripts are discovered from `DIRS.SCRIPTS` and listed in Synplant's
script menu, which also offers **Open Scripts Folder**.

### Script Startup

A GUI script's launcher opens its layout on a Cushy *layer* with `displayCushy`:

```javascript
displayCushy('MyScript.spscript/MyScript_main', 'script', true);
```

The three layers are `'modal'`, `'script'`, and `'dev'`. User scripts use the `'script'` layer.
When the GUI engine opens a `.cushy` file it first runs the sibling `.js` of the same name
(`MyScript_main.js`) if present, which sets up the script's functions and state.

Cushy runs this JavaScript every time the script opens **and on every GUI rebuild** — and rebuilds
are not only developer actions: changing Synplant's zoom/scale forces a reload so graphics and
layout coordinates rescale. Scripts must therefore survive being re-run: guard initialization so you
do not clobber existing global state, e.g.

```javascript
if (!globals.myScript) { myScript = { /* initial state */ }; }
```

Because all scripts share one global object, keep your script's state under a single object named
after the script to avoid colliding with others.

### Mods

A **Mod** is a script that patches Synplant's *own* built-in GUI at load time. Mods live in a `Mods`
subfolder of the Synplant Scripts folder; **every `.js` in `Mods/` is run automatically at startup**
(in alphabetical order).

A Mod registers one or more rewriters with the host helper `addModPatcher`:

```javascript
addModPatcher(modName, cushyName, function (cushyName, cushyContents) {
    // return a modified cushyContents string, or undefined to leave it unchanged
});
```

When the Mods folder exists, the main script installs the engine hook
[`handleCushyPreparation`](#optional-hooks), which runs the registered patchers as each built-in
`.cushy` (e.g. `'Synplant2_main'`, `'Synplant2_dna'`) is loaded. Patchers **string-rewrite the raw
`.cushy`/Makaron source before it is parsed**, injecting views, `@define`s, IVG vector icons, and
click/context actions. A patcher that returns unchanged contents throws (a guard against stale
Mods). Mods also add JavaScript behavior through a global `mods` namespace (e.g.
`mods.favoriteButton = { … }`) that the injected Cushy references. See the bundled Mods (Favorite
Button, Detailed DNA Hints, Graft Onto Branch, Tween Branches) for working examples, and the
separate Mods guide for details.

### GUI Variables

Cushy views interface with your script through GUI variables. A view tied to `myScript.myKnob`
continuously reads it to draw, and writes it when the user interacts. All GUI variable values are
strings (which may contain numbers in decimal text, or Numbstrict for arrays/structures). Cushy
resolves a variable in one of these ways:

-   an existing JS string variable — read and written directly;
-   an existing JS function — called to get the value (Cushy can never set it);
-   an existing JS object — with `get()`, `set(value)`, and optional `touch(beginEdit)` functions;
-   a name that does not exist as a JS variable — Cushy creates a Cushy-only variable (avoid this).

```javascript
myScript.myKnob = {
    get: function () { return '' + ((Math.exp(myScript.myValue) - 1) / 10); },
    set: function (s) { myScript.myValue = Math.log(1 + 10 * +s); }
};
```

`touch(beginEdit)` is called with `true` when the user starts editing (e.g. clicks the knob) and
`false` when they finish. Beyond the per-script variables, Synplant exposes a large set of standard
GUI variables and product variables — these are documented separately in the Cushy Variables
reference.

### GUI Actions

When the user clicks a button or selects a menu item, Cushy performs a GUI action — either a built-in
action or a JavaScript function you provide. Actions receive a single string parameter in its raw,
unparsed form (a quoted string still carries its quotes; use `unescape` to strip them). You may
implement an action as:

-   a function with the action's name (receives the parameter), or
-   an object with an `execute(param)` function and optional `enabled(param)` and `checked(param)`
    functions returning booleans.

### Optional Hooks

A script may define these global hook functions, which the host calls if present:

    handleCushyPreparation(cushyName, cushyContents) → string | undefined
        Called as each .cushy is loaded; return modified contents to rewrite it, or undefined to
        leave it unchanged. This is the mechanism Mods use.

    handleCushyTrace(text) → void
        Receives trace text from the Cushy/host layer.

### Performance Notes

JavaScript runs on the UI thread and freezes the interface while it executes, with a 20-second
suspension limit per call. Keep per-frame work (GUI variable getters, animations) minimal; cache
results and use [`getElementId('patch')`](#getelementid) to avoid recomputing when nothing changed.
For heavy work, do it in response to an explicit user action, not in a continuously polled getter.
Prefer [`getMonotonicTime()`](#getmonotonictime) for any timing logic.
