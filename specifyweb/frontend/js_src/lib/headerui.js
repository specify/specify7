"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import * as navigation from './navigation';
import UserTools from './usertools';
import userInfo from './userinfo';
import router from './router';
import * as querystring from './querystring';
import NotificationsUI from './notifications';
import commonText from './localization/common';


var toolModules = [
    require('./toolbardataentry').default,
    require('./toolbarinteractions').default,
    require('./toolbartrees').default,
    require('./toolbarrecordsets').default,
    require('./toolbarquery').default,
    require('./toolbarreport').default,
    require('./toolbarattachments').default,
    require('./toolbarwbs').default,
    require('./toolbarmasterkey').default,
    require('./toolbarusers').default,
    require('./toolbartreerepair').default,
    require('./toolbarresources').default,
    require('./toolbardwca').default,
    require('./toolbarforceupdate').default,
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


export default Backbone.View.extend({
        __name__: "HeaderUI",
        events: {
            'click #site-nav a': 'siteNavClick',
            'click .username': 'openUserTools',
            'change #user-tools select': 'changeCollection'
        },
        el: '#site-header',
        initialize: function(options) {
            this.toolModules = toolModules.filter(function(mod){
                return !(_.isFunction(mod.disabled) ? mod.disabled(userInfo) : mod.disabled);
            });

            this.visibleTools = this.toolModules.filter(function(t) { return t.icon != null; });
            this.hiddenTools = this.toolModules.filter(function(t) { return t.icon == null; });

            _.each(this.toolModules, function(module) {
                router.route('task/' + module.task + '/', 'startTask', module.execute.bind(module));
            });

            this.currentCollection = undefined;
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
            $.get('/context/collection/').done(({current, available}) => {
                this.currentCollection = current;
                collectionSelector.append(
                    _.map(available,
                      ([id, name]) => $('<option>', {selected: id === current, value: id, text: name})[0]))
            });

            var lis = this.visibleTools.map(this.makeButton);
            this.$('#site-nav').empty().append(lis);
            return this;
        },
        makeButton: function(toolDef) {
            return $('<a>', { href: '/specify/task/' + toolDef.task + '/' })
                .text(toolDef.title)
                .prepend($('<img>', {src: toolDef.icon}))[0];
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
        changeCollection: function(event) {
            navigation.switchCollection(parseInt(this.$('#user-tools select').val()), '/', ()=> {
                event.target.value = this.currentCollection
            });
        }
    });

