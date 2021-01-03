"use strict";

const Backbone = require('./backbone');
const React = require('react');
const ReactDOM = require('react-dom');
const navigation = require('./navigation');
const WBPlanView = require('./components/wbplanview').default;

module.exports = Backbone.View.extend({
    __name__: "PlanView",
    initialize({wb}) {
        this.wb = wb;
        this.wbtemplatePromise = this.wb.rget('workbenchtemplate');
        this.mappingIsTemplated = this.wb.get('ownerPermissionLevel')===1;
    },
    render(){
        navigation.addUnloadProtect(this, 'This mapping has not been saved.');
        this.el.setAttribute('id','wbplanview');
        ReactDOM.render(<>
            <WBPlanView
                wb={this.wb}
                wbtemplatePromise={this.wbtemplatePromise}
                mappingIsTemplated={this.mappingIsTemplated}
                handleUnload={this.handleUnload.bind(this)}
            />
        </>, this.el);
        return this;
    },
    handleUnload(){
        navigation.removeUnloadProtect(this);
    },
    remove(){
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
        this.handleUnload();
    }
});