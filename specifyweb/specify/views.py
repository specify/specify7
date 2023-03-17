"""
A few non-business data resource end points
"""

import json
import mimetypes
from functools import wraps
from itertools import groupby
from typing import Optional

from django import http
from django.conf import settings
from django.db import IntegrityError, router, transaction, connection, models
from django.db.models.deletion import Collector
from django.db.models.base import ModelBase
from django.db.models.fields.related_descriptors import ForeignKeyDeferredAttribute
from django.db.models.query import QuerySet
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods, require_POST
from django.apps import apps
from specifyweb.businessrules.exceptions import BusinessRuleException
from django.core.exceptions import FieldError, FieldDoesNotExist
from django.db.models.deletion import ProtectedError

from specifyweb.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, PermissionsException, check_permission_targets
from specifyweb.specify.load_datamodel import Table
from specifyweb.workbench.upload.upload_result import FailedBusinessRule
from . import api, models as spmodels
from .specify_jar import specify_jar

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
    raise Exception('This error is a test. You may now return to your regularly '
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
    result = [
        {
            'table': sub_objs[0].__class__.__name__,
            'field': field.name,
            'id': sub_objs[0].id
        }
        for field, sub_objs in collector.delete_blockers
    ]
    return http.HttpResponse(api.toJson(result), content_type='application/json')

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model):
    "Returns tuples from the table for <model>."
    return api.rows(request, model)

@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=365*24*60*60, public=True)
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
@cache_control(max_age=24*60*60, public=True)
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
            "204": {"description": "Success",},
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
    check_permission_targets(None, request.specify_user.id, [SetPasswordPT.update])
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
            "204": {"description": "Success",},
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
        spmodels.Agent.objects.filter(specifyuser_id=userid).update(specifyuser_id=None)

        # check if any of the agents to be assigned are used by other users
        in_use = spmodels.Agent.objects.select_for_update().filter(pk__in=new_agentids, specifyuser_id__isnull=False)
        if in_use:
            raise AgentInUseException([a.id for a in in_use])

        # assign the new agents
        spmodels.Agent.objects.filter(pk__in=new_agentids).update(specifyuser_id=userid)

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
        collections = spmodels.Collection.objects.filter(discipline__division__members__specifyuser_id=userid).values_list('id', flat=True)

        # check permissions for setting user agents in those collections.
        for collectionid in collections:
            check_permission_targets(collectionid, request.specify_user.id, [SetUserAgentsPT.update])

        check_collection_access_against_agents(userid)

    return http.HttpResponse('', status=204)

def check_collection_access_against_agents(userid: int) -> None:
    from specifyweb.context.views import users_collections_for_sp6, users_collections_for_sp7

    # get the list of collections the agents belong to.
    collections = spmodels.Collection.objects.filter(discipline__division__members__specifyuser_id=userid).values_list('id', flat=True)

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
            disciplines__collections__id__in=[cid for cid, _ in sp6_collections] + [c.id for c in sp7_collections]
        ).values_list('id', flat=True)
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
            "204": {"description": "Success",},
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

