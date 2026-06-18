addModPatcher('Favorite Button', 'Synplant2_main', function(cushyName, cushyContents) {
    var userPatches = DIRS.DOCUMENTS + 'Synplant User Patches' + DIR_SLASH;
    if (fileInfo(userPatches) === null) {
        makeDir(userPatches);
    }
    var favoriteFolder = userPatches + 'Favorites' + DIR_SLASH;
    if (fileInfo(favoriteFolder) === null) {
        makeDir(favoriteFolder);
    }
    mods.favoriteButton = {
        markFavorite: {
            checked: function favoriteButtonChecked() {
                var name = splitPath(getCachedPatch().path)[1];
                return fileInfo(favoriteFolder + name + '.synplant') !== null;
            },
            execute: function favoriteButtonExecute() {
                var patch = getElement('patch');
                var path = favoriteFolder + splitPath(patch.path)[1] + '.synplant';
                var t;
                if (fileInfo(path) !== null) {
                    eraseFile(path);
                    t = translate("Removed from Favorites folder");
                } else {
                    save(path, marshal('patch', patch, true));
                    t = translate("Added to Favorites folder");
                }
                displayHint(t);
            },
            enabled: function favoriteButtonEnabled() {
                var patch = getCachedPatch();
                if (patch.modified) {
                    return false;
                }
                var path = patch.path;
                return (path !== null && splitPath(path)[0] !== favoriteFolder);
            },
            hint: function() {
                var t;
                if (!this.enabled()) {
                    var patch = getCachedPatch();
                    if (patch.path === null)  {
                        t = "Disabled because the patch has not been saved yet"
                    } else if (patch.modified) {
                        t = "Disabled because the patch has been modified since it was last saved";
                    } else {
                        t = "Disabled because you are in the Favorites folder";
                    }
                } else if (this.checked()) {
                    t = "Click to remove from Favorites folder";
                } else {
                    t = "Click to add to the Favorites folder. Right-click to select a favorite.";
                }
                return translate(t);
            }
        },
        showHint: function() {
            displayHint(this.markFavorite.hint());
        },
        loadFavorite: function(name) {
            (globals.loadSynplantPatch ? loadSynplantPatch : loadPatch)(favoriteFolder + unescape(name), "Open Patch");
        },
        showFolder: function() {
            performCushyAction('launch', composeNumbstrict(favoriteFolder));
        },
        contextMenu: function() {
            var files = dir(favoriteFolder, [ 'synplant', 'synp' ]);
            files.sort(function(a, b) { return a.name.toUpperCase().localeCompare(b.name.toUpperCase()) });
            var items = [ ];
            for (var i = 0; i < files.length; ++i) {
                var name = files[i].name;
                items.push([ splitPath(name)[1], 'mods.favoriteButton.loadFavorite', name ]);
            }
            return '{ { "Show Favorites Folder", "mods.favoriteButton.showFolder" }, -, ' + composeNumbstrict(items, false, false) + ' }';
        }
    }

    var offset = cushyContents.indexOf("// Patch display");
    if (offset === -1) {
        throw new Error('Patch display comment not found');
    }
    var strAfterOffset = cushyContents.slice(offset);
    var updatedString = strAfterOffset.replace(
        /@begin patchDisplay\(width\)/,
        " @define favoriteStarWidth = 24\n$&"
    );
    if (updatedString === strAfterOffset) {
        throw new Error('@begin patchDisplay(width) not found or replacement failed');
    }
    strAfterOffset = updatedString;
    updatedString = strAfterOffset.replace(
        /(@patchDisplay\(216|bounds: \{ w-27|bounds: \{ 7, 4, 216)/g,
        "$&-@favoriteStarWidth"
    );
    if (updatedString === strAfterOffset) {
        throw new Error('Specified string for favoriteStarWidth addition not found or replacement failed');
    }
    strAfterOffset = updatedString;
    var insertionBlock = "{\n" +
        " type: \"click\"\n" +
        " bounds: { 202, 7, 20, 20 }\n" +
        " action: mods.favoriteButton.showHint\n" +
        "}\n" +
        "{\n" +
        " type: \"button\"\n" +
        " bounds: { 202, 7, 20, 20 }\n" +
        " vector: {\n" +
        "  code: \"format IVG-2 requires:IMPD-1;bounds 0,0,20,20;op={$disabled?$disabledOpacity:1};pen $frameColor opacity:$op;fill {$checked?$innerColor:none} opacity:$op;scale {$down?0.95:1} anchor:10,10;rotate -135 anchor:10,10;PATH svg:[M5,15 v-10 h10 a4.5,5,90,0,1,0,10 a5.5,5,90,0,1,-10,0 z]\"\n" +
        "  defines: {\n" +
        "   \"frameColor\": \"@MAIN_DISPLAY_TEXT_COLOR\"\n" +
        "   \"innerColor\": \"#6CEF4A\"\n" +
        "   \"disabledOpacity\": \"0.25\"\n" +
        "  }\n" +
        " }\n" +
        " actions: {\n" +
        "  { \"click\", \"mods.favoriteButton.markFavorite\" }\n" +
        "  { \"context\", \"popup\", {\n" +
        "   shortcuts: false\n" +
        "   metaExpandCaptions: false\n" +
        "   items: mods.favoriteButton.contextMenu\n" +
        "  } }\n" +
        " }\n" +
        " hint: \"[var]mods.favoriteButton.markFavorite.hint[/var]\"\n" +
        "}\n";
    var pattern = /\{\s*type:\s*"raster"\s*blend:\s*"add"\s*image:\s*"patchspecular"\s*\}/;
    var replacedBlock = strAfterOffset.replace(pattern, insertionBlock + "$&");
    if (replacedBlock === strAfterOffset) {
        throw new Error('Multiline text block not found or replacement failed');
    }
    return cushyContents.slice(0, offset) + replacedBlock;
    
});
addModPatcher('Favorite Button', 'Synplant2_legacyMode', function(cushyName, cushyContents) {
    return cushyContents.replace(/offset: \{ 30, -130 \}/g, 'offset: { 4, -130 }')
});
