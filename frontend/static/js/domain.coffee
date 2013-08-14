define ['jquery', 'underscore', 'schema', 'specifyapi', 'text!context/domain.json!noinline'], ($, _, schema, api, json) ->

    takeBetween = (items, startElem, endElem) ->
        start = 1 +  _.indexOf items, startElem
        end = 1 + _.indexOf items, endElem
        _.rest (_.first items, end), start

    levels = {}
    _.each $.parseJSON(json), (id, level) ->
        levels[level] = new (schema.getModel(level).Resource) id: id

    api.on 'newresource', (resource) ->
        domainField = resource.specifyModel.orgRelationship()
        if domainField and not resource.get domainField.name
            parentResource = levels[domainField.name]
            if parentResource?
                resource.set domainField.name, parentResource.url()

    treeDefLevels =
        geography: 'discipline'
        geologictimeperiod: 'discipline'
        lithostrat: 'discipline'
        storage: 'institution'
        taxon: 'discipline'

    domain =
        levels: levels

        getTreeDef: (treeName) ->
            treeName = treeName.toLowerCase()
            level = treeDefLevels[treeName]
            if level? then levels[level].rget(treeName + 'treedef') else null

        collectionsInDomain: (domainResource) ->
            domainLevel = domainResource.specifyModel.name.toLowerCase()
            if domainLevel == 'collectionobject'
                return domainResource.rget('collection', true).pipe (collection) -> [collection]
            if domainLevel == 'collection'
                return domainResource.fetchIfNotPopulated().pipe () -> [domainResource]
            path = takeBetween schema.orgHierarchy, 'collection', domainLevel
            filter = {}; filter[path.join '__'] = domainResource.id
            collections = new schema.models.Collection.QueryCollection
                filters: filter
                # TODO: query collection should check that it returned all results
            collections.fetch().pipe -> collections.models


        collectionsForResource: (resource) ->
            collectionmemberid = resource.get('collectionmemberid')
            if _.isNumber collectionmemberid
                collection = new schema.models.Collection.Resource id: collectionmemberid
                return collection.fetchIfNotPopulated().pipe () -> [collection]

            domainField = resource.specifyModel.orgRelationship()
            if domainField
                resource.rget(domainField.name).pipe domain.collectionsInDomain
            else $.when null
