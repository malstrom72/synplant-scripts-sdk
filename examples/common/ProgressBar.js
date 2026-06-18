(function() {
	var me = globals.progressBar;
	if (!me) {
		globals.progressBar = me = {
			windowPosition: '',
			windowZOrder: '',
			callbacks: null,
			progress: null
		}
	}

	me.windowPosition = (me.windowPosition || '');
	me.windowZOrder = (me.windowZOrder || '');

	function progressBarWork() {
		assert(me.callbacks, "me.callbacks");
		if (me.callbacks.worker) {
			var newProgress = me.callbacks.worker();
			if (newProgress) {
				me.progress = newProgress;
			} else {
				displayCushy(null, 'script');
				me.callbacks.worker = null;
			}
		}
	}

	Object.assign(me, {
		open: progressBarWork,
		work: progressBarWork,
		close: function progressBarClose() {
			if (me.callbacks.worker == null) {
				if (me.callbacks.completion) {
					me.callbacks.completion();
				}
			} else if (me.callbacks.abort) {
				me.callbacks.abort();
			}
		},
		info: function progressBarInfo() {
			if (me.progress) {
				return me.progress[0] + ': ' + me.progress[1] + ' / ' + me.progress[2];
			} else {
				return '';
			}
		},
		progress0to1: function progressBarProgress0to1() {
			if (me.progress) {
				return '' + (me.progress[1] / me.progress[2]);
			} else {
				return '0';
			}
		}
	});
})();
