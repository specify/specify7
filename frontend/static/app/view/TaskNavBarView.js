Ext.define('SpThinClient.view.TaskNavBarView', {
    extend: 'Ext.panel.Panel',
    xtype: 'sp-tasknavbar-view',
    alias: 'widget.tasknavbar-view',

    config: {
	groups: null
    },

    addGroup: function(group) {
	if (!this.getGroups()) {
	    this.setGroups([]);
	}
	if (group.getGrpPosition() == 'top') {
	    this.getGroups().unshift(group);
	    this.insert(0, group);
	} else if (group.getGrpPosition() == 'bottom') {
	    this.getGroups().push(group);
	    this.add(group);
	} else {
	    var g = 0;
	    while (g < this.getGroups().length && this.getGroups(g).getGrpPosition() == 'top') g++;
	    if (g >= this.getGroups().length) {
		this.getGroups().push(group);
		this.add(group);
	    } else {
		this.getGroups.splice(g, 0, group);
		this.insert(g, group);
	    }
	}		
    },

    clearGroups: function() {
	this.groups = [];
	this.removeAll();
    },

    setupGroups: function() {
	for (var g = 0; g < this.getGroups().length; g++) {
	    var grp = this.getGroups()[g];
	    if (!grp.getIsSetup()) {
		grp.setupItems();
	    }
	}
    },

    groupIsSetup: function() {
	console.info("groupIsSetup?");
	for (var i = 0; i < this.getGroups().length; i++) {
	    if (!this.getGroups()[i].getIsSetup()) return;
	}
	console.info("groupIsSetup");
	this.fireEvent('setupcomplete', this, this.findParentByType('sp-navigationbar-view'));
    }
});
