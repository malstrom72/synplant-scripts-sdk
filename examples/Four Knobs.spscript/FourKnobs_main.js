//  MyClass = createClass({
//      constructor: function(x) { this.field = x },
//      getField: function() { return this.field }
//  })

(function() {

	// Setup

	function randomVector() {
		var v = [ ];
		for (var i = 0; i < GENES.length - 5; ++i) {
			v[i] = random.normal(0.0, 1.0);
		}
		return v;
	}

	if (!this.fourKnobs) {
		fourKnobs = {
			windowPosition: "",
			windowZOrder: "",
			magnitudes: [ 0.0, 0.0, 0.0, 0.0 ],
			vectors: [ randomVector(), randomVector(), randomVector(), randomVector() ],
			seedGenome: null,
			currentGenome: null,
			lastPatchId: 0,
		}
	}

	var me = this.fourKnobs;

	MyKnob = createClass({
		constructor: function(number) { this.index = number; },
		get: function() { return me.magnitudes[this.index]; },
		set: function(value) { me.changeMagnitude(this.index, value); }
	})

	function getMagnitudeOfGene(name) {
		switch (name) {
			case 'a_mod':
			case 'b_mod': return 0.02886751346;
			case 'a_freq': return 0.0;
			case 'b_freq': return 0.002886751346;
			default: return 0.2886751346;
		}
	}

	// Public interface
	Object.assign(me, {
		initGUI: function initGUI(params) {
		},
		loadGenome: function() {
			var p = getElement('patch');
			if (p.id !== me.lastPatchId) {
				me.lastPatchId = p.id;
				me.seedGenome = p.genome;
				me.currentGenome = deepClone(me.seedGenome);
				for (var i = 0; i < 4; ++i) {
					me.magnitudes[i] = 0.0;
				}
			}
		},
		newVector: function newVector(params) {
			var index = +params;
			for (var gene = 0; gene < GENES.length - 5; ++gene) {
				var n = GENES[gene].NAME;
				var m = getMagnitudeOfGene(n);
				var d = me.currentGenome[n];
				for (var i = 0; i < 4; ++i) {
					if (i !== index) {
						d -= me.magnitudes[i] * me.vectors[i][gene] * m;
					}
				}
				me.seedGenome[n] = d
			}
			me.vectors[index] = randomVector();
			me.magnitudes[index] = 0.0;
			me.updateGenome();
		},
		changeMagnitude: function changeMagnitude(index, value) {
			me.magnitudes[index] = value;
			me.updateGenome();
		},
		updateGenome: function() {
			for (var gene = 0; gene < GENES.length - 5; ++gene) {
				var n = GENES[gene].NAME;
				var m = getMagnitudeOfGene(n);
				var s = me.seedGenome[n];
				for (var i = 0; i < 4; ++i) {
					s += me.magnitudes[i] * me.vectors[i][gene] * m;
				}
				me.currentGenome[n] = bounce(s, 0.0, 1.0);
			}
			var p = getElement('patch');
			p.genome = me.currentGenome;
			me.lastPatchId = setElement('patch', p);
		},
		knobs: [ new MyKnob(0), new MyKnob(1), new MyKnob(2), new MyKnob(3) ]
	});
})();
