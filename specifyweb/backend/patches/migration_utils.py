from django.db.models import F

# REFACTOR: Use ALL_TRESS in specify/tree_views.py?
SPECIFY_TREES = ["Taxon", "Geography", "Storage",
                 "Geologictimeperiod", "Lithostrat"]


def apply_migrations(app_registry, schema_editor=None):
    update_is_accepted(app_registry, schema_editor)
    update_coordinates(app_registry, schema_editor)

def update_is_accepted(app_registry, schema_editor=None):
    for tree in SPECIFY_TREES:
        tree_filters = {
            "isaccepted": False,
            "accepted" + tree.lower() + "__isnull": True
        }

        tree_model = app_registry.get_model("specify", tree)
        tree_model.objects.filter(**tree_filters).update(isaccepted=True)


def update_coordinates(app_registry, schema_editor=None):
    Locality = app_registry.get_model("specify", "Locality")

    Locality.objects.filter(lat1text__isnull=True, latitude1__isnull=False) \
        .update(lat1text=F("latitude1"))

    Locality.objects.filter(long1text__isnull=True, longitude1__isnull=False) \
        .update(long1text=F("longitude1"))

    Locality.objects.filter(lat2text__isnull=True, latitude2__isnull=False) \
        .update(lat2text=F("latitude2"))

    Locality.objects.filter(long2text__isnull=True, longitude2__isnull=False) \
        .update(long2text=F("longitude2"))
