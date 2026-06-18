var midiEdit;
(function (midiEdit) {
    function convertToCC(value) {
        var v = +value;
        return (isNaN(v) ? null : v);
    }
    function convertFromCC(cc) {
        return (cc === null ? "off" : '' + cc);
    }
    function getBranchesCC() {
        var mc = getElement('midiConfig');
        return mc.branchesCC[0];
    }
    function updateBranchesCC(cc) {
        var mc = getElement('midiConfig');
        if (cc == null) {
            for (var i = BRANCH_COUNT; --i >= 0;) {
                mc.branchesCC[i] = null;
            }
        }
        else {
            for (var i = Math.min(BRANCH_COUNT, 128 - cc); --i >= 0;) {
                mc.branchesCC[i] = cc + i;
            }
        }
        setElement('midiConfig', mc);
    }
    var branchesCCUnderEdit = false;
    var branchesCCEditValue = null;
    midiEdit.branchesCC = {
        get: function branchesCCGet() {
            return convertFromCC(branchesCCUnderEdit ? branchesCCEditValue : getBranchesCC());
        },
        set: function branchesCCSet(value) {
            var cc = convertToCC(value);
            if (branchesCCUnderEdit) {
                branchesCCEditValue = cc;
            }
            else {
                updateBranchesCC(cc);
            }
        },
        touch: function branchesCCTouch(beginEdit) {
            branchesCCUnderEdit = beginEdit;
            if (beginEdit) {
                branchesCCEditValue = getBranchesCC();
            }
            else {
                updateBranchesCC(branchesCCEditValue);
            }
        }
    };
    midiEdit.branchesCCDisplay = function branchesCCDisplay() {
        var cc = (branchesCCUnderEdit ? branchesCCEditValue : getBranchesCC());
        return (cc === null ? "---" : cc + ".." + Math.min(cc + BRANCH_COUNT - 1, 127));
    };
})(midiEdit || (midiEdit = {}));
