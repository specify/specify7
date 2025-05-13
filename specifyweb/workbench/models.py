import json

from django import http
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.http import Http404
from django.utils import timezone

from specifyweb.specify.func import Func
from specifyweb.specify.models import (
    Collection,
    Specifyuser,
    Agent,
    Attachment,
    datamodel,
    custom_save,
    protect_with_blockers,
)
from specifyweb.specify.api import uri_for_model


class Dataset(models.Model):
    # All these attributes are meta-data.
    name = models.CharField(max_length=256)
    remarks = models.TextField(null=True)
    importedfilename = models.TextField(null=True)

    # All these attributes are generic data-set shared to AssetDatset
    uploaderstatus = models.JSONField(null=True)
    uploadplan = models.TextField(null=True)
    uploadresult = models.JSONField(null=True)
    data = models.JSONField(default=list)

    # All these are related to permission
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)

    # Misc meta-data.
    timestampcreated = models.DateTimeField(default=timezone.now)
    timestampmodified = models.DateTimeField(auto_now=True)
    createdbyagent = models.ForeignKey(
        Agent, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    modifiedbyagent = models.ForeignKey(
        Agent, null=True, on_delete=models.SET_NULL, related_name="+"
    )

    base_meta_fields = [
        "name",
        "uploaderstatus",
        "timestampcreated",
        "timestampmodified",
    ]
    object_response_fields = [
        *base_meta_fields,
        "id",
        "remarks",
        "importedfilename",
        "uploadresult",
        "uploadplan",
    ]

    @classmethod
    def get_meta_fields(cls, request, extra_meta_fields=None, extra_filters=None):
        attrs = [
            *cls.base_meta_fields,
            *(extra_meta_fields if extra_meta_fields is not None else []),
        ]

        dss = cls.objects.filter(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
            **(extra_filters if extra_filters is not None else {})
        ).only(*attrs)
        return [
            {
                "id": ds.id,
                **{attr: getattr(ds, attr) for attr in attrs},
                "uploadplan": json.loads(ds.uploadplan) if ds.uploadplan else None,
            }
            for ds in dss
        ]

    # raise_404: Whether to raise 404 or return http 404.
    # lock_object: Whether to run a "select for update" or "select"
    @classmethod
    def validate_dataset_request(cls, raise_404: bool, lock_object: bool):
        def decorator(func):
            def inner(request, **kwargs):
                ds_id = kwargs.get("ds_id", None)
                if ds_id is None:
                    raise Exception(
                        "ds_id not a key in the request. "
                        "Probably because correct group name is not used url regexp"
                    )
                try:
                    ds = (
                        cls.objects.select_for_update().get(id=ds_id)
                        if lock_object
                        else cls.objects.get(id=ds_id)
                    )
                except ObjectDoesNotExist as e:
                    if raise_404:
                        raise Http404(e)
                    return http.HttpResponseNotFound()

                if ds.specifyuser != request.specify_user:
                    return http.HttpResponseForbidden()
                new_args = {key: kwargs[key] for key in kwargs if key != "ds_id"}
                return func(request, ds, **new_args)

            return inner

        return decorator

    def get_dataset_as_dict(self):
        ds_dict = {key: getattr(self, key) for key in self.object_response_fields}
        ds_dict.update(
            {
                "rows": self.data,
                "uploadplan": Func.maybe(self.uploadplan, json.loads),
                "createdbyagent": (
                    uri_for_model("agent", self.createdbyagent_id)
                    if self.createdbyagent_id is not None
                    else None
                ),
                "modifiedbyagent": (
                    uri_for_model("agent", self.modifiedbyagent_id)
                    if self.modifiedbyagent_id is not None
                    else None
                ),
            }
        )
        return ds_dict

    class Meta:
        abstract = True


class Spdataset(Dataset):
    specify_model = datamodel.get_table("spdataset")

    columns = models.JSONField()
    visualorder = models.JSONField(null=True)
    rowresults = models.TextField(null=True)

    isupdate = models.BooleanField(default=False, null=True)
    rolledback = models.BooleanField(default=False, null=True)

    # very complicated. Essentially, each batch-edit dataset gets backed by another dataset (for rollbacks).
    # This should be a one-to-one field, imagine the mess otherwise.
    parent = models.OneToOneField(
        "Spdataset", related_name="backer", null=True, on_delete=models.CASCADE
    )

    class Meta:
        db_table = "spdataset"

    def get_dataset_as_dict(self):
        ds_dict = super().get_dataset_as_dict()
        ds_dict.update(
            {
                "columns": self.columns,
                "visualorder": self.visualorder,
                "rowresults": self.rowresults and json.loads(self.rowresults),
                "isupdate": self.isupdate == True,
                "rolledback": self.rolledback == True,
            }
        )
        return ds_dict

    def was_uploaded(self) -> bool:
        return self.uploadresult and self.uploadresult["success"]

class SpDataSetAttachment(models.Model):
    specify_model = datamodel.get_table_strict('spdatasetattachment')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='SpDataSetAttachmentID')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index=False)
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    attachment = models.ForeignKey(Attachment, db_column='AttachmentID', related_name='spdatasetattachments', null=False, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey(Agent, db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spdataset = models.ForeignKey(Spdataset, db_column='SpDataSetID', related_name='spdatasetattachments', null=False, on_delete=models.CASCADE)
    modifiedbyagent = models.ForeignKey(Agent, db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spdatasetattachment'
        ordering = ()
        indexes = [
            models.Index(fields=['collectionmemberid'], name='SpDataSetAttColMemIDX')
        ]

    
    # save = partialmethod(custom_save)