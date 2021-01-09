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
        this.header = document.getElementById('site-header');
        this.handleResize = this.handleResize.bind(this);
    },
    render(){
        navigation.addUnloadProtect(this, 'This mapping has not been saved.');
        this.el.classList.add('wbplanview');
        ReactDOM.render(<>
            <WBPlanView
                wb={this.wb}
                wbtemplatePromise={this.wbtemplatePromise}
                removeUnloadProtect={this.removeUnloadProtect.bind(this)}
                mapping_is_templated={this.mappingIsTemplated}
            />
        </>, this.el);
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        return this;
    },
    handleResize(){
        this.el.style.setProperty('--menu_size',`${Math.ceil(this.header.clientHeight)}px`)
    },
    removeUnloadProtect(){
        navigation.removeUnloadProtect(this);
    },
    remove(){
        window.removeEventListener('resize', this.handleResize);
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
        this.removeUnloadProtect();
    }
});