let current_screen = undefined

function hide(element) {
	element.style.display = 'none';
}

function show(element) {
	element.style.display = '';
}

function set_screen(screen) {
	current_screen = screen
}

function change_screen(screen) {

	if (typeof current_screen !== "undefined")
		hide(current_screen)

	show(screen)

	set_screen(screen)
}