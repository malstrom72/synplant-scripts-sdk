var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var globals = this;
if (!globals.PLATFORM) {
    globals.PLATFORM = {
        CPU: getCushyVariable('PLATFORM.CPU'),
        OS: getCushyVariable('PLATFORM.OS')
    };
}
;
if (!globals.BUILD) {
    globals.BUILD = {
        COMPILER: getCushyVariable('BUILD.COMPILER'),
        COPYRIGHT: getCushyVariable('BUILD.COPYRIGHT'),
        DATE: getCushyVariable('BUILD.DATE'),
        FORMAT: getCushyVariable('BUILD.FORMAT'),
        LIBS: getCushyVariable('BUILD.LIBS'),
        NUMBER: +getCushyVariable('BUILD.NUMBER'),
        TARGET: getCushyVariable('BUILD.TARGET'),
        TIME: getCushyVariable('BUILD.TIME'),
        VERSION: getCushyVariable('BUILD.VERSION')
    };
}
;
if (!globals.DIRS) {
    globals.DIRS = {
        PAPAGENO: getCushyVariable('DIRS.PAPAGENO', true),
        SCRIPTS: getCushyVariable('DIRS.SCRIPTS', true),
        SKINS: getCushyVariable('DIRS.SKINS', true),
        BINARY: getCushyVariable('DIRS.BINARY', true),
        PATCHES: getCushyVariable('DIRS.PATCHES', true),
        DOCUMENTATION: getCushyVariable('DIRS.DOCUMENTATION', true),
        SUPPORT: getCushyVariable('DIRS.SUPPORT', true),
        DOCUMENTS: getCushyVariable('DIRS.DOCUMENTS', true)
    };
}
;
var isRepeating = false;
var DEBUG = (BUILD.TARGET !== 'Release' && BUILD.TARGET !== 'Profiling');
var assert = (!DEBUG ?
    (function (_condition, _message) {
    }) :
    (function (condition, message) {
        if (!condition) {
            message = message || "Unknown assertion failure";
            print("Assertion failure: " + message);
            throw new Error(message);
        }
    }));
