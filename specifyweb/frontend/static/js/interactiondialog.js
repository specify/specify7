define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi',
    'icons', 'specifyform', 'whenall', 'recordsetsdialog', 'prepselectdialog', 'uiformatters',
    'resourceview',
    'require',
    'jquery-ui'
], function($, _, Backbone, schema, api, icons, specifyform,
            whenAll, RecordSetsDialog, PrepSelectDialog, uiformatters, ResourceView, require) {
    "use strict";

    return RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "interactiondialog recordsetsdialog",
	events: {
	    'click a.rs-select': 'rsSelect',
	    'click button[type=action-entry]': 'processEntry',
	    'click a.i-action-rs': 'toggleView',
	    'click a.i-action-enter': 'toggleView',
	    'click a.i-action-noprep': 'zeroPrepLoan'
	},
	toggleView: function(evt, selector) {
	    var clicked = evt.currentTarget.className;
	    var ctrl = clicked == 'i-action-rs' ? $('table.rs-dlg-tbl') : $('div[type=action-entry');
	    ctrl.toggle(400);
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
	    return "Choose a Recordset (" 
		+ (this.options.recordSets._totalCount == 0 ? "none" : this.options.recordSets._totalCount)
		+ " available)";
	},
	getEntryCaption: function() {
	    return "Enter " + this.getSrchFld().getLocalizedName() + "s";
	},
	getNoPrepCaption: function() {
	    if (this.options.close || this.options.action.table != 'loan') {
		return "";
	    } else {
		return "Create " + schema.getModel('loan').getLocalizedName() + " without preparations.";
	    }
	},
	getSrchFld: function() {
	    var model = this.options.close ? 'loan' : 'collectionobject';
	    var fld = this.options.srchFld ? this.options.srchFld : (model == 'collectionobject' ? 'catalognumber' : 'loannumber');
	    return schema.getModel(model).getField(fld);
	},	    
	    
	makeUI: function() {
	    this.$el.append('<a class="i-action-rs">' + this.getRSCaption() + '</a>');
	    this.makeTable();
	    this.$el.append('<br><br><a class="i-action-enter">' + this.getEntryCaption() + '</a><br>'); 
	    this.makeEntryUI();
	    var noPrepCap = this.getNoPrepCaption();
	    if (noPrepCap != "") {
		this.$el.append('<br><a class="i-action-noprep">' + noPrepCap + '</a><br>');
	    }
	},

	touchUpUI: function() {
	   // if (this.options.recordSets._totalCount == 0) {
		$('table.rs-dlg-tbl').hide();
	   // } else 
		$('div[type=action-entry').hide();
	   // }
	},	    
	makeEntryUI: function() {
	    this.$el.append('<div type="action-entry"><textarea class="i-action-entry" style="width:100%" rows=3></textarea><button type="action-entry">OK</button></div><br>');
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
	interactionAction: function(selection, isRs) {
            this.$el.dialog('close');
	    if (this.options.close) {
		var loanIds = isRs ? 'select RecordID from recordsetitem where recordsetid=' + selection.get('id')
			: 'select LoanID from loan where LoanNumber in(' + selection + ')'; 
		var app = require('specifyapp');
		var today = new Date();
		var todayArg = [];
		todayArg[0] = today.getFullYear(); todayArg[1] = today.getMonth() + 1; todayArg[2] = today.getDate();
		var closeResult = api.returnAllLoanItems(loanIds, app.user.id, todayArg.join('-'), isRs ? '' : selection);
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
