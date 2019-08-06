"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');
var schema    = require('./schema.js');
var dataobjformatters = require('./dataobjformatters.js');
var fieldformat = require('./fieldformat.js');


    


    var QueryResultsView = Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.format = options.format;
            this.fieldSpecs = options.fieldSpecs;
            this.linkField = options.linkField || 0;
            this.model = options.model;
            console.log('QueryResultsView options:', options);
        },
        detectEndOfResults: function(results) {
            $('.query-results-count').text(results.count);
            return results.results.length < 1;
        },
        renderResult: function(row, fieldSpec, rowHref, result, idx, format, resource) {
            var value = result[idx];
            var field = fieldSpec.getField();
            if (field && (format || resource.populated)) {
                if (value && resource.specifyModel.name == 'SpAuditLog') {
                    var afkModel = this.getAuditLogForeignKeyModel(field, result, resource);
                    if (afkModel) {
                        var fko = new afkModel.LazyCollection({filters: {id: value}});   
                         fko.fetch({limit: 1}).done(function(){
                            dataobjformatters.format(fko.models[0]).done(function(str){
                                cell.text(str == null || str == '' ? afkModel.name + ':{' + value + '}' : str);
                            });
                        });
                    }
                } else if (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date') {
                    value = fieldformat(field, value);
                }
            }
            var cell =  $('<a class="query-result-link">')
                    .prop('href', rowHref)
                    .text(value == null ? '' : value); 
            row.append($('<td>').append(cell));
        },
        formatValue: function(fieldSpec, value, result, resource) {
            var field = fieldSpec.getField();
            if (!field) return value;
            if (resource.specifyModel.name == 'SpAuditLog') {
                var afkFld = this.getAuditLogForeignKey(field, result, resource);
                if (afkFld) {
                    return fieldformat(field, value);
                }
            }
            if (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date') {
                return fieldformat(field, value);
            }
            return value;
        },
        getAuditedField: function(field, result, resource) {
            for (var i = 0; i < this.fieldSpecs.length; i++) {
                var fld = this.fieldSpecs[i].getField();
                if (fld && fld.name.toLowerCase() == 'fieldname') {
                    var auditedFldName = result[i+1];
                    break;
                }
            }
            if (auditedFldName) {
                var model = schema.getModelById(resource.get('tablenum'));
                return model.getField(auditedFldName);
            } else {
                return null;
            }
        },
        getAuditLogForeignKeyModel: function(field, result, resource) {
            if (['recordid','parentrecordid'].indexOf(field.name.toLowerCase()) >= 0) {
                return schema.getModelById(resource.get('tablenum'));
            }
            if (['newvalue','oldvalue'].indexOf(field.name.toLowerCase()) >= 0) {
                var auditedFld = this.getAuditedField(field, result, resource);
                if (auditedFld && auditedFld.isRelationship) {
                    return schema.models[auditedFld.relatedModelName];
                }
            }
            return null;
        },
        doLoadResource: function() {
            var result = false;
            if (this.model.name == "SpAuditLog") {
                //and relevant format options and fields
                result = true;
            };
            return result;
        },
        resourceLoaded: function(resource, todo) {
            //HEY!!!!!
            //don't need to load fields anymore because getAuditedField() requires FieldName to be a column in the results.
            if (resource.specifyModel.name == "SpAuditLog" /*&& fieldSpecs contains old/new value*/) {
                resource.rget('fields').pipe(function(fields){
                    return fields.fetch({limit: 0}).pipe(function() { return fields; });
                }).done(function(fields) {
                    resource.auditflds = fields;
                    todo();
                });
            } else {
                todo();
            }
        },
        addResult: function(result, table, resource) {
            var row = $('<tr class="query-result">').appendTo(table).data('resource', resource);
            var href = resource.viewUrl();
            _.each(this.fieldSpecs, function(f, i) {
                this.renderResult(row, f, href, result, i+1, this.format, resource);
            }, this);
        },
        addResults: function(results) {
            var table = this.$('table.query-results');
            _.each(results.results, function(result) {
                if (this.doLoadResource()) {
                    var siht = this;
                    var lr = new this.model.LazyCollection({filters: {id: result[this.linkField]}});   
                    lr.fetch({limit: 1}).done(function(){
                        siht.resourceLoaded(lr.models[0],  siht.addResult.bind(siht, result, table, lr.models[0]));
                    });
                } else {
                    var resource = new this.model.Resource({ id: result[this.linkField] });
                    this.addResult(result, table, resource);
                }
            }, this);
            return results.results.length;
        },
        openRecord: function(evt) {
            evt.preventDefault();
            window.open($(evt.currentTarget).attr('href'));
        }
    });

module.exports = QueryResultsView;

