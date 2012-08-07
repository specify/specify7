define [
    'jquery', 'underscore','schemalocalization', 'specifyform'
    'specifyapi', 'picklist', 'uifield', 'querycbx', 'specifyplugins'
    'recordselector', 'subviewbutton', 'formtable', 'subview', 'checkbox'
], ( \
$, _, schemalocalization, specifyform, \
api, PickList, UIField, QueryCbx, uiplugins, \
RecordSelector, SubViewButton, FormTable, SubView, CheckBox) ->

    pluginFor = (control) ->
        init = specifyform.parseSpecifyProperties control.data('specify-initialize')
        return uiplugins[init.name]

    populateField = (resource, control) ->
        getView = _(
            ':checkbox': -> CheckBox
            '.specify-combobox': -> PickList
            '.specify-querycbx': -> QueryCbx
            '.specify-uiplugin': -> pluginFor(control)
            ).find (__, selector) -> control.is selector
        view = new ( getView?() or UIField ) { el: control, model: resource }
        view.render()

    populateSubview = (resource, node) ->
        model = resource.specifyModel
        if specifyform.isSubViewButton node
            viewOptions =
                el: node
                model: resource
                parentModel: model
            (new SubViewButton viewOptions).render()
        else
            fieldName = node.data 'specify-field-name'
            field = model.getField fieldName
            isFormTable = specifyform.subViewIsFormTable node

            resource.rget(fieldName, true).done (related) ->
                viewOptions =
                    el: node
                    resource: resource
                    fieldName: fieldName
                    populateform: populateForm

                View = switch field.type
                    when 'one-to-many'
                        viewOptions.collection = related
                        if isFormTable then FormTable else RecordSelector
                    when 'zero-to-one', 'many-to-one'
                        viewOptions.model = related
                        SubView
                    else
                        node.append "<p>unhandled relationship type: #{ field.type }</p>"
                        null
                if View then (new View viewOptions).render()

    populateForm = (form, resource) ->
        schemalocalization.localizeForm form
        _.each form.find('.specify-field'), (node) -> populateField resource, $ node
        _.each form.find('.specify-subview'), (node) -> populateSubview resource, $ node
        return form
