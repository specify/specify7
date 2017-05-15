"use strict";

var $                = require('jquery');
var _                = require('underscore');
var Backbone         = require('./backbone.js');


var schema            = require('./schema.js');
var specifyform       = require('./specifyform.js');
var template          = require('./templates/querycbx.html');
var ResourceView      = require('./resourceview.js');
var dataobjformatters = require('./dataobjformatters.js');
var whenAll           = require('./whenall.js');
var parseselect       = require('./parseselect.js');
var navigation        = require('./navigation.js');
var saveblockers      = require('./saveblockers.js');
var ToolTipMgr        = require('./tooltipmgr.js');
var QueryCbxSearch    = require('./querycbxsearch.js');
var QueryFieldSpec    = require('./queryfieldspec.js');
var initialContext    = require('./initialcontext.js');

var dataobjformat = dataobjformatters.format;

var typesearches;
var treemodels = ["geography", "geologictimeperiod", "lithostrat", "storage", "taxon"];

initialContext.load('app.resource?name=TypeSearches', data => typesearches = data);

function isTreeModel(model) {
    return treemodels.indexOf(model.specifyModel.name.toLowerCase()) != -1;
}

function makeQuery(model, relatedModel, searchFieldStr, q, treeRanks, lowestChildRank) {
    var query = new schema.models.SpQuery.Resource({}, {noBusinessRules: true});
    query.set({
        'name': "Ephemeral QueryCBX query",
        'contextname': relatedModel.name,
        'contexttableid': relatedModel.tableId,
        'selectdistinct': false,
        'countonly': false,
        'specifyuser': null,
        'isfavorite': false,
        'ordinal': null,
        'limit': 0
    });
    var fields = query._rget(['fields']); // Cheating, but I don't want to deal with the pointless promise.

    var searchFieldSpec = QueryFieldSpec.fromPath([relatedModel.name].concat(searchFieldStr.split('.')));
    var searchField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
    searchField.set(searchFieldSpec.toSpQueryAttrs()).set({
        'sorttype': 0,
        'isdisplay': false,
        'isnot': false,
        'startvalue': q,
        'operstart': 15,
        'position': 0
    });
    fields.add(searchField);

    
    var dispFieldSpec = QueryFieldSpec.fromPath([relatedModel.name]);
    var dispField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
    dispField.set(dispFieldSpec.toSpQueryAttrs()).set({
        'sorttype': 1,
        'isdisplay': true,
        'isnot': false,
        'startvalue': '',
        'operstart': 0,
        'position': 1
    });
    fields.add(dispField);

    if (isTreeModel(model)) {
        var tblId = model.specifyModel.tableId;
        var tblName = model.specifyModel.name.toLowerCase();
        var descFilterField;
        var pos = 2;
         if (model.id) {
            descFilterField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
            descFilterField.set({
                'fieldname': "nodeNumber",
                'stringid': tblId + "." + tblName + ".nodeNumber",
                'tablelist': tblId,
                'sorttype': 0,
                'isrelfld': false,
                'isdisplay': false,
                'isnot': true,
                'startvalue': model.get("nodenumber") + ',' + model.get("highestchildnodenumber"),
                'operstart': 9,
                'position': pos++
            });
            fields.add(descFilterField);
        }
        if (treeRanks != null) {
            if (model.get('rankid')) //original value, not updated with unsaved changes {
                var r = _.findIndex(treeRanks, function(rank) {
                    return rank.rankid == model.get('rankid');
                });
                if (r != -1) {
                    for (var i = r+1; i < treeRanks.length && !treeRanks[i].isenforced; i++);
                    var nextRankId = treeRanks[i-1].rankid;
                }   
            }
            var lastTreeRankId = _.last(treeRanks).rankid;
            
            var lowestRankId = Math.min(lastTreeRankId, nextRankId || lastTreeRankId, lowestChildRank || lastTreeRankId);
            if (lowestRankId != 0) {
                descFilterField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
                descFilterField.set({
                    'fieldname': "rankId",
                    'stringid': tblId + "." + tblName + ".rankId",
                    'tablelist': tblId,
                    'sorttype': 0,
                    'isrelfld': false,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': lowestRankId,
                    'operstart': 3,
                    'position': pos++
                });
                fields.add(descFilterField);
            }
    }
    
    return query;
}

function lookupTypesearch(name) {
    return $('[name="'+name+'"]', typesearches);
}

