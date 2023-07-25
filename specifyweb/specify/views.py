"""
A few non-business data resource end points
"""

import json
import mimetypes
from functools import wraps
from itertools import groupby
from typing import Any, Callable, Dict, List, Optional, Union
from uuid import uuid4

from django import http
from django.conf import settings
from django.db import IntegrityError, router, transaction, connection, models
from specifyweb.specify import models as specify_models
from django.db.models import Q
from django.db.models.deletion import Collector
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods, require_POST, require_GET

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.permissions.permissions import PermissionTarget, \
PermissionTargetAction, PermissionsException, check_permission_targets, table_permissions_checker
from specifyweb.notifications.models import Message
from specifyweb.celery_tasks import LogErrorsTask, app
from . import api, models as spmodels
from .specify_jar import specify_jar

import logging
logger = logging.getLogger(__name__)


def login_maybe_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return http.HttpResponseForbidden()
        return view(request, *args, **kwargs)

    return wrapped


if settings.ANONYMOUS_USER:
    login_maybe_required = lambda func: func


class HttpResponseConflict(http.HttpResponse):
    status_code = 409

def openapi(schema, components={}):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            return view(*args, **kwargs)

        setattr(wrapped, '__schema__', {
            'schema': schema,
            'components': components
        })
        return wrapped

    return decorator


def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""

    @login_maybe_required
    @cache_control(private=True, max_age=2)
    def view(request, *args, **kwargs):
        """RESTful API endpoint for most Specify datamodel resources.
        <model> is the table from the Specify datamodel. <id> is the
        row id.
        """
        try:
            return dispatch_func(request, *args, **kwargs)
        except api.StaleObjectException as e:
            return HttpResponseConflict(e)
        except api.MissingVersionException as e:
            return http.HttpResponseBadRequest(e)
        except http.Http404 as e:
            return http.HttpResponseNotFound(e)

    return view


resource = api_view(api.resource_dispatch)
collection = api_view(api.collection_dispatch)


def raise_error(request):
    """This endpoint intentionally throws an error in the server for
    testing purposes.
    """
    raise Exception(
        'This error is a test. You may now return to your regularly '
        'scheduled hacking.')


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
    obj = api.get_object_or_404(model, id=int(id))
    using = router.db_for_write(obj.__class__, instance=obj)
    collector = Collector(using=using)
    collector.delete_blockers = []
    collector.collect([obj])
    result = flatten([
        [
            {
                'table': sub_objs[0].__class__.__name__,
                'field': field.name,
                'ids': [sub_obj.id for sub_obj in sub_objs]
            }
        ] for field, sub_objs in collector.delete_blockers
    ])
    return http.HttpResponse(api.toJson(result),
                             content_type='application/json')


def flatten(l):
    return [item for sublist in l for item in sublist]


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model):
    "Returns tuples from the table for <model>."
    return api.rows(request, model)


@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=365 * 24 * 60 * 60, public=True)
def images(request, path):
    """Returns images and icons from the Specify thickclient jar file
    under edu/ku/brc/specify/images/."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    try:
        image = specify_jar.read(path)
    except KeyError as e:
        raise http.Http404(e)
    return http.HttpResponse(image, content_type=mimetype)


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=24 * 60 * 60, public=True)
def properties(request, name):
    """Returns the <name>.properities file from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')


class SetPasswordPT(PermissionTarget):
    resource = '/admin/user/password'
    update = PermissionTargetAction()


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "New user's password",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "password": {
                                "type": "string",
                                "description": "New user's password",
                            },
                        },
                        'required': ['password'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success", },
            "403": {"description": "Logged in user is not an admin."}
        }
    },
})
@login_maybe_required
@require_POST
def set_password(request, userid):
    """Set <userid> specify user's password to the value in the 'password'
    POST parameter.
    """
    check_permission_targets(None, request.specify_user.id,
                             [SetPasswordPT.update])
    user = spmodels.Specifyuser.objects.get(pk=userid)
    user.set_password(request.POST['password'])
    user.save()
    return http.HttpResponse('', status=204)


class SetAgentsException(PermissionsException):
    status_code = 400

    def to_json(self):
        return {self.__class__.__name__: self.args[0]}


class AgentInUseException(SetAgentsException):
    "One of the agents being assigned is already assigned to another user."
    pass


class MultipleAgentsException(SetAgentsException):
    "Attempting to assign more than one agent per division to the user."
    pass


class MissingAgentForAccessibleCollection(SetAgentsException):
    "The user has access to a collection in a division that is not represented by any agent."
    pass


