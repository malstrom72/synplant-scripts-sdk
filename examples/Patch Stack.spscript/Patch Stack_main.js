// Patch Stack_main.js - GUI engine for the Patch Stack generator.
//
// Live direct-edit: the panel builds a Layered stack patch from up to 3 source patches and writes it
// straight to the live patch via setElement. Discrete edits create undo steps before rebuilding;
// continuous knobs create one undo step per gesture. A stable stack patch id keeps edits smooth.
//
// Reconciliation: patch.identity changes from our own writes, host undo/redo, saves, loads, and main
// UI edits. We keep a bounded identity->slot-model history for every patch this panel writes during
// the current engine session. If host undo/redo returns to one of those identities, we restore the
// matching private model and stay in sync; save/metadata echoes with the same patchId also stay in
// sync. Unknown identities show out-of-sync because the slot model cannot be reconstructed from the
// generated patch.
//
// Vendors the grafting helpers from snippets/grafting.js. ES3 style.

if (!this.patchStack) {
	patchStack = {
		windowPosition: "",
		windowZOrder: "",
		slots: [
			{ path: null, dir: null, name: "", patch: null, enabled: true, level: 0.5, branchIndex: -1, transpose: 0 },
			{ path: null, dir: null, name: "", patch: null, enabled: true, level: 0.5, branchIndex: -1, transpose: 0 },
			{ path: null, dir: null, name: "", patch: null, enabled: true, level: 0.5, branchIndex: -1, transpose: 0 }
		],
		mainIndex: 0,
		spread: 0.5,   // UI spread amount; maps to adj_pan 0.0..0.5
		detune: 0.0,   // UI detune: first half is atonality, second half adds layer pitch spread
		current: null, // built stack patch (also written live)
		stackPatchId: null, // stable across the session so knob/level edits smooth instead of retriggering
		stackSeedId: null,
		lastPatchId: 0,
		livePatchId: 0, // latest patch.identity written by Patch Stack and matching the current slot model
		outOfSync: false, // true once the live patch has been changed outside the panel (undo/redo, load, main-UI edit)
		// identity -> slot-model snapshot for every patch this panel has written this session. Host undo/redo
		// restore the exact patch.identity we wrote (verified: they do not mint fresh ids), so on a returning
		// identity we can restore the matching UI instead of detaching. In-memory only: after save/reload it
		// is gone and identities are re-minted, which is fine -- there is nothing to reconcile against then.
		history: {},
		historyOrder: [] // insertion order of history keys, for bounded eviction (identities are monotonic)
	};
}

