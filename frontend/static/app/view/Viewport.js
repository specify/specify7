Ext.define('SpThinClient.view.Viewport', {
    extend: 'Ext.container.Viewport',
    title: 'Specify',
    layout: 'border',
    id: 'appviewport',

    //localizable text...
    viewportTitle: 'Specify',
   //...localizable text

    requires: [
	'Ext.panel.Panel',

	'SpThinClient.view.NavigationBarView',
	'SpThinClient.view.NavBarItemGroupView',
	'SpThinClient.view.TaskBarView',
	'SpThinClient.view.ExpressSearchView'
    ],


    banner: null,
    background: null,


    initComponent: function () {
	console.info("initializing viewport component");

	//Initiate load of user settings from local storage
	/*
	this.fireEvent('initsettings');
	 */
	

	/*this.background = Ext.create('Ext.panel.Panel', {
	    html: '<table class="deadcenter"> <tr><td><img src=" '></td></tr></table>',
	    id: 'sptc-mainbackground'
	});*/

	    
	this.items = [
	    {
		xtype: 'sp-taskbar-view',
		id: 'chrometaskbar',
		region: 'north',
		height: 80,
		items: [
		    {
			xtype: 'sp-taskbarbtn-view',
			text: 'Welcome',
			icon: '/images/specify32.png',
			itemid:'welcome'
		    },
		    {
			xtype: 'sp-taskbarbtn-view',
			text: 'Data',
			icon: '/images/Data_Entry.png',
			itemid: 'data'
		    }, 
		    {
			xtype: 'sp-taskbarbtn-view',
			text: 'Query',
			icon: '/images/Query32x32.png',
			itemid: 'query'
		    },
		    {
			xtype: 'sp-expresssearch-view',
			id: 'express-search-view',
			height: 70,
			width: 150
		    }
		 ]
	    },
	    {
		xtype: 'sp-navigationbar-view',
		id: 'ext-main-navbar',
		layout: 'card',
		region: 'west',
		header: false,
		width: 250,
		collapsible: true,
		collapsed: true,
		split: true
	    },
	    {
		xtype: 'panel',
		region: 'center',
		id: 'content'
		//layout: 'fit'
		/*items: [
		    this.background
		]*/
	    }
	];
	
	this.callParent(arguments);

	//require('specifyapp').app.expressSearch.render();
    }
});
