"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var navigation = require('./navigation.js');
var domain     = require('./domain.js');
var schema     = require('./schema.js');
var UserTools  = require('./usertools.js');
var userInfo   = require('./userinfo.js');
var router     = require('./router.js');
var querystring = require('./querystring.js');
const NotificationsUI = require('./notifications.js');
const commonText = require('./localization/common').default;


var toolModules = [
    require('./toolbardataentry.js'),
    require('./toolbarinteractions.js'),
    require('./toolbartrees.js'),
    require('./toolbarrecordsets.js'),
    require('./toolbarquery.js'),
    require('./toolbarreport.js'),
    require('./toolbarattachments.js'),
    require('./toolbarwbs.js'),
    require('./toolbarmasterkey.js'),
    require('./toolbarusers.js'),
    require('./toolbartreerepair.js'),
    require('./toolbarresources.js'),
    require('./toolbardwca.js'),
    require('./toolbarforceupdate.js'),
];

    var ExpressSearchInput = Backbone.View.extend({
        __name__: "ExpressSearchInput",
        events: {
            'submit': 'search'
        },
        search: function(evt) {
            var query, url;
            evt.preventDefault();
            query = this.$('.express-search-query').val().trim();
            if (query) {
                url = querystring.param('/specify/express_search/', {q: query});
                navigation.go(url);
            }
        }
    });


module.exports = Backbone.View.extend({
        __name__: "HeaderUI",
        events: {
            'click #site-nav a': 'siteNavClick',
            'click .username': 'openUserTools',
            'change #user-tools select': 'changeCollection'
        },
        el: 'header',
        initialize: function(options) {
            this.toolModules = toolModules.filter(function(mod){
                return !(_.isFunction(mod.disabled) ? mod.disabled(userInfo) : mod.disabled);
            });

            this.visibleTools = this.toolModules.filter(function(t) { return t.icon != null; });
            this.hiddenTools = this.toolModules.filter(function(t) { return t.icon == null; });

            _.each(this.toolModules, function(module) {
                router.route('task/' + module.task + '/', 'startTask', module.execute.bind(module));
            });
        },
        render: function() {
            new ExpressSearchInput({el: this.$('#express-search')});
            new NotificationsUI({el: this.$('#site-notifications')});
            if(userInfo.isauthenticated){
                this.$('#user-tools .username').text(userInfo.name);
                this.$('#user-tools .login').hide();
            }
            else
                this.$('#user-tools a.login')
                    .text(commonText('logIn'))
                    .attr('href', '/accounts/logout/');

            var collectionSelector = this.$('#user-tools select');
            $.get('/context/collection/').done(({current, available}) => collectionSelector.append(
                _.map(available,
                      ([id, name]) => $('<option>', {selected: id === current, value: id, text: name})[0])));

            var lis = this.visibleTools.map(this.makeButton);
            this.$('#site-nav').empty().append(lis);
            return this;
        },
        makeButton: function(toolDef) {
            return $('<a>', { href: '/specify/task/' + toolDef.task + '/' })
                .text(toolDef.title)
                .attr('data-path',toolDef.path)
                .prepend($('<img>', {src: toolDef.icon, }))[0];
        },
        siteNavClick: function(evt) {
            evt.preventDefault();
            var index = this.$('#site-nav a').index(evt.currentTarget);
            this.visibleTools[index].execute();
            $(evt.currentTarget).blur();
        },
        openUserTools: function(evt) {
            new UserTools({user: userInfo, tools: this.hiddenTools}).render();
        },
        changeCollection: function(evt) {
            navigation.switchCollection(parseInt(this.$('#user-tools select').val()), '/');
        }
    });

