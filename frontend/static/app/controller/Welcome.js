Ext.define('SpThinClient.controller.Welcome', {
    extend: 'SpThinClient.controller.TaskBase',
    xtype: 'welcomecontroller',

    autoExpandSideBar: false,

    init: function() {
	console.info("Welcome Controller Init");
	this.control({
	    'sp-taskbarbtn-view[itemid="welcome"]': {
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
	this.activateSideBar(this.getSideBar(), navbar);
	this.setShowingSideBar(false);
    }

});
