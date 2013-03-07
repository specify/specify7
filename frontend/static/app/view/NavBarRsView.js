Ext.define('SpThinClient.view.NavBarRsView', {
    extend: 'SpThinClient.view.NavBarItemView',
    xtype: 'sp-navbarrs-view',
    alias: 'widget.navbarrs-view',


    config: {
	viewName: null
    },

    launcher: function(dropped) {
	var rsItem = this.up('sp-navbarrs-view');
	if (rsItem.getViewName()) {
	    require('navigation').go(rsItem.url(rsItem.getItemDef().get('id')));
	}
    },

    setupFromItemDef: function(){
	//console.info("NavBarRsView.setupFromItemDef");
	this.setModel(require('schema').getModelById(this.getItemDef().get('dbtableid')));
	this.down('image').setSrc(this.getModel().getIcon());		
	this.down('button').setText(this.getItemDef().get('name'));

	//me.tooltip = $(me.viewDef).attr('tooltip');
	//me.down('tbtext').setTooltip($(me.viewDef).attr('tooltip'));

	this.setIsSetup(true);
	var parent = this.findParentByType('sp-navbaritemgroup-view');
	if (parent) {
	    parent.itemIsSetup(this);
	}
    },


    getViewName: function() {
	if (!this.viewName) {
	   this.determineViewName();
	}
	return this.viewName;
    },
    
    determineViewName: function(){
	this.setViewName(null);
	var nav = this.up('sp-navigationbar-view');
	if (nav) {
	    var viewGrp = nav.down('sp-navbaritemgroup-view[containedClass="SpThinClient.view.NavBarViewView"]');
	    if (viewGrp) {
		var me = this;
		var viewItem = _.find(viewGrp.getNavBarItems(), function(item) {
		    return item.getModel().name == me.getModel().name;
		});
		console.info("setting view name " + viewItem.getView().name);
		this.setViewName(viewItem.getView().name);
	    }
	}
    },
				      
    url: function(recordsetid) {
	return  $.param.querystring("/specify/view/" + this.getModel().name.toLowerCase() + "/new/", {view: this.getViewName(), recordsetid: recordsetid});
    },

    shouldDisplay: function() {
	return true;
    },

    initComponent: function(){
	this.callParent(arguments);
	this.down('toolbar > button').handler = this.launcher;
    }

});
