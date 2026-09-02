from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class TestDeletePreviousVersionObjects(ApiTests):

    def test_delete_collectionobject_created_in_previous_version(self):
        collectionobject = self.collectionobjects[0]
        object_id = collectionobject.id

        collectionobject.delete()

        self.assertEqual(
            models.Collectionobject.objects.filter(id=object_id).count(),
            0,
        )

        models.Collectionobject.objects.create(
            collection=self.collection,
            collectionmemberid=1,
        )

    def test_delete_attachment_created_in_previous_version(self):
        attachment = self.attachments[0]
        object_id = attachment.id

        attachment.delete()

        self.assertEqual(
            models.Attachment.objects.filter(id=object_id).count(),
            0,
        )

        models.Attachment.objects.create(
            origfilename='test.txt',
            tableid=1,
        )

    def test_delete_taxontreedefitem_created_in_previous_version(self):
        item = self.taxontreedefitems[0]
        object_id = item.id

        item.delete()

        self.assertEqual(
            models.Taxontreedefitem.objects.filter(id=object_id).count(),
            0,
        )

        models.Taxontreedefitem.objects.create(
            name='Test taxon',
            rankid=0,
            treedef=self.taxontreedef,
        )

    def test_delete_geologictimeperiodtreedefitem_created_in_previous_version(self):
        item = self.geologictimeperiodtreedefitems[0]
        object_id = item.id

        item.delete()

        self.assertEqual(
            models.Geologictimeperiodtreedefitem.objects.filter(id=object_id).count(),
            0,
        )

        models.Geologictimeperiodtreedefitem.objects.create(
            name='Test geologic time period',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )

    def test_delete_lithostrattreedefitem_created_in_previous_version(self):
        item = self.lithostrattreedefitems[0]
        object_id = item.id

        item.delete()

        self.assertEqual(
            models.Lithostrattreedefitem.objects.filter(id=object_id).count(),
            0,
        )

        treedef = models.Lithostrattreedef.objects.create(
            name='Test lithostrat',
        )
        models.Lithostrattreedefitem.objects.create(
            name='Test lithostrat item',
            rankid=0,
            treedef=treedef,
        )

    def test_delete_tectonicunittreedefitem_created_in_previous_version(self):
        item = self.tectonicunittreedefitems[0]
        object_id = item.id

        item.delete()

        self.assertEqual(
            models.Tectonicunittreedefitem.objects.filter(id=object_id).count(),
            0,
        )

        treedef = models.Tectonicunittreedef.objects.create(
            name='Test tectonic unit',
        )
        models.Tectonicunittreedefitem.objects.create(
            name='Test tectonic unit item',
            treedef=treedef,
        )

    def test_delete_agent_created_in_previous_version(self):
        agent = self.agents[0]
        object_id = agent.id

        agent.delete()

        self.assertEqual(
            models.Agent.objects.filter(id=object_id).count(),
            0,
        )

        models.Agent.objects.create(
            agenttype=0,
        )

    def test_delete_collectingevent_created_in_previous_version(self):
        collectingevent = self.collectingevents[0]
        object_id = collectingevent.id

        collectingevent.delete()

        self.assertEqual(
            models.Collectingevent.objects.filter(id=object_id).count(),
            0,
        )

        models.Collectingevent.objects.create(
            discipline=self.discipline,
        )

    def test_delete_geography_created_in_previous_version(self):
        geography = self.geographies[0]
        object_id = geography.id

        geography.delete()

        self.assertEqual(
            models.Geography.objects.filter(id=object_id).count(),
            0,
        )

        definitionitem = self.geographytreedef.treedefitems.first()

        models.Geography.objects.create(
            name='Test geography',
            rankid=0,
            definition=self.geographytreedef,
            definitionitem=definitionitem,
        )

    def test_delete_locality_created_in_previous_version(self):
        locality = self.localities[0]
        object_id = locality.id

        locality.delete()

        self.assertEqual(
            models.Locality.objects.filter(id=object_id).count(),
            0,
        )

        models.Locality.objects.create(
            localityname='Test locality',
            srclatlongunit=0,
            discipline=self.discipline,
        )

    def test_delete_collectionobjectgroup_created_in_previous_version(self):
        group = self.collectionobjectgroups[0]
        object_id = group.id

        group.delete()

        self.assertEqual(
            models.Collectionobjectgroup.objects.filter(id=object_id).count(),
            0,
        )

        cogtype = models.Collectionobjectgrouptype.objects.create(
            name='Test group type',
            type='Discrete',
            collection=self.collection,
        )

        models.Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cogtype,
        )

    def test_delete_accession_created_in_previous_version(self):
        accession = self.accessions[0]
        object_id = accession.id

        accession.delete()

        self.assertEqual(
            models.Accession.objects.filter(id=object_id).count(),
            0,
        )

        models.Accession.objects.create(
            accessionnumber='Test accession',
            division=self.division,
        )

    def test_delete_loan_created_in_previous_version(self):
        loan = self.loans[0]
        object_id = loan.id

        loan.delete()

        self.assertEqual(
            models.Loan.objects.filter(id=object_id).count(),
            0,
        )

        models.Loan.objects.create(
            loannumber='Test loan',
            discipline=self.discipline,
        )

    def test_delete_gift_created_in_previous_version(self):
        gift = self.gifts[0]
        object_id = gift.id

        gift.delete()

        self.assertEqual(
            models.Gift.objects.filter(id=object_id).count(),
            0,
        )

        models.Gift.objects.create(
            giftnumber='Test gift',
            discipline=self.discipline,
        )

    def test_delete_borrow_created_in_previous_version(self):
        borrow = self.borrows[0]
        object_id = borrow.id

        borrow.delete()

        self.assertEqual(
            models.Borrow.objects.filter(id=object_id).count(),
            0,
        )

        models.Borrow.objects.create(
            collectionmemberid=1,
            invoicenumber='Test invoice',
        )

    def test_delete_disposal_created_in_previous_version(self):
        disposal = self.disposals[0]
        object_id = disposal.id

        disposal.delete()

        self.assertEqual(
            models.Disposal.objects.filter(id=object_id).count(),
            0,
        )

        models.Disposal.objects.create(
            disposalnumber='Test disposal',
        )

    def test_delete_deaccession_created_in_previous_version(self):
        deaccession = self.deaccessions[0]
        object_id = deaccession.id

        deaccession.delete()

        self.assertEqual(
            models.Deaccession.objects.filter(id=object_id).count(),
            0,
        )

        models.Deaccession.objects.create(
            deaccessionnumber='Test deaccession',
        )