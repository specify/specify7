Ext.define('SpThinClient.controller.Data', {
    extend: 'SpThinClient.controller.TaskBase',
    xtype: 'datacontroller',

    viewType: 'ResourceView',

    config: {
	//seems like putting these here is polluting controller with view??
	viewGroup: null,
	rsGroup: null
    },
	
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
	if (!this.getRsGroup() || !this.getViewGroup()) {
	    var getApper = require('cs!appresource');
	    var formsList = getApper('DataEntryTaskInit');
	    var me = this;
	    formsList.done(function(forms) {
		//console.info("formsList done?");
		//console.info(forms);
		//var gps = [];       
		var vg = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		    //me.setViewGroup(Ext.create('SpThinClient.view.NavBarItemGroupView', {
		    containedClass: 'SpThinClient.view.NavBarViewView',
		    itemDefs: $('view', forms), 
		    position: 'top',
		    title: 'Create/Update', 
		    //region: 'center', 
		    frame: true
		});
		me.getSideBar().addGroup(vg);
		if (me.getSideBar().getGroups().length == 2) {
		    //console.info("setting up groups after FormList done");
		    me.getSideBar().setupGroups();
		    if (me.getNavigateAfterBuild()) {
			require('navigation').go('/specify/data/default/');
		    }
		    //me.activateSideBar(me, navbar, true);
		    //me.setShowingSideBar(false);
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
		    //me.setRsGroup(Ext.create('SpThinClient.view.NavBarItemGroupView', {
		    containedClass: 'SpThinClient.view.NavBarRsView',
		    itemDefs: rsList.models,
		    title: 'Recordsets',
		    position: 'middle',
		    //region: 'center',
		    frame: true
		});
		//navbar.addGroup(me.getRsGroup());
		me.getSideBar().addGroup(rsg);
		if (me.getSideBar().getGroups().length == 2) {
		    //console.info("setting up groups after rsList done");
		    me.getSideBar().setupGroups();
		    if (me.getNavigateAfterBuild()) {
			require('navigation').go('/specify/data/default/');
		    }
		    //me.activateSideBar(me, navbar, true);
		    //me.setShowingSideBar(false);
		}
	    });
	} else {
	    this.getSideBar().addGroup(this.getViewGroup());
	    this.getSideBar().addGroup(this.getRsGroup());
	    this.getSideBar().setupGroups();
	    if (this.getNavigateAfterBuild()) {
		require('navigation').go('/specify/data/default/');
	    }
	    //this.activateSideBar(this, navbar, true);
	    //this.setShowingSideBar(false);
	}
	
    }

});	
