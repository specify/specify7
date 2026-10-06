import json
from unittest.mock import patch

from django.test import Client
from specifyweb.specify import models

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)


class TestCollectionobjectCatalognumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectCatalognumber.test_session_context()

        catnum = self.collectionobjects[0]
        catnum.catalognumber = "123"
        catnum.save()

        c = Client()
        c.force_login(self.specifyuser)

       
        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "operstart": 10,
            "startvalue": "123",
        })

        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[catnum.id, "123"]]},
        )

class TestCollectionobjectAltCatalogNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_previous_alt_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectAltCatalogNumber.test_session_context()

        altcat = self.collectionobjects[0]
        altcat.altcatalognumber = "123"
        altcat.save()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "stringid": "1.collectionobject.altCatalogNumber",
            "fieldname": "altCatalogNumber",
            "operstart": 10,
            "startvalue": "123",
        })

        response = c.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[altcat.id, "123"]]},
        )

class TestTaxonFullname(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_taxon_by_full_name(self, session_context):
        session_context.return_value = TestTaxonFullname.test_session_context()

        root = self.taxontreedef.treedefitems.create(name="Taxonomy Root", rankid=0)
        taxon = root.treeentries.create(
            name="John Doe",
            fullname="John Doe",
            definition=self.taxontreedef,
            rankid=root.rankid,
        )
        models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=taxon,
            iscurrent=True,
        )

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "tablelist": "1,9-determinations,4",
            "stringid": "1,9-determinations,4.taxon.fullname",
            "fieldname": "fullname",
            "operstart": 1,
            "startvalue": "John Doe",

        })

        response = c.post( "/stored_query/ephemeral/",query,content_type="application/json",)

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(json.loads(response.content.decode()),{"results": [[self.collectionobjects[0].id, "John Doe"]]},)

class TestCollectingEventGUID(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collecting_event_by_guid(self, session_context):
        session_context.return_value = TestCollectingEventGUID.test_session_context()

        guid="test-guid-123"
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
            guid=guid,
        )
        collectionobject = self.collectionobjects[0]
        collectionobject.collectingevent = collectingevent
        collectionobject.save()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "tablelist": "1,10",
            "stringid": "1,10.collectingevent.guid",
            "fieldname": "guid",
            "operstart": 1,
            "startvalue": guid,
            "isrelfld": False,
        })
        
        response = c.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(json.loads(response.content.decode()),{"results": [[collectionobject.id, guid]]},)
    
class TestCollecitngEventFieldNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collecting_event_by_field_number(self, session_context):
            session_context.return_value = TestCollecitngEventFieldNumber.test_session_context()
    
            stationfieldnumber="abcdefg12345"
            collectingevent = models.Collectingevent.objects.create(
                discipline=self.discipline,
                stationfieldnumber=stationfieldnumber,
            )

            collectionobject = self.collectionobjects[0]
            collectionobject.collectingevent = collectingevent
            collectionobject.save()
    
            c = Client()
            c.force_login(self.specifyuser)
    
            query = get_simple_query(self.specifyuser)
            query["fields"][0].update({
                "tablelist": "1,10",
                "stringid": "1,10.collectingevent.stationfieldnumber",
                "fieldname": "stationfieldnumber",
                "operstart": 1,
                "startvalue": stationfieldnumber,
                "isrelfld": False,
            })
            
            response = c.post(
                "/stored_query/ephemeral/",
                query,
                content_type="application/json",
            )
    
            self.assertEqual(response.status_code, 200, response.content.decode())
            self.assertEqual(json.loads(response.content.decode()),{"results": [[collectionobject.id, stationfieldnumber]]},)

   
class TestLoanNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_loan_by_loan_number(self, session_context):
        session_context.return_value = TestLoanNumber.test_session_context()

        loannumber = "Inerred_Loan"
        loan = models.Loan.objects.create(
                    loannumber = loannumber,
                    division=self.division,
                    discipline=self.discipline,
                )

        self._create_prep_type()
        preparation = self._create_prep(self.collectionobjects[0], None)
        loan.loanpreparations.create(
            discipline=self.discipline,
            preparation=preparation,
        )

       
        c = Client()
        c.force_login(self.specifyuser)
           
        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "tablelist": "1,63-preparations,54-loanpreparations,52",
            "stringid": "1,63-preparations,54-loanpreparations,52.loan.loanNumber",
            "fieldname": "loanNumber",
            "operstart": 1,
            "startvalue": loannumber,
            "isrelfld": False,
        })

        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",) 
        
        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(json.loads(response.content.decode()),{"results": [[self.collectionobjects[0].id, loannumber]]},)
        
   
class TestAccessionNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_accession_by_accession_number(self, session_context):
        session_context.return_value = TestAccessionNumber.test_session_context()

        accessionnumber = "a"
        accession = models.Accession.objects.create(
           accessionnumber = accessionnumber,
            division=self.division
        )

        collectionobject = self.collectionobjects[0]
        collectionobject.accession = accession
        collectionobject.save()

        c = Client()
        c.force_login(self.specifyuser)
               
        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "tablelist": "1,7",
            "stringid": "1,7.accession.accessionNumber",
            "fieldname": "accessionNumber",
            "operstart": 1,
            "startvalue": accessionnumber,
            "isrelfld": False,
            "isnot": False,
            "isdisplay": True,
        })

        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",)
        self.assertEqual(json.loads(response.content.decode()),{"results": [[self.collectionobjects[0].id, accessionnumber]]},)

        
class TestGiftNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_gift_by_gift_number(self, session_context):
        session_context.return_value = TestAccessionNumber.test_session_context()

        giftnumber = "gift 1"
        gift = models.Gift.objects.create(
            giftnumber= giftnumber,
            discipline=self.discipline,

        )

        self._create_prep_type()
        preparation = self._create_prep(self.collectionobjects[0], None)
        models.Giftpreparation.objects.create(
            gift=gift,
            preparation=preparation,
            discipline=self.discipline,
        )

        c = Client()
        c.force_login(self.specifyuser)
               
        query = get_simple_query(self.specifyuser)
        
        query["fields"][0].update({
            "tablelist": "1,63-preparations,132-giftPreparations,131",
            "stringid": "1,63-preparations,132-giftPreparations,131.gift.giftNumber",
            "fieldname": "giftNumber",
            "operstart": 1,
            "startvalue": giftnumber,
            "isrelfld": False,
            "isnot": False,
            "isdisplay": True,
        })

        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",)
        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(json.loads(response.content.decode()),{"results": [[self.collectionobjects[0].id, giftnumber]]},)



class TestBorrowInvoiceNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_borrow_by_invoice_number(self, session_context):
        session_context.return_value = TestBorrowInvoiceNumber.test_session_context()

        invoicenumber = "BORROW-1234-567"
        borrow = models.Borrow.objects.create(
                    collectionmemberid=self.collection.id,
                    invoicenumber= invoicenumber,
        )
       
        c = Client()
        c.force_login(self.specifyuser)


        query = get_simple_query(self.specifyuser)
        query["contexttableid"] = 18
        query["fields"][0].update({
            "tablelist": "18",
            "stringid": "18.borrow.invoiceNumber",
            "fieldname": "invoiceNumber",
            "operstart": 1,
            "startvalue": invoicenumber,
            "isRelfld": False,
        })


        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",)
        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(json.loads(response.content.decode()),{"results": [[borrow.id, invoicenumber]]},)




class TestStorageFullName(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_storage_by_full_name(self, session_context):
        session_context.return_value = TestBorrowInvoiceNumber.test_session_context()

        fullname = "John Doe"
        storage.model_extras.Storage.objects.create(
            fullname = fullname,

        )

        c = Client()
        c.force_login(self.specifyuser)


        query = get_simple_query(self.specifyuser)
        query["contexttableid"] = 18
        query["fields"][0].update({
            "tablelist": "18",
            "stringid": "18.borrow.invoiceNumber",
            "fieldname": "invoiceNumber",
            "operstart": 1,
            "startvalue": invoicenumber,
            "isRelfld": False,
        })


