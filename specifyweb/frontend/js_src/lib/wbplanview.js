"use strict";

import navigation from './navigation';

const Backbone = require('backbone');
const ReactDOM = require('react-dom');
const WBPlanView = require('./components/wbplanview.tsx');

module.exports = Backbone.View.extend({
    __name__: "PlanView",
    initialize({wb}) {
        this.wb = wb;
        this.wbtemplatePromise = this.wb.rget('workbenchtemplate');
        this.mappingIsTemplated = this.wb.get('ownerPermissionLevel')===1;
    },
    render(){
        ReactDOM.render(<WBPlanView
            wb={this.wb}
            wbtemplatePromise={this.wbtemplatePromise}
            mappingIsTemplated={this.mappingIsTemplated}
            handleGoBack={this.handleUnload}
        />, this.el);
        return this;
    },
    handleUnload(){
        this.remove();
    },
    remove(){
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
    }
});