Ext.define('SpThinClient.view.NavBarQbView', {
    extend: 'SpThinClient.view.NavBarItemView',
    xtype: 'sp-navbarqb-view',
    alias: 'widget.navbarqb-view',

    launcher: function(dropped) {
	var qItem = this.up('sp-navbarqb-view');
	require('navigation').go(qItem.url(qItem.getItemDef().get('id')));
    },

    setupFromItemDef: function(){
	console.info("NavBarQbView.setupFromItemDef");
	this.setModel(require('schema').getModelById(this.getItemDef().get('contexttableid')));
	this.down('image').setSrc(this.getModel().getIcon());		
	this.down('button').setText(this.getItemDef().get('name'));

	this.setIsSetup(true);
	var parent = this.findParentByType('sp-navbaritemgroup-view');
	if (parent) {
	    parent.itemIsSetup(this);
	}
    },

    url: function(id) {
	return "/specify/stored_query/" + id + "/";
    },

    shouldDisplay: function() {
	return true;
    },

    initComponent: function(){
	this.callParent(arguments);
	this.down('toolbar > button').handler = this.launcher;
    }
});
