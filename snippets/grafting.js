// Grafting helper snippet.
//
// Copy this file into your script's IIFE, .spscript main closure, or Mod patcher closure.
// It intentionally defines no globals and has no runtime dependency on the SDK's snippets folder.
//
// Local functions provided to the enclosing private scope:
//   calcBranchPitch(patch, branchIndex) -> pitch offset in octaves
//   copyBranchPatch(sourcePatch, branchIndex) -> patch
//   graftPatchOntoBranch(targetPatch, sourcePatch, branchIndex, allowTargetRetune) -> result
//
// `graftPatchOntoBranch` mutates `targetPatch` on success. Pass a clone when you need to preview,
// prompt, or cancel before committing the returned patch with `setElement('patch', result.patch)`.

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

function copyBranchPatch(sourcePatch, branchIndex) {
    var branchPitch = calcBranchPitch(sourcePatch, branchIndex);
    var sourceBranch = sourcePatch.branches[branchIndex];
    var spawnedPatch = spawnPatch(sourcePatch, branchIndex);
    var pitchAdjust = spawnedPatch.pitchAdjust;
    var newTuning = spawnedPatch.control.tuning * 2 - 1 + branchPitch;
    var wrap = ~~newTuning;
    spawnedPatch.pitchAdjust = pitchAdjust + wrap;
    spawnedPatch.control.tuning = (newTuning - wrap + 1) / 2;

    var branchId = sourceBranch.id;
    for (var i = BRANCH_COUNT; --i >= 0;) {
        spawnedPatch.branches[i].id = branchId;
    }
    return spawnedPatch;
}

function graftPatchOntoBranch(targetPatch, sourcePatch, branchIndex, allowTargetRetune) {
    function calcFilterCutoff(fltFreq, fltType) {
        var K = 5.358983848622458;
        var f = 20 * cube(1.46415888336127788924 * fltFreq - 0.46415888336127788924);
        if (fltType < 1 / 3 && f > K / 2) {
            f = lerp(K - (K * K / 4) / f, f, square(fltType * 3));
        }
        return f;
    }

    function calcFilterFreq(cutoff, fltType) {
        var K = 5.358983848622458;
        if (fltType < 1 / 3 && cutoff > K / 2) {
            var b = Math.max(fltType * fltType, 1e-8);  // prevent division by zero
            var a = (9 * b - 1);
            cutoff = (a * K + cutoff + Math.sqrt(cutoff * cutoff - (a * K * (K - 2 * cutoff)))) / (18 * b);
        }
        return (Math.cbrt(cutoff / 20) + 0.46415888336127788924) / 1.46415888336127788924;
    }

    function productLogApprox(x) {
        // See https://en.wikipedia.org/wiki/Lambert_W_function
        assert(x > 0);
        var log = Math.log, y = (x > Math.E ? log(x) - log(log(x)) : x / Math.E);
        y = y / (1 + y) * (1 + log(x / y));
        y = y / (1 + y) * (1 + log(x / y));
        return y / (1 + y) * (1 + log(x / y));
    }

    function rescaleTime(genome, timeModifier) {
        // Intricate math copied from Synplant's native implementation. No clamping on output.
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

    function retuneGenome(genome, retune) {
        if (Math.abs(retune) < 1e-6) {
            return;
        }
        genome.a_freq += retune * ONE_OCTAVE;
        while (genome.a_freq > 1) {
            genome.a_freq -= ONE_OCTAVE;
        }
        while (genome.a_freq < 0) {
            genome.a_freq += ONE_OCTAVE;
        }
        var envKF = square(Math.max(genome.env_kf - 0.5, 0) * 2) * 2;
        if (envKF !== 0) {
            var timeModifier = -retune * envKF;
            rescaleTime(genome, timeModifier);
        }
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
                    if (patch.layers[i].enabled >= 0.5) {
                        sectorIndex = i;
                        break;
                    }
                }
                break;
            }
        }
        return (sectorIndex + BRANCH_COUNT - Math.round(patch.control.rotation * BRANCH_COUNT)) % BRANCH_COUNT;
    }

    var ONE_OCTAVE = 1 / (main.A_FREQ_MAX_PITCH - main.A_FREQ_MIN_PITCH);
    var targetLength = calcEffectiveBranchLength(targetPatch, branchIndex);
    if (targetLength < 0.01) {
        return {
            ok: false,
            reason: 'branch-too-short',
            message: 'You need to extend the destination branch a little.'
        };
    }

    var sourceBranchIndex = getRepresentativeBranchIndex(sourcePatch);
    var sourceVolume = toDecibel(calcVolumeGain(sourcePatch.control.volume));
    var targetVolume = toDecibel(calcVolumeGain(targetPatch.control.volume));
    var sourceBranch = sourcePatch.branches[sourceBranchIndex];
    var spawnedSourcePatch = spawnPatch(sourcePatch, sourceBranchIndex);
    var sourceRetune = (spawnedSourcePatch.pitchAdjust + (spawnedSourcePatch.control.tuning * 2 - 1)
            - (targetPatch.pitchAdjust + (targetPatch.control.tuning * 2 - 1))
            - calcBranchPitch(targetPatch, branchIndex));
    var targetRetune = 0;
    var sourceGenome = spawnedSourcePatch.genome;
    var targetGenome = targetPatch.genome;

    while (sourceGenome.a_freq + sourceRetune * ONE_OCTAVE < 0) {
        sourceRetune += 1;
        targetRetune += 1;
    }
    while (sourceGenome.a_freq + sourceRetune * ONE_OCTAVE > 1) {
        sourceRetune -= 1;
        targetRetune -= 1;
    }

    if (targetRetune !== 0 && !allowTargetRetune) {
        return {
            ok: false,
            reason: 'target-retune-required',
            message: 'In order to perform this graft, some genes of the destination patch needs updating.\n\nThis can affect the sound of existing branches.'
        };
    }

    retuneGenome(targetGenome, targetRetune);
    retuneGenome(sourceGenome, sourceRetune);
    targetPatch.pitchAdjust -= targetRetune;

    var sourceEffect = spawnedSourcePatch.control.effect * 2 - 1;
    var sourceWetAmount = sourceGenome.rvb_mix;
    if (sourceEffect >= 0) {
        sourceWetAmount = scale(sourceEffect, 0, 1, sourceWetAmount, 1);
    } else {
        sourceWetAmount = scale(sourceEffect, 0, -1, sourceWetAmount, 0);
    }

    var targetEffect = targetPatch.control.effect * 2 - 1;
    if (targetEffect >= 0) {
        sourceWetAmount = (targetEffect - sourceWetAmount) / (targetEffect - 1);
    } else {
        sourceWetAmount = sourceWetAmount / (1 + targetEffect);
    }
    sourceGenome.rvb_mix = clamp(sourceWetAmount, 0, 1);

    var explicit = [ ];
    for (var i = GROWABLE_GENE_COUNT; --i >= 0;) {
        var name = GENES[i].NAME;
        var v = (sourceGenome[name] - targetGenome[name]) / targetLength;
        explicit[i] = (Math.abs(v) < 1e-6 ? 0 : v);
    }

    var targetBranch = targetPatch.branches[branchIndex];
    targetBranch.explicit = explicit;
    targetBranch.id = sourceBranch.id;
    targetBranch.volume = clamp(sourceBranch.volume + (sourceVolume - targetVolume) / 40, 0, 1);

    return {
        ok: true,
        patch: targetPatch
    };
}
