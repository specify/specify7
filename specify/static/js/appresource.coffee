define ['jquery'], ($) ->

    getAppResource = (name) -> $.ajax('/context/app.resource', data: name: name)
        .fail( -> console.log "warning: failed fetching appresource: #{ name }" )