class SetUserAgentsPT(PermissionTarget):
    resource = '/admin/user/agents'
    update = PermissionTargetAction()


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "The list of agents to assign to the user represented by their ids.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "The agent ids."
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success", },
            "400": {
                "description": "The request was rejected.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "description": "The error.",
                            "properties": {
                                AgentInUseException.__name__: {
                                    'type': 'array',
                                    'description': AgentInUseException.__doc__,
                                    'items': {'type': 'integer'},
                                },
                                MultipleAgentsException.__name__: {
                                    'type': 'array',
                                    'description': MultipleAgentsException.__doc__,
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'divisionid': {'type': 'number'},
                                            'agentid1': {'type': 'number'},
                                            'agentid2': {'type': 'number'},
                                        },
                                    },
                                },
                                MissingAgentForAccessibleCollection.__name__: {
                                    'type': 'object',
                                    'description': MissingAgentForAccessibleCollection.__doc__,
                                    'properties': {
                                        'all_accessible_divisions': {
                                            'type': 'array',
                                            'items': {
                                                'type': 'number',
                                                'description': 'Division ID',
                                            },
                                        },
                                        'missing_for_6': {
                                            'type': 'array',
                                            'items': {
                                                'type': 'number',
                                                'description': 'Division ID',
                                            },
                                        },
                                        'missing_for_7': {
                                            'type': 'array',
                                            'items': {
                                                'type': 'number',
                                                'description': 'Division ID',
                                            },
                                        },
                                    },
                                }
                            }
                        }
                    }
                }
            }
        }
    },
})
@login_maybe_required
@require_POST
def set_user_agents(request, userid: int):
    "Sets the agents to represent the user in different disciplines."
    user = spmodels.Specifyuser.objects.get(pk=userid)
    new_agentids = json.loads(request.body)
    cursor = connection.cursor()

    with transaction.atomic():
        # clear user's existing agents
        spmodels.Agent.objects.filter(specifyuser_id=userid).update(
            specifyuser_id=None)

        # check if any of the agents to be assigned are used by other users
        in_use = spmodels.Agent.objects.select_for_update().filter(
            pk__in=new_agentids, specifyuser_id__isnull=False)
        if in_use:
            raise AgentInUseException([a.id for a in in_use])

        # assign the new agents
        spmodels.Agent.objects.filter(pk__in=new_agentids).update(
            specifyuser_id=userid)

        # check for multiple agents assigned to the user
        cursor.execute(
            """select divisionid, a1.agentid, a2.agentid
            from agent a1 join agent a2 using (specifyuserid, divisionid)
            where a1.agentid < a2.agentid and specifyuserid = %s
            """, [userid]
        )

        multiple = [
            {'divisonid': divisonid, 'agentid1': agentid1, 'agentid2': agentid2}
            for divisonid, agentid1, agentid2 in cursor.fetchall()
        ]
        if multiple:
            raise MultipleAgentsException(multiple)

        # get the list of collections the agents belong to.
        collections = spmodels.Collection.objects.filter(
            discipline__division__members__specifyuser_id=userid).values_list(
            'id', flat=True)

        # check permissions for setting user agents in those collections.
        for collectionid in collections:
            check_permission_targets(collectionid, request.specify_user.id,
                                     [SetUserAgentsPT.update])

        check_collection_access_against_agents(userid)

    return http.HttpResponse('', status=204)


def check_collection_access_against_agents(userid: int) -> None:
    from specifyweb.context.views import users_collections_for_sp6, \
        users_collections_for_sp7

    # get the list of collections the agents belong to.
    collections = spmodels.Collection.objects.filter(
        discipline__division__members__specifyuser_id=userid).values_list('id',
                                                                          flat=True)

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
            disciplines__collections__id__in=[cid for cid, _ in
                                              sp6_collections] + [c.id for c in
                                                                  sp7_collections]
        ).values_list('id', flat=True).distinct()
        raise MissingAgentForAccessibleCollection({
            'missing_for_6': missing_for_6,
            'missing_for_7': missing_for_7,
            'all_accessible_divisions': list(all_divisions),
        })


class Sp6AdminPT(PermissionTarget):
    resource = '/admin/user/sp6/is_admin'
    update = PermissionTargetAction()


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Set or clear the admin status for a user.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "admin_status": {
                                "type": "string",
                                'enum': ['true', 'false'],
                                "description": "Whether the user should be given admin status.",
                            },
                        },
                        'required': ['admin_status'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success", },
            "403": {"description": "Logged in user is not an admin."}
        }
    },
})
@login_maybe_required
@require_POST
def set_admin_status(request, userid):
    """Sets <userid> specify user's is-admin status to 'true' or 'false'
    according to the 'admin_status' POST parameter. Must be logged in
    as an admin, otherwise HTTP 403 is returned.
    """
    check_permission_targets(None, request.specify_user.id, [Sp6AdminPT.update])
    user = spmodels.Specifyuser.objects.get(pk=userid)
    if request.POST['admin_status'] == 'true':
        user.set_admin()
        return http.HttpResponse('true', content_type='text/plain')
    else:
        user.clear_admin()
        return http.HttpResponse('false', content_type='text/plain')


