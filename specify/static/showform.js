
// Main entry point.
$(function () {
    "use strict";
    var uri = "/api/specify/"+view+"/"+id+"/";

    $.when(specify.loadViews(), specify.loadTypeSearches())
        .then(function () {
            var mainForm = specify.populateForm(window.view, uri);
            $('#specify-rootform-container').append(mainForm);
            $('input[type="submit"]').click(function () {
                var btn = $(this);
                btn.prop('disabled', true);
                $.when.apply($, specify.putForm(mainForm, true)).then(function () {
                    btn.prop('disabled', false);
                    window.location.reload(true);
                });
            });
        });
});
