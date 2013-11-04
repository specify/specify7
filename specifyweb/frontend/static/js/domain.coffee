define ['jquery', 'underscore', 'schema', 'specifyapi', 'domaindata'], ($, _, schema, api, data) ->

    takeBetween = (items, startElem, endElem) ->
        start = 1 +  _.indexOf items, startElem
        end = 1 + _.indexOf items, endElem
        _.rest (_.first items, end), start

    levels = {}
    _.each ['collection', 'discipline', 'division', 'institution'], (level) ->
        levels[level] = new (schema.getModel(level).Resource) id: data[level]

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
            collections = new schema.models.Collection.LazyCollection
                filters: filter
            collections.fetch({ limit: 0 }).pipe -> collections.models


        collectionsForResource: (resource) ->
            collectionmemberid = resource.get('collectionmemberid')
            if _.isNumber collectionmemberid
                collection = new schema.models.Collection.Resource id: collectionmemberid
                return collection.fetchIfNotPopulated().pipe () -> [collection]

            domainField = resource.specifyModel.orgRelationship()
            if domainField
                resource.rget(domainField.name).pipe domain.collectionsInDomain
            else $.when null
