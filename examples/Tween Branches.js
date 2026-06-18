(function tweenBranches() {
	var mainSelectedBranchIndex = selected('branch');
	var selectedBranch = (mainSelectedBranchIndex === null ? 0 : mainSelectedBranchIndex);
	saveUndo(translate('Tween Branches'));
	var patch = getElement('patch');
	var branches = patch.branches;
	var rotation = Math.round(getParam('rotation') * BRANCH_COUNT);

	function branchToSector(branchIndex) {
		return (branchIndex + rotation) % BRANCH_COUNT;
	}
	function sectorToBranch(sectorIndex) {
		return (sectorIndex + BRANCH_COUNT - rotation) % BRANCH_COUNT;
	}
	var indexToBranch = sectorToBranch;
	var branchToIndex = branchToSector;
	if (paramText('bulbMode', patch.control.bulbMode) === 'velocity') {
		indexToBranch = function(index) {
			return sectorToBranch((index + 1) % BRANCH_COUNT);
		}
		branchToIndex = function(branch) {
			return (branchToSector(branch) + BRANCH_COUNT - 1) % BRANCH_COUNT;
		}
	}
	var firstVelocityLength = branches[indexToBranch(0)].length;
	var lastVelocityLength = branches[indexToBranch(BRANCH_COUNT - 1)].length;
	var selectedVelocityIndex = branchToIndex(selectedBranch);
	var selectedVelocityLength = branches[selectedBranch].length;
	for (var index = 0; index < BRANCH_COUNT; ++index) {
		if (index !== selectedVelocityIndex) {
			var branch = branches[indexToBranch(index)];
			branch.length = (index < selectedVelocityIndex
				? scale(index, 0, selectedVelocityIndex, firstVelocityLength, selectedVelocityLength)
				: scale(index, selectedVelocityIndex, BRANCH_COUNT - 1, selectedVelocityLength, lastVelocityLength));
		}
	}
	patch.modified = true;
	setElement('patch', patch);
	displayHint('Tweened branches');
})();
