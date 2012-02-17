(function (specify, $, undefined) {

    function slideToggleNext() { $(this).next().slideToggle(); }

    function updateOneToManyHeader() {
        $(this).parents('form').first().prev('.one2manyuiheader')
            .find('a').text($(this).val());
    }

    specify.applyUi = function () {
        $('.specify-one-to-many').each(function (i, toMany) {
            var forms = $(toMany).children('form');
            forms.wrapAll('<div>');
            forms.each(function () {
                var mainInput = $(this).find('input[type="text"]').first();
                var header = $('<a href="#">').appendTo('<h3 class="one2manyuiheader">');
                mainInput.change(updateOneToManyHeader);
                header.parent().insertBefore(this);
                updateOneToManyHeader.apply(mainInput);
            });
            forms.parent().accordion({
                active: false,
                collapsible: true
            });
        });

        $('.specify-one-to-many')
            .children(':header').each(function () {
                $(this).nextAll().wrapAll('<div>');
                $(this).click(slideToggleNext);
            });

        $('.specify-many-to-one').children('form').children(':header').click(slideToggleNext);
    };

} (window.specify = window.specify || {}, jQuery));
