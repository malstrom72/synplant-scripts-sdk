(function inversePlant() {
    var branchIndex = selected('branch');
    if (branchIndex !== null) {
        saveUndo(translate('Inverse Plant'));
        var sourcePatch = getElement('patch');
        var sourceControl = sourcePatch.control;
        var sourceWheelTarget = sourceControl.wheelTarget;
        var wheelTargetString = paramText('wheelTarget', sourceWheelTarget);
        var growthTarget = (wheelTargetString === 'growth+' || wheelTargetString === 'growth-');
        var branchLength = sourcePatch.branches[branchIndex].length;
        if (growthTarget) {
            branchLength = lerp(branchLength, (wheelTargetString == 'growth+' ? 1 : 0), sourceControl.modWheel * sourceControl.wheelScale);
        }
        var x = (1 - sourceControl.atonality * 2) * branchLength;
        var means = [];
        var sourceGenome = [];
        var GENE_COUNT = GENES.length;
        for (var i = GENE_COUNT; --i >= 0;) {
            var n = GENES[i].NAME;
            var m = sourcePatch.genome[n];
            sourceGenome[i] = m;
            if (n == 'a_mod' || n == 'b_mod') {
                m += (0.5 - m) * x;
            }
            means[i] = m;
        }
        var EQS = [
            function (a, b) { return b - a; },
            function (a, b) { return -(a + b); },
            function (a, b) { return 2 - a - b; }
        ];
        sourcePatch.control.wheelTarget = 0;
        var nailedPatch = deepClone(sourcePatch);
        var bestPatch = null;
        var bestNailed = 0;
        for (var testedSeeds = 0; bestNailed === 0 || (bestNailed < GENE_COUNT && testedSeeds < 1024); ++testedSeeds) {
            var randomSeed = random.integer();
            sourcePatch.seedId = randomSeed;
            sourcePatch.branches[branchIndex].id = randomSeed;
            var spawnedPatch = spawnPatch(sourcePatch, branchIndex);
            var nailed = [];
            nailedPatch.seedId = randomSeed;
            nailedPatch.branches[branchIndex].id = randomSeed;
            var nailedCount = 0;
            for (var t = 0; nailedCount < GENE_COUNT && t < 3; ++t) {
                var eq = EQS[t];
                for (var i = GENE_COUNT; --i >= 0;) {
                    if (!nailed[i]) {
                        var n = GENES[i].NAME;
                        var d = eq(means[i], spawnedPatch.genome[n]);
                        var y = sourceGenome[i] - d;
                        if (n == 'a_mod' || n == 'b_mod') {
                            y = (x * 0.5 - y) / (x - 1.0);
                        }
                        nailedPatch.genome[n] = bounce(y, 0, 1);
                    }
                }
                var validatePatch = spawnPatch(nailedPatch, branchIndex);
                for (var i = GENE_COUNT; --i >= 0;) {
                    if (!nailed[i]) {
                        if (Math.abs(validatePatch.genome[GENES[i].NAME] - sourceGenome[i]) < 0.0001) {
                            nailed[i] = true;
                            ++nailedCount;
                        }
                    }
                }
            }
            if (nailedCount > bestNailed) {
                bestNailed = nailedCount;
                bestPatch = deepClone(nailedPatch);
            }
        }
        assert(bestPatch !== null);
        var control = bestPatch.control;
        bestPatch.modified = true;
        bestPatch.control.wheelTarget = sourceWheelTarget;
        var cloneBranch = bestPatch.branches[branchIndex];
        var branchID = cloneBranch.id;
        for (var i = 0; i < BRANCH_COUNT; ++i) {
            var branch = bestPatch.branches[i];
            branch.id = branchID;
            branch.length = branchLength;
        }
        if (growthTarget) {
            control.modWheel = 0;
        }
        setElement('patch', bestPatch);
        display((bestNailed === GENE_COUNT ? "Sound recreated perfectly at selected branch length."
                : ("Perfectly recreated " + bestNailed + " genes out of " + GENE_COUNT + " at selected branch length.")));
    }
})();
