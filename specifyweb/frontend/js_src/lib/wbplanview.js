"use strict";

require("../css/wbplanview.css");

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const template = require('./templates/wbplanview.html');
const navigation = require('./navigation.js');
const mappings_main = require('./wb_upload/main.ts');
const upload_plan_converter = require('./wb_upload/upload_plan_converter.ts');
const cache = require('./wb_upload/cache.ts');
const schema = require('./schema.js');
const userInfo = require('./userinfo.js');


const PlanView = Backbone.View.extend({


    __name__: "PlanView",
    events: {
        'click #button__save_upload_plan': 'save_plan',
        'click #button__validate_upload_plan': 'validate_plan',
        'click #button__discard_changes': 'go_back',
        'change #checkbox__use_mapping_as_a_template': 'change_mapping_type',
        'click #button__use_template': 'show_templates',
    },

    initialize({wb}) {
        this.wb = wb;
        this.wbtemplatePromise = this.wb.rget('workbenchtemplate');
        this.mapping_is_a_template = wb.get('ownerPermissionLevel')===1;
    },

    render() {

        this.el.innerHTML = template();
        this.el.setAttribute('id','screen__mapping');
        if(cache.get('ui','hide_hidden_fields'))
            this.el.setAttribute('class','hide_hidden_fields');

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

                        this.headers = headers;

                        const constructor_done_promise = mappings_main.constructor(this.save_plan.bind(this));

                        constructor_done_promise.then(mappings=>{
                            this.mappings = mappings;
                            mappings.set_headers(headers, PlanView.upload_plan);
                            document.getElementById('checkbox__use_mapping_as_a_template').checked = this.mapping_is_a_template;
                        });

                    });
            });
    },

    save_plan(event, ignore_validation=false) {

        if(!ignore_validation && typeof mappings_main.validate() !== "boolean")
            return;

        this.wb.set('ownerPermissionLevel',this.mapping_is_a_template?1:0);
        this.wbtemplatePromise.done(wbtemplate=>
            wbtemplate.set('remarks', upload_plan_converter.get_upload_plan())
        );
        this.wb.save();
        this.go_back();

        if(typeof event !== "undefined")
            event.currentTarget.setAttribute('disabled', 'disabled');

    },

    validate_plan: () => mappings_main.validate(),

    go_back(){
        navigation.removeUnloadProtect(this.mappings);
        navigation.go(`/workbench/${this.wb.id}/`);
    },

    change_mapping_type: function(event){
        this.mapping_is_a_template = event.target.checked;
    },

    show_templates(){

        return new Promise((resolve)=>{
            const wbs = new schema.models.Workbench.LazyCollection({
                filters: { orderby: 'name', ownerpermissionlevel:1 }
            });
            wbs.fetch({ limit: 5000 }).done(function() {
                resolve(wbs.models);
            });
        }).then(wbs=>{

            const wbts = wbs.map(wb=>wb.rget('workbenchtemplate'));
            Promise.all(wbts).then(wbts=>{

                const templates = {};

                for(const wbt of wbts) {
                    let upload_plan;
                    try {
                        upload_plan = JSON.parse(wbt.get('remarks'))
                    }
                    catch(e){
                        continue;
                    }

                    if (
                        typeof upload_plan === "object" &&
                        upload_plan !== null
                    )
                        templates[wbt.get('id')] = {
                            dataset_name: wbt.get('name'),
                            upload_plan: upload_plan,
                        };
                }

                const links = Object.entries(templates).map(([dataset_id,{dataset_name}])=>
                    `<a href="#`+dataset_name+`" data-id="`+dataset_id+`">`+dataset_name+`</a>`
                );

                const dialog = $('<div></div>').dialog({
                    title: "Templates",
                    maxHeight: 400,
                    modal: true,
                    close: function() { $(this).remove(); },
                    buttons: [
                        { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                    ]
                });

                dialog[0].innerHTML = links.join('<br>');

                dialog[0].addEventListener('click',(event)=>{

                    const el = event.target;

                    if(el.tagName === 'A'){
                        event.preventDefault();

                        const id = el.getAttribute('data-id');

                        const template_data = templates[id];

                        if(typeof template_data !== "undefined") {
                            this.mappings.reset_table();
                            this.mappings.set_headers(this.headers, template_data['upload_plan']);
                        }

                        dialog.dialog('close');
                    }

                });

            });

        });

    },

});

module.exports = PlanView;
