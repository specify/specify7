Ext.define('SpThinClient.view.NavBarItemView', {
    extend: 'Ext.panel.Panel',	
    
    layout: 'column',

    config: {
	itemDef: null,
	isSetup: false,
	model: null
    },
    
    items: [
	{
	    xtype: 'image'
	},
	{
	    xtype: 'toolbar',
	    layout: 'fit',
	    columnWidth: 1,
	    items: [
		{
		    xtype: 'button',
		    textAlign: 'left',
		    border: false
		}
	    ]
	}
    ],

    setItemDef: function(v){
	this.itemDef = v;
	this.setupFromItemDef();
    },

    initComponent: function(){
	this.callParent(arguments);
    }
});
