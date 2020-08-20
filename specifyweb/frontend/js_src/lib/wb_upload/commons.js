"use strict";

const commons = {

	current_screens: {},

	set_screen: function (screen_name, screen) {
		this.current_screens[screen_name] = screen;
	},

	change_screen: function (screen_name, screen) {

		if (typeof this.current_screens[screen_name] !== "undefined")
			this.current_screens[screen_name].style.display = 'none';

		screen.style.display = '';

		this.set_screen(screen_name, screen);
	}

};

module.exports = commons;