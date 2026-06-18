addModPatcher('Detailed DNA Hints', 'Synplant2_dna', function(cushyName, cushyContents) {
    var MIN_TIME = 0.05;
    var MAX_TIME = 5.0;
    var MIN_ENV_TIME = 0.02;
    var MAX_ENV_TIME = 20.0;
    var INFINITE_ENV_TIME = 0.9 - 0.9 / 20000.0;
    var MIN_PITCH = -3.0; // Warning, if this is changed, check js and cushy files as well
    var MAX_PITCH = 3.0;
    var CARRIER_MOD_RANGE = 8.0;
    var MIN_FM_RATIO = -11.0;	// -7 in V1
    var MAX_FM_RATIO = 5.0;
    var FM_MOD_RANGE = 8.0;
    var FILTER_MOD_RANGE = 8.0;
    var MAX_FM_AMOUNT = 16.0;	// FIX : max is actually 4x this now, so change this constant
    var VOL_FADE_STARTS_AT = 0.75;
    var MIN_ROOM_SIZE = 0.1;
    var MAX_ROOM_SIZE = 5.0;
    var MAX_TUNING = 1.0; // In octaves
    var MAX_GROW_DEVIATION = 0.4; // 0.5773502692 // sqrt(1/3)  
    var SOFT_CLIPPER_ADJUST_MAX_DB = 36.0;
    var MOD_SH_THRESHOLD = 0.633928434993485; // log(20000.0 / 21.0) / log(50000.0)
    var C3_FREQUENCY = 261.625565300598635;
    var FM_SH_44 = Math.log(12500000 / 441) / (2 * Math.log(25000));
    var EQUALIZER_DB_RANGE = 24.0;
    var me;
    function calcTotalDuration(envTime) {
        return (envTime < INFINITE_ENV_TIME ? logScale(envTime, 0.0, 0.9, MIN_TIME, MAX_TIME)
                / (1.0 - envTime / 0.9) : Infinity);
    }
    function calcLoopDuration(envLoop) {
        return logScale(envLoop, 0.0, 0.8, MIN_ENV_TIME, MAX_ENV_TIME);
    }
    function oscFormHint(form) {
        var s;
        if (form < 0.33333) {
            var v = scale(form, 0.0, 0.33333, 0.0, 100.0);
            s = (100 - v).toFixed(2) + "% sine / " + v.toFixed(2) + "% saw";
        } else if (form < 0.66666) {
            var v = scale(form, 0.0, 0.66666, 0.0, 100.0);
            s = (100 - v).toFixed(2) + "% saw / " + v.toFixed(2) + "% square";
        } else {
            var pw = square(scale(form, 0.66666, 1.0, 1.0, 0.0)) * 50.0;
            s = "pulse width: " + pw.toFixed(2) + "%";
        }
        return s;
    }
    function smoothStaircaseFunction5(x) {
        var rx = Math.round(x);
        return 16 * Math.pow(x - rx, 5) + rx;
    }
    function smoothStaircaseFunction3(x) {
        var rx = Math.round(x);
        return 4 * Math.pow(x - rx, 3) + rx;
    }
    function calcFilterCutoff(param) {
        return 20 * cube(1.46415888336127788924 * param - 0.46415888336127788924);	// cube from -2 to 20
    }
    function calcFilterCutoffParamValue(pitch) {
        return (Math.cbrt(pitch / 20) + 0.46415888336127788924) / 1.46415888336127788924;
    }
    function describeTime(time) {
        var s;
        if (time === Infinity) {
            s = "infinite";
        } else if (time < 1.0) {
            s = (time * 1000.0).toFixed(2) + " ms";
        } else if (time < 60.0) {
            s = time.toFixed(2) + " s";
        } else {
            var minutes = Math.floor(time / 60);
            s = minutes + "m " + Math.round(time - minutes * 60) + "s";
        }
        return s;
    }
    function describeHz(hz) {
        var s;
        if (hz < 10000.0) {
            s = hz.toFixed(2) + " Hz";
        } else {
            s = (hz / 1000.0).toFixed(2) + " kHz";
        }
        return s;
    }
    function describeBipolar(v, decimals) {
        return (v >= 0 ? "+" : "") + v.toFixed(decimals == null ? 2 : decimals);
    }
    function describeSemitones(semitones) {
        return (Math.abs(semitones) < 1.0 ? describeBipolar(semitones * 100) + " cents" : describeBipolar(semitones) + " semitones");
    }
    function gcd(a, b) {
        while (a != b) {
            if (a > b) {
                a -= b;
            } else {
                b -= a;
            }
        }
        return a;
    }
    function calcSyncedLoopRatio(rateIndex, loopDuration) {
        var denom = Math.min(Math.pow(2.0, Math.round(Math.log(2 / loopDuration) * Math.LOG2E)), 64) * TEMPO_SYNC_RATES_DENOM[rateIndex];
        var num = TEMPO_SYNC_RATES_NUM[rateIndex];
        return [ num, denom ];
    }
    function describeSyncedRate(rateIndex, unsyncedFreq, envLoop) {
        var loopDuration = calcLoopDuration(envLoop);
        var sourceRatio = 1 / loopDuration / unsyncedFreq;
        var num;
        var denom;
        if (sourceRatio < 1.0) {
            var base3 = Math.round(3.0 / sourceRatio);
            var base2 = Math.round(2.0 / sourceRatio);
            var base1 = Math.round(1.0 / sourceRatio);
            if (base3 < 6 && Math.abs(3.0 / base3 - sourceRatio) < Math.abs(2.0 / base2 - sourceRatio)) {
                num = 3;
                denom = base3;
            } else if (base2 < 6) {
                num = 2;
                denom = base2;
            } else {
                num = 1;
                denom = base1;
            }
        } else {
            var base3 = Math.round(3.0 * sourceRatio);
            var base2 = Math.round(2.0 * sourceRatio);
            var base1 = Math.round(1.0 * sourceRatio);
            if (base3 < 6 && Math.abs(base3 / 3.0 - sourceRatio) < Math.abs(base2 / 2.0 - sourceRatio)) {
                num = base3;
                denom = 3;
            } else if (base2 < 6) {
                num = base2;
                denom = 2;
            } else {
                num = base1;
                denom = 1;
            }
        }
        var loopRatio = calcSyncedLoopRatio(rateIndex, loopDuration);
        return "synced: " + describeTimeDivision(num * loopRatio[0], denom * loopRatio[1]);
    }
    function describeTimeDivision(num, denom) {
        var g = gcd(num, denom);
        num /= g;
        denom /= g;
        var suffix = "";
        if (num === 3 && denom >= 2) {
            num /= 3;
            denom /= 2;
            suffix = " D";
        } else if (denom % 3 === 0 && num === 1) {
            denom /= 3;
            denom *= 2;
            suffix = " T";
        }
        return num + "/" + denom + suffix;
    }

    var TEMPO_SYNC_RATES_NUM = [ 0, 2, 3, 4, 1, 3, 2, 1 ];
    var TEMPO_SYNC_RATES_DENOM = [ 0, 1, 2, 3, 1, 4, 3, 2 ];
    mods.detailedDNAHints = {
        genes: {
            env_time: function env_time() {
                var envTime = getParam('env_time');
                return paramText('env_time', envTime) + " (" + describeTime(calcTotalDuration(envTime)) + ")";
            },
            env_loop: function env_loop() {
                var patch = getCachedPatch();
                var envLoop = patch.genome.env_loop;
                var totalDuration = calcTotalDuration(patch.genome.env_time);
                var loopDuration = calcLoopDuration(envLoop);

                var s;
                var rateIndex = Math.round(patch.control.tempoSync * 7);
                if (rateIndex > 0) {
                    var ratio = calcSyncedLoopRatio(rateIndex, loopDuration);
                    s = "synced: " + describeTimeDivision(ratio[0], ratio[1]);
                } else {
                    s =  (loopDuration >= totalDuration ? "no loop" : describeTime(loopDuration));
                }
                
                return paramText('env_loop', envLoop) + " (" + s + ")";
            },
            env_tilt: function env_tilt() {
                var envTilt = getParam('env_tilt');
                var r = Math.pow(envTilt, 4.0) * 100.0;
                return paramText('env_tilt', envTilt) + " (" + r.toFixed(2) + "% / " + (100 - r).toFixed(2) + "%)";
            },
            env_kf: function env_kf() {
                var envKF = getParam('env_kf');
                var envKeyFollow = square(Math.max(envKF - 0.5, 0.0) * 2.0) * 200.0;
                return paramText('env_kf', envKF) + " (" + envKeyFollow.toFixed(2) + "%)";
            },
            vol_atk: function vol_atk() {
                var volAtk = getParam('vol_atk');
                var ampEnvValue = 0.5;
                var ap = 0.99999 - 0.7 * cube(1.0 - volAtk);
                var denom = ampEnvValue * (2.0 * ap - 1.0) + 1.0 - ap;
                return paramText('vol_atk', volAtk) + " (midpoint: " + (Math.pow(ap * ampEnvValue / denom, 4) * 100).toFixed(2) + "%)";
            },
            vol_dcy: function vol_dcy() {
                var volDcy = getParam('vol_dcy');
                var ampEnvValue = 0.5;
                var ap = scale(volDcy, 0.0, 1.0, 0.1, 0.999);
                var denom = ampEnvValue * (2.0 * ap - 1.0) + 1.0 - ap;
                return paramText('vol_dcy', volDcy) + " (midpoint: " + (Math.pow(ap * ampEnvValue / denom, 4) * 100).toFixed(2) + "%)";
            },
            vol_sus: function vol_sus() {
                var volSus = getParam('vol_sus');
                var sustainLevel = square(Math.max(0.5 * (3.0 * volSus - 1.0), 0.0));
                if (sustainLevel < 0.001) {
                    sustainLevel = 0.0;
                }
                return paramText('vol_sus', volSus) + " (" + (Math.SQRT1_2 * sustainLevel * 100.0).toFixed(2) + "%)";
            },
            vol_fade: function vol_fade() {
                var volFade = getParam('vol_fade');
                var s;
                var v;
                if (volFade < VOL_FADE_STARTS_AT + 0.00001) {
                    s = "no fade";
                } else {
                    v = logScale(volFade, VOL_FADE_STARTS_AT, 1.0, 20.0, 0.2)
                            / scale(volFade, VOL_FADE_STARTS_AT, 1.0, 0.0, 1.0);
                    s = describeTime(v);
                }
                return paramText('vol_fade', volFade) + " (" + s + ")";
            },
            mod_atk: function mod_atk() {
                var modAtk = getParam('mod_atk');
                var mp = (1.0 - modAtk) * 0.98 + 0.01;
                var modEnvValue = 0.5;
                var a = modEnvValue - 2 * mp * modEnvValue;
                var denom = (a + mp * mp);
                var v = ((a + mp * mp * modEnvValue) / denom);
                return paramText('mod_atk', modAtk) + " (midpoint: " + (v * 100.0).toFixed(2) + "%)";
            },
            mod_dcy: function mod_dcy() {
                var modDcy = getParam('mod_dcy');
                var mp = (1.0 - modDcy) * 0.98 + 0.01;
                var modEnvValue = 0.5;
                var a = modEnvValue - 2 * mp * modEnvValue;
                var denom = (a + mp * mp);
                var v = ((a + mp * mp * modEnvValue) / denom);
                return paramText('mod_dcy', modDcy) + " (midpoint: " + (v * 100.0).toFixed(2) + "%)";
            },
            mod_sh: function mod_sh() {
                var patch = getCachedPatch();
                var modSH = patch.genome.mod_sh;
                var modShape = (modSH - 0.5) * 2.0;

                var s;
                if (modSH >= MOD_SH_THRESHOLD) {
                    var totalDuration = calcTotalDuration(patch.genome.env_time);
                    var modSHFreq = Math.max(logScale(modSH, 0.5, 1.0, 50000.0, 1.0), 2.0 / totalDuration);
                    var rateIndex = Math.round(patch.control.tempoSync * 7);
                    if (rateIndex > 0) {
                        s = describeSyncedRate(rateIndex, modSHFreq, patch.genome.env_loop);
                    } else {
                        s = describeHz(modSHFreq);
                    }
                } else {
                    s = "no sample-and-hold";
                }
                return paramText('mod_sh', modSH) + " (" + s + ")";
            },
            mod_vel: function mod_vel() {
                var modVel = getParam('mod_vel');
                var v = 100.0 - square(Math.min((1.0 - modVel) + 0.1, 1.0)) * 100.0;
                return paramText('mod_vel', modVel) + " (" + v.toFixed(2) + "%)";
            },
            lfo_rate: function lfo_rate() {
                var patch = getCachedPatch();
                var lfoRate = patch.genome.lfo_rate;
                var lfoFreq = logScale(lfoRate, 0.0, 1.0, 0.5, 20.0);
                var rateIndex = Math.round(patch.control.tempoSync * 7);
                var s;
                if (rateIndex > 0) {
                    s = describeSyncedRate(rateIndex, lfoFreq, patch.genome.env_loop);
                } else {
                    s = describeHz(lfoFreq);
                }
                return paramText('lfo_rate', lfoRate) + " (" + s + ")";
            },
            lfo_amt: function lfo_amt() {
                var lfoAmt = getParam('lfo_amt');
                var v = square(Math.max(Math.abs(lfoAmt - 0.5) * 4.0 - 1.0, 0.0)) * 100.0;
                return paramText('lfo_amt', lfoAmt) + " (" + v.toFixed(2) + "% " + (lfoAmt >= 0.5 ? "uniformly)" : "inversely)");
            },
            lfo_bal: function lfo_bal() {
                var lfoBal = getParam('lfo_bal');
                var vibratoWeight = clamp(3.0 - lfoBal * 4.0, 0.0, 1.0);
		        var tremoloWeight = clamp(lfoBal * 4.0 - 1.0, 0.0, 1.0);
                return paramText('lfo_bal', lfoBal) + " (" + (vibratoWeight * 100.0).toFixed(2) + "% vibrato / " + (tremoloWeight * 100.0).toFixed(2) + "% tremolo)";
            },
            lfo_dly: function lfo_dly() {
                var lfoDly = getParam('lfo_dly');
                var lfoAttackDuration = 4.0 * square(Math.max(lfoDly - 0.5, 0.0) * 2.0);
                return paramText('lfo_dly', lfoDly) + " (" + (lfoAttackDuration === 0.0 ? "no delay" : describeTime(lfoAttackDuration)) + ")";
            },
            a_form: function a_form() {
                var aForm = getParam('a_form');
                return paramText('a_form', aForm) + " (" + oscFormHint(square(aForm)) + ")";
            },
            a_noise: function a_noise() {
                var aNoise = getParam('a_noise');
                var v = Math.pow(clamp(aNoise * 3.5 - 2.35, 0.0, 1.0), 4.0);
                return paramText('a_noise', aNoise) + " (" + (v * 100.0).toFixed(2) + "%)";
            },
            a_mod: function a_mod() {
                var aMod = getParam('a_mod');
                return paramText('a_mod', aMod) + " (" + describeSemitones(cube(aMod * 2.0 - 1.0) * CARRIER_MOD_RANGE * 12.0) + ")";
            },
            a_color: function a_color() {
                var aColor = getParam('a_color');
                return paramText('a_color', aColor) + " (" + describeHz(logScale(aColor, 0.0, 1.0, 50.0, 20000.0)) + ")";
            },
            a_freq: function a_freq() {
                var patch = getCachedPatch();
                var pitch = patch.pitchAdjust + patch.control.tuning * 2 - 1 + patch.genome.a_freq * (MAX_PITCH - MIN_PITCH) + MIN_PITCH;
                var semis = pitch * 12;
                var note = Math.round(semis);
                var cents = Math.round((semis - note) * 100);
                var oct = Math.floor(note / 12) + 3;
                var noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][floorMod(note, 12)];
                var absCents = Math.abs(cents);
                return paramText('a_freq', patch.genome.a_freq) + " (" + noteName + oct + (cents >= 0 ? " +" : " -") + (absCents < 10 ? '0' : '') + absCents + ")";
            },
            fm_mod: function fm_mod() {
                var fmMod = getParam('fm_mod');
                return paramText('fm_mod', fmMod) + " (" + describeBipolar(fmMod * 200.0 - 100.0) + "%)";
            },
            fm_amt: function fm_amt() {
                var fmAmt = getParam('fm_amt');
                return paramText('fm_amt', fmAmt) + " (" + describeBipolar(Math.pow(fmAmt * 2.0 - 1.0, 4.0) * MAX_FM_AMOUNT * 4.0, 3) + "x)";
            },
            mix_mod: function mix_mod() {
                var mixMod = getParam('mix_mod');
                return paramText('mix_mod', mixMod) + " (" + describeBipolar(mixMod * 200.0 - 100.0) + "%)";
            },
            osc_mix: function osc_mix() {
                var patch = getCachedPatch();
                var oscMix = patch.genome.osc_mix;
                var v = square(oscMix) * 100.0;
                
                var tuning = patch.control.tuning * 2 - 1;
                var rateA = Math.pow(2, 6 * patch.genome.a_freq - 3 + patch.pitchAdjust + tuning);
                var fmRateC = smoothStaircaseFunction5(patch.genome.b_freq * 16 - 11);
                var mixLimiter = clamp(fmRateC + 4, 0, 1);
                var fmSH = Math.abs(patch.genome.b_sh * 2 - 1);
                if (fmSH >= FM_SH_44 && patch.genome.b_sh < 0.5) {
                    var fmSHRatio = logScale(fmSH, 0.5, 1, 50000, 2) / C3_FREQUENCY;
                    if (fmSHRatio >= 0.25) {
                        fmSHRatio = exp2(smoothStaircaseFunction3(log2(fmSHRatio)));
                    }
                    mixLimiter = scale(clamp(fmSHRatio, 0.25, 1.25), 0.25, 1.25, 0, mixLimiter);
                } else {
                    mixLimiter = clamp(7 - fmSH * 8, 0, mixLimiter);
                }
                var oscMixC = cube(patch.genome.osc_mix);
                var c = Math.sqrt(1 - Math.sqrt(1 - mixLimiter));
                var a = 1 - square(square(Math.min(0 - c, 0)) - 1);
                oscMixC = Math.min(oscMixC, a);
                var oscMixCC = Math.sqrt(1 - Math.sqrt(1 - oscMixC));
                var oscMixCF = Math.sqrt(1 - Math.sqrt(oscMixC));
                var carrierMix = 1 - Math.abs(oscMixCC) * oscMixCC;
                var fmMix = 1 - Math.abs(oscMixCF) * oscMixCF;
                var sum = carrierMix + fmMix;
                
                return paramText('osc_mix', oscMix) + " (" + (carrierMix / sum * 100).toFixed(2) + "% osc A / " + (fmMix / sum * 100).toFixed(2) + "% osc B)";
            },
            b_form: function b_form() {
                var bForm = getParam('b_form');
                return paramText('b_form', bForm) + " (" + oscFormHint(square(bForm)) + ")";
            },
            b_noise: function b_noise() {
                var bNoise = getParam('b_noise');
                return paramText('b_noise', bNoise) + " (" + (square(clamp(bNoise * 3.5 - 2.35, 0.0, 1.0)) * 100.0).toFixed(2) + "%)";
            },
            b_mod: function b_mod() {
                var bMod = getParam('b_mod');
                return paramText('a_mod', bMod) + " (" + describeSemitones(cube(bMod * 2.0 - 1.0) * FM_MOD_RANGE * 12.0) + ")";
            },
            sub_am: function sub_am() {
                var subAM = getParam('sub_am');
                return paramText('sub_am', subAM) + " (" + (square(Math.max(subAM * 1.5 - 0.5, 0.0)) * 100.0).toFixed(2) + "%)";
            },
            b_freq: function b_freq() {
                var bFreq = getParam('b_freq');
                var bFreqLinear = smoothStaircaseFunction5(MIN_FM_RATIO + bFreq * (MAX_FM_RATIO - MIN_FM_RATIO));
                var oct = Math.floor(bFreqLinear + 1 / 24.0);
                bFreqLinear -= oct;
                var semi = Math.round(bFreqLinear * 12.0);
                bFreqLinear -= semi / 12.0;
                var cent = Math.round(bFreqLinear * 1200.0);
                return paramText('b_freq', bFreq) + " (oct:" + oct + ", semi:" + semi + (cent >= 0 ? ", cent: +" : ", cent: ") + cent + ")";
            },
            b_sh: function b_sh() {
                var patch = getCachedPatch();
                var bSH = patch.genome.b_sh;
                var fmSH = Math.abs(bSH * 2 - 1);
                var s;
                if (fmSH < FM_SH_44) {
                    s = "no sample-and-hold)";
                } else {
                    var fmSHFreq = logScale(fmSH, 0.5, 1, 50000, 2);
                    if (bSH >= 0.5) {
                        var rateIndex = Math.round(patch.control.tempoSync * 7);
                        if (rateIndex > 0 && bSH >= 0.9) {
                            s = describeSyncedRate(rateIndex, fmSHFreq, patch.genome.env_loop) + ")";
                        } else {
                            s = "fixed: " + describeHz(fmSHFreq) + ")";
                        }
                    } else {
                        var fmSHRatio = fmSHFreq / C3_FREQUENCY;
                        if (fmSHRatio >= 0.25) {
                            fmSHRatio = Math.pow(2, smoothStaircaseFunction3(Math.log(fmSHRatio) * Math.LOG2E));
                        }
                        s = "ratio: " + fmSHRatio.toFixed(2) + "x)";
                    }
                }
                return paramText('b_sh', bSH) + " (" + s;
            },
            flt_type: function flt_type() {
                var fltType = getParam('flt_type');
                var s;
                if (fltType < 1 / 3) {
                    var v = fltType * 300;
                    s = (100 - v).toFixed(2) + "% bp / " + v.toFixed(2) + "% lp24)";
                } else if (fltType < 2 / 3) {
                    var v = (fltType - 1 / 3) * 300;
                    s = (100 - v).toFixed(2) + "% lp24 / " + v.toFixed(2) + "% lp12)";
                } else {
                    var v = (fltType - 2 / 3) * 300;
                    s = (100 + 1e-8 - v).toFixed(2) + "% lp12 / " + v.toFixed(2) + "% notch)";
                }
                return paramText('flt_type', fltType) + " (" + s;
            },
            flt_q: function flt_q() {
                var fltQ = getParam('flt_q');
                var filterLNRQ = 0.6931471805599453 - 4.605170185988091 * fltQ;
                return paramText('flt_q', fltQ) + " (q: " + (1.0 / Math.exp(filterLNRQ)).toFixed(2) + ")";
            },
            flt_mod: function flt_mod() {
                var fltMod = getParam('flt_mod');
                var v = fltMod * 2 - 1;
                var semis = v * Math.abs(v) * FILTER_MOD_RANGE * 12.0;
                return paramText('flt_mod', fltMod) + " (" + describeSemitones(semis) + ")";
            },
            flt_sep: function flt_sep() {
                var fltSep = getParam('flt_sep');
                var fltType = getParam('flt_type');
                var separation = fltSep * 2 - 1;
                separation = Math.abs(separation) * separation * 4;
                if (fltType < 1 / 3) {
                    if (separation < 0.0) {
                        separation *= (1 / 3 - fltType) * 3;
                    }
                } else if (fltType < 2 / 3) {
                    if (separation < 0.0) {
                        separation *= (fltType - 1 / 3) * 3;
                    }
                }
                return paramText('flt_sep', fltSep) + " (" + describeSemitones(separation * 12.0) + ")";
            },
            flt_freq: function flt_freq() {
                var patch = getCachedPatch();
                var fltFreq = patch.genome.flt_freq;
            /*
                switch (paramText('wheelTarget', patch.control.wheelTarget)) {
                    case 'filter +': {
                        var linearCutoff = calcFilterCutoff(fltFreq);
                        // we cut the range to 50% because the last few octaves are virtually always above audible range
                        var modulatedCutoff = lerp(linearCutoff, 20.0, square(patch.control.wheelScale) * 0.5 * patch.control.modWheel);
                        var expCutoff = calcFilterCutoffParamValue(modulatedCutoff);
                        fltFreq = clamp(expCutoff, 0.0, 1.0);
                        break;
                    }
                    case 'filter -': {
                        var linearCutoff = calcFilterCutoff(fltFreq);
                        var modulatedCutoff = lerp(lerp(linearCutoff, -2.0, 1 - square(1 - patch.control.wheelScale)), linearCutoff, patch.control.modWheel);
                        var expCutoff = calcFilterCutoffParamValue(modulatedCutoff);
                        fltFreq = clamp(expCutoff, 0.0, 1.0);
                        break;
                    }
                }
            */
                var cutoff = calcFilterCutoff(fltFreq);
                if (patch.genome.flt_type < 1 / 3) {
                    var K = 5.358983848622458;
                    cutoff = lerp((2 * cutoff <= K ? cutoff : K - (K * K / 4) / cutoff), cutoff, square(patch.genome.flt_type * 3));
                }
                cutoff += patch.genome.a_freq * (MAX_PITCH - MIN_PITCH) + MIN_PITCH;
                return paramText('flt_freq', fltFreq) + " (" + describeHz(Math.min(C3_FREQUENCY * Math.pow(2.0, cutoff), 21609.0)) + ")";
            },
            flt_kf: function flt_kf() {
                var fltKF = getParam('flt_kf');
                return paramText('flt_kf', fltKF) + " (" + (clamp(2 * fltKF - 0.5, 0.0, 1.0) * 100.0).toFixed(2) + "%)";
            },
            saturate: function saturate() {
                var saturate = getParam('saturate');
                return paramText('saturate', saturate) + " (" + (square(Math.max((saturate - 0.5) * 2.0, 0.0)) * 100).toFixed(2) + "%)";
            },
            rvb_mix: function rvb_mix() {
                var patch = getCachedPatch();
                var rvbMix = patch.genome.rvb_mix;
                var v = rvbMix;
            /*
                var effectAdjust = patch.control.effect * 2 - 1;
                switch (paramText('wheelTarget', patch.control.wheelTarget)) {
                    case 'effect': {
                        effectAdjust = lerp(effectAdjust, lerp(Math.max(effectAdjust - 0.5, -1.0), 1.0, patch.control.modWheel), patch.control.wheelScale);
                        break;
                    }
                }
                if (effectAdjust >= 0.0) {
                    v = scale(effectAdjust, 0.0, 1.0, v, 1.0);
                } else {
                    v = scale(effectAdjust, 0.0, -1.0, v, 0.0);
                }
            */
                v = cube(v) * 100.0;
                return paramText('rvb_mix', rvbMix) + " (" + v.toFixed(2) + "%)";
            },
            rvb_atk: function rvb_atk() {
                var rvbAtk = getParam('rvb_atk');
                var s;
                if (rvbAtk >= 0.66667) {
                    var hawkEnvTime = logScale(rvbAtk, 0.666666666666666, 1.0, 0.02, 8.0)
                            * scale(rvbAtk, 0.666666666666666, 1.0, 0.0, 1.0);
                    s = describeTime(hawkEnvTime);
                } else {
                    s = "off";
                }
                return paramText('rvb_atk', rvbAtk) + " (" + s + ")";
            },
            rvb_len: function rvb_len() {
                var rvbLen = getParam('rvb_len');
                return paramText('rvb_len', rvbLen) + " (" + describeTime(logScale(square(rvbLen), 0.0, 1.0, 0.2, 20.0)) + ")";
            },
            rvb_damp: function rvb_damp() {
                var rvbDamp = getParam('rvb_damp');
                var s;
                if (rvbDamp < 0.1) {
                    s = "no damping";
                } else if (rvbDamp < 0.25) {
                    s = describeHz(scale(rvbDamp, 0.1, 0.25, 28828.125 * 2.0, 28828.125));
                } else {
                    s = describeHz(scale(cube(rvbDamp), 0.25, 1.0, 22500.0, 2250.0));
                }
                return paramText('rvb_damp', rvbDamp) + " (" + s + ")";
            },
            rvb_chor: function rvb_chor() {
                var rvbChor = getParam('rvb_chor');
                var v = Math.pow(rvbChor * 2, 4);
                return paramText('rvb_chor', rvbChor) + " (" + v.toFixed(2) + "x)";
            },
            rvb_size: function rvb_size() {
                var rvbSize = getParam('rvb_size');
                return paramText('rvb_size', rvbSize) + " (size: " + scale(rvbSize, 0.0, 1.0, MIN_ROOM_SIZE, MAX_ROOM_SIZE).toFixed(2) + ")";
            },
            adj_bass: function adj_bass() {
                var adjBass = getParam('adj_bass');
                return paramText('adj_bass', adjBass) + " (" + describeBipolar((adjBass * 2 - 1) * EQUALIZER_DB_RANGE) + "dB at 100Hz)";
            },
            adj_treb: function adj_treb() {
                var adjTreble = getParam('adj_treb');
                return paramText('adj_treb', adjTreble) + " (" + describeBipolar((adjTreble * 2 - 1) * EQUALIZER_DB_RANGE) + "dB at 6000Hz)";
            },
            adj_pan: function adj_pan() {
                var adjPan = getParam('adj_pan');
                var panAdjust = (adjPan < 0.5 ? adjPan - 0.5 : adjPan * 2 - 1) * 200;
                return paramText('adj_pan', adjPan) + " (" + describeBipolar(panAdjust) + "%)";
            },
            adj_clip: function adj_clip() {
                var adjClip = getParam('adj_clip');
                var v = adjClip * 2.0 - 1.0;
                v = Math.abs(v) * v;
                return paramText('adj_clip', adjClip) + " (" + describeBipolar(v * SOFT_CLIPPER_ADJUST_MAX_DB) + "dB)";
            }
        },
    };

    if (!mods.originalPerformCushyAction && globals.performCushyAction.toString() === "function() { [native code] }") {
        print("patching performCushyAction()");
        mods.originalPerformCushyAction = globals.performCushyAction;
        globals.performCushyAction = new Function('action', 'params', 'if (action === "hint") { var parsedParams = parseNumbstrict(params); if (typeof parsedParams === "object") { parsedParams.text = parsedParams.text.replace(/^(\\w+\\s*=\\s*\\[var\\])params\\.(\\w+)\\.human(\\[\\/var\\])$/, "$1mods.detailedDNAHints.genes.$2$3"); params = composeNumbstrict(parsedParams); } }; return mods.originalPerformCushyAction(action, params)');
    }
  
    return cushyContents.replace('hint: "@param = [var]params.@param.human[/var]"'
            , 'hint: "@param = [var]mods.detailedDNAHints.genes.@param[/var]"');
});
