if (!this.tuningFork) {
	tuningFork = {
		isEnabled: false,
		windowPosition: '',
		windowZOrder: ''
	}
}

Object.assign(tuningFork, {
	enable: function enable() {
		tuningFork.isEnabled = true;
		setPreview(tuningFork.previewPatch);
	},
	disable: function enable() {
		tuningFork.isEnabled = false;
		setPreview();
	},
	toggle: {
		execute: function toggleExecute() {
			if (tuningFork.isEnabled) {
				tuningFork.disable();
			} else {
				tuningFork.enable();
			}
		},
		checked: function toggleChecked() {
			return tuningFork.isEnabled;
		}
	},
	close: function() {
		tuningFork.disable()
	},
	previewPatch: (function() {
		var p = createElement('patch');
		p.genome.a_form = 0.8;
		p.genome.vol_sus = 1.0;
		p.genome.flt_freq = 1.0;
		p.genome.rvb_mix = 0.0;
		p.control.release = 0.0;
		return p;
	})()
});
