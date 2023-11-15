"""
A few non-business data resource end points
"""

import json
from itertools import groupby
from typing import Any, Callable, Dict, List, Optional
import traceback

from django import http
from django.db import IntegrityError, transaction, models
from specifyweb.notifications.models import Message, Spmerging
from django.db.models import Q
from django.db.models.deletion import ProtectedError

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.celery_tasks import LogErrorsTask, app
from . import api, models as spmodels
from .api import uri_for_model
from .build_models import orderings
from .load_datamodel import Table, FieldDoesNotExistError
from celery.utils.log import get_task_logger # type: ignore
logger = get_task_logger(__name__)

# Returns QuerySet which selects and locks entries when evaluated
def filter_and_lock_target_objects(model, ids, name):
    query: Q = Q(**{name: ids[0]})
    for old_model_id in ids[1:]:
        query.add(Q(**{name: old_model_id}), Q.OR)
    return model.objects.filter(query).select_for_update()

def add_ordering_to_key(table_name):
    ordering_fields = orderings.get(table_name, ())
    def ordered_keys(object, previous_fields):
        with_order = [-1*getattr(object, field, None) for field in ordering_fields]
        # FEATURE: Allow customizing this
        with_order.extend([getattr(object, field, None) for field in previous_fields])
        return tuple(with_order)

    return ordered_keys

class FailedMergingException(Exception):
    pass

def resolve_record_merge_response(start_function, silent=True):
    try:
        response = start_function()
    except Exception as error:
        # FEATURE: Add traceback here
        if isinstance(error, FailedMergingException):
            logger.info('FailedMergingException')
            logger.info(error.args[0])
            logger.info(traceback.format_exc())
            response = error.args[0]
        elif silent:
            logger.info(traceback.format_exc())
            return http.HttpResponseServerError(content=str(traceback.format_exc()), content_type="application/json")
        elif type(error.args[0]) == type(http.HttpResponseNotFound):
            logger.info('HttpResponseNotFound')
            logger.info(error.args[0])
            response = error.args[0]
        else:
            raise
    return response

Progress = Callable[[int, int], None]

# Case specific table that can be executed all at once to improve merging performance.
# Only use if it can be assured that no constraints will be raised, requiring recursive merging.
# Map the target record's table to the foreign table that maps to a list of the columns to be updated.
MERGING_OPTIMIZATION_FIELDS = {
    'agent': {
        'spauditlog': ['createdbyagent_id', 'modifiedbyagent_id'],
        'taxon': ['createdbyagent_id', 'modifiedbyagent_id'],
        'collectionobject': ['createdbyagent_id', 'modifiedbyagent_id']
    }
}

# TODO: Refactor this to always use query sets.
def clean_fields_pre_delete(obj_instance):
    if (not obj_instance.__class__.__name__.endswith('attachment')
            or not hasattr(obj_instance, 'attachment')) :
        return
    # We delete this object anyways. So, don't care about
    # the value we put in here. If an error, everything is rollbacked.
    obj_instance.attachment.attachmentlocation = None

ordering_tables = {
    table_name.lower(): fields for table_name, fields in orderings.items()
}

def fix_orderings(base_model: Table, new_record_data):
    for field_name, records in list(new_record_data.items()):
        try:
            relationship = base_model.get_relationship(field_name)
        except FieldDoesNotExistError:
            continue
        ordering_fields = ordering_tables.get(relationship.relatedModelName.lower(), None)
        if (ordering_fields is None or
                # Can this ever happen?
                not isinstance(records, list)):
            continue
        order_fields_data = set([tuple([record.get(ordering_field, None)
                              for ordering_field in ordering_fields])
                                for record in records])

        if len(order_fields_data) != len(records):
            resources = []
            for record in records:
                is_new = 'id' not in record
                for ordering_field in ordering_fields:
                    # Directly take the order whatever front-end gave for the old resources.
                    # Assuming that old resources had valid ordering fields. Otherwise, uniqueness error is thrown.
                    # TODO: If causes a problem, try guessing the best ordering fields for old resources
                    record.update({ordering_field: record.get(ordering_field) if not is_new else None})
                # This is done to make sure new resources aren't created before old ones are saved
                # otherwise uniqueness constraints are violated
                if is_new:
                    resources.append(record)
                else:
                    resources.insert(0, record)
            new_record_data[field_name] = resources

