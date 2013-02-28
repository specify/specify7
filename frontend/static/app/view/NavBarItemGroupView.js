Ext.define('SpThinClient.view.NavBarItemGroupView', {
    //extend: 'Ext.toolbar.Toolbar',
    extend: 'Ext.panel.Panel',
    xtype: 'sp-navbaritemgroup-view',
    alias: 'widget.navbaritemgroup-view',
    
    //vertical: true, //if Toolbar extension
    //layout: 'vbox',  //if panel extension
    layout: 'anchor',
    defaults: {
	anchor: '100%'
    },

    title: 'Items',
    
    requires: [
        'SpThinClient.view.NavBarItemView',
	'SpThinClient.view.NavBarViewView',
	'SpThinClient.view.NavBarRsView',
	'SpThinClient.view.NavBarQbView',
	'Ext.Array'
    ],
    
    config: {
	itemDefs: null,
	containedClass: null,
	navBarItems: null,
	isSetup: false,
	grpPosition: 'top' //'top', 'middle', 'bottom'. Last added 'top' will be on top. 
	//Last added 'bottom' will be on the bottom. Middles are added after most recently added middle between tops and bottoms.
    },
    
    setItemDefs: function(vds){
	this.itemDefs = vds;
	this.loadItemsFromItemDefs();
    },

    loadItemsFromItemDefs: function(){
	//this.items = [];
	var myItems = [];
	var me = this;
	_.each(this.itemDefs, function(itemDef){
	    var newItem = Ext.create(me.getContainedClass(),{itemDef: itemDef});
	    if (newItem.shouldDisplay()) {
		myItems.push(newItem);
	    } else {
		newItem = null;
	    }
	});
	this.setNavBarItems(myItems);
	this.items = myItems;
    },

    shouldDisplay: function(view) {
	var isOnSideBar = $(view).attr('sidebar');
	if(isOnSideBar != 'true') {
	    return false;
	} else {
	    return true;
	}
    },

    setupItems: function() {
	for (var i = 0; i < this.getNavBarItems().length; i++) {
	    //console.info(this.getNavBarItems()[i]);
	    this.getNavBarItems()[i].setupFromItemDef();
	}
    },

    itemIsSetup: function(item) {
	for (var i = 0; i < this.getNavBarItems().length; i++) {
	    if (!this.getNavBarItems()[i].getIsSetup()) return;
	}
	this.setIsSetup(true);
	var parent = this.findParentByType('sp-navigationbar-view');
	if (parent) {
	    parent.groupIsSetup(this);
	}
    },
    
    initComponent: function(){
	this.loadItemsFromItemDefs();
	this.callParent(arguments);
    }
});
