if (!globals.genobatch) {
	globals.genobatch = {
		windowPosition: '',
		windowZOrder: '',
		sourceFolder: null,
		destinationFolder: null,
		sourceFiles: null,
		fileIndex: 0,
		begun: false,
		finished: false,
		startTime: Date.now(),
		errorSum: 0,
		errorList: [ ],
		patchesReport: '',
		referenceName: null
	}
}

(function() {
	var SAVE_ALL_STALKS = true;
	var AUDIO_FILE_TYPES = [ 'wav', 'wave', 'aif', 'aiff', 'afc', 'aifc' ];
    var FILE_NAME_RE = new RegExp("^.*"
	        + (PLATFORM.OS === 'windows' ? "[\\/\\\\:]" : "\\/")
    	    + "(.*?)(?:\\.[^.]*)?$");

	var config = loadPapagenoConfig();

    function loadPapagenoConfig() {
        var config = parseNumbstrict(load(DIRS.PAPAGENO + "synplantGenopatchConfig.numbstrict"));
        var overridesPath = getCushyVariable('preferences.genopatchConfigOverridesPath');
        if (overridesPath !== '' && fileInfo(overridesPath) !== null) {
            var configOverride = parseNumbstrict(load(overridesPath));
            for (var key in configOverride) {
                config[key] = configOverride[key];
            }
        }
        assert(typeof config === 'object');
        var remap = {
            'maxIterations': 'mI',
            'minReferenceSpan': 'mR',
            'maxReferenceSpan': 'mX',
            'focusIterations': 'fI',
            'startingPointSpread': 'sP',
            'maxAudioLength': 'mL',
            'zeroCrossingArea': 'zC'
        };
        for (var key in remap) {
            if (!(key in config)) {
                config[key] = config[remap[key]];
            }
        }
        return config;
    }

	function getInitialAudioFilesDir() {
		var initialDir = getCushyVariable('preferences.papagenoReferencesDirectory');
		return (initialDir === '' ? void 0 : initialDir);
	}

	function openReference(path) {
		papageno.initialize(config);
		papageno.loadReference(path, config.mL, false);
		var referenceInfo = papageno.getReferenceInfo();
		assert(referenceInfo !== null, "referenceInfo !== null");
		assert(referenceInfo.stop - referenceInfo.start <= config.mX + 1e-8, "referenceInfo.stop - referenceInfo.start <= config.mX + 1e-8");
		papageno.updateReferenceRange(referenceInfo.start, referenceInfo.stop, config.zC, config.zC);
		var m = FILE_NAME_RE.exec(path);
		genobatch.referenceName = (m ? m[1] : '');
		var parentPath = fullPath(path, '../');
		setCushyVariable('preferences.papagenoReferencesDirectory', parentPath);
	}

	function processNextBatchItem() {
		if (genobatch.fileIndex > 0) {
			var bestError = +Infinity;
			var bestSolution = void 0;
			for (var stalkNumber = papageno.getStalkCount(); --stalkNumber >= 0;) {
				var stalkInfo = papageno.getStalkInfo(stalkNumber);
				var solution = papageno.getSolution(stalkNumber, stalkInfo.solutions - 1);
				if (solution.error < bestError) {
					bestSolution = solution;
				}
				if (SAVE_ALL_STALKS) {
					solution.patch.path = "" + genobatch.destinationFolder + genobatch.referenceName + "_" + stalkNumber + ".synplant";
					save(solution.patch.path, marshal('patch', solution.patch, true));
				}
			}
			assert(bestSolution != undefined, "bestSolution");
			bestSolution.patch.path = "" + genobatch.destinationFolder + genobatch.referenceName + ".synplant";
			if (!SAVE_ALL_STALKS) {
				save(bestSolution.patch.path, marshal('patch', bestSolution.patch, true));
			}
			setElement('patch', bestSolution.patch);
			genobatch.errorSum += bestSolution.error;
			genobatch.errorList.push(bestSolution.error);
			genobatch.patchesReport += genobatch.referenceName + " | " + bestSolution.error + "\n";
		}
		if (genobatch.fileIndex < genobatch.sourceFiles.length) {
			var path = genobatch.sourceFolder + genobatch.sourceFiles[genobatch.fileIndex].name;
			++genobatch.fileIndex;
			openReference(path);
			papageno.startSearch();
			assert(papageno.isSearching(), "papageno.isSearching()");
		}
		else {
			var nameAndDate = papageno.getNetInfo();
			var average = genobatch.errorSum / genobatch.sourceFiles.length;
			genobatch.errorList.sort(function(a, b) { return a - b; });
			var median = genobatch.errorList[Math.floor(genobatch.errorList.length / 2)];
			var report = "# Genopatch Batch Process Report\n" +
				"\n" +
				"```\n" +
				("Source directory: " + genobatch.sourceFolder + "\n") +
				("Destination directory: " + genobatch.destinationFolder + "\n") +
				("File count: " + genobatch.sourceFiles.length + "\n") +
				("Iterations per stack: " + config.mI + "\n") +
				("Time spent: " + ((Date.now() - genobatch.startTime) / 60000).toFixed(2) + " minutes\n") +
				("Average error: " + average + "\n") +
				("Median error: " + median + "\n") +
				("Neural network name: " + nameAndDate.name + "\n") +
				("Neural network date: " + nameAndDate.date.toUTCString() + "\n") +
				"```\n" +
				"\n" +
				"Patch | Error\n" +
				"------|------\n" +
				(genobatch.patchesReport + "\n");
			save(genobatch.destinationFolder + "report.md", report);
			genobatch.finished = true;
		}
	}

	Object.assign(genobatch, {
		process: function process() {
			var gb = genobatch;
			if (gb.begun && !gb.finished && !papageno.isSearching()) {
				processNextBatchItem();
			}
		},
		open: function open() {
			display('Choose a source folder with wav and aiff files to batch process.');
			genobatch.sourceFolder = browse('folder', void 0, getInitialAudioFilesDir());
			if (genobatch.sourceFolder === null) {
				return;
			}
			genobatch.sourceFiles = dir(genobatch.sourceFolder, AUDIO_FILE_TYPES);
			if (genobatch.sourceFiles.length === 0) {
				display('Folder contains no wav or aiff files.', 'error');
				return;
			}
			genobatch.sourceFiles.sort(function(a, b) { return a.name.localeCompare(b.name); });
			display('Choose a destination folder for the Synplant patches.');
			var initialDir = getCushyVariable('preferences.genobatch.destinationDirectory');
			genobatch.destinationFolder = browse('folder', void 0, (initialDir === '' ? void 0 : initialDir));
			if (genobatch.destinationFolder === null) {
				return;
			}
			var iterations;
			do {
				var iterationsAnswer = ask("Number of iterations per stalk (standard is " + config.mI + "):"
						, '' + config.mI);
				if (iterationsAnswer === null) {
					return;
				}
				iterations = +iterationsAnswer;
				if (isNaN(iterations) || iterations < 1 || iterations > config.mI) {
					display("Answer must be a number between 1 and " + config.mI + ".", 'error');
				} else {
					break;
				}
			} while (true);
			config.mI = iterations;
			setCushyVariable('preferences.genobatch.destinationDirectory', genobatch.destinationFolder);
			genobatch.errorSum = 0;
			genobatch.errorList = [ ];
			genobatch.patchesReport = '';
			genobatch.fileIndex = 0;
			genobatch.begun = true;
			processNextBatchItem();		
		},
		close: function close() {
			if (genobatch.begun && papageno.isSearching()) {
				papageno.stopSearch();
				papageno.initialize(loadPapagenoConfig());
			}
		},
		info: function info() {
			var gb = genobatch;
			if (!gb.begun) {
				return '';
			} else {
				var s = (gb.finished ? "Finished processing ^I/^N" : "Batch processing ^I/^N");
				return translate(s).replace('^I', '' + gb.fileIndex).replace('^N', '' + gb.sourceFiles.length);
			}
		}
	});
})();
