Ext.define(
    'SpThinClient.view.TaskBarView', {
	extend: 'Ext.toolbar.Toolbar',
	xtype: 'sp-taskbar-view',
	alias: 'widget.taskbar-view',

	requires: [
            'SpThinClient.view.TaskBarBtnView'
	]

    });