class ReplaceRecordPT(PermissionTarget):
    resource = "/record/replace"
    update = PermissionTargetAction()
    delete = PermissionTargetAction()

# Returns QuerySet which selects and locks entries when evaluated
def locked_multiple_objects(model, ids, name):
    query: Q = Q(**{name: ids[0]})
    for old_model_id in ids[1:]:
        query.add(Q(**{name: old_model_id}), Q.OR)
    return model.objects.filter(query). \
        select_for_update()

"""
Important BUG:
All places which return not OK http responses should instead raise exceptions
Otherwise transaction wouldn't be rolled back, but user would see an 
error dialog - compromising the status of merge.
TODO: Implement that after merging with celery worker changes.
"""

Progress = Callable[[int, int], None]

@transaction.atomic
def record_merge_fx(model_name: str, old_model_ids: List[int], new_model_id: int,
                    progress: Optional[Progress]=None,
                    new_record_info: Dict[str, Any]=None) -> http.HttpResponse:

    """Replaces all the foreign keys referencing the old record ID
    with the new record ID, and deletes the old record.
    """
    # Confirm the target model table exists
    model_name = model_name.lower().title()
    target_model = getattr(spmodels, model_name)
    if target_model is None:
        return http.HttpResponseNotFound(
            "model_name: " + model_name + "does not exist.")

    # Check to make sure both the old and new agent IDs exist in the table
    if not target_model.objects.filter(
            id=new_model_id).select_for_update().exists():
        return http.HttpResponseNotFound(
            model_name + "ID: " + str(new_model_id) + " does not exist.")
    for old_model_id in old_model_ids:
        if not target_model.objects.filter(
                id=old_model_id).select_for_update().exists():
            return http.HttpResponseNotFound(
                model_name + "ID: " + str(old_model_id) + " does not exist.")

    # Get dependent fields and objects of the target object
    target_object = target_model.objects.get(id=old_model_id)
    dependant_table_names = [rel.relatedModelName
                             for rel in
                             target_object.specify_model.relationships
                             if api.is_dependent_field(target_object, rel.name)]

    # Get all of the columns in all of the tables of specify the are foreign keys referencing model ID
    foreign_key_cols = []
    for table in spmodels.datamodel.tables:
        for relationship in table.relationships:
            if relationship.relatedModelName.lower() == model_name.lower():
                foreign_key_cols.append((table.name, relationship.name))
    progress(0, foreign_key_cols.count()) if progress is not None else None

    # Build query to update all of the records with foreign keys referencing the model ID
    for table_name, column_names in groupby(foreign_key_cols, lambda x: x[0]):
        foreign_table = spmodels.datamodel.get_table(table_name)
        if foreign_table is None:
            continue
        try:
            foreign_model = getattr(spmodels, table_name.lower().title())
        except (ValueError):
            continue

        for col in [c[1] for c in column_names]:
            # Determine the field name to filter on
            field_name = col.lower()
            field_name_id = f'{field_name}_id'
            if not hasattr(foreign_model, field_name_id):
                continue

            # Filter the objects in the foreign model that references the old target model

            foreign_objects = locked_multiple_objects(foreign_model,
                                                      old_model_ids,
                                                      field_name_id)

            # Update and save the foreign model objects with the new_model_id
            # Locking foreign objects in the beginning because another transaction
            # could update records, and we will then either overwrite or delete that
            # change if we iterate to it much later.
            for obj in foreign_objects:
                # If it is a dependent field, delete the object instead of updating it.
                # This is done in order to avoid duplicates
                if table_name in dependant_table_names:
                    obj.delete()
                    continue

                # Set new value for the field
                setattr(obj, field_name_id, new_model_id)

                def record_merge_recur(row_to_lock=None):
                    """ TODO: Add more sanity checks here.

                        An important, and hard to catch case being missed:

                        Between the exception being raised, and
                        record_merge_recur setting a lock, another
                        transaction could alter the row, and cause the
                        uniqueness constraint to be invalid. In this case,
                        we would delete a record that we didn't need do.

                    """

                    foreign_record_lst = locked_multiple_objects(foreign_model,
                                                                 row_to_lock,
                                                                 'id') \
                        if row_to_lock is not None \
                        else foreign_model.objects.filter(
                        # Probably could lock more rows than needed.
                        # We immediately rollback if more than 1, so
                        # this is fine.
                        **{field_name_id: new_model_id}).select_for_update()

                    foreign_record_count = foreign_record_lst.count()

                    if foreign_record_count > 1:
                        # This case probably is no longer needed to be
                        # handled since records are fetched by primary
                        # keys now, and uniqueness constraints are
                        # handled via business exceptions

                        return http.HttpResponseNotAllowed(
                            'Error! Multiple records violating uniqueness constraints in ' + table_name)

                    # Determine which of the records will be assigned as old
                    # and new with the timestampcreated field

                    old_record = obj
                    new_record = foreign_record_lst.first()
                    if foreign_table.get_field('timestampCreated') is not None:
                        # Sort by timestampCreated then timestampModified then id
                        old_record, new_record = sorted(
                            [old_record, new_record],
                            key=lambda x: (x.timestampcreated,
                                           x.timestampmodified,
                                           x.id))

                    # Make a recursive call to record_merge to resolve duplication error
                    response = record_merge_fx(table_name, [old_record.pk],
                                               new_record.pk)
                    if old_record.pk != obj.pk:
                        update_record(new_record)
                    return response

                def update_record(record: models.Model):
                    try:
                        # TODO: Handle case where this obj has been deleted from recursive merge
                        with transaction.atomic():
                            record.save()
                            progress(1, 0) if progress is not None else None
                    except (IntegrityError, BusinessRuleException) as e:
                        # Catch duplicate error and recursively run record merge
                        rows_to_lock = None
                        if isinstance(e,
                                      BusinessRuleException) and 'must have unique' in str(
                            e) \
                                and e.args[1][
                            'table'].lower() == table_name.lower():  # Sanity check because rows can be deleted
                            rows_to_lock = e.args[1]['conflicting']
                            return record_merge_recur(rows_to_lock)
                            # As long as business rules are updated,
                            # this shouldn't be raised. Still having it
                            # for completeness
                        elif e.args[0] == 1062 and "Duplicate" in str(e):
                            return record_merge_recur()
                        else:
                            raise

                response: http.HttpResponse = update_record(obj)
                if response is not None and response.status_code != 204:
                    return response

    # Dedupe by deleting the record that is being replaced and updating the old model ID to the new one
    for old_model_id in old_model_ids:
        target_model.objects.get(id=old_model_id).delete()

    # Update new record with json info, if given
    has_new_record_info = new_record_info is not None
    if has_new_record_info and 'new_record_data' in new_record_info and \
            new_record_info['new_record_data'] is not None:
        obj = api.put_resource(new_record_info['collection'],
                               new_record_info['specify_user'],
                               model_name,
                               new_model_id,
                               new_record_info['version'],
                               new_record_info['new_record_data'])

    # Return http response
    return http.HttpResponse('', status=204)


