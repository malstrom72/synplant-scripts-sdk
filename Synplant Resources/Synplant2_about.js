var about;
(function (about) {
    var guiConfig;
    about.animate = function animate() {
        about.frame += 1 / guiConfig.animationFps;
    };
    function initGUI(configParams) {
        guiConfig = parseNumbstrict(configParams);
    }
    about.initGUI = initGUI;
    if (!about.inited) {
        about.frame = 0;
        about.inited = true;
    }
})(about || (about = {}));
