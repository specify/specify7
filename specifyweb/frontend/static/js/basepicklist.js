define(['backbone', 'saveblockers', 'tooltipmgr'], function(Backbone, saveblockers, ToolTipMgr) {
    "use strict";

    return Backbone.View.extend({
        initialize: function(options) {
            this.infoPromise = this.getItems(options);
        },
        render: function() {
            this.infoPromise.done(this.gotInfo.bind(this));
            return this;
        },
        gotInfo: function(info) {
            this.info = info;
            if (!info.remote) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, info.field.name);
            }
            info.field.isRequired && this.$el.addClass('specify-required-field');
            info.resource.on('change:' + info.field.name.toLowerCase(), this.resetValue, this);
            this._render(info);
        }
    });
});
