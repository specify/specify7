define ['jquery', 'underscore', 'backbone', 'schema', 'specifyapi'], ($, _, Backbone, schema, api) ->

    relatedSearches =
        ColObjCollectors:
            definition: 'Collectionobject.collectingevent.collectors.agent'
            distinct: true
            columns: [
                'catalognumber'
                'catalogeddate'
                'collectingevent.startdate'
#                'collectingevent.collectors'
                ]


    byPivot = {}
    _.each relatedSearches, (rs, name) ->
        rs.name = name
        path = rs.definition.split '.'
        rs.root = schema.getModel _.first path
        rs.path = _.rest path

        rs.pivot = if path.length > 0
            rs.root.getField(rs.path.join '.').getRelatedModel()
        else
            rs.root

        bp = byPivot[rs.pivot.name.toLowerCase()] ?= []
        bp.push(rs)

    buildCollection: (rs, ids) ->
        lookup = rs.path.join('__') + '__in'
        collection = new (api.Collection.forModel rs.root)()
        collection.queryParams[lookup] = ids.join ','
        if rs.distinct then collection.queryParams.distinct = true
        collection

    forModel: (model) ->
        modelName = model.name or model.toLowerCase()
        byPivot[modelName]
