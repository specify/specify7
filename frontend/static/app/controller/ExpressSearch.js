Ext.define('SpThinClient.controller.ExpressSearch', {
    extend: 'SpThinClient.controller.TaskBase',
    xtype: 'expsrchcontroller',

    viewType: 'ExpressSearchResults',

    init: function() {
	console.info("Exp Search Controller Init");
	this.control({
	    'button[itemid="expsrchbtn"]': {
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

    /*onGone: function(goneWhere) {
	console.info("ExpressSearch.onGone");
	var viewType = goneWhere.newView.$el.attr('ViewType');
	console.info(viewType);
	if (viewType == 'ExpressSearchResults') {
	    console.info('Opening Express Search Results Task');
	    this.setupNavBar();
	}
    },*/

   onTaskBtnClk: function() {
	var query = Ext.getCmp('expsrchqry').getValue().trim();
	if (query) {
	    var url = $.param.querystring("/specify/express_search/", {q: query});
	    require('navigation').go(url);
	}
    },

    /*setupNavBar: function() {
	var navbar = Ext.getCmp('ext-main-navbar');
	if (navbar) {
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    }
	}
	navbar.clearGroups();

	var api = require('specifyapi');
	var rsList = new (api.Collection.forModel('recordset'))();
	//console.info(rsList);
	rsList.queryParams.domainfilter = true;
	rsList.fetch().done(function() {
	    //console.info("rsList fetch done");
	    //console.info(rsList);
	    var rsGroup = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarRsView',
		itemDefs: rsList.models,
		title: 'Recordsets',
		position: 'top',
		//region: 'center',
		frame: true
	    });
	    navbar.addGroup(rsGroup);
	    navbar.setupGroups();
	});
	
    }*/

    buildSideBar: function(navbar) {
	var api = require('specifyapi');
	var rsList = new (api.Collection.forModel('recordset'))();
	//console.info(rsList);
	var me = this;
	rsList.queryParams.domainfilter = true;
	rsList.fetch().done(function() {
	    //console.info("rsList fetch done");
	    //console.info(rsList);
	    var rsGroup = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarRsView',
		itemDefs: rsList.models,
		title: 'Recordsets',
		position: 'top',
		//region: 'center',
		frame: true
	    });
	    navbar.addGroup(rsGroup);
	    navbar.setupGroups();
	    me.setBuilding(false);
	});
    }

});
