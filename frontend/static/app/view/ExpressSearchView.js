Ext.define('SpThinClient.view.ExpressSearchView', {
    extend: 'Ext.form.Panel',
    xtype: 'sp-expresssearch-view',
    alias: 'widget.expresssearch-view',

    layout: 'border',
    
    items: [
	{
	    xtype: 'textfield',
            //fieldLabel: 'Search',
            name: 'q',
	    cls: 'express-search-query',
	    id: 'expsrchqry',
	    region: 'center',
            allowBlank: false
	},
	{
	    xtype: 'button',
	    text: 'Search',
	    region: 'east',
	    itemid: 'expsrchbtn'
	}
    ],
	    
    initComponent: function() {	
	this.callParent(arguments);
    }
});
