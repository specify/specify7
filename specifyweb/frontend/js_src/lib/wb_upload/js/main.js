"use strict";
require('../css/config.css');
require("../css/main.css");
require("../css/upload_config.css");
require("../css/mappings.css");

const commons = require('./commons.js');
const mappings = require('./mappings.js');
const upload_config = require('./upload_config.js');


const initialContext = require('../../initialcontext.js');
const schema = require('../../schema.js');
const domain = require('../../domain.js');

initialContext.lock().promise().done(() => {

    // Here is how to access the Sp datamodel.
    // You want to use this instead of
    // /context/datamodel.json because
    // then it won't load the datamodel twice
    // and it will include the schema config info.

    console.log("List of all tables:");
    for(let modelName in schema.models) {
        console.log(modelName, schema.models[modelName]);
    };


    // Here is how to load a tree def. There is a promise pipeline because it is
    // loading a few different resources and collections dynamically.

    domain.getTreeDef("taxon").pipe(treedef => treedef.rget('treedefitems')).pipe(
        treeDefItems => treeDefItems.fetch({limit:0}).pipe(() => treeDefItems)
    ).done(treeDefItems => {
        console.log("List of all Taxon tree ranks (treedefitems):");
        treeDefItems.each(item => {
            console.log(item.get('name'), item);
        });
    });


	//initialization
	const screen__loading = document.getElementById('screen__loading');


	const screen__file_upload = document.getElementById('screen__file_upload');
	const button__create_file = document.getElementById('button__create_file');
	const input__file = document.getElementById('input__file');


	const screen__upload_config = document.getElementById('screen__upload_config');
	const button__upload_config_cancel = document.getElementById('button__upload_config_cancel');
	const button__upload_config_continue = document.getElementById('button__upload_config_continue');
	upload_config.constructor();

	const screen__mapping = document.getElementById('screen__mapping');
	const button__mappings__continue = document.getElementById('button__mappings__continue');
	const button__mappings_cancel = document.getElementById('button__mappings_cancel');
	mappings.constructor();


	commons.set_screen('main',screen__loading);
	commons.change_screen('main',screen__file_upload);



	//screen__file_upload
	button__create_file.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
	});


	//screen__upload_config
	function file_change_handler() {

		const reader = new FileReader();
		const file = input__file.files[0];

		if (typeof file === "undefined")
			return true;

		reader.readAsText(file);
		reader.onerror = function (event) {
			if (event.target.error.name === "NotReadableError")
				alert("There were problems reading that file");
		};
		reader.onload = function (event) {
			const csv = event.target.result;

			commons.change_screen('main',screen__upload_config);
			upload_config.update_table(csv);

		};

	}

	input__file.addEventListener('change', file_change_handler);
	file_change_handler();


	button__upload_config_cancel.addEventListener('click', function () {
		commons.change_screen('main',screen__file_upload);
		input__file.value = [];
	});

	button__upload_config_continue.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
		mappings.set_headers(upload_config.headers);
	});

	button__mappings_cancel.addEventListener('click', function () {
		commons.change_screen('main',screen__file_upload);
		mappings.reset_table();
		input__file.value = [];
	});

	button__mappings__continue.addEventListener('click', function () {
		//commons.change_screen('main',screen__mapping);
		//mappings.set_headers(upload_config.headers);
	});

});