def fix_record_data(new_record_data, current_model: Table, target_model_name: str, new_record_id, old_record_ids):
    return_data = {}

    for field_name, value in list(new_record_data.items()):
        model_field = current_model.get_field(field_name)
        return_data[field_name] = value
        if (model_field is None or
                (not model_field.is_relationship)):
            continue

        if (isinstance(value, str)
                and (model_field.relatedModelName.lower()
                     == target_model_name)):

            new_uri = uri_for_model(target_model_name, new_record_id)
            for old_id in old_record_ids:
                old_uri = uri_for_model(target_model_name, old_id)
                value = value.replace(old_uri, new_uri)
                
        elif isinstance(value, list):
            value = [(fix_record_data(dep_data, spmodels.datamodel.get_table(model_field.relatedModelName), target_model_name, new_record_id, old_record_ids))
                       for dep_data in value]
        return_data[field_name] = value

    return return_data
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
        raise FailedMergingException(http.HttpResponseNotFound("model_name: " + model_name + "does not exist."))

    # Check to make sure both the old and new agent IDs exist in the table
    if not target_model.objects.filter(id=new_model_id).select_for_update().exists():
        raise FailedMergingException(http.HttpResponseNotFound(model_name + "ID: " + str(new_model_id) + " does not exist."))
    for old_model_id in old_model_ids:
        if not target_model.objects.filter(id=old_model_id).select_for_update().exists():
            raise FailedMergingException(http.HttpResponseNotFound(model_name + "ID: " + str(old_model_id) + " does not exist."))

    # Get dependent fields and objects of the target object
    target_object = target_model.objects.get(id=new_model_id)
    dependant_relationships = [(rel.relatedModelName, rel.name)
        for rel in target_object.specify_model.relationships
        if api.is_dependent_field(target_object, rel.name)]

    dependant_table_names = set([rel[0] for rel in dependant_relationships])

    # Get all of the columns in all of the tables of specify the are foreign keys referencing model ID
    foreign_key_cols = []
    for table in spmodels.datamodel.tables:
        for relationship in table.relationships:
            if relationship.relatedModelName.lower() == model_name.lower():
                foreign_key_cols.append((table.name, relationship.name))
    progress(0, len(foreign_key_cols)) if progress is not None else None

    # Build query to update all of the records with foreign keys referencing the model ID
    for table_name, column_names in groupby(foreign_key_cols, lambda x: x[0]):
        foreign_table = spmodels.datamodel.get_table(table_name)
        if foreign_table is None:
            continue
        try:
            foreign_model = getattr(spmodels, table_name.lower().title())
        except ValueError:
            continue

        # Handle case of updating a large amount of record ids in a foreign table.
        # Example: handle case of updating a large amount of agent ids in the audit logs.
        # Fix by optimizing the query by consolidating it here
        if model_name.lower() in MERGING_OPTIMIZATION_FIELDS and \
            table_name.lower() in MERGING_OPTIMIZATION_FIELDS[model_name.lower()]:
            for field_name in MERGING_OPTIMIZATION_FIELDS[model_name.lower()][table_name.lower()]:
                query = Q(**{field_name: old_model_ids[0]})
                for old_model_id in old_model_ids[1:]:
                    query.add(Q(**{field_name: old_model_id}), Q.OR)
                foreign_model.objects.filter(query).update(**{field_name: new_model_id})
                progress(1, 0) if progress is not None else None
            continue

        apply_order = add_ordering_to_key(table_name.lower().title())
        # BUG: timestampmodified could be null for one record, and not the other
        new_key_fields = ('timestampcreated', 'timestampmodified', 'id') \
            if foreign_table.get_field('timestampCreated') is not None \
            else ()  # Consider using id here

        key_function = lambda x: apply_order(x, new_key_fields)

        for col in [c[1] for c in column_names]:
            progress(1, 0) if progress is not None else None
            
            # Determine the field name to filter on
            field_name = col.lower()
            field_name_id = f'{field_name}_id'
            if not hasattr(foreign_model, field_name_id):
                continue

            # Filter the objects in the foreign model that references the old target model
            foreign_objects = filter_and_lock_target_objects(foreign_model, old_model_ids, field_name_id)

            # Update and save the foreign model objects with the new_model_id.
            # Locking foreign objects in the beginning because another transaction could update records, and we will 
            # then either overwrite or delete that change if we iterate to it much later.
            for obj in foreign_objects:
                # If it is a dependent field, delete the object instead of updating it.
                # This is done in order to avoid duplicates
                if table_name in dependant_table_names:
                    # Note: need to handle case where deletion throws error because it is referenced my other records
                    try:
                        clean_fields_pre_delete(obj)
                        obj.delete()
                    except ProtectedError as e:
                        # NOTE: Handle ProtectedError in the future.
                        # EXAMPLE: ProtectedError: ("Cannot delete some instances of model 'Address' because they are 
                        # referenced through protected foreign keys:
                        # 'Division.address'.", {<Division: Division object (2)>})
                        raise
                    continue

                # Set new value for the field
                setattr(obj, field_name_id, new_model_id)

                def record_merge_recur(row_to_lock=None):
                    """ Recursively run another merge process to resolve uniqueness constraints.
                        TODO: Add more sanity checks here.

                        An important, and hard to catch case being missed:
                        Between the exception being raised, and record_merge_recur setting a lock, another transaction 
                        could alter the row, and cause the uniqueness constraint to be invalid. In this case, we would 
                        delete a record that we didn't need to.
                    """

                    # Probably could lock more rows than needed.
                    # We immediately rollback if more than 1, so this is fine.
                    foreign_record_lst = filter_and_lock_target_objects(foreign_model, row_to_lock, 'id') \
                        if row_to_lock is not None \
                        else foreign_model.objects.filter(**{field_name_id: new_model_id}).select_for_update()

                    foreign_record_count = foreign_record_lst.count()

                    if foreign_record_count > 1:
                        # NOTE: Maybe try handling multiple possible row that are potentially causes the conflict.
                        # Would have to go through all constraints and check records based on columns in each constraint.
                        # This case probably is no longer needed to be handled since records are fetched by primary
                        # keys now, and uniqueness constraints are handled via business exceptions.

                        raise FailedMergingException(http.HttpResponseNotAllowed(
                            'Error! Multiple records violating uniqueness constraints in ' + table_name))

                    # Determine which of the records will be assigned as old and new with the timestampcreated field
                    old_record = obj
                    new_record = foreign_record_lst.first()
                    old_record, new_record = sorted([old_record, new_record], key=key_function)

                    # Make a recursive call to record_merge to resolve duplication error
                    response = record_merge_fx(table_name, [old_record.pk], new_record.pk, progress)
                    if old_record.pk != obj.pk:
                        update_record(new_record)
                    return response

                def update_record(record: models.Model):
                    try:
                        # TODO: Handle case where this obj has been deleted from recursive merge
                        with transaction.atomic():
                            record.save()
                    except (IntegrityError, BusinessRuleException) as e:
                        # Catch duplicate error and recursively run record merge
                        rows_to_lock = None
                        if isinstance(e, BusinessRuleException) \
                                and 'must have unique' in str(e) \
                                and e.args[1]['table'].lower() == table_name.lower():
                            # Sanity check because rows can be deleted
                            rows_to_lock = e.args[1]['conflicting']
                            return record_merge_recur(rows_to_lock)
                            # As long as business rules are updated, this shouldn't be raised.
                            # Still having it for completeness
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
        try:
            for table_name, _field_name in dependant_relationships:
                # minor optimization to not fetch unnecessary dependent resources
                if not table_name.lower().endswith('attachment'):
                    continue
                field_name = _field_name.lower()
                # put_resource will drop existing dependent resources.
                # this will trigger deletion from asset server.
                # so, cleaning fields here. It does this for all
                # attachments, which is fine since we just use
                # whatever front-end sends as the final data
                [clean_fields_pre_delete(dependent_object)
                 for dependent_object in getattr(target_object, field_name).all()
                 ]
            new_record_data = new_record_info['new_record_data']
            target_table = spmodels.datamodel.get_table(model_name.lower())
            fix_orderings(target_table, new_record_data)
            obj = api.put_resource(new_record_info['collection'],
                                   new_record_info['specify_user'],
                                   model_name,
                                   new_model_id,
                                   new_record_info['version'],
                                   fix_record_data(new_record_data, target_table, target_table.name.lower(), new_model_id, old_model_ids))
        except IntegrityError as e:
            # NOTE: Handle IntegrityError Duplicate entry in the future.
            # EXAMPLE: IntegrityError: (1062, "Duplicate entry '1-0' for key 'AgentID'")
            raise

    # Return http response
    return http.HttpResponse('', status=204)

