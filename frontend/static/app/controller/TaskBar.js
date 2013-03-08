Ext.define('SpThinClient.controller.TaskBar', {
    extend: 'Ext.app.Controller',
    xtype: 'taskbarcontroller',

    init: function() {
	console.info("Welcome Controller Init");
	this.control({
	    'sp-taskbarbtn-view': {
		click: this.onBeforeOpenTask
	    },
	    'sp-navigationbar-view': {
		expand: this.onTaskOpened
	    },
	    'taskbasecontroller': {
		taskready: this.onTaskOpened
	    }
	});

	this.callParent(arguments);
    },

    onBeforeOpenTask: function() {
	Ext.getCmp('chrometaskbar').setDisabled(true);
    },

    onTaskOpened: function() {
	Ext.getCmp('chrometaskbar').setDisabled(false);
    }
});
