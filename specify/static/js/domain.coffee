define [
    'specifyapi'
    'text!context/domain.json!noinline'
], (api, json) ->

    domain = {}
    _.each $.parseJSON(json), (id, level) ->
        domain[level] = new (api.Resource.forModel level) id: id

    domain
