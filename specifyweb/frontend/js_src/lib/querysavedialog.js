"use strict";

const $ = require('jquery');
const Backbone = require('./backbone.js');

const navigation = require('./navigation.js');
const userInfo = require('./userinfo.js');

module.exports = Backbone.View.extend({
    __name__: "QuerySaveDialog",
    events: {
        'submit': 'doSave'
    },
    initialize({queryBuilder, clone=false}) {
        this.queryBuilder = queryBuilder;
        this.query = queryBuilder.query;
        this.clone = clone;
    },
    render() {
        if (this.clone) {
            this.$el.append('<p>The query will be saved with a new name leaving the current query unchanged.</p>');
        } else {
            this.$el.append('<p>Enter a name for the new query.</p>');
        }

        this.$el.append('<form><label>Query name: <input type="text"/></label></form>');

        this.$el.dialog({
            title: 'Save query as...',
            modal: true,
            close() { $(this).remove(); },
            buttons: {
                Save: () => this.doSave(),
                Cancel() { $(this).dialog('close'); }
            }
        });

        this.$(':input').val(this.query.get('name')).focus().select();

        if (!this.query.isNew() && !this.clone) {
            this.doSave();
        }

        return this;
    },

    doSave(evt) {
        evt && evt.preventDefault();
        const name = this.$(':input').val().trim();
        if (name === '') return;

        const query = this.clone ? this.query.clone() : this.query;
        query.set('name', name);

        this.clone && query.set('specifyuser', userInfo.resource_uri);

        query.save().done(() => {
            this.$el.dialog('close');

            navigation.removeUnloadProtect(this.queryBuilder);
            this.clone ?
                navigation.go(`/specify/query/${query.id}/`) :
                this.queryBuilder.trigger('redisplay');
        });

        this.$el
            .dialog('option', 'title', 'Saving...')
            .dialog('option', 'buttons', []);

        this.$(':input').prop('readonly', true);
    }
});
