"use strict";

const Backbone = require('./backbone');
const React = require('react');
const ReactDOM = require('react-dom');

module.exports = ({
    module_name,
    initialize,
    render_pre,
    render_post,
    remove,
    Coomponent,
    component_props
})=>{
    Backbone.View.extend({
        __name__: module_name,
        initialize: initialize,
        render(){
            render_pre();
            ReactDOM.render(<>
                <Component
                    {...component_props}
                />
            </>, this.el);
            render_post();
            return this;
        },
        remove(){
            remove();
            ReactDOM.unmountComponentAtNode(this.el);
            Backbone.View.prototype.remove.call(this);
            this.removeUnloadProtect();
        }
    });
};