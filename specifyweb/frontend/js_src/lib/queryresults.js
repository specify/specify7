"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');
var schema    = require('./schema.js');
var dataobjformatters = require('./dataobjformatters.js');
var fieldformat = require('./fieldformat.js');


function auditedObjFormatter(fieldSpecs, model, localize) {
    this.fieldSpecs = fieldSpecs;
    this.model = model;
    this.localize = localize;
   
    this.auditObjFlds = [
        'spauditlog.parentrecordid',
        'spauditlog.recordid',
        'spauditlogfield.oldvalue',
        'spauditlog.newvalue'
    ];

    this.auditObjReqFlds = [
        'spauditlog.parenttablenum',
        'spauditlog.tablenum'
    ];

    this.fieldSpecFullName = function(spec) {
        return (spec.table.name + '.' + (spec.getField() ? spec.getField().name : '')).toLowerCase();
    };
        
    this.buildFldsToSet = function() {
        var result = [];
        for (var i = 0; i < this.fieldSpecs.length; i++) {
            var r = this.auditObjReqFlds.indexOf(this.fieldSpecFullName(this.fieldSpecs[i]));
            if (r >= 0) {
                result.push({name: this.auditObjReqFlds[r].split('.')[1], idx: i});
            }
        }
        return result;
    };

    this.fldsToSet = this.buildFldsToSet();
    
    this.auditObjFormatRequired = function() {
        return _.find(this.fieldSpecs, function(fieldSpec) {
            var tblName = fieldSpec.table.name.toLowerCase();
            var fld = fieldSpec.getField();
            var fldName = fld ? fld.name.toLowerCase() : '';
            return this.auditObjFlds.indexOf(tblName + '.' + fldName) >= 0;
        }, this);
    };
    this.active = this.auditObjFormatRequired();
    
    this.reqAuditFormatFldsSelected = function() {
        var finder = function(reqFld, fieldSpec) {
            return reqFld[0] == fieldSpec.table.name.toLowerCase()
                && reqFld[1] == fieldSpec.getField().name.toLowerCase();
        };
        var toFind = {parentTableNum: ['spauditlog','parenttablenum'],
                      tableNum: ['spauditlog','tablenum'],
                      fieldName: ['spauditlogfield','fieldname']};
        for (var f = 0; f < this.fieldSpecs.length; f++) {
            var tblName = this.fieldSpecs[f].table.name.toLowerCase();
            if (['spauditlog', 'spauditlogfield'].indexOf(tblName) >= 0) {
                var fldName = this.fieldSpecs[f].getField().name.toLowerCase();
                var findee;
                if (fldName == 'parentrecordid') {
                    findee = toFind.parentTableNum;
                } else if (fldName == 'recordid') {
                    findee = toFind.tableNum;
                } else if (['oldvalue','newvalue'].indexOf(fldName) >= 0) {
                    findee = toFind.fieldName;
                } else {
                    //if the field happens to be in the toFind list remove it 'cause we found it
                    delete toFind[(_.invert(toFind))[[tblName, fldName].toString()]];
                }
                if (findee) { 
                    if (!_.find(this.fieldSpecs, finder.bind(this, findee))) {
                        return false;
                    } else {
                        delete toFind[(_.invert(toFind))[findee.toString()]];
                    }
                }
                if (_.size(toFind) == 0) {
                    break;
                }
            }
        }
        return true;
    };

    this.setResourceReqFlds = function(resource, resultrow) {
        _.forEach(this.fldsToSet, function(fld) {
            if (!resource.get(fld.name)) {
                resource.set(fld.name, resultrow[fld.idx + 1]);
            }
        }, this);
        return resource;
    };

    this.format = function(field, result, resource, cell, value) {
        var afkModel = this.getAuditLogForeignKeyModel(field, result, resource);
        if (afkModel) {
            if (this.fieldsToLocalize.indexOf(field.name.toLowerCase()) >= 0) {
                cell.text(this.localize(field, value, afkModel));
            } else {
                var fko = new afkModel.LazyCollection({filters: {id: value}});   
                fko.fetch({limit: 1}).done(function(){
                    dataobjformatters.format(fko.models[0]).done(function(str){
                        cell.text(str == null || str == '' ? afkModel.name + ':{' + value + '}' : str);
                    });
                });
            }
        } 
    };

    this.localize = function(field, value, model) {
        var fldName = field.name.toLowerCase();
        if (['tablenum', 'parenttablenum'].indexOf(fldName) >= 0) 
            return model.getLocalizedName();
        var fld = model.getField(value.toLowerCase());
        if (fld)
            return fld.getLocalizedName();
        return value;
    };
    
    this.getAuditedField = function(field, result, resource) {
        for (var i = 0; i < this.fieldSpecs.length; i++) {
            var fld = this.fieldSpecs[i].getField();
            if (fld && fld.name.toLowerCase() == 'fieldname') {
                var auditedFldName = result[i+1];
                break;
            }
        }
        if (auditedFldName) {
            var tableNum = resource.get('tablenum');
            var model = isNaN(tableNum) ? schema.models[tableNum] : schema.getModelById(tableNum);
            return model.getField(auditedFldName);
        } else {
            return null;
        }
    };

    this.fieldsToLocalize = ['tablenum','parenttablenum','fieldname'];
    
    this.getAuditLogForeignKeyModel = function(field, result, resource) {
        var fldNames = ['recordid','parentrecordid'];
        if (this.localize) {
            fldNames = fldNames.concat(this.fieldsToLocalize);
        }
        if (fldNames.indexOf(field.name.toLowerCase()) >= 0) {
            var tableNum = resource.get('tablenum');
            return isNaN(tableNum) ? schema.models[tableNum] : schema.getModelById(tableNum);
        }
        if (['newvalue','oldvalue'].indexOf(field.name.toLowerCase()) >= 0) {
            var auditedFld = this.getAuditedField(field, result, resource);
            if (auditedFld && auditedFld.isRelationship) {
                return schema.models[auditedFld.relatedModelName];
            }
        }
        return null;
    };

}

    var QueryResultsView = Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.fieldSpecs = options.fieldSpecs;
            this.linkField = options.linkField || 0;
            this.model = options.model;
            this.auditObjFormatter = new auditedObjFormatter(this.fieldSpecs, this.model, true);
            this.format = options.format && this.auditObjFormatter.active;
            this.forceResourceLoad = this.format && this.auditObjFormatter.active && !this.auditObjFormatter.reqAuditFormatFldsSelected();

            console.log('QueryResultsView options:', options);
        },
        detectEndOfResults: function(results) {
            $('.query-results-count').text(results.count);
            return results.results.length < 1;
        },
        renderResult: function(row, fieldSpec, rowHref, result, idx, format, resource) {
            var value = result[idx];
            var cell =  $('<a class="query-result-link">')
                    .prop('href', rowHref)
                    .text(value == null ? '' : value); 
            var field = fieldSpec.getField();
            if (field && format) {
                if (value && this.auditObjFormatter.active) {
                    this.auditObjFormatter.format(field, result, resource, cell, value);
                } else if (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date') {
                    cell.text = fieldformat(field, value);
                }
            }
            row.append($('<td>').append(cell));
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
                if (this.forceResourceLoad) {
                    var siht = this;
                    var lr = new this.model.LazyCollection({filters: {id: result[this.linkField]}});   
                    lr.fetch({limit: 1}).done(function(){
                        siht.addResult(result, table, lr.models[0]);
                    });
                } else {
                    var resource = new this.model.Resource({ id: result[this.linkField] });
                    this.addResult(result, table, this.auditObjFormatter.setResourceReqFlds(resource, result));
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

