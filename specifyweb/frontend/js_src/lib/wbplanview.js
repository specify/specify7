"use strict";

require("../css/workbench/main.css");

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const template = require('./templates/wb_upload/main.html');
const navigation = require('./navigation.js');
const mappings = require('./wb_upload/mappings.js');
const upload_plan_converter = require('./wb_upload/upload_plan_converter.js');


const PlanView = Backbone.View.extend({

    
    __name__: "PlanView",
    events: {
        'click #button__save_upload_plan': 'save_plan',
        'click #button__mappings_cancel': 'go_back',
    },

    initialize({wb}) {
        this.wb = wb;
        this.wbtemplatePromise = this.wb.rget('workbenchtemplate');
    },
    render() {

        this.el.innerHTML = template();
        this.el.setAttribute('id','screen__mapping');

        _.defer(() => this._render());
        return this;

    },
    _render() {
        this.wbtemplatePromise
            .done(wbtemplate => {
                const upload_plan = wbtemplate.get('remarks');
                return wbtemplate.rget('workbenchtemplatemappingitems')
                    .then(mappings => _['sortBy'](mappings.models, mapping => mapping.get('viewOrder')))
                    .then(mappings => _.invoke(mappings, 'get', 'caption'))
                    .done(headers => {
                        mappings.constructor();

                        function wait_for_constructor_to_finish(){
                            if(typeof mappings.tables === "undefined")
                                setTimeout(wait_for_constructor_to_finish,10);
                            else
                                mappings.set_headers(headers, upload_plan);
                        }
                        wait_for_constructor_to_finish();

                    });
            });
    },
    save_plan(event) {

        event.currentTarget.setAttribute('disabled', 'disabled');
        this.go_back(event,true);

    },
    go_back(event,commit_changes=false){
        this.wbtemplatePromise.done(wbtemplate => {

            if(commit_changes)
                wbtemplate.set('remarks', upload_plan_converter.get_upload_plan());

            wbtemplate.save().done(() => {
                navigation.go(`/workbench/${this.wb.id}/`);
            });
        });
    }
});

module.exports = PlanView;
