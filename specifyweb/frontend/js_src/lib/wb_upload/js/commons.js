"use strict";

module.exports = {

	current_screens: {},

	hide: function (element) {
		element.style.display = 'none';
	},

	show: function (element) {
		element.style.display = '';
	},

	set_screen: function (screen_name, screen) {
		this.current_screens[screen_name] = screen;
	},

	change_screen: function (screen_name, screen) {

		if (typeof this.current_screens[screen_name] !== "undefined")
			this.hide(this.current_screens[screen_name]);

		this.show(screen);

		this.set_screen(screen_name, screen);
	}

};
