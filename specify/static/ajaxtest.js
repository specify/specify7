$(function() {
    $('form input[type="submit"]').click(function() {
        $('#response-headers').empty();
        $('#results').empty();
        $('form input[type="submit"]').attr('disabled', 'disabled');
        $.ajax({
            url: $('form input[name="url"]').val(),
            type: $('form select[name="method"]').val(),
            contentType: "application/json",
            data: $('form textarea[name="data"]').val(),
            success: function(data, status, jqxhr) {
                $('#response-headers').append($('<p>').text(jqxhr.getAllResponseHeaders()));
                var ct = jqxhr.getResponseHeader("content-type") || "";
                if (ct.indexOf('html') > -1) {
                    $('#results').html(data);
                }
                if (ct.indexOf('json') > -1) {
                    $('#results').append($('<p>').text(JSON.stringify(data)));
                }
                $('form input[type="submit"]').removeAttr('disabled');
            },
            error: function(jqxhr, status, err) {
                $('#response-headers').append($('<p>').text(jqxhr.getAllResponseHeaders()));
                $('#results').html(jqxhr.responseText);
                $('form input[type="submit"]').removeAttr('disabled');
            }
        });
        return false;
    });
});