@app.task(base=LogErrorsTask, bind=True)
def record_merge_task(self, user_id: int, model_name: str, old_model_ids: List[int], new_model_id: int,
                      merge_record: specify_models.Spmerging, new_record_info: Dict[str, Any]=None):
    "Run the record merging process as a background task with celery"
    current = 0
    total = 1

    # Track the progress of the record merging
    def progress(cur: int, additional_total: int=0) -> None:
        current += cur
        total += additional_total
        if not self.request.called_directly:
            self.update_state(state='MERGING', meta={'current': current, 'total': total})

    # Run the record merging function
    response = record_merge_fx(model_name, old_model_ids, int(new_model_id), progress, new_record_info)

    # Update the finishing state of the record merging process
    if response.status_code == 204:
        self.update_state(state='SUCCEEDED', meta={'current': total, 'total': total})
        specify_models.Spmerging.objects.get(createdbyagent=user_id, mergingstatus='MERGING')
        merge_record.mergingstatus = 'SUCCEEDED'
    else:
        self.update_state(state='FAILED', meta={'current': current, 'total': total})
        merge_record.mergingstatus = 'FAILED'

    # Create a message record to indicate the finishing status of the record merge
    Message.objects.create(user=user_id, content=json.dumps({
        'type': 'record-merge-completed' if response.status_code == 204 else 'record-merge-failed',
        'response': response.content,
    }))
    

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Replace a list of old records with a new record.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "description": "The request body.",
                        "properties": {
                            "model_name": {
                                "type": "string",
                                "description": "The name of the table that is to be merged."
                            },
                            "new_model_id": {
                                "type": "integer",
                                "description": "The new ID value of the model that is replacing the old one."
                            },
                            "old_record_ids": {
                                "type": "array",
                                "items": {
                                    "type": "integer"
                                },
                                "description": "The old record IDs."
                            },
                            "new_record_data": {
                                "type": "object",
                                "description": "The new record data."
                            },
                            "bg": {
                                "type": "boolean",
                                "description": "Determine if the merging should be done as a background task.  Default is True."
                            }
                        },
                        'required': ['model_name', 'new_model_id',
                                     'collection_id', 'old_record_ids',
                                     'new_record_data'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success", },
            "404": {"description": "The ID specified does not exist."},
            "405": {"description": "A database rule was broken."}
        }
    },
})
@login_maybe_required
@require_POST
def record_merge(
    request: http.HttpRequest, 
    model_name: str, 
    new_model_id: int
) -> Union[http.HttpResponse, http.JsonResponse]:
    """Replaces all the foreign keys referencing the old record IDs
    with the new record ID, and deletes the old records.
    """
    record_version = getattr(spmodels, model_name.title()).objects.get(
        id=new_model_id).version
    get_version = request.GET.get('version', record_version)
    version = get_version if isinstance(get_version, int) else 0

    table_permissions_checker(request.specify_collection,
                              request.specify_user_agent, "read")
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [ReplaceRecordPT.update, ReplaceRecordPT.delete])

    data = json.loads(request.body)
    old_model_ids = data['old_record_ids']
    new_record_info = {
        'agent_id': int(new_model_id),
        'collection': request.specify_collection,
        'specify_user': request.specify_user_agent,
        'version': version,
        'new_record_data': data[
            'new_record_data'] if 'new_record_data' in data else None
    }


    bg = True
    if 'bg' in data:
        bg = data['bg']

    if bg:
        # Check if another merge is still in progress
        cur_merges = specify_models.Spmerging.objects.filter(mergingstatus='MERGING')
        if cur_merges.count() > 0:
            return http.HttpResponseNotAllowed(
                'Another merge process is still running on the system, please try again later.')

        # Create task id and a Spmerging record
        task_id = str(uuid4())
        merge = specify_models.Spmerging.objects.create(
            name = "Merge_" + model_name + "_" + new_model_id,
            taskid = task_id,
            mergingstatus = "MERGING",
            createdbyagent = request.specify_user.id,
            modifiedbyagent = request.specify_user.id,
        )
        merge.save()

        # Create a notification record of the merging process starting
        Message.objects.create(user=request.specify_user.id, content=json.dumps({
            'type': 'record-merge-started',
            'name': "Merge_" + model_name + "_" + new_model_id,
            'task_id': task_id,
        }))

        # Run the merging process in the background with celery
        async_result = record_merge_task.apply_async(
            request.specify_user.id,
            [model_name, old_model_ids, int(new_model_id), merge, new_record_info],
            task_id)

        # return http.JsonResponse({'task_id': str(async_result.id), 'status': 'Task started successfully'})
        return http.JsonResponse(async_result.id, safe=False)
    else:
        response = record_merge_fx(model_name, old_model_ids, int(new_model_id), None, new_record_info)
    return response

