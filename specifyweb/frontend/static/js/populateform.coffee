define [
    'jquery', 'underscore','localizeform', 'specifyform'
    'cs!picklist', 'uifield', 'querycbx', 'specifyplugins'
    'recordselector', 'subviewbutton', 'formtable'
    'subview', 'checkbox', 'spinnerui'
    'cs!treelevelpicklist'
], ( \
$, _, localizeForm, specifyform, \
PickList, UIField, QueryCbx, uiplugins, \
RecordSelector, SubViewButton, FormTable, \
SubView, CheckBox, SpinnerUI, TreeLevelPickList) ->

    MultiView = Backbone.View.extend
        __name__: "MultiView"
        render: -> specifyform.buildSubView(@$el).done (form) =>
            # The form has to actually be built to tell if it is a formtable.

            View = if form.hasClass 'specify-form-type-formtable'
                FormTable
            else
                RecordSelector

            new View(@options).render()


    populateField = (resource, control) ->
        getView = _(
            ':checkbox': -> CheckBox
            '.specify-spinner': -> SpinnerUI
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

        view = new ( getView?() or UIField ) { el: control, model: resource }
        view.render()

    populateSubview = (resource, node) ->
        fieldName = node.data 'specify-field-name'
        field = resource.specifyModel.getField fieldName

        viewOptions =
            el: node
            field: field

        resource.rget(fieldName).done (related) ->

            View = switch field.type
                when 'one-to-many'
                    viewOptions.collection = related

                    if specifyform.isSubViewButton node
                        SubViewButton.ToMany
                    else
                        MultiView

                when 'zero-to-one', 'many-to-one'
                    viewOptions.model = related
                    viewOptions.parentResource = resource

                    if specifyform.isSubViewButton node
                        SubViewButton.ToOne
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
