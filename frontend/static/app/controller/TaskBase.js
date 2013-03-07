Ext.define('SpThinClient.controller.TaskBase', {
    extend: 'Ext.app.Controller',
    xtype: 'taskbasecontroller',
    
    config: {
	navigateAfterBuild: false,
	building: false,
	viewType: null,
	sideBar: null
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
	    this.setBuilding(true);
	    this.setNavigateAfterBuild(navigate);
	    if (!navbar.getCollapsed()) {
		navbar.toggleCollapse();
	    } else {
		this.showSideBar2(navbar);
	    }
	}
    },

    showSideBar2: function(navbar) {
	if (this.getBuilding()) {
	    navbar.clearGroups();
	    this.buildSideBar(navbar);
	}
    },

    buildSideBar: function(navbar) {
    }
});