@app.task(base=LogErrorsTask, bind=True)
def record_merge_task(self, model_name: str, old_model_ids: List[int], new_model_id: int, merge_id: int,
                      new_record_dict: Dict[str, Any]=None):
    "Run the record merging process as a background task with celery"

    logger.info('logging is working for record merging task')
    logger.info(f'starting task {str(self.request.id)}')

    specify_user_id = new_record_dict['specify_user_id']
    specify_user_agent_id = new_record_dict['specify_user_agent_id']
    specify_user = spmodels.Specifyuser.objects.get(id=specify_user_id)
    specify_user_agent = spmodels.Agent.objects.get(id=specify_user_agent_id)

    new_record_info = {
        'agent_id': new_record_dict['agent_id'],
        'collection': spmodels.Collection.objects.get(id=new_record_dict['collection_id']),
        'specify_user': specify_user_agent,
        'version': new_record_dict['version'],
        'new_record_data': new_record_dict['new_record_data']
    }

    # Track the progress of the record merging
    current = 0
    total = 1
    def progress(cur: int, additional_total: int=0) -> None:
        nonlocal current, total
        current += cur
        total += additional_total
        if current > total:
            current = total
        if not self.request.called_directly:
            self.update_state(state='MERGING', meta={'current': current, 'total': total})

    # Run the record merging function
    logger.info('Starting record merge')

    response = resolve_record_merge_response(
        lambda: record_merge_fx(model_name, old_model_ids, int(new_model_id), progress, new_record_info))

    logger.info('Finishing record merge')

    # Update the finishing state of the record merging process
    merge_record = Spmerging.objects.get(id=merge_id)
    if response.status_code != 204:
        self.update_state(state='FAILED', meta={'current': current, 'total': total})
        merge_record.mergingstatus = 'FAILED'
    else:
        self.update_state(state='SUCCEEDED', meta={'current': total, 'total': total})
        merge_record.mergingstatus = 'SUCCEEDED'
    
    merge_record.response = response.content.decode()
    merge_record.save()

    # Create a message record to indicate the finishing status of the record merge
    logger.info('Creating finishing message')
    if response.status_code == 204:
        logger.info('Merge Succeeded!')
    else:
        logger.info('Merge Failed!')

    Message.objects.create(user=specify_user, content=json.dumps({
        'type': 'record-merge-succeeded' if response.status_code == 204 else 'record-merge-failed',
        'response': response.content.decode(),
        'task_id': self.request.id,
        'table': model_name.title(),
        'new_record_id': new_model_id,
        'old_record_ids': json.dumps(old_model_ids)
    }))




