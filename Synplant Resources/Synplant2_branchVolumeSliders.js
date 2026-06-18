var branchVolumeSliders;
(function (branchVolumeSliders) {
    branchVolumeSliders.sectors = (function () {
        var secs = [];
        for (var sector = 0; sector < BRANCH_COUNT; ++sector) {
            secs[sector] = (function (sector) {
                var savedUndo = false;
                function branch() {
                    var N = BRANCH_COUNT;
                    return Math.round(sector + N - getParam('rotation') * N) % N + 1;
                }
                function volumeParam() { return "branchVolume" + branch(); }
                return {
                    volume: {
                        get: function () {
                            return '' + getParam(volumeParam());
                        },
                        set: function (v) {
                            var b = '' + branch();
                            if (!savedUndo) {
                                saveUndo(translate('Change Branch Volume ^N').replace('^N', b), false);
                                savedUndo = true;
                            }
                            setParam(('branchVolume' + b), +v);
                        },
                        touch: function (_beginEdit) {
                            savedUndo = false;
                        }
                    },
                    humanVolume: function () {
                        var param = volumeParam();
                        return paramText(param, getParam(param));
                    },
                    branch: function () { return '' + branch(); }
                };
            })(sector);
        }
        return secs;
    })();
})(branchVolumeSliders || (branchVolumeSliders = {}));
