/**
 * 
 * @file Synplant 2.0 JS API Reference
 * 
 */

declare type Byte = number
declare type Integer = number

interface ParamInfo<ParamType> {
	readonly NAME: ParamType,
	readonly STEPS: null | Integer,
	readonly CHOICES: null | readonly string[]
	readonly DEFAULT: number
}
declare const BRANCH_COUNT: Integer
declare const PROGRAM_COUNT: Integer
declare const PARAMS: ParamInfo<ParamId>[]
declare const GENES: ParamInfo<GenomeParamId>[]
declare const CONTROLS: ParamInfo<ControlParamId>[]
declare const PARAM_INDEXES: { [name in ParamId]: Integer }
declare const DIR_SLASH: string;

declare function print(v: any): void
declare function ask(caption: string, defaultReply?: string): string | null

declare function getMonotonicTime(): number;

declare type AlertType = "plain" | "question" | "warning" | "info" | "error"
declare type AlertConfig = "ok" | "ok cancel" | "retry cancel" | "yes no" | "yes no cancel" | "abort retry ignore"
declare type AlertButton = "ok" | "cancel" | "retry" | "yes" | "no" | "abort" | "ignore"

declare function display(message: string, alertType?: AlertType, buttons?: AlertConfig, defaultButton?: AlertButton): AlertButton

declare type BrowserType = "open" | "save" | "folder"
/**
	Special recognized filetypes: "synplant", "synp", "scmc", "mid", "wav", "wave", "aiff", "aifc", "aif", "afc", "txt", "js"
	If fileTypes is null, all files are accepted
	If fileTypes contains audio file extensions, a sample preview is enabled
	If fileTypes are only "synplant" and / or "synp", the patch browser with preview will be used
	defaultFileName is only used for save browser, do *not* include file extension
	If initialDir is null, a directory is chosen automatically based on the first extension in fileTypes
*/
declare function browse(browserType?: BrowserType, fileTypes?: string | string[], initialDir?: string, defaultFileName?: string): string | null

/** Translates a string or returns the same string if no translation was found. */
declare function translate(s: string): string

declare function getCushyVariable(guiVariable: string, utf8?: boolean): string
declare function editCushyVariable(guiVariable: string, beginEdit: boolean): void
declare function setCushyVariable(guiVariable: string, value: string, underEdit?: boolean, utf8?: boolean): boolean
declare function performCushyAction(action: string, params?: string): boolean
declare function saveUndo(description: string, collapse?: boolean): void

interface FileInfo {
	/** Filename and extension (but not path). */
	name: string
	size: Integer
	created: Date
	modified: Date
	isDirectory: boolean
	isReadOnly: boolean
	macFileType: string
}

declare type FileEncoding = 'utf-8' | 'iso-8859-1' | 'binary';	// utf-8 is default

declare function dir(path: string, filter?: string | string[]): FileInfo[]	// extensions should not have leading '.', special extension: "/" for directories
declare function fileInfo(path: string): FileInfo | null
declare function copyFile(fromPath: string, toPath: string): void;
declare function eraseFile(path: string): void;
declare function moveFile(fromPath: string, toPath: string): void;
declare function makeDir(path: string): void;
declare function splitPath(path: string): [string, string, string];
declare function fullPath(base?: string, relative?: string): string;
declare function load(filePath: string, encoding: 'binary'): Byte[];
declare function load(filePath: string, encoding?: 'utf-8' | 'iso-8859-1'): string;
declare function run(filePath: string): void;
declare function save(filePath: string, data: string|Byte[], encoding?: FileEncoding): void;
declare function readClipboard(): string | null;
declare function writeClipboard(data: string): void;

declare type NumbstrictSupportedType = string | number | boolean | object
declare function composeNumbstrict(v: NumbstrictSupportedType, multiLine?: boolean, brackets?: boolean): string
declare function parseNumbstrict(s: string): NumbstrictSupportedType

