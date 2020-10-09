"use strict";

require("../css/wbplanview.css");

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const template = require('./templates/wbplanview.html');
const navigation = require('./navigation.js');
const mappings_main = require('./wb_upload/main.js');
const upload_plan_converter = require('./wb_upload/upload_plan_converter.js');


const PlanView = Backbone.View.extend({

    
    __name__: "PlanView",
    events: {
        'click #button__save_upload_plan': 'save_plan',
        'click #button__discard_changes': 'go_back',
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

                const upload_plan_string = wbtemplate.get('remarks');
                let upload_plan;

                try {
                    upload_plan = JSON.parse(upload_plan_string);
                } catch (exception) {

                    if(!(exception instanceof SyntaxError))//only catch JSON parse errors
                        throw exception;

                    upload_plan = false;

                }

                if(typeof upload_plan !== "object" || upload_plan === null || typeof upload_plan['baseTableName'] === "undefined")
                    upload_plan = false;

                PlanView.upload_plan = upload_plan;

                return wbtemplate.rget('workbenchtemplatemappingitems')
                    .done(mappings => {
                        const sorted = mappings.sortBy( mapping => mapping.get('viewOrder'));
                        const headers = _.invoke(sorted, 'get', 'caption');

                        PlanView.mappings = mappings;

                        this.mappings = mappings_main.constructor();

                        const wait_for_constructor_to_finish = () =>{//TODO: replace this with a promise
                            if(!mappings_main.constructor_has_run)
                                setTimeout(wait_for_constructor_to_finish,10);
                            else
                                this.mappings.set_headers(headers, PlanView.upload_plan);
                        }
                        wait_for_constructor_to_finish();

                    });
            });
    },
    save_plan(event) {

        if(typeof mappings_main.validate() === "boolean"){
            this.go_back(event,true);
            event.currentTarget.setAttribute('disabled', 'disabled');
        }

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
