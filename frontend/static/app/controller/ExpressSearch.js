Ext.define('SpThinClient.controller.ExpressSearch', {
    extend: 'Ext.app.Controller',
    xtype: 'expsrchcontroller',

    init: function() {
	console.info("Exp Search Controller Init");
	this.control({
	    'button[itemid="expsrchbtn"]': {
		click: this.onTaskBtnClk
	    }
	});

	this.callParent(arguments);
    },

    onTaskBtnClk: function() {
	var query = Ext.getCmp('expsrchqry').getValue().trim();
	if (query) {
	    var url = $.param.querystring("/specify/express_search/", {q: query});
	    require('navigation').go(url);
	}
    }
});
