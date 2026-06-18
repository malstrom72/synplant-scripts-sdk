var papagenoUI;
(function (papagenoUI) {
    var AUDIO_FILE_TYPES = ['wav', 'wave', 'aif', 'aiff', 'afc', 'aifc'];
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
    var config = (function () {
        try {
            return loadPapagenoConfig();
        }
        catch (x) {
            display(translate("Error loading required resources. Please reinstall Synplant.") + ("\n\n" + x), 'error');
            displayCushy(null, 'modal');
            return {};
        }
    })();
    function reloadConfig() {
        config = loadPapagenoConfig();
        papageno.initialize(config);
        return config;
    }
    papagenoUI.reloadConfig = reloadConfig;
    var guiConfig;
    var lastPatchId = 0;
    var shiftKeyDown = false;
    function gaussian(prng, mu, sigma) {
        mu = mu || 0;
        sigma = sigma || 1;
        do {
            var x = prng.nextFloat();
        } while (x === 0);
        do {
            var y = prng.nextFloat();
        } while (y === 0);
        return mu + sigma * Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y);
    }
    function scramble(x) {
        x = x >>> 0;
        x = (x ^ (x << 11)) >>> 0;
        x = x * (x * 134775813 >>> 13);
        return (x ^ (x >>> 17)) >>> 0;
    }
    function scrambleToFloat(x) {
        return scramble(x) / 4294967296;
    }
    function updateStalkFunctions(stalk) {
        function animationFunction(field) {
            return function animationFunction() {
                updateAnimations(stalk);
                return stalk[field];
            };
        }
        stalk.backgroundTangle = animationFunction("backgroundTanglePath");
        stalk.foregroundTangle = animationFunction("foregroundTanglePath");
        stalk.backgroundBalls = animationFunction("backgroundBallsList");
        stalk.foregroundBalls = animationFunction("foregroundBallsList");
        stalk.budLines = animationFunction("budLinesList");
        stalk.buds = animationFunction("budsList");
        stalk.flares = animationFunction("flaresList");
        stalk.isSeeded = function () { return stalk.stalkInfo.seed !== null ? "yes" : "no"; };
    }
    function newStalk(stalkNumber) {
        var stalkInfo = papageno.getStalkInfo(stalkNumber);
        var partialStalk = {
            number: stalkNumber,
            stalkInfo: stalkInfo,
            displayHeight: 0,
            solutions: [],
            triggers: [],
            lastTwitchIteration: 0,
            twitchesTicker: 1,
            tangleRotation: 0,
            tangleRotationSpeed: 0,
            tanglePRNG: new Xorshift(stalkInfo.id + 194755),
            randomTanglePoints: [],
            filteredTanglePoints: [],
            solutionRoots: [],
            pathsRotation: 0,
            backgroundTanglePath: "",
            foregroundTanglePath: "",
            backgroundBallsList: "[]",
            foregroundBallsList: "[]",
            budLinesList: "[]",
            budsList: "[]",
            flaresList: "[]",
            animationsDirty: true
        };
        var stalk = partialStalk;
        updateStalkFunctions(stalk);
        return stalk;
    }
    function updateAnimations(stalk) {
        if (stalk.animationsDirty) {
            stalk.animationsDirty = false;
            var cfg = guiConfig;
            var stalkNumber = stalk.number;
            var stalkInfo = stalk.stalkInfo;
            var solutionCount = stalkInfo.solutions;
            var solutionRoots = stalk.solutionRoots;
            if (Math.abs(stalk.tangleRotation - stalk.pathsRotation) > 0.001
                || solutionRoots.length !== solutionCount) {
                var r = Math.PI * 2 * stalk.tangleRotation;
                var sinR = Math.sin(r);
                var cosR = Math.cos(r);
                var smoothX = 0;
                var smoothZ = 0;
                var smoothY = 0;
                var heightDiff = stalkInfo.height - stalk.displayHeight;
                if (heightDiff > 0) {
                    if (heightDiff < 0.01) {
                        stalk.displayHeight = stalkInfo.height;
                    }
                    else {
                        stalk.displayHeight += heightDiff * 0.1;
                    }
                }
                stalk.displayHeight = stalkInfo.height;
                var points = Math.ceil(stalk.displayHeight * cfg.tanglePoints);
                var xScale = cfg.tangleXScale * Math.sqrt(1 / (1 - cfg.tangleXSmoothing));
                var yScale = cfg.tangleYScale * Math.sqrt(1 / (1 - cfg.tangleYSmoothing));
                var solutionIndex = 0;
                var nextSolution = (solutionIndex < solutionCount ? getSolution(stalkNumber, solutionIndex) : null);
                var tickPRNG = new Xorshift(stalkInfo.id + stalk.twitchesTicker + 3587424);
                var randomTanglePoints = stalk.randomTanglePoints;
                var filteredTanglePoints = stalk.filteredTanglePoints;
                var ySmoothing = (1 - cfg.tangleYSmoothing);
                var xSmoothing = (1 - cfg.tangleXSmoothing);
                var foregroundPath = new StringBuilder();
                var backgroundPath = new StringBuilder();
                var oldPath = null;
                var maxStalkHeight = cfg.greenhouseHeight - cfg.topMargin - cfg.bottomMargin;
                var lastX = cfg.greenhouseWidth * 0.5;
                var lastY = cfg.greenhouseHeight - cfg.bottomMargin;
                var lastZ = 0;
                var lastSolutionHeight = 0;
                for (var pointIndex = 0; pointIndex < points; ++pointIndex) {
                    var height = pointIndex / cfg.tanglePoints;
                    while (nextSolution && height >= nextSolution.height) {
                        solutionRoots[solutionIndex] = { x: lastX, y: lastY, z: lastZ };
                        ++solutionIndex;
                        nextSolution = (solutionIndex < solutionCount
                            ? getSolution(stalkNumber, solutionIndex) : null);
                        lastSolutionHeight = height;
                    }
                    var randX = void 0;
                    var randY = void 0;
                    var randZ = void 0;
                    if (pointIndex >= randomTanglePoints.length) {
                        var prng = stalk.tanglePRNG;
                        randX = gaussian(prng);
                        randY = gaussian(prng);
                        randZ = gaussian(prng);
                        randomTanglePoints[pointIndex] = { x: randX, y: randY, z: randZ };
                    }
                    else {
                        var p = randomTanglePoints[pointIndex];
                        randX = p.x;
                        randY = p.y;
                        randZ = p.z;
                    }
                    var twistMix = (nextSolution
                        ? 0 : square(scale(height, lastSolutionHeight, stalk.displayHeight, 0, 1)));
                    if (twistMix !== 0) {
                        var twistScale = 1 + twistMix * 2;
                        randX = (randX + (gaussian(tickPRNG) - randX) * twistMix) * twistScale;
                        randY = (randY + (gaussian(tickPRNG) - randY) * twistMix) * twistScale;
                        randZ = (randZ + (gaussian(tickPRNG) - randZ) * twistMix) * twistScale;
                    }
                    smoothY += (randY - smoothY) * ySmoothing;
                    smoothX += (randX - smoothX) * xSmoothing;
                    smoothZ += (randZ - smoothZ) * xSmoothing;
                    if (pointIndex >= filteredTanglePoints.length) {
                        filteredTanglePoints[pointIndex] = { x: smoothX, y: smoothY, z: smoothZ };
                    }
                    else {
                        var p = filteredTanglePoints[pointIndex];
                        smoothX = (p.x += (smoothX - p.x) * 0.25);
                        smoothY = (p.y += (smoothY - p.y) * 0.25);
                        smoothZ = (p.z += (smoothZ - p.z) * 0.25);
                    }
                    var nextZ = (sinR * smoothX + cosR * smoothZ) * xScale;
                    var nextX = (cosR * smoothX - sinR * smoothZ) * xScale;
                    var nextY = smoothY * yScale;
                    if (height < 0.2) {
                        var center = 1 - cube(1 - height / 0.2);
                        nextX *= center;
                        nextZ *= center;
                        nextY *= center;
                    }
                    else if (height >= 0.9) {
                        nextY *= 1 - cube((height - 0.9) / 0.1);
                    }
                    nextX = nextX * cfg.perspectiveDepth / (cfg.perspectiveDepth + nextZ)
                        + cfg.greenhouseWidth * 0.5;
                    nextY = maxStalkHeight + cfg.topMargin
                        - bounce(nextY + maxStalkHeight * height, 0, maxStalkHeight);
                    var newPath = (nextZ < 0 ? foregroundPath : backgroundPath);
                    if (newPath !== oldPath) {
                        if (oldPath === null) {
                            newPath.append("M" + ~~(lastX * 8) / 8 + "," + ~~(lastY * 8) / 8);
                        }
                        else {
                            var sliceLength = lastZ / (lastZ - nextZ);
                            var sliceX = lerp(lastX, nextX, sliceLength);
                            var sliceY = lerp(lastY, nextY, sliceLength);
                            oldPath.append("L" + ~~(sliceX * 8) / 8 + "," + ~~(sliceY * 8) / 8);
                            newPath.append("M" + ~~(sliceX * 8) / 8 + "," + ~~(sliceY * 8) / 8);
                        }
                        oldPath = newPath;
                    }
                    newPath.append("L" + ~~(nextX * 8) / 8 + "," + ~~(nextY * 8) / 8);
                    lastX = nextX;
                    lastY = nextY;
                    lastZ = nextZ;
                }
                if (nextSolution && nextSolution.height >= 1) {
                    solutionRoots[solutionIndex] = { x: lastX, y: lastY, z: lastZ };
                }
                stalk.foregroundTanglePath = foregroundPath.build();
                stalk.backgroundTanglePath = backgroundPath.build();
                stalk.pathsRotation = stalk.tangleRotation;
            }
            var timeNow = getMonotonicTime();
            var buds = '';
            var budLines = '';
            var backgroundBalls = '';
            var foregroundBalls = '';
            if (solutionCount > 0) {
                for (var solutionIndex = solutionCount; --solutionIndex >= 0;) {
                    if (solutionRoots[solutionIndex]) {
                        var solution_1 = getSolution(stalkNumber, solutionIndex);
                        var root = solutionRoots[solutionIndex];
                        assert(timeNow >= solution_1.birthday, "timeNow >= solution.birthday");
                        var age = Math.min((timeNow - solution_1.birthday) / 1500, 1);
                        var a2 = Math.min(age, 1 / 4) * 4;
                        a2 *= a2;
                        var ball = ",[" + root.x + "," + root.y + "," + root.z + "," + a2 + "]";
                        if (root.z < 0) {
                            foregroundBalls += ball;
                        }
                        else {
                            backgroundBalls += ball;
                        }
                        age = Math.max(age - 0.5, 0) * 2;
                        age *= (2 - age);
                        solution_1.animatedX = lerp(root.x, solution_1.x, age);
                        solution_1.animatedY = lerp(root.y, solution_1.y, age);
                        var size = scale(clamp(solution_1.error, cfg.maxBudError, cfg.minBudError), cfg.minBudError, cfg.maxBudError, cfg.minBudSize, cfg.maxBudSize)
                            * age;
                        var xy = solution_1.animatedX + ',' + solution_1.animatedY + ',';
                        buds += ',['
                            + xy
                            + size + ','
                            + age + ','
                            + solution_1.color + ','
                            + (solution_1 === papagenoUI.clickedSolution ? solution_1.selectedColor : '')
                            + ']';
                        budLines += ',['
                            + xy
                            + root.x + ','
                            + root.y + ','
                            + age + ']';
                    }
                }
            }
            stalk.foregroundBallsList = '[' + foregroundBalls.substr(1) + ']';
            stalk.backgroundBallsList = '[' + backgroundBalls.substr(1) + ']';
            stalk.budsList = '[' + buds.substr(1) + ']';
            stalk.budLinesList = '[' + budLines.substr(1) + ']';
            var triggers = stalk.triggers;
            var outputIndex = 0;
            var flares = '';
            for (var inputIndex = 0; inputIndex < triggers.length; ++inputIndex) {
                var t = triggers[inputIndex];
                var d = timeNow - t.when;
                if (d < 1000) {
                    triggers[outputIndex] = t;
                    ++outputIndex;
                    if (t.solution.animatedX !== null) {
                        flares += ',[' + t.solution.animatedX + ',' + t.solution.animatedY + ',' + d / 1000 + ']';
                    }
                }
            }
            triggers.length = outputIndex;
            stalk.flaresList = '[' + flares.substr(1) + ']';
        }
    }
    function initStalks(reinit) {
        var anyNew = false;
        papagenoUI.totalIterations = 0;
        papagenoUI.begunSearching = false;
        papagenoUI.finishedSearching = false;
        for (var i = papageno.getStalkCount(); --i >= 0;) {
            if (reinit || !papagenoUI.stalks[i]) {
                var stalk = newStalk(i);
                papagenoUI.stalks[i] = stalk;
                anyNew = true;
            }
            papagenoUI.totalIterations += papagenoUI.stalks[i].stalkInfo.iterations;
        }
        papagenoUI.lastTestsPerSecondUpdate = null;
        if (anyNew) {
            papagenoUI.lastAutoSelected = getMonotonicTime();
            doPollResults(papagenoUI.lastAutoSelected - 1000);
        }
    }
    function initStalk(stalkNumber) {
        var stalk = papagenoUI.stalks[stalkNumber];
        stalk = newStalk(stalkNumber);
        papagenoUI.stalks[stalkNumber] = stalk;
        papagenoUI.lastTestsPerSecondUpdate = null;
        doPollResults(getMonotonicTime() - 1000);
        papagenoUI.finishedSearching = false;
    }
    function allSoundsOff() {
        sendMidi(0xB0, 0x78);
        papagenoUI.noteOffTime = null;
        papageno.startOrStopReferencePlayback(false);
    }
    var waveform;
    (function (waveform) {
        waveform.noRefAnimation = new ComputedGUIVariable(computeRefAnimation, false, 0);
        var mouse = { x: 0, y: 0 };
        var tracker = null;
        var areHandlesVisible = false;
        var freezeHandleVisibility = false;
        var autoScrollTo = null;
        function open(state) {
            if (state) {
                waveform.zoom = state.waveformZoom;
                waveform.scroll = state.waveformScroll;
                waveform.page = state.waveformPage;
            }
            var referenceInfo = papageno.getReferenceInfo();
            waveform.mostZoom = guiConfig.waveformMaxZoom / guiConfig.waveformDisplayWidth;
            waveform.leastZoom = (referenceInfo ? Math.max(referenceInfo.length / guiConfig.waveformDisplayWidth, waveform.mostZoom) : waveform.mostZoom);
            autoScrollTo = null;
            updateWaveform();
            updateSelection();
        }
        waveform.open = open;
        function timeToX(time) {
            return (time - waveform.scroll) / waveform.zoom;
        }
        function xToTime(x) {
            return x * waveform.zoom + waveform.scroll;
        }
        waveform.clickPosition = {
            set: function (value) {
                mouse = toMousePosition(value);
                if (tracker !== null) {
                    tracker(mouse.x, mouse.y);
                }
            }
        };
        function autoScrollForX(x) {
            if (x < 0 || x >= guiConfig.waveformDisplayWidth) {
                autoScrollTo = (waveform.scroll + (x < 0 ? -guiConfig.autoScrollSpeed : guiConfig.autoScrollSpeed) * waveform.zoom);
            }
        }
        waveform.autoScroll = function autoScroll() {
            if (autoScrollTo !== null) {
                var referenceInfo = papageno.getReferenceInfo();
                assert(referenceInfo !== null, "referenceInfo !== null");
                waveform.scroll = clamp(autoScrollTo, 0, Math.max(referenceInfo.length - waveform.zoom * guiConfig.waveformDisplayWidth, 0));
                autoScrollTo = null;
                updateWaveform();
                updateSelection();
                if (tracker !== null) {
                    tracker(mouse.x, mouse.y);
                }
            }
        };
        waveform.playPosition = function playPosition() {
            var pos = papageno.getReferencePlaybackPosition();
            return (pos === null ? '' : "" + timeToX(pos));
        };
        waveform.canSelect = function canSelect() {
            return (papagenoUI.begunSearching ? 'no' : 'yes');
        };
        function updateSelection() {
            var info = papageno.getReferenceInfo();
            if (info === null) {
                waveform.selectionStart = waveform.selectionEnd = '';
                areHandlesVisible = false;
                waveform.handlesVisible = 'no';
            }
            else {
                var start = timeToX(info.start);
                var end = timeToX(info.stop);
                waveform.selectionStart = '' + start;
                waveform.selectionEnd = '' + end;
                if (!freezeHandleVisibility) {
                    waveform.handlesVisible = ((areHandlesVisible = (end - start > guiConfig.selectionHandleWidth * 2 + 8)) ? 'yes' : 'no');
                }
            }
        }
        waveform.updateSelection = updateSelection;
        function updateWaveform() {
            var dl = '[';
            var dh = '[';
            assert(waveform.scroll >= 0, "scroll >= 0");
            var data = papageno.getReferenceDisplayData(waveform.scroll, waveform.scroll + waveform.zoom * guiConfig.waveformDisplayWidth, waveform.zoom);
            for (var i = 0; i < data.length; i += 2) {
                if (i !== 0) {
                    dl += ',';
                    dh += ',';
                }
                dl += data[i].toFixed(4);
                dh += data[i + 1].toFixed(4);
            }
            dl += ']';
            dh += ']';
            waveform.displayLow = dl;
            waveform.displayHigh = dh;
        }
        waveform.updateWaveform = updateWaveform;
        function newReference() {
            var len = papageno.getReferenceInfo().length;
            assert(!isNaN(len) && 0 <= len && len < 3600, "!isNaN(len) && 0 <= len && len < 3600");
            waveform.leastZoom = Math.max(len / guiConfig.waveformDisplayWidth, waveform.mostZoom);
            waveform.zoom = waveform.leastZoom;
            waveform.scroll = 0.0;
            waveform.page = 'waveform';
            autoScrollTo = null;
            updateWaveform();
            updateSelection();
        }
        waveform.newReference = newReference;
        function insideArea() {
            if (papageno.getReferenceInfo() !== null) {
                var referenceInfo = papageno.getReferenceInfo();
                assert(referenceInfo !== null, "referenceInfo !== null");
                var canSelect_1 = !papagenoUI.begunSearching;
                if (canSelect_1 && mouse.y >= guiConfig.waveformDisplayHeight - guiConfig.selectionHandleHeight) {
                    var start = referenceInfo.start;
                    var stop = referenceInfo.stop;
                    var startX = timeToX(start);
                    var stopX = timeToX(stop);
                    var handleMargin = 1;
                    var handleSize = areHandlesVisible ? guiConfig.selectionHandleWidth : 0;
                    if (mouse.x >= startX - handleMargin && mouse.x <= stopX + handleMargin) {
                        if (mouse.x <= startX + handleSize + handleMargin) {
                            return "start";
                        }
                        else if (mouse.x >= stopX - handleSize - handleMargin) {
                            return "stop";
                        }
                        else {
                            return "selection";
                        }
                    }
                    else {
                        return "bar";
                    }
                }
                return "waveform";
            }
            return "none";
        }
        waveform.hoverPosition = {
            set: function (value) {
                mouse = toMousePosition(value);
                switch (insideArea()) {
                    case "start":
                        waveform.cursor = (PLATFORM.OS === "mac" ? "sizeE" : "sizeWE");
                        break;
                    case "stop":
                        waveform.cursor = (PLATFORM.OS === "mac" ? "sizeW" : "sizeWE");
                        break;
                    case "selection":
                    case "bar":
                        waveform.cursor = "arrow";
                        break;
                    case "waveform":
                        waveform.cursor = (PLATFORM.OS === "mac" ? "openHand" : "sizeAll");
                        break;
                }
            }
        };
        waveform.click = function click() {
            var area = insideArea();
            assert(area !== "none", "area !== \"none\"");
            var referenceInfo = papageno.getReferenceInfo();
            assert(referenceInfo !== null, "referenceInfo !== null");
            var referenceLength = referenceInfo.length;
            assert(tracker === null, "tracker === null");
            switch (area) {
                case "waveform": {
                    var mouseAnchorY_1 = mouse.y;
                    var zoomAnchor_1 = waveform.zoom;
                    var timeAnchor_1 = xToTime(mouse.x);
                    tracker = function (x, y) {
                        waveform.zoom = clamp(zoomAnchor_1 * (Math.pow(2, ((mouseAnchorY_1 - y) / 40))), waveform.mostZoom, waveform.leastZoom);
                        waveform.scroll = clamp(timeAnchor_1 - x * waveform.zoom, 0, Math.max(referenceLength - waveform.zoom * guiConfig.waveformDisplayWidth, 0));
                        updateWaveform();
                        updateSelection();
                    };
                    break;
                }
                case "start": {
                    var anchorOffset_1 = xToTime(mouse.x) - referenceInfo.start;
                    waveform.dragPart = 'start';
                    tracker = function (x, y) {
                        void y;
                        autoScrollForX(x);
                        var stop = referenceInfo.stop;
                        var minSpan = clamp(guiConfig.selectionHandleWidth * 2 * waveform.zoom, config.minReferenceSpan, config.maxReferenceSpan);
                        var newStart = clamp(xToTime(x) - anchorOffset_1, Math.max(0, stop - config.maxReferenceSpan), Math.max(0, stop - minSpan));
                        assert(stop - newStart <= config.maxReferenceSpan + 1e-8, "stop - newStart <= config.maxReferenceSpan + 1e-8");
                        papageno.updateReferenceRange(newStart, stop, shiftKeyDown ? 0 : config.zeroCrossingArea, 0);
                        updateSelection();
                    };
                    break;
                }
                case "stop": {
                    var anchorOffset_2 = xToTime(mouse.x) - referenceInfo.stop;
                    waveform.dragPart = 'stop';
                    tracker = function (x, y) {
                        void y;
                        autoScrollForX(x);
                        var start = referenceInfo.start;
                        var minSpan = clamp(guiConfig.selectionHandleWidth * 2 * waveform.zoom, config.minReferenceSpan, config.maxReferenceSpan);
                        var newStop = clamp(xToTime(x) - anchorOffset_2, Math.min(start + minSpan, referenceLength), Math.min(start + config.maxReferenceSpan, referenceLength));
                        assert(newStop - start <= config.maxReferenceSpan + 1e-8, "newStop - start <= config.maxReferenceSpan + 1e-8");
                        papageno.updateReferenceRange(start, newStop, 0, shiftKeyDown ? 0 : config.zeroCrossingArea);
                        updateSelection();
                    };
                    break;
                }
                case "selection": {
                    var anchorOffset_3 = xToTime(mouse.x) - referenceInfo.start;
                    waveform.dragPart = 'selection';
                    var span_1 = referenceInfo.stop - referenceInfo.start;
                    freezeHandleVisibility = true;
                    tracker = function (x, y) {
                        void y;
                        autoScrollForX(x);
                        var t = xToTime(x) - anchorOffset_3;
                        var zeroCrossingArea = (shiftKeyDown ? 0 : config.zeroCrossingArea);
                        var newStart = clamp(t, 0, referenceLength - span_1);
                        var newStop = clamp(t + span_1, span_1, referenceLength);
                        assert(newStop - newStart <= config.maxReferenceSpan + 1e-8, "newStop - newStart <= config.maxReferenceSpan + 1e-8");
                        papageno.updateReferenceRange(newStart, newStop, zeroCrossingArea, zeroCrossingArea);
                        updateSelection();
                    };
                    break;
                }
                case "bar": {
                    waveform.dragPart = 'selection';
                    var span_2 = referenceInfo.stop - referenceInfo.start;
                    freezeHandleVisibility = true;
                    tracker = function (x, y) {
                        void y;
                        autoScrollForX(x);
                        var t = xToTime(x) - span_2 / 2;
                        var zeroCrossingArea = (shiftKeyDown ? 0 : config.zeroCrossingArea);
                        var newStart = clamp(t, 0, referenceLength - span_2);
                        var newStop = clamp(t + span_2, span_2, referenceLength);
                        assert(newStop - newStart <= config.maxReferenceSpan + 1e-8, "newStop - newStart <= config.maxReferenceSpan + 1e-8");
                        papageno.updateReferenceRange(newStart, newStop, zeroCrossingArea, zeroCrossingArea);
                        updateSelection();
                    };
                    break;
                }
            }
            if (tracker !== null) {
                tracker(mouse.x, mouse.y);
            }
        };
        waveform.release = function release() {
            tracker = null;
            freezeHandleVisibility = false;
            waveform.dragPart = '';
        };
        var PI = Math.PI;
        var PI_2 = PI / 2;
        function computeRefAnimation(active, frame) {
            if (!active) {
                return "[0,0,0]";
            }
            else {
                var o = (frame - 1.2) * 2.5;
                o = o < 0 ? 0 : o > PI_2 ? 1 : Math.sin(o);
                var a = ((frame - 0.5) * 10) % (8 * PI);
                a = a < (6 * PI) ? 1 : 1.1 + Math.sin(a - PI_2) * 0.1;
                var b = ((frame - 1.1) * 10) % (8 * PI);
                b = b < (6 * PI) ? 1 : 1.1 + Math.sin(b - PI_2) * 0.1;
                return "[" + ~~(o * 100) / 100 + "," + ~~(a * 100) / 100 + "," + ~~(b * 100) / 100 + "]";
            }
        }
        function animate() {
            waveform.noRefAnimation.setup(papageno.getReferenceInfo() === null, waveform.noRefAnimationFrame);
            waveform.noRefAnimationFrame += 1 / guiConfig.animationFps;
        }
        waveform.animate = animate;
        waveform.hasReference = function hasReference() {
            return "" + (papageno.getReferenceInfo() !== null);
        };
        waveform.toggleInfo = {
            execute: function toggleInfoExecute(param) {
                var infoPage = unescape(param);
                assert(infoPage === 'info' || infoPage === 'debug');
                waveform.page = (waveform.page === infoPage ? 'waveform' : infoPage);
            },
            checked: function toggelInfoChecked() {
                return (waveform.page !== 'waveform');
            }
        };
        if (!papagenoUI.inited) {
            waveform.page = 'waveform';
            waveform.displayLow = waveform.displayHigh = '[]';
            waveform.zoom = 1.0;
            waveform.scroll = 0;
            waveform.selectionStart = waveform.selectionEnd = '';
            waveform.handlesVisible = 'no';
            waveform.cursor = 'hand';
            waveform.dragPart = '';
            waveform.noRefAnimationFrame = 0;
            waveform.noRefAnimation = new ComputedGUIVariable(computeRefAnimation);
            waveform.noRefAnimation.setup(false, 0);
        }
    })(waveform = papagenoUI.waveform || (papagenoUI.waveform = {}));
    function openReference(path, isTemp) {
        if (papagenoUI.hooks.loadReference) {
            papagenoUI.hooks.loadReference(path);
        }
        papageno.initialize(config);
        papagenoUI.clickedSolution = null;
        papageno.loadReference(path, config.maxAudioLength, isTemp);
        var referenceInfo = papageno.getReferenceInfo();
        assert(referenceInfo !== null, "referenceInfo !== null");
        assert(referenceInfo.stop - referenceInfo.start <= config.maxReferenceSpan + 1e-8, "referenceInfo.stop - referenceInfo.start <= config.maxReferenceSpan + 1e-8");
        papageno.updateReferenceRange(referenceInfo.start, referenceInfo.stop, config.zeroCrossingArea, config.zeroCrossingArea);
        waveform.newReference();
        var splittedPath = splitPath(fullPath(path));
        papagenoUI.referenceName = splittedPath[1];
        setCushyVariable('preferences.papagenoReferencesDirectory', splittedPath[0]);
        initStalks(true);
    }
    function getInitialAudioFilesDir() {
        var initialDir = getCushyVariable('preferences.papagenoReferencesDirectory');
        return (initialDir === '' ? void 0 : initialDir);
    }
    function isSearchingOrWantsTo() {
        return (papageno.isSearching() || !!papagenoUI.wantsAutoStartSearch);
    }
    papagenoUI.chooseReference = function chooseReference() {
        var resumeOnCancel = isSearchingOrWantsTo();
        papageno.stopSearch();
        papagenoUI.wantsAutoStartSearch = null;
        allSoundsOff();
        var path = browse('open', AUDIO_FILE_TYPES, getInitialAudioFilesDir());
        if (path !== null) {
            openReference(path, false);
            papagenoUI.autoSelectFlag = true;
        }
        else if (resumeOnCancel) {
            startSearch();
        }
    };
    papagenoUI.restart = {
        execute: function restartExecute() {
            if (papagenoUI.hooks.restart) {
                papagenoUI.hooks.restart();
            }
            papageno.stopSearch();
            for (var stalkIndex = papageno.getStalkCount(); --stalkIndex >= 0;) {
                papageno.respawnStalk(stalkIndex);
            }
            papagenoUI.clickedSolution = null;
            initStalks(true);
            papageno.focusOnStalk(null);
            papagenoUI.wantsAutoStartSearch = null;
        },
        enabled: function restartEnabled() {
            return papagenoUI.begunSearching;
        }
    };
    papagenoUI.playReference = {
        execute: function playReferenceExecute() {
            allSoundsOff();
            papageno.startOrStopReferencePlayback(true);
        },
        enabled: function playReferenceEnabled() {
            return (papageno.getReferenceInfo() !== null && getCushyVariable('isEnabled') === 'true');
        }
    };
    function regrowStalk(params, reseed) {
        papageno.stopSearch();
        var stalkNumber = (params === '"all"' ? null : +params);
        var currentPatch = (reseed ? getCachedPatch() : null);
        var spread = config.startingPointSpread;
        if (stalkNumber === null) {
            for (var stalkIndex = papageno.getStalkCount(); --stalkIndex >= 0;) {
                papageno.respawnStalk(stalkIndex, currentPatch, spread);
            }
            papagenoUI.clickedSolution = null;
            initStalks(true);
            papageno.focusOnStalk(null);
        }
        else {
            papageno.respawnStalk(stalkNumber, currentPatch, spread);
            if (papagenoUI.clickedSolution && papagenoUI.clickedSolution.stalk === stalkNumber) {
                papagenoUI.clickedSolution = null;
            }
            initStalk(stalkNumber);
            papageno.focusOnStalk(stalkNumber, config.focusIterations);
        }
        papagenoUI.autoSelectFlag = !reseed;
        startSearch();
    }
    papagenoUI.regrow = {
        execute: function regrowExecute(params) { regrowStalk(params, false); },
        enabled: function regrowEnabled() { return papageno.getReferenceInfo() !== null; }
    };
    papagenoUI.reseed = {
        execute: function reseedExecute(params) { regrowStalk(params, true); },
        enabled: function reseedEnabled() { return papageno.getReferenceInfo() !== null; }
    };
    papagenoUI.toggleSearch = {
        execute: function toggleSearchExecute() {
            if (papageno.isSearching()) {
                papageno.stopSearch();
            }
            else {
                startSearch();
            }
            papagenoUI.wantsAutoStartSearch = null;
        },
        enabled: function toggleSearchEnabled() {
            return (papageno.getReferenceInfo() !== null && !papagenoUI.finishedSearching);
        },
        checked: function toggleSearchChecked() {
            return isSearchingOrWantsTo();
        }
    };
    papagenoUI.toggleAutoSelect = {
        execute: function toggleAutoSelectExecute() {
            papagenoUI.autoSelectFlag = papagenoUI.autoSelectFlag === false;
        },
        enabled: function toggleAutoSelectEnabled() { return papageno.getReferenceInfo() !== null; },
        checked: function toggleAutoSelectChecked() {
            return papagenoUI.autoSelectFlag;
        }
    };
    papagenoUI.togglePitchCorrect = {
        execute: function togglePitchCorrectExecute() {
            papagenoUI.pitchCorrectionFlag = !papagenoUI.pitchCorrectionFlag;
            refreshPatch();
            if (papagenoUI.clickedSolution && fixPitch(papagenoUI.clickedSolution.patch)) {
                papagenoUI.clickedSolution.patch.id = setElement('patch', papagenoUI.clickedSolution.patch);
            }
        },
        enabled: function togglePitchCorrectEnabled() { return papageno.getReferenceInfo() !== null; },
        checked: function togglePitchCorrectChecked() {
            return papagenoUI.pitchCorrectionFlag;
        }
    };
    papagenoUI.autoStartSearch = function autoStartSearch() {
        if (!!papagenoUI.wantsAutoStartSearch) {
            startSearch();
        }
        papagenoUI.wantsAutoStartSearch = null;
    };
    function pitchToString(pitch) {
        pitch += 50 / 1200;
        var oct = Math.floor(pitch);
        var semis = Math.floor((pitch - oct) * 12);
        var cents = Math.round(1200 * (pitch - (oct + semis / 12))) - 50;
        return "" + NOTE_NAMES[semis] + (oct + 3) + (cents >= 0 ? '+' : '') + cents;
    }
    var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    papagenoUI.detectedPitch = function detectedPitch() {
        var info = papageno.getReferenceInfo();
        return (info === null ? '' : pitchToString(info.pitch));
    };
    function calcMasterTuningPitchAdjust() {
        return -Math.log(getElement('midiConfig').masterTuning / 440) / Math.LN2;
    }
    function fixPitch(patch) {
        var newPitchAdjust = 0;
        if (papagenoUI.pitchCorrectionFlag) {
            var info = papageno.getReferenceInfo();
            if (info) {
                newPitchAdjust = Math.round(info.pitch) - info.pitch;
            }
        }
        else {
            newPitchAdjust = calcMasterTuningPitchAdjust();
        }
        if (patch.pitchAdjust != newPitchAdjust) {
            patch.pitchAdjust = newPitchAdjust;
            return true;
        }
        return false;
    }
    function selectSolution(solution, trigger, byUser) {
        saveUndo(translate("Pick Papageno Patch"), true);
        papagenoUI.clickedSolution = solution;
        var patch = solution.patch;
        fixPitch(patch);
        patch.id = setElement('patch', patch);
        if (getCushyVariable('isEnabled') === 'true') {
            allSoundsOff();
            if (trigger) {
                papagenoUI.noteOnKey = Math.round(clamp(60 - (papagenoUI.pitchCorrectionFlag
                    ? (solution.patch.pitchAdjust - calcMasterTuningPitchAdjust()) * 12 : 0), 1, 127));
                sendMidi(0xB0, 0x79);
                sendMidi(0x90, papagenoUI.noteOnKey, 127);
                var timeNow = getMonotonicTime();
                papagenoUI.noteOffTime = timeNow + solution.duration * 1000;
                var triggers = papagenoUI.stalks[solution.stalk].triggers;
                if (triggers.length < 8) {
                    triggers.push({ solution: solution, when: timeNow });
                }
                if (byUser) {
                    papagenoUI.blockAutoSelect = papagenoUI.noteOffTime;
                }
            }
        }
    }
    papagenoUI.keyModifiers = {
        set: function stalkKeyModifiersSet(value) {
            var modifiers = value.split('+');
            shiftKeyDown = false;
            for (var i = modifiers.length; --i >= 0;) {
                if (modifiers[i] === 'shift') {
                    shiftKeyDown = true;
                    break;
                }
            }
        }
    };
    papagenoUI.clickStalk = function clickStalk(param) {
        var stalkNumber = +param;
        assert(papagenoUI.clickPosition !== null, "clickPosition !== null");
        var xy = toMousePosition(papagenoUI.clickPosition);
        var x = xy.x;
        var y = xy.y;
        var stalkInfo = papagenoUI.stalks[stalkNumber].stalkInfo;
        var solutionCount = stalkInfo.solutions;
        var nearestDistance = Infinity;
        var nearestSolution = null;
        for (var i = 0; i < solutionCount; ++i) {
            var solution_2 = getSolution(stalkNumber, i);
            if (solution_2.animatedX !== null) {
                var distance = square(solution_2.animatedX - x) + square(solution_2.animatedY - y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestSolution = solution_2;
                }
            }
        }
        if (nearestSolution) {
            papagenoUI.autoSelectFlag = false;
            selectSolution(nearestSolution, !shiftKeyDown, true);
        }
        papageno.focusOnStalk(stalkNumber, config.focusIterations);
    };
    papagenoUI.noteOffTick = function noteOffTick() {
        if (papagenoUI.noteOffTime && getMonotonicTime() >= papagenoUI.noteOffTime) {
            assert(papagenoUI.noteOnKey !== null, "noteOnKey !== null");
            sendMidi(0x80, papagenoUI.noteOnKey, 127);
            papagenoUI.noteOffTime = null;
        }
    };
    papagenoUI.animate = function animate() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        var activeStalkNumber = (papageno.isSearching() ? papageno.getActiveStalkNumber() : null);
        var cfg = guiConfig;
        for (var stalkIndex = papagenoUI.stalks.length; --stalkIndex >= 0;) {
            var stalk = papagenoUI.stalks[stalkIndex];
            if (stalk.stalkInfo.iterations > stalk.lastTwitchIteration) {
                stalk.lastTwitchIteration = stalk.stalkInfo.iterations;
                if (random.uniform() < 0.5) {
                    ++stalk.twitchesTicker;
                }
            }
            if (stalkIndex === activeStalkNumber) {
                stalk.tangleRotationSpeed = lerp(stalk.tangleRotationSpeed, cfg.maxRotationSpeed, cfg.rotationAcceleration);
            }
            else {
                var isMostRecent = (getCushyVariable('window.isMostRecent') === "true");
                stalk.tangleRotationSpeed = lerp(stalk.tangleRotationSpeed, (isMostRecent ? cfg.minRotationSpeed : 0), cfg.rotationDeacceleration);
                if (stalk.tangleRotationSpeed < 0.00001) {
                    stalk.tangleRotationSpeed = 0;
                }
            }
            stalk.tangleRotation = (stalk.tangleRotation + stalk.tangleRotationSpeed) % 1;
            stalk.animationsDirty = true;
        }
        if (isSearchingOrWantsTo()) {
            papagenoUI.cogRotation = (papagenoUI.cogRotation + 1) % 360;
        }
        if (splash.isAnimating) {
            splash.animate();
        }
        waveform.animate();
    };
    function getSolution(stalkNumber, solutionNumber) {
        return papagenoUI.stalks[stalkNumber].solutions[solutionNumber];
    }
    function doPollResults(birthdayTime) {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        var timeNow = getMonotonicTime();
        birthdayTime = birthdayTime || timeNow;
        var selectNewSolution = null;
        var doAutoSelect = (!papagenoUI.blockAutoSelect || timeNow >= papagenoUI.blockAutoSelect);
        var newTotalIterations = 0;
        for (var stalkNumber = papageno.getStalkCount(); --stalkNumber >= 0;) {
            var stalk = papagenoUI.stalks[stalkNumber];
            var stalkInfo = papageno.getStalkInfo(stalkNumber);
            stalk.stalkInfo = stalkInfo;
            var solutionCount = stalkInfo.solutions;
            newTotalIterations += stalkInfo.iterations;
            for (var solutionNumber = stalk.solutions.length; solutionNumber < solutionCount; ++solutionNumber) {
                var solution_3 = papageno.getSolution(stalkNumber, solutionNumber);
                solution_3.stalk = stalkNumber;
                solution_3.number = solutionNumber;
                var x = scrambleToFloat(solution_3.patch.seedId + 24857243) * 2 - 1;
                var cfg = guiConfig;
                var w = cfg.greenhouseWidth - cfg.horizontalMargin * 2;
                solution_3.x = cfg.horizontalMargin + (Math.sign(x) * cfg.tangleWidth + w + x * (w - cfg.tangleWidth)) * 0.5;
                solution_3.y = cfg.topMargin + (cfg.greenhouseHeight - cfg.topMargin - cfg.bottomMargin) * (1 - solution_3.height);
                solution_3.animatedX = null;
                solution_3.animatedY = null;
                solution_3.patch.name = papagenoUI.referenceName + ' ' + solution_3.patch.seedId;
                solution_3.birthday = birthdayTime;
                var sum = 0;
                var genome = solution_3.patch.genome;
                for (var i = GENES.length; --i >= 0;) {
                    sum += genome[GENES[i].NAME];
                }
                var hueAdjust = sum * guiConfig.budHueSpread;
                solution_3.color = guiConfig.budBaseColor.adjustHue(hueAdjust).toHex();
                solution_3.selectedColor = guiConfig.budSelectedColor.adjustHue(hueAdjust).toHex();
                if (doAutoSelect && (!papagenoUI.lastAutoSelected || solution_3.birthday > papagenoUI.lastAutoSelected)) {
                    papagenoUI.lastAutoSelected = solution_3.birthday;
                    selectNewSolution = solution_3;
                }
                stalk.solutions[solutionNumber] = solution_3;
            }
        }
        papagenoUI.totalIterations = newTotalIterations;
        if (papagenoUI.lastTestsPerSecondUpdate === null || timeNow > papagenoUI.lastTestsPerSecondUpdate + 1000) {
            if (papagenoUI.lastTestsPerSecondUpdate !== null) {
                papagenoUI.testsPerSecond = (newTotalIterations - papagenoUI.lastTotalIterations) * 1000
                    / (timeNow - papagenoUI.lastTestsPerSecondUpdate);
            }
            papagenoUI.lastTotalIterations = newTotalIterations;
            papagenoUI.lastTestsPerSecondUpdate = timeNow;
        }
        if (papagenoUI.autoSelectFlag && selectNewSolution
            && (!papagenoUI.clickedSolution || papagenoUI.clickedSolution.birthday < selectNewSolution.birthday)) {
            selectSolution(selectNewSolution, true, false);
        }
        if (papageno.finishedSearching()) {
            papagenoUI.finishedSearching = true;
        }
    }
    papagenoUI.pollResults = function pollResults() {
        doPollResults();
    };
    function refreshPatch() {
        var currentPatchId = getCachedPatch().patchId;
        assert(currentPatchId !== null);
        if (lastPatchId !== currentPatchId) {
            lastPatchId = currentPatchId;
            if (papagenoUI.clickedSolution && papagenoUI.clickedSolution.patch.patchId !== currentPatchId) {
                if (papagenoUI.noteOffTime) {
                    assert(papagenoUI.noteOnKey !== null, "noteOnKey !== null");
                    sendMidi(0x80, papagenoUI.noteOnKey, 127);
                    papagenoUI.noteOffTime = null;
                }
                papagenoUI.autoSelectFlag = false;
                papagenoUI.clickedSolution = null;
            }
            if (!papagenoUI.clickedSolution) {
                for (var stalkNumber = papageno.getStalkCount(); --stalkNumber >= 0;) {
                    var stalk = papagenoUI.stalks[stalkNumber];
                    for (var solutionNumber = stalk.solutions.length; --solutionNumber >= 0;) {
                        var solution_4 = stalk.solutions[solutionNumber];
                        if (solution_4.patch.patchId === currentPatchId) {
                            papagenoUI.clickedSolution = solution_4;
                            return;
                        }
                    }
                }
            }
        }
    }
    papagenoUI.patchUpdated = refreshPatch;
    papagenoUI.close = function close(_p) {
        if (papagenoUI.hooks.close) {
            papagenoUI.hooks.close();
        }
        if (papagenoUI.noteOffTime) {
            allSoundsOff();
        }
        else {
            papageno.startOrStopReferencePlayback(false);
        }
        if (papagenoUI.wantsAutoStartSearch === null) {
            papagenoUI.wantsAutoStartSearch = papageno.isSearching();
        }
        papageno.stopSearch();
        var state = {
            autoSelect: papagenoUI.autoSelectFlag,
            pitchCorrect: papagenoUI.pitchCorrectionFlag,
            waveformZoom: waveform.zoom,
            waveformScroll: waveform.scroll,
            waveformPage: waveform.page,
            begunSearching: papagenoUI.begunSearching,
            finishedSearching: papagenoUI.finishedSearching
        };
        setCushyVariable('instance.papagenoUIState', composeNumbstrict(state));
        setCushyVariable('preferences.papagenoPitchCorrection', "" + papagenoUI.pitchCorrectionFlag);
    };
    papagenoUI.earlyClose = function earlyClose(p) {
        if (getDisplayedCushy('modal') !== 'Synplant2_papageno') {
            papagenoUI.close(p);
        }
    };
    function startSearch() {
        if (papagenoUI.hooks.startSearch) {
            papagenoUI.hooks.startSearch();
        }
        papageno.startSearch();
        papagenoUI.begunSearching = true;
    }
    papagenoUI.startSearch = startSearch;
    papagenoUI.reseedModifier = function () {
        return "" + main.modifiers.alt;
    };
    var splash;
    (function (splash) {
        var SPEED = 0.022;
        splash.animationProps = new ComputedGUIVariable(computePropsString);
        function computePropsString() {
            return "[" + splash.props.map(function (f) { return ~~(f[1].getCurrent() * 1000) / 1000; }).join(",") + "]";
        }
        function animate() {
            var done = true;
            for (var i = 0; i < splash.props.length; ++i) {
                var p = splash.props[i];
                done = done && p[1].reachedTarget();
                if (splash.frame > p[0]) {
                    p[1].process();
                }
            }
            splash.isAnimating = !done;
            if (!done) {
                splash.frame += 1 / guiConfig.animationFps;
                splash.animationProps.reset();
            }
        }
        splash.animate = animate;
        if (!papagenoUI.inited) {
            splash.props = [
                [0.12, new Filtered(0, SPEED * 1.0, 1)],
                [0.24, new Filtered(0, SPEED * 0.9, 1)],
                [0.36, new Filtered(0, SPEED * 0.9, 1)],
                [0.00, new Filtered(-160, SPEED * 1.0, 0)],
                [0.00, new Filtered(-160, SPEED * 0.9, 0)],
                [0.00, new Filtered(-160, SPEED * 0.9, 0)],
                [0.08, new Filtered(0, SPEED * 0.5 * 1.0, 1)],
                [0.08, new Filtered(0, SPEED * 0.5 * 0.9, 1)],
                [0.08, new Filtered(0, SPEED * 0.5 * 0.9, 1)],
                [0.24, new Filtered(0, SPEED * 0.5 * 0.8, 1)],
            ];
            splash.isAnimating = true;
            splash.frame = 0;
        }
    })(splash = papagenoUI.splash || (papagenoUI.splash = {}));
    papagenoUI.open = function open() {
        papagenoUI.referenceName = '';
        var info = papageno.getReferenceInfo();
        if (info !== null) {
            papagenoUI.referenceName = splitPath(info.path)[1];
        }
        initStalks(false);
        var stateString = getCushyVariable('instance.papagenoUIState');
        var state;
        if (stateString !== '') {
            state = parseNumbstrict(stateString);
            papagenoUI.autoSelectFlag = state.autoSelect;
            papagenoUI.pitchCorrectionFlag = state.pitchCorrect;
            papagenoUI.begunSearching = state.begunSearching;
            papagenoUI.finishedSearching = state.finishedSearching;
        }
        else {
            papagenoUI.pitchCorrectionFlag = (getCushyVariable('preferences.papagenoPitchCorrection') === 'true');
        }
        waveform.open(state);
    };
    papagenoUI.configure = function configure(configParams) {
        var cfg = parseNumbstrict(configParams);
        guiConfig = {
            greenhouseHeight: +cfg.greenhouseHeight,
            greenhouseWidth: +cfg.greenhouseWidth,
            tanglePoints: +cfg.tanglePoints,
            tangleWidth: +cfg.tangleWidth,
            tangleXScale: +cfg.tangleXScale,
            tangleYScale: +cfg.tangleYScale,
            tangleXSmoothing: +cfg.tangleXSmoothing,
            tangleYSmoothing: +cfg.tangleYSmoothing,
            perspectiveDepth: +cfg.perspectiveDepth,
            minBudSize: +cfg.minBudSize,
            maxBudSize: +cfg.maxBudSize,
            minBudError: +cfg.minBudError,
            maxBudError: +cfg.maxBudError,
            horizontalMargin: +cfg.horizontalMargin,
            topMargin: +cfg.topMargin,
            bottomMargin: +cfg.bottomMargin,
            maxRotationSpeed: +cfg.maxRotationSpeed,
            minRotationSpeed: +cfg.minRotationSpeed,
            rotationAcceleration: +cfg.rotationAcceleration,
            rotationDeacceleration: +cfg.rotationDeacceleration,
            waveformDisplayWidth: +cfg.waveformDisplayWidth,
            waveformDisplayHeight: +cfg.waveformDisplayHeight,
            waveformMaxZoom: +cfg.waveformMaxZoom,
            selectionHandleWidth: +cfg.selectionHandleWidth,
            selectionHandleHeight: +cfg.selectionHandleHeight,
            autoScrollSpeed: +cfg.autoScrollSpeed,
            seedNameGlyphWidth: +cfg.seedNameGlyphWidth,
            animationFps: +cfg.animationFps,
            budBaseColor: Color.fromHex(cfg.budBaseColor),
            budSelectedColor: Color.fromHex(cfg.budSelectedColor),
            budHueSpread: +cfg.budHueSpread
        };
    };
    papagenoUI.openRequestedReference = function openRequestedReference() {
        var request = getCushyVariable('main.openPapagenoReferenceRequest');
        if (request !== '') {
            setCushyVariable('main.openPapagenoReferenceRequest', '');
            var info = parseNumbstrict(request);
            openReference(info.path, info.temporary);
            papagenoUI.autoSelectFlag = true;
            papagenoUI.wantsAutoStartSearch = null;
        }
    };
    papagenoUI.tps = function tps() {
        return "" + Math.round(papagenoUI.testsPerSecond);
    };
    papagenoUI.activeStalkNumber = function activeStalkNumber() {
        return "" + papageno.getActiveStalkNumber();
    };
    papagenoUI.iterationCount = function iterationCount() {
        return "" + papageno.getStalkInfo(papageno.getActiveStalkNumber()).iterations;
    };
    papagenoUI.crossOrNetTactics = function crossOrNetTactics() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        var activeStalk = papageno.getActiveStalkNumber();
        if (papageno.getStalkInfo(activeStalk).seed === null) {
            var ratios = papageno.getTacticsSuccessRatios(activeStalk).crossOrNet;
            return Math.round(ratios[0] * 100) + "/" + Math.round(ratios[1] * 100);
        }
        else {
            return "N/A";
        }
    };
    papagenoUI.reviseCountsTactics = function reviseCountsTactics() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        var activeStalk = papageno.getActiveStalkNumber();
        if (papageno.getStalkInfo(activeStalk).seed === null) {
            var ratios = papageno.getTacticsSuccessRatios(activeStalk).reviseCounts;
            for (var i = 0; i < ratios.length; ++i) {
                ratios[i] = Math.round(ratios[i] * 100);
            }
            return ratios.join("/");
        }
        else {
            return "N/A";
        }
    };
    papagenoUI.netName = function netName() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        return papageno.getNetInfo().name;
    };
    papagenoUI.netDate = function netDate() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        return papageno.getNetInfo().date.toUTCString();
    };
    papagenoUI.codeSize = function codeSize() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        return '' + papageno.getNetInfo().codeSize;
    };
    papagenoUI.pdResolution = function pdResolution() {
        assert(papageno.isInitialized(), "papageno.isInitialized()");
        return '' + papageno.getNetInfo().pdResolution;
    };
    var solution;
    (function (solution) {
        solution.clicked = function solutionClicked() {
            return '' + !!papagenoUI.clickedSolution;
        };
        solution.iteration = function solutionIteration() {
            return (papagenoUI.clickedSolution ? "" + papagenoUI.clickedSolution.iteration : '');
        };
        solution.error = function solutionError() {
            return (papagenoUI.clickedSolution ? "" + papagenoUI.clickedSolution.error.toFixed(3) : '');
        };
        solution.start = function solutionStart() {
            return (papagenoUI.clickedSolution ? papagenoUI.clickedSolution.offset.toFixed(3) + "s" : '');
        };
        solution.duration = function solutionDuration() {
            return (papagenoUI.clickedSolution ? papagenoUI.clickedSolution.duration.toFixed(3) + "s" : '');
        };
        solution.end = function solutionEnd() {
            return (papagenoUI.clickedSolution ? (papagenoUI.clickedSolution.offset + papagenoUI.clickedSolution.duration).toFixed(3) + "s" : '');
        };
        solution.isSeeded = function solutionIsSeeded() {
            return '' + (papagenoUI.clickedSolution && papageno.getStalkInfo(papagenoUI.clickedSolution.stalk).seed !== null);
        };
        solution.seedName = function solutionSeedName() {
            if (!papagenoUI.clickedSolution) {
                return '';
            }
            else {
                var seed = papageno.getStalkInfo(papagenoUI.clickedSolution.stalk).seed;
                return (seed ? seed.name : 'none');
            }
        };
        solution.seedNameWidth = function solutionSeedNameWidth() {
            return '' + Math.ceil(solution.seedName().length * guiConfig.seedNameGlyphWidth);
        };
        solution.clickSeed = function solutionClickSeed() {
            if (papagenoUI.clickedSolution) {
                var seed = papageno.getStalkInfo(papagenoUI.clickedSolution.stalk).seed;
                if (seed) {
                    saveUndo(translate("Click Seed"));
                    setElement('patch', seed);
                }
            }
        };
    })(solution = papagenoUI.solution || (papagenoUI.solution = {}));
    function stopAutoSelect() {
        papagenoUI.autoSelectFlag = false;
    }
    papagenoUI.stopAutoSelect = stopAutoSelect;
    function setHook(hook, callback) {
        var oldHook = papagenoUI.hooks[hook];
        papagenoUI.hooks[hook] = callback;
        return oldHook;
    }
    papagenoUI.setHook = setHook;
    function getReferenceName() {
        return papagenoUI.referenceName;
    }
    papagenoUI.getReferenceName = getReferenceName;
    function resetHooks() {
        papagenoUI.hooks = {
            startSearch: null,
            restart: null,
            loadReference: null,
            close: null
        };
    }
    papagenoUI.resetHooks = resetHooks;
    if (!papagenoUI.inited) {
        resetHooks();
        papagenoUI.autoSelectFlag = true;
        papagenoUI.pitchCorrectionFlag = false;
        papagenoUI.wantsAutoStartSearch = false;
        papagenoUI.clickedSolution = null;
        papagenoUI.noteOnKey = null;
        papagenoUI.noteOffTime = null;
        papagenoUI.stalks = [];
        papagenoUI.clickPosition = '';
        papagenoUI.blockAutoSelect = null;
        papagenoUI.lastAutoSelected = null;
        papagenoUI.totalIterations = 0;
        papagenoUI.lastTestsPerSecondUpdate = null;
        papagenoUI.lastTotalIterations = 0;
        papagenoUI.testsPerSecond = 0;
        papagenoUI.cogRotation = 0;
        if (!papageno.isInitialized()) {
            try {
                papageno.initialize(config);
            }
            catch (x) {
                display('Error initializing AI engine. Please reinstall Synplant.');
                displayCushy(null, 'modal');
                throw x;
            }
        }
        papagenoUI.inited = true;
    }
    (function () {
        assert(typeof papagenoUI.stalks !== 'undefined');
        for (var i = papagenoUI.stalks.length; --i >= 0;) {
            if (papagenoUI.stalks[i]) {
                updateStalkFunctions(papagenoUI.stalks[i]);
            }
        }
    })();
})(papagenoUI || (papagenoUI = {}));
