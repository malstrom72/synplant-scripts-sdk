if (!this.skinChooser) {
	skinChooser = {
		contents: "",
		windowPosition: "",
		windowZOrder: "",
		scroll: 0,
		scrollTarget: 0,
		skinCount: 0,
		width: 0
	}
}
Object.assign(skinChooser, {
	folder: DIRS.SKINS,
	initGUI: function initGUI(params) {
		params = parseNumbstrict(params);
		this.cols = +params.cols;
		this.rows = +params.rows;
		this.cellWidth = +params.cellWidth;
		this.cellHeight = +params.cellHeight;
		this.cellXSpace = +params.cellXSpace;
		this.cellYSpace = +params.cellYSpace;
		this.scrollSpeed = +params.scrollSpeed;
		this.pageWidth = (this.cellWidth + this.cellXSpace) * this.cols;
		this.rescan();
	},
	flipPage: {
		execute: function flipPageExecute(params) {
			var me = skinChooser;
			params = unescape(params);
			if (params === "left") {
				me.scrollTarget = Math.min(me.scrollTarget + me.pageWidth, me.cellXSpace);
			} else if (params === "right") {
				me.scrollTarget = Math.max(me.scrollTarget - me.pageWidth, me.pageWidth - me.width + me.cellXSpace);
			}
		},
		enabled: function flipPageEnabled(params) {
			var me = skinChooser;
			params = unescape(params);
			if (params === "left") {
				return (me.scrollTarget < me.cellXSpace);
			} else if (params === "right") {
				return (me.scrollTarget > me.pageWidth - me.width + me.cellXSpace);
			}
		}
	},
	animate: function scroll() {
		if (this.scroll < this.scrollTarget) {
			this.scroll += this.scrollSpeed;
			if (this.scroll >= this.scrollTarget) {
				this.scroll = this.scrollTarget;
			}
		} else if (this.scroll > this.scrollTarget) {
			this.scroll -= this.scrollSpeed;
			if (this.scroll <= this.scrollTarget) {
				this.scroll = this.scrollTarget;
			}
		}
	},
	rescan: function rescan() {
		function encode(s) { return "@<" + composeNumbstrict(s).slice(1, -1) + "@>"; }
		var skins = [];
		var slash = (PLATFORM.OS === "windows" ? '\\' : '/');
		var skinsPath = DIRS.SKINS;
		if (skinsPath[skinsPath.length - 1] !== slash) {
			skinsPath += slash;
		}
		var skinDirs = dir(skinsPath);
		for (var dirIndex = 0; dirIndex < skinDirs.length; ++dirIndex) {
			var skinDir = skinDirs[dirIndex];
			if (skinDir.isDirectory) {
				var skinPath = skinsPath + skinDir.name + slash;
				var scskinFiles = dir(skinPath, "scskin");
				for (var scskinIndex = 0; scskinIndex < scskinFiles.length; ++scskinIndex) {
					var info = parseNumbstrict(load(skinPath + scskinFiles[scskinIndex].name)).SynplantSkin;
					if (typeof info === "object") {
						info.dir = skinPath;
						info.skinName = skinDir.name;
						info.upperName = info.name.toUpperCase();
						skins.push(info);
					}
				}
			}
		}
		skins.sort(function (a, b) {
			var aIsFactory = (a.upperName === "FACTORY");
			var bIsFactory = (b.upperName === "FACTORY");
			if (aIsFactory && bIsFactory) return 0;
			if (aIsFactory && !bIsFactory) return -1;
			if (bIsFactory && !aIsFactory) return 1;
			return a.upperName.localeCompare(b.upperName);
		});
		this.contents = "";
		var perPage = (this.cols * this.rows);
		var skinCount = this.skinCount = skins.length;
		this.width = ~~((this.skinCount + perPage - 1) / perPage) * this.pageWidth;
		var currentSkinName = getCushyVariable('preferences.skinName');
		this.scroll = 0;
		for (var i = 0; i < skinCount; ++i) {
			var info = skins[i];
			var col = i % this.cols;
			var row = (~~(i / this.cols)) % this.rows;
			var page = ~~(i / perPage);
			var x = (this.cellWidth + this.cellXSpace) * (col + page * this.cols);
			var y = (this.cellHeight + this.cellYSpace) * row;
			var skinName = (info.upperName === "FACTORY" ? "" : info.skinName);
			if (this.scroll === 0 && skinName === currentSkinName) {
				this.scroll = this.cellXSpace - this.pageWidth * page;
			}
			skinChooser.contents += "@skinChooser("
				+ x + ","
				+ y + ","
				+ encode(info.name) + ","
				+ encode(info.version) + ","
				+ encode(info.by) + ","
				+ encode(info.url ? info.url : "") + ","
				+ encode(info.dir + info.thumbnail) + ","
				+ encode(skinName) + ","
				+ (info.format != 1 ? "yes" : "no") + ")\n";
		}
		if (this.scroll === 0) {
			this.scroll = this.cellXSpace;
		}
		this.scrollTarget = this.scroll;
	}
});
