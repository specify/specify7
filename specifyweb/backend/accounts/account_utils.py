from django.db import connection
from specifyweb.backend.accounts.exceptions_types import MissingAgentForAccessibleCollection
from specifyweb.specify import models as spmodels

def check_collection_access_against_agents(userid: int) -> None:
    from specifyweb.backend.context.views import users_collections_for_sp6, users_collections_for_sp7

    # get the list of collections the agents belong to.
    collections = spmodels.Collection.objects.filter(
        discipline__division__members__specifyuser_id=userid).values_list('id', flat=True)

    # make sure every collection the user is permitted to access has an assigned user.
    sp6_collections = users_collections_for_sp6(connection.cursor(), userid)
    sp7_collections = users_collections_for_sp7(userid)
    missing_for_6 = [
        collectionid
        for collectionid, _ in sp6_collections
        if collectionid not in collections
    ]
    missing_for_7 = [
        collection.id
        for collection in sp7_collections
        if collection.id not in collections
    ]
    if missing_for_6 or missing_for_7:
        all_divisions = spmodels.Division.objects.filter(
            disciplines__collections__id__in=[
                cid for cid, _ in sp6_collections] + [c.id for c in sp7_collections]
        ).values_list('id', flat=True).distinct()
        raise MissingAgentForAccessibleCollection({
            'missing_for_6': missing_for_6,
            'missing_for_7': missing_for_7,
            'all_accessible_divisions': list(all_divisions),
        })


def is_provider_info(d: dict) -> bool:
    required_keys = ["title", "client_id", "client_secret", "scope", "config"]
    return all(key in d for key in required_keys)
