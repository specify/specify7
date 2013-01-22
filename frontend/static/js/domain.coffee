define ['jquery', 'underscore', 'schema', 'specifyapi', 'text!context/domain.json!noinline'], ($, _, schema, api, json) ->

    takeBetween = (items, startElem, endElem) ->
        start = 1 +  _.indexOf items, startElem
        end = 1 + _.indexOf items, endElem
        _.rest (_.first items, end), start

    levels = {}
    _.each $.parseJSON(json), (id, level) ->
        levels[level] = new (api.Resource.forModel level) id: id

    api.on 'newresource', (resource) ->
        domainField = resource.specifyModel.orgRelationship()
        if domainField and not resource.get domainField.name
            parentResource = levels[domainField.name]
            if parentResource?
                resource.set domainField.name, parentResource.url()

    domain =
        levels: levels

        collectionsInDomain: (domainResource) ->
            domainLevel = domainResource.specifyModel.name.toLowerCase()
            if domainLevel == 'collectionobject'
                return domainResource.rget('collection', true).pipe (collection) -> [collection]
            if domainLevel == 'collection'
                return domainResource.fetchIfNotPopulated().pipe () -> [domainResource]
            path = takeBetween schema.orgHierarchy, 'collection', domainLevel
            collections = new (api.Collection.forModel 'collection')()
            collections.queryParams[path.join '__'] = domainResource.id
            collections.fetch().pipe -> collections.models


        collectionsForResource: (resource) ->
            collectionmemberid = resource.get('collectionmemberid')
            if _.isNumber collectionmemberid
                collection = new (api.Resource.forModel 'collection') id: collectionmemberid
                return collection.fetchIfNotPopulated()

            domainField = resource.specifyModel.orgRelationship()
            if domainField
                resource.rget(domainField.name).pipe domain.collectionsInDomain
            else $.when null
