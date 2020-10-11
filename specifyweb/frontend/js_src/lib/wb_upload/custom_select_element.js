"use strict";


const custom_select_element = {

	constructor(table_icons_base_path = '', table_icons_extension = ''){
		custom_select_element.table_icons_base_path = table_icons_base_path;
		custom_select_element.table_icons_extension = table_icons_extension;
	},

	new_select_html(select_data){

		const {select_type, select_name, select_label = '', select_table = '', select_groups_data = []} = select_data;

		let default_label = 0;
		outer_loop:
			for (const select_group_data of select_groups_data)
				for (const select_field_data of select_group_data['select_options_data'])
					if (select_field_data.is_default) {
						({option_name: default_label} = select_field_data);
						break outer_loop;
					}

		const class_has_no_default = default_label === 0 ? 'custom_select_option_selected' : '';

		return `<span
					class="custom_select"
					title="` + select_label + `"
					data-name="` + select_name + `"
					data-value="0"
					data-previous_value="0"
					data-table="` + select_table + `"
					data-type="` + select_type + `">
			<span class="custom_select_input" tabindex="0">`+default_label+`</span>
			<span class="custom_select_options">
				<span class="custom_select_option ` + class_has_no_default + `" data-value="0" tabindex="0"></span>
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

			if(classList.contains('custom_select_input')){
				const select_container = el.closest('.custom_select');
				const select_container_classList = select_container.classList;
				if(select_container_classList.contains('custom_select_open'))
					select_container_classList.remove('custom_select_open');
				else
					select_container_classList.add('custom_select_open');
			}
		});
	}

};

module.exports = custom_select_element;