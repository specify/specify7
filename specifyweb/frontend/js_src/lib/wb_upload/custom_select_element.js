"use strict";


const custom_select_element = {

	constructor(table_icons_base_path = '', table_icons_extension = ''){
		custom_select_element.table_icons_base_path = table_icons_base_path;
		custom_select_element.table_icons_extension = table_icons_extension;
	},

	new_select_html(select_data, show_table_names){

		const {select_type, select_name = '', select_label = '', select_table = '', select_groups_data = []} = select_data;


		let default_label = 0;
		outer_loop:
			for (const select_group_data of select_groups_data)
				for (const select_field_data of select_group_data['select_options_data'])
					if (select_field_data.is_default) {
						({option_name: default_label} = select_field_data);
						break outer_loop;
					}

		const class_has_no_default = default_label === 0 ? 'custom_select_option_selected' : '';


		let header = '';
		let preview = '';
		let custom_select_type = '';
		let first_row = '';
		if(show_table_names) {
			//TODO: enable table icons once ready
			header = `
				<span class="custom_select_header">
					<span class="custom_select_header_icon">
						` + select_table.substr(0, 2).toUpperCase() + `
					</span>
					<span class="custom_select_table_label">
						` + select_label + `
					</span>
				</span>`;
			custom_select_type = 'custom_select_size_multiple';
		}
		else {
			preview = `<span class="custom_select_input" tabindex="0">` + default_label + `</span>`;
			custom_select_type = 'custom_select_size_one';
			first_row = `<span class="custom_select_option ` + class_has_no_default + `" data-value="0" tabindex="0"></span>`;
		}


		return `<span
					class="custom_select `+custom_select_type+`"
					title="` + select_label + `"
					data-name="` + select_name + `"
					data-value="0"
					data-previous_value="0"
					data-table="` + select_table + `"
					data-type="` + select_type + `">
			`+header+`
			`+preview+`
			<span class="custom_select_options">
				` + (select_groups_data.map(select_group_data => custom_select_element.new_select_group_html(select_group_data)).join('')) + `
			</span>
		</span>`;
	},

	new_select_group_html(select_group_data){

		const {select_group_name, select_group_label, select_options_data} = select_group_data;

		return `<span class="custom_select_group" data-group="` + select_group_name + `">
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

		//TODO: enable table icons once ready
		//const html__icon = table_name !== '' ? '<img src="' + custom_select_element.table_icons_base_path + table_name + custom_select_element.table_icons_extension + '" alt="' + table_name + '">' : (is_enabled ? '' : '&#x2713;');
		const html__icon = (is_relationship && table_name !== '') ? table_name.substr(0,2).toUpperCase() : (is_enabled ? '' : '&#x2713;');

		return `<span class="` + (classes.join(' ')) + `" data-value="` + option_value + `" tabindex="0">
			<span class="custom_select_option_icon">` + html__icon + `</span>
			<span class="custom_select_option_label">` + option_name + `</span>
		</span>`;
	},

	set_event_listeners(container, change_callback){
		container.addEventListener('click',e=>{

			const el = e.target;
			const classList = el.classList;

			const lists = container.getElementsByClassName('custom_select');

			//toggle list options
			if(classList.contains('custom_select_input')){
				const select_container = el.closest('.custom_select');
				const select_container_classList = select_container.classList;
				if(select_container_classList.contains('custom_select_open'))
					select_container_classList.remove('custom_select_open');
				else
					select_container_classList.add('custom_select_open');
			}

			//close opened lists
			const current_list = el.closest('.custom_select');

			for(const list of lists)
				if(list !== current_list)
					list.classList.remove('custom_select_open');

			//recalculate width of each object
			custom_select_element.resize_elements(lists);

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
				list_input.style.width =  'calc(calc(' + list_options.offsetWidth + 'px - calc(2 * var(--line_padding))) - 2px)';
			}
	},

};

module.exports = custom_select_element;