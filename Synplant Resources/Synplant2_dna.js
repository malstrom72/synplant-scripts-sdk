var dna;
(function (dna) {
    dna.waveformA = {
        path: new ComputedGUIVariable(computeWaveformA),
        thinness: 1,
        zoom: 3
    };
    dna.waveformB = {
        path: new ComputedGUIVariable(computeWaveformB),
        thinness: 1,
        zoom: 3
    };
    var helix;
    (function (helix) {
        var GENE_COUNT = GENES.length;
        var TAU = Math.PI * 2;
        var X_OFFSET = 20;
        var Y_OFFSET = 21;
        var HEIGHT = 460;
        var WIDTH = 50;
        var STEP_MARGIN = 0.06;
        var STEP_WIDTH = (1 - STEP_MARGIN * 2);
        var TWIST = 1.2;
        var TURN = 10;
        var PHASE = Math.PI / 3;
        var EXTRA_RAIL = 1;
        var IDLE_ROTATE = 0.015;
        var FAST_ROTATE = 0.07;
        var SLOW_ROTATE = 0.02;
        helix.helixIVG = null;
        helix.keyModifiers = '';
        helix.hoverGene = '';
        helix.doIdleRotation = true;
        helix.idleRotationSpeed = IDLE_ROTATE;
        helix.mouse = { x: 0, y: 0 };
        helix.focusedGene = null;
        helix.editingGene = null;
        helix.trackingGene = null;
        helix.trackingBlock = 0;
        helix.trackingValue = 0;
        helix.renderedHelixRotation = 0;
        helix.clickY = 0;
        function updateConfig() {
            var revolutions = Math.ceil(TWIST) + 1;
            var bands = revolutions * 2 + 1;
            helix.railTwistHeight = HEIGHT / TWIST * 100;
            helix.railGradientHeight = revolutions * helix.railTwistHeight;
            assert(dna.guiConfig !== undefined, "guiConfig !== undefined");
            var ls = new StringBuilder("stops:[");
            var rs = new StringBuilder("stops:[");
            for (var i = 0; i < bands; ++i) {
                var stop = i / (bands - 1);
                var col = i % 2;
                ls.append(stop + ",$left_rail_" + (col == 0 ? 'dark' : 'light') + " ");
                rs.append(stop + ",$right_rail_" + (col == 0 ? 'light' : 'dark') + " ");
            }
            ls.append("]");
            rs.append("]");
            helix.leftRailGradient = ls.build();
            helix.rightRailGradient = rs.build();
            helix.rotation = new Filtered(-Math.PI, IDLE_ROTATE, 0);
        }
        helix.updateConfig = updateConfig;
        function rotate(target, rate) {
            var current = helix.rotation.getTarget();
            while (target - current > Math.PI) {
                target -= TAU;
            }
            while (current - target > Math.PI) {
                target += TAU;
            }
            helix.rotation.setRate(rate);
            helix.rotation.setTarget(target);
        }
        function rotateToGene(gene) {
            var row = main.geneNameToIndex(gene);
            var angle = TWIST * TAU * row / GENE_COUNT;
            rotate(angle, SLOW_ROTATE);
        }
        helix.rotateToGene = rotateToGene;
        function focusGene(gene) {
            if (helix.focusedGene !== gene) {
                helix.focusedGene = gene;
                helix.helixIVG = null;
            }
        }
        helix.focusGene = focusGene;
        function idleRotate(rotate) {
            if (rotate) {
                helix.doIdleRotation = true;
            }
            else {
                helix.doIdleRotation = false;
                helix.idleRotationSpeed = 0.0;
            }
        }
        helix.idleRotate = idleRotate;
        helix.ivg = function ivg() {
            function addRailPath(target, pathA, pathB) {
                if (pathA.length > 0) {
                    target.push("PATH svg:[M" + pathA.join(" ").substr(1) + pathB.reverse().join(" ") + "]");
                }
            }
            if (!helix.helixIVG) {
                assert(dna.guiConfig !== undefined, "guiConfig !== undefined");
                var leftRailBack = [];
                var leftRailFront = [];
                var rightRailBack = [];
                var rightRailFront = [];
                var leftSteps = [];
                var rightSteps = [];
                var focused = [];
                var genes = {
                    army: { unselected: [], selected: [], circle: [] },
                    amber: { unselected: [], selected: [], circle: [] },
                    fire: { unselected: [], selected: [], circle: [] },
                    navy: { unselected: [], selected: [], circle: [] },
                    royal: { unselected: [], selected: [], circle: [] }
                };
                var leftPathA = [];
                var leftPathB = [];
                var leftWasFront = true;
                var rightPathA = [];
                var rightPathB = [];
                var rightWasFront = true;
                var rot = helix.renderedHelixRotation = helix.rotation.getCurrent();
                {
                    var p_1 = helix.railTwistHeight + helix.railTwistHeight / 4;
                    var o = rot / (TAU) * helix.railTwistHeight - p_1;
                    var fill = "fill gradient:[linear 0," + o + ",0," + (o + helix.railGradientHeight);
                    var l = fill + " " + helix.leftRailGradient + "]";
                    var r = fill + " " + helix.rightRailGradient + "]";
                    leftRailBack.push(l);
                    leftRailFront.push(l);
                    rightRailBack.push(r);
                    rightRailFront.push(r);
                }
                var geneCount = GENE_COUNT;
                var b = TAU * TWIST / geneCount;
                var a = HEIGHT / b;
                var e = geneCount * 2 - 1 + EXTRA_RAIL;
                var ge = geneCount;
                var w = WIDTH, h = HEIGHT / geneCount, p = PHASE, t = TURN, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt;
                var dnaBranches = branches;
                var g = 0;
                for (var i = -EXTRA_RAIL; i < e; ++i) {
                    var f = i / 2;
                    var cy = f * h;
                    var u = b * f - rot;
                    var leftS = sin(u + p);
                    var leftC = cos(u + p);
                    var rightS = sin(u - p);
                    var rightC = cos(u - p);
                    var leftX = (w * (1 - leftS)) * 100;
                    var leftY = (cy + leftC * t) * 100;
                    var rightX = (w * (1 - rightS)) * 100;
                    var rightY = (cy + rightC * t) * 100;
                    var sinT = sin(u);
                    var leftIsFront = sinT > -0;
                    var rightIsFront = sinT < 0;
                    if (leftIsFront !== leftWasFront && leftPathA.length > 0) {
                        addRailPath(leftWasFront ? leftRailFront : leftRailBack, leftPathA, leftPathB);
                        leftPathA = [leftPathA[leftPathA.length - 1]];
                        leftPathB = [leftPathB[0]];
                    }
                    leftWasFront = leftIsFront;
                    if (rightIsFront !== rightWasFront && rightPathA.length > 0) {
                        addRailPath(rightWasFront ? rightRailFront : rightRailBack, rightPathA, rightPathB);
                        rightPathA = [rightPathA[rightPathA.length - 1]];
                        rightPathB = [rightPathB[0]];
                    }
                    rightWasFront = rightIsFront;
                    {
                        var leftDX = -w * leftC;
                        var leftDY = a - t * leftS;
                        var rightDX = -w * rightC;
                        var rightDY = a - t * rightS;
                        var strokeWidth = 3 - cos(u * 2) * 1.5;
                        var leftLength = strokeWidth / sqrt(leftDX * leftDX + leftDY * leftDY);
                        var rightLength = strokeWidth / sqrt(rightDX * rightDX + rightDY * rightDY);
                        var leftRailX = (-leftDY * leftLength) * 100;
                        var leftRailY = (leftDX * leftLength) * 100;
                        var rightRailX = (-rightDY * rightLength) * 100;
                        var rightRailY = (rightDX * rightLength) * 100;
                        leftPathA.push("L" + ~~(leftX - leftRailX) + "," + ~~(leftY - leftRailY));
                        leftPathB.push("L" + ~~(leftX + leftRailX) + "," + ~~(leftY + leftRailY));
                        rightPathA.push("L" + ~~(rightX - rightRailX) + "," + ~~(rightY - rightRailY));
                        rightPathB.push("L" + ~~(rightX + rightRailX) + "," + ~~(rightY + rightRailY));
                    }
                    if (i >= 0 && i % 2 == 0 && g < ge) {
                        var dx = (rightX - leftX) * STEP_WIDTH;
                        var dy = (rightY - leftY) * STEP_WIDTH;
                        var stepLeftX = leftX + STEP_MARGIN * dx;
                        var stepLeftY = leftY + STEP_MARGIN * dy;
                        var geneName = GENES[g].NAME;
                        var geneColor = dna.guiConfig.geneColors[geneName];
                        var rootValue = dna.root[geneName];
                        var rp = ~~(stepLeftX + dx * rootValue) + "," + ~~(stepLeftY + dy * rootValue);
                        leftSteps.push("PATH svg:[M" + ~~stepLeftX + "," + ~~stepLeftY + "L" + rp + "]");
                        rightSteps.push("PATH svg:[M" + ~~(stepLeftX + dx) + "," + ~~(stepLeftY + dy) + "L" + rp + "]");
                        var selected_1 = genes[geneColor].selected, unselected = genes[geneColor].unselected, circle = genes[geneColor].circle;
                        var selectedLength = selected_1.length - 1, circleLength = circle.length - 1, unselectedLength = unselected.length - 1;
                        var hasFocus = (helix.focusedGene === geneName);
                        if (hasFocus) {
                            focused[0] =
                                "fill opacity:0.9 $gene_highlight; pen none; ELLIPSE " + rp + ",380; " +
                                    ("fill opacity:0.5 $" + geneColor + "_light; pen $" + geneColor + "_dark opacity: 0.7 width: 150; ELLIPSE " + rp + ",380");
                        }
                        else {
                            circle[++circleLength] = "ELLIPSE " + rp + ",320";
                        }
                        for (var d = 12; --d >= 0;) {
                            var dv = dnaBranches[d][geneName];
                            var dp = ~~(stepLeftX + dx * dv) + "," + ~~(stepLeftY + dy * dv);
                            unselected[++unselectedLength] = "PATH svg:[M" + rp + "L" + dp + "]";
                            if (d === main.selectedBranchIndex) {
                                selected_1[++selectedLength] = "ELLIPSE " + dp + ",144";
                            }
                        }
                        ++g;
                    }
                }
                addRailPath(leftWasFront ? leftRailFront : leftRailBack, leftPathA, leftPathB);
                addRailPath(rightWasFront ? rightRailFront : rightRailBack, rightPathA, rightPathB);
                var result = new StringBuilder();
                result.append("offset " + X_OFFSET + "," + Y_OFFSET + "\n");
                result.append("scale 0.01\n");
                result.append("options curve-quality: 0.5\n");
                var draw = [
                    ["pen none;"],
                    leftRailBack, rightRailBack,
                    ["fill none; pen opacity:0.6 width:70 caps:butt"],
                    ["pen $left_rung"], leftSteps,
                    ["pen $right_rung"], rightSteps,
                    ["pen width: 400 opacity: 0.1 caps: round"],
                    ["pen $army_light"], genes.army.unselected,
                    ["pen $amber_light"], genes.amber.unselected,
                    ["pen $fire_light"], genes.fire.unselected,
                    ["pen $navy_light"], genes.navy.unselected,
                    ["pen $royal_light"], genes.royal.unselected,
                    ["fill opacity: 0.7; pen none"],
                    ["fill $army_dark"], genes.army.selected,
                    ["fill $amber_dark"], genes.amber.selected,
                    ["fill $fire_dark"], genes.fire.selected,
                    ["fill $navy_dark"], genes.navy.selected,
                    ["fill $royal_dark"], genes.royal.selected,
                    ["fill opacity: 0.9 $gene_background; pen opacity: 0.7 width: 100"],
                    ["pen $army_dark"], genes.army.circle,
                    ["pen $amber_dark"], genes.amber.circle,
                    ["pen $fire_dark"], genes.fire.circle,
                    ["pen $navy_dark"], genes.navy.circle,
                    ["pen $royal_dark"], genes.royal.circle,
                    ["fill none; pen opacity: 1.0 width: 200 #ff0000"],
                    focused,
                    ["fill opacity: 1; pen none"],
                    leftRailFront, rightRailFront,
                ];
                for (var i = 0; i < draw.length; ++i) {
                    result.append(draw[i].join("\n"));
                    result.append("\n");
                }
                helix.helixIVG = result.build();
            }
            return helix.helixIVG;
        };
        function animate() {
            if (helix.doIdleRotation) {
                if (getCushyVariable('window.isMostRecent') === "true") {
                    helix.idleRotationSpeed = Math.min(helix.idleRotationSpeed + IDLE_ROTATE * 0.002, IDLE_ROTATE);
                }
                else {
                    helix.idleRotationSpeed = Math.max(helix.idleRotationSpeed - IDLE_ROTATE * 0.05, 0);
                }
                helix.rotation.setTarget(helix.rotation.getTarget() + helix.idleRotationSpeed);
            }
            var rot = helix.rotation.process(0.001);
            if (rot >= TAU) {
                rot %= TAU;
                helix.rotation.setCurrent(rot);
                helix.rotation.setTarget(helix.rotation.getTarget() % TAU);
            }
            if (Math.abs(floorMod(rot - helix.renderedHelixRotation + Math.PI, TAU) - Math.PI) > 0.003) {
                helix.helixIVG = null;
            }
        }
        helix.animate = animate;
        helix.hoverPosition = {
            set: function (value) {
                assert(helix.trackingGene === null, "trackingGene === null");
                var position = toMousePosition(value);
                var MAX_ROTATE = (GENE_COUNT - 1) / GENE_COUNT;
                var helixPos = (position.y - Y_OFFSET - Math.cos(PHASE) * TURN) / HEIGHT;
                var angle = TWIST * TAU * clamp(helixPos, 0, MAX_ROTATE);
                rotate(angle, FAST_ROTATE);
                var gene = Math.floor(helixPos * GENE_COUNT + 0.5);
                if (position.x > 26 && position.x < 113 && gene >= 0 && gene < GENE_COUNT) {
                    assert(GENES[gene] !== undefined, "GENES[" + gene + "] !== undefined");
                    var geneName = GENES[gene].NAME;
                    dna.hintGene = geneName;
                    focusGene(geneName);
                    if (helix.hoverGene !== dna.hintGene) {
                        helix.hoverGene = dna.hintGene;
                        performCushyAction('hint', "{ offset: { 0, 22 }, text: \"" + helix.hoverGene + " = [var]params." + helix.hoverGene + ".human[/var]\", extent: 22 }");
                    }
                }
                else {
                    helix.hoverGene = "";
                    focusGene(null);
                }
            }
        };
        helix.clickPosition = {
            set: function clickPositionSet(value) {
                var lastMouse = helix.mouse;
                helix.mouse = toMousePosition(value);
                if (helix.trackingGene !== null && getMonotonicTime() > helix.trackingBlock) {
                    assert(helix.trackingGene === dna.hintGene, "trackingGene === hintGene");
                    var ratio = void 0;
                    if (helix.keyModifiers === "shift") {
                        ratio = 0.02;
                    }
                    else {
                        var deltaY = Math.abs(helix.clickY - helix.mouse.y) - 5;
                        ratio = (deltaY >= 0 ? Math.pow(10, -deltaY / 50) : 1);
                    }
                    helix.trackingValue += (helix.mouse.x - lastMouse.x) / (2.0 * WIDTH * Math.sin(PHASE) * 0.88) * ratio;
                    setCushyVariable("params." + helix.trackingGene, "" + clamp(helix.trackingValue, 0, 1), true);
                    performCushyAction('hint', "{ offset: { 0, 22 }, text: \"" + helix.trackingGene + " = [var]params." + helix.trackingGene + ".human[/var]\", extent: 22 }");
                }
            }
        };
        helix.click = function click() {
            assert(helix.trackingGene === null, "trackingGene === null");
            var MAX_ROTATE = (GENE_COUNT - 1) / GENE_COUNT;
            var helixPos = (helix.mouse.y - Y_OFFSET - Math.cos(PHASE) * TURN) / HEIGHT;
            var geneNumber = Math.floor(helixPos * GENE_COUNT + 0.5);
            var clickedPage = (geneNumber > 30 ? 3 : geneNumber > 15 ? 2 : 1);
            if (dna.page !== clickedPage) {
                dna.page = clickedPage;
                setCushyVariable('instance.dnaPage', '' + dna.page);
                helix.trackingBlock = getMonotonicTime() + 200;
            }
            if (helix.mouse.x > 26 && helix.mouse.x < 113 && geneNumber >= 0 && geneNumber < GENE_COUNT) {
                assert(GENES[geneNumber] !== undefined, "GENES[" + geneNumber + "] !== undefined");
                var geneName = GENES[geneNumber].NAME;
                dna.hintGene = helix.hoverGene = helix.editingGene = geneName;
                focusGene(geneName);
                idleRotate(false);
                var angle = TWIST * TAU * clamp(geneNumber / GENE_COUNT, 0, MAX_ROTATE);
                helix.rotation.setTarget(angle);
                helix.rotation.setCurrent(angle);
                helix.helixIVG = null;
                var guiVariable = "params." + geneName;
                editCushyVariable(guiVariable, true);
                if (helix.keyModifiers === (PLATFORM.OS === "mac" ? "command" : "control")) {
                    var defaultValue = (geneName === 'a_freq') ? calcDefaultFreqA() : +getCushyVariable("params." + geneName + ".default");
                    setCushyVariable(guiVariable, '' + defaultValue, true);
                }
                else {
                    helix.trackingGene = geneName;
                    helix.trackingValue = getParam(geneName);
                }
                performCushyAction('hint', "{ offset: { 0, 22 }, text: \"" + geneName + " = [var]params." + geneName + ".human[/var]\", extent: 22 }");
                helix.clickY = helix.mouse.y;
            }
        };
        helix.release = function release() {
            helix.trackingGene = null;
            if (helix.editingGene !== null) {
                editCushyVariable("params." + helix.editingGene, false);
                helix.editingGene = null;
                performCushyAction('hint', '""');
            }
        };
        helix.enter = function enter() {
            idleRotate(false);
        };
        helix.leave = function leave() {
            idleRotate(true);
            focusGene(null);
            helix.hoverGene = "";
        };
    })(helix = dna.helix || (dna.helix = {}));
    var splash;
    (function (splash) {
        var SPEED = 0.022;
        var STARTOFFSET = 8;
        function init() {
            splash.isAnimating = true;
            splash.props = [
                [6 + (0 * STARTOFFSET), new Filtered(0, SPEED, 1)],
                [6 + (1 * STARTOFFSET), new Filtered(0, SPEED, 1)],
                [6 + (2 * STARTOFFSET), new Filtered(0, SPEED, 1)],
                [6 + (0 * STARTOFFSET), new Filtered(0, SPEED * 8, 1)],
                [6 + (1 * STARTOFFSET), new Filtered(0, SPEED * 7.5, 1)],
                [6 + (2 * STARTOFFSET), new Filtered(0, SPEED * 7, 1)],
            ];
            splash.frame = 0;
            animate();
        }
        splash.init = init;
        function animate() {
            var done = true;
            var pStr = [];
            for (var i = 0; i < splash.props.length; ++i) {
                var p = splash.props[i];
                pStr[i] = "" + p[1].getCurrent();
                done = done && p[1].reachedTarget();
                if (splash.frame > p[0]) {
                    p[1].process();
                }
            }
            splash.isAnimating = !done;
            ++splash.frame;
            splash.animationProps = "[" + pStr.join(",") + "]";
        }
        splash.animate = animate;
    })(splash = dna.splash || (dna.splash = {}));
    var branches = [];
    var C3_FREQUENCY = 261.625565300598635;
    function resetVoiceFeedbacks() {
        dna.voice = {
            volEnvPosition: 0,
            modEnvPosition: 0,
            lfoPosition: 0,
            lfoEnvelope: 0,
            carrierFreq: 0,
            fmFreq: 0,
            subOscPhase: 0,
            fmSHFreq: 0,
            fmSHPhase: 0,
            filterFreq: 0,
            carrierMix: 0,
            fmMix: 0,
            fmAmount: 0,
            voiceAge: 0
        };
    }
    function renderNoise(length, noiseSeed, noiseFilter) {
        var min = Math.min, max = Math.max, PI = Math.PI;
        var prng = noiseSeed;
        var fn = 0;
        var fk = 1 - Math.exp(-PI * 2 * noiseFilter);
        var noise = [];
        for (var i = 0; i < length; ++i) {
            prng ^= ((prng >>> 23) ^ (prng >>> 7));
            prng = ((prng >>> 11) | (prng << 21)) >>> 0;
            fn += (prng * 4.656612873e-10 - 1 - fn) * fk;
            noise[i] = fn;
        }
        fn = 0;
        for (var i = length - 1; i >= 0; --i) {
            fn += (noise[i] - fn) * fk;
            noise[i] = fn;
        }
        var noiseMin = Infinity, noiseMax = -Infinity;
        for (var i = length; --i >= 0;) {
            var v = noise[i];
            noiseMin = min(noiseMin, v);
            noiseMax = max(noiseMax, v);
        }
        var k = 2 / (noiseMax - noiseMin);
        var c = 1 + noiseMin * k;
        for (var i = length; --i >= 0;) {
            noise[i] = noise[i] * k - c;
        }
        return noise;
    }
    function renderWave(length, form, rate, phase, subAmount) {
        var min = Math.min, max = Math.max, cos = Math.cos, PI = Math.PI, PI_4 = PI / 4;
        var a, b, c;
        if (form < 0.33333) {
            var hf_1 = 1 - square(scale(form, 0, 0.33333, 1, 0));
            var hf2 = max(0.00001, 0.5 - hf_1 * 0.5);
            a = hf2;
            b = a;
            c = 1;
        }
        else if (form < 0.66666) {
            var sw_2 = square(scale(form, 0.33333, 0.66666, 1, 0));
            var ww1 = (0.5 + sw_2 * 0.5);
            a = 0.00001;
            b = clamp(ww1 - ww1 * sw_2, a, 1 - a);
            c = max(ww1, b + a);
        }
        else {
            var pw_3 = square(scale(form, 0.66666, 1, 1, 0));
            pw_3 = max(pw_3, min(rate * 8, 1));
            a = 0.00001;
            b = clamp(pw_3 * 0.5, a, 1 - a);
            c = max(pw_3 * 0.5, b + a);
        }
        var d = 4 / a;
        var e = 4 / (c - b);
        var dc = 1 + a - b - c;
        var wave = [];
        for (var i = 0; i < length; ++i) {
            var x = (i + phase);
            var p = fract(rate * x);
            var y = d * min(p - a, 0) + e * max(min(p, c) - b, 0);
            wave[i] = (-cos(y * PI_4) - dc) * (1 + subAmount * cos(rate * x * PI));
        }
        return wave;
    }
    function oscBScale(oscMix, subAmount) {
        return 1 / (1 + oscMix * subAmount);
    }
    function renderOscillator(length, form, rate, phase, subAmount, noiseSeed, noiseFilter, oscMix, noiseMix) {
        var noise = renderNoise(length, noiseSeed, noiseFilter);
        var wave = renderWave(length, form, rate, phase - length / 2, subAmount);
        var scale = oscBScale(oscMix, subAmount);
        var o = oscMix * scale;
        var n = noiseMix * scale;
        for (var i = length; --i >= 0;) {
            wave[i] = wave[i] * o + noise[i] * n;
        }
        return wave;
    }
    function waveToSVGPath(wave, offset) {
        var floor = Math.floor;
        var s = new StringBuilder("M");
        var i = 0;
        var h = dna.guiConfig.oscPlotHeight;
        for (; i < wave.length; ++i) {
            var y = floor((0.5 - 0.25 * wave[i]) * h * 10000) / 10000;
            s.append(i + offset + " " + y + " ");
        }
        return s.build();
    }
    function shWaveToSVGPath(wave, offset, step) {
        var floor = Math.floor;
        var s = new StringBuilder("M");
        var i = 0;
        var h = dna.guiConfig.oscPlotHeight;
        for (; i < wave.length; ++i) {
            var x = offset + i * step;
            var y = floor((0.5 - 0.25 * wave[i]) * h * 10000) / 10000;
            s.append(x + " " + y + " " + (x + step) + " " + y + " ");
        }
        return s.build();
    }
    dna.showHint = function () {
        return '' + (dna.hintGene !== '');
    };
    dna.hintPage = function () {
        var n = main.geneNameToIndex(dna.hintGene);
        return '' + n;
    };
    dna.knobEnterAction = function knobEnterAction(gene) {
        dna.hintGene = gene;
        helix.focusGene(gene);
        helix.idleRotate(false);
        helix.rotateToGene(gene);
    };
    dna.knobLeaveAction = function knobLeaveAction(gene) {
        if (helix.focusedGene === gene) {
            helix.focusGene(null);
            helix.idleRotate(true);
        }
    };
    function patchImplementation() { return "" + getCachedPatch().implementation; }
    dna.patchImplementation = patchImplementation;
    function smoothStaircaseFunction3(x) {
        var rx = Math.round(x);
        return 4 * Math.pow(x - rx, 3) + rx;
    }
    function smoothStaircaseFunction5(x) {
        var rx = Math.round(x);
        return 16 * Math.pow(x - rx, 5) + rx;
    }
    function regrow() {
        var patch = getCachedPatch();
        dna.root = patch.genome;
        for (var i = 0; i < 12; ++i) {
            branches[i] = spawnPatch(patch, i).genome;
        }
        dna.grown = dna.root;
        if (main.selectedBranchIndex !== null) {
            dna.grown = spawnPatch(patch, main.selectedBranchIndex).genome;
        }
        helix.helixIVG = null;
    }
    dna.regrow = regrow;
    var cachedFilterParams;
    var cachedFilterCoeffs;
    dna.filterCoeffs = function () {
        var s = dna.grown.flt_type + ',' + dna.grown.flt_freq + ',' + dna.grown.flt_q
            + ',' + dna.grown.flt_sep + ',' + dna.voice.filterFreq;
        if (!cachedFilterCoeffs || cachedFilterParams !== s) {
            cachedFilterParams = s;
            var sqrt = Math.sqrt, min = Math.min, max = Math.max, exp = Math.exp;
            var filterSepLin = signedSquare(dna.grown.flt_sep * 2 - 1) * 4;
            var filterFC = cube(3.9743386664897793 * dna.grown.flt_freq - 1.2599210498948732);
            var lnrq = 0.6931471805599453 - 4.605170185988091 * dna.grown.flt_q;
            var filterSerialX = void 0;
            var filterHpX0 = void 0;
            var filterHpX1 = void 0;
            var fltMorph = dna.grown.flt_type;
            if (fltMorph < 1 / 3) {
                filterSerialX = 1;
                filterHpX0 = 1 - sqrt(fltMorph * 3);
                filterHpX1 = 0;
                if (filterSepLin < 0) {
                    filterSepLin *= (1 / 3 - fltMorph) * 3;
                }
                var K = 5.358983848622458;
                filterFC = lerp((2 * filterFC <= K ? filterFC : K - (K * K / 4) / filterFC), filterFC, square(fltMorph * 3));
            }
            else if (fltMorph < 2 / 3) {
                filterSerialX = 1 - (fltMorph - 1 / 3) * 3;
                filterHpX0 = 0;
                filterHpX1 = 0;
                if (filterSepLin < 0) {
                    filterSepLin *= (fltMorph - 1 / 3) * 3;
                }
            }
            else {
                filterSerialX = 0;
                filterHpX0 = 0;
                filterHpX1 = (fltMorph - 2 / 3) * 3;
            }
            var filterFS = exp2(filterSepLin);
            var x = (filterFS < 1 ? (1 / filterFS - 1) : (filterFS - 1));
            lnrq = lnrq * (min(lerp(1, 0.5 + 0.5 * x, filterSerialX), 1));
            var filterAMixParams = (filterHpX0 < 0.5)
                ? [sqrt(1 - filterHpX0 * 2), sqrt(filterHpX0 * 2), 0, 1 - filterSerialX, filterSerialX]
                : [0, sqrt(1 - (filterHpX0 - 0.5) * 2), sqrt((filterHpX0 - 0.5) * 2), 1 - filterSerialX, filterSerialX];
            var filterBMixParams = (filterHpX1 < 0.5)
                ? [sqrt(1 - filterHpX1 * 2), sqrt(filterHpX1 * 2), 0]
                : [0, sqrt(1 - (filterHpX1 - 0.5) * 2), sqrt((filterHpX1 - 0.5) * 2)];
            var filterAF = min((dna.voice.filterFreq != 0 ? dna.voice.filterFreq / 44100 : (C3_FREQUENCY / 44100) * exp2(filterFC)), 20000 / 44100);
            var filterBF = min(filterAF * filterFS, 20000 / 44100);
            var filterFMin = min(filterAF, filterBF);
            var filterFMax = max(filterAF, filterBF);
            var fA = filterFMin;
            var fB = filterFMax;
            var qA = exp((1 - 4 * square(min(fA, 0.5))) * lnrq);
            var qB = exp((1 - 4 * square(min(fB, 0.5))) * lnrq);
            var lA = filterAMixParams[0];
            var bA = filterAMixParams[1];
            var hA = filterAMixParams[2];
            var lB = filterBMixParams[0];
            var bB = filterBMixParams[1];
            var hB = filterBMixParams[2];
            var fAfA = fA * fA;
            var d1A = fAfA * fAfA;
            var d2A = fAfA * (square(qA) - 2);
            var c1A = d1A * lA * lA;
            var c2A = fAfA * (bA * bA - 2 * hA * lA);
            var c3A = hA * hA;
            var fBfB = fB * fB;
            var d1B = fBfB * fBfB;
            var d2B = fBfB * (square(qB) - 2);
            var c1B = d1B * lB * lB;
            var c2B = fBfB * (bB * bB - 2 * hB * lB);
            var c3B = hB * hB;
            cachedFilterCoeffs = c1A + ',' + c2A + ',' + c3A + ',' + d1A + ',' + d2A
                + ',' + c1B + ',' + c2B + ',' + c3B + ',' + d1B + ',' + d2B
                + ',' + filterAMixParams[3] + ',' + filterAMixParams[4]
                + ',' + fA + ',' + fB;
        }
        return cachedFilterCoeffs;
    };
    function animate() {
        if (splash.isAnimating) {
            splash.animate();
        }
        helix.animate();
        updateFeedbacks();
    }
    dna.animate = animate;
    function calcDefaultFreqA() {
        var p = getCachedPatch();
        return clamp(0.5 - p.pitchAdjust / (main.A_FREQ_MAX_PITCH - main.A_FREQ_MIN_PITCH), 0, 1);
    }
    function defaultFreqA() {
        return "" + calcDefaultFreqA();
    }
    dna.defaultFreqA = defaultFreqA;
    function popupBranchHint() {
        dna.branchHintLayout = (main.selectedBranchIndex === null ? "" : 'Synplant2_branchHint');
        dna.branchHintCloseTime = getMonotonicTime() + 1000;
    }
    dna.popupBranchHint = popupBranchHint;
    function maybeClosePopupBranchHint() {
        if (dna.branchHintLayout !== "" && dna.branchHintCloseTime !== null && getMonotonicTime() >= dna.branchHintCloseTime) {
            dna.branchHintLayout = "";
            dna.branchHintCloseTime = null;
        }
    }
    dna.maybeClosePopupBranchHint = maybeClosePopupBranchHint;
    function computeWaveformA(width, aForm, rate, noiseSeed, aNoise, aColor) {
        var noiseAMix = Math.pow(clamp(aNoise * 3.5 - 2.35, 0, 1), 4);
        var oscAMix = Math.sqrt(1 - noiseAMix);
        var noiseAF = logScale(aColor, 0, 1, 50, 20000) / C3_FREQUENCY * 3 / (width - 1);
        var carrierWave = renderOscillator(width + 2, square(aForm), rate, 0.5, 0.0, noiseSeed, noiseAF, oscAMix, noiseAMix);
        return waveToSVGPath(carrierWave, -1);
    }
    function computeWaveformB(width, fmSHXRate, bForm, noiseBSeed, noiseBF, rateB, x2cB, bNoise, subAm) {
        var path;
        var subAmount = square(Math.max(subAm * 1.5 - 0.5, 0));
        var noiseBMix = Math.pow(clamp(bNoise * 3.5 - 2.35, 0, 1), 4);
        var oscBMix = 1 - noiseBMix;
        noiseBMix = Math.sqrt(noiseBMix);
        if (fmSHXRate < 1) {
            var noiseWave = renderNoise(width + 2, noiseBSeed, noiseBF);
            var fmSHRateX = 1 / fmSHXRate;
            var shRate = rateB * x2cB * fmSHRateX;
            var initPhase = -width / 2 * fmSHXRate - 1;
            var shWave = renderWave(Math.ceil(width * fmSHXRate) + 2, square(bForm), shRate, Math.ceil(initPhase)
                + dna.frozenFMOscPhase / shRate, subAmount);
            var fmWave = [];
            var scale_1 = oscBScale(oscBMix, subAmount);
            var o = oscBMix * scale_1;
            var n = noiseBMix * scale_1;
            var offsetX = -fract(initPhase) * fmSHRateX;
            var floor = Math.floor;
            for (var i = shWave.length - 1; --i >= 0;) {
                var x = offsetX + i * fmSHRateX;
                var floorX = floor(x);
                var fractX = x - floorX;
                var index = (floorX < 0 ? 0 : (floorX > width ? width : floorX));
                var noiseWave0 = noiseWave[index];
                fmWave[i] = shWave[i] * o + (noiseWave0 + (noiseWave[index + 1] - noiseWave0) * fractX) * n;
            }
            path = shWaveToSVGPath(fmWave, offsetX - 0.5, fmSHRateX);
        }
        else {
            var fmWave = renderOscillator(width + 2, square(bForm), rateB * x2cB, 0.5, subAmount, noiseBSeed, noiseBF, oscBMix, noiseBMix);
            path = waveToSVGPath(fmWave, -1);
        }
        return path;
    }
    function updateFeedbacks() {
        var branchIndex = main.selectedBranchIndex;
        var noiseASeed = 0;
        var noiseBSeed = 0;
        var liveAction = false;
        var rateA = 0;
        var rateB = 0;
        var fmSHRate = 0;
        var zoomA = 1;
        var zoomB = 1;
        var patch = getCachedPatch();
        if (branchIndex !== null) {
            var suffix = "" + (branchIndex + 1);
            var noteOnKey = +getCushyVariable("feedbacks.noteOnKey" + suffix);
            if (noteOnKey !== 0) {
                liveAction = true;
                for (var k in dna.voice) {
                    dna.voice[k] = +getCushyVariable("feedbacks." + k + suffix);
                }
                rateA = Math.abs(dna.voice.carrierFreq) / C3_FREQUENCY;
                rateB = Math.abs(dna.voice.fmFreq) / C3_FREQUENCY;
                fmSHRate = (dna.voice.fmSHFreq >= 1e9 ? Infinity : dna.voice.fmSHFreq / C3_FREQUENCY);
                var referenceRate = Math.pow(2, (noteOnKey - 60) / 12);
                zoomA = Math.pow(rateA * rateA * referenceRate, 1 / 3) / 3;
                zoomB = Math.pow(rateB * rateB * referenceRate, 1 / 3) / 3;
                if (dna.voice.fmSHFreq >= dna.guiConfig.animationFps || dna.voice.fmSHPhase < dna.lastFMSHPhase) {
                    dna.frozenNoiseSeed = (dna.frozenNoiseSeed + 928371) >>> 0;
                    dna.frozenRateB = rateB;
                    if (dna.voice.fmSHFreq < 1000) {
                        var fmOscPhase = dna.voice.subOscPhase * 2 - dna.voice.fmSHPhase / dna.voice.fmSHFreq * dna.voice.fmFreq;
                        dna.frozenFMOscPhase = fmOscPhase;
                    }
                }
                dna.lastFMSHPhase = dna.voice.fmSHPhase;
                noiseASeed = dna.frozenNoiseSeed;
                noiseBSeed = (noiseASeed + 128381) >>> 0;
            }
        }
        if (!liveAction) {
            resetVoiceFeedbacks();
            dna.lastFMSHPhase = 0.0;
            dna.frozenFMOscPhase = 0;
            var tuning = patch.control.tuning * 2 - 1;
            rateA = Math.pow(2, 6 * dna.grown.a_freq - 3 + patch.pitchAdjust + tuning);
            var fmRateC = smoothStaircaseFunction5(dna.grown.b_freq * 16 - 11);
            dna.frozenRateB = rateB = rateA * Math.pow(2, fmRateC);
            dna.voice.fmAmount = Math.pow(dna.grown.fm_amt * 2 - 1, 4) * (dna.grown.fm_amt <= 0.499 ? -64 : 64);
            noiseASeed = 1342939708;
            noiseBSeed = 1837033276;
            zoomA = Math.pow(rateA, 2 / 3) / 3;
            zoomB = Math.pow(rateB, 2 / 3) / 3;
            var mixLimiter = clamp(fmRateC + 4, 0, 1);
            var fmSH44 = Math.log(12500000 / 441) / (2 * Math.log(25000));
            var fmSH = Math.abs(dna.grown.b_sh * 2 - 1);
            fmSHRate = (fmSH >= fmSH44 ? logScale(fmSH, 0.5, 1, 50000, 2) / C3_FREQUENCY : Infinity);
            if (fmSHRate <= 50000 && dna.grown.b_sh < 0.5) {
                if (fmSHRate >= 0.25) {
                    fmSHRate = exp2(smoothStaircaseFunction3(log2(fmSHRate)));
                }
                mixLimiter = scale(clamp(fmSHRate, 0.25, 1.25), 0.25, 1.25, 0, mixLimiter);
                fmSHRate *= rateB;
            }
            else {
                mixLimiter = clamp(7 - fmSH * 8, 0, mixLimiter);
            }
            var oscMixC = cube(dna.grown.osc_mix);
            var c = Math.sqrt(1 - Math.sqrt(1 - mixLimiter));
            var a = 1 - square(square(Math.min(0 - c, 0)) - 1);
            oscMixC = Math.min(oscMixC, a);
            var oscMixCC = Math.sqrt(1 - Math.sqrt(1 - oscMixC));
            var oscMixCF = Math.sqrt(1 - Math.sqrt(oscMixC));
            dna.voice.carrierMix = 1 - Math.abs(oscMixCC) * oscMixCC;
            dna.voice.fmMix = 1 - Math.abs(oscMixCF) * oscMixCF;
        }
        var width = dna.guiConfig.oscPlotWidth;
        rateB = dna.frozenRateB;
        function nonLinearZoom(zoom, rate) {
            var breakpoint = rate * 2 / 3;
            return (zoom <= breakpoint ? zoom : Math.pow(zoom / breakpoint, 1 / 6) * breakpoint);
        }
        zoomA = nonLinearZoom(zoomA, rateA);
        zoomB = nonLinearZoom(zoomB, rateB);
        zoomB = Math.min(fmSHRate / 11, zoomB);
        dna.waveformA.zoom = zoomA;
        dna.waveformB.zoom = zoomB;
        var x2cA = 1 / (zoomA * (width - 1));
        var x2cB = 1 / (zoomB * (width - 1));
        var noiseBF = rateB * 3 / (width - 1);
        var bColor = clamp(Math.log(C3_FREQUENCY / 150 * noiseBF * (width - 1)) / Math.log(400), 0, 1);
        var fmSHXRate = Math.min(fmSHRate * x2cB, 1);
        dna.waveformB.path.setup(width, fmSHXRate, dna.grown.b_form, noiseBSeed, noiseBF, rateB, x2cB, dna.grown.b_noise, dna.grown.sub_am);
        dna.waveformB.thinness = square(dna.grown.b_noise) * Math.sqrt(bColor) * (fmSHXRate < 1 ? 1 : Math.sqrt(fmSHXRate));
        dna.waveformA.path.setup(width, dna.grown.a_form, rateA * x2cA, noiseASeed, dna.grown.a_noise, dna.grown.a_color);
        dna.waveformA.thinness = square(dna.grown.a_noise) * Math.sqrt(dna.grown.a_color);
    }
    function flipParam(param) {
        var p = unescape(param);
        saveUndo(translate('Flip Value'));
        setParam(p, clamp(PARAMS[PARAM_INDEXES[p]].DEFAULT * 2 - getParam(p), 0, 1));
    }
    dna.flipParam = flipParam;
    function configure(configParams) {
        var cfg = parseNumbstrict(configParams);
        dna.guiConfig = {
            animationFps: +cfg.animationFps,
            oscPlotWidth: +cfg.oscPlotWidth,
            oscPlotHeight: +cfg.oscPlotHeight,
            geneColors: {}
        };
        for (var g in cfg.geneColors) {
            dna.guiConfig.geneColors[g] = cfg.geneColors[g].toLowerCase();
        }
        helix.updateConfig();
        updateFeedbacks();
    }
    dna.configure = configure;
    function open() {
        dna.branchHintLayout = "";
        dna.branchHintCloseTime = null;
        dna.editMidiControllers = "false";
    }
    dna.open = open;
    regrow();
    if (!dna.inited) {
        var dnaPageString = getCushyVariable('instance.dnaPage');
        dna.page = (dnaPageString !== '' ? +dnaPageString : 0);
        dna.hintGene = "";
        dna.editMidiControllers = "false";
        dna.branchHintCloseTime = null;
        dna.branchHintLayout = "";
        dna.frozenNoiseSeed = 1234567;
        dna.frozenRateB = 0.0;
        dna.lastFMSHPhase = 1.0;
        dna.frozenFMOscPhase = 0;
        resetVoiceFeedbacks();
        splash.init();
        dna.inited = true;
    }
})(dna || (dna = {}));
