"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';


import schema from './schema';
import specifyform from './specifyform';
import template from './templates/querycbx.html';
import ResourceView from './resourceview';
import {format} from './dataobjformatters';
import whenAll from './whenall';
import parseselect from './parseselect';
import * as navigation from './navigation';
import QueryCbxSearch from './querycbxsearch';
import QueryFieldSpec from './queryfieldspec';
import {load} from './initialcontext';
import {getTreeDef} from './domain';
import resourceapi from './resourceapi';
import userInfo from './userinfo';
import queryText from './localization/query';
import commonText from './localization/common';
import formsText from './localization/forms';
import autocomplete from './autocomplete';
import {formatList} from "./components/internationalization";

let typesearches;
const treemodels = ["geography", "geologictimeperiod", "lithostrat", "storage", "taxon"];

export const fetchContext = load(
  '/context/app.resource?name=TypeSearches',
  'application/xml'
).then((data) => {
  typesearches = data;
});

function isTreeModel(model) {
    return treemodels.indexOf(model.specifyModel.name.toLowerCase()) != -1;
}

function makeQuery(searchFieldStr, q, treeRanks, lowestChildRank, leftSideRels, rightSideRels, qcbx) {
    var query = new schema.models.SpQuery.Resource({}, {noBusinessRules: true});
    query.set({
        'name': "Ephemeral QueryCBX query",
        'contextname': qcbx.relatedModel.name,
        'contexttableid': qcbx.relatedModel.tableId,
        'selectdistinct': false,
        'countonly': false,
        'specifyuser': null,
        'isfavorite': false,
        'ordinal': null,
        'limit': 0
    });
    var fields = query._rget(['fields']); // Cheating, but I don't want to deal with the pointless promise.

    var searchFieldSpec = QueryFieldSpec.fromPath([qcbx.relatedModel.name].concat(searchFieldStr.split('.')));
    var searchField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
    var qstr = qcbx && isTreeModel(qcbx.model) ? '%' + q : q;
    searchField.set(searchFieldSpec.toSpQueryAttrs()).set({
        'sorttype': 0,
        'isdisplay': false,
        'isnot': false,
        'startvalue': qstr,
        'operstart': 15,
        'position': 0
    });
    fields.add(searchField);

    var dispFieldSpec = QueryFieldSpec.fromPath([qcbx.relatedModel.name]);
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

    var extraFields = qcbx.getSpecialConditions(lowestChildRank, treeRanks, leftSideRels, rightSideRels);
    if (extraFields) {
        for (var f = 0; f < extraFields.length; f++) {
            fields.add(extraFields[f]);
        }
    }

    return query;
}

function lookupTypesearch(name) {
    return $('[name="'+name+'"]', typesearches);
}

