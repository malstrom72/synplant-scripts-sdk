var legacyMode;
(function (legacyMode) {
    legacyMode.userClose = (function legacyModeAlertUserClose() {
        setCushyVariable('legacyModeLayout', '');
        setCushyVariable('preferences.hideLegacyModeInfo', 'true');
    });
    legacyMode.readMore = (function legacyModeAlertReadMore() {
        main.displayMessage('legacyModeInfo');
    });
    legacyMode.upgradePatch = (function legacyModeUpgradePatch() {
        saveUndo(translate("Upgrade Patch"));
        var patch = getElement('patch');
        patch.legacyMode = false;
        patch.modified = true;
        setElement('patch', patch);
    });
})(legacyMode || (legacyMode = {}));
