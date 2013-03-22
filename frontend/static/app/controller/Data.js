Ext.define('SpThinClient.controller.Data', {
    extend: 'SpThinClient.controller.TaskBase',
    xtype: 'datacontroller',

    viewType: 'resourceView',
    defaultUrl: '/specify/data/default/',

	
    init: function() {
	console.info("Data Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="data"]': {
		click: this.onTaskBtnClk
	    },
	    '#appviewport': {
		gone: this.onGone
	    },
	    '#ext-main-navbar': {
		collapse: this.showSideBar2
	    }
	});

	this.callParent(arguments);
    },

    buildSideBar: function(navbar) {
	var getApper = require('cs!appresource');
	var formsList = getApper('DataEntryTaskInit');
	var me = this;
	formsList.done(function(forms) {
	    //console.info("formsList done?");
	    //console.info(forms);
	    //var gps = [];       
	    var vg = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarViewView',
		itemDefs: $('view', forms), 
		position: 'top',
		title: 'Create/Update', 
		frame: false
	    });
	    me.getSideBar().addGroup(vg);
	    if (me.getSideBar().getGroups().length == 2) {
		console.info("setting up groups after FormList done");
		me.getSideBar().setupGroups();
		//if (me.getNavigateAfterSetup()) {
		//    require('navigation').go('/specify/data/default/');
		//}
	    }
	});
	var api = require('specifyapi');
	var rsList = new (api.Collection.forModel('recordset'))();
	//console.info(rsList);
	rsList.queryParams.domainfilter = true;
	rsList.fetch().done(function() {
	    //console.info("rsList fetch done");
	    //console.info(rsList);
	    var rsg = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarRsView',
		itemDefs: rsList.models,
		title: 'Recordsets',
		position: 'middle',
		frame: false
	    });
	    me.getSideBar().addGroup(rsg);
	    if (me.getSideBar().getGroups().length == 2) {
		console.info("setting up groups after rsList done");
		me.getSideBar().setupGroups();
		//if (me.getNavigateAfterSetup()) {
		//    require('navigation').go('/specify/data/default/');
		//}
	    }
	});
    }    


});	