declare type GUIVariableFunction = { (): string }
declare type GUIVariableObject = {
	get?: GUIVariableFunction
	set?: { (value: string): void }
	touch?: { (beginEdit: boolean): void }
// FIX:	editable?: { (): boolean }
}
declare type GUIVariable = GUIVariableObject | GUIVariableFunction | string

declare type GUIActionFunction = { (param: string): void }
declare type GUIActionObject = {
	execute?: GUIActionFunction
	checked?: { (param: string): boolean } | { (): boolean } | boolean
	enabled?: { (param: string): boolean } | { (): boolean } | boolean
}
declare type GUIAction = GUIActionObject | GUIActionFunction | string


declare type ControlParamId =
	"modWheel" | "rotation" | "tuning" | "atonality" | "effect" | "release" | "volume" | "wheelTarget" | "wheelScale" | "velSens" | "glideTime" | "voiceMode" | "bulbMode" | "tempoSync"
declare type BranchParamId =
	"branch1" | "branch2" | "branch3" | "branch4" | "branch5" | "branch6" | "branch7" | "branch8" | "branch9" | "branch10" | "branch11" | "branch12" |
	"branchLock1" | "branchLock2" | "branchLock3" | "branchLock4" | "branchLock5" | "branchLock6" | "branchLock7" | "branchLock8" | "branchLock9" | "branchLock10" | "branchLock11" | "branchLock12" |
	"branchVolume1" | "branchVolume2" | "branchVolume3" | "branchVolume4" | "branchVolume5" | "branchVolume6" | "branchVolume7" | "branchVolume8" | "branchVolume9" | "branchVolume10" | "branchVolume11" | "branchVolume12"
declare type LayerParamId =
	"enableLayer1" | "enableLayer2" | "enableLayer3" | "enableLayer4" | "enableLayer5" | "enableLayer6" | "enableLayer7" | "enableLayer8" | "enableLayer9" | "enableLayer10" | "enableLayer11" | "enableLayer12"
declare type GenomeParamId =
	"env_time" | "env_loop" | "env_tilt" | "env_kf" | "vol_atk" | "vol_dcy" | "vol_sus" | "vol_fade" | "mod_atk" | "mod_dcy" | "mod_sh" | "mod_vel" | "lfo_rate" | "lfo_amt" | "lfo_bal" | "lfo_dly" | "a_form" | "a_noise" | "a_color" | "a_freq" | "a_mod" | "b_form" | "b_noise" | "b_freq" | "b_mod" | "b_sh" | "fm_amt" | "fm_mod" | "sub_am" | "osc_mix" | "mix_mod" | "flt_type" | "flt_freq" | "flt_mod" | "flt_sep" | "flt_q" | "flt_kf" | "saturate" | "rvb_mix" | "rvb_atk" | "rvb_len" | "rvb_damp" | "rvb_chor" | "rvb_size" | "adj_bass" | "adj_treb" | "adj_pan" | "adj_clip"

declare type ParamId = ControlParamId | BranchParamId | LayerParamId | GenomeParamId

interface Branch {
	id: Integer
	length: number
	volume: number
	explicit?: null | number[];
}

interface Layer {
	enabled: number
}

declare type PatchGenome = { [key in GenomeParamId]: number }
interface Patch {
	implementation: Integer
	name: string
	/** When updating patch, the filename of `path` has priority over `name`. */
	path: string | null
	modified: boolean
	/** Unique identifier (assigned automatically by `setElement` and by all other modifications). */
	id: Integer
	/** Used to determine if audio engine should smooth parameters while playing or not. If set to null, `setElement` will automatically assign a unique patchId. This is expected when a distinct new patch is created from loading, randomization etc. */
	patchId: Integer | null
	/** Used to determine atonality detuning on branches. If set to null, `setElement` will automatically assign a unique seedId. */
	seedId: Integer | null
	pitchAdjust: number
	control: { [key in ControlParamId]: number }
	genome: PatchGenome
	branches: Branch[]
	legacyMode: boolean
	layers: Layer[]
}

