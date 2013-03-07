define [
    'jquery'
    'underscore'
    'backbone'
    'templates'
    'specifyapi'
    'schema'
    'navigation'
    'icons'
    'specifyform'
    'cs!appresource'
    'jquery-bbq'
], ($, _, Backbone, templates, api, schema, navigation, icons, specifyform, getAppResource) ->

    WelcomeView = Backbone.View.extend
        attributes:
                ViewType: 'WelcomeView'
        render: ->
            @$el.addClass "welcome"
            @
