Ext.define('SpThinClient.view.NavBarViewView', {
    extend: 'SpThinClient.view.NavBarItemView',
    xtype: 'sp-navbarview-view',
    alias: 'widget.navbarview-view',

    config: {
	view: null
    },

    launcher: function(dropped) {
	//console.info(this.up('sp-navbarview-view').url(48));
	//require('navigation').go(this.up('sp-navbarview-view').url(48));
	var viewItem = this.up('sp-navbarview-view');
	viewItem.createNewRecordset().done(function(recordset) {
	    require('navigation').go(viewItem.url(recordset.id));
	});
    },

    setupFromItemDef: function(){
	var me = this;
	//console.info("setupFromItemDef");
	require('specifyform').getView($(this.itemDef).attr('view')).done(
	    function(view) {
		me.view = view;
		me.model = require('schema').getModel(view.class.split('.').pop());

		//me.icon = require('icons').getIcon($(me.viewDef).attr('iconname'));
		me.down('image').setSrc(require('icons').getIcon($(me.itemDef).attr('iconname')));
		
		//me.text = $(me.viewDef).attr('title');
		//me.down('button').setText('<b>' + $(me.viewDef).attr('title') + '</b>');
		me.down('button').setText($(me.itemDef).attr('title'));

		//me.tooltip = $(me.viewDef).attr('tooltip');
		//me.down('tbtext').setTooltip($(me.viewDef).attr('tooltip'));

		me.setIsSetup(true);
		var parent = me.findParentByType('sp-navbaritemgroup-view');
		//me.doComponentLayout();
		//me.update();
		if (parent) {
		    parent.itemIsSetup(me);
		}
	    });
    },

    createRecordset: function(name) {
	var recordset;
        recordset = new (require('specifyapi').Resource.forModel('recordset'))({
            dbtableid: this.getModel().tableId,
            name: name,
            type: 0
        });
        return recordset.save().pipe(function() {
            return recordset;
        });
    },

    createNewRecordset: function() {
	return this.createRecordset(this.getDefaultNewRsName());
    },
	
    getDefaultNewRsName: function() {
	return "AnotherNewRs";
    },

    url: function(recordsetid) {
	return  $.param.querystring("/specify/view/" + this.getModel().name.toLowerCase() + "/new/", {view: this.getView().name, recordsetid: recordsetid});
    },

    shouldDisplay: function() {
	if (this.getItemDef()) {
	    var isOnSideBar = $(this.getItemDef()).attr('sidebar');
	    if(isOnSideBar != 'true') {
		return false;
	    } else {
		return true;
	    }
	}
    },
	
    initComponent: function(){
	this.callParent(arguments);
	this.down('toolbar > button').handler = this.launcher;
    }

});
