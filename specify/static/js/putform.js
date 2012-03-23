define(['jquery'], function($) {
    var self = {};

    self.harvestForm = function (form) {
        if (!form.is('.specify-view-content'))
            throw new TypeError('harvestForm called with non-view element');

        var data = {};
        form.find('.specify-field').each(function () {
            var field = $(this);
            // skip fields in subforms
            if (!field.parents('.specify-view-content').first().is(form)) { return; }
            if (field.is('input[type="checkbox"]')) {
                data[field.attr('name').toLowerCase()] = field.prop('checked');
            } else {
                data[field.attr('name').toLowerCase()] = field.val();
            }
        });
        return data;
    };

    self.putForm = function (form, recursive) {
        if (!form.is('.specify-view-content'))
            throw new TypeError('putForm called with non-view element');
        var data = self.harvestForm(form), deferreds = [];
        data.resource_uri = form.data('specify-uri');
        data.version = form.data('specify-object-version');
        if (recursive) {
            form.find('.specify-subview').each(function () {
                var container = $('.specify-view-content-container:first', this);
                container.find('.specify-view-content').each(function () {
                    var view = $(this);
                    if (view.parents('.specify-view-content-container').first().is(container))
                        deferreds.push.apply(deferreds, self.putForm(view, recursive));
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

    return self;
});
