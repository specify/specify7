(function (specify, $, undefined) {

    specify.putForm = function (formNode, recursive) {
        var form = $(formNode),
        data = {resource_uri: form.data('specify-uri')},
        deferreds = [];
        form.find('.specify-field').each(function () {
            var field = $(this);
            // skip fields in subforms
            if (!field.parents('form').first().is(form)) { return; }
            if (field.is('input[type="checkbox"]')) {
                data[field.attr('name').toLowerCase()] = field.prop('checked');
            } else {
                data[field.attr('name').toLowerCase()] = field.val();
            }
        });
        if (recursive) {
            form.find('.specify-one-to-many, .specify-many-to-one').each(function () {
                var subformContainer = $(this);
                // skip sub-subforms
                if (!subformContainer.parents('form').first().is(form)) { return; }
                subformContainer.children('form').each(function () {
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
        return $.when.apply($, deferreds);
    };

} (window.specify = window.specify || {}, jQuery));
