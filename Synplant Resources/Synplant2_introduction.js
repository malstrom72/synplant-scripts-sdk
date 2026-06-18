var introduction;
(function (introduction) {
    var DRAG_BRANCHES_INDEXES = [0, 1, 2, 7, 10];
    var DRAG_BRANCHES_LENGTHS = [1.0, 0.8, 0.7, 0.9, 0.6];
    var PAGE_COUNT = 11;
    var hideIntroduction = getCushyVariable('preferences.hideIntroduction');
    function releaseNote() {
        if (introduction.heldNote !== 0) {
            sendMidi(0x80, introduction.heldNote, 0);
            introduction.heldNote = 0;
        }
    }
    function holdNote(note) {
        if (note !== introduction.heldNote) {
            releaseNote();
            sendMidi(0x90, note, 127);
            introduction.heldNote = note;
        }
    }
    introduction.open = (function introductionOpen() {
        if (!main.isRunningIntroduction) {
            introduction.page = 0;
            releaseNote();
            introduction.runningAutomation = "";
            introduction.time0 = getMonotonicTime();
            introduction.marker = "none";
            introduction.typingRate = "";
            introduction.completedAutomations = {};
            introduction.introductionPatch = unmarshal('patch', load('Introduction.synplant'));
            introduction.introductionPatch.name = 'Introduction';
        }
        introduction.userPatch = getCachedPatch();
        assert(introduction.introductionPatch !== null);
        setElement('patch', introduction.introductionPatch);
        main.isRunningIntroduction = true;
    });
    introduction.close = (function introductionClose() {
        completeAutomation();
        introduction.typingRate = 0;
        introduction.introductionPatch = getElement('patch');
        if (introduction.userPatch !== null) {
            setElement('patch', introduction.userPatch);
            introduction.userPatch = null;
        }
    });
    function resetAndClose() {
        main.isRunningIntroduction = false;
        displayCushy(null, 'modal');
        setCushyVariable('preferences.hideIntroduction', 'true');
        hideIntroduction = 'true';
    }
    introduction.click = (function introductionClick() {
        if (introduction.typingRate !== "") {
            completeAutomation();
            introduction.marker = "none";
            introduction.typingRate = "";
            if (introduction.page === PAGE_COUNT - 1) {
                resetAndClose();
            }
            else {
                ++introduction.page;
            }
        }
        else {
            introduction.typingRate = 0;
        }
    });
    introduction.userClose = (function introductionUserClose() {
        if (introduction.page !== PAGE_COUNT - 1 && hideIntroduction !== 'true') {
            var answer = display(translate("You are about to close the introduction."), 'warning', 'ok cancel', 'ok');
            if (answer === 'cancel') {
                return;
            }
        }
        resetAndClose();
    });
    introduction.endOfPage = (function introductionEndOfPage() {
        introduction.typingRate = 0;
    });
    introduction.mark = (function introductionMark(params) {
        introduction.markerSeed = ((introduction.markerSeed + 1) >>> 0);
        introduction.marker = unescape(params);
    });
    function paramsToAutomation(params) {
        var automation = unescape(params);
        assert(automation === "playSomeNotes"
            || automation === "dragBranches"
            || automation === "slideAtonality"
            || automation === "plantOneBranch"
            || automation === "dragModWheel", "invalid automation name");
        return automation;
    }
    introduction.triggerAutomation = (function introductionTriggerAutomation(params) {
        completeAutomation();
        var automation = paramsToAutomation(params);
        if ((automation in introduction.completedAutomations)) {
            return;
        }
        introduction.runningAutomation = automation;
        introduction.time0 = getMonotonicTime();
        switch (introduction.runningAutomation) {
            case "dragBranches": {
                introduction.lastLength = 0;
                break;
            }
            case "slideAtonality": {
                holdNote(60);
                break;
            }
            case "plantOneBranch": {
                introduction.hasPlanted = false;
                break;
            }
        }
    });
    function cosineInterpolation(x) {
        return 0.5 - 0.5 * Math.cos(Math.PI * x);
    }
    function clippedTriangleWave(x) {
        if (x < 0.3333333333333333) {
            return x * 3;
        }
        else if (x < 0.6666666666666667) {
            return 1;
        }
        else {
            return 1 - (x - 0.6666666666666667) * 3;
        }
    }
    introduction.driveAutomations = (function introductionDriveAutomations() {
        var timeNow = getMonotonicTime() - introduction.time0;
        switch (introduction.runningAutomation) {
            case "playSomeNotes": {
                var automationTime = timeNow / 750;
                if (automationTime < 3) {
                    holdNote(60 + Math.floor(automationTime));
                }
                else {
                    completeAutomation();
                }
                break;
            }
            case "dragBranches": {
                var DRAG_BRANCH_COUNT = 5;
                var automationTime = timeNow / 1500;
                var timeFloor = Math.floor(automationTime);
                if (timeFloor >= DRAG_BRANCH_COUNT) {
                    completeAutomation();
                }
                else {
                    var branchIndex = DRAG_BRANCHES_INDEXES[timeFloor];
                    var length = DRAG_BRANCHES_LENGTHS[timeFloor];
                    var d = clamp(scale(automationTime - timeFloor, 0.1, 0.6, 0, 1), 0, 1);
                    d = cosineInterpolation(d);
                    setParam("branch" + (branchIndex + 1), d * length);
                    var noteNumber = 60 + branchIndex;
                    if (introduction.lastLength < 1 && d === 1) {
                        releaseNote();
                    }
                    holdNote(noteNumber);
                    introduction.lastLength = d;
                }
                break;
            }
            case "slideAtonality": {
                var automationTime = timeNow / 1000;
                if (automationTime >= 3) {
                    completeAutomation();
                }
                else {
                    setParam("atonality", cosineInterpolation(clippedTriangleWave(automationTime / 3)));
                }
                break;
            }
            case "dragModWheel": {
                var automationTime = timeNow / 1000;
                if (automationTime >= 3) {
                    completeAutomation();
                }
                else {
                    setParam("modWheel", cosineInterpolation(clippedTriangleWave(automationTime / 3)));
                }
                break;
            }
            case "plantOneBranch": {
                var automationTime = timeNow / 750;
                if (automationTime < 3) {
                    var timeFloor = Math.floor(automationTime);
                    var branchIndex = ([0, 10, 1])[timeFloor];
                    holdNote(60 + branchIndex);
                }
                else if (automationTime < 4.5) {
                    releaseNote();
                }
                else if (automationTime < 5.5) {
                    if (!introduction.hasPlanted) {
                        introduction.hasPlanted = true;
                        performCushyAction('main.plant', 'no undo');
                    }
                }
                else if (automationTime < 8.5) {
                    var timeFloor = Math.floor(automationTime - 5.5);
                    holdNote(60 + timeFloor);
                }
                else {
                    completeAutomation();
                }
                break;
            }
        }
    });
    function completeAutomation() {
        releaseNote();
        switch (introduction.runningAutomation) {
            case "dragBranches": {
                for (var i = 0; i < 5; ++i) {
                    setParam("branch" + (DRAG_BRANCHES_INDEXES[i] + 1), DRAG_BRANCHES_LENGTHS[i]);
                }
                break;
            }
            case "slideAtonality": {
                setParam("atonality", 0.0);
                break;
            }
            case "dragModWheel": {
                setParam("modWheel", 0.0);
                break;
            }
            case "plantOneBranch": {
                if (!introduction.hasPlanted) {
                    assert(introduction.introductionPatch !== null);
                    assert(DRAG_BRANCHES_INDEXES[1] === 1);
                    var patchCopy = deepClone(introduction.introductionPatch);
                    patchCopy.branches[1].length = DRAG_BRANCHES_LENGTHS[1];
                    var patch = spawnPatch(patchCopy, 1);
                    patch.control.wheelTarget = paramValue('wheelTarget', 'growth +');
                    setElement('patch', patch);
                }
                break;
            }
        }
        introduction.completedAutomations[introduction.runningAutomation] = true;
        introduction.runningAutomation = "";
    }
    introduction.closeButtonVisible = (function introductionCloseButtonVisible() {
        if (hideIntroduction === 'true') {
            return 'true';
        }
        else if (introduction.page !== 0 && introduction.page !== PAGE_COUNT - 1) {
            return 'true';
        }
        else {
            return 'false';
        }
    });
    if (!introduction.inited) {
        introduction.page = 0;
        introduction.marker = "none";
        introduction.typingRate = "";
        introduction.runningAutomation = "";
        introduction.heldNote = 0;
        introduction.lastLength = 0;
        introduction.userPatch = null;
        introduction.markerSeed = random.integer();
        introduction.completedAutomations = {};
        introduction.hasPlanted = false;
        introduction.inited = true;
    }
})(introduction || (introduction = {}));