@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Data fetched successfully",
                "content": {
                    "text/plain": {
                        "schema": {
                            "oneOf": [
                                {
                                    "type": "string",
                                    "example": "null",
                                    "description": "Nothing to report"
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskprogress": {
                                            "type": "object",
                                            "properties": {
                                                "current": {
                                                    "type": "number",
                                                    "example": 11,
                                                },
                                                "total": {
                                                    "type": "number",
                                                    "example": 22,
                                                }
                                            }
                                        },
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [
                                                "MERGING",
                                                "SUCCEEDED",
                                                "FAILED",
                                            ]
                                        },
                                        "taskid": {
                                            "type": "string",
                                            "maxLength": 36,
                                            "example": "7d34dbb2-6e57-4c4b-9546-1fe7bec1acca"
                                        },
                                    },
                                    "description": "Status of the record merge process",
                                }
                            ]
                        }
                    }
                }
            },
        }
    },
})
@require_GET
def merging_status(request, merge_id: int) -> http.HttpResponse:
    "Returns the merging status for the ."
    merge = api.get_object_or_404(specify_models.Spmerging, id=merge_id)

    if merge.taskid is None:
        return http.JsonResponse(None, safe=False)

    result = record_merge_task.AsyncResult(merge.taskid)
    status = {
        'taskstatus': result.state,
        'taskprogress': result.info if isinstance(result.info, dict) else repr(result.info),
        'taskid': merge.taskid
    }

    return http.JsonResponse(status)

