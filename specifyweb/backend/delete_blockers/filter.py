from typing import TypedDict
from functools import reduce

from django.db.models import Model

from specifyweb.specify.api.crud import get_model
from specifyweb.specify.models_utils.load_datamodel import TableDoesNotExistError

from specifyweb.backend.delete_blockers.validators import DELETE_BLOCKER_LIMIT, CleanedDeleteBlockerFilter, CleanedDeleteBlockerRequestForm
from specifyweb.backend.delete_blockers.utils import field_is_remote, relationship_blocks_deletion, relationship_cascades_delete, blocker_relationships_for_obj
from specifyweb.backend.delete_blockers.paginate import resolve_reference_paginator, ReferencePaginator, RemoteReferencePaginator

class DeleteBlocker(TypedDict):
    table: str
    field: str
    ids: list[int]
    limit: int
    complete: bool
    anchor: int | None
    backwards: bool

class DeleteBlockerCount(TypedDict):
    table: str
    field: str
    count: int

class DeleteBlockerCounts(TypedDict):
    results: list[DeleteBlockerCount]
    total_count: int

class DeleteBlockerFilter:
    def __init__(self, paginator: ReferencePaginator) -> None:
        self.paginator = paginator

    @property
    def obj(self):
        return self.paginator.obj

    @property
    def relationship(self):
        return self.paginator.relationship

    @property
    def table_name(self):
        return self.paginator.table_name

    @property
    def field_name(self):
        return self.paginator.field_name

    def cascades(self):
        return relationship_cascades_delete(self.relationship)

    @classmethod
    def from_json(cls, obj: Model, json: CleanedDeleteBlockerFilter):
        table_name = json["table"]
        model = get_model(table_name)
        if model is None:
            raise TableDoesNotExistError(f"Unable to find {table_name}")
        field_name = json["field"]
        field = model._meta.get_field(field_name)
        Paginator = resolve_reference_paginator(obj, field)
        return cls(
            paginator=Paginator(
                obj=obj,
                relationship=field,
                limit=json["limit"],
                anchor_id=json["anchor"],
                backwards=json["backwards"]
            )
        )

    def count(self) -> None | DeleteBlockerCount:
        # We're only collecting counts for direct blockers
        if not relationship_blocks_deletion(self.relationship):
            return None

        record_count = self.paginator.count()
        return {
            "table": self.table_name,
            "field": self.field_name,
            "count": record_count
        }

    def fetch_page(self) -> tuple[bool, DeleteBlocker]:
        fetched_ids = self.paginator.fetch_page()
        complete = len(fetched_ids) < self.paginator.limit
        cascades = self.cascades()
        return cascades, {
            "table": self.table_name,
            "field": self.field_name,
            "ids": fetched_ids,
            "limit": self.paginator.limit,
            "complete": complete,
            "anchor": self.paginator.anchor_id,
            "backwards": self.paginator.backwards
        }

def default_filters(obj: Model, limit=DELETE_BLOCKER_LIMIT, count_only=False) -> list[DeleteBlockerFilter]:
    filters = []
    protect_rels, cascade_rels = blocker_relationships_for_obj(obj)
    for rel in protect_rels:
        # FIXME: optimize this, shouldn't need new reference for every relaitonship
        Paginator = resolve_reference_paginator(obj, rel)
        filters.append(
            DeleteBlockerFilter(
                Paginator(
                    obj,
                    relationship=rel,
                    limit=limit
                )
            )
        )
    # REFACTOR: clean this up a little
    if not count_only:
        for rel in cascade_rels:
            Paginator = resolve_reference_paginator(obj, rel)
            filters.append(
                DeleteBlockerFilter(
                    Paginator(
                        obj,
                        relationship=rel,
                        limit=limit
                    )
                )
            )
    return filters

def merge_delete_blocker_counts(aggregated: DeleteBlockerCounts, current_count: DeleteBlockerCount | None) -> DeleteBlockerCounts:
    if current_count is None or current_count["count"] == 0:
        return aggregated
    new_results = [*aggregated["results"], current_count]
    new_count = aggregated["total_count"] + current_count["count"]
    return {
        "results": new_results,
        "total_count": new_count
    }
    

class DeleteBlockerFilters:
    def __init__(self,
                 obj: Model,
                 limit=DELETE_BLOCKER_LIMIT,
                 filters: list[DeleteBlockerFilter] | None = None,
                 count_only = False
                ) -> None:
        self.obj = obj
        if filters is None:
            self.filters = default_filters(obj, limit, count_only)
        else:
            self.filters = filters

    @classmethod
    def from_json(cls, obj: Model, json: CleanedDeleteBlockerRequestForm, count_only=False):
        if json["filters"] is None:
            filters = None
        else:
            filters = [DeleteBlockerFilter.from_json(obj=obj, json=blocker_filter) for blocker_filter in json["filters"]]
        limit = json["limit"]
        return cls(obj=obj, limit=limit, filters=filters, count_only=count_only)

    def count(self) -> DeleteBlockerCounts:
        starting_value: DeleteBlockerCounts = {
            "results": [],
            "total_count": 0
        }
        return reduce(
            merge_delete_blocker_counts,
            (blocker.count() for blocker in self.filters),
            starting_value
        )

    def fetch(self) -> tuple[list[DeleteBlocker], list[DeleteBlocker]]:
        blocked, deferred = [], []
        for blocker_filter in self.filters:
            blocker_deferred, page = blocker_filter.fetch_page()
            if len(page["ids"]) == 0:
                continue
            if blocker_deferred:
                deferred.append(page)
            else:
                blocked.append(page)
        return blocked, deferred
