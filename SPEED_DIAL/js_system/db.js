$.ajaxSetup({
	cache : false
});
var SYNC_URL = "https://speeddial2.com";
var SORTING = false;
var SORTINGGROUPS = false;
var COLS = localStorage.getItem("options.columns");
var EXPERIMENTAL_THUMBNAIL_CACHE = false;
var GROUPS = new Array();
var GROUP = 0;
if (window.location.hash) {
	hash = window.location.hash.replace("#", "");
	if (isNumber(hash)) {
		GROUP = hash;
		if (localStorage["options.keepActiveGroup"] == 1) {
			localStorage["options.activeGroup"] = GROUP
		}
	}
}
if (localStorage["options.keepActiveGroup"] == 1 && localStorage["options.activeGroup"] >= 0) {
	GROUP = localStorage["options.activeGroup"]
}
var speeddial = {};
speeddial.storage = {};
speeddial.storage.db = null;
speeddial.storage.open = function () {
	var a = 1 * 1024 * 1024;
	speeddial.storage.db = null;
	speeddial.storage.db = openDatabase("bookmarks", "1.0", "Speeddial2", a)
};
speeddial.storage.onError = function (a, c) {
	alert("发生了一个错误：" + c.message)
};
speeddial.storage.onSuccess = function (a, c) {
	speeddial.storage.getAllItems(loadItems, GROUP)
};
speeddial.storage.is_sync = function () {
	if (localStorage["options.sync.username"] && localStorage["options.sync.password"]) {
		return true
	}
	return false
};
speeddial.storage.sync = function (g) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var f = [],
	c = [];
	var a = [],
	e = [];
	var d = speeddial.storage.sync_url();
	console.log("Sync started for " + localStorage.getItem("options.sync.username"));
	$.getJSON(d + "/sync2/get", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password")
	}, function (i) {
		if (i) {
			if (i != "" && i.settings && i.dials) {
				var h = Object.size(i.dials);
				$.each(i.dials, function (j, k) {
					c.push(parseInt(k.id))
				});
				speeddial.storage.getAllItems(function (k, l) {
					for (var m = 0; m < l.rows.length; m++) {
						f.push(l.rows.item(m).id)
					}
					var n = f.diff(c);
					var j = c.diff(f);
					$.each(i.dials, function (o, p) {
						if ($.inArray(parseInt(p.id), j) > -1) {
							console.log("create bookmark - " + p.title);
							speeddial.storage.addItem(p, function () {})
						} else {
							speeddial.storage.editItem(p, false, function () {}, false)
						}
					});
					for (var m = 0; m < l.rows.length; m++) {
						if ($.inArray(parseInt(l.rows.item(m).id), n) > -1) {
							console.log("remove bookmark - " + l.rows.item(m).title);
							speeddial.storage.deleteItem(l.rows.item(m).id, true)
						}
					}
				});
				$.each(i.groups, function (j, k) {
					e.push(parseInt(k.id))
				});
				speeddial.storage.getGroups(function (j, k) {
					for (var l = 0; l < k.rows.length; l++) {
						a.push(k.rows.item(l).id)
					}
					var n = a.diff(e);
					var m = e.diff(a);
					$.each(i.groups, function (o, p) {
						if ($.inArray(parseInt(p.id), m) > -1) {
							console.log("create group - " + p.title);
							speeddial.storage.addGroup(p, function () {})
						} else {
							speeddial.storage.editGroup(p, false, function () {})
						}
					});
					for (var l = 0; l < k.rows.length; l++) {
						if ($.inArray(parseInt(k.rows.item(l).id), n) > -1) {
							console.log("remove group - " + k.rows.item(l).title);
							speeddial.storage.deleteGroup(k.rows.item(l).id, true, true)
						}
					}
				});
				if (i.settings) {
					$.each(i.settings, function (j, k) {
						localStorage.setItem(j, k)
					})
				}
			}
			if (g) {
				g()
			}
		}
	})
};
speeddial.storage.merge_or_sync = function (f, a) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var d = speeddial.storage.sync_url();
	var c = {};
	c.settings = {};
	c.dials = {};
	c.groups = {};
	var e = {};
	e.groups = {};
	e.groups[0] = {};
	e.groups[0]["title"] = "Home";
	e.groups[0]["color"] = "FFFFFF";
	e.groups[0]["position"] = 98;
	e.groups[0]["bookmarks"] = {};
	speeddial.storage.open();
	speeddial.storage.getGroups(function (g, h) {
		for (var j = 0; j < h.rows.length; j++) {
			c.groups[j] = h.rows.item(j);
			var k = h.rows.item(j).id;
			e.groups[k] = {};
			e.groups[k]["title"] = h.rows.item(j).title;
			e.groups[k]["color"] = h.rows.item(j).color;
			e.groups[k]["position"] = 99;
			e.groups[k]["bookmarks"] = {}

		}
		speeddial.storage.getAllItems(function (l, m) {
			for (var n = 0; n < m.rows.length; n++) {
				c.dials[n] = m.rows.item(n);
				if (typeof e.groups[m.rows.item(n).idgroup] !== "undefined" && null !== e.groups[m.rows.item(n).idgroup]) {
					e.groups[m.rows.item(n).idgroup]["bookmarks"][n] = m.rows.item(n)
				}
			}
			for (var n = 0; n < window.localStorage.length; n++) {
				key = localStorage.key(n);
				if (speeddial.storage.filtersync(key)) {
					value = localStorage.getItem(localStorage.key(n));
					c.settings[key] = value
				}
			}
			$.post(d + "/sync2/backup", {
				username : localStorage.getItem("options.sync.username"),
				password : localStorage.getItem("options.sync.password"),
				merge : a ? JSON.stringify(e, null, 2) : null,
				sync : JSON.stringify(c, null, 2),
				"allow-merge" : a
			}, function (i) {
				if (i.code > 0) {
					return speeddial.storage.sync(f)
				}
				return false
			}, "json")
		})
	}, false)
};
speeddial.storage.import_settings = function (a, d) {
	if (!a) {
		return false
	}
	var c = JSON.parse(a);
	if (c) {
		if (c.settings) {
			$.each(c.settings, function (e, f) {
				localStorage.setItem(e, f)
			})
		}
		speeddial.storage.dropTableGroups(function () {
			speeddial.storage.createTable(function () {
				if (c.groups) {
					$.each(c.groups, function (e, f) {
						console.log("importing group - " + f.title);
						speeddial.storage.addGroup(f, function () {})
					})
				}
			})
		});
		speeddial.storage.dropTableBookmarks(function () {
			speeddial.storage.createTable(function () {
				if (c.dials) {
					var e = Object.size(c.dials);
					$.each(c.dials, function (f, g) {
						if (g.title && g.url) {
							console.log("importing bookmark - " + g.title);
							speeddial.storage.addItem(g, function () {})
						}
						if (f == (e - 1)) {
							speeddial.storage.optimizeThumbnailCache();
							setTimeout(function () {
								b.sync_to_server()
							}, 5000);
							if (d) {
								d()
							}
						}
					})
				}
			})
		})
	}
};
speeddial.storage.sync_to_server = function (d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var c = speeddial.storage.sync_url();
	var a = {};
	a.settings = {};
	a.dials = {};
	a.groups = {};
	speeddial.storage.open();
	speeddial.storage.getGroups(function (e, f) {
		for (var g = 0; g < f.rows.length; g++) {
			a.groups[g] = f.rows.item(g)
		}
		speeddial.storage.getAllItems(function (h, j) {
			for (var k = 0; k < window.localStorage.length; k++) {
				key = localStorage.key(k);
				if (speeddial.storage.filtersync(key)) {
					value = localStorage.getItem(localStorage.key(k));
					a.settings[key] = value
				}
			}
			for (var k = 0; k < j.rows.length; k++) {
				a.dials[k] = j.rows.item(k)
			}
			$.post(c + "/sync2/import", {
				username : localStorage.getItem("options.sync.username"),
				password : localStorage.getItem("options.sync.password"),
				sync : JSON.stringify(a, null, 2)
			}, function (i) {
				if (i.code == 1) {
					if (i.last_sync > 0) {
						localStorage.setItem("options.sync.lastsync", i.last_sync)
					}
				}
				if (d) {
					d(i)
				}
			}, "json")
		})
	})
};
speeddial.storage.sync_url = function () {
	var a = localStorage.getItem("options.sync.username");
	var c = localStorage.getItem("options.sync.password");
	return SYNC_URL
};
speeddial.storage.get_user_token = function (a, d) {
	var c = speeddial.storage.sync_url();
	$.post(c + "/pay/get_user_token", {
		user : a
	}, function (e) {
		d(e)
	}, "json")
};
speeddial.storage.test_sync_account = function (c) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	$.post(a + "/sync2/test_account", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password")
	}, function (d) {
		if (d.code == "1" && parseInt(d.user) > 0) {
			c(d)
		} else {
			c(d)
		}
	}, "json")
};
speeddial.storage.upload = function (c, d, e) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	size = (d === true) ? "large" : "small";
	$.post(a + "/sync2/upload", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		quality : localStorage.getItem("options.thumbnailQuality"),
		size : size,
		data : c
	}, function (f) {
		e(f)
	}, "json")
};
speeddial.storage.sync_settings = function () {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var e = {};
	var d = {};
	for (var c = 0; c < window.localStorage.length; c++) {
		key = localStorage.key(c);
		if (speeddial.storage.filtersync(key)) {
			value = localStorage.getItem(localStorage.key(c));
			e[key] = value
		}
	}
	d.settings = e;
	$.post(a + "/sync2/settings", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(d, null, 2)
	})
};
speeddial.storage.sync_add_group = function (e, d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = e;
	c.action = "create";
	c.group = {};
	c.group["title"] = d.title;
	c.group["color"] = d.color;
	c.group["position"] = d.position;
	$.post(a + "/sync2/group", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_edit_group = function (e, d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = e;
	c.action = "edit";
	c.group = {};
	c.group["title"] = d.title;
	c.group["color"] = d.color;
	c.group["position"] = d.position;
	$.post(a + "/sync2/group", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_remove_group = function (d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = d;
	c.action = "remove";
	$.post(a + "/sync2/group", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_order_groups = function (a) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var c = speeddial.storage.sync_url();
	var d = {};
	d.groups = a;
	d.action = "reorder";
	$.post(c + "/sync2/group", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(d, null, 2)
	})
};
speeddial.storage.sync_add_bookmark = function (e, d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = e;
	c.action = "create";
	c.bookmark = {};
	c.bookmark["title"] = d.title;
	c.bookmark["url"] = d.url;
	c.bookmark["position"] = d.position;
	c.bookmark["idgroup"] = d.idgroup;
	c.bookmark["thumbnail"] = d.thumbnail;
	c.bookmark["ts_created"] = d.ts_created;
	$.post(a + "/sync2/bookmark", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_edit_bookmark = function (e, d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = e;
	c.action = "edit";
	c.bookmark = {};
	c.bookmark["title"] = d.title;
	c.bookmark["url"] = d.url;
	c.bookmark["position"] = d.position;
	c.bookmark["idgroup"] = d.idgroup;
	c.bookmark["thumbnail"] = d.thumbnail;
	c.bookmark["ts_created"] = d.ts_created;
	c.bookmark["visits"] = d.visits;
	c.bookmark["visits_morning"] = d.visits_morning;
	c.bookmark["visits_afternoon"] = d.visits_afternoon;
	c.bookmark["visits_evening"] = d.visits_evening;
	c.bookmark["visits_night"] = d.visits_night;
	$.post(a + "/sync2/bookmark", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_remove_bookmark = function (d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.id = d;
	c.action = "remove";
	$.post(a + "/sync2/bookmark", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.sync_order_bookmarks = function (d) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var c = {};
	c.bookmarks = d;
	c.action = "reorder";
	$.post(a + "/sync2/bookmark", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(c, null, 2)
	})
};
speeddial.storage.filtersync = function (a) {
	noSyncOptions = ["options.sync.password", "options.sync.username", "options.activeGroup", "_opened_tabs", "_restore_tabs", "_closed_tabs", "usage.interval", "usage.uuid", "usage.last", "options.activeGroup", "events", "push.read", "push.last"];
	if ($.inArray(a, noSyncOptions) > -1) {
		return false
	}
	if (a.indexOf("thumbnail_") > -1) {
		return false
	}
	if (a.indexOf("temporary.") > -1) {
		return false
	}
	return true
};
speeddial.storage.sync_move_bookmark = function (e, c) {
	if (!speeddial.storage.is_sync()) {
		return false
	}
	var a = speeddial.storage.sync_url();
	var d = {};
	d.bookmark = e;
	d.group = c;
	d.action = "move";
	$.post(a + "/sync2/bookmark", {
		username : localStorage.getItem("options.sync.username"),
		password : localStorage.getItem("options.sync.password"),
		s : JSON.stringify(d, null, 2)
	})
};
speeddial.storage.uuid = function () {
	var a = function () {
		return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1)
	};
	localStorage["usage.uuid"] || (localStorage["usage.uuid"] = (a() + a() + "-" + a() + "-" + a() + "-" + a() + "-" + a() + a() + a()));
	localStorage["usage.interval"] || (localStorage["usage.interval"] = Math.floor((Math.random() * 3600 * 24 * 14) + (3600 * 24 * 14)));
	if (!localStorage["usage.last"]) {
		if (Math.random() < 0.05) {
			localStorage["usage.last"] = 1
		} else {
			localStorage["usage.last"] = Math.round(+new Date() / 1000)
		}
	}
};
speeddial.storage.analytics = function (a) {
	var c = localStorage.events;
	if (c) {
		eventsObj = JSON.parse(c);
		if (eventsObj[a]) {
			eventsObj[a] += 1
		} else {
			eventsObj[a] = 1
		}
	} else {
		eventsObj = {};
		eventsObj[a] = 1
	}
	localStorage.events = JSON.stringify(eventsObj, null, 2)
};
speeddial.storage.sync_usage = function () {
	var a = {};
	var c = speeddial.storage.sync_url();
	a.last = localStorage.getItem("usage.last");
	localStorage["usage.last"] = Math.round(+new Date() / 1000);
	speeddial.storage.db.transaction(function (d) {
		query = "SELECT * FROM bookmarks ORDER BY position ASC";
		d.executeSql(query, [], function (e, g) {
			a.c = g.rows.length;
			a.d = [];
			a.o = {};
			a.e = localStorage.events ? JSON.parse(localStorage.events) : null;
			a.uuid = localStorage.getItem("usage.uuid");
			for (var j = 0; j < g.rows.length; j++) {
				var h = g.rows.item(j).url;
				if (typeof h != "undefined" && h.indexOf("chrome-extension") < 0 && h.indexOf("http") > -1) {
					if ($.inArray(h.split(/\/+/g)[1], a.d) == -1) {
						a.d.push(h.split(/\/+/g)[1])
					}
				}
			}
			var f = ["options.alwaysNewTab", "options.apps.align", "options.apps.iconsize", "options.apps.position", "options.apps.show", "options.apps.theme", "options.centerVertically", "options.columns", "options.dialSpace", "options.dialspacing", "options.dialstyle.corners", "options.dialstyle.titleAlign", "options.dialstyle.titleposition", "options.highlight", "options.order", "options.padding", "options.refreshThumbnails", "options.scrollLayout", "options.showAddButton", "options.showContextMenu", "options.showOptionsButton", "options.showTitle", "options.showVisits", "options.sidebar", "options.sidebar.showApps", "options.sidebar.showBookmarks", "options.sidebar.showBookmarksURL", "options.sidebar.showDelicious", "options.sidebar.showGooglebookmarks", "options.sidebar.showHistory", "options.sidebar.showPinboard", "options.sidebaractivation", "options.thumbnailQuality", "options.titleAlign", "options.useDeliciousShortcut", "options.usePinboardShortcut"];
			for (var j = 0; j < f.length; j++) {
				a.o[f[j]] = localStorage[f[j]]
			}
			$.post(c + "/sync2/usage", {
				sync : JSON.stringify(a, null, 2)
			}, function (i) {
				if (i.code == 1) {
					localStorage.events = []
				}
			}, "json")
		}, speeddial.storage.onError)
	})
};
speeddial.storage.createTable = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("CREATE TABLE IF NOT EXISTS bookmarks(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT, url TEXT, thumbnail TEXT NULL, ts_created INTEGER, visits INTEGER, visits_morning INTEGER, visits_afternoon INTEGER, visits_evening INTEGER, visits_night INTEGER, position INTEGER, idgroup INTEGER DEFAULT 0)", [], null, speeddial.storage.onError)
	});
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("CREATE TABLE IF NOT EXISTS groups(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT, color TEXT, position INTEGER DEFAULT 0)", [], null, speeddial.storage.onError)
	});
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("CREATE TABLE IF NOT EXISTS thumbnails(url TEXT NOT NULL, thumbnail TEXT)", [], a, speeddial.storage.onError)
	})
};
speeddial.storage.dropTableBookmarks = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("DROP TABLE bookmarks", [], a, speeddial.storage.onError)
	})
};
speeddial.storage.getAllItems = function (c, a) {
	if (parseInt(a) > -1) {
		speeddial.storage.db.transaction(function (d) {
			d.executeSql("SELECT * FROM groups WHERE id = ?", [a], function (f, e) {
				var g = "SELECT * FROM bookmarks WHERE idgroup = ? ORDER BY visits DESC";
				if (localStorage.getItem("options.order") == "position") {
					g = "SELECT * FROM bookmarks WHERE idgroup = ? ORDER BY position ASC, ts_created ASC"
				}
				if (e.rows.length > 0) {
					speeddial.storage.db.transaction(function (h) {
						h.executeSql(g, [a], c, speeddial.storage.onError)
					})
				} else {
					speeddial.storage.db.transaction(function (h) {
						h.executeSql(g, [0], c, speeddial.storage.onError)
					})
				}
			}, speeddial.storage.onError)
		})
	} else {
		speeddial.storage.db.transaction(function (d) {
			query = "SELECT * FROM bookmarks ORDER BY position ASC";
			d.executeSql(query, [], c, speeddial.storage.onError)
		})
	}
};
speeddial.storage.countBookmarksAndGroups = function (d) {
	var c,
	a;
	speeddial.storage.db.transaction(function (e) {
		e.executeSql("SELECT COUNT(*) as count FROM bookmarks", [], function (g, f) {
			c = f.rows.item(0).count;
			speeddial.storage.db.transaction(function (h) {
				h.executeSql("SELECT COUNT(*) as count FROM groups", [], function (j, i) {
					a = i.rows.item(0).count;
					return d(c, a)
				})
			})
		})
	})
};
speeddial.storage.getItem = function (c, a) {
	speeddial.storage.db.transaction(function (d) {
		d.executeSql("SELECT * FROM bookmarks WHERE id = ?", [c], a, speeddial.storage.onError)
	})
};
speeddial.storage.addItem = function (a, c) {
	if (!c) {
		c = speeddial.storage.onSuccess
	}
	if (!a.thumbnail) {
		a.thumbnail = ""
	}
	if (!a.ts_created) {
		a.ts_created = Math.round(new Date().getTime() / 1000)
	}
	if (!a.position) {
		a.position = 999
	}
	if (!a.visits) {
		a.visits = 0
	}
	if (!a.visits_afternoon) {
		a.visits_afternoon = 0
	}
	if (!a.visits_evening) {
		a.visits_evening = 0
	}
	if (!a.visits_morning) {
		a.visits_morning = 0
	}
	if (!a.visits_night) {
		a.visits_night = 0
	}
	if (typeof a.idgroup == "undefined") {
		a.idgroup = 0
	}
	if (a.id > 0) {
		speeddial.storage.db.transaction(function (d) {
			d.executeSql("INSERT INTO bookmarks (id, title, url, thumbnail, ts_created, visits, visits_morning, visits_afternoon, visits_evening, visits_night, position, idgroup) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [a.id, a.title, a.url, a.thumbnail, a.ts_created, a.visits, a.visits_morning, a.visits_afternoon, a.visits_evening, a.visits_night, a.position, a.idgroup], c, speeddial.storage.onError)
		})
	} else {
		speeddial.storage.db.transaction(function (d) {
			d.executeSql("INSERT INTO bookmarks (title, url, thumbnail, ts_created, visits, visits_morning, visits_afternoon, visits_evening, visits_night, position, idgroup) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [a.title, a.url, a.thumbnail, a.ts_created, a.visits, a.visits_morning, a.visits_afternoon, a.visits_evening, a.visits_night, a.position, a.idgroup], function (e, f) {
				var g = f.insertId;
				b.sync_add_bookmark(g, a);
				c()
			}, speeddial.storage.onError)
		})
	}
};
speeddial.storage.editItem = function (c, a, e, d) {
	if (!e) {
		e = speeddial.storage.onSuccess
	}
	if (!c) {
		return false
	}
	if (a == true) {
		clearData = ",visits=0"
	} else {
		clearData = ""
	}
	if (parseInt(c.position) > 0) {
		speeddial.storage.db.transaction(function (f) {
			f.executeSql("UPDATE bookmarks SET title=?, url=?, thumbnail =?, position=?, idgroup =? " + clearData + " WHERE id=?", [c.title, c.url, c.thumbnail, parseInt(c.position), c.idgroup, c.id], function (g, h) {
				if (d !== false) {
					b.sync_edit_bookmark(c.id, c)
				}
				e(g, h)
			}, speeddial.storage.onError)
		})
	} else {
		speeddial.storage.db.transaction(function (f) {
			f.executeSql("UPDATE bookmarks SET title=?, url=?, thumbnail =?, idgroup =? " + clearData + " WHERE id=?", [c.title, c.url, c.thumbnail, c.idgroup, c.id], function (g, h) {
				if (d !== false) {
					b.sync_edit_bookmark(c.id, c)
				}
				e(g, h)
			}, speeddial.storage.onError)
		})
	}
};
speeddial.storage.deleteItem = function (c, a) {
	speeddial.storage.db.transaction(function (d) {
		d.executeSql("DELETE FROM bookmarks WHERE ID=?", [c], function () {
			if (a != true) {
				b.sync_remove_bookmark(c)
			}
		}, speeddial.storage.onError)
	})
};
speeddial.storage.updateItemOrder = function (c, a) {
	speeddial.storage.db.transaction(function (d) {
		d.executeSql("UPDATE bookmarks SET position=? WHERE ID=?", [a, c], null, speeddial.storage.onError)
	})
};
speeddial.storage.dropTableGroups = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("DROP TABLE groups", [], a, speeddial.storage.onError)
	})
};
speeddial.storage.getGroups = function (a) {
	speeddial.storage.db.transaction(function (c) {
		GROUPS = [];
		GROUPS.length = 0;
		var d = "SELECT * FROM groups ORDER BY position ASC, title ASC";
		c.executeSql(d, [], a, speeddial.storage.onError)
	})
};
speeddial.storage.getGroup = function (c, a) {
	speeddial.storage.db.transaction(function (d) {
		d.executeSql("SELECT * FROM groups WHERE id = ?", [c], a, speeddial.storage.onError)
	})
};
speeddial.storage.addGroup = function (a, c) {
	if (!c) {
		c = speeddial.storage.onSuccess
	}
	if (a.id) {
		speeddial.storage.db.transaction(function (d) {
			d.executeSql("INSERT INTO groups (id, title, color, position) values (?, ?, ?, ?)", [a.id, a.title, a.color, a.position], c, speeddial.storage.onError)
		})
	} else {
		speeddial.storage.db.transaction(function (d) {
			d.executeSql("INSERT INTO groups (title, color, position) values (?, ?, ?)", [a.title, a.color, 99], function (e, f) {
				var g = f.insertId;
				b.sync_add_group(g, a);
				c(e, f)
			}, speeddial.storage.onError)
		})
	}
};
speeddial.storage.editGroup = function (c, a, d) {
	if (!c) {
		return false
	}
	if (!d) {
		d = reload
	}
	if (c.position > 0) {
		speeddial.storage.db.transaction(function (e) {
			e.executeSql("UPDATE groups SET title=?, color =?, position =? WHERE id=?", [c.title, c.color, c.position, c.id], function (f, g) {
				if (a == true) {
					b.sync_edit_group(c.id, c)
				}
				d(f, g)
			}, speeddial.storage.onError)
		})
	} else {
		speeddial.storage.db.transaction(function (e) {
			e.executeSql("UPDATE groups SET title=?, color =? WHERE id=?", [c.title, c.color, c.id], function (f, g) {
				if (a == true) {
					b.sync_edit_group(c.id, c)
				}
				d(f, g)
			}, speeddial.storage.onError)
		})
	}
};
speeddial.storage.setGroupPosition = function (c, a) {
	if (!c || !a) {
		return false
	}
	speeddial.storage.db.transaction(function (d) {
		d.executeSql("UPDATE groups SET position=? WHERE id=?", [a, c], null, speeddial.storage.onError)
	})
};
speeddial.storage.moveToGroup = function (a, c, d) {
	if (parseInt(a) > 0 && parseInt(c) >= 0) {
		speeddial.storage.db.transaction(function (e) {
			e.executeSql("UPDATE bookmarks SET idgroup=?,position=? WHERE id =?", [c, 999, a], function (f, g) {
				b.sync_move_bookmark(a, c);
				d(f, g)
			}, speeddial.storage.onError)
		})
	}
};
speeddial.storage.deleteGroup = function (d, c, a) {
	if (parseInt(d) > 0) {
		speeddial.storage.db.transaction(function (e) {
			e.executeSql("DELETE FROM groups WHERE ID=?", [d], function () {
				query = "SELECT * FROM bookmarks WHERE idgroup = ? ORDER BY position ASC";
				e.executeSql(query, [d], function (f, g) {
					for (var h = 0; h < g.rows.length; h++) {
						row = g.rows.item(h);
						speeddial.storage.removeThumbnail(row.url);
						speeddial.storage.db.transaction(function (i) {
							i.executeSql("DELETE FROM bookmarks WHERE id =?", [row.id], null, null)
						})
					}
					if (c !== true) {
						reload()
					}
				}, speeddial.storage.onError)
			}, speeddial.storage.onError)
		});
		if (a != true) {
			b.sync_remove_group(d)
		}
	}
};
speeddial.storage.insertThumbnail = function (a, d, c) {
	console.log("Inserting thumbnail - " + a);
	speeddial.storage.db.transaction(function (e) {
		e.executeSql("DELETE FROM thumbnails WHERE url = ?", [a], function () {
			e.executeSql("INSERT INTO thumbnails (url, thumbnail) values (?, ?)", [a, d], function () {
				speeddial.storage.removeCacheThumbnail(a)
			}, speeddial.storage.onError)
		}, speeddial.storage.onError)
	})
};
speeddial.storage.removeThumbnail = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("DELETE FROM thumbnails WHERE url = ?", [a], null, speeddial.storage.onError)
	})
};
speeddial.storage.getThumbnail = function (a, c, d) {
	if (EXPERIMENTAL_THUMBNAIL_CACHE === true && localStorage["thumbnail_" + encodeURIComponent(a)]) {
		c.style.backgroundImage = "url(" + localStorage["thumbnail_" + encodeURIComponent(a)] + ")";
		d.setAttribute("class", "link");
		return
	}
	speeddial.storage.db.transaction(function (e) {
		e.executeSql("SELECT * FROM thumbnails WHERE url = ? LIMIT 1", [a], function (f, g) {
			if (g.rows.length > 0) {
				c.style.backgroundImage = "url(" + g.rows.item(0).thumbnail + ")";
				if (EXPERIMENTAL_THUMBNAIL_CACHE === true && GROUP == 0) {
					localStorage["thumbnail_" + encodeURIComponent(a)] = g.rows.item(0).thumbnail
				}
				d.setAttribute("class", "link")
			} else {
				d.setAttribute("class", "link no-thumbnail")
			}
		}, speeddial.storage.onError)
	})
};
speeddial.storage.ThumbnailRemoveIfDoesntExists = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql("SELECT * FROM bookmarks WHERE url = ?", [a], function (d, e) {
			if (e.rows.length <= 0) {
				d.executeSql("DELETE FROM thumbnails WHERE url = ?", [a], null, speeddial.storage.onError);
				console.log("Removed url - " + a)
			}
		}, speeddial.storage.onError)
	})
};
speeddial.storage.optimizeThumbnailCache = function () {
	speeddial.storage.db.transaction(function (a) {
		a.executeSql("SELECT * FROM thumbnails", [], function (c, d) {
			console.log("optimizeThumbnailCache - Selected all bookmarks");
			for (var e = 0; e < d.rows.length; e++) {
				console.log("optimizeThumbnailCache - check " + d.rows.item(e).url);
				speeddial.storage.ThumbnailRemoveIfDoesntExists(d.rows.item(e).url)
			}
		}, speeddial.storage.onError)
	})
};
speeddial.storage.removeCacheThumbnail = function (a) {
	return true
};
speeddial.storage.alterTable = function (a) {
	speeddial.storage.db.transaction(function (c) {
		c.executeSql(a, [], null, speeddial.storage.onError)
	})
};
speeddial.storage.hightlightExperimental = function () {
	if (localStorage["options.highlight"] == 1) {
		var a = "";
		var c = new Date().getHours();
		if (c >= 0) {
			a = "night"
		}
		if (c >= 6) {
			a = "morning"
		}
		if (c >= 12) {
			a = "afternoon"
		}
		if (c >= 18) {
			a = "evening"
		}
		var d = "SELECT id FROM bookmarks WHERE idgroup=" + GROUP + " ORDER BY visits_" + a + " DESC LIMIT 3";
		speeddial.storage.db.transaction(function (e) {
			e.executeSql(d, [], function (f, g) {
				for (var h = 0; h < g.rows.length; h++) {
					$("#pages li#" + g.rows.item(h).id).find(".thumbnail_container").prepend('<img src="images/newtab.highlighted.png" class="highlight_corner" />')
				}
				PADDING = parseInt(localStorage["options.padding"]);
				$(".highlight_corner").css({
					top : -PADDING,
					right : -PADDING
				})
			}, null, speeddial.storage.onError)
		})
	}
};
speeddial.storage.trackVisits = function (d) {
	var a = "";
	var c = new Date().getHours();
	if (c >= 0) {
		a = "night"
	}
	if (c >= 6) {
		a = "morning"
	}
	if (c >= 12) {
		a = "afternoon"
	}
	if (c >= 18) {
		a = "evening"
	}
	speeddial.storage.db.transaction(function (e) {
		e.executeSql("UPDATE bookmarks SET visits=visits+1, visits_" + a + "=visits_" + a + "+1 WHERE url=?", [d], null, speeddial.storage.onError)
	})
};
speeddial.storage.showGroups = function (d, e) {
	for (var f = 0; f < e.rows.length; f++) {
		GROUPS.push(e.rows.item(f))
	}
	var c = document.getElementById("url-dialog-groups");
	c.value = GROUP;
	var h = document.getElementById("groups");
	if (h) {
		h.innerHTML = ""
	}
	if (GROUPS.length == 0) {
		return false
	}
	var a = document.createElement("li");
	var g = document.createElement("a");
	g.setAttribute("class", GROUP == 0 ? "group selected" : "group");
	g.setAttribute("href", "#0");
	g.style.backgroundColor = "#" + localStorage["options.defaultGroupColor"];
	g.innerHTML = localStorage["options.defaultGroupName"];
	a.setAttribute("class", "home");
	a.setAttribute("loadgroup", 0);
	a.appendChild(g);
	h.appendChild(a);
	for (var f = 0; f < GROUPS.length; f++) {
		var a = document.createElement("li");
		var g = document.createElement("a");
		g.setAttribute("class", GROUPS[f].id == GROUP ? "group selected" : "group");
		g.setAttribute("href", "#" + GROUPS[f].id);
		g.style.backgroundColor = "#" + GROUPS[f].color;
		g.innerHTML = GROUPS[f].title;
		a.setAttribute("color", GROUPS[f].color);
		a.setAttribute("loadgroup", GROUPS[f].id);
		a.appendChild(g);
		h.appendChild(a)
	}
};
function loadItems(A, g) {
	COLS = localStorage.getItem("options.columns");
	var e,
	B;
	var m = document.getElementById("pages");
	m.innerHTML = "";
	var l = document.getElementById("groups");
	var t = 130;
	var c = 90;
	if (GROUPS.length > 0) {
		c = 30 + parseInt($("#groups").css("height"))
	} else {
		c = 15
	}
	var C = [];
	C.large = 124;
	C.medium = 102;
	C.small = 86;
	C.extrasmall = 66;
	var r = 24,
	w = Math.ceil(g.rows.length / COLS);
	SPACING = parseInt(localStorage["options.dialspacing"]);
	NUMBER_OF_GROUPS = GROUPS.length;
	PADDING = parseInt(localStorage["options.padding"]);
	WIDTHMODIFIER = (parseInt(getValue("options.dialSpace")) > 0) ? (getValue("options.dialSpace") / 100) : 0.9;
	WINDOW_WIDTH = window.screen.width;
	WINDOW_HEIGHT = window.screen.height;
	WINDOW_INNER_WIDTH = window.innerWidth;
	SPACE = window.innerHeight;
	RATIO = ((WINDOW_HEIGHT - t) / WINDOW_WIDTH);
	RATIO_MODIFIED = false;
	CUSTOM_RATIO = parseFloat(localStorage["options.thumbnailRatio"]) > 0 && localStorage["options.thumbnailRatio"] != 1 ? true : false;
	var q = 15;
	if (NUMBER_OF_GROUPS == 0 && localStorage["options.centerVertically"] == "1") {
		q = 0
	}
	if (RATIO < 0.55) {
		RATIO = 0.55;
		RATIO_MODIFIED = true
	}
	if (RATIO > 0.65) {
		RATIO = 0.65
	}
	if (CUSTOM_RATIO) {
		RATIO = RATIO * localStorage["options.thumbnailRatio"]
	}
	if (localStorage["options.apps.show"] == "1") {
		SPACE -= C[localStorage["options.apps.iconsize"]];
		if (localStorage["options.apps.position"] == "top") {
			if (NUMBER_OF_GROUPS > 0) {
				$("#groups").css("top", C[localStorage["options.apps.iconsize"]])
			}
			m.style.top = 15 + C[localStorage["options.apps.iconsize"]];
			q += C[localStorage["options.apps.iconsize"]]
		}
	}
	if (localStorage["options.scrollLayout"] == 1) {
		$("#container").addClass("scroll")
	} else {
		$("#container").removeClass("scroll")
	}
	if (NUMBER_OF_GROUPS > 0) {
		SPACE -= c
	}
	var a = WIDTHMODIFIER * WINDOW_INNER_WIDTH;
	var y = (a - ((COLS) * SPACING)) / COLS;
	y = Math.floor(y);
	if (y > 360) {
		y = 360
	}
	var s = (y * RATIO);
	if (localStorage["options.showTitle"] != 1) {
		r = PADDING + 2
	}
	var h = false;
	if (localStorage["options.scrollLayout"] != "1" && (w * (s + SPACING + PADDING + r)) > SPACE) {
		h = true;
		s = (SPACE - (w * (SPACING + PADDING + r))) / w;
		y = s / RATIO
	}
	if (localStorage["options.centerVertically"] == "1" && h == false) {
		if (NUMBER_OF_GROUPS == 0) {
			q -= 15
		} else {}

	}
	m.style.width = COLS * (y + SPACING) + "px";
	var z = ((y - (2 * PADDING)) * RATIO) + PADDING;
	if (NUMBER_OF_GROUPS > 0) {
		var k = (WIDTHMODIFIER * window.innerWidth);
		l.style.paddingLeft = SPACING / 2 + (window.innerWidth - k) / 2;
		l.style.paddingRight = SPACING / 2 + (window.innerWidth - k) / 2;
		l.style.display = "block"
	}
	for (var v = 0; v < g.rows.length; v++) {
		e = g.rows.item(v);
		var n = document.createElement("li");
		var f = document.createElement("a");
		var x = document.createElement("div");
		var j = document.createElement("div");
		var d = document.createElement("div");
		n.setAttribute("class", "link");
		n.setAttribute("id", e.id);
		n.setAttribute("url", e.url);
		n.setAttribute("position", B);
		n.setAttribute("visits", e.visits);
		f.setAttribute("href", e.url);
		f.style.width = y + "px";
		j.style.marginLeft = SPACING / 2 + "px";
		j.style.display = "block";
		j.style.margin = "0 auto";
		j.setAttribute("class", "title");
		j.innerHTML = safestr(e.title);
		if (e.thumbnail == "") {
			speeddial.storage.getThumbnail(e.url, x, n)
		}
		if (e.thumbnail != "") {
			n.setAttribute("custom_thumbnail", "true");
			if (localStorage["options.centerThumbnailsVertically"] == "2") {
				x.style.backgroundSize = "100%";
				x.style.backgroundPosition = "center center"
			} else {
				if (localStorage["options.centerThumbnailsVertically"] == "1") {
					x.style.backgroundSize = "contain";
					x.style.backgroundPosition = "center center"
				} else {
					if (localStorage["options.centerThumbnailsVertically"] == "0") {
						x.style.backgroundSize = "100%";
						x.style.backgroundPosition = "top center"
					} else {
						x.style.backgroundSize = "auto";
						x.style.backgroundPosition = "top center"
					}
				}
			}
			if (e.thumbnail.indexOf(" ") > -1) {
				x.style.backgroundImage = "url(" + encodeURI(e.thumbnail) + ")"
			} else {
				x.style.backgroundImage = "url(" + e.thumbnail + ")"
			}
		} else {
			if (RATIO_MODIFIED == true) {
				x.style.backgroundSize = "102% 100%"
			} else {
				x.style.backgroundSize = "102%"
			}
			if (CUSTOM_RATIO) {
				x.style.backgroundSize = "cover";
				x.style.backgroundPosition = "top center"
			}
		}
		x.setAttribute("class", "thumbnail_container");
		x.style.height = z;
		f.appendChild(x);
		f.style.height = z + PADDING + r;
		f.style.padding = PADDING + "px";
		f.style.margin = SPACING / 2;
		n.style.height = z + PADDING + r + SPACING;
		n.style.overflow = "hidden";
		if (localStorage["options.dialstyle.titleposition"] != "bottom") {
			if (localStorage["options.showTitle"] == 1) {
				j.style.width = y - 2 * PADDING;
				n.appendChild(j)
			}
			f.appendChild(x);
			f.style.marginTop = 0;
			f.style.height = z + PADDING + PADDING + 2
		} else {
			f.appendChild(x);
			if (localStorage["options.showTitle"] == 1) {
				f.appendChild(j)
			}
			f.style.paddingBottom = 0;
			x.style.height = z
		}
		if (localStorage["options.showVisits"] == 1) {
			var o = document.createElement("span");
			o.setAttribute("class", "visits");
			o.innerHTML = e.visits;
			j.appendChild(o)
		}
		d.style.width = y;
		d.style.bottom = SPACING / 2 - 10;
		d.style.left = "50%";
		d.style.marginLeft = -y / 2;
		d.setAttribute("class", "shadow");
		if (localStorage["options.dialstyle.titleposition"] != "bottom") {
			d.style.bottom = "auto";
			if (localStorage["options.showTitle"] == 1) {
				d.style.top = 24 - parseInt(localStorage["options.fontsize"]) + parseInt(localStorage["options.fontsize"]) + s + 2 * PADDING
			} else {
				d.style.top = 2 + s + 2 * PADDING
			}
		}
		n.appendChild(f);
		n.appendChild(d);
		m.appendChild(n)
	}
	if (localStorage["options.centerVertically"] == "1" && h == false) {
		var u = (w * (z + 2 * PADDING + 2 * SPACING));
		var p = (SPACE - u) / 2;
		if (p >= 0) {
			m.style.paddingTop = q - c / 2 + ((SPACE - u) / 2)
		} else {
			m.style.paddingTop = 15
		}
	} else {
		if (NUMBER_OF_GROUPS == 0 && h == false) {
			m.style.paddingTop = 2 * q
		} else {
			m.style.paddingTop = q
		}
	}
	if (getValue("options.showAddButton") == 1) {
		B = g.rows.length + 1;
		emptyrow = document.createElement("li");
		emptyrow.setAttribute("id", "emptyrow");
		emptyrow.setAttribute("rel", "tooltip");
		emptyrow.setAttribute("title", "添加拨号");
		emptyrow.setAttribute("data-placement", "bottom");
		emptyrow.innerHTML = '<img src="images/newtab.plus.png" />';
		emptyrow.style.width = SPACING + y + "px";
		emptyrow.style.height = SPACING + PADDING + s + "px";
		emptyrow.addEventListener("click", function () {
			switchDialog("add")
		});
		m.appendChild(emptyrow)
	}
	if (g.rows.length == 0) {
		if (getValue("options.showAddButton") == 1) {
			if (emptyrow) {
				emptyrow.style.display = "none"
			}
		}
		firstdial = document.createElement("div");
		firstdial.setAttribute("src", "images/newtab.first-dial.png");
		firstdial.setAttribute("class", "first-dial emptyrow");
		firstdial.innerHTML = "从这里开始";
		firstdial.addEventListener("click", function () {
			switchDialog("add")
		});
		document.body.appendChild(firstdial)
	} else {
		if ($(".first-dial")) {
			$(".first-dial").remove()
		}
	}
	if (NUMBER_OF_GROUPS > 0) {}
	else {
		$("#groups").hide()
	}
	if (localStorage["options.apps.show"] == "1" && localStorage["options.apps.position"] == "bottom") {
		m.style.marginBottom = 100
	}
	localStorage.setItem("sys.dialwidth", y);
	localStorage.setItem("sys.dialheight", z + PADDING + r);
	localStorage.setItem("sys.cellspacing", SPACING);
	localStorage.setItem("sys.rowspacing", SPACING);
	localStorage.setItem("sys.rows", w);
	localStorage.setItem("sys.cols", COLS);
	localStorage.setItem("sys.groups", NUMBER_OF_GROUPS);
	localStorage.setItem("sys.containerwidth", COLS * (y) + ((COLS - 1) * SPACING) + "px");
	if (NUMBER_OF_GROUPS > 0) {
		_pos = (0.2 + (1 - WIDTHMODIFIER) * 100 / 2)
	} else {
		_pos = (-2 + (1 - WIDTHMODIFIER) * 100 / 2)
	}
	if (_pos < 3) {
		_pos = 3
	}
	if (getValue("options.showOptionsButton") == 1) {
		$("#quick-settings-icon").css("right", _pos + "%").fadeIn()
	}
	if (getValue("options.sidebar") == 1) {
		$(".sidebar-arrow").show()
	}
	pagesOnLoad();
	speeddial.storage.hightlightExperimental()
}
function init() {
	speeddial.storage.open();
	speeddial.storage.createTable();
	speeddial.storage.uuid();
	speeddial.storage.getGroups(speeddial.storage.showGroups);
	speeddial.storage.getAllItems(loadItems, GROUP)
}
function reload() {
	speeddial.storage.getGroups(speeddial.storage.showGroups);
	speeddial.storage.getAllItems(loadItems, GROUP)
}
function background_init() {
	speeddial.storage.open();
	speeddial.storage.createTable()
};
