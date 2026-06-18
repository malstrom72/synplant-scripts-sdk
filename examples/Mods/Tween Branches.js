addModPatcher('Tween Branches', 'Synplant2_main', function(cushyName, cushyContents) {
    mods.tweenBranches = {
        tween: function tweenBranches() {
            saveUndo(translate('Tween Branches'));

            var patch = getElement('patch');
            var branches = patch.branches;
            var control = patch.control;

            var mainSelectedBranchIndex = selected('branch');
            var selectedBranch = (mainSelectedBranchIndex === null ? 0 : mainSelectedBranchIndex);
            var rotation = Math.round(control.rotation * BRANCH_COUNT);

            function branchToSector(branchIndex) {
                return (branchIndex + rotation) % BRANCH_COUNT;
            }
            function sectorToBranch(sectorIndex) {
                return (sectorIndex + BRANCH_COUNT - rotation) % BRANCH_COUNT;
            }
            var indexToBranch = sectorToBranch;
            var branchToIndex = branchToSector;
            if (paramText('bulbMode', control.bulbMode) === 'velocity') {
                indexToBranch = function(index) {
                    return sectorToBranch((index + 1) % BRANCH_COUNT);
                }
                branchToIndex = function(branch) {
                    return (branchToSector(branch) + BRANCH_COUNT - 1) % BRANCH_COUNT;
                }
            }

            var cloneBranch = branches[selectedBranch];
            var firstVelocityLength = branches[indexToBranch(0)].length;
            var lastVelocityLength = branches[indexToBranch(BRANCH_COUNT - 1)].length;
            var selectedVelocityIndex = branchToIndex(selectedBranch);
            var selectedVelocityLength = branches[selectedBranch].length;
            for (var index = 0; index < BRANCH_COUNT; ++index) {
                var branch = branches[indexToBranch(index)];
                if (index !== selectedVelocityIndex) {
                    branch.length = (index < selectedVelocityIndex
                        ? scale(index, 0, selectedVelocityIndex, firstVelocityLength, selectedVelocityLength)
                        : scale(index, selectedVelocityIndex, BRANCH_COUNT - 1, selectedVelocityLength, lastVelocityLength));
                }
                branch.id = cloneBranch.id;
                branch.volume = cloneBranch.volume;
                branch.explicit = cloneBranch.explicit;
            }
            patch.modified = true;
            setElement('patch', patch);
        }
    };

    var injectionPointItems = '// <<< injection point for additional bulb context menu items';
    var injectionPointMods = '// <<< injection point for additional bulb context menu mods';
    var isFirst = (cushyContents.indexOf(injectionPointItems) !== -1);
    return cushyContents.replace(isFirst ? injectionPointItems : injectionPointMods, (isFirst ? '-\n\t' : '')
            + '{ "Tween Branches", "mods.tweenBranches.tween" }\n\t'
            + injectionPointMods);
});
