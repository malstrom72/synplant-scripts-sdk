var settings;
(function (settings) {
    var SettingsField = (function () {
        function SettingsField(field, additionalUpdateLogic) {
            this.field = field;
            this.additionalUpdateLogic = additionalUpdateLogic;
            this.field = field;
        }
        SettingsField.prototype.get = function () {
            return "" + getElement('midiConfig')[this.field];
        };
        SettingsField.prototype.set = function (v) {
            var midiConfig = getElement('midiConfig');
            switch (typeof midiConfig[this.field]) {
                case 'boolean':
                    midiConfig[this.field] = (unescape(v) === "true");
                    break;
                case 'number':
                    midiConfig[this.field] = +unescape(v);
                    break;
                case 'string':
                    midiConfig[this.field] = unescape(v);
                    break;
            }
            if (this.additionalUpdateLogic) {
                this.additionalUpdateLogic(midiConfig);
            }
            setElement('midiConfig', midiConfig);
        };
        return SettingsField;
    }());
    settings.midiOutputChannel = {
        get: function getMidiOutputChannel() {
            var channel = getElement('midiConfig').outputChannel;
            return channel === null ? 'none' : ('' + channel);
        },
        set: function setMidiOutputChannel(v) {
            v = unescape(v);
            var midiConfig = getElement('midiConfig');
            midiConfig.outputChannel = (v === "none" ? null : +v);
            setElement('midiConfig', midiConfig);
        }
    };
    settings.velocityCurve = new SettingsField("velocityCurve");
    settings.pressureCurve = new SettingsField("pressureCurve");
    settings.notesSelectsBranch = new SettingsField("notesSelectsBranch");
    settings.minPolyphony = new SettingsField("minPolyphony", function (midiConfig) { midiConfig.maxPolyphony = Math.max(midiConfig.maxPolyphony, midiConfig.minPolyphony); });
    settings.maxPolyphony = new SettingsField("maxPolyphony", function (midiConfig) { midiConfig.minPolyphony = Math.min(midiConfig.minPolyphony, midiConfig.maxPolyphony); });
    settings.masterTuning = {
        get: function getMasterTuning() {
            return "" + getElement('midiConfig').masterTuning;
        },
        set: function setMasterTuning(v) {
            var midiConfig = getElement('midiConfig');
            var newTuning = Math.round(+unescape(v));
            if (midiConfig.masterTuning !== newTuning) {
                midiConfig.masterTuning = newTuning;
                setElement('midiConfig', midiConfig);
            }
        }
    };
    if (!settings.inited) {
        settings.windowPosition = '';
        settings.windowZOrder = '';
        settings.inited = true;
    }
})(settings || (settings = {}));