(function () {
	var me = this.patchStack;

	// State migration: the patchStack object persists across reloads, so slots saved before newer
	// fields existed can lack them. Backfill missing keys and repair non-finite numeric values.
	var migrateDefaults = freshSlot();
	for (var mi = 0; mi < me.slots.length; ++mi) {
		var migrateSlot = me.slots[mi];
		for (var mk in migrateDefaults) { if (migrateSlot[mk] === undefined) { migrateSlot[mk] = migrateDefaults[mk]; } }
		if (!(migrateSlot.transpose >= -24 && migrateSlot.transpose <= 24)) { migrateSlot.transpose = 0; }
		if (!(migrateSlot.level >= 0 && migrateSlot.level <= 1)) { migrateSlot.level = 0.5; }
	}
	// Top-level field added after the persisted object existed: backfill so a reload of an older state
	// starts in sync rather than reading `undefined` (which would render as a hidden overlay anyway, but
	// keep the flag a real boolean for the writeLive/refresh logic below).
	if (me.outOfSync === undefined) { me.outOfSync = false; }
	if (me.livePatchId === undefined) { me.livePatchId = 0; }
	// Reconciliation history added after the persisted object existed: a reload starts with an empty map
	// (nothing to reconcile against yet -- the first write repopulates it) rather than reading undefined.
	if (!me.history) { me.history = {}; }
	if (!me.historyOrder) { me.historyOrder = []; }
	if (!(me.spread >= 0 && me.spread <= 1)) { me.spread = 0.5; }
	if (!(me.detune >= 0 && me.detune <= 1)) { me.detune = 0.0; }

	var SLOT_COUNT = 3;
	var HISTORY_LIMIT = 64; // bound the identity->snapshot reconciliation map (see me.history)
	// In Synplant's bulb at rotation 0, branch 6 renders at the TOP (12 o'clock); branch 0 is bottom.
	// Placement uses branch 0 for the single/center slot and branches 3/9 for left/right spread.
	var CENTER_BRANCH = 0;          // straight down / center pan
	var SIDE_BRANCHES = [3, 9];     // 9 o'clock (pans left), 3 o'clock (pans right)

	// --- vendored from snippets/grafting.js ---------------------------------------------------

	function calcBranchPitch(patch, branchIndex) {
		function branchToSector() {
			return (branchIndex + Math.round(patch.control.rotation * BRANCH_COUNT)) % BRANCH_COUNT;
		}
		switch (paramText('bulbMode', patch.control.bulbMode)) {
			case 'standard': return branchToSector() / 12;
			case 'velocity': return 0.0;
			case 'ranges': return (branchToSector() - 6) / 2;
			case 'layered': return 0.0;
		}
		return 0.0;
	}

	// `transposeOcts` (optional) transposes the grafted layer by that many OCTAVES; may be fractional.
	function graftPatchOntoBranch(targetPatch, sourcePatch, branchIndex, allowTargetRetune, transposeOcts) {
		function calcFilterCutoff(fltFreq, fltType) {
			var K = 5.358983848622458;
			var f = 20 * cube(1.46415888336127788924 * fltFreq - 0.46415888336127788924);
			if (fltType < 1 / 3 && f > K / 2) { f = lerp(K - (K * K / 4) / f, f, square(fltType * 3)); }
			return f;
		}
		function calcFilterFreq(cutoff, fltType) {
			var K = 5.358983848622458;
			if (fltType < 1 / 3 && cutoff > K / 2) {
				var b = Math.max(fltType * fltType, 1e-8);
				var a = (9 * b - 1);
				cutoff = (a * K + cutoff + Math.sqrt(cutoff * cutoff - (a * K * (K - 2 * cutoff)))) / (18 * b);
			}
			return (Math.cbrt(cutoff / 20) + 0.46415888336127788924) / 1.46415888336127788924;
		}
		function productLogApprox(x) {
			assert(x > 0);
			var log = Math.log, y = (x > Math.E ? log(x) - log(log(x)) : x / Math.E);
			y = y / (1 + y) * (1 + log(x / y));
			y = y / (1 + y) * (1 + log(x / y));
			return y / (1 + y) * (1 + log(x / y));
		}
		function rescaleTime(genome, timeModifier) {
			var INFINITE_ENV_TIME = 0.9 - 0.9 / 20000, MOD_SH_THRESHOLD = Math.log(20000 / 21) / Math.log(50000),
				VOL_FADE_STARTS_AT = 0.75, LN100 = Math.log(100), MIN_ENV_TIME = 0.02, MAX_ENV_TIME = 20;
			if (genome.env_time < INFINITE_ENV_TIME) {
				var normEnvTime = LN100 * (1 - genome.env_time / 0.9);
				genome.env_time = clamp((1 - productLogApprox(normEnvTime * Math.exp(normEnvTime - Math.LN2 * timeModifier))
						* (1 / LN100)) * 0.9, 0, 1);
			}
			var envLoopDelta = timeModifier * (0.8 * Math.LN2 / Math.log(MAX_ENV_TIME / MIN_ENV_TIME));
			genome.env_loop = clamp(Math.min(genome.env_loop, (timeModifier <= -0.00001 ? 0.8 : 1)) + envLoopDelta, 0, 1);
			if (genome.mod_sh >= MOD_SH_THRESHOLD) {
				genome.mod_sh = clamp(genome.mod_sh + timeModifier * (Math.LN2 / (10 * Math.log(5) + Math.log(256))), 0, 1);
			}
			var volFade = genome.vol_fade;
			if (volFade >= VOL_FADE_STARTS_AT + 0.00001) {
				var normVolFade = LN100 * scale(volFade, VOL_FADE_STARTS_AT, 1, 0, 1);
				genome.vol_fade = clamp(scale(productLogApprox(normVolFade * Math.exp(normVolFade - Math.LN2 * timeModifier))
						* (1 / LN100), 0, 1, VOL_FADE_STARTS_AT, 1), 0, 1);
			}
		}
		// --- Re-pitching -------------------------------------------------------------------------
		// Pitch offset (octaves) is split across genome.a_freq (the "A reference" gene, [0,1] over a
		// 6-octave span so ONE_OCTAVE = 1/6 in a_freq units), control.tuning (+/-1 octave) and
		// pitchAdjust (a whole-octave accumulator). retuneGenome shifts a genome by `retune` OCTAVES
		// while keeping its TIMBRE: it cancels the envelope + filter key-follow so it sounds the same,
		// just higher/lower. Full line-by-line annotation lives in snippets/grafting.js.
		function retuneGenome(genome, retune) {
			if (Math.abs(retune) < 1e-6) { return; }
			genome.a_freq += retune * ONE_OCTAVE;                       // shift the reference pitch...
			while (genome.a_freq > 1) { genome.a_freq -= ONE_OCTAVE; }  // ...wrap into [0,1] (safety net;
			while (genome.a_freq < 0) { genome.a_freq += ONE_OCTAVE; }  //    callers carry octaves elsewhere)
			// envelope key-follow: cancel the pitch-induced envelope speed change so timbre is preserved
			var envKF = square(Math.max(genome.env_kf - 0.5, 0) * 2) * 2;
			if (envKF !== 0) { rescaleTime(genome, -retune * envKF); }
			// filter key-follow: hold the cutoff's relative position when it doesn't fully track pitch
			var filterKF = clamp(genome.flt_kf * 2 - 0.5, 0, 1);
			if (filterKF !== 1) {
				genome.flt_freq = clamp(calcFilterFreq(calcFilterCutoff(genome.flt_freq, genome.flt_type)
						+ (filterKF - 1) * retune, genome.flt_type), 0, 1);
			}
		}
		function calcEffectiveBranchLength(patch, index) {
			var length = patch.branches[index].length;
			var wheelTarget = paramText('wheelTarget', patch.control.wheelTarget);
			if (wheelTarget === 'growth +' || wheelTarget === 'growth -') {
				length = lerp(length, (wheelTarget === 'growth +' ? 1 : 0), patch.control.modWheel * patch.control.wheelScale);
			}
			return length;
		}
		function getRepresentativeBranchIndex(patch) {
			var sectorIndex = 0;
			switch (paramText('bulbMode', patch.control.bulbMode)) {
				case 'standard':
				case 'velocity': sectorIndex = 0; break;
				case 'ranges': sectorIndex = 6; break;
				case 'layered': {
					sectorIndex = 0;
					for (var i = 0; i < BRANCH_COUNT; ++i) {
						if (patch.layers[i].enabled >= 0.5) { sectorIndex = i; break; }
					}
					break;
				}
			}
			return (sectorIndex + BRANCH_COUNT - Math.round(patch.control.rotation * BRANCH_COUNT)) % BRANCH_COUNT;
		}

		var ONE_OCTAVE = 1 / (main.A_FREQ_MAX_PITCH - main.A_FREQ_MIN_PITCH);
		var targetLength = calcEffectiveBranchLength(targetPatch, branchIndex);
		if (targetLength < 0.01) { return { ok: false, reason: 'branch-too-short' }; }

		var sourceBranchIndex = getRepresentativeBranchIndex(sourcePatch);
		var sourceVolume = toDecibel(calcVolumeGain(sourcePatch.control.volume));
		var targetVolume = toDecibel(calcVolumeGain(targetPatch.control.volume));
		var sourceBranch = sourcePatch.branches[sourceBranchIndex];
		var spawnedSourcePatch = spawnPatch(sourcePatch, sourceBranchIndex);
		// Align source to the branch's pitch, plus the optional per-layer transpose -- both are octave
		// offsets on the source genome, so they fold into one retune (no separate call). sourceRetune
		// (octaves) = source total pitch (pitchAdjust + tuning) - target's - branch positional pitch
		// (0 in layered) + transposeOcts (octaves, may be fractional). The while-loops + targetRetune
		// absorb octave overflow; that re-pitches the shared base but pitchAdjust compensates globally,
		// so only this layer moves. Full annotation in snippets/grafting.js.
		var sourceRetune = (spawnedSourcePatch.pitchAdjust + (spawnedSourcePatch.control.tuning * 2 - 1)
				- (targetPatch.pitchAdjust + (targetPatch.control.tuning * 2 - 1))
				- calcBranchPitch(targetPatch, branchIndex)
				+ (transposeOcts || 0));
		var targetRetune = 0;
		var sourceGenome = spawnedSourcePatch.genome;
		var targetGenome = targetPatch.genome;

		while (sourceGenome.a_freq + sourceRetune * ONE_OCTAVE < 0) { sourceRetune += 1; targetRetune += 1; }
		while (sourceGenome.a_freq + sourceRetune * ONE_OCTAVE > 1) { sourceRetune -= 1; targetRetune -= 1; }
		if (targetRetune !== 0 && !allowTargetRetune) { return { ok: false, reason: 'target-retune-required', targetRetune: targetRetune }; }

		retuneGenome(targetGenome, targetRetune);
		retuneGenome(sourceGenome, sourceRetune);
		targetPatch.pitchAdjust -= targetRetune;

		var sourceEffect = spawnedSourcePatch.control.effect * 2 - 1;
		var sourceWetAmount = sourceGenome.rvb_mix;
		if (sourceEffect >= 0) { sourceWetAmount = scale(sourceEffect, 0, 1, sourceWetAmount, 1); }
		else { sourceWetAmount = scale(sourceEffect, 0, -1, sourceWetAmount, 0); }
		var targetEffect = targetPatch.control.effect * 2 - 1;
		if (targetEffect >= 0) { sourceWetAmount = (targetEffect - sourceWetAmount) / (targetEffect - 1); }
		else { sourceWetAmount = sourceWetAmount / (1 + targetEffect); }
		sourceGenome.rvb_mix = clamp(sourceWetAmount, 0, 1);

		var explicit = [];
		for (var i = GROWABLE_GENE_COUNT; --i >= 0;) {
			var name = GENES[i].NAME;
			var v = (sourceGenome[name] - targetGenome[name]) / targetLength;
			explicit[i] = (Math.abs(v) < 1e-6 ? 0 : v);
		}
		var targetBranch = targetPatch.branches[branchIndex];
		targetBranch.explicit = explicit;
		targetBranch.id = sourceBranch.id;
		targetBranch.volume = clamp(sourceBranch.volume + (sourceVolume - targetVolume) / 40, 0, 1);
		return { ok: true, targetRetune: targetRetune };
	}

	// --- helpers ------------------------------------------------------------------------------

	// Clone a loaded source patch before using it as the mutable stack base.
	function clonePatch(patch) { return unmarshal('patch', marshal('patch', patch, false)); }

	function freshSlot() {
		return { path: null, dir: null, name: "", patch: null, enabled: true, level: 0.5, branchIndex: -1, transpose: 0 };
	}

	function listPatches(folder) {
		if (!folder) { return []; }
		var slash = (folder.charAt(folder.length - 1) === DIR_SLASH ? '' : DIR_SLASH);
		var items = dir(folder, 'synplant');
		var paths = [];
		for (var i = 0; i < items.length; ++i) {
			if (!items[i].isDirectory) { paths.push(folder + slash + items[i].name); }
		}
		paths.sort();
		return paths;
	}

	function loadIntoSlot(index, path) {
		var text = load(path);
		if (!isMarshaledFormat('patch', text)) { display('Not a Synplant patch:\n' + path, 'error'); return false; }
		var patch = unmarshal('patch', text);
		var parts = splitPath(path);
		var slot = me.slots[index];
		slot.path = path;
		slot.dir = parts[0];
		slot.name = (patch.name && patch.name !== '') ? patch.name : parts[1];
		slot.patch = patch;
		slot.enabled = true;
		return true;
	}

	function activeIndices() {
		var a = [];
		for (var i = 0; i < SLOT_COUNT; ++i) {
			if (me.slots[i].patch && me.slots[i].enabled) { a.push(i); }
		}
		return a;
	}
	function spreadToAdjPan(value) {
		return clamp(value, 0, 1) * 0.5;
	}
	function detuneToAtonality(value) {
		return Math.min(clamp(value, 0, 1), 0.5);
	}
	function detunePitchSpreadSemis(value) {
		return clamp((value - 0.5) * 2, 0, 1) * 0.5;
	}
	function detunePitchOffsetSemis(branchIndex, spreadSemis) {
		if (branchIndex === SIDE_BRANCHES[0]) { return -spreadSemis; }
		if (branchIndex === SIDE_BRANCHES[1]) { return spreadSemis; }
		return 0;
	}

	function computePlacement(active, centerIndex) {
		var pos = {};
		var n = active.length;
		if (n === 0) { return pos; }
		if (n === 1) { pos[active[0]] = CENTER_BRANCH; return pos; }
		var s = 0;
		for (var i = 0; i < n; ++i) {
			var idx = active[i];
			if (n >= 3 && idx === centerIndex) { pos[idx] = CENTER_BRANCH; }
			else { pos[idx] = SIDE_BRANCHES[s++]; }
		}
		return pos;
	}

	// --- coined-name generator ----------------------------------------------------------------
	// Names the stack with a short original name blended from the active sources: one representative
	// word per active layer (its first significant word), de-duped, title-cased, up to three. Pure
	// cosmetics -- carries no attribution (that's parked, see PROBABLY-BAD-IDEA-naming-and-attribution).
	// Regenerated on every structural rebuild, so it does NOT yet survive a manual rename.
	var NAME_STOP = { of: 1, the: 1, a: 1, an: 1, and: 1, in: 1, on: 1, to: 1, for: 1, with: 1, my: 1, by: 1, no: 1 };
	function firstNameWord(raw) {
		var s = ('' + raw).replace(/\[[^\]]*\]/g, ' ').replace(/#[^\s#]+/g, ' ').replace(/\.(synplant|synp)$/i, '');
		var words = s.split(/[^A-Za-z]+/);
		for (var i = 0; i < words.length; ++i) {
			var w = words[i];
			if (w.length >= 2 && !NAME_STOP[w.toLowerCase()]) {
				if (w === w.toUpperCase() && w.length <= 3) { return w; }   // keep acronyms (FM, SH)
				return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
			}
		}
		return '';
	}
	function coinName() {
		var picks = [], seen = {};
		for (var i = 0; i < SLOT_COUNT; ++i) {
			var slot = me.slots[i];
			if (!(slot.patch && slot.enabled)) { continue; }
			var w = firstNameWord(slot.name);
			if (w !== '' && !seen[w.toLowerCase()]) { seen[w.toLowerCase()] = 1; picks.push(w); }
		}
		return (picks.length === 0) ? 'Stack' : picks.slice(0, 3).join(' ');
	}

	// --- build / live write -------------------------------------------------------------------

	function buildStack() {
		for (var i = 0; i < SLOT_COUNT; ++i) { me.slots[i].branchIndex = -1; }
		var active = activeIndices();
		if (active.length === 0) { me.current = null; return; }

		var centerIndex = (me.slots[me.mainIndex].patch && me.slots[me.mainIndex].enabled) ? me.mainIndex : active[0];
		var base = clonePatch(me.slots[centerIndex].patch);
		base.control.bulbMode = paramValue('bulbMode', 'layered');
		base.control.wheelTarget = paramValue('wheelTarget', 'growth -');
		base.control.atonality = detuneToAtonality(me.detune);
		base.control.rotation = 0.0;
		base.genome.adj_pan = spreadToAdjPan(me.spread);
		for (var b = 0; b < BRANCH_COUNT; ++b) { base.layers[b].enabled = 0; }

		var pos = computePlacement(active, centerIndex);
		var pitchSpreadSemis = detunePitchSpreadSemis(me.detune);
		for (var k = 0; k < active.length; ++k) {
			var idx = active[k];
			var branchIndex = pos[idx];
			base.branches[branchIndex].length = 1.0;
			// slot.transpose and detune pitch spread are semitones; the graft wants octaves.
			var pitchOffsetSemis = me.slots[idx].transpose + detunePitchOffsetSemis(branchIndex, pitchSpreadSemis);
			var result = graftPatchOntoBranch(base, me.slots[idx].patch, branchIndex, true, pitchOffsetSemis / 12);
			if (result.ok) {
				base.layers[branchIndex].enabled = 1;
				base.branches[branchIndex].volume = clamp(me.slots[idx].level, 0, 1);
				me.slots[idx].branchIndex = branchIndex;
			}
		}
		// Stable identity across rebuilds so edits (knobs, levels, layer swaps) are smoothed by the audio
		// engine rather than retriggering held notes. A null/changing patchId is read as a brand-new
		// patch and retriggers; the stable stack id keeps the live patch updating in place.
		if (me.stackPatchId == null) {
			me.stackPatchId = random.integer();
			me.stackSeedId = random.integer();
		}
		base.patchId = me.stackPatchId;
		base.seedId = me.stackSeedId;
		base.name = coinName();
		me.current = base;
	}

	// --- reconciliation snapshots -------------------------------------------------------------
	// Capture the slot model that produced the current stack, keyed later by the written patch identity.
	// slot.patch is a loaded source patch that buildStack never mutates (it clonePatch-es the base), so we
	// SHARE the reference rather than deep-copying the large patch object -- the snapshot stays cheap.
	// A slot's own enumerable fields are exactly the freshSlot() shape, so a whole-slot shallow copy is
	// equivalent to listing them and stays in sync if freshSlot gains a field. Object.assign is available
	// here (also used by the public-interface block below). The copy shares the immutable `patch` reference.
	function snapshotState() {
		var slots = [];
		for (var i = 0; i < SLOT_COUNT; ++i) { slots.push(Object.assign({}, me.slots[i])); }
		return { slots: slots, mainIndex: me.mainIndex, spread: me.spread, detune: me.detune,
			stackPatchId: me.stackPatchId, stackSeedId: me.stackSeedId };
	}
	// Restore a snapshot into the live model and deterministically rebuild me.current so later scalar edits
	// mutate the right object. Does NOT setElement: the host already holds the restored patch.
	function restoreState(snap) {
		for (var i = 0; i < SLOT_COUNT; ++i) { Object.assign(me.slots[i], snap.slots[i]); }
		me.mainIndex = snap.mainIndex;
		me.spread = snap.spread;
		me.detune = snap.detune;
		me.stackPatchId = snap.stackPatchId;
		me.stackSeedId = snap.stackSeedId;
		buildStack();
	}
	// Memoize the current slot model under a written identity, evicting the oldest when the map is full.
	function recordHistory(id) {
		if (me.history[id] === undefined) { me.historyOrder.push(id); }
		me.history[id] = snapshotState();
		while (me.historyOrder.length > HISTORY_LIMIT) {
			var old = me.historyOrder.shift();
			if (old !== id) { delete me.history[old]; }
		}
	}

	// Write the current stack to the live patch in place (stable id => smooth, no retrigger).
	// setElement copies our object into the engine, so me.current stays ours.
	function writeLive() {
		if (me.current) {
			me.current.modified = true;
			me.livePatchId = setElement('patch', me.current);
			me.lastPatchId = me.livePatchId;
			me.outOfSync = false;
			recordHistory(me.livePatchId);
		}
	}

	// One undo step + rebuild + live write, for discrete structural edits.
	function commit(description) { saveUndo(translate(description)); buildStack(); writeLive(); }

	// --- variable setters ---------------------------------------------------------------------
	// Setters normalize GUI input into persistent state, then either patch the live stack directly or
	// rebuild when grafting input changes. Knob undo checkpoints are created once per gesture by *Var.

	function setLevel(index, value) {
		var level = clamp(+value, 0, 1);
		if (!(level >= 0 && level <= 1)) { level = 0.5; }
		me.slots[index].level = level;
		var bi = me.slots[index].branchIndex;
		if (me.current && bi >= 0) { me.current.branches[bi].volume = level; writeLive(); }
	}
	function setTranspose(index, value) {
		// Cushy may pass knob values as strings. Coerce explicitly for compatibility with the public
		// Synplant/NuXJS runtime, where Math.round string coercion is unreliable.
		var transpose = Math.round(+value);
		if (!(transpose >= -24 && transpose <= 24)) { transpose = 0; }
		me.slots[index].transpose = clamp(transpose, -24, 24);
		buildStack(); writeLive();   // transpose feeds the graft, so the stack must be rebuilt
	}
	function setSpread(value) {
		var spread = clamp(+value, 0, 1);
		if (!(spread >= 0 && spread <= 1)) { spread = 0.5; }
		me.spread = spread;
		if (me.current) { me.current.genome.adj_pan = spreadToAdjPan(spread); writeLive(); }
	}
	function setDetune(value) {
		var detune = clamp(+value, 0, 1);
		if (!(detune >= 0 && detune <= 1)) { detune = 0.0; }
		me.detune = detune;
		if (me.current) { buildStack(); writeLive(); }
	}
	function setEnabled(index, value) {
		me.slots[index].enabled = (value >= 0.5);
		commit(value >= 0.5 ? 'Patch Stack: enable layer' : 'Patch Stack: mute layer');
	}
	function setMainIndex(index, value) {
		if (value >= 0.5 && me.mainIndex !== index) { me.mainIndex = index; commit('Patch Stack: set main layer'); }
	}

	// --- GUI variable objects (get/set), mirror Four Knobs' pattern ---------------------------

	// Live-edit pattern (cf. Synplant2_branchVolumeSliders.js): get reads the model, set creates one
	// undo checkpoint per gesture (touch resets the flag at gesture start) then writes the live patch.
	var LevelVar = createClass({ constructor: function (i) { this.i = i; this.savedUndo = false; },
		get: function () { return me.slots[this.i].level; },
		set: function (v) {
			if (!this.savedUndo) { saveUndo(translate('Patch Stack: layer level'), true); this.savedUndo = true; }
			setLevel(this.i, v);
		},
		touch: function () { this.savedUndo = false; } });
	var TransposeVar = createClass({ constructor: function (i) { this.i = i; this.savedUndo = false; },
		get: function () { return me.slots[this.i].transpose; },
		set: function (v) {
			if (!this.savedUndo) { saveUndo(translate('Patch Stack: transpose'), true); this.savedUndo = true; }
			setTranspose(this.i, v);
		},
		touch: function () { this.savedUndo = false; } });
	var TransposeTextVar = createClass({ constructor: function (i) { this.i = i; },
		get: function () { var t = me.slots[this.i].transpose; return (t > 0 ? '+' + t : '' + t) + ' st'; },
		set: function () {} });
	var LevelTextVar = createClass({ constructor: function (i) { this.i = i; },
		// Keep unary + for the public Synplant/NuXJS runtime, where Math.round string coercion is unreliable.
		get: function () { return Math.round((+me.slots[this.i].level) * 100) + '%'; },
		set: function () {} });
	var NameVar = createClass({ constructor: function (i) { this.i = i; },
		get: function () { return (me.slots[this.i].name !== '') ? me.slots[this.i].name : '(empty)'; },
		set: function () {} });
	var PositionVar = createClass({ constructor: function (i) { this.i = i; },
		get: function () {
			if (!me.slots[this.i].patch) { return '(empty)'; }
			if (!me.slots[this.i].enabled) { return 'muted'; }
			var bi = me.slots[this.i].branchIndex;
			if (bi === CENTER_BRANCH) { return 'center'; }
			if (bi === SIDE_BRANCHES[0]) { return 'hard left'; }
			if (bi === SIDE_BRANCHES[1]) { return 'hard right'; }
			return '';
		},
		set: function () {} });
	var SpreadVar = createClass({ constructor: function () { this.savedUndo = false; },
		get: function () { return me.spread; },
		set: function (v) {
			if (!this.savedUndo) { saveUndo(translate('Patch Stack: spread'), true); this.savedUndo = true; }
			setSpread(v);
		},
		touch: function () { this.savedUndo = false; } });
	var DetuneVar = createClass({ constructor: function () { this.savedUndo = false; },
		get: function () { return me.detune; },
		set: function (v) {
			if (!this.savedUndo) { saveUndo(translate('Patch Stack: detune'), true); this.savedUndo = true; }
			setDetune(v);
		},
		touch: function () { this.savedUndo = false; } });
	// Read-only % readouts for the global knobs, so they match the slot knobs' "level 50%" feedback.
	// Keep unary + for the public Synplant/NuXJS runtime, where Math.round string coercion is unreliable.
	var SpreadTextVar = createClass({ get: function () { return Math.round((+me.spread) * 100) + '%'; }, set: function () {} });
	var DetuneTextVar = createClass({ get: function () { return Math.round((+me.detune) * 100) + '%'; }, set: function () {} });

	// Bulb diagram: a static `bulb.ivg` (file:) draws the dial (ring, ticks, L/R labels, hub) and reads,
	// per position, one colour and one layer-number through `bindings:`. Each position resolves to the
	// active slot there -- its colour + 1-based number -- or to transparent/"" when empty/muted, so
	// muted layers simply vanish. No JS-generated IVG and no per-frame string building: the file is
	// fixed, only the bound values change, and the view re-reads the bindings live.
	var BULB_COLORS = ['#1cb89b', '#e78a3c', '#c75f95'];  // Petrol layer trio (matches the slot badges)
	var BULB_TRANSPARENT = '#00000000';
	function slotAtBranch(branch) {
		for (var i = 0; i < SLOT_COUNT; i++) {
			var slot = me.slots[i];
			if (slot.patch && slot.enabled && slot.branchIndex === branch) { return i; }
		}
		return -1;
	}
	var BulbColorVar = createClass({ constructor: function (branch) { this.branch = branch; },
		get: function () { var i = slotAtBranch(this.branch); return (i >= 0) ? BULB_COLORS[i] : BULB_TRANSPARENT; },
		set: function () {} });
	var BulbNumVar = createClass({ constructor: function (branch) { this.branch = branch; },
		get: function () { var i = slotAtBranch(this.branch); return (i >= 0) ? ('' + (i + 1)) : '0'; },  // 0 = none (IVG guards on > 0)
		set: function () {} });

	// Drives the out-of-sync overlay's group `visibility:` ("true"/"false"). When true the overlay's
	// nop `click` view swallows every click so the locked controls underneath can't clobber the live
	// patch, and the Re-apply button (drawn on top of it) stays hittable.
	var OutOfSyncVar = createClass({
		get: function () { return me.outOfSync ? 'true' : 'false'; },
		set: function () {} });

	// --- first-use rights notice --------------------------------------------------------------
	// Shown once, app-wide: persisted via a preferences.* Cushy variable (survives reloads AND app
	// restarts, unlike the in-memory script state), so it appears the first time Patch Stack is opened
	// and never again. Patch Stack composes a derivative of other creators' patches, so this is the
	// responsibility half of attribution (the credit half is parked for the 2.5 author field; see
	// PROBABLY-BAD-IDEA-naming-and-attribution.md).
	var NOTICE_PREF_KEY = 'preferences.patchStack.noticeSeen';
	var NOTICE_TEXT = 'Patch Stack builds a new patch by layering up to three existing ones.\n\n'
		+ 'The result is a derivative of its source patches. If you share or sell it, make sure you '
		+ 'have the right to redistribute the sounds you started from, and credit the original creators '
		+ "where it's due.";

	// --- public interface (actions + variables referenced by the .cushy) ----------------------

	Object.assign(me, {
		// Opening must not clobber the live patch; the first edit writes it. On first-ever use, show the
		// one-time derivative-works notice (persisted app-wide, so once, not per session).
		initGUI: function (params) {
			if (getCushyVariable(NOTICE_PREF_KEY) !== 'true') {
				display(NOTICE_TEXT);
				setCushyVariable(NOTICE_PREF_KEY, 'true');
			}
		},
		// Fires on `onChanged: patch.identity`. Our own setElement writes echo back through here, but
		// writeLive already stored that id in lastPatchId, so they match and no-op. If host undo/redo
		// returns to any identity in our history, restore the matching slot model. Unknown identities mean
		// the live patch was changed outside the panel (main-UI edit, external load, or history eviction),
		// so we detach until the user re-applies or loads/clears a slot.
		refreshFromPatch: function () {
			var id = getElementId('patch');
			if (id === me.lastPatchId) { return; }
			me.lastPatchId = id;
			if (me.current && id === me.livePatchId) {
				me.outOfSync = false;
				return;
			}
			// Host undo/redo restore the exact identity we wrote (not a fresh id), so any identity in our
			// history is a state this panel authored: restore its slot model and follow the patch instead of
			// detaching. Only identities we never wrote (main-UI edit, external load) fall through to below.
			if (me.current && me.history[id] !== undefined) {
				restoreState(me.history[id]);
				me.livePatchId = id;
				me.outOfSync = false;
				return;
			}
			var patch = getElement('patch');
			if (me.current && patch.patchId === me.stackPatchId && !patch.modified) {
				me.current.path = patch.path;
				me.current.name = patch.name;
				me.current.modified = false;
				me.livePatchId = id;
				me.outOfSync = false;
				return;
			}
			if (me.current) { me.outOfSync = true; }
		},

		slotOpen: function (params) {
			var i = +params;
			var picked = browse('open', 'synplant', me.slots[i].dir || DIRS.PATCHES, null);
			if (picked === null) { return; }
			if (loadIntoSlot(i, picked)) { commit('Patch Stack: load layer'); }
		},
		slotStep: function (index, delta) {
			var slot = me.slots[index];
			var list = listPatches(slot.dir);
			if (list.length === 0) { return; }
			var cur = -1;
			for (var k = 0; k < list.length; ++k) { if (list[k] === slot.path) { cur = k; break; } }
			var next = (cur + delta + list.length) % list.length;
			if (loadIntoSlot(index, list[next])) { commit('Patch Stack: change layer'); }
		},
		slotPrev: function (params) { me.slotStep(+params, -1); },
		slotNext: function (params) { me.slotStep(+params, +1); },
		slotRandom: function (params) {
			var i = +params;
			var list = listPatches(me.slots[i].dir || (DIRS.PATCHES + 'Synplant Patches' + DIR_SLASH + 'All'));
			if (list.length === 0) { return; }
			if (loadIntoSlot(i, list[random.integer(list.length)])) { commit('Patch Stack: random layer'); }
		},
		slotClear: function (params) { me.slots[+params] = freshSlot(); commit('Patch Stack: clear layer'); },

		// Out-of-sync recovery: rebuild the stack from the current slots and overwrite the live patch,
		// re-taking ownership. writeLive stamps lastPatchId and clears outOfSync, so the overlay drops and
		// editing resumes. With no active layers there is nothing to push, so just clear the flag.
		reapply: function () {
			if (activeIndices().length === 0) { me.outOfSync = false; return; }
			saveUndo(translate('Patch Stack: re-apply stack'));
			buildStack();
			writeLive();
		},

		slotEnable: {
			execute: function (params) { setEnabled(+params, me.slots[+params].enabled ? 0 : 1); },
			checked: function (params) { return me.slots[+params].enabled; }
		},
		slotMain: {
			execute: function (params) { setMainIndex(+params, 1); },
			checked: function (params) { return me.mainIndex === +params; }
		},

		levels: [ new LevelVar(0), new LevelVar(1), new LevelVar(2) ],
		levelTexts: [ new LevelTextVar(0), new LevelTextVar(1), new LevelTextVar(2) ],
		transposes: [ new TransposeVar(0), new TransposeVar(1), new TransposeVar(2) ],
		transposeTexts: [ new TransposeTextVar(0), new TransposeTextVar(1), new TransposeTextVar(2) ],
		names: [ new NameVar(0), new NameVar(1), new NameVar(2) ],
		positions: [ new PositionVar(0), new PositionVar(1), new PositionVar(2) ],
		spreadKnob: new SpreadVar(),
		detuneKnob: new DetuneVar(),
		spreadText: new SpreadTextVar(),
		detuneText: new DetuneTextVar(),
		bulbDown: new BulbColorVar(CENTER_BRANCH),
		bulbLeft: new BulbColorVar(SIDE_BRANCHES[0]),
		bulbRight: new BulbColorVar(SIDE_BRANCHES[1]),
		bulbDownNum: new BulbNumVar(CENTER_BRANCH),
		bulbLeftNum: new BulbNumVar(SIDE_BRANCHES[0]),
		bulbRightNum: new BulbNumVar(SIDE_BRANCHES[1]),
		outOfSyncVisible: new OutOfSyncVar()
	});
})();
