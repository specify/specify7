"use strict";

require("../css/wbmappings.css");

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const template = require('./templates/wbmappings.html');
const navigation = require('./navigation.js');
const mappings_main = require('./wb_upload/main.js');
const upload_plan_converter = require('./wb_upload/upload_plan_converter.js');
// const dom_helper = require('./wb_upload/dom_helper.js');
// const helper = require('./wb_upload/helper.js');


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

                        //const new_headers = helper.fix_headers(headers);

                        // if(typeof new_headers !== 'boolean'){//update headers and upload plan
                        //
                        // }


                        //const /*[*/set_headers/*, headers_container]*/ = mappings_main.constructor().bind(mappings_main);
                        this.mappings = mappings_main.constructor();

                        //PlanView.headers_container = headers_container;

                        const wait_for_constructor_to_finish = () =>{
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
