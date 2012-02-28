(function (specify, $, undefined) {

    specify.harvestForm = function (formNode) {
        var form = $(formNode), data = {};
        form.find('.specify-field').each(function () {
            var field = $(this);
            // skip fields in subforms
            if (!field.parents('form, .specify-formtable-row').first().is(form)) { return; }
            if (field.is('input[type="checkbox"]')) {
                data[field.attr('name').toLowerCase()] = field.prop('checked');
            } else {
                data[field.attr('name').toLowerCase()] = field.val();
            }
        });
        return data;
    };

    specify.putForm = function (formNode, recursive) {
        var form = $(formNode),
        data = specify.harvestForm(form),
        deferreds = [];
        data.resource_uri = form.data('specify-uri');
        data.version = form.data('specify-object-version');
        if (recursive) {
            form.find('.specify-one-to-many, .specify-many-to-one').each(function () {
                var container = $(this);
                // skip sub-subforms
                if (!container.parents('form, .specify-formtable-row').first().is(form)) { return; }
                var items = container.hasClass('specify-formtable') ?
                    container.children('table').find('tbody tr') :
                    container.children('form');
                items.each(function () {
                    var subform = $(this);
                    deferreds.push.apply(deferreds, specify.putForm(subform, recursive));
                });
            });
        }
        deferreds.push($.ajax(data.resource_uri, {
            type: 'PUT',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data)
        }).promise());
        return deferreds;
    };

} (window.specify = window.specify || {}, jQuery));
