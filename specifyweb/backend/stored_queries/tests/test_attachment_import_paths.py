import json
import unittest
from unittest.mock import patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)
from specifyweb.specify import models


class TestAttachmentImportPaths(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_catalog_number(self, session_context):
        session_context.return_value = (
            TestAttachmentImportPaths.test_session_context()
        )

        collectionobject = self.collectionobjects[0]
        collectionobject.catalognumber = "123"
        collectionobject.save()

        client = Client()
        client.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update(
            {
                "tablelist": "1",
                "stringid": "1.collectionobject.catalogNumber",
                "fieldname": "catalogNumber",
                "operstart": 10,
                "startvalue": "123",
            }
        )

        response = client.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[collectionobject.id, "123"]]},
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_alt_catalog_number(self, session_context):
        session_context.return_value = (
            TestAttachmentImportPaths.test_session_context()
        )

        collectionobject = self.collectionobjects[0]
        collectionobject.altcatalognumber = "ALT-123"
        collectionobject.save()

        client = Client()
        client.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update(
            {
                "tablelist": "1",
                "stringid": "1.collectionobject.altCatalogNumber",
                "fieldname": "altCatalogNumber",
                "operstart": 10,
                "startvalue": "ALT-123",
            }
        )

        response = client.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[collectionobject.id, "ALT-123"]]},
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_borrow_by_invoice_number(self, session_context):
        session_context.return_value = (
            TestAttachmentImportPaths.test_session_context()
        )

        invoicenumber = "BORROW-1234-567"
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber=invoicenumber,
        )

        client = Client()
        client.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["contexttableid"] = 18
        query["contextname"] = "Borrow"
        query["fields"][0].update(
            {
                "tablelist": "18",
                "stringid": "18.borrow.invoiceNumber",
                "fieldname": "invoiceNumber",
                "operstart": 10,
                "startvalue": invoicenumber,
            }
        )

        response = client.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[borrow.id, invoicenumber]]},
        )

    def _assert_path(self, table_name, field_name, value, record_id):
        model = getattr(models, table_name.capitalize())
        client = Client()
        client.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["contexttableid"] = model.specify_model.tableId
        query["contextname"] = table_name
        query["fields"][0].update(
            {
                "tablelist": str(model.specify_model.tableId),
                "stringid": (
                    f"{model.specify_model.tableId}."
                    f"{table_name.lower()}.{field_name}"
                ),
                "fieldname": field_name,
                "operstart": 10,
                "startvalue": value,
            }
        )

        response = client.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[record_id, value]]},
        )

    def _fresh_session_context(self):
        return type(self).test_session_context()

    def _create_taxon(self):
        item = models.Taxontreedefitem.objects.create(
            treedef=self.taxontreedef, name="Species", rankid=1
        )
        return models.Taxon.objects.create(
            name="Taxon A",
            fullname="Taxon A",
            rankid=1,
            definition=self.taxontreedef,
            definitionitem=item,
        )

    def _create_storage(self):
        treedef = models.Storagetreedef.objects.create(name="Test storage")
        item = models.Storagetreedefitem.objects.create(
            treedef=treedef, name="Room", rankid=1
        )
        return models.Storage.objects.create(
            name="Storage A",
            fullname="Storage A",
            rankid=1,
            definition=treedef,
            definitionitem=item,
        )

    def _create_preparation(self, barcode, guid):
        preptype, _ = models.Preptype.objects.get_or_create(
            name="Test PrepType", collection=self.collection
        )
        return models.Preparation.objects.create(
            collectionmemberid=self.collection.id,
            collectionobject=self.collectionobjects[2],
            preptype=preptype,
            barcode=barcode,
            guid=guid,
        )

    def _create_exchange_in(self):
        return models.Exchangein.objects.create(
            division=self.division,
            agentcatalogedby=self.agent,
            agentreceivedfrom=self.agent,
            exchangeinnumber="EXIN-1",
        )

    def _create_exchange_out(self):
        return models.Exchangeout.objects.create(
            division=self.division,
            agentcatalogedby=self.agent,
            agentsentto=self.agent,
            exchangeoutnumber="EXOUT-1",
        )

    def _create_reference(self, title, guid):
        return models.Referencework.objects.create(
            institution=self.institution,
            referenceworktype=0,
            title=title,
            guid=guid,
        )

    def _create_locality(self, uniqueidentifier, guid):
        return models.Locality.objects.create(
            discipline=self.discipline,
            localityname="Locality A",
            srclatlongunit=0,
            uniqueidentifier=uniqueidentifier,
            guid=guid,
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_taxon_by_full_name(self, session_context):
        session_context.side_effect = self._fresh_session_context
        taxon = self._create_taxon()
        self._assert_path("Taxon", "fullName", "Taxon A", taxon.id)

    @unittest.skip("Storage.fullName currently produces an empty SQL query")
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_storage_by_full_name(self, session_context):
        session_context.side_effect = self._fresh_session_context
        storage = self._create_storage()
        self._assert_path("Storage", "fullName", "Storage A", storage.id)

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collecting_event_by_guid(self, session_context):
        session_context.side_effect = self._fresh_session_context
        collectingevent = self.collectingevent
        collectingevent.guid = "CE-GUID"
        collectingevent.save()
        self._assert_path(
            "CollectingEvent", "guid", "CE-GUID", collectingevent.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collecting_event_by_field_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        collectingevent = self.collectingevent
        collectingevent.stationfieldnumber = "CE-FIELD"
        collectingevent.save()
        self._assert_path(
            "CollectingEvent",
            "stationFieldNumber",
            "CE-FIELD",
            collectingevent.id,
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_loan_by_loan_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        loan = models.Loan.objects.create(
            discipline=self.discipline, loannumber="LOAN-1"
        )
        self._assert_path("Loan", "loanNumber", "LOAN-1", loan.id)

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_accession_by_accession_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        accession = models.Accession.objects.create(
            division=self.division, accessionnumber="ACC-1"
        )
        self._assert_path(
            "Accession", "accessionNumber", "ACC-1", accession.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_gift_by_gift_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        gift = models.Gift.objects.create(
            discipline=self.discipline, giftnumber="GIFT-1"
        )
        self._assert_path("Gift", "giftNumber", "GIFT-1", gift.id)

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_preparation_by_barcode(self, session_context):
        session_context.side_effect = self._fresh_session_context
        preparation = self._create_preparation(
            "PREP-BARCODE", "PREP-GUID-1"
        )
        self._assert_path(
            "Preparation", "barCode", "PREP-BARCODE", preparation.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_preparation_by_guid(self, session_context):
        session_context.side_effect = self._fresh_session_context
        preparation = self._create_preparation(
            "PREP-BARCODE-2", "PREP-GUID"
        )
        self._assert_path(
            "Preparation", "guid", "PREP-GUID", preparation.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_treatment_event_by_field_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        treatment = models.Treatmentevent.objects.create(
            fieldnumber="TREAT-1"
        )
        self._assert_path(
            "TreatmentEvent", "fieldNumber", "TREAT-1", treatment.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_exchange_in_by_exchange_in_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        exchange = self._create_exchange_in()
        self._assert_path(
            "ExchangeIn", "exchangeInNumber", "EXIN-1", exchange.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_exchange_out_by_exchange_out_number(self, session_context):
        session_context.side_effect = self._fresh_session_context
        exchange = self._create_exchange_out()
        self._assert_path(
            "ExchangeOut", "exchangeOutNumber", "EXOUT-1", exchange.id
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_reference_work_by_title(self, session_context):
        session_context.side_effect = self._fresh_session_context
        reference = self._create_reference("Ref Title", "REF-GUID-1")
        self._assert_path(
            "ReferenceWork", "title", "Ref Title", reference.id
        )
