"use strict";

import Backbone from './backbone';

export default Backbone.View.extend({
    __name__: "BasePickListView",
        initialize: function(options) {
            this.infoPromise = this.getItems(options);
        },
        render: function() {
            this.infoPromise.done(this.gotInfo.bind(this));
            this.destructors = [];
            return this;
        },
        gotInfo: function(info) {
            this.info = info;
            if (info.resource.isNew()) {
                const defaultItem = info.pickListItems.find(({value, title}) => value === info.default || title === info.default);
                if (defaultItem) {
                    info.resource.set(info.field.name.toLowerCase(), defaultItem.value);
                } else {
                    console.warn("default value for picklist is not a member of the picklist", info);
                }
            }
            if (!info.remote) {
                const input = ['INPUT', 'SELECT'].includes(this.el.tagName)
                    ? this.el
                    : this.el.querySelector('input, select');
                if(input !== null){
                    this.model.saveBlockers?.linkInput(
                        input,
                        info.field.name.toLowerCase()
                    );
                    this.destructors.push(()=>
                        this.model.saveBlockers?.unlinkInput(input)
                    );
                }
            }
            info.field.isRequired && this.el.setAttribute('required','');
            info.resource.on('change:' + info.field.name.toLowerCase(), this.resetValue, this);
            this._render(info);
        },
        remove(){
            this.destructors.forEach(destructor=>destructor());
            Backbone.View.prototype.remove.call(this);
        }
    });

