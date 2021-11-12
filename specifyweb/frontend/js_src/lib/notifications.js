"use strict";
require('../css/notifications.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const commonText = require('./localization/common').default;

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
        const rendered = $(`<p>${commonText('feedItemUpdated')} <a download></a></p>`);
        $('a', rendered).attr('href', '/static/depository/export_feed/' + filename).text(filename);
        return rendered;
    },
    'update-feed-failed': message => {
        const rendered = $(`<p>${commonText('updateFeedFailed')} <a download>${commonText('exception')}</a></p>`);
        $('a', rendered).attr('href', 'data:application/json:' + JSON.stringify(message.toJSON()));
        return rendered;
    },
    'dwca-export-complete': message => {
        const rendered = $(`<p>${commonText('dwcaExportCompleted')} <a download>${commonText('download')}</a></p>`);
        $('a', rendered).attr('href',  '/static/depository/' + message.get('file'));
        return rendered;
    },
    'dwca-export-failed': message => {
        const rendered = $(`<p>${commonText('dwcaExportFailed')} <a download>${commonText('exception')}</a></p>`);
        $('a', rendered).attr('href', 'data:application/json:' + JSON.stringify(message.toJSON()));
        return rendered;
    },
    'query-export-to-csv-complete': message => {
        const rendered = $(`<p>${commonText('queryExportToCsvCompleted')} <a download>${commonText('download')}</a></p>`);
        $('a', rendered).attr('href',  '/static/depository/' + message.get('file'));
        return rendered;
    },
    'query-export-to-kml-complete': message => {
        const rendered = $(`<p>${commonText('queryExportToKmlCompleted')} <a download>${commonText('download')}</a></p>`);
        $('a', rendered).attr('href',  '/static/depository/' + message.get('file'));
        return rendered;
    },
    'dataset-ownership-transferred': message =>
        $(`<p>
            ${commonText('dataSetOwnershipTransferred')(
                `<i>${message.get('previous-owner-name')}</i>`,
                `<a href="/specify/workbench/${message.get('dataset-id')}/">
                    <i>"${message.get('dataset-name')}"</i>
                </a>`
            )}
        </p>`),
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
        const date  = new Date(this.message.get('timestamp'));
        const formatted = new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'short' }).format(date);
        this.$el.append(
            `<time datetime="${date.toISOString()}">${formatted}</time>`,
            `<button class="ui-icon ui-icon-trash fake-link" type="button" style="float: right;">${commonText('delete')}</button>`,
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
        this.$el.empty().append(commonText('notifications')(this.collection.length));

        const hasNotifications = this.collection.filter(m => !m.get('read')).length > 0;
        this.el.disabled = this.collection.length === 0;
        this.el.classList[hasNotifications ? 'add' : 'remove']('unread-notifications');

        return this;
    },
    openMessages() {
        if (this.dialog != null) return;
        this.collection.startFetching();

        const dialog = this.dialog = new MessageList({collection: this.collection});
        this.dialog.$el.dialog({
            title: commonText('notificationsDialogTitle'),
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
