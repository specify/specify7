"use strict";


const custom_select_element = {

	constructor(table_icons_base_path = '', table_icons_extension = ''){
		custom_select_element.table_icons_base_path = table_icons_base_path;
		custom_select_element.table_icons_extension = table_icons_extension;
	},

	new_select_html(select_data, show_table_names){

		const {
			select_type,
			select_name = '',
			select_label = '',
			select_table = '',
			select_groups_data = []
		} = select_data;

		let default_name = 0;
		let header = '';
		let preview = '';
		let custom_select_type = '';
		let first_row = '';
		let is_relationship_text = 'false';

		if(show_table_names) {
			custom_select_type = 'custom_select_size_multiple';

			header = `
				<span class="custom_select_header">
					<span class="custom_select_header_icon">
						` + custom_select_element.icon(true, true, select_table) + `
					</span>
					<span class="custom_select_table_label">
						` + select_label + `
					</span>
				</span>`;
		}
		else {
			custom_select_type = 'custom_select_size_one';

			let default_label = 0;
			let default_icon = '';
			let is_relationship = false;
			let table_name = '';

			outer_loop:
				for (const select_group_data of select_groups_data)
					for (const select_field_data of select_group_data['select_options_data'])
						if (select_field_data.is_default) {
							({option_name: default_label, option_value: default_name, is_relationship, table_name} = select_field_data);
							break outer_loop;
						}

			if(default_label !== 0)
				default_icon = custom_select_element.icon(is_relationship, true, table_name);

			is_relationship_text = is_relationship.toString();

			preview = `<span class="custom_select_input" tabindex="0">
							<span class="custom_select_input_icon">`+default_icon+`</span>
							<span class="custom_select_input_label">`+default_label+`</span>
						</span>`;
			first_row = `<span
							class="custom_select_option ` + (default_label === 0 ? ' custom_select_option_selected' : '') + `"
							data-value="0"
							tabindex="0">
						</span>`;
		}


		return `<span
					class="custom_select `+custom_select_type+`"
					title="` + select_label + `"
					data-name="` + select_name + `"
					data_value_is_relationship="`+is_relationship_text+`"
					data-value="`+default_name+`"
					data-previous_value="0"
					data-table="` + select_table + `"
					data-type="` + select_type + `">
			`+header+`
			`+preview+`
			<span class="custom_select_options">
				` + first_row +
				(select_groups_data.map(select_group_data => custom_select_element.new_select_group_html(select_group_data)).join('')) + `
			</span>
		</span>`;
	},

	new_select_group_html(select_group_data){

		const {select_group_name, select_group_label, select_options_data} = select_group_data;

		return `<span
					class="custom_select_group"
					data-group="` + select_group_name + `">
			<span class="custom_select_group_label">` + select_group_label + `</span>
			` + (select_options_data.map(select_option_data => custom_select_element.new_select_option_html(select_option_data)).join('')) + `
		</span>`;

	},

	new_select_option_html(select_option_data){

		const {option_name, option_value, is_enabled = true, is_relationship = false, is_default = false, table_name = ''} = select_option_data;

		const classes = ['custom_select_option'];

		if (!is_enabled)
			classes.push('custom_select_option_disabled');

		if (is_relationship)
			classes.push('custom_select_option_relationship');

		if (is_default)
			classes.push('custom_select_option_selected');


		return `<span
					class="` + (classes.join(' ')) + `"
					data-value="` + option_value + `"
					data-table_name="`+table_name+`"
					tabindex="0">
			<span class="custom_select_option_icon">` + custom_select_element.icon(is_relationship, is_default, table_name) + `</span>
			<span class="custom_select_option_label">` + option_name + `</span>
		</span>`;
	},

	icon(is_relationship, is_default, table_name){
		if(is_relationship && table_name !== ''){
			//TODO: enable table icons once ready
			//'<img src="' + custom_select_element.table_icons_base_path + table_name + custom_select_element.table_icons_extension + '" alt="' + table_name + '">


			const table_sub_name = table_name.substr(0,2);
			const color_hue = ((table_sub_name[0].charCodeAt(0) + table_sub_name[1].charCodeAt(0)) - ('a'.charCodeAt(0)*2))*7.2;
			const color = 'hsl('+color_hue+', 100%, 50%)';
			return '<span style="color:'+color+'">'+(table_sub_name.toUpperCase())+'</span>';
		}
		else
			return '';
	},

	set_event_listeners(container, change_callback){
		container.addEventListener('click',e=>{

			const el = e.target;

			//toggle list options
			if(el.closest('.custom_select_input')!==null){
				const select_container = el.closest('.custom_select');
				const select_container_classList = select_container.classList;
				if(select_container_classList.contains('custom_select_open'))
					select_container_classList.remove('custom_select_open');
				else
					select_container_classList.add('custom_select_open');
			}

			//close opened lists
			const lists = container.getElementsByClassName('custom_select');
			const current_list = el.closest('.custom_select');

			for(const list of lists)
				if(list !== current_list)  //dont close current list
					list.classList.remove('custom_select_open');

			//recalculate width of each object
			custom_select_element.resize_elements(lists);

			if(current_list !== null){

				//check if option was changed
				const custom_select_option = el.closest('.custom_select_option');
				if(custom_select_option !== null){

					const change_payload = custom_select_element.change_selected_option(current_list,custom_select_option);

					if(typeof change_payload === "object")
						change_callback(change_payload);

				}

			}

		});
	},

	onload(container){

		const lists = container.getElementsByClassName('custom_select');
		custom_select_element.resize_elements(lists);

	},

	resize_elements(lists){
		for(const list of lists){
				const list_input = list.getElementsByClassName('custom_select_input')[0];
				const list_options = list.getElementsByClassName('custom_select_options')[0];
				if(typeof list_input !== "undefined" && typeof list_options !== "undefined")
					list_input.style.setProperty('--base_width',list_options.offsetWidth + 'px');
			}
	},

};

module.exports = custom_select_element;