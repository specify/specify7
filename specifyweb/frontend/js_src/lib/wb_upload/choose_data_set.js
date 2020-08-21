"use strict";

const user_info    = require('../userinfo.js');
const schema = require('../schema.js');
const Q = require('q');
const _ = require('underscore');

let data_sets = [];
let headers = [];

const choose_data_set = {

	constructor: (loaded_callback,selected_callback,file_change_callback) => {

		const wbs = new schema.models['Workbench']['LazyCollection']({
			filters: {specifyuser: user_info['id'], orderby: 'name'}
		});

		wbs.fetch({limit: 5000})
			.done(() => {

				let list_html = '';
				Object.values(wbs.models).forEach((data_set) => {

					const data_set_id = data_set.get('id');
					const data_set_name = data_set.get('name');

					list_html += '<a href="#'+data_set_name+'" data-set_id="'+data_set_id+'">'+data_set_name+'</a>';

				});

				list_of_data_sets.innerHTML = list_html;

				if(!choose_data_set.file_selected())
					loaded_callback();

			});

		const list_of_data_sets = document.getElementById('list_of_data_sets');

		//go to the mappings screen
		list_of_data_sets.addEventListener('click', function (event) {

			event.preventDefault();

			const data_set_id = event.target['getAttribute']('data-set_id');
			const wb = wbs.models[data_set_id];

			const mappings_promise = Q(wb.rget('workbenchtemplate.workbenchtemplatemappingitems'))
						  .then(mappings => _['sortBy'](mappings.models, mapping => mapping.get('viewOrder')));

			mappings_promise.then(mappings => _.invoke(mappings, 'get', 'caption')).done((headers) => {
				selected_callback(headers);
			});

		});

		choose_data_set.input__file = document.getElementById('input__file');
		choose_data_set.file_change_callback = file_change_callback;
		choose_data_set.input__file.addEventListener('change', choose_data_set.file_change_handler);
		choose_data_set.file_change_handler();

	},

	file_change_handler: () => {

		const reader = new FileReader();
		const file = choose_data_set.input__file.files[0];

		if (typeof file === "undefined")
			return true;

		reader.readAsText(file);
		reader.onerror = function (event) {
			if (event.target.error.name === "NotReadableError")
				alert("There were problems reading that file");
		};
		reader.onload = function (event) {
			const csv = event.target.result;
			choose_data_set.file_change_callback(csv);
		};

	},

	flush_selected_file: () => {

		choose_data_set.input__file.value = '';

	},

	file_selected: () => {

		return choose_data_set.input__file.files.length !== 0;

	},


};

module.exports = choose_data_set;