declare type VelocityCurveType = "low" | "normal" | "high" | "fixed"
declare type PressureCurveType = "soft" | "normal" | "hard" | "off"
interface MidiConfig {
	sourcePath: string | null
	sourceText: string | null
	
	inputChannel: Integer | null
	outputChannel: Integer | null
	programChanges: boolean
	pitchWheelRange: Integer
	pitchWheelOnHeldOnly: boolean

	velocityCurve: VelocityCurveType
	notesSelectsBranch: boolean
	mouseClickVelocity: Integer

	minPolyphony: Integer
	maxPolyphony: Integer
	pressureCurve: PressureCurveType

	masterTuning: number

	controlCC: {
		[key in ControlParamId]: Integer | null
	}
	genomeCC: {
		[key in GenomeParamId]: Integer | null
	}
	branchesCC: (Integer | null)[]
}

interface GCResults {
	preCount: Integer
	preSize: Integer
	pooled: Integer
	postCount: Integer
	postSize: Integer
}

declare function getElementId(type: "patch"): Integer	// only "patch" has element id

declare function createElement(type: "patch"): Patch
declare function getElement(type: "patch"): Patch
declare function setElement(type: "patch", patch: Patch): Integer
declare function createElement(type: "midiConfig"): MidiConfig
declare function getElement(type: "midiConfig"): MidiConfig
declare function setElement(type: "midiConfig", config: MidiConfig): void

declare function isMarshaledFormat(type: "patch" | "midiConfig", source: string): boolean
declare function marshal(type: "patch", source: Patch, forFile?: boolean): string
declare function unmarshal(type: "patch", source: string): Patch
declare function marshal(type: "midiConfig", source: MidiConfig, forFile?: boolean): string
declare function unmarshal(type: "midiConfig", source: string): MidiConfig

declare function spawnPatch(patch: Patch, branchNumber: Integer, newSeedId?: Integer): Patch
declare function setPreview(patch?: Patch): void

declare function editParam(param: number | ParamId, beginEdit?: boolean): void
declare function getParam(param: number | ParamId): number
declare function setParam(param: number | ParamId, value: number): void
declare function paramText(param: number | ParamId, value: number, highPrecision?: boolean): string
declare function paramValue(param: number | ParamId, value: string): number
declare function sendMidi(status: Integer, data1?: Integer, data2?: Integer): void
declare function gc(): GCResults;

// returned pitch is in floating point midi note format (60 = C3), returned volume is in decibels (0dB = nominal level)
declare function analyzePatchAudio(patch: Patch, midiNote: Integer, midiVelocity: Integer
		, maxHeld: number, maxSeconds: number, analyzePitch: boolean, analyzeVolume: boolean
		, sampleRate?: number /* = 44100 */, randomSeed?: Integer /* = 1 */, initLFOPhase?: number /* = 0.25 */)
		: { pitch?: number, volume?: number }

declare function deriveOpenPatchDir(): string | null;

