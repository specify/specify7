
// Main entry point.
$(function () {
    "use strict";
    var rootContainer = $('#specify-rootform-container');
    var params = specify.pullParamsFromDl(rootContainer);
    var uri = "/api/specify/" + params.model + "/" + params.id + "/";

    $.when(specify.loadViews(), specify.loadTypeSearches())
        .then(function () {
            var viewName = specify.getViewForModel(params.model);
            var mainForm = specify.populateForm(viewName, uri, true);
            rootContainer.empty().append(mainForm);
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
