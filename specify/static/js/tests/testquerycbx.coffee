define ['jquery', 'underscore', 'specifyapi', 'schema', 'querycbx'], ($, _, api, schema, Querycbx) -> ->
    module 'querycbx'
    test1 = ->
        node = '<input type=text class="specify-querycbx specify-field" name="cataloger" data-specify-initialize="name=Agent">'
        model = new (api.Resource.forModel 'CollectionObject') id: 100
        test node, ->
            div = $('<div>').append node
            querycbx = new Querycbx
                el: div.find 'input'
                model: model
            querycbx.render()
            equal div.children().length, 1, 'only one element'
            ok div.children().first().is('div.querycbx-strct'), 'element is querycbx'

            url = div.find('.querycbx-add').prop('href').replace /http\:\/\/[^\/]+\//, ''
            equal url, 'specify/view/collectionobject/100/cataloger/new/', 'add link is correct'
            ok div.find('.querycbx-clone').is(':hidden'), 'clone button is hidden'

            control = div.find 'input'
            ok !(control.prop 'readonly'), 'input is not readonly'

            expectedSearchField = schema.getModel('Agent').getField('lastname').getLocalizedName()
            equal control.attr('title'), "Searches: #{ expectedSearchField }", 'tooltip is correct'

    test1()