(function (specify, $, undefined) {

    specify.putForm = function (formNode, recursive) {
        var form = $(formNode);
        var data = {resource_uri: form.data('specify-uri')};
        form.find('.specify-field').each(function (i, fieldNode) {
            var field = $(fieldNode);
            // skip fields in subforms
            if (!field.parents('form').first().is(form)) return;
            if (field.is('input[type="checkbox"]'))
                data[field.attr('name').toLowerCase()] = field.prop('checked');
            else
                data[field.attr('name').toLowerCase()] = field.val();
        });
        return $.ajax(data.resource_uri, {
            type: 'PUT',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data),
        }).promise();
    };

} (window.specify = window.specify || {}, jQuery));
