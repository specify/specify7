"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('./backbone.js');

var UIPlugin = require('./uiplugin.js');
var schema   = require('./schema.js');
var QueryCbx = require('./querycbx.js');
var whenall  = require('./whenall.js');

    var AgentForDiv = Backbone.View.extend({
        __name__: "AgentForDivisionSelector",
        tagName: 'tr',
        initialize: function(options) {
            this.populateForm = options.populateForm;
            this.collection = options.collection;
            this.division = options.division;
            this.agent = options.agent;

            // Kind of kludgie but we need some resource with an agent field
            // for the QueryCBX to work with;
            this.model = new schema.models.AgentAttachment.Resource();
            this.agent && this.model.set('agent', this.agent);
        },
        render: function() {
            $('<td>').text(this.division.get('name')).appendTo(this.el);
            var control = $('<td><input type="text" name="agent"></td>').appendTo(this.el);

            new QueryCbx({
                populateForm: this.populateForm,
                el: $('input', control),
                model: this.model,
                relatedModel: schema.models.Agent,
                forceCollection: this.collection,
                hideButtons: true,
                init: {name: 'Agent'}
            }).render();

            return this;
        },
        save: function(user) {
            if (this.model.get('agent') != (this.agent && this.agent.get('resource_uri'))) {
                this.model.rget('agent', true).done(this.gotNewAgent.bind(this, user));
            }
        },
        gotNewAgent: function(user, newAgent) {
            // The following is not atomic, but the ramifications of
            // one update succeeding without the other are not severe
            // enough to worry about. Someone will notice they can't
            // log in and then it can be fixed.
            user.rget('agents', true).pipe(function(agents) {
                return whenall(agents.map(function(agent) { return agent.set('specifyuser', null).save(); }));
            }).pipe(function() {
                return newAgent && newAgent.set('specifyuser', user).save();
            });
        }
    });

    var Dialog = Backbone.View.extend({
        __name__: "UserAgentDialog",
        initialize: function(options) {
            this.user = options.user;
            this.divInfos = options.divInfos;
        },
        render: function() {
            this.$el.attr('title', "Set User Agents");
            var controls = _.map(this.divInfos, function(divInfo) { return new AgentForDiv(divInfo); });
            _.invoke(controls, 'render');
            $('<table>').append(_.pluck(controls, 'el')).appendTo(this.el);

            var user = this.user;
            this.$el.dialog({
                modal: true,
                width: 'auto',
                close: function() { $(this).remove(); },
                buttons: [
                    {text: 'Update', click: function() { _.invoke(controls, 'save', user); $(this).dialog('close'); }},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        }
    });

module.exports = UIPlugin.extend({
        __name__: "UserAgentsUIPlugin",
        events: {
            'click': 'click'
        },
        render: function() {
            this.$el.attr('value', 'Set Agents');
            this.model.isNew() && this.$el.attr('title', 'Save user before adding agents.').prop('disabled', true);
            return this;
        },
        click: function(event) {
            var collections = new schema.models.Collection.LazyCollection();
            collections.fetch({limit: 0}).done(this.gotCollections.bind(this, collections));
        },
        gotCollections: function(collections) {
            var divInfos = {};
            var promises = collections.map(function(col) {
                return col.rget('discipline.division', true).done(function(division) {
                    divInfos[division.id] = {division: division, collection: col};
                });
            });
            var user = this.model;
            $.when(user.rget('agents', true), whenall(promises)).done(function(agents) {
                _.each(divInfos, function(divInfo) {
                    divInfo['agent'] = agents.find(function(agent) { return agent.get('division') == divInfo.division.get('resource_uri'); });
                });
                new Dialog({user: user, divInfos: divInfos, populateForm: this.populateForm}).render();
            });
        }
    }, { pluginsProvided: ['UserAgentsUI'] });