export default Backbone.View.extend({
    __name__: "QueryCbx",

    events: {
        'click .querycbx-edit, .querycbx-display': 'displayRelated',
        'click .querycbx-add': 'addRelated',
        'click .querycbx-clone': 'cloneRelated',
        'click .querycbx-search': 'openSearch',
        'change input': 'select',
        'blur input': 'blur'
    },
    initialize: function(options) {
        this.populateForm = options.populateForm;
        this.init = options.init || null;
        this.typesearch = options.typesearch || null;
        this.relatedModel = options.relatedModel || null;
        this.forceCollection = options.forceCollection || null;
        if (this.model.isNew() &&
            this.model.specifyModel.name.toLowerCase() === "collectionobject" &&
            this.$el.attr('name') === "cataloger"
           )
        {
            this.model.set('cataloger', userInfo.agent.resource_uri);
        }
        // Hides buttons other than search for purposes of Host Taxon Plugin
        this.hideButtons = !!options.hideButtons;
        if (isTreeModel(this.model)) {
            var fieldName = this.$el.attr('name');
            if (fieldName == 'parent') {
                if (this.model.isNew()) {
                    this.lowestChildRankPromise = $.when(null);
                } else {
                    var children = new this.model.specifyModel.LazyCollection({filters: {parent_id: this.model.id}, orderby: 'rankID'});
                    this.lowestChildRankPromise = children.fetch().pipe(function() {
                        return children.models[0].get('rankid');
                    });
                }
                this.treeRanksPromise = this.getTreeDefinition(this.model)
                    .pipe(def => def.rget('treedefitems'))
                    .pipe(items => items.fetch({limit: 0}).pipe(
                        () => _.sortBy(items.map(item => ({rankid: item.get('rankid'), isenforced: item.get('isenforced')})),
                                       item => item.rankid)
                    ));
            } else if (fieldName == 'acceptedParent') {
                //don't need to do anything. Form system prevents lookups/edits
            } else if (fieldName == 'hybridParent1' || fieldName == 'hybridParent2') {
                //No idea what restrictions there should be, the only obviously required one - that a taxon is not a hybrid of itself, seems to
                //already be enforced
            }
        } else {
            this.lowestChildRankPromise = null;
            this.treeRanksPromise = null;
        }
        if (this.model.specifyModel.name.toLowerCase() === 'collectionrelationship') {
            var leftRels = new schema.models.CollectionRelType.LazyCollection({
                filters: {leftsidecollection_id: schema.domainLevelIds.collection}
            });
            this.leftSideRelsPromise = leftRels.fetch().pipe(function() {
                return _.map(leftRels.models, function(item) {
                    return {'relid': item.id,
                            'rightsidecollectionid': resourceapi.idFromUrl(item.get('rightsidecollection'))};
                });
            });
            var rightRels = new schema.models.CollectionRelType.LazyCollection({
                filters: {rightsidecollection_id: schema.domainLevelIds.collection}
            });
            this.rightSideRelsPromise = rightRels.fetch().pipe(function() {
                return _.map(rightRels.models, function(item) {
                    return {'relid': item.id,
                            'rightsidecollectionid': resourceapi.idFromUrl(item.get('leftsidecollection'))};
                });
            });
        }
    },
    getTreeDefinition: function(model) {
        if (model.isNew()) {
            return getTreeDef(model.specifyModel.name);
        } else {
            return model.rget('definition', true);
        }
    },
    getSpecialConditions: function(lowestChildRank, treeRanks, leftSideRels, rightSideRels) {
        var fields = [];
        if (isTreeModel(this.model)) {
            var tblId = this.model.specifyModel.tableId;
            var tblName = this.model.specifyModel.name.toLowerCase();
            var descFilterField;
            var pos = 2;
            //add not-a-descendant condition
            if (this.model.id) {
                descFilterField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
                descFilterField.set({
                    'fieldname': "nodeNumber",
                    'stringid': tblId + "." + tblName + ".nodeNumber",
                    'tablelist': tblId,
                    'sorttype': 0,
                    'isrelfld': false,
                    'isdisplay': false,
                    'isnot': true,
                    'startvalue': this.model.get("nodenumber") + ',' + this.model.get("highestchildnodenumber"),
                    'operstart': 9,
                    'position': pos++
                });
                fields.push(descFilterField);
            }
            if (this.fieldName === 'parent') {
                //add rank limits
                let nextRankId;
                if (treeRanks != null) {
                    let r;
                    if (this.model.get('rankid')) //original value, not updated with unsaved changes {
                        r = _.findIndex(treeRanks, (rank) => {
                            return rank.rankid == this.model.get('rankid');
                        });
                    nextRankId = 0;
                    if (r && r != -1) {
                        for (var i = r+1; i < treeRanks.length && !treeRanks[i].isenforced; i++);
                        nextRankId = treeRanks[i-1].rankid;
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
                    fields.push(descFilterField);
                }
            } else if (this.fieldName === 'acceptedParent') {
                //nothing to do
            } else if (this.fieldName === 'hybridParent1' || this.fieldName === 'hybridParent2') {
                //nothing to do
            }
        }

        if (this.model.specifyModel.name.toLowerCase() === 'collectionrelationship') {
            var subview = this.$el.parents().filter('td.specify-subview').first();
            var relName = subview.attr('data-specify-field-name');
            if (this.fieldName === 'collectionRelType') {
                //add condition for current collection
                tblId = this.relatedModel.tableId;
                tblName = this.relatedModel.name.toLowerCase();
                descFilterField = new schema.models.SpQueryField.Resource({}, {noBusinessRules: true});
                descFilterField.set({
                    'fieldname': "collectionRelTypeId",
                    'stringid': tblId + "." + tblName + ".collectionRelTypeId",
                    'tablelist': tblId,
                    'sorttype': 0,
                    'isrelfld': false,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': _.pluck(relName === 'leftSideRels' ? leftSideRels : rightSideRels, 'relid').toString(),
                    'operstart': 10,
                    'position': 2
                });
                fields.push(descFilterField);
            } else {
                var relCollId = this.getRelatedCollectionId(leftSideRels, rightSideRels);
                if (relCollId) {
                    this.forceCollection = {id: relCollId};
                }
            }
        }
        return fields;
    },
    getRelatedCollectionId: function(leftSideRels, rightSideRels) {
        if (this.model.specifyModel.name.toLowerCase() === 'collectionrelationship') {
            if (this.fieldName === 'rightSide' || this.fieldName === 'leftSide') {
                var rels = this.fieldName === 'rightSide' ? leftSideRels : rightSideRels;
                var relTypeId = resourceapi.idFromUrl(this.model.get('collectionreltype'));
                var rel = rels.find(function(i){ return i.relid == relTypeId;});
                return rel.rightsidecollectionid;
            }
        }
        return null;
    },
    select: function(_event) {
        const resource = this.autocompleteRecords?.[event.target.value];
        this.model.set(this.fieldName, resource ?? null);
    },
    render: function () {
        var control = this.$el;
        var querycbx = $(template({commonText, formsText}));
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
        field.isRequired && this.$('input').prop('required',true);
        this.isRequired = this.$('input').attr('required');

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
        control.attr('title', queryText('queryBoxDescription')(formatList(fieldTitles)));

        if (!this.readOnly) {
            this.autocomplete = autocomplete({
                input: control[0],
                source: this.makeQuery.bind(this, searchFieldStrs),
            });
            this.autocompleteRecords = undefined;
        }


        this.model.on('change:' + this.fieldName.toLowerCase(), this.fillIn, this);
        this.fillIn();

        return this;
    },
    remove() {
        this.autocomplete?.();
        Backbone.View.prototype.remove.call(this);
    },
    makeQuery: function(searchFieldStrs, value) {
        return new Promise(resolve=>{var siht = this;
            $.when(this.lowestChildRankPromise, this.treeRanksPromise, this.leftSideRelsPromise, this.rightSideRelsPromise).done(function(lowestChildRank, treeRanks, leftSideRels, rightSideRels) {
                var queries = _.map(searchFieldStrs, function(s) {
                    return makeQuery(s, value, treeRanks, lowestChildRank, leftSideRels, rightSideRels, siht);
                }, siht);
                if (siht.forceCollection) {
                    console.log('force query collection id to:', siht.forceCollection.id);
                    _.invoke(queries, 'set', 'collectionid', siht.forceCollection.id);
                }
                var requests = _.map(queries, function(query) {
                    return $.post('/stored_query/ephemeral/', JSON.stringify(query)).pipe(function(data) { return data; });
                });
                whenAll(requests).pipe(siht.processResponse.bind(siht)).done(resolve);
            });
        });
    },
    processResponse: function(responses) {
        this.autocompleteRecords = {};
        return responses.flatMap(({results}) => results).map(result => {
            this.autocompleteRecords[result[1]] =
                new this.relatedModel.Resource({id: result[0]});
            return result[1];
        });
    },
    fillIn() {
        setTimeout(()=>{
            this.model.rget(this.fieldName, true).done((related)=>{
                this.$('.querycbx-edit, .querycbx-display, .querycbx-clone').prop('disabled', !related);
                if (related)
                    this.renderItem(related).done((item)=>
                        this.$('input').val(item.value)
                    );
                else
                    this.$('input').val('');

            });
        },0);
    },
    renderItem: function (resource) {
        return format(resource, this.typesearch.attr('dataobjformatter')).pipe(function(formatted) {
            return { label: formatted, value: formatted, resource: resource };
        });
    },
    openSearch: function(event) {
        var self = this;
        event.preventDefault();

        event.target.ariaPressed = true;

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

        $.when(this.lowestChildRankPromise, this.treeRanksPromise, this.leftSideRelsPromise, this.rightSideRelsPromise).done(function(lowestChildRank, treeRanks, leftSideRels, rightSideRels) {
            var xtraConditions = self.getSpecialConditions(lowestChildRank, treeRanks, leftSideRels, rightSideRels);
            var xtraFilters = [];
            //send special conditions to dialog
            //extremely skimpy. will work only for current known cases
            _.each(xtraConditions, function(x) {
                if (x.get('fieldname') === 'rankId') {
                    xtraFilters.push({field: 'rankId', op: 'lt', value: x.get('startvalue')});
                } else if (x.get('fieldname') === 'nodeNumber') {
                    xtraFilters.push({field: 'nodeNumber', op: 'unbetween', value: x.get('startvalue')});
                 } else if (x.get('fieldname') === 'collectionRelTypeId') {
                     xtraFilters.push({field: 'id', op: 'in', value: x.get('startvalue')});
                } else {
                    console.warn('extended filter not created for:', x);
                }
            });
            self.dialog = new QueryCbxSearch({
                populateForm: self.populateForm,
                forceCollection: self.forceCollection,
                xtraFilters: xtraFilters,
                model: searchTemplateResource,
                selected: function(resource) {
                    self.model.set(self.fieldName, resource);
                }
            }).render().$el.on('remove', function() { self.dialog = null; });
        });
    },
    displayRelated: function(event) {
        event.preventDefault();
        $.when(this.leftSideRelsPromise, this.rightSideRelsPromise).done((leftSideRels, rightSideRels) => {
            const relCollId = this.getRelatedCollectionId(leftSideRels, rightSideRels);
            const collections = userInfo.available_collections.map(c => c[0]);
            if (relCollId && !collections.includes(relCollId)) {
                const otherColl = new schema.models.Collection.LazyCollection({limit: 0, filters: {id: relCollId}});
                otherColl.fetch().done(function() {
                    $(`<div>
                        ${commonText('collectionAccessDeniedDialogHeader')}
                        <p>${commonText('collectionAccessDeniedDialogMessage')(otherColl)}</p>
                    </div>`).dialog({
                        title: commonText('collectionAccessDeniedDialogTitle'),
                        close() { $(this).remove(); },
                        buttons: {
                            [commonText('close')]() { $(this).dialog('close'); }
                        }
                    });
                });
                return;
            } else {
                this.closeDialogIfAlreadyOpen('display');
                var uri = this.model.get(this.fieldName);
                if (!uri) return;
                var related = this.relatedModel.Resource.fromUri(uri);
                this.openDialog('display', related);
            }
        });
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
    closeDialogIfAlreadyOpen: function() {
        this.$el.find('button').attr('aria-pressed',false);
        this.dialog?.dialog('close');
    },
    openDialog: function(mode, related) {

        const buttonsQuery = ['edit','display'].includes(mode) ?
            'button.querycbx-edit, button.querycbx-display' :
            `button.querycbx-${mode}`;
        this.$el.find(buttonsQuery).attr('aria-pressed',true);
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

        this.dialog.dialog({
            position: { my: "left top", at: "left+20 top+20", of: $('main') },
            width: 'auto',
            close: ()=>{
                this.dialog.remove();
                this.dialog = null;
                this.closeDialogIfAlreadyOpen();
            }
        }).parent().delegate('.ui-dialog-title a', 'click', function(evt) {
            evt.preventDefault();
            navigation.go(related.viewUrl());
            _this.dialog.dialog('close');
        });

        if (!related.isNew()) {
            $('<a>', { href: related.viewUrl() })
                .addClass('intercept-navigation')
                .append(`<span class="ui-icon ui-icon-link">${formsText('linkInline')}</span>`)
                .prependTo(this.dialog.closest('.ui-dialog').find('div.ui-dialog-titlebar'));
        }
    },
    dialogIsOpen(){
        return this.$el?.is(':ui-dialog') === true;
    },
    resourceSaved: function(related) {
        this.dialogIsOpen() && this.dialog.dialog('close');
        this.model.set(this.fieldName, related);
        this.fillIn();
    },
    resourceDeleted: function() {
        this.dialogIsOpen() && this.dialog.dialog('close');
        this.model.set(this.fieldName, null);
        this.fillIn();
    },
    changeDialogTitle: function(_resource, title) {
        this.dialogIsOpen() && this.dialog.dialog('option', 'title', title);
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
