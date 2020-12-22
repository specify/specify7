const Backbone = require('./backbone.js');

module.exports = Backbone.View.extend({
    __name__: "WbUtils",
    className: "wbs-utils",
    events: {
    },
    initialize({hot, wb, colHeaders}) {
        this.hot = hot;
        this.cellInfo = [];
        this.search_query = null;
        this.wb = wb;
        this.colHeaders = colHeaders;
    },
    render() {},
    initCellInfo(row, col) {
        const cols = this.hot.countCols();
        if(typeof this.cellInfo[row*cols + col] === "undefined") {
            this.cellInfo[row*cols + col] = {isNew: false, issues: [], matchesSearch: false};
        }
    },
	navigateCells(e, match_current_cell = false){
		const button = e.target;
		const direction = button.getAttribute('data-navigation_direction');
		const button_parent = button.parentElement;
		const type = button_parent.getAttribute('data-navigation_type');

		const number_of_columns = this.hot.countCols();

		const selected_cell = this.hot.getSelectedLast();

		let current_position = 0;
		if (typeof selected_cell !== "undefined") {
			const [row, col] = selected_cell;
			current_position = row * number_of_columns + col;
		}

		const cellIsType = (info) => {
			switch (type) {
				case 'invalid_cells':
					return info.issues.length > 0;
				case 'new_cells':
					return info.isNew;
				case 'search_results':
					return info.matchesSearch;
				default:
					return false;
			}
		};

		let new_position = current_position;
		let found = false;
		for (;
			new_position >= 0 && new_position < this.cellInfo.length;
			new_position += direction === 'next' ? 1 : -1
		) {
			if (new_position === current_position && !match_current_cell) continue;

			const info = this.cellInfo[new_position];
			if (typeof info === "undefined") continue;
			found = cellIsType(info);
			if (found) break;
		}

		if (found) {
			const row = Math.floor(new_position / number_of_columns);
			const col = new_position - row * number_of_columns;
			this.hot.selectCell(row, col, row, col);

			const cell_relative_position = this.cellInfo.reduce((count, info, i) => count + (cellIsType(info) && i <= new_position ? 1 : 0), 0);
			const current_position_element = button_parent.getElementsByClassName('wb-navigation_position')[0];
			current_position_element.innerText = cell_relative_position;
		}
	},
	searchCells(e){
		const cols = this.hot.countCols();
		const button = e.target;
		const container = button.parentElement;
		const navigation_position_element = container.getElementsByClassName('wb-navigation_position')[0];
		const navigation_total_element = container.getElementsByClassName('wb-navigation_total')[0];
		const search_query_element = container.getElementsByClassName('wb-search_query')[0];
		const navigation_button = container.getElementsByClassName('wb-cell_navigation');
		const search_query = search_query_element.value;

		const searchPlugin = this.hot.getPlugin('search');
		const results = searchPlugin.query(search_query);
		this.search_query = search_query;

		this.cellInfo.forEach(cellInfo => {
			cellInfo.matchesSearch = false;
		});
		results.forEach(({row, col}) => {
			this.initCellInfo(row, col);
			this.cellInfo[row * cols + col].matchesSearch = true;
		});
		this.hot.render();

		navigation_total_element.innerText = results.length;
		navigation_position_element.innerText = 0;

		if (!this.navigateCells({target: navigation_button[0]}, true))
			this.navigateCells({target: navigation_button[1]}, true);

	},
	replaceCells(e){
		const cols = this.hot.countCols();
		const button = e.target;
		const container = button.parentElement;
		const replacement_value_element = container.getElementsByClassName('wb-replace_value')[0];
		const replacement_value = replacement_value_element.value;

		const cellUpdates = [];
		this.cellInfo.forEach((info, i) => {
			if (info.matchesSearch) {
				const row = Math.floor(i / cols);
				const col = i - row * cols;
				const cellValue = this.hot.getDataAtCell(row, col);
				cellUpdates.push([row, col, cellValue.split(this.search_query).join(replacement_value)]);
			}
		});

		this.hot.setDataAtCell(cellUpdates);
	},
	toggleToolbelt(e){
		const button = e.target;
		const container = button.closest('.wb-header');
		const toolbelt = container.getElementsByClassName('wb-toolbelt')[0];
		if (toolbelt.style.display === 'none')
			toolbelt.style.display = '';
		else
			toolbelt.style.display = 'none';
	},
	fillDownCells({start_row, end_row, col}){

		const first_cell = this.hot.getDataAtCell(start_row, col);

		if (isNaN(first_cell))
			return;

		const numeric_part = parseInt(first_cell);

		const changes = [];
		const number_of_rows = end_row - start_row;
		for (let i = 0; i <= number_of_rows; i++)
			changes.push([
				start_row + i,
				col,
				(numeric_part + i).toString().padStart(first_cell.length, '0')
			]);

		this.hot.setDataAtCell(changes);

	},
});