var QueryCbx = Backbone.View.extend({
    __name__: "QueryCbx",

    events: {
        'click .querycbx-edit, .querycbx-display': 'displayRelated',
        'click .querycbx-add': 'addRelated',
        'click .querycbx-clone': 'cloneRelated',
        'click .querycbx-search': 'openSearch',
        'autocompleteselect': 'select',
        'blur input': 'blur'
    },
    initialize: function(options) {
        this.populateForm = options.populateForm;
        this.init = options.init || null;
        this.typesearch = options.typesearch || null;
        this.relatedModel = options.relatedModel || null;
        this.forceCollection = options.forceCollection || null;
        // Hides buttons other than search for purposes of Host Taxon Plugin
        this.hideButtons = !!options.hideButtons;
        if (isTreeModel(this.model)) {
            var fieldName = this.$el.attr('name');
            if (fieldName == 'parent') {
                this.lowestChildRankPromise = this.model.isNew() ? $.when(null) :
                    this.model.rget('children').pipe(function(children) {
                        return children
                            .fetch({limit: 1, filters: { orderby: 'rankID'}})
                            .pipe(function() {
                                return children.pluck('rankid')[0];
                            });
                    });
                this.treeRanksPromise = this.model.rget('parent.definition', true).pipe(function(def) {
                    var defid = def.id;
                    var defItemModel = schema.getModel(def.specifyModel.name + 'Item'); //another less than good idea
                    var items = new defItemModel.LazyCollection({limit: 0, filters: {treedef: defid}, orderby: 'rankID'});
                    return items.fetch().pipe(function(){
                        //neither the limit nor the orderby filter above seem to be working?...
                        //return items.models[items.models.length - 1].get('rankid');
                        return _.map(items.models, function(item) {
                            return {'rankid': item.get('rankid'), 'isenforced': item.get('isenforced')};
                        });
                    });
                });
            } else if (fieldName == 'acceptedParent') {
                //need different restrictions -- if it's ever enabled on forms
                this.lowestChildRankPromise = null;
                this.treeRanksPromise = null;
            } else if (fieldName == 'hybridParent1' || fieldName == 'hybridParent2') {
                //no idea what kind of restrictions are needed for these...
                this.lowestChildRankPromise = null;
                this.treeRanksPromise = null;
            }
        } else {
            this.lowestChildRankPromise = null;
            this.treeRanksPromise = null;
        }
    },
    select: function (event, ui) {
        var resource = ui.item.resource;
        this.model.set(this.fieldName, resource);
    },
    render: function () {
        var control = this.$el;
        var querycbx = $(template());
        control.replaceWith(querycbx);
        this.setElement(querycbx);
        this.$('input').replaceWith(control);
        this.fieldName = control.attr('name');
        var field = this.model.specifyModel.getField(this.fieldName);
        this.fieldName = field.name; // the name from the form might be an alias.

        this.readOnly = control.prop('readonly') || field.readOnly;
        this.inFormTable = control.hasClass('specify-field-in-table');
        if (this.readOnly || this.inFormTable) {
            this.$('.querycbx-edit, .querycbx-add, .querycbx-search, .querycbx-clone').hide();
        }
        if (!this.readOnly || this.inFormTable) {
            this.$('.querycbx-display').hide();
        }
        if (this.hideButtons) {
            this.$('.querycbx-edit, .querycbx-add, .querycbx-clone, .querycbx-display').hide();
        }
        this.readOnly && control.prop('readonly', true);
        field.isRequired && this.$('input').addClass('specify-required-field');
        this.isRequired = this.$('input').is('.specify-required-field');

        var init = this.init || specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        if (!init.clonebtn || init.clonebtn.toLowerCase() !== "true") this.$('.querycbx-clone').hide();

        this.relatedModel || (this.relatedModel = field.getRelatedModel());
        this.typesearch || (this.typesearch = lookupTypesearch(init.name));

        var selectStmt = this.typesearch.text();
        var mapper = selectStmt ? parseselect.colToFieldMapper(this.typesearch.text()) : _.identity;
        var searchFieldStrs = _.map(this.typesearch.attr('searchfield').split(',').map($.trim), mapper);
        var searchFields = _.map(searchFieldStrs, this.relatedModel.getField, this.relatedModel);
        var fieldTitles = searchFields.map(
            f => (f.model === this.relatedModel ? '' : f.model.getLocalizedName() + " / ") + f.getLocalizedName());
        control.attr('title', 'Searches: ' + fieldTitles.join(', '));

        this.readOnly || control.autocomplete({
            minLength: 1,
            source: this.makeQuery.bind(this, searchFieldStrs)
        });

        this.model.on('change:' + this.fieldName.toLowerCase(), this.fillIn, this);
        this.fillIn();

        this.toolTipMgr = new ToolTipMgr(this, control).enable();
        this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, this.fieldName, control);
        return this;
    },
    makeQuery: function(searchFieldStrs, request, response) {
        var siht = this;
        $.when(this.lowestChildRankPromise, this.treeRanksPromise).done(function(lowestChildRank, treeRanks) {
            var queries = _.map(searchFieldStrs, function(s) {
                return makeQuery(siht.model, siht.relatedModel, s, request.term, treeRanks, lowestChildRank);
            }, siht);
            if (siht.forceCollection) {
                console.log('force query collection id to:', siht.forceCollection.id);
                _.invoke(queries, 'set', 'collectionid', siht.forceCollection.id);
            }
            var requests = _.map(queries, function(query) {
                return $.post('/stored_query/ephemeral/', JSON.stringify(query)).pipe(function(data) { return data; });
            });
            whenAll(requests).pipe(siht.processResponse.bind(siht)).done(response);
        });
    },                
    processResponse: function(resps) {
        var data = _.pluck(resps, 'results');
        var allResults = _.reduce(data, function(a, b) { return a.concat(b); }, []);
        return _.map(allResults, function(row) {
            return {
                label: row[1],
                value: row[1],
                resource: new this.relatedModel.Resource({ id: row[0] })
            };
        }, this);
    },
    fillIn: function () {
        var _this = this;
        function fillIn() {
            _this.model.rget(_this.fieldName, true).done(function(related) {
                if (related) {
                    _this.renderItem(related).done(function(item) {
                        _this.$('input').val(item.value);
                    });
                    _this.model.saveBlockers.remove('fieldrequired:' + _this.fieldName);
                } else {
                    _this.$('input').val('');
                    _this.isRequired && _this.model.saveBlockers.add(
                        'fieldrequired:' + _this.fieldName, _this.fieldName, 'Field is required', true);
                }
            });
        }
        _.defer(fillIn);
    },
    renderItem: function (resource) {
        var rget = resource.rget.bind(resource);
        return dataobjformat(resource, this.typesearch.attr('dataobjformatter')).pipe(function(formatted) {
            return { label: formatted, value: formatted, resource: resource };
        });
    },
    openSearch: function(event, ui) {
        var self = this;
        event.preventDefault();

        if (self.dialog) {
            // if the open dialog is for search just close it and don't open a new one
            var closeOnly = self.dialog.hasClass('querycbx-dialog-search');
            self.dialog.dialog('close');
            if (closeOnly) return;
        }
        var searchTemplateResource = new this.relatedModel.Resource({}, {
            noBusinessRules: true,
            noValidation: true
        });

        self.dialog = new QueryCbxSearch({
            populateForm: self.populateForm,
            forceCollection: self.forceCollection,
            model: searchTemplateResource,
            selected: function(resource) {
                self.model.set(self.fieldName, resource);
            }
        }).render().$el.on('remove', function() { self.dialog = null; });
    },
    displayRelated: function(event) {
        event.preventDefault();
        var mode = 'display';
        this.closeDialogIfAlreadyOpen(mode);

        var uri = this.model.get(this.fieldName);
        if (!uri) return;
        var related = this.relatedModel.Resource.fromUri(uri);
        this.openDialog(mode, related);
    },
    addRelated: function(event) {
        event.preventDefault();
        var mode = 'add';
        this.closeDialogIfAlreadyOpen(mode);

        var related = new this.relatedModel.Resource();
        this.openDialog(mode, related);
    },
    cloneRelated: function(event) {
        event.preventDefault();
        var mode = 'clone';
        this.closeDialogIfAlreadyOpen(mode);

        var uri = this.model.get(this.fieldName);
        if (!uri) return;
        var related = this.relatedModel.Resource.fromUri(uri);
        related.fetch()
            .pipe(function() { return related.clone(); })
            .done(this.openDialog.bind(this, mode));
    },
    closeDialogIfAlreadyOpen: function(mode) {
        if (this.dialog) {
            // if the open dialog is for selected mode, just close it and don't open a new one
            var closeOnly = this.dialog.hasClass('querycbx-dialog-' + mode);
            this.dialog.dialog('close');
            if (closeOnly) return;
        }
    },
    openDialog: function(mode, related) {
        this.dialog = $('<div>', {'class': 'querycbx-dialog-' + mode});

        new ResourceView({
            populateForm: this.populateForm,
            el: this.dialog,
            model: related,
            mode: this.readOnly ? 'view' : 'edit',
            noAddAnother: true,
            noHeader: true
        }).render()
            .on('saved', this.resourceSaved, this)
            .on('deleted', this.resourceDeleted, this)
            .on('changetitle', this.changeDialogTitle, this);

        var _this = this;
        this.dialog.dialog({
            position: { my: "left top", at: "left+20 top+20", of: $('#content') },
            width: 'auto',
            close: function() { $(this).remove(); _this.dialog = null; }
        }).parent().delegate('.ui-dialog-title a', 'click', function(evt) {
            evt.preventDefault();
            navigation.go(related.viewUrl());
            _this.dialog.dialog('close');
        });

        if (!related.isNew()) {
            $('<a>', { href: related.viewUrl() })
                .addClass('intercept-navigation')
                .append('<span class="ui-icon ui-icon-link">link</span>')
                .prependTo(this.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first'));
        }
    },
    resourceSaved: function(related) {
        this.dialog.dialog('close');
        this.model.set(this.fieldName, related);
        this.fillIn();
    },
    resourceDeleted: function() {
        this.dialog.dialog('close');
        this.model.set(this.fieldName, null);
        this.fillIn();
    },
    changeDialogTitle: function(resource, title) {
        this.dialog && this.dialog.dialog('option', 'title', title);
    },
    blur: function() {
        var val = this.$('input').val().trim();
        if (val === '' && !this.isRequired) {
            this.model.set(this.fieldName, null);
        } else {
            this.fillIn();
        }
    }
});

module.exports =  QueryCbx;