interface PapagenoConfiguration {
/* these can all be short keys now:
	netFilePath: string
	stalkCount: Integer
	populationSize: Integer                	// larger populationSize = more unified results as more variations are tested in each stalk
	maxIterations: Integer
	shuffleInitialParams: boolean			// shuffle order of params for initial predictions
	softMaxConfidence: number				// neural net confidence, 1.0 = standard, higher = less random distribution
	wideWindowWeight: number                // spectrogram correlation weights
	narrowWindowWeight: number              // - " -
	narrowerWindowWeight: number            // - " -
	meanMatrixWeight: number                // statistical matrix correlation weights
	stddevMatrixWeight: number              // - " -
	horizontalGradientMatrixWeight: number  // - " -
	verticalGradientMatrixWeight: number    // - " -
	selectSproutCandidateCount: Integer    	// larger selectSproutCandidateCount = less options are explored as poorer solutions are ignored (but may still exist)
	selectTriangularDistribution: boolean
	replaceSproutCandidateCount: Integer   	// larger replaceSproutCandidateCount = less options are explored as poorer solutions are replaced faster (= more locally optimal solutions)
	replaceTriangularDistribution: boolean
	climbConstant: number   	            // higher = more likely a less good solution replaces a better one
	identicalProgramThreshold: number      	// expressed as the squared euclidean distance between all program parameters
	convergeFactor: number
	minDivergeAmount: number
	tacticMinRatio: number
	tacticInertia: number
	tacticUpdateInterval: Integer
	iterationToHeightPower: number
	minDistanceBetweenSolutions: number     // on the stalk
	minImprovementBetweenSolutions: number  // linearized error
	autoSwitchIterations: Integer
	threadsPerCore: number
	maxThreads: Integer
	freeThreads: Integer                    // total thread count = clamp(<cpuCount> * threadsPerCore - freeThreads, 1, maxThreads)
	lowThreadPriority: Integer              // -10 to 10. Windows only: used for 1 physical core (always) + all hyperthreads (when process priority is higher than normal).
	normalThreadPriority: Integer           // -10 to 10.
	highThreadPriority: Integer             // -10 to 10. Foreground windows only: used for all except 1 physical core.
	referenceNormalAmplitude: number
	referencePlaybackGain: number
*/
	minReferenceSpan: number 				// secs
	maxReferenceSpan: number 				// secs

	// used by the UI (not part of the Papageno engine)
	focusIterations: Integer
	startingPointSpread: number
	maxAudioLength: number 					// secs
	zeroCrossingArea: number				// secs
}

interface PapagenoStalkInfo {
	id: Integer                            // random number, unique to this stalk
	iterations: Integer
	height: number
	solutions: Integer
	seed: Patch | null						// if respawned from a patch
}

interface PapagenoSolution {
	patch: Patch                           // seedId will be the unique solution id
	iteration: Integer                     // iteration when this solution was generated
	height: number                         // height (0 to 1) where this solution was found (may be "later" than iteration to maintain distances)
	error: number                          // linearized error
	offset: number                         // found start offset in secs
	duration: number                       // found duration in secs
}

interface PapagenoReferenceInfo {
	path: string
	id: Integer
	length: number		// secs
	start: number
	stop: number
	pitch: number		// octaves (0 is middle-C)
}

interface Papageno {
	initialize(config: PapagenoConfiguration): void
	isInitialized(): boolean
	loadReference(filePath: string, maxLength: number, eraseFile: boolean): void
	updateReferenceRange(start: number, stop: number, zeroCrossStartArea?: number, zeroCrossStopArea?: number): void
	startOrStopReferencePlayback(doPlay?: boolean): void
	getReferenceInfo(): PapagenoReferenceInfo | null
	getReferenceDisplayData(from: number, to: number, step: number): number[]	// returns pairs of min/max for each step
	getReferencePlaybackPosition(): number | null
	getStalkCount(): Integer
	getStalkInfo(stalkNumber: Integer): PapagenoStalkInfo
	getSolution(stalkNumber: Integer, solutionNumber: Integer): PapagenoSolution
	startSearch(): void
	stopSearch(): void
	isSearching(): boolean
	finishedSearching(): boolean
	getActiveStalkNumber(): Integer
	focusOnStalk(stalkNumber: Integer | null, iterations?: Integer): void
	respawnStalk(stalkNumber: Integer, startingPoint?: Patch | null, startingPointSpread?: number): void
	getTacticsSuccessRatios(stalkNumber: Integer): { crossOrNet: number[], reviseCounts: number[] }
	getNetInfo(): { name: string, date: Date, codeSize: Integer, pdResolution: Integer }
}
declare var papageno: Papageno

// optional hooks
declare function handleCushyPreparation(cushyName: string, cushyContents: string): string | undefined;
declare function handleCushyTrace(text: string): void;
