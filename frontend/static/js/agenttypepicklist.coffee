define ['underscore'], (_) ->
    _([
     'Organization'
     'Person'
     'Other'
     'Group'
    ]).map (type, i) -> value: i, title: type

