define ['jquery', 'underscore', 'jquery-ui'], ($, _) ->

    class ToolTipMgr
        constructor: (@view, control) ->
            @generators = []
            @control = control and $(control) or @view.$el
            @view.on 'tooltipitem', @addToolTipItem, @

        addToolTipItem: (item) ->
            @el.find('.tooltip-content').append $('<li>').text item
            @el.show().position
                at: 'bottom center'
                of: @content
                my: 'top'

        enable: ->
            @el = $('''
            <div class="tooltip">
                <div class="tooltip-arrow">▲</div>
                <ul class="tooltip-content"></ul>
            </div>''').insertAfter @control

            @control.hover =>
                @el.find('.tooltip-content').empty()
                @view.trigger 'requestfortooltips'

            @control.mouseleave => @el.hide()
            @