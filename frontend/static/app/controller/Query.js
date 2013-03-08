Ext.define('SpThinClient.controller.Query', {
    extend: 'SpThinClient.controller.TaskBase',
    xtype: 'querycontroller',

    viewType: 'StoredQuery',

    init: function() {
	console.info("Query Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="query"]': {
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
	var api = require('specifyapi');
	var qList = api.Collection.fromUri('/api/specify/spquery/');
	//console.info(qList);
	var me = this;
	qList.fetch().done(function() {
	    //console.info("qList fetch done");
	    //console.info(qList);
	    var qGroup = Ext.create('SpThinClient.view.NavBarItemGroupView', {
		containedClass: 'SpThinClient.view.NavBarQbView',
		itemDefs: qList.models,
		title: 'Queries',
		position: 'top',
		frame: true
	    });
	    me.getSideBar().addGroup(qGroup);
	    me.getSideBar().setupGroups();
	    if (me.getNavigateAfterBuild()) {
		require('navigation').go('/specify/qb/default/');
	    }
	    //me.activateSideBar(this, navbar, true);
	    //me.setShowingSideBar(false);
	});
    }

});