def record_merge_fx(model_name: str, old_model_id: int, new_model_id: int) -> http.HttpResponse:
    """Replaces all the foreign keys referencing the old record ID
    with the new record ID, and deletes the old record record.
    """
    # Confirm the target model table exists
    target_model = apps.get_model('specify', model_name.lower())
    if target_model is None:
        return http.HttpResponseNotFound("model_name: " + model_name + "does not exist.")

    # Check to make sure both the old and new agent IDs exist in the table
    if not target_model.objects.filter(id=old_model_id).select_for_update().exists():
        return http.HttpResponseNotFound(model_name + "ID: " + str(old_model_id) + " does not exist.")
    if not target_model.objects.filter(id=new_model_id).select_for_update().exists():
        return http.HttpResponseNotFound(model_name + "ID: " + str(new_model_id) + " does not exist.")

    # Get all of the columns in all of the tables of specify the are foreign keys referencing AgentID
    foreign_key_cols = []
    for table in spmodels.datamodel.tables:
        for relationship in table.relationships:
            if relationship.relatedModelName.lower() == model_name.lower():
                foreign_key_cols.append((table.name, relationship.name))

    # Build query to update all of the records with foreign keys referencing the AgentID
    for table_name, column_names in groupby(foreign_key_cols, lambda x: x[0]):
        foreign_table = spmodels.datamodel.get_table(table_name)
        if foreign_table is None:
            continue
        try:
            foreign_model = apps.get_model('specify', table_name.lower())
        except (ValueError):
            continue

        print(foreign_table.name + ':')

        for col in [c[1] for c in column_names]:
            print('- ' + col)

            # Determine the field name to filter on
            field_name = col.lower()
            field_name_id = f'{field_name}_id'
            if not hasattr(foreign_model, field_name_id):
                continue

            # Filter the objects in the foreign model that references the old target model
            foreign_objects = foreign_model.objects.filter(**{field_name_id: old_model_id})

            # Update and save the foreign model objects with the new_model_id
            for obj in foreign_objects:
                setattr(obj, field_name_id, new_model_id)
                
                print('****saving: ' + col)

                def record_merge_recur():
                    # Determine which of the records will be assigned as old and new with the timestampcreated field
                    foreign_record_lst = foreign_model.objects.filter(**{field_name_id: new_model_id})
                    if foreign_record_lst.count() > 1:
                        # NOTE: Maybe try handling multiple possible row that are potentially causes the conflict.
                        # Would have to go through all constraints and check records based on columns in each constraint. 
                        return http.HttpResponseNotAllowed('Error! Multiple records violating uniqueness constraints in ' + table_name)

                    old_record = obj
                    new_record = foreign_record_lst.first()
                    if foreign_table.get_field('timestampCreated') is not None:
                        # Sort by timestampCreated then timestampModified then id 
                        old_record, new_record = sorted([old_record, new_record], 
                            key=lambda x: (x.timestampcreated,
                                           x.timestampmodified,
                                           x.id))
                    
                    # Make a recursive call to record_merge to resolve duplication error
                    print('!!!Recursion!!!')
                    response = record_merge_fx(table_name, old_record.pk, new_record.pk)
                    if old_record.pk != obj.pk:
                        update_record(new_record)
                    return response

                def update_record(record: models.Model):
                    try:
                        # TODO: Handle case where this obj has been deleted from recursive merge
                        record.save()
                    except (IntegrityError, BusinessRuleException) as e:
                        # Catch duplicate error and recursively run record merge
                        print('!!!IntegrityError!!!')
                        # Check for duplication error
                        if e.args[0] == 1062 and "Duplicate" in str(e) or \
                            'must have unique' in str(e):
                            return record_merge_recur()
                
                response: http.HttpResponse = update_record(obj)
                if response is not None and response.status_code != 204:
                    return response

    # Dedupe by deleting the agent that is being replaced and updating the old AgentID to the new one
    target_model.objects.get(id=old_model_id).delete()

    return http.HttpResponse('', status=204)

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Replace a new model for an old model.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "description": "The error.",
                        "properties": {
                            "model_name": {
                                "type": "string",
                                "description": "The name of the table that is to be merged."
                            },
                            "old_model_id": {
                                "type": "integer",
                                "description": "The old ID value of the model record that is to be replaced by the new one."
                            },
                            "new_model_id": {
                                "type": "integer",
                                "description": "The new ID value of the model that is replacing the old one."
                            }
                        },
                        'required': ['model_name', 'old_model_id', 'new_model_id'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success",},
            "404": {"description": "The ID specified does not exist."},
            "405": {"description": "A database rule was broken."}
        }
    },
})
@login_maybe_required
@require_POST
def record_merge(request: http.HttpRequest, model_name: str, old_model_id: int, new_model_id: int) -> http.HttpResponse:
    """Replaces all the foreign keys referencing the old record ID
    with the new record ID, and deletes the old record.
    """
    check_permission_targets(None, request.specify_user.id, [ReplaceRecordPT.update, ReplaceRecordPT.delete])

    # TODO: Test reocord merging targeting records other than Agent before allowing generic merging
    if model_name.lower() != 'Agent'.lower():
        return http.HttpResponseForbidden(f'Record Merging for the {model_name} table is not yet tested.')

    response = record_merge_fx(model_name, old_model_id, new_model_id)
    return response