define ['specifyapi', 'text!context/domain.json!noinline'], (api, json) ->

    domain = {}
    _.each $.parseJSON(json), (id, level) ->
        domain[level] = new (api.Resource.forModel level) id: id


    api.on 'newresource', (resource) ->
        domainField = resource.specifyModel.orgRelationship()
        if domainField and not resource.get domainField.name
            parentResource = domain[domainField.name]
            if parentResource?
                resource.set domainField.name, parentResource.url()

    domain
