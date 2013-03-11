Ext.define('SpThinClient.controller.TaskBase', {
    extend: 'Ext.app.Controller',
    xtype: 'taskbasecontroller',
    
    requires: ['SpThinClient.view.TaskNavBarView'],

    config: {
	navigateAfterSetup: false,
	defaultUrl: null,
	showingSideBar: false,
	buildingSideBar: false, 
	viewType: null,
	sideBar: null,
	autoExpandSideBar: true
    },

    init: function() {
	console.info("TaskBase Controller Init");
	this.control({
	    'sp-tasknavbar-view': {
		setupcomplete: this.onTaskNavBarSetupComplete
	    }
	});
    },

    onGone: function(goneWhere) {
	console.info(this.getViewType() + ".onGone");
	var vt = goneWhere.newView.$el.attr('ViewType');
	console.info(vt);
	if (vt == this.getViewType()) {
	    console.info('Opening ' + this.getViewType() + " Task");
	    this.showSideBar(false);
	}
    },

    onTaskBtnClk: function() {
	this.showSideBar(true);
    },

    showSideBar: function(navigate) {
	var navbar = Ext.getCmp('ext-main-navbar');
	if (navbar) {
	    this.setShowingSideBar(true);
	    this.setNavigateAfterSetup(navigate);
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    } else {
		this.showSideBar2(navbar);
	    }
	}
    },

    showSideBar2: function(navbar) {
	if (this.getShowingSideBar()) {
	    if (this.getBuildingSideBar() || !this.getSideBar()) {
		if (this.getSideBar()) {
		    this.getSideBar().clearGroups();
		} else {
		    this.setSideBar(this.createSideBar());
		}
		this.buildSideBar(navbar);
	    } else {
		this.activateSideBar(this.getSideBar(), navbar);
		this.setShowingSideBar(false);
	    }
	}
    },

    onTaskNavBarSetupComplete: function(sidebar, navbar) {
	if (sidebar == this.getSideBar()) {
	    this.activateSideBar(sidebar, navbar);
	    this.setShowingSideBar(false);
	}
    },

    activateSideBar: function(sidebar, navbar) {
	var theNavBar = null;
	if (navbar) {
	    theNavBar = navbar;
	} else {
	    theNavBar = Ext.getCmp('ext-main-navbar');
	}
	if (!theNavBar.child('#' + sidebar.getId())) {
	    theNavBar.add(sidebar);
	}
	theNavBar.getLayout().setActiveItem(sidebar);
	if (this.getNavigateAfterSetup()) {
	    this.navigateTo();
	}
	if (theNavBar.getCollapsed() && this.getAutoExpandSideBar()) {
	    theNavBar.toggleCollapse();
	} else {
	    //this.fireEvent('taskready');
	    theNavBar.fireEvent('expand');
	}
    },

    createSideBar: function() {
	return Ext.create('SpThinClient.view.TaskNavBarView', {
	    id: this.id + '-sidebar',
	    region: 'center',
	    header: false
	    });
    },

    buildSideBar: function(navbar) {
    },

    navigateTo: function(url) {
	var goTo = url ? url : this.getDefaultUrl();
	if (goTo) { 
	    require('navigation').go(goTo);
	} else {
	    console.warn('Ignoring request to navigate nowhere');
	}
    }
    
});
