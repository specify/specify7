from typing import cast, TypedDict, NotRequired, Unpack

from django import forms
from django.core.exceptions import ValidationError

DELETE_BLOCKER_LIMIT = 40


class DeleteBlockerFilterJSON(TypedDict):
    table: str
    field: str
    # The direction of the fetch. If true then results will be returned in
    # descending order starting at the anchor
    backwards: NotRequired[bool]
    # The ID that will be used to anchor and base the results from to achieve
    # keysey/cursor pagination.
    # The anchor is exclusive and will not be included in the results
    # If the anchor is not provided, the default value is based on the
    # direction of the request. If fetching records forwards, the anchor will be
    # 0
    # If fetching records backwards, the anchor will be the last record
    anchor: NotRequired[int | None]
    limit: NotRequired[int]


class CleanedDeleteBlockerFilter(TypedDict):
    table: str
    field: str
    backwards: bool
    anchor: int | None
    limit: int


class CleanedDeleteBlockerRequestForm(TypedDict):
    limit: int
    filters: None | list[CleanedDeleteBlockerFilter]


class DeleteBlockerRequestForm(forms.Form):
    limit = forms.IntegerField(required=False)

    # Whether the format the results based on the default table formatter for
    # the resulting table
    # format = forms.BooleanField(required=False)

    filters = forms.JSONField(required=False)

    def clean(self):
        super().clean()
        if self.cleaned_data.get('limit') is None:
            self.cleaned_data["limit"] = DELETE_BLOCKER_LIMIT

        return self.cleaned_data

    # BUG: Currently a table + field can be defined more than once within the
    # list of filters. The backend will run each filter independently.
    # Might be desirable to error or arbitarily choose the last defined filter.
    # I guess the current behavior could be considered a feature if you wanted
    # to use different anchors, directions, limits, etc. at the same time?
    def clean_filters(self):
        cleaned_filters = self.cleaned_data.get('filters')
        if cleaned_filters is None:
            return cleaned_filters
        if not isinstance(cleaned_filters, list):
            raise ValidationError("filters must be a list")
        new_filters: list[CleanedDeleteBlockerFilter] = []
        for filter_idx, filter in enumerate(cleaned_filters):
            if not isinstance(filter, dict):
                raise ValidationError(
                    "Filter at index '%(filter_idx)d' is not a dict",
                    params={"filter_idx": filter_idx}
                )
            required_keys = {'table', 'field'}
            if not required_keys.issubset(filter.keys()):
                missing_keys = list(required_keys - filter.keys())
                raise ValidationError(
                    "Filter at index '%(filter_idx)d' missing required keys '%(missing_keys)s'",
                    params={"filter_idx": filter_idx,
                            "missing_keys": str(missing_keys)}
                )
            if not all(isinstance(key, str) for key in required_keys):
                formatted_keys = " or ".join(required_keys)
                raise ValidationError(
                    "Filter at index '%(filter_idx)d' did not get str for '%(required_keys)s'",
                    params={
                        "filter_idx": filter_idx,
                        "required_keys": formatted_keys,
                    }
                )
            new_filter: CleanedDeleteBlockerFilter = {
                "table": filter['table'],
                "field": filter['field'],
                "anchor": filter.get('anchor'),
                "limit": filter.get('limit', DELETE_BLOCKER_LIMIT),
                "backwards": filter.get('backwards', False)
            }
            expected_types = {
                "table": str,
                "field": str,
                "backwards": bool,
                "anchor": (int, None),
                "limit": int
            }
            for key, types in expected_types.items():
                if not isinstance(new_filter[key], types):
                    formatted_types = (
                        " or ".join(map(lambda cls: cls.__name__, types))
                        if isinstance(types, tuple)
                        else str(types)
                    )
                    raise ValidationError(
                        "Filter at index '%(filter_idx)d' did not get %(types)s for '%(key)s'",
                        params={
                            "filter_idx": filter_idx,
                            "types": formatted_types,
                            "key": key
                        }
                    )
            new_filters.append(new_filter)
        return new_filters
