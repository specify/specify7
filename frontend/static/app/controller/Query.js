Ext.define('SpThinClient.controller.Query', {
    extend: 'Ext.app.Controller',
    xtype: 'querycontroller',

    init: function() {
	console.info("Query Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="query"]': {
		click: this.onTaskBtnClk
	    },
	    '#appviewport': {
		gone: this.onGone
	    }
	});

	this.callParent(arguments);
    },

    onGone: function(goneWhere) {
	console.info("Query.onGone");
	var viewType = goneWhere.newView.$el.attr('ViewType');
	console.info(viewType);
	if (viewType == 'StoredQuery') {
	    console.info('Opening Query Task');
	    this.onTaskBtnClk();
	}
    },

    onTaskBtnClk: function() {
	console.info("Query Task activated");
	var navbar = Ext.getCmp('ext-main-navbar');
	if (navbar) {
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    }
	}
	navbar.clearGroups();

	var api = require('specifyapi');
	var qList = api.Collection.fromUri('/api/specify/spquery/');
	console.info(qList);
	qList.fetch().done(function() {
	    console.info("qList fetch done");
	    console.info(qList);
	    var qGroup = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarQbView',
		itemDefs: qList.models,
		title: 'Queries',
		position: 'middle',
		frame: true
	    });
	    navbar.addGroup(qGroup);
	    navbar.setupGroups();
	});
    }

});
