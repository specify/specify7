define([
    'jquery', 'underscore', 'backbone', 'schema', 'navigation', 
    'specifyapi', 'populateform', 'resourceview', 'fieldformat','prepdialog',
    'props', 'text!properties/resources_en.properties!noinline',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, schema, navigation, api, populateform, ResourceView, FieldFormat, PrepDialog, props, resources_prop) {
    "use strict";

    var getProp = _.bind(props.getProperty, props, resources_prop);

    var dialog;
    function makeDialog(el, options) {
        dialog && dialog.dialog('close');
        dialog = el.dialog(_.extend({
            modal: true,
	    width: 500,
            close: function() { dialog = null; $(this).remove(); }
        }, options));
    }

    return PrepDialog.extend({
        __name__: "PrepReturnDialog",
        className: "prepreturndialog table-list-dialog",
        events: {
	    'click :checkbox': 'prepCheck',
	    'click a.return-remark': 'remToggle'
	},

	//ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	getTblHdr: function() {
	    return '<tr><th>  </th>'
		+ '<th>' + this.colobjModel.getField('catalognumber').getLocalizedName() + '</th>'
		+ '<th>' + this.detModel.getField('taxon').getLocalizedName() + '</th>'
		+ '<th>' + this.prepModel.getField('preptype').getLocalizedName() + '</th>'
		+ '<th>Unresolved</th><th>Return</th><th colspan="2">Resolve</th></tr>';
	},
	getDlgTitle: function() {
	    return "Loan Preparations";
	},
	finishRender: function() {
	    //this.$('table').before( '<div>Returned By: <input type="text" class="return-returnedby"> Returned Date: <input type="date" class="return-returdedDate"></div>'); 
	    
	    var returnSpinners = this.$(".return-amt");
	    returnSpinners.spinner({
		spin: _.bind(this.returnSpin, this)
	    });
	    returnSpinners.width(50);
	    var resolvedSpinners = this.$(".resolve-amt");
	    resolvedSpinners.spinner({
		spin: _.bind(function( evt, ui ) {
		    var idx = this.$(".resolve-amt").index(evt.target);
		    if (idx >= 0) {
			var returnSp =this.$(".return-amt")[idx];
			var val = new Number($(ui).attr('value'));
			var max = this.options.preps[idx].unresolved;
			this.$(':checkbox')[idx].checked = val > 0;
			var returnVal = new Number($(returnSp).attr('value'));
			if (val < returnVal) {
			    returnVal = val;
			}
			$(returnSp).spinner({
			    readOnly: true,
			    min: 0,
			    max: max - (val - returnVal),
			    spin:  _.bind(this.returnSpin, this)
			});
			$(returnSp).attr('value', returnVal);
		    }
		}, this)
	    });
	    resolvedSpinners.width(50);
	},

        dialogEntry: function(iprep) {
	    var entry = [
		$('<tr>').append(
		    $('<td>').append($('<input>').attr('type', 'checkbox')),
                    $('<td>').append(FieldFormat(this.colobjModel.getField('catalognumber'), iprep.catalognumber)),
                    $('<td>').append(iprep.taxon),
                    $('<td>').attr('align', 'center').append(iprep.preptype),
		    $('<td>').attr('align', 'center').append(iprep.unresolved),
		    //not allowing typing into spinners because tricky returned-resolved interdependancy requires previous value, 
		    //which seems to be unavailable in the 'change' event.
		    $('<td>').append($('<input readonly>').attr('align', 'right').attr('value', '0').attr('max', iprep.unresolved).attr('min', 0).addClass('return-amt')),
		    $('<td>').append($('<input readonly>').attr('align', 'right').attr('value', '0').attr('max', iprep.unresolved).attr('min', 0).addClass('resolve-amt')),
		$('<td>').append($('<a class="return-remark">').append('<span class="ui-icon ui-icon-pencil">remark</span'))),
		$('<tr class="return-remark" style="display:none">').append($('<td/>'), $('<td colspan="6"><input type="text" class="return-remark" style="width:100%" placeholder="Remarks"></td>'))
	    ];
            return entry;
        },

        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: 'Select All', click: _.bind(this.selectAll, this),
                  title: 'Return all preparations.' },
		{ text: 'De-select All', click: _.bind(this.deSelectAll, this),
		  title: 'Clear all.' },
		{ text: 'OK', click: _.bind(this.returnSelections, this),
		  title: 'Return selected preparations' }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
        },



	//<<<<<<<<<<<<<<<<<<<< ui elements stuff

	//events >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	remToggle: function(evt) {
	    var idx = this.$('a.return-remark').index(evt.currentTarget);
	    if (idx >= 0) {
		$(this.$('tr.return-remark')[idx]).toggle();
	    }
	},
	returnSpin: function(evt, ui) {
	    var idx = this.$(".return-amt").index(evt.target);
	    if (idx >= 0) {
		var resolveSp =this.$(".resolve-amt")[idx];
		var val = new Number($(ui).attr('value'));
		var prevVal = new Number($(evt.target).attr('value'));
		var delta = val - prevVal; //can this ever NOT be +-1 for a spin?
		var resolvedVal = new Number($(resolveSp).attr('value')) + delta;
		$(resolveSp).attr('value', resolvedVal);
		this.$(':checkbox')[idx].checked = resolvedVal > 0;
	    }
	},

	returnDone: function(result) {
	    this.$el.dialog('close');

	    var msg = getProp("InteractionsTask.RET_LN_SV").replace('%d', result[0]);
	    
	    var huh = $("<p>").append($("<a>").text(msg));
	    
	    makeDialog(huh, {
		title: getProp("InteractionsTask.LN_RET_TITLE"),
		maxHeight: 400,
		buttons: [
		    {text: getProp('CLOSE'), click: function() { $(this).dialog('close'); }}
		]
	    });
	},   
	
	returnSelections: function() {
	    var self = this;
	    var returns = _.filter(_.map(this.options.preps, function(prep, idx) {
		var resolved = new Number(self.$(".resolve-amt")[idx].value);
		var rem =  self.$("input.return-remark")[idx].value.trim();
		if (rem.length == 0) {
		    rem = 'NULL';
		} else {
		    rem = "'" + rem.replace(/'/g, "''") + "'";
		}
		return [ prep.loanpreparationid,
			 new Number(self.$(".return-amt")[idx].value),
			 resolved,
			 resolved == prep.unresolved ? 'true' : 'false',
			 rem
		       ];
	    }), function(item) { return item[1] > 0; });
	    var today = new Date();
	    var todayArg = [];
	    todayArg[0] = today.getFullYear(); todayArg[1] = today.getMonth() + 1; todayArg[2] = today.getDate();
	    var app = require('specifyapp'); 
	    api.returnLoanItems(app.user.id, todayArg.join('-'), JSON.stringify(returns)).done(_.bind(this.returnDone, this));
	},

	prepCheck: function( evt ) {
	    var idx = this.$(':checkbox').index( evt.target );
	    if (idx >= 0) {
		var newVal = evt.target.checked ? this.options.preps[idx].unresolved : 0;
		$(this.$('.resolve-amt')[idx]).attr('value',  newVal);
		var returnSp = this.$('.return-amt')[idx];
		$(returnSp).spinner({
		    readOnly: true,
		    min: 0,
		    max: this.options.preps[idx].unresolved,
		    spin:  _.bind(this.returnSpin, this)
		});
		$(returnSp).attr('value', newVal);
	    }
	},

	selectAll: function() {
	    var returns = this.$('.return-amt');
	    var resolves = this.$('.resolve-amt');
	    var chks = this.$(':checkbox');
	    for (var p=0; p < returns.length; p++) {
		$(returns[p]).spinner({
		    readOnly: true,
		    min: 0,
		    max: this.options.preps[p].unresolved,
		    spin:  _.bind(this.returnSpin, this)
		});
		$(returns[p]).attr('value', this.options.preps[p].unresolved);
		$(resolves[p]).attr('value', this.options.preps[p].unresolved);
		$(chks[p]).attr('checked', this.options.preps[p].unresolved > 0);
	    };	  
	},

	deSelectAll: function() {
	    var returns = this.$('.return-amt');
	    for (var p=0; p < returns.length; p++) {
		$(returns[p]).spinner({
		    readOnly: true,
		    min: 0,
		    max: this.options.preps[p].unresolved,
		    spin:  _.bind(this.returnSpin, this)
		});
		$(returns[p]).attr('value', 0);
	    };	  
	    this.$('.resolve-amt').attr('value', 0);
	    this.$(':checkbox').attr('checked', false);
	}
	
	//<<<<<<<<<<<<<<<<<<<<<<< events


    });


});
