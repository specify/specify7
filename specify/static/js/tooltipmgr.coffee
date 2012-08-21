define ['jquery', 'underscore', 'jquery-ui'], ($, _) ->

    class ToolTipMgr
        constructor: (@view, control) ->
            @generators = []
            @control = control and $(control) or @view.$el

        addGenerator: (gen, context) ->
            @generators.push [gen, context]

        enable: ->
            @el = $('''
            <div class="tooltip">
                <div class="tooltip-arrow">▲</div>
                <ul class="tooltip-content"></ul>
            </div>''').insertAfter @control

            @control.hover =>
                @el.find('.tooltip-content').empty()
                messages = _.flatten _(@generators).map (generator) ->
                    [func, context] = generator
                    context ?= @view
                    func.call(context)

                if _.isEmpty messages then return

                _(messages).each (message) =>
                    @el.find('.tooltip-content').append $('<li>').text message

                @el.show().position
                    at: 'bottom center'
                    of: @content
                    my: 'top'

            @control.mouseleave => @el.hide()
            @