Object.defineProperty(Object, "assign", {
    value: function (target, _varArgs) {
        for (var i = 1; i < arguments.length; ++i) {
            var o = arguments[i];
            for (var p in o) {
                if (o.hasOwnProperty(p)) {
                    target[p] = o[p];
                }
            }
        }
        return target;
    },
    writable: true,
    configurable: true
});
if (!Array.prototype.map) {
    Array.prototype.map = function (callbackfn) {
        var T, A, k;
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callbackfn !== 'function') {
            throw new TypeError(callbackfn + ' is not a function');
        }
        if (arguments.length > 1) {
            T = arguments[1];
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
            if (k in O) {
                var kValue = O[k];
                var mappedValue = callbackfn.call(T, kValue, k, O);
                Object.defineProperty(A, k, {
                    value: mappedValue,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }
            k++;
        }
        return A;
    };
}
;
Date.now = function now() { return new Date().getTime(); };
;
Math.sign = function sign(x) { return (+(x > 0) - +(x < 0)) || +x; };
Math.cbrt = function cbrt(x) { return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3); };
Math.log10 = function log10(x) { return Math.log(x) * Math.LOG10E; };
function clamp(x, mini, maxi) {
    assert(mini <= maxi, "mini <= maxi");
    return (x < mini ? mini : (x > maxi ? maxi : x));
}
function square(x) { return x * x; }
function signedSquare(x) { return x * Math.abs(x); }
function inverseSignedSquare(x) { return Math.sqrt(Math.abs(x)) * Math.sign(x); }
function cube(x) { return x * x * x; }
function exp2(x) { return Math.pow(2, x); }
function log2(x) { return Math.log(x) / Math.LN2; }
function lerp(y0, y1, x) { return y0 + (y1 - y0) * x; }
function bounce(x, min, max) { var d = max - min; return min + Math.abs(Math.abs(x - max) % (2 * d) - d); }
function scale(x, x0, x1, y0, y1) { return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
function logScale(x, x0, x1, y0, y1) { return y0 * Math.pow((y1 / y0), (x - x0) / (x1 - x0)); }
function fract(x) { return x - Math.floor(x); }
function unescape(s) { return ((s[0] === '"' || s[0] === "'") ? parseNumbstrict(s) : s); }
function floorMod(x, y) { return ((x % y) + y) % y; }
function fromDecibel(db) { return Math.pow(10, db / 20); }
function toDecibel(g) { return 20 * Math.log10(g); }
function bisect(fn, y, low, high, maxSteps) {
    low = (low != null ? low : 0);
    high = (high != null ? high : 1);
    maxSteps = (maxSteps != null ? maxSteps : 50);
    if (fn(high) < fn(low)) {
        var temp = low;
        low = high;
        high = temp;
    }
    var x = low + (high - low) * 0.5;
    for (var i = 0; i < maxSteps && x != low && x != high; ++i) {
        if (fn(x) < y) {
            low = x;
        }
        else {
            high = x;
        }
        x = low + (high - low) * 0.5;
    }
    return x;
}
function toMousePosition(s) {
    assert(typeof s === "string", "typeof s === \"string\" (" + typeof s);
    var c = s.split(",");
    return { x: +c[0], y: +c[1] };
}
function deepClone(object) {
    if (typeof object !== 'object' || object === null) {
        return object;
    }
    var cloned = (Array.isArray(object) ? [] : {});
    for (var key in object) {
        cloned[key] = deepClone(object[key]);
    }
    return cloned;
}
var random = {
    uniform: Math.random,
    integer: function integer(ceiling) {
        if (typeof ceiling == 'undefined') {
            ceiling = 4294967296;
        }
        return (Math.random() * ceiling) >>> 0;
    },
    normal: function normal(mu, sigma) {
        mu = mu || 0;
        sigma = sigma || 1;
        do {
            var x = Math.random();
        } while (x === 0);
        do {
            var y = Math.random();
        } while (y === 0);
        return mu + sigma * Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y);
    }
};
var Xorshift = (function () {
    function Xorshift(seed0, seed1) {
        if (seed0 == null)
            seed0 = 123456789;
        if (seed1 == null)
            seed1 = 362436069;
        this.px = seed0;
        this.py = seed1;
        for (var i = 0; i < 32; ++i) {
            this.next();
        }
    }
    Xorshift.prototype.next = function () {
        var t = this.px ^ (this.px << 10);
        this.px = this.py;
        this.py = this.py ^ (this.py >>> 13) ^ t ^ (t >>> 10);
    };
    Xorshift.prototype.nextInt32 = function () {
        this.next();
        return this.py >>> 0;
    };
    Xorshift.prototype.nextFloat = function () {
        this.next();
        return (this.py >>> 0) * 2.3283064365386962890625e-10 +
            (((this.px & 0xFFFFF800) >>> 0) * 5.42101086242752217003726400434970855712890625e-20);
    };
    Xorshift.prototype.nextInt = function (max) {
        var mask = max;
        mask |= mask >>> 1;
        mask |= mask >>> 2;
        mask |= mask >>> 4;
        mask |= mask >>> 8;
        mask |= mask >>> 16;
        mask |= mask >>> 32;
        do {
            this.next();
            var v = (this.py >>> 0) & mask;
        } while (v > max);
        return v;
    };
    Xorshift.prototype.getState = function () { return [this.px, this.py]; };
    Xorshift.prototype.setState = function (state) { this.px = state[0]; this.py = state[1]; };
    Xorshift.prototype.clone = function () { return new Xorshift(this.px, this.py); };
    return Xorshift;
}());
function createClass(definition, inherit) {
    var ProtoConstructor = function () { };
    ProtoConstructor.prototype = (inherit || Object).prototype;
    var proto = new ProtoConstructor();
    Object.assign(proto, definition);
    proto["super"] = ProtoConstructor.prototype;
    if (!proto.hasOwnProperty('constructor')) {
        proto.constructor = (inherit ? function () { inherit.apply(this, arguments); } : function () { });
    }
    proto.constructor.prototype = proto;
    return proto.constructor;
}
var StringBuilder = (function () {
    function StringBuilder(s) {
        this.buffers = [];
        for (var i = 0, b = this.buffers; i < 20; ++i) {
            b[i] = '';
        }
        if (s) {
            this.append(s);
        }
    }
    ;
    StringBuilder.prototype.append = function (s) {
        for (var i = 0, n = 256, b = this.buffers; (b[i] += s).length >= n && i < 20; n <<= 1, ++i) {
            s = b[i];
            b[i] = '';
        }
    };
    ;
    StringBuilder.prototype.build = function () {
        var b = this.buffers;
        var i = 19, s = b[i];
        do {
            s += b[--i];
        } while (i > 0);
        return s;
    };
    return StringBuilder;
}());
var ComputedGUIVariable = (function () {
    function ComputedGUIVariable(computation) {
        var initArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            initArgs[_i - 1] = arguments[_i];
        }
        this.computation = computation;
        this.output = null;
        this.input = initArgs;
    }
    ComputedGUIVariable.prototype.get = function () {
        if (this.output === null) {
            this.output = this.computation.apply(null, this.input);
        }
        return this.output;
    };
    ComputedGUIVariable.prototype.setup = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var input = this.input;
        if (input === null || input.length !== args.length) {
            this.output = null;
            this.input = args;
        }
        else {
            for (var i = args.length; --i >= 0;) {
                if (input[i] !== args[i]) {
                    this.output = null;
                    this.input = args;
                    break;
                }
            }
        }
    };
    ;
    ComputedGUIVariable.prototype.reset = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.input = args;
        this.output = null;
    };
    ;
    return ComputedGUIVariable;
}());
;
var Filtered = (function () {
    function Filtered(initValue, initRate, initTarget) {
        if (initValue === void 0) { initValue = 0; }
        if (initRate === void 0) { initRate = 1; }
        this.r = -1;
        this.k = -1;
        this.target = initTarget !== null && initTarget !== void 0 ? initTarget : initValue;
        this.current = initValue;
        this.setRate(initRate);
    }
    Filtered.prototype.setTarget = function (value) { this.target = value; };
    Filtered.prototype.getTarget = function () { return this.target; };
    Filtered.prototype.setCurrent = function (value) { this.current = value; };
    Filtered.prototype.getCurrent = function () { return this.current; };
    Filtered.prototype.reachedTarget = function () { return (this.current === this.target); };
    Filtered.prototype.reachTarget = function () { this.current = this.target; };
    Filtered.prototype.getRate = function () { return this.r; };
    Filtered.prototype.setRate = function (rate) {
        if (this.r != rate) {
            this.r = rate;
            this.k = rate >= 1 ? 1 : 1 - Math.exp(-Math.PI * 2 * rate);
        }
    };
    Filtered.prototype.process = function (threshold) {
        if (threshold === void 0) { threshold = 0.00000001; }
        if (Math.abs(this.current - this.target) < threshold) {
            this.current = this.target;
        }
        else {
            this.current += (this.target - this.current) * this.k;
        }
        return this.current;
    };
    return Filtered;
}());
function calcVolumeGain(v) { return (v < 0.00001) ? 0 : Math.pow(v, 3.321928094887362) * 10; }
function calcVolumeParam(g) { return Math.pow(g, 0.3010299956639812) * 0.5; }
function calcPreSoftClipGain(v) { return fromDecibel(signedSquare(v * 2 - 1) * 36); }
function calcPreSoftClipParam(g) { return (inverseSignedSquare(toDecibel(g) / 36) + 1) * 0.5; }
function calcPostSoftClipGain(x) {
    var xx = x * x;
    return Math.sqrt(0.03364688409427655 / (x > 6.823966868992918 ? 2 - 6.830101940158945 / x
        : (0.03395286005175669 + (-0.0003068010411993049 + 8.250837191684704e-7 * xx) * xx) * xx));
}
function rescaleVolumeAndClipAdjust(sourceVolume, sourceClipAdjust, scale) {
    var sourcePreSoftClipGain = calcPreSoftClipGain(sourceClipAdjust);
    var sourceVolumeGain = calcVolumeGain(sourceVolume);
    var matchGain = clamp(calcPostSoftClipGain(sourcePreSoftClipGain) * scale, 0.13337, 100000);
    var newPreSoftClipGain = bisect(calcPostSoftClipGain, matchGain, 1e-8, 64);
    var newVolumeGain = sourcePreSoftClipGain * sourceVolumeGain / newPreSoftClipGain;
    return [clamp(calcVolumeParam(newVolumeGain), 0, 1),
        clamp(calcPreSoftClipParam(newPreSoftClipGain), 0, 1)];
}
var getCachedPatch = (function () {
    var cachedPatch = null;
    return function getCachedPatch() {
        if (cachedPatch === null || getElementId('patch') !== cachedPatch.id) {
            cachedPatch = getElement('patch');
        }
        return cachedPatch;
    };
})();
function loadPatch(path, undoText) {
    var newPatch = unmarshal('patch', load(path));
    newPatch.path = path;
    if (undoText) {
        saveUndo(translate(undoText));
    }
    setElement('patch', newPatch);
}
var loadSynplantPatch = loadPatch;
(function () {
    var AVAILABLE_CUSHY_LAYERS = {
        'modal': true,
        'script': true,
        'dev': true
    };
    function getSubCushyParams(p) {
        var param = parseNumbstrict(p);
        return (typeof (param) === 'object' ? param : { cushy: param, layer: 'modal' });
    }
    function checkLayer(layer) {
        if (!(layer in AVAILABLE_CUSHY_LAYERS)) {
            throw new Error("Invalid cushy layer: " + layer);
        }
        return layer;
    }
    globals.getDisplayedCushy = function (layer) {
        return getCushyVariable(checkLayer(layer) + "Layout");
    };
    globals.displayCushy = function (cushy, layer, closeIfOpen) {
        var guiVariable = checkLayer(layer) + "Layout";
        var layout = (cushy ? cushy : '');
        if (closeIfOpen) {
            layout = (getCushyVariable(guiVariable) === layout ? '' : layout);
        }
        setCushyVariable(guiVariable, layout);
        return (layout !== '');
    };
    globals.openCushy = {
        execute: function openCushyExecute(p) {
            var params = getSubCushyParams(p);
            displayCushy(params.cushy, params.layer);
        },
        checked: function openCushyChecked(p) {
            var params = getSubCushyParams(p);
            return getDisplayedCushy(params.layer) === params.cushy;
        }
    };
    globals.toggleCushy = {
        execute: function toggleCushyExecute(p) {
            var params = getSubCushyParams(p);
            displayCushy(params.cushy, params.layer, true);
        },
        checked: function toggleCushyChecked(p) {
            var params = getSubCushyParams(p);
            return getDisplayedCushy(params.layer) === params.cushy;
        }
    };
    globals.closeCushy = {
        execute: function closeCushyExecute(p) {
            if (p == '') {
                displayCushy(null, 'modal');
            }
            else {
                var params = parseNumbstrict(p);
                if (typeof (params) === 'object') {
                    var sub = params;
                    if (getDisplayedCushy(sub.layer) === sub.cushy) {
                        displayCushy(null, sub.layer);
                    }
                }
                else {
                    displayCushy(null, params);
                }
            }
        }
    };
})();
function select(type, value) {
    switch (type) {
        case 'branch': {
            if (value !== null && (typeof (value) !== 'number' || isNaN(value) || value < 0 || value >= BRANCH_COUNT)) {
                throw new RangeError("Invalid branch number: " + value);
            }
            main.selectedBranchIndex = value;
            break;
        }
        case 'program': {
            if (value === null || typeof (value) !== 'number' || isNaN(value) || value < 0 || value >= PROGRAM_COUNT) {
                throw new RangeError("Invalid program number: " + value);
            }
            setCushyVariable('programNumber', "" + (value + 1));
            break;
        }
        default: throw new RangeError("Invalid type: " + type);
    }
}
function selected(type) {
    switch (type) {
        case 'branch': return main.selectedBranchIndex;
        case 'program': return (+getCushyVariable('programNumber')) - 1;
        default: throw new RangeError("Invalid type: " + type);
    }
}
function displayHint(hint) {
    main.displayHintText = hint;
    performCushyAction('hint', '{ text: "[var]main.displayHintText[/var]", extent: 50 }');
}
var Color = (function () {
    function Color(rgba) {
        this.rgba = rgba;
    }
    Color.fromARGBValue = function (value) {
        var a = (value >>> 24 & 0xFF) / 255;
        var r = (value >>> 16 & 0xFF) / 255;
        var g = (value >>> 8 & 0xFF) / 255;
        var b = (value & 0xFF) / 255;
        if (a > 0 && a < 1) {
            return new Color([r / a, g / a, b / a, a]);
        }
        return new Color([r, g, b, a]);
    };
    Color.fromRGBValue = function (value) {
        return new Color([
            (value >>> 16 & 0xFF) / 255,
            (value >>> 8 & 0xFF) / 255,
            (value & 0xFF) / 255,
            1
        ]);
    };
    Color.prototype.toValue = function () {
        var _a = __read(this.rgba, 4), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
        var ri = (r * a * 255) | 0;
        var gi = (g * a * 255) | 0;
        var bi = (b * a * 255) | 0;
        var ai = (a * 255) | 0;
        return (ai << 24) | (ri << 16) | (gi << 8) | bi;
    };
    Color.fromHSVA = function (hsva) {
        var _a = __read(hsva, 4), h = _a[0], s = _a[1], v = _a[2], a = _a[3];
        var i = (h * 6) | 0;
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: return new Color([v, t, p, a]);
            case 1: return new Color([q, v, p, a]);
            case 2: return new Color([p, v, t, a]);
            case 3: return new Color([p, q, v, a]);
            case 4: return new Color([t, p, v, a]);
            case 5: return new Color([v, p, q, a]);
        }
        throw new Error("Invalid hue: " + h);
    };
    Color.fromHSV = function (hsv) {
        return Color.fromHSVA([hsv[0], hsv[1], hsv[2], 1]);
    };
    Color.prototype.toHSVA = function () {
        var _a = __read(this.rgba, 4), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h = 0, s = 0, v = max;
        var delta = max - min;
        if (delta !== 0) {
            switch (max) {
                case r:
                    h = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / delta + 2;
                    break;
                case b:
                    h = (r - g) / delta + 4;
                    break;
            }
            s = delta / max;
        }
        return [h / 6, s, v, a];
    };
    Color.fromHex = function (hex) {
        if (hex[0] === '#') {
            hex = hex.substr(1);
        }
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length === 6) {
            hex = 'ff' + hex;
        }
        var a = parseInt(hex.substr(0, 2), 16) / 255;
        var r = parseInt(hex.substr(2, 2), 16) / 255;
        var g = parseInt(hex.substr(4, 2), 16) / 255;
        var b = parseInt(hex.substr(6, 2), 16) / 255;
        if (a > 0 && a < 1) {
            return new Color([r / a, g / a, b / a, a]);
        }
        return new Color([r, g, b, a]);
    };
    Color.prototype.toHex = function () {
        if (this.rgba[3] === 1) {
            var r_1 = (this.rgba[0] * 255 + 0.5) | 0;
            var g_1 = (this.rgba[1] * 255 + 0.5) | 0;
            var b_1 = (this.rgba[2] * 255 + 0.5) | 0;
            return "#" + ((r_1 < 16 ? '0' : '') + r_1.toString(16)) + ((g_1 < 16 ? '0' : '') + g_1.toString(16)) + ((b_1 < 16 ? '0' : '') + b_1.toString(16));
        }
        var r = (this.rgba[0] * this.rgba[3] * 255 + 0.5) | 0;
        var g = (this.rgba[1] * this.rgba[3] * 255 + 0.5) | 0;
        var b = (this.rgba[2] * this.rgba[3] * 255 + 0.5) | 0;
        var a = (this.rgba[3] * 255 + 0.5) | 0;
        return "#" + ((a < 16 ? '0' : '') + a.toString(16)) + ((r < 16 ? '0' : '') + r.toString(16)) + ((g < 16 ? '0' : '') + g.toString(16)) + ((b < 16 ? '0' : '') + b.toString(16));
    };
    Color.prototype.lerp = function (other, amount) {
        assert(amount >= 0 && amount <= 1);
        return new Color([
            this.rgba[0] * (1 - amount) + other.rgba[0] * amount,
            this.rgba[1] * (1 - amount) + other.rgba[1] * amount,
            this.rgba[2] * (1 - amount) + other.rgba[2] * amount,
            this.rgba[3] * (1 - amount) + other.rgba[3] * amount
        ]);
    };
    Color.prototype.adjustHue = function (amount) {
        var _a = __read(this.toHSVA(), 4), h = _a[0], s = _a[1], v = _a[2], a = _a[3];
        return Color.fromHSVA([(h + amount) % 1, s, v, a]);
    };
    return Color;
}());
var main;
(function (main) {
    main.modifiers = {
        alt: false,
        shift: false,
        control: false,
        command: false
    };
    main.modPatchers = {};
    if (!main.inited) {
        main.wordlist = null;
        main.isPlanting = false;
        main.reenableLayers = null;
        main.selectedBranchIndex = null;
        main.frame = 0;
        main.messageNumber = 0;
        main.isRunningIntroduction = false;
        main.hasShownTrialInfo = false;
        main.quantizedSoftClip = 0;
        main.seedDiceRoll = 9;
        main.lastRandomPatchDir = null;
        main.nextRandomPatchIndex = 0;
        main.shuffledRandomPatchList = null;
    }
    var heldPreviewNote = null;
    var guiConfig;
    main.displayHintText = '';
    var KEY_RING_NOTES = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71];
    var KEY_RING_VELOCITIES = [127, 10, 21, 32, 42, 53, 64, 74, 85, 95, 106, 116];
    var KEY_RING_DEFAULT_RANGES = [
        [-Infinity, 29], [30, 35], [36, 41], [42, 47], [48, 53], [54, 59],
        [60, 65], [66, 71], [72, 77], [78, 83], [84, 89], [90, Infinity]
    ];
    main.RANDOM_GENE_DEVIATION = 0.2886751346;
    main.A_FREQ_MIN_PITCH = -3;
    main.A_FREQ_MAX_PITCH = 3;
    main.BRANCH_VOLUME_DB_RANGE = 20;
    var ANALYSIS_DURATION = 2;
    var ANALYSIS_HELD = 2;
    var MESSAGE_NUMBER_TO_LABEL = ['runningTrial', 'trialExpired', 'legacyModeInfo'];
    var MESSAGE_LABEL_TO_NUMBER = (function () {
        var result = {};
        for (var i = 0; i < MESSAGE_NUMBER_TO_LABEL.length; i++) {
            result[MESSAGE_NUMBER_TO_LABEL[i]] = i;
        }
        return result;
    })();
    var logoColoringBook;
    (function (logoColoringBook) {
        logoColoringBook.colors = "";
        logoColoringBook.snow = 0;
        var PALETTE = [
            [0xeceff2, 0x475456, 0x4c5a5e, 0x56696c, 0x5c7577, 0x556c6b],
            [0xe2f1d9, 0x596a09, 0x5d7905, 0x7f9202, 0x93a400, 0x948e00],
            [0xe3e2e5, 0x444f2e, 0x495833, 0x5b6939, 0x68773d, 0x636a38],
            [0xe8ecdc, 0x7a2512, 0x985113, 0x704e20, 0x66551e, 0xb09617],
        ];
        var temperatureValue = 0.5;
        function mixology() {
            var season = temperatureValue * 4;
            logoColoringBook.snow = (temperatureValue < 0.12 ? (0.12 - temperatureValue) :
                temperatureValue > 0.95 ? (temperatureValue - 0.95) : 0) * 20;
            logoColoringBook.snow = Math.min(1.0, Math.max(0.0, logoColoringBook.snow));
            var base = PALETTE[Math.floor(season) % 4];
            var tint = PALETTE[(Math.floor(season) + 1) % 4];
            var tintAmount = Math.pow(season % 1, 2);
            var c = [];
            for (var i = 0; i < base.length; ++i) {
                c.push(Color.fromRGBValue(base[i]).lerp(Color.fromRGBValue(tint[i]), tintAmount).toHex());
            }
            logoColoringBook.colors = c.join(",");
        }
        logoColoringBook.mixology = mixology;
        logoColoringBook.temperature = {
            get: function () {
                return '' + temperatureValue;
            },
            set: function (value) {
                temperatureValue = +value;
                mixology();
            }
        };
        if (Date.now() >= (new Date(2023, 11, 24)).getTime()) {
            var doy = (Date.now() - Date.UTC((new Date()).getFullYear(), 0)) / (24 * 60 * 60e3);
            temperatureValue = clamp((doy - 14) / 348, 0, 1);
        }
        mixology();
    })(logoColoringBook = main.logoColoringBook || (main.logoColoringBook = {}));
    function insideBounds(position, bounds) {
        return (position.x >= bounds[0] && position.x <= bounds[0] + bounds[2] &&
            position.y >= bounds[1] && position.y <= bounds[1] + bounds[3]);
    }
    function noteOctave(note) {
        return Math.floor(note / 12) - 2;
    }
    function noteName(note) {
        return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][note % 12];
    }
    function branchToSector(branchIndex) {
        return (branchIndex + Math.round(getParam('rotation') * BRANCH_COUNT)) % BRANCH_COUNT;
    }
    function sectorToBranch(sectorIndex) {
        return (sectorIndex + BRANCH_COUNT - Math.round(getParam('rotation') * BRANCH_COUNT)) % BRANCH_COUNT;
    }
    main.selectedBranch = {
        get: function () { return main.selectedBranchIndex === null ? '' : ('' + main.selectedBranchIndex); },
        set: function (value) { main.selectedBranchIndex = (value === "" ? null : +value); },
        length: function () {
            assert(typeof main.selectedBranchIndex == 'number', "typeof selectedBranchIndex == 'number'");
            var param = "branch" + (main.selectedBranchIndex + 1);
            return paramText(param, getParam(param));
        },
        name: function () {
            return (main.selectedBranchIndex === null ? "" : keyRing.branchName(main.selectedBranchIndex));
        }
    };
    var validDiceStrings = ["123", "135", "154", "142", "246", "263", "231", "214", "312", "326", "365", "351", "421", "415", "456", "462", "513", "536", "564", "541", "632", "624", "645", "651"];
    var validDice = validDiceStrings.length;
    function diceRoll(was) {
        if (was !== undefined) {
            return (was + random.integer(validDice - 1) + 1) % validDice;
        }
        else {
            return random.integer(validDice);
        }
    }
    main.seedDice = function () {
        return validDiceStrings[main.seedDiceRoll];
    };
    function randomizeModifier() {
        return main.modifiers[PLATFORM.OS === 'windows' ? 'control' : 'command'];
    }
    var keyRing;
    (function (keyRing) {
        var keyNotes;
        var keyNoteLabels;
        var keyVelocities;
        var keyVelocityLabels;
        var keyRanges;
        var keyRangePreview;
        var keyRangeLabels;
        var localPosition = { x: -1, y: -1 };
        var heldKey = null;
        var keyFollow = true;
        var paintValue = null;
        function setNotes(notes) {
            keyNotes = notes.slice();
            keyNoteLabels = notes.map(function (v) { return noteName(v); }).join(" ");
        }
        keyRing.setNotes = setNotes;
        function setVelocities(velocities) {
            keyVelocities = velocities.slice();
            keyVelocityLabels = velocities.join(" ");
        }
        keyRing.setVelocities = setVelocities;
        function setRanges(ranges) {
            keyRanges = ranges.slice();
            keyRangePreview = ranges.map(function (v) { return isFinite(v[0]) ? v[0] : v[1] - 5; });
            keyRangeLabels = ranges.map(function (v) {
                return "[" + v.map(function (v) { return (isFinite(v) ? (noteName(v) + String.fromCharCode(0x53 + noteOctave(v) - 3)) : "[]"); }).join(" ") + "]";
            }).join(" ");
        }
        keyRing.setRanges = setRanges;
        function calcPreviewMidi(key) {
            var mode = bulbMode();
            switch (mode) {
                case "standard": return { key: keyNotes[key], velocity: 127 };
                case "velocity": return { key: keyNotes[0], velocity: keyVelocities[key] };
                case "ranges": return { key: keyRangePreview[key], velocity: 127 };
                case "layered": return { key: 60, velocity: 127 };
            }
        }
        function keyOn(key) {
            switch (bulbMode()) {
                case "standard":
                case "velocity":
                case "ranges":
                    var midi = calcPreviewMidi(key);
                    previewNoteDown(midi.key, midi.velocity);
                    break;
                case "layered":
                    var param = ('enableLayer' + (key + 1));
                    if (paintValue === null) {
                        paintValue = (getParam(param) >= 0.5 ? 0.0 : 1.0);
                        saveUndo(translate(paintValue == 0 ? "Disable Layers" : "Enable Layers"));
                    }
                    setParam(param, paintValue);
                    main.selectedBranchIndex = sectorToBranch(key);
                    break;
            }
        }
        function positionToKeyIndex(position) {
            return Math.round((Math.atan2(position.x, -position.y) + Math.PI) / (2 * Math.PI) * BRANCH_COUNT) % BRANCH_COUNT;
        }
        function click() {
            heldKey = positionToKeyIndex(localPosition);
            if (randomizeModifier()) {
                var branchIndex = sectorToBranch(heldKey);
                growNewRandomBranch(branchIndex);
                rollDice(heldKey);
                setParam("enableLayer" + (branchIndex + 1), 1);
                keyFollow = false;
                var midi = calcPreviewMidi(heldKey);
                previewNoteDown(midi.key, midi.velocity);
            }
            else {
                keyFollow = true;
                keyOn(heldKey);
            }
        }
        keyRing.click = click;
        function release() {
            previewNoteUp();
            heldKey = null;
            paintValue = null;
        }
        keyRing.release = release;
        var diceRolls = [];
        var diceString = "";
        function rollDice(index) {
            if (index !== undefined) {
                diceRolls[index] = diceRoll(diceRolls[index]);
            }
            else {
                for (var i = 0; i < 12; ++i) {
                    diceRolls[i] = diceRoll();
                }
            }
            diceString = diceRolls.map(function (f) { return validDiceStrings[f]; }).join(" ");
        }
        keyRing.rollDice = rollDice;
        function labelStrings() {
            if (randomizeModifier()) {
                if (diceString === "") {
                    rollDice();
                }
                return diceString;
            }
            else {
                var mode = bulbMode();
                switch (mode) {
                    case "standard": return keyNoteLabels;
                    case "velocity": return keyVelocityLabels;
                    case "ranges": return keyRangeLabels;
                    case "layered": return "";
                }
                assert(false, "Invalid bulbMode mode");
            }
        }
        keyRing.labelStrings = labelStrings;
        function branchName(index) {
            assert(0 <= index && index < BRANCH_COUNT, "0 <= index && index < BRANCH_COUNT");
            var layer = branchToSector(index);
            switch (bulbMode()) {
                case "standard": return noteName(keyNotes[layer]);
                case "velocity": return "" + keyVelocities[layer];
                case "ranges": {
                    var range = keyRanges[layer];
                    return (isFinite(range[0]) ? noteName(range[0]) + noteOctave(range[0]) : "") + ".." + (isFinite(range[1]) ? noteName(range[1]) + noteOctave(range[1]) : "");
                }
                case "layered": return translate("layer") + " " + (layer + 1);
            }
            assert(false, "Invalid bulbMode mode");
        }
        keyRing.branchName = branchName;
        keyRing.mousePosition = {
            set: function (value) {
                var cfg = guiConfig;
                assert(typeof cfg !== "undefined", 'typeof cfg !== "undefined"');
                assert(typeof cfg.keyRingSize !== "undefined", 'typeof cfg.keyRingSize !== "undefined"');
                var pos = value.split(",");
                assert(pos && pos.length === 2, "pos && pos.length === 2");
                var center = cfg.keyRingSize / 2;
                localPosition = { x: +pos[0] - center, y: +pos[1] - center };
                if (heldKey !== null && keyFollow) {
                    var newIndex = positionToKeyIndex(localPosition);
                    if (newIndex !== heldKey) {
                        previewNoteUp();
                        heldKey = newIndex;
                        keyOn(heldKey);
                    }
                }
            }
        };
        keyRing.isLayeredMode = function () {
            return '' + (bulbMode() === "layered");
        };
        keyRing.isButtonDown = function () {
            return '' + (heldKey !== null);
        };
        keyRing.whichButtonDown = function () {
            return '' + heldKey;
        };
        keyRing.enabledLayers = function () {
            var layer = [];
            for (var i = 0; i < 12; ++i) {
                layer[i] = getParam("enableLayer" + (i + 1)) >= 0.5 ? 'yes' : 'no';
            }
            return "[" + layer.join(" ") + "]";
        };
        keyRing.randomize = function () {
            return '' + randomizeModifier();
        };
    })(keyRing = main.keyRing || (main.keyRing = {}));
    var stayUpMenuHandler;
    (function (stayUpMenuHandler) {
        stayUpMenuHandler.activeMenu = null;
        stayUpMenuHandler.savedUndo = false;
        function close() {
            if (stayUpMenuHandler.activeMenu !== null) {
                editParam(stayUpMenuHandler.activeMenu.parameter, false);
                stayUpMenuHandler.activeMenu = null;
            }
        }
        stayUpMenuHandler.close = close;
        stayUpMenuHandler.isMenuOpen = function () {
            return '' + (stayUpMenuHandler.activeMenu !== null);
        };
    })(stayUpMenuHandler = main.stayUpMenuHandler || (main.stayUpMenuHandler = {}));
    var StayUpMenu = (function () {
        function StayUpMenu(parameter, parameterDescription) {
            var _this = this;
            this.parameter = parameter;
            this.position = { x: -1, y: -1 };
            this.selectedIndex = function () {
                var n = _this.items.length - 1;
                return '' + (n - Math.round(getParam(_this.parameter) * n));
            };
            this.selected = function () {
                return _this.items[Number(_this.selectedIndex())];
            };
            this.press = function () {
                stayUpMenuHandler.savedUndo = false;
                var showMenu = (stayUpMenuHandler.activeMenu !== _this);
                editParam(_this.parameter, showMenu);
                stayUpMenuHandler.activeMenu = (showMenu ? _this : null);
            };
            this.release = function () {
                var menuIndex = _this.positionToMenuIndex();
                if (menuIndex >= 0) {
                    _this.updateParam(menuIndex);
                    stayUpMenuHandler.close();
                }
            };
            this.mousePosition = {
                set: function (value) {
                    _this.position = toMousePosition(value);
                    var menuIndex = _this.positionToMenuIndex();
                    if (menuIndex >= 0) {
                        _this.updateParam(menuIndex);
                    }
                }
            };
            this.isVisible = function () {
                return '' + (stayUpMenuHandler.activeMenu === _this);
            };
            var info = PARAMS[PARAM_INDEXES[parameter]];
            assert(info.CHOICES !== null, "info.CHOICES !== null");
            this.items = info.CHOICES.slice().reverse()
                .map(function (v) { return v.replace(/\B-\B/g, "\x1bu2212"); });
            this.list = '[' + [this.items.map(function (f) { return "[" + f + "]"; })].join(",") + ']';
            this.undoDescription = translate("Change ^P").replace("^P", translate(parameterDescription));
            this.menuBounds = [0, 0, guiConfig.popDisplayWidth, this.items.length * guiConfig.popDisplayItemHeight];
        }
        StayUpMenu.prototype.updateParam = function (menuIndex) {
            assert(stayUpMenuHandler.activeMenu === this, "stayUpMenuHandler.activeMenu === this");
            if (!stayUpMenuHandler.savedUndo) {
                saveUndo(this.undoDescription);
                stayUpMenuHandler.savedUndo = true;
            }
            setParam(this.parameter, menuIndex / (this.items.length - 1));
        };
        StayUpMenu.prototype.positionToMenuIndex = function () {
            if (stayUpMenuHandler.activeMenu === this && insideBounds(this.position, this.menuBounds)) {
                var i = (this.position.y - this.menuBounds[1]) / (this.menuBounds[3] / this.items.length);
                var n = this.items.length;
                if (i >= 0 && i < n) {
                    return n - 1 - Math.floor(i);
                }
            }
            return -1;
        };
        return StayUpMenu;
    }());
    main.StayUpMenu = StayUpMenu;
    function soloLayer(layer) {
        if (main.reenableLayers === null) {
            ++layer;
            var l = [];
            for (var b = BRANCH_COUNT; b >= 1; --b) {
                var paramId = "enableLayer" + b;
                l[b - 1] = (getParam(paramId) >= 0.5);
                setParam(paramId, (b === layer ? 1 : 0));
            }
            main.reenableLayers = l;
        }
    }
    main.soloLayer = soloLayer;
    function previewNoteUp() {
        if (heldPreviewNote !== null) {
            sendMidi(0x80, heldPreviewNote, 1);
            heldPreviewNote = null;
        }
        if (main.reenableLayers !== null) {
            var l = main.reenableLayers;
            main.reenableLayers = null;
            for (var b = BRANCH_COUNT; b >= 1; --b) {
                var paramId = "enableLayer" + b;
                setParam(paramId, +l[b - 1]);
            }
        }
    }
    function previewNoteDown(note, velocity) {
        assert(heldPreviewNote == null, "heldPreviewNote == null");
        heldPreviewNote = note;
        sendMidi(0xD0, 0, 0);
        sendMidi(0x90, note, velocity);
    }
    main.plant = {
        enabled: function () {
            return main.selectedBranchIndex !== null;
        },
        execute: function (p) {
            var noUndo = (unescape(p) === "noUndo");
            if (main.selectedBranchIndex !== null) {
                main.isPlanting = true;
                if (!noUndo) {
                    saveUndo(translate('Plant'));
                }
                var patch = spawnPatch(getCachedPatch(), main.selectedBranchIndex);
                patch.control.wheelTarget = paramValue('wheelTarget', 'growth +');
                setElement('patch', patch);
            }
        },
        down: function () {
            var note;
            var velocity = 127;
            if (main.selectedBranchIndex !== null) {
                previewNoteUp();
                var sector = branchToSector(main.selectedBranchIndex);
                switch (bulbMode()) {
                    case 'standard': {
                        note = 60 + sector;
                        break;
                    }
                    case 'velocity': {
                        note = 60;
                        velocity = KEY_RING_VELOCITIES[sector];
                        break;
                    }
                    case 'ranges': {
                        note = Math.floor(24 + sector * 6);
                        break;
                    }
                    case 'layered': {
                        soloLayer(sector);
                        note = 60;
                        break;
                    }
                }
            }
            if (note != undefined) {
                previewNoteDown(note, velocity);
            }
        },
        up: previewNoteUp
    };
    function createRandomGenome(atonality) {
        var genome = {};
        for (var i = GENES.length - 4; --i >= 0;) {
            var v = void 0;
            do {
                v = random.normal(0.5, main.RANDOM_GENE_DEVIATION);
            } while (v < 0 || v > 1);
            genome[GENES[i].NAME] = v;
        }
        function converge(x, y) { return x + (0.5 - x) * (1 - y); }
        genome.a_mod = converge(genome.a_mod, atonality);
        genome.b_mod = converge(genome.b_mod, atonality);
        var r = (main.A_FREQ_MAX_PITCH - main.A_FREQ_MIN_PITCH);
        genome.a_freq = scale(genome.a_freq, 0, 1, 2 / r, 1);
        genome.a_freq = Math.round(genome.a_freq * r) / r;
        genome.b_freq = scale(genome.b_freq, 0, 1, 0.5 - atonality * 0.5, 1);
        genome.b_sh = scale(genome.b_sh, 0, 1, 0.15 - atonality * 0.15, 0.85 + atonality * 0.15);
        genome.a_noise = scale(genome.a_noise, 0, 1, 0, 0.9 + atonality * 0.1);
        genome.b_noise = scale(genome.a_noise, 0, 1, 0, 0.8 + atonality * 0.2);
        genome.adj_bass = 0.5;
        genome.adj_treb = 0.5;
        genome.adj_pan = 0.5;
        genome.adj_clip = 0.5;
        return genome;
    }
    function createRandomName(minLen, maxLen) {
        if (!main.wordlist) {
            run('wordlist.js');
        }
        assert(main.wordlist !== null);
        var name = '';
        var used = {};
        while (name.length < minLen || random.uniform() < 0.5) {
            var tries = 0;
            var word = void 0;
            var index = void 0;
            do {
                if (++tries > 20) {
                    tries = 0;
                    name = '';
                    used = {};
                }
                index = random.integer(main.wordlist.length);
                word = main.wordlist[index];
                assert(word !== undefined, "word !== undefined");
            } while (index in used || (name.length + word.length + (name === '' ? 0 : 1) > maxLen));
            if (name !== '') {
                name += ' ';
            }
            name += word[0].toUpperCase() + word.substring(1);
            used[index] = null;
        }
        return name;
    }
    function createRandomPatch() {
        var patch = getElement('patch');
        patch.name = createRandomName(8, 20);
        patch.path = null;
        patch.modified = true;
        var id = random.integer();
        patch.seedId = id;
        patch.patchId = null;
        patch.pitchAdjust = 0;
        patch.implementation = createElement('patch').implementation;
        patch.legacyMode = false;
        var control = patch.control;
        patch.genome = createRandomGenome(control.atonality);
        for (var b = BRANCH_COUNT; --b >= 0;) {
            var branch = patch.branches[b];
            branch.id = id + b;
            branch.length = 0;
            branch.volume = 0.5;
            branch.explicit = null;
        }
        control.modWheel = 0.0;
        control.rotation = 0.0;
        control.tuning = 0.5;
        return patch;
    }
    main.randomize = {
        patch: null,
        createdPatch: false,
        down: function () {
            previewNoteUp();
            if (!this.createdPatch) {
                this.patch = createRandomPatch();
                setPreview(this.patch);
                this.createdPatch = true;
            }
            previewNoteDown(60, 127);
        },
        up: previewNoteUp,
        release: function () {
            this.createdPatch = false;
            setPreview();
        },
        click: function () {
            saveUndo(translate('New Random Seed'));
            assert(this.patch != null, "this.patch != null");
            setElement('patch', this.patch);
            main.seedDiceRoll = diceRoll(main.seedDiceRoll);
            main.selectedBranchIndex = null;
            keyRing.rollDice();
        },
        execute: function () {
            saveUndo(translate('New Random Seed'));
            setElement('patch', createRandomPatch());
            main.seedDiceRoll = diceRoll(main.seedDiceRoll);
            main.selectedBranchIndex = null;
            keyRing.rollDice();
        }
    };
    function bulbMode() {
        return paramText("bulbMode", getParam("bulbMode"));
    }
    main.bulbMode = bulbMode;
    main.animate = function animate() {
        if (isLegacyMode()) {
            if (main.frame % 3 > 2.5) {
                main.legacyModeIconOffset.x = (0.5 + random.uniform() * 0.25) * (main.legacyModeIconOffset.x > 0 ? -1 : 1);
                main.legacyModeIconOffset.y = random.uniform() * 0.5 - 0.25;
            }
            else {
                main.legacyModeIconOffset.x = main.legacyModeIconOffset.y = 0;
            }
        }
        main.quantizedSoftClip = Math.floor(+getCushyVariable('feedbacks.softClip') * 32) / 32;
        main.frame += 1 / guiConfig.animationFps;
    };
    main.cloneBranch = {
        enabled: function () { return main.selectedBranchIndex !== null; },
        execute: function () {
            var _a;
            if (main.selectedBranchIndex !== null) {
                saveUndo(translate('Clone Branch'));
                var patch = getElement('patch');
                var control = patch.control;
                patch.modified = true;
                var cloneBranch_1 = patch.branches[main.selectedBranchIndex];
                var branchID = cloneBranch_1.id;
                var branchVolume = cloneBranch_1.volume;
                var explicit = ((_a = cloneBranch_1.explicit) !== null && _a !== void 0 ? _a : null);
                var branchLength = cloneBranch_1.length;
                var wheelTarget = paramText('wheelTarget', control.wheelTarget);
                var growthTarget = (wheelTarget === 'growth +' || wheelTarget === 'growth -');
                if (growthTarget) {
                    branchLength = lerp(branchLength, (wheelTarget == 'growth +' ? 1 : 0), control.modWheel * control.wheelScale);
                }
                for (var branchIndex = 0; branchIndex < BRANCH_COUNT; ++branchIndex) {
                    var branch = patch.branches[branchIndex];
                    branch.id = branchID;
                    branch.length = branchLength;
                    branch.volume = branchVolume;
                    branch.explicit = explicit;
                }
                if (growthTarget) {
                    control.modWheel = 0;
                }
                setElement('patch', patch);
                main.selectedBranchIndex = null;
            }
        }
    };
    function growNewRandomBranch(branchIndex) {
        saveUndo(translate('Grow New Random Branch'));
        var patch = getElement('patch');
        patch.modified = true;
        var branch = patch.branches[branchIndex];
        branch.id = random.integer();
        branch.explicit = null;
        setElement('patch', patch);
    }
    main.regrowBranch = {
        enabled: function () { return main.selectedBranchIndex !== null; },
        execute: function () {
            if (main.selectedBranchIndex !== null) {
                growNewRandomBranch(main.selectedBranchIndex);
            }
        }
    };
    function stopPapagenoAutoSelect() {
        if (globals.papagenoUI) {
            papagenoUI.stopAutoSelect();
        }
    }
    main.stopPapagenoAutoSelect = stopPapagenoAutoSelect;
    main.saveButton = {
        checked: function () { return getCachedPatch().modified; },
        execute: function () { performCushyAction("savePatch"); }
    };
    main.autoTune = function autoTune() {
        var patch = getElement('patch');
        var results = analyzePatchAudio(patch, 60, 127, ANALYSIS_HELD, ANALYSIS_DURATION, true, false, 44100);
        assert(results.pitch !== undefined);
        var semiAdjust = -((results.pitch + 6 + 120) % 12 - 6);
        var newTuning = patch.control.tuning * 24 - 12 + semiAdjust;
        while (newTuning > 12) {
            patch.pitchAdjust += 1;
            newTuning -= 12;
        }
        while (newTuning < -12) {
            patch.pitchAdjust -= 1;
            newTuning += 12;
        }
        patch.control.tuning = (newTuning + 12) / 24;
        patch.modified = true;
        saveUndo(translate('Auto Tune'));
        setElement('patch', patch);
    };
    main.autoLevel = function autoLevel() {
        var _a;
        var patch = getElement('patch');
        var results = analyzePatchAudio(patch, 60, 127, ANALYSIS_HELD, ANALYSIS_DURATION, false, true, 44100);
        assert(results.volume !== undefined);
        _a = __read(rescaleVolumeAndClipAdjust(patch.control.volume, patch.genome.adj_clip, fromDecibel(-results.volume)), 2), patch.control.volume = _a[0], patch.genome.adj_clip = _a[1];
        patch.modified = true;
        saveUndo(translate('Auto Level'));
        setElement('patch', patch);
    };
    main.autoLevelBranches = function autoLevelBranches() {
        var patch = getElement('patch');
        var sector = Math.round(patch.control.rotation * BRANCH_COUNT);
        var bulbMode = paramText("bulbMode", patch.control.bulbMode);
        var originalLayers = patch.layers;
        var newLayers = [];
        var enableLayers = (bulbMode !== 'layered' ? 1 : 0);
        for (var i = 0; i < originalLayers.length; ++i) {
            newLayers[i] = Object.assign({}, originalLayers[i], { enabled: enableLayers });
        }
        patch.layers = newLayers;
        var bulbModeMidiFunction = {
            'standard': function (sector) { return [60 + sector, 127]; },
            'velocity': function (sector) { return [60, KEY_RING_VELOCITIES[sector]]; },
            'ranges': function (sector) { return [Math.floor(24 + sector * 6), 127]; },
            'layered': function (sector) { patch.layers[sector].enabled = 1; return [60, 127]; }
        }[bulbMode];
        for (var branchIndex = 0; branchIndex < BRANCH_COUNT; ++branchIndex) {
            if (sector >= BRANCH_COUNT) {
                sector -= BRANCH_COUNT;
            }
            var _a = __read(bulbModeMidiFunction(sector), 2), note = _a[0], velocity = _a[1];
            var results = analyzePatchAudio(patch, note, velocity, ANALYSIS_HELD, ANALYSIS_DURATION, false, true, 44100);
            assert(results.volume !== undefined);
            var branch = patch.branches[branchIndex];
            branch.volume = clamp(branch.volume - results.volume / main.BRANCH_VOLUME_DB_RANGE / 2, 0, 1);
            patch.layers[sector].enabled = enableLayers;
            ++sector;
        }
        patch.modified = true;
        saveUndo(translate('Auto Level Branches'));
        patch.layers = originalLayers;
        setElement('patch', patch);
    };
    function atonalityHint() {
        var v = getParam('atonality');
        var t = paramText('atonality', v, false);
        var d = Math.ceil(square(Math.max(v * 2 - 1, 0)) * 100);
        return (d > 0 ? t + " (" + d + "% detuning)" : t);
    }
    main.atonalityHint = atonalityHint;
    function releaseHint() {
        var v = getParam('release');
        var t = paramText('release', v, false);
        var g = Math.ceil(Math.max(100 - v * 400, 0));
        return (g > 0 ? t + " (" + g + "% fx gating)" : t);
    }
    main.releaseHint = releaseHint;
    function effectHint() {
        var v = getParam('effect');
        var t = paramText('effect', v, false);
        var adjPan = getParam('adj_pan');
        var panAdjust = clamp(clamp(v * 2 - 1, -0.5, 0) + (adjPan < 0.5 ? adjPan - 0.5 : adjPan * 2 - 1), -1, 1);
        var negativeWidthAdjust = Math.min(panAdjust, 0);
        var positiveWidthAdjust = square(Math.max(panAdjust, 0)) * 4;
        var panAmount = (1 + positiveWidthAdjust) * Math.max(negativeWidthAdjust * 2 + 1, 0);
        var p = Math.floor(panAmount * 100);
        return (p < 100 ? t + " (" + p + "% pan)" : t);
    }
    main.effectHint = effectHint;
    main.initGUI = function initGUI(configParams) {
        guiConfig = parseNumbstrict(configParams);
        keyRing.setNotes(KEY_RING_NOTES);
        keyRing.setVelocities(KEY_RING_VELOCITIES);
        keyRing.setRanges(KEY_RING_DEFAULT_RANGES);
        main.voiceModeMenu = new StayUpMenu("voiceMode", "Voice Mode");
        main.wheelTargetMenu = new StayUpMenu("wheelTarget", "Mod Wheel Target");
        main.tempoSyncMenu = new StayUpMenu("tempoSync", "Tempo Sync");
    };
    main.openGUI = function openGUI() {
        if (getCushyVariable("trialExpired") !== 'true'
            && getCushyVariable('preferences.hideIntroduction') !== 'true') {
            displayCushy('Synplant2_introduction', 'modal');
        }
    };
    main.closeGUI = function closeGUI() {
        setPreview();
        previewNoteUp();
        stayUpMenuHandler.close();
    };
    main.openPapagenoReferenceRequest = '';
    function geneNameToIndex(name) {
        if (name) {
            for (var i = 0; i < GENES.length; ++i) {
                if (GENES[i].NAME === name) {
                    return i;
                }
            }
            throw new Error("${name} is not a valid GenomeParamId");
        }
        return -1;
    }
    main.geneNameToIndex = geneNameToIndex;
    main.keyModifiers = {
        set: function setKeyModifiers(s) {
            for (var k in main.modifiers) {
                main.modifiers[k] = false;
            }
            var a = s.split('+');
            for (var i = a.length; --i >= 0;) {
                main.modifiers[a[i]] = true;
            }
        }
    };
    main.seedModifier = function () {
        if (main.modifiers[PLATFORM.OS === 'mac' ? 'command' : 'control']) {
            return "randomize";
        }
        else if (main.modifiers.alt) {
            return "clone";
        }
        else {
            return PLATFORM.OS;
        }
    };
    main.seedModifierEnabled = function () {
        return '' + (main.seedModifier() !== "clone" || main.selectedBranchIndex !== null);
    };
    var drawPenLigatures = [["st", "\x1bue000"], ["ct", "\x1bue001"], ["at", "\x1bue002"], ["it", "\x1bue003"], ["ut", "\x1bue004"], ["ot", "\x1bue005"], ["et", "\x1bue006"], ["ak", "\x1bue007"], ["ik", "\x1bue008"], ["uk", "\x1bue009"], ["ok", "\x1bue010"], ["ek", "\x1bue011"], ["al", "\x1bue012"], ["il", "\x1bue013"], ["ul", "\x1bue014"], ["ol", "\x1bue015"], ["el", "\x1bue016"], ["bl", "\x1bue017"], ["sl", "\x1bue018"], ["ll", "\x1bue019"], ["all", "\x1bue020"], ["ill", "\x1bue021"], ["ull", "\x1bue022"], ["oll", "\x1bue023"], ["ell", "\x1bue024"], ["Sh", "\x1bue025"], ["St", "\x1bue026"], ["th", "\x1bue027"], ["nt", "\x1bue028"], ["gh", "\x1bue029"], ["ph", "\x1bue030"], ["tt", "\x1bue031"], ["gl", "\x1bue032"], ["sh", "\x1bue033"], ["ck", "\x1bue034"], ["lk", "\x1bue035"], ["mm", "\x1bue036"], ["oo", "\x1bue037"], ["ee", "\x1bue038"], ["eek", "\x1bue039"], ["ss", "\x1bue040"], ["ab", "\x1bue041"], ["ib", "\x1bue042"], ["ub", "\x1bue043"], ["eb", "\x1bue044"], ["ob", "\x1bue045"], ["af", "\x1bue046"], ["pl", "\x1bue047"], ["uf", "\x1bue048"], ["of", "\x1bue049"], ["ef", "\x1bue050"], ["ah", "\x1bue051"], ["ih", "\x1bue052"], ["uh", "\x1bue053"], ["oh", "\x1bue054"], ["eh", "\x1bue055"], ["an", "\x1bue056"], ["bh", "\x1bue057"], ["sk", "\x1bue058"], ["and", "\x1bue059"], ["itt", "\x1bue060"], ["son", "\x1bue061"], ["ful", "\x1bue062"], ["you", "\x1bue063"], ["nl", "\x1bue064"], ["yl", "\x1bue065"]];
    var cachedJohnHancock = "";
    main.JohnHancock = {
        get: function () {
            if (getCushyVariable("isRegistered") !== "true") {
                cachedJohnHancock = "";
            }
            else if (cachedJohnHancock === "") {
                cachedJohnHancock = getCushyVariable("registrationName");
                for (var i = drawPenLigatures.length - 1; i >= 0; --i) {
                    cachedJohnHancock = cachedJohnHancock.replace(drawPenLigatures[i][0], drawPenLigatures[i][1]);
                }
            }
            return cachedJohnHancock;
        }
    };
    main.scriptIsRepeating = {
        set: function scriptIsRepeatingSet(s) {
            isRepeating = (s === "true");
        }
    };
    main.runScript = {
        execute: function runScriptExecute(script) {
            script = unescape(script);
            run("" + DIRS.SCRIPTS + script);
        },
        checked: function runScriptChecked(script) {
            var s = unescape(script);
            var i = s.indexOf('.spscript/');
            if (i < 0) {
                return false;
            }
            s = s.substring(0, i);
            return (getDisplayedCushy('modal').substring(0, s.length) === s
                || getDisplayedCushy('script').substring(0, s.length) === s
                || getDisplayedCushy('dev').substring(0, s.length) === s);
        }
    };
    main.scriptsAvailable = function scriptsAvailable() {
        return '' + (fileInfo(DIRS.SCRIPTS) !== null);
    };
    main.scriptPopup = function scriptPopup() {
        var files = dir(DIRS.SCRIPTS);
        files.sort(function (a, b) { return a.name.toUpperCase().localeCompare(b.name.toUpperCase()); });
        var topItems = [];
        var bottomItems = [];
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            var name = void 0;
            if (file.isDirectory && (name = file.name).slice(-9) === ".spscript") {
                var scriptName = name.slice(0, -9);
                topItems.push([scriptName, 'main.runScript', name + "/" + scriptName + ".js"]);
            }
            else if (!file.isDirectory && (name = file.name).slice(-3) === ".js") {
                bottomItems.push([name.slice(0, -3), 'main.runScript', name]);
            }
        }
        return "{\n" + composeNumbstrict(topItems, true, false) + "\n" + (topItems.length ? '-\n' : '') + composeNumbstrict(bottomItems, true, false) + "\n" + (bottomItems.length ? '-\n' : '') + "{ \"Open Scripts Folder\", \"launch\", \"[var]DIRS.SCRIPTS[/var]\" }\n}";
    };
    main.register = function register() {
        performCushyAction('register');
        switch (main.displayedMessage()) {
            case 'runningTrial':
            case 'trialExpired': break;
            default:
                main.hasShownTrialInfo = false;
                break;
        }
    };
    main.showPendingModals = function showPendingModals() {
        var isRegistered = (getCushyVariable("isRegistered") === "true");
        if (isRegistered) {
            switch (main.displayedMessage()) {
                case 'runningTrial':
                case 'trialExpired':
                    displayCushy(null, 'modal');
                    break;
            }
            main.hasShownTrialInfo = false;
        }
        if (getDisplayedCushy('modal') === '') {
            if (main.isRunningIntroduction) {
                displayCushy('Synplant2_introduction', 'modal');
            }
            else if (!main.hasShownTrialInfo && !isRegistered) {
                var trialExpired = (getCushyVariable("trialExpired") === "true");
                main.displayMessage(trialExpired ? 'trialExpired' : 'runningTrial');
                main.hasShownTrialInfo = true;
            }
        }
    };
    main.runIntroduction = {
        execute: function runIntroductionExecute() {
            if (getDisplayedCushy('modal') === 'Synplant2_introduction') {
                introduction.userClose('');
            }
            else {
                displayCushy('Synplant2_introduction', 'modal');
            }
        },
        checked: function runIntroductionChecked() {
            return (getDisplayedCushy('modal') === 'Synplant2_introduction');
        }
    };
    main.displayMessage = function displayMessage(message) {
        message = unescape(message);
        if (message === '' && getDisplayedCushy('modal') === 'Synplant2_messages') {
            displayCushy(null, 'modal');
        }
        else {
            assert(MESSAGE_LABEL_TO_NUMBER[message] !== undefined, "Unknown message label: " + message);
            main.messageNumber = MESSAGE_LABEL_TO_NUMBER[message];
            displayCushy('Synplant2_messages', 'modal');
        }
    };
    main.displayedMessage = function displayedMessage() {
        return (getDisplayedCushy('modal') === 'Synplant2_messages' ? MESSAGE_NUMBER_TO_LABEL[main.messageNumber] : '');
    };
    main.legacyModeIconOffset = { x: 0, y: 0 };
    function isLegacyMode() {
        return getCachedPatch().legacyMode;
    }
    main.isLegacyMode = isLegacyMode;
    main.checkLegacyMode = function checkLegacyMode() {
        if (isLegacyMode() && getCushyVariable('preferences.hideLegacyModeInfo') !== 'true') {
            setCushyVariable('legacyModeLayout', 'Synplant2_legacyMode');
        }
        else {
            setCushyVariable('legacyModeLayout', '');
        }
    };
    main.showHideLegacyModeInfo = function showHideLegacyModeInfo() {
        if (getCushyVariable('legacyModeLayout') === '') {
            setCushyVariable('legacyModeLayout', 'Synplant2_legacyMode');
            setCushyVariable('preferences.hideLegacyModeInfo', 'false');
        }
        else {
            setCushyVariable('legacyModeLayout', '');
            setCushyVariable('preferences.hideLegacyModeInfo', 'true');
        }
    };
    main.openPapageno = {
        execute: function openPapagenoExecute() {
            if (getDisplayedCushy('modal') === 'Synplant2_papageno') {
                displayCushy(null, 'modal');
            }
            else if (getCushyVariable("trialExpired") === 'true') {
                display(translate("Please register Synplant to use this feature."), 'info', 'ok', 'ok');
            }
            else {
                if (fileInfo(DIRS.PAPAGENO + "synplantGenopatchConfig.numbstrict") === null) {
                    display(translate("Required resources are missing. Please reinstall Synplant."), 'error');
                }
                else {
                    displayCushy('Synplant2_papageno', 'modal');
                }
            }
        },
        checked: function openPapagenoChecked() {
            return (getDisplayedCushy('modal') === 'Synplant2_papageno');
        }
    };
    function refreshShuffledPatchList() {
        var path = deriveOpenPatchDir();
        try {
            if (main.lastRandomPatchDir !== path) {
                main.lastRandomPatchDir = path;
                if (path === null) {
                    main.shuffledRandomPatchList = null;
                }
                else {
                    var files = dir(path, ['synplant', 'synp']);
                    files.sort(function () { return random.uniform() - 0.5; });
                    main.shuffledRandomPatchList = files.map(function (file) { return file.name; });
                }
                main.nextRandomPatchIndex = 0;
            }
        }
        catch (_a) {
            main.lastRandomPatchDir = path;
            main.shuffledRandomPatchList = null;
        }
    }
    main.flushDirCache = function flushDirCache() {
        main.lastRandomPatchDir = null;
    };
    main.loadRandomPatch = {
        press: {
            execute: function loadRandomPatchExecute() {
                main.patchDisplayMode.blockRandomText = true;
                refreshShuffledPatchList();
                if (main.shuffledRandomPatchList && main.shuffledRandomPatchList.length > 0) {
                    var loadPath = main.lastRandomPatchDir + main.shuffledRandomPatchList[main.nextRandomPatchIndex % main.shuffledRandomPatchList.length];
                    if (fileInfo(loadPath) === null) {
                        main.lastRandomPatchDir = null;
                        refreshShuffledPatchList();
                        if (main.shuffledRandomPatchList && main.shuffledRandomPatchList.length > 0) {
                            loadPath = main.lastRandomPatchDir + main.shuffledRandomPatchList[main.nextRandomPatchIndex % main.shuffledRandomPatchList.length];
                        }
                        else {
                            return;
                        }
                    }
                    ++main.nextRandomPatchIndex;
                    loadPatch(loadPath, 'Load Random Patch');
                    previewNoteDown(60, 127);
                }
            },
            enabled: function loadRandomPatchEnabled() {
                return main.loadRandomPatch.canDo();
            }
        },
        release: previewNoteUp,
        canDo: function () {
            var path = deriveOpenPatchDir();
            return (path !== null);
        },
        directory: function loadRandomPatchDirectory() {
            var path = deriveOpenPatchDir();
            if (path === null) {
                return 'not found';
            }
            else {
                var c = path[path.length - 1];
                if (c === '/' || c === '\\') {
                    path = path.slice(0, -1);
                }
                return splitPath(path)[1];
            }
        }
    };
    main.patchDisplayMode = {
        get: function patchDisplayModeGet() {
            var showRandom = (randomizeModifier() && main.loadRandomPatch.canDo());
            if (showRandom) {
                showRandom = !this.blockRandomText;
            }
            else {
                this.blockRandomText = false;
            }
            if (showRandom) {
                return "random";
            }
            else if (isLegacyMode()) {
                return "legacy";
            }
            else {
                return "standard";
            }
        },
        blockRandomText: false
    };
    main.changeProgramNumber = {
        execute: function changeProgramNumberExecute(programNumber) {
            saveUndo(translate('Program Change'));
            select('program', +unescape(programNumber) - 1);
        },
        checked: function changeProgramNumberChecked(programNumber) {
            return (selected('program') === +unescape(programNumber) - 1);
        }
    };
    function addModPatcher(modName, cushyName, patcherFunction) {
        var patchers = main.modPatchers[cushyName];
        if (!patchers) {
            main.modPatchers[cushyName] = patchers = [];
        }
        patchers.push({ modName: modName, patcherFunction: patcherFunction });
    }
    globals.addModPatcher = addModPatcher;
    (function () {
        var _a;
        var modsDir = DIRS.SCRIPTS + "Mods" + DIR_SLASH;
        if ((_a = fileInfo(modsDir)) === null || _a === void 0 ? void 0 : _a.isDirectory) {
            if (!globals.mods) {
                globals.mods = {};
            }
            var autostartList = dir(modsDir, 'js');
            autostartList.sort(function (a, b) { return a.name.toUpperCase().localeCompare(b.name.toUpperCase()); });
            for (var i = 0; i < autostartList.length; ++i) {
                var name = autostartList[i].name;
                print("Running mod: " + name);
                try {
                    run("" + modsDir + name);
                }
                catch (e) {
                    display("Error running " + name + ": " + e, 'error');
                }
            }
            ;
            globals.handleCushyPreparation = (function handleCushyPreparation(cushyName, cushyContents) {
                var patched;
                var patchers = main.modPatchers[cushyName];
                if (patchers) {
                    for (var i = 0; i < patchers.length; ++i) {
                        var patcher = patchers[i];
                        try {
                            print("Patching " + cushyName + " with: " + patcher.modName);
                            var newContents = patcher.patcherFunction(cushyName, cushyContents);
                            if (newContents != undefined) {
                                if (newContents === cushyContents) {
                                    throw new Error("Mod " + patcher.modName + " did not update " + cushyName + ".cushy");
                                }
                                patched = cushyContents = newContents;
                            }
                        }
                        catch (e) {
                            display("Error patching with mod " + patcher.modName + ": " + e, 'error');
                        }
                    }
                }
                return patched;
            });
        }
    })();
    main.inited = true;
})(main || (main = {}));
var openAudioFile = function openAudioFile(param) {
    main.openPapagenoReferenceRequest = param;
    setCushyVariable('modalLayout', 'Synplant2_papageno');
};
