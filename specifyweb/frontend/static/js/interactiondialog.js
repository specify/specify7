define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi',
    'icons', 'specifyform', 'whenall', 'recordsetsdialog', 'prepselectdialog', 'uiformatters',
    'resourceview',
    'require', 'props', 'text!properties/resources_en.properties!noinline',
    'jquery-ui'
], function($, _, Backbone, schema, api, icons, specifyform,
            whenAll, RecordSetsDialog, PrepSelectDialog, uiformatters, ResourceView, require, props, resources_prop) {
    "use strict";

    var getProp = _.bind(props.getProperty, props, resources_prop);

    var dialog;
    function makeDialog(el, options) {
        dialog && dialog.dialog('close');
        dialog = el.dialog(_.extend({
            modal: true,
            close: function() { dialog = null; $(this).remove(); }
        }, options));
    }

    return RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "interactiondialog recordsetsdialog",
	events: {
	    'click a.rs-select': 'rsSelect',
	    'click button[type=action-entry]': 'processEntry',
	    'click a.i-action-rs': 'toggleRs',
	    'click a.i-action-enter': 'toggleCats',
	    'keyup textarea.i-action-entry': 'catNumChange',
	    'click input.i-action-noprep': 'zeroPrepLoan'
	},
	
	toggleRs: function(evt) {
	    this.toggleIt('table.rs-dlg-tbl', 'div[type=action-entry]');
	},
	toggleCats: function(evt) {
	    this.toggleIt('div[type=action-entry]', 'table.rs-dlg-tbl');
	},

	toggleText: function(ctrl) {
	    var ctrlA = ctrl.prev();
	    var ctrlText = ctrlA.text();
	    if (ctrlText.match(/.* >>$/)) {
		ctrlText = ctrlText.replace(/ >>$/, '');
	    } else {
		ctrlText = ctrlText + ' >>';
	    }
 	    ctrlA.text(ctrlText);
	},	    

	toggleIt: function(sel, otherSel) {
	    var ctrl = $(sel);
	    if (ctrl.is(':hidden')) {
		var otherCtrl = $(otherSel + ':visible');
		if (otherCtrl.length > 0) {
		    this.toggleText(otherCtrl);
		    otherCtrl.toggle(250);
		}
	    }
	    this.toggleText(ctrl);
	    ctrl.toggle(250);
	},

	zeroPrepLoan: function() {
	    this.$el.dialog('close');
	    var SpecifyApp = require('specifyapp');
	    var loanModel = schema.getModel('loan');
	    var loanRes =  new loanModel.Resource();
	    SpecifyApp.setCurrentView(new ResourceView({model: loanRes}));
	},

	getDlgTitle: function() {
	    var tblName = this.options.close ? 'loan' : this.options.action.table;
	    var tblTitle = schema.getModel(tblName).getLocalizedName();
	    return this.options.close ? tblTitle + " Return" : "Create " + tblTitle;
	},
	makeEntryLink: function(recordSet) {
	    return $('<a>').addClass("rs-select").text(recordSet.get('name'));
	},	
	getRSCaption: function() {
	    var rsCount = this.options.recordSets._totalCount;
	    return "By choosing a recordset (" 
		+ (rsCount == 0 ? "none" : rsCount)
		+ " available)";
	},
	getEntryCaption: function() {
	    return "By entering " + this.getSrchFld().getLocalizedName() + "s";
	},
	getNoPrepCaption: function() {
	    if (this.options.close || this.options.action.table != 'loan') {
		return "";
	    } else {
		return "Without preparations";
	    }
	},
	getSrchFld: function() {
	    var model = this.options.close ? 'loan' : 'collectionobject';
	    var fld = this.options.srchFld ? this.options.srchFld : (model == 'collectionobject' ? 'catalognumber' : 'loannumber');
	    return schema.getModel(model).getField(fld);
	},	      
	catNumChange: function(evt) {
	    console.log("catNumChange");
	    var entry = evt.currentTarget;
	    if (entry.value) {
		$('button[type=action-entry]').removeAttr("disabled");
	    } else {
		$('button[type=action-entry]').attr("disabled", "true");
	    }
	},
	makeUI: function() {
	    var breaker = '';
	    if (this.options.recordSets._totalCount > 0) {
		this.$el.append('<a class="i-action-rs">' + this.getRSCaption() + '</a>');
		this.makeTable();
		breaker = '<br><br>';
	    } 	
	    this.$el.append(breaker + '<a class="i-action-enter">' + this.getEntryCaption() + '</a>'); 
	    this.makeEntryUI();
	    var noPrepCap = this.getNoPrepCaption();
	    if (noPrepCap != "") {
		this.$el.append('<br><input type="button" class="i-action-noprep" value="' + noPrepCap + '"</><br>');
	    }
	},
	touchUpUI: function() {
	   if (this.options.recordSets._totalCount > 0) {
		this.toggleCats();
	   }
	},	    
	makeEntryUI: function() {
	    this.$el.append('<div type="action-entry"><textarea class="i-action-entry" style="width:100%" rows=3></textarea><button disabled="true" type="action-entry">OK</button></div><br>');
	},
	rsSelect: function(evt) {
            var index = this.getIndex(evt, 'a.rs-select');
	    var recordSet =  this.options.recordSets.at(index);
	    this.interactionAction(recordSet, true);
	},
	processEntry: function(evt){ 
	    var numsCtrl = $('textarea.i-action-entry');
	    var numEntry = numsCtrl.attr('value');
	    var splitter = ' '; //default separator
	    if (numEntry.indexOf(',') != -1) {
		//assume comma-separated
		splitter = ',';
	    }
	    numEntry =  numEntry.replace(/\n/g, splitter);

	    var nums=_.filter(
		_.map(numEntry.split(splitter), function(item) {
		    return item.trim();
		}), 
		function(item) {
		    return item != '';
		});

	    var model = this.options.close ? 'loan' : 'collectionobject';
	    var srchFld = this.options.srchFld ? this.options.srchFld : 'catalognumber';
	    var formatter = this.getSrchFld().getUIFormatter();
	    var ids=_.map(nums, function(item) {
		var id = formatter ? formatter.canonicalize([item]) : item;
		return "'" + id.replace(/'/g, "''") + "'";
	    }).join();

	    this.interactionAction(ids, false);
	},
	availablePrepsReady: function(action, prepsData) {
	    var ipreps = _.map(prepsData, function(iprepData) {
		return {catalognumber: iprepData[0],
			taxon: iprepData[1],
			preparationid: iprepData[2],
			preptype: iprepData[3],
			countamt: iprepData[4],
			loaned: iprepData[5],
			gifted: iprepData[6],
			exchanged: iprepData[7],
			available: iprepData[8]
		       };
	    });
	    new PrepSelectDialog({preps: ipreps, action: action }).render();
	},
	loanReturnDone: function(result) {
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
	interactionAction: function(selection, isRs) {
            this.$el.dialog('close');
	    if (this.options.close) {
		var loanIds = isRs ? 'select RecordID from recordsetitem where recordsetid=' + selection.get('id')
			: 'select LoanID from loan where LoanNumber in(' + selection + ')'; 
		var app = require('specifyapp');
		var today = new Date();
		var todayArg = [];
		todayArg[0] = today.getFullYear(); todayArg[1] = today.getMonth() + 1; todayArg[2] = today.getDate();
		var doneFunc = _.bind(this.loanReturnDone, this);
		api.returnAllLoanItems(loanIds, app.user.id, todayArg.join('-'), isRs ? '' : selection).done(doneFunc);
	    } else {
		var action = this.options.action;
		var prepsReady = _.bind(this.availablePrepsReady, this, action);
		if (isRs) {
		    api.getPrepsAvailableForLoanRs(selection.get('id')).done(prepsReady); 
		} else {
		    api.getPrepsAvailableForLoanCoIds('CatalogNumber',selection).done(prepsReady);
		}
	    }
	}
    });
});
