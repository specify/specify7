from .models import Spattachmentdataset
from ..backend.permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets
from django import http
import json
import datetime

class AttachmentDataSetPT(PermissionTarget):
    resource = "/attachment_import/dataset"
    create = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    upload = PermissionTargetAction()
    rollback = PermissionTargetAction()

def datasets_view(request):
    if request.method == 'GET':
        return http.JsonResponse(Spattachmentdataset.get_meta_fields(request), safe=False)

    if request.method == 'POST':
        check_permission_targets(request.specify_collection.id, request.specify_user.id, [AttachmentDataSetPT.create])
        data = json.load(request)
        ds = Spattachmentdataset.objects.create(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
            name=data['name'],
            data=data['rows'],
            importedfilename=data.get('importedfilename', None),
            createdbyagent=request.specify_user_agent,
            modifiedbyagent=request.specify_user_agent,
            uploaderstatus="main",
            # A bit more flexible than workbench. Handles creating datasets with an uploadplan from the start.
            uploadplan=json.dumps(data['uploadplan']) if 'uploadplan' in data else None
        )

        return http.JsonResponse({
            "id": ds.id,
            "name": ds.name
        }, status=201)

def dataset_view(request, ds: Spattachmentdataset):
    if request.method == 'GET':
        return http.JsonResponse(ds.get_dataset_as_dict())

    if request.method == 'PUT':

        check_permission_targets(request.specify_collection.id, request.specify_user.id, [AttachmentDataSetPT.update])

        attrs = json.load(request)
        ds.name = attrs.get('name', ds.name)
        ds.remarks = attrs.get('remarks', ds.remarks)
        ds.data = attrs.get('rows', ds.data)
        ds.uploadplan = json.dumps(attrs['uploadplan'] if 'uploadplan' in attrs else ds.uploadplan)
        # Never preserve uploaderstatus. Making it required for all requests.
        old_status = ds.uploaderstatus
        new_status = attrs.get('uploaderstatus')
        ds.uploaderstatus = new_status
        # If state changed from main to uploading, add timestamp
        if old_status == 'main' and new_status == 'uploading':
            ds.uploadresult = {
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        elif not (old_status == 'uploading' and new_status == 'main'):
            # if state changed from uploading to main (during sync or interruption)
            # preserver last uploading
            ds.uploadresult = None
        ds.save()
        return http.HttpResponse(status=204)

    if request.method == 'DELETE':
        check_permission_targets(request.specify_collection.id, request.specify_user.id, [AttachmentDataSetPT.delete])
        ds.delete()
        return http.HttpResponse(status=204)