(function exportAllGenopatchSolutions() {
	if (!papageno.isInitialized()) {
		display('Please run Genopatch first.');
		return;
	}
	var referenceInfo = papageno.getReferenceInfo();
	if (referenceInfo === null) {
		display('Please load a reference sound first.');
		return;
	}
	function pitchCorrectionEnabled() {
		if (globals.papagenoUI) {
			return papagenoUI.pitchCorrectionFlag;
		}
		var stateString = getCushyVariable('instance.papagenoUIState');
		if (stateString !== '') {
			return parseNumbstrict(stateString).pitchCorrect;
		} else {
			return (getCushyVariable('preferences.papagenoPitchCorrection') === 'true');
		}
	}
	var pitchAdjust = (pitchCorrectionEnabled()
			? Math.round(referenceInfo.pitch) - referenceInfo.pitch
			: -Math.log(getElement('midiConfig').masterTuning / 440) / Math.LN2);

	var name = splitPath(referenceInfo.path)[1];
    display('Select a folder to save the patches in.');
	var folder = browse('folder');
	if (folder === null) {
		return;
	}
	var saveCount = 0;
	var currentPatchId = getCachedPatch().patchId;
	for (var stalkNumber = papageno.getStalkCount(); --stalkNumber >= 0;) {
		var stalkInfo = papageno.getStalkInfo(stalkNumber);
		for (var solutionNumber = stalkInfo.solutions; --solutionNumber >= 0;) {
			var patch = papageno.getSolution(stalkNumber, solutionNumber).patch;
			var patchName = name + ' ' + (stalkNumber + 1) + '-' + (solutionNumber + 1) + '.synplant';
			patch.path = fullPath(folder, patchName);
			patch.modified = false;
			patch.pitchAdjust = pitchAdjust;
			save(patch.path, marshal('patch', patch));
			if (patch.patchId === currentPatchId) {
				setElement('patch', patch);
			}
			++saveCount;
		}
	}
	display('Saved ' + saveCount + ' patches.');
})();
