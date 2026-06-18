if (!(function() { try { dir(DIRS.SKINS) } catch (x) { return false; }; return true; })()) {
    display('"Synplant Skins" folder is missing.\n\nThe path to this folder is: ' + DIRS.SKINS);
} else {
    displayCushy('Skin Chooser.spscript/SkinChooser_main', 'script', true);
}
