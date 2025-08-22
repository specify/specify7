from specifyweb.specify.models import Attachment, Collectionobjectattachment
from specifyweb.specify.record_merging import clean_fields_pre_delete
from specifyweb.specify.tests.test_api import ApiTests


class TestCleanFieldsPreDelete(ApiTests):

    def _make_attachments(self):
        coa_list = []
        attachment_list = []
        for co in self.collectionobjects:
            for idx in range(2):
                attachment = Attachment.objects.create(attachmentlocation=f"location_{co.id}_{idx}")
                coa = Collectionobjectattachment.objects.create(
                    collectionobject=co,
                    attachment=attachment,
                    collectionmemberid=self.collection.id,
                    ordinal=idx
                )
                attachment_list.append(attachment)
                coa_list.append(coa)

        self.assertEqual(Attachment.objects.filter(attachmentlocation__isnull=False).count(), len(attachment_list))
        
        return (coa_list, attachment_list)
    
    def _validate_cleared_location(self, attachment_list):

        for attachment in attachment_list:
            attachment.refresh_from_db()
            self.assertIsNone(attachment.attachmentlocation)
        
        self.assertEqual(Attachment.objects.filter(attachmentlocation__isnull=True).count(), len(attachment_list))

    def test_no_attachment_relationship(self):
        # The case where it is not related to attachment in any way.
        self._create_prep_type()
        clean_fields_pre_delete(self.prep_type)

    def test_no_attachments_found(self):
        # In this case, there are no attachments to consider
        for co in self.collectionobjects:
            clean_fields_pre_delete(co)

    def test_attachment_field(self):
        _, attachment_list = self._make_attachments()

        
        for co in self.collectionobjects:
            co.refresh_from_db()
            clean_fields_pre_delete(co)

        self._validate_cleared_location(attachment_list)


    def test_attachment_join_table(self):
        coa_list, attachment_list = self._make_attachments()

        for coa in coa_list:
            coa.refresh_from_db()
            clean_fields_pre_delete(coa)

        self._validate_cleared_location(attachment_list)

    def test_attachment(self):
        _, attachment_list = self._make_attachments()

        for attachment in attachment_list:
            attachment.refresh_from_db()
            clean_fields_pre_delete(attachment)

        self._validate_cleared_location(attachment_list)