# Synplant Cushy Variables and Actions Reference

This reference documents the **GUI variables** and **GUI actions** that Synplant exposes to its
Cushy interface — the values a `.cushy` layout (or a script) can read and write, and the built-in
operations it can trigger. It was written and verified against **Synplant 2.0.2 (build 309)**.

For the JavaScript API (functions, the patch object model, parameters as numbers) see the
*Synplant JS Reference*. For the `.cushy` file format, view types, and layout syntax, see
`CushyLint/cushy.schema`. This document covers the variable and action *namespace* that sits between
those two.

## Table of Contents

-   [How GUI variables work](#how-gui-variables-work)
-   [Constant variables](#constant-variables)
-   [Built-in variables](#built-in-variables)
-   [Parameter variables](#parameter-variables)
-   [Program variables](#program-variables)
-   [MIDI configuration variables](#midi-configuration-variables)
-   [Persisted variables](#persisted-variables)
-   [Feedback variables](#feedback-variables)
-   [Reserved names](#reserved-names)
-   [Standard actions](#standard-actions)

## How GUI variables work

A GUI variable is a named, string-valued slot that the Cushy interface reads to draw views and
writes when the user interacts. A knob bound to `params.volume`, for example, continuously reads it
to position itself and writes it back when dragged.

From a script, GUI variables are reached with three functions (see the JS Reference for full
signatures):

    getCushyVariable(name)                 // read current value as a string
    setCushyVariable(name, value)          // write a value
    performCushyAction(action, params)     // trigger a built-in action

**All values are strings.** Numbers arrive as decimal text (`"0.5362808"`), booleans as `"true"` /
`"false"`, and structured values as Numbstrict text. A script can also *provide* its own variables
by defining matching JavaScript globals; that mechanism is described in the JS Reference under GUI
Variables.

Each variable below is marked **read-only** or **read/write**.

## Constant variables

Read-only values describing the product, platform, build, and installation directories. These never
change during a session.

    MODEL.NAME           string   // display name, e.g. "Synplant"
    MODEL.IDENTIFIER     string   // stable internal id, e.g. "Synplant2"
    MODEL.VERSION        string   // model version

    PLATFORM.OS          string   // 'mac' | 'windows'
    PLATFORM.CPU         string   // 'arm64' | 'x86-64' | 'x86' | 'ppc'

    BUILD.VERSION        string   // e.g. "2.0.2"
    BUILD.NUMBER         string   // e.g. "309"
    BUILD.TARGET         string   // 'Debug' | 'Beta' | 'Release'
    BUILD.DATE           string   // e.g. "Aug 30 2024"
    BUILD.TIME           string
    BUILD.COPYRIGHT      string   // e.g. "2008-2024"
    BUILD.COMPILER       string
    BUILD.LIBS           string
    BUILD.FORMAT         string   // e.g. "Standalone"

    DIRS.BINARY          string   // the folder the plug-in / application resides in
    DIRS.PATCHES         string   // factory patches
    DIRS.DOCUMENTS       string   // Sonic Charge user-documents folder (script-writable)
    DIRS.DOCUMENTATION   string
    DIRS.SUPPORT         string
    DIRS.SCRIPTS         string   // the "Synplant Scripts" folder
    DIRS.SKINS           string   // the "Synplant Skins" folder
    DIRS.PAPAGENO        string   // Genopatch support folder

All `DIRS.*` paths are absolute and end with a directory separator. See the JS Reference for example
values and for the file-access rules that apply to each directory.

## Built-in variables

The core host state. Read-only unless noted.

    patch.name           read/write   // name of the current patch
    patch.identity       read-only    // integer that changes on any edit to the patch
    patch.modified       read-only    // "true" | "false"

    undo.description     read-only    // label of the next undo step, or "" if none
    redo.description     read-only    // label of the next redo step, or "" if none

    isRegistered         read-only    // "true" | "false"
    registrationName     read-only    // registered owner, or "" if unregistered
    trialTimeLeft        read-only    // e.g. "12 days", "1 day", "0 days"
    trialExpired         read-only    // "true" | "false" (never "true" when registered)
    isEnabled            read-only    // "true" when not suspended/bypassed

    uiScale              read/write   // fraction, e.g. "1/1"; writing it forces a GUI rebuild
    programNumber        read/write   // current program slot, 1-based

    midiLearnCC          read/write   // variable name being MIDI-CC-learned, or "" (writable only
                                      // if the host supports MIDI learn)
    midiLearnKey         read/write   // variable name being key-learned, or ""

    window.isFocused     read-only    // "true" | "false"
    window.isVisible     read-only    // "true" | "false"
    window.isMostRecent  read-only    // "true" | "false"

> Writing `uiScale` forces a full GUI rebuild, which re-runs script JavaScript and rescales graphics.
> Treat it as an expensive, user-initiated operation.

## Parameter variables

Every synth parameter is exposed under the `params.` prefix. `<name>` is any control or genome
parameter name (e.g. `volume`, `flt_freq`, `voiceMode`); the full list and the index layout are in
the JS Reference under Parameter Constants.

    params.<name>            read/write   // normalized value 0..1, as decimal text
    params.<name>.human      read/write   // human-readable display text
    params.<name>.name       read-only    // human-readable parameter name
    params.<name>.default    read-only    // default normalized value

Examples (live values):

    params.volume            "0.5362808"
    params.volume.name       "Volume"
    params.volume.human      "2.02 dB"
    params.volume.default    "0.5"
    params.voiceMode.human   "poly"          // stepped params read back their choice label
    params.flt_freq.human    "0.3662"

`params.<name>` is the same value as `getParam('<name>')` in the JavaScript API — the GUI-variable
form is simply the string view of it. Use `.human` for hints and text entry, `.name` for labels, and
`.default` to implement "reset to default".

## Program variables

    programNumber        read/write   // current program slot (1-based); see Built-in variables
    program.<n>.name     read/write   // patch name in slot <n> (1-based)
    program.<n>.key      read-only    // program's key note name, or "" when program keys are off

## MIDI configuration variables

The current MIDI configuration is exposed under `midiConfig.`. (The same data is available as a
structured object through the JavaScript API; these variables are the GUI-facing string view.)

    midiConfig.inputChannel        read/write   // "any" or "1".."16"
    midiConfig.masterTuning        read/write   // A4 frequency in Hz, e.g. "440.0"
    midiConfig.programChanges      read/write   // "true" | "false"
    midiConfig.pitchBendRange      read/write   // semitones, e.g. "12"
    midiConfig.pitchBendHeldOnly   read/write   // "true" | "false"
    midiConfig.cc.<name>           read/write   // MIDI CC number for parameter <name>, or "off"
    midiConfig.assignedCount       read-only    // number of assigned CCs (integer)

When the build exposes program keys, these are also present:

    midiConfig.programKeys.enabled         read/write   // "true" | "false"
    midiConfig.programKeys.baseNoteNumber  read/write   // 1..127
    midiConfig.programKeys.baseNoteName    read/write   // e.g. "c3"

## Persisted variables

Three namespaces store arbitrary string values with different lifetimes. For all three, **reading a
key that does not exist returns an empty string** (not the variable name), and any key may be
written.

    preferences.<key>   read/write   // saved to global preferences immediately on write
    instance.<key>      read/write   // retained while this plug-in instance lives, across GUI
                                     // close/reopen (lost when the instance is removed)
    project.<key>       read/write   // saved and restored with the host song / project state

`preferences.*` writes hit the preferences store immediately, so avoid writing them on every frame.
Use `instance.*` for state that should survive closing and reopening the GUI window, and `project.*`
for state that should travel with the user's saved song.

Keep persisted data small and intentional. Large or frequently changing `preferences.*` values can
make global preference loading/saving heavier, and excessive `project.*` data adds to host project
state. Do not use these namespaces as general caches, logs, or bulk data stores; prefer ordinary
JavaScript state for rebuildable data and `instance.*` for temporary per-instance GUI state.

These namespaces control persistence only. They are not documented as patch undo snapshots; GUI
scripts that mirror patch state should still resync from the patch when `patch.identity` changes
(`getElementId('patch')` is the matching JavaScript API). See [Script State and Undo
Sync](Synplant%20JS%20Reference.md#script-state-and-undo-sync).

## Feedback variables

    feedbacks.<id>      read-only    // product-defined feedback/metering values

`feedbacks.` exposes live, read-only values the product publishes for the GUI (for meters, displays,
and similar). The available identifiers are product- and version-specific.

## Reserved names

When a script defines its own GUI variables, name them under a single object named after your script
(e.g. `myScript.myKnob`) so they cannot collide with the names above or with another script's
variables. Do not define variables that shadow any constant, built-in, or prefixed name documented
here (`params.*`, `program.*`, `midiConfig.*`, `preferences.*`, `instance.*`, `project.*`,
`feedbacks.*`, `window.*`, `MODEL.*`, `PLATFORM.*`, `BUILD.*`, `DIRS.*`).

## Standard actions

Actions are triggered from `.cushy` views or from a script via
`performCushyAction(action, paramsText)`. The parameters are given as Numbstrict text. The standard
actions are listed below; see `CushyLint/cushy.schema` for the generic built-in actions
(`reload`, `launch`, `set`, `batch`, `switch`, `popup`, `edit`, `hint`, `nop`, …) that apply to all
views.

> Several of these change or replace the current patch (`initPatch`, `pastePatch`, `randomizePatch`,
> `switchPatch`, `loadProgramBank`). Trigger them deliberately.

    changeParam   { param: <name>,
                    ( toggle: true | to: <0..1> | by: <delta>
                      | toVariable: <var> | byVariable: <var> ),
                    [ whenEqual: "nothing" | "checked" | "disabled" ] }   // default "checked"
                  // Sets, nudges, or toggles a parameter and reports the change to the host for
                  // automation. Do not prefix <name> with "params."

    initPatch                         // reset all parameters to defaults
    copyPatch                         // copy the patch to the clipboard
    pastePatch                        // paste a patch from the clipboard
    exchangePatch                     // swap patch <-> clipboard
    randomizePatch                    // randomize all parameters (and name)

    openPatch                         // open the load-patch browser
    savePatch                         // open the save-patch browser
    choosePatch                       // open the patch chooser menu
    switchPatch   { step: -1 | 1, wrap: <bool> }     // step to the previous/next patch

    chooseProgram                     // open the program chooser menu
    switchProgram { step: -1 | 1, wrap: <bool> }     // step to the previous/next program slot
    loadProgramBank  <resourceName>   // load a program bank (.fxb)

    undo
    redo

    register                          // open registration
    toggleVersionCheck                // toggle automatic version checking

    resetMidiConfig                   // reset the MIDI configuration to defaults
    loadMidiConfig                    // load a MIDI configuration file
    saveMidiConfig                    // save the MIDI configuration to a file
    makeMidiConfigDefault             // make the current MIDI configuration the default

    sendMidi { message: { <status>, <data1>, [ <data2> ] } }  // send a MIDI message; each byte may
                                                              // be a number, hex, or a <var>

    unitTest [ <iterations> | { [iterations: <int>], [seed: <uint>] } ]   // run internal self-tests
