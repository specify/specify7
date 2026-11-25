import json

from django.db import transaction
from django.db.models import F
from django.http import HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

from specifyweb.backend.permissions.models import SpqueryShare
from specifyweb.specify.models import Specifyuser, Spquery
from specifyweb.specify.views import HttpResponseConflict, login_maybe_required

from .models import QueryFolder, QueryFolderMembership


def descendants(folders, folder_id):
    result = {folder_id}
    while True:
        children = {folder.id for folder in folders if folder.parent_id in result}
        if children <= result:
            return result
        result.update(children)


def sharing_ancestor(folders, folder):
    by_id = {item.id: item for item in folders}
    while folder is not None:
        if folder.sharing_group is not None:
            return folder
        folder = by_id.get(folder.parent_id)
    return None


@require_http_methods(['GET', 'PUT', 'DELETE'])
@login_maybe_required
@never_cache
def manage_folder_sharing(request, id):
    if not request.specify_user.is_admin():
        return HttpResponseForbidden('Only a Specify Administrator can manage folder sharing.')
    with transaction.atomic():
        Specifyuser.objects.select_for_update().get(pk=request.specify_user.id)
        folders = list(QueryFolder.objects.filter(
            owner=request.specify_user, section=QueryFolder.Section.PERSONAL
        ))
        folder = get_object_or_404(
            QueryFolder, pk=id, owner=request.specify_user,
            section=QueryFolder.Section.PERSONAL,
        )
        folder_ids = descendants(folders, folder.id)
        memberships = QueryFolderMembership.objects.filter(
            owner=request.specify_user, section=QueryFolder.Section.PERSONAL,
            folder_id__in=folder_ids, query__specifyuser=request.specify_user,
        )
        if request.method == 'GET':
            return JsonResponse({
                'hasSharedQueries': SpqueryShare.objects.filter(
                    query_id__in=memberships.values('query_id')
                ).exists(),
            })
        if request.method == 'DELETE':
            if folder.sharing_group is None:
                return HttpResponseBadRequest('This folder is not shared.')
            queries = list(Spquery.objects.filter(
                pk__in=memberships.values('query_id')
            ).order_by('pk').select_for_update())
            memberships.filter(sharing_folder=folder).update(sharing_folder=None)
            folder.sharing_group = None
            folder.save(update_fields=['sharing_group'])
            Spquery.objects.filter(pk__in=[query.pk for query in queries]).update(
                version=F('version') + 1
            )
            return JsonResponse({'sharingGroup': None})

        try:
            data = json.loads(request.body)
        except ValueError:
            return HttpResponseBadRequest('Request body must contain valid JSON.')
        if not isinstance(data, dict) or data.get('sharingGroup') not in ('everyone', 'admins'):
            return HttpResponseBadRequest('sharingGroup must be everyone or admins.')
        if sharing_ancestor(folders, folder) is not None or any(
            item.id in folder_ids and item.sharing_group is not None for item in folders
        ):
            return HttpResponseConflict('An ancestor or descendant folder is already shared.')
        queries = list(Spquery.objects.filter(
            pk__in=memberships.values('query_id')
        ).order_by('pk').select_for_update())
        grants = SpqueryShare.objects.filter(query_id__in=[query.pk for query in queries])
        if grants.exists() and data.get('overwrite') is not True:
            return HttpResponseConflict('Existing query sharing must be confirmed before it is overwritten.')
        grants.delete()
        folder.sharing_group = data['sharingGroup']
        folder.save(update_fields=['sharing_group'])
        memberships.update(sharing_folder=folder)
        Spquery.objects.filter(pk__in=[query.pk for query in queries]).update(
            version=F('version') + 1
        )
        return JsonResponse({'sharingGroup': folder.sharing_group})
