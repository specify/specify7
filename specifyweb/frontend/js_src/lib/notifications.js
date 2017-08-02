"use strict";
require('../css/notifications.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const moment = require('moment');

const Message = Backbone.Model.extend({
    __name__: "NotificationMessage"
});

const INITIAL_INTERVAL = 5000;
const INTERVAL_MULTIPLIER = 1.10;

const MessageCollection = Backbone.Collection.extend({
    __name__: "NotificationMessageCollection",
    model: Message,
    initialize() {
        this.interval = INITIAL_INTERVAL;
        this.timeout = null;
    },
    startFetching() {
        window.clearTimeout(this.timeout);
        this.interval = INITIAL_INTERVAL;
        this.doFetch();
        return this;
    },
    doFetch() {
        // Poll interval is scaled exponentially to
        // reduce requests if the tab is left open.
        this.interval *= INTERVAL_MULTIPLIER;

        const params = this.length > 0 ? {since: this.last().get('timestamp')} : {};
        $.get('/notifications/messages/', params)
            .done(newMessages => {
                this.add(newMessages);
                this.timeout = document.hidden ? null : // stop updating if tab is hidden
                    window.setTimeout(() => this.doFetch(), this.interval);
            })
            .fail(jqxhr => jqxhr.errorHandled = true);
    }
});

const messageCollection = new MessageCollection();
messageCollection.startFetching();
// Immediately update if tab is revealed after being hidden.
$(document).on('visibilitychange', () => messageCollection.startFetching());

const renderMessage = {
    'feed-item-updated': message => {
        const filename = message.get('file');
        const rendered = $('<p>Export feed item updated. <a download></a></p>');
        $('a', rendered).attr('href', '/static/depository/export_feed/' + filename).text(filename);
        return rendered;
    },
    'update-feed-failed': message => {
        const rendered = $('<p>Export feed update failed. <a download>Exception</a></p>');
        $('a', rendered).attr('href', 'data:application/json:' + JSON.stringify(message.toJSON()));
        return rendered;
    },
    'dwca-export-complete': message => {
        const rendered = $('<p>DwCA export completed. <a download>Download.</a></p>');
        $('a', rendered).attr('href',  '/static/depository/' + message.get('file'));
        return rendered;
    },
    'dwca-export-failed': message => {
        const rendered = $('<p>DwCA export failed. <a download>Exception</a></p>');
        $('a', rendered).attr('href', 'data:application/json:' + JSON.stringify(message.toJSON()));
        return rendered;
    },
    'query-export-complete': message => {
        const rendered = $('<p>Query export to CSV completed. <a download>Download.</a></p>');
        $('a', rendered).attr('href',  '/static/depository/' + message.get('file'));
        return rendered;
    },
    default: message => JSON.stringify(message.toJSON())
};

const MessageView = Backbone.View.extend({
    __name__: "NotificationMessage",
    className: 'notification-message',
    initialize({message}) {
        this.message = message;
    },
    events: {
        'click .ui-icon-trash': 'delete'
    },
    render() {
        const render = renderMessage[this.message.get('type')] || renderMessage.default;
        const time = moment(this.message.get('timestamp')).format('lll');
        this.$el.append(
            `<span>${time}</span>`,
            '<a class="ui-icon ui-icon-trash" style="float: right;">delete</a>',
            render(this.message)
        );
        if (!this.message.get('read')) this.$el.addClass('unread-notification');
        return this;
    },
    delete() {
        $.post('/notifications/delete/', {message_id: this.message.get('message_id')}).then(
            () => this.message.collection.remove(this.message)
        );
    }
});

const MessageList = Backbone.View.extend({
    __name__: "NotificationMessageList",
    initialize() {
        this.collection.on('add remove', this.render, this);
    },
    render() {
        this.$el.empty().append(
            this.collection.map(m => new MessageView({message: m}).render().el).reverse()
        );
        if (this.collection.length < 1) {
            this.$el.dialog('close');
        }
        return this;
    },
    remove() {
        Backbone.View.prototype.remove.call(this);
        this.collection.off(null, null, this);
        this.collection.each(m => m.set('read', true));
        if (this.collection.length > 0) {
            $.post('/notifications/mark_read/', {last_seen: this.collection.last().get('timestamp')})
                .fail(jqxhr => jqxhr.errorHandled = true);
        }
    }
});

module.exports = Backbone.View.extend({
    __name__: "NotificationsUI",
    events: {
        'click': 'openMessages'
    },
    initialize() {
        this.collection = messageCollection;
        this.collection.on('add remove change', this.render, this);
        this.dialog = null;
        this.render();
    },
    render() {
        this.$el.empty().append(`Notifications: ${this.collection.length}`);
        if (this.collection.filter(m => !m.get('read')).length > 0) {
            this.$el.addClass('unread-notifications');
        } else {
            this.$el.removeClass('unread-notifications');
        }
        return this;
    },
    openMessages() {
        if (this.dialog != null) return;
        this.collection.startFetching();

        const dialog = this.dialog = new MessageList({collection: this.collection});
        this.dialog.$el.dialog({
            title: 'Notifications',
            maxHeight: 400,
            position: {my: 'center top', at: 'center bottom', of: this.$el},
            close: () => {
                this.dialog.remove();
                this.dialog = null;
            }
        });
        this.dialog.render();
    }
});
