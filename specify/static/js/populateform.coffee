define [
    'jquery', 'underscore','localizeform', 'specifyform'
    'specifyapi', 'cs!picklist', 'uifield', 'querycbx', 'specifyplugins'
    'recordselector', 'subviewbutton', 'formtable', 'subview', 'checkbox'
    'cs!treelevelpicklist'
], ( \
$, _, localizeForm, specifyform, \
api, PickList, UIField, QueryCbx, uiplugins, \
RecordSelector, SubViewButton, FormTable, \
SubView, CheckBox, TreeLevelPickList) ->

    populateField = (resource, control) ->
        getView = _(
            ':checkbox': -> CheckBox
            '.specify-querycbx': -> QueryCbx

            '.specify-uiplugin': ->
                init = specifyform.parseSpecifyProperties control.data('specify-initialize')
                uiplugins[init.name]

            '.specify-combobox': ->
                if control.attr('name') is 'definitionItem'
                    TreeLevelPickList
                else
                    PickList

            ).find (__, selector) -> control.is selector

        view = new ( getView?() or UIField ) { el: control, model: resource, populateform: populateForm }
        view.render()

    populateSubview = (resource, node) ->
        model = resource.specifyModel
        fieldName = node.data 'specify-field-name'
        field = model.getField fieldName

        viewOptions =
            el: node
            field: field
            parentResource: resource
            populateform: populateForm

        resource.rget(fieldName, true).done (related) ->

            View = switch field.type
                when 'one-to-many'
                    viewOptions.collection = related

                    if specifyform.isSubViewButton node
                        SubViewButton
                    else if specifyform.subViewIsFormTable node
                        FormTable
                    else RecordSelector

                when 'zero-to-one', 'many-to-one'
                    viewOptions.model = related

                    if specifyform.isSubViewButton node
                        SubViewButton
                    else
                        SubView
                else
                    throw new Error "unhandled relationship type: #{ field.type }"

            new View(viewOptions).render()

    populateForm = (form, resource) ->
        localizeForm form
        _.each form.find('.specify-field'), (node) -> populateField resource, $ node
        _.each form.find('.specify-subview'), (node) -> populateSubview resource, $ node
        return form
