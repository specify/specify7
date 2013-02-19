Ext.define('SpThinClient.controller.Welcome', {
    extend: 'Ext.app.Controller',
    xtype: 'welcomecontroller',

    init: function() {
	console.info("Welcome Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="welcome"]': {
		click: this.onTaskBtnClk
	    }
	});

	this.callParent(arguments);
    },

    onTaskBtnClk: function() {
	var navbar = Ext.getCmp('ext-main-navbar');
	navbar.clearGroups();
	if (navbar) {
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    }
	}
    }
});
