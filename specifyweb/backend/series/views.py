

import json

from django import http
from django.views.decorators.http import require_POST
from specifyweb.specify.api import get_model

from specifyweb.specify.uiformatters import get_uiformatter_by_name
from specifyweb.specify.views import login_maybe_required

@login_maybe_required
@require_POST
def series_autonumber_range(request: http.HttpRequest):
    """
    Returns a list of autonumbered values given a range.
    Used for series data entry on Collection Objects.
    """
    request_data: dict = json.loads(request.body)
    range_start = request_data.get('rangestart')
    range_end = request_data.get('rangeend')
    table_name = request_data.get('tablename')
    field_name = request_data.get('fieldname')
    formatter_name = request_data.get('formattername')
    
    formatter = get_uiformatter_by_name(request.specify_collection, request.specify_user, formatter_name)
    
    try: 
        range_start_parsed = formatter.parse(range_start)
        assert not formatter.needs_autonumber(range_start_parsed)
        canonicalized_range_start = formatter.canonicalize(range_start_parsed)
    except:
        return http.HttpResponseBadRequest('Range start does not match format.')
    try:
        range_end_parsed = formatter.parse(range_end)
        assert not formatter.needs_autonumber(range_end_parsed)
        canonicalized_range_end = formatter.canonicalize(range_end_parsed)
    except:
        return http.HttpResponseBadRequest('Range end does not match format.')
    
    if canonicalized_range_end <= canonicalized_range_start:
        return http.HttpResponseBadRequest(f'Range end must be greater than range start.')

    try:
        # Repeatedly autonumber until the end is reached.
        limit = 500
        values = [canonicalized_range_start]
        current_value = values[0]
        if request_data.get('skipstartnumber'):
            # The first value can be optionally excluded/skipped.
            # Needed since series entry currently relies on the first record being saved first.
            values = []
        while current_value < canonicalized_range_end:
            current_value = ''.join(formatter.fill_vals_after(current_value))
            values.append(current_value)
            if len(values) >= limit:
                return http.JsonResponse({
                    'values': [],
                    'error': 'LimitExceeded',
                })
        
        # Check if any existing records use the values.
        # Not garanteed to be accurate at the time of saving, just serves as a warning for the frontend.
        table = get_model(table_name)
        existing_records = table.objects.filter(**{f'{field_name}__in': values, 'collection': request.specify_collection})
        existing_values = list(existing_records.values_list(field_name, flat=True))

        if len(existing_values) > 0:
            return http.JsonResponse({
                'values': values,
                'existing': existing_values,
                'error': 'ExistingNumbers',
            })

        return http.JsonResponse({
            'values': values,
        })
    except Exception as e:
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)