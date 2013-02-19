Ext.define('SpThinClient.controller.Data', {
    extend: 'Ext.app.Controller',
    xtype: 'datacontroller',

    init: function() {
	console.info("Data Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="data"]': {
		click: this.onTaskBtnClk
	    }
	});

	this.callParent(arguments);
    },

    onTaskBtnClk: function() {
	var navbar = Ext.getCmp('ext-main-navbar');
	if (navbar) {
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    }
	}
	navbar.clearGroups();

	var getApper = require('cs!appresource');
	var formsList = getApper('DataEntryTaskInit');
	formsList.done(function(forms) {
	    console.info("formsList done?");
	    console.info(forms);
	    //var gps = [];       
            var upcreate = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarViewView',
		itemDefs: $('view', forms), 
		position: 'top',
		title: 'Create/Update', 
		//region: 'center', 
		frame: true
	    });
	    console.info(upcreate);
	    //navbar.clearGroups();
	    navbar.addGroup(upcreate);
	    //upcreate.setupItems();
	    if (navbar.getGroups().length == 2) {
		console.info("setting up groups after FormList done");
		navbar.setupGroups();
	    }
	});
	var api = require('specifyapi');
	var rsList = new (api.Collection.forModel('recordset'))();
	console.info(rsList);
	rsList.queryParams.domainfilter = true;
	rsList.fetch().done(function() {
	    console.info("rsList fetch done");
	    console.info(rsList);
	    var rsGroup = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarRsView',
		itemDefs: rsList.models,
		title: 'Recordsets',
		position: 'middle',
		//region: 'center',
		frame: true
	    });
	    navbar.addGroup(rsGroup);
	    if (navbar.getGroups().length == 2) {
		console.info("setting up groups after rsList done");
		navbar.setupGroups();
	    }
	});
    }
});	
