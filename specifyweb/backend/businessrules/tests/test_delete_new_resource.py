from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class TestDeleteObjects(ApiTests):

    def test_delete_collectionobject(self):
        collectionobject = models.Collectionobject.objects.create(
            collection=self.collection,
            collectionmemberid=1,
        )
        object_id = collectionobject.id

        collectionobject.delete()

        self.assertEqual(
            models.Collectionobject.objects.filter(id=object_id).count(),
            0,
        )

    def test_delete_attachment(self):
        attachment = models.Attachment.objects.create(
            origfilename='test.txt',
            tableid=1,
        )
        attachment_id = attachment.id

        attachment.delete()

        self.assertEqual(
            models.Attachment.objects.filter(id=attachment_id).count(),
            0,
        )

    def test_delete_taxontreedefitem(self):
        item = models.Taxontreedefitem.objects.create(
            name='Test taxon',
            rankid=0,
            treedef=self.taxontreedef,
        )
        item_id = item.id

        item.delete()

        self.assertEqual(
            models.Taxontreedefitem.objects.filter(id=item_id).count(),
            0,
        )

    def test_delete_geologictimeperiodtreedefitem(self):
        item = models.Geologictimeperiodtreedefitem.objects.create(
            name='Test geologic time period',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )
        item_id = item.id

        item.delete()

        self.assertEqual(
            models.Geologictimeperiodtreedefitem.objects.filter(id=item_id).count(),
            0,
        )

    def test_delete_lithostrattreedefitem(self):
        treedef = models.Lithostrattreedef.objects.create(name='Test lithostrat')
        item = models.Lithostrattreedefitem.objects.create(
            name='Test lithostrat item',
            rankid=0,
            treedef=treedef,
        )
        item_id = item.id

        item.delete()

        self.assertEqual(
            models.Lithostrattreedefitem.objects.filter(id=item_id).count(),
            0,
        )

    def test_delete_tectonicunittreedefitem(self):
        treedef = models.Tectonicunittreedef.objects.create(name='Test tectonic unit')
        item = models.Tectonicunittreedefitem.objects.create(
            name='Test tectonic unit item',
            treedef=treedef,
        )
        item_id = item.id

        item.delete()

        self.assertEqual(
            models.Tectonicunittreedefitem.objects.filter(id=item_id).count(),
            0,
        )

    def test_delete_agent(self):
        agent = models.Agent.objects.create(
            agenttype=0,
        )
        agent_id = agent.id

        agent.delete()

        self.assertEqual(
            models.Agent.objects.filter(id=agent_id).count(),
            0,
        )

    def test_delete_collectingevent(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
        )
        collectingevent_id = collectingevent.id

        collectingevent.delete()

        self.assertEqual(
            models.Collectingevent.objects.filter(id=collectingevent_id).count(),
            0,
        )

    def test_delete_geography(self):
        definitionitem = self.geographytreedef.treedefitems.first()
        geography = models.Geography.objects.create(
            name='Test geography',
            rankid=0,
            definition=self.geographytreedef,
            definitionitem=definitionitem,
        )
        geography_id = geography.id

        geography.delete()

        self.assertEqual(
            models.Geography.objects.filter(id=geography_id).count(),
            0,
        )

    def test_delete_locality(self):
        locality = models.Locality.objects.create(
            localityname='Test locality',
            srclatlongunit=0,
            discipline=self.discipline,
        )
        locality_id = locality.id

        locality.delete()

        self.assertEqual(
            models.Locality.objects.filter(id=locality_id).count(),
            0,
        )

    def test_delete_collectionobjectgroup(self):
        cogtype = models.Collectionobjectgrouptype.objects.create(
            name='Test group type',
            type='Discrete',
            collection=self.collection,
        )
        group = models.Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cogtype,
        )
        group_id = group.id

        group.delete()

        self.assertEqual(
            models.Collectionobjectgroup.objects.filter(id=group_id).count(),
            0,
        )

    def test_delete_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='Test accession',
            division=self.division,
        )
        accession_id = accession.id

        accession.delete()

        self.assertEqual(
            models.Accession.objects.filter(id=accession_id).count(),
            0,
        )

    def test_delete_loan(self):
        loan = models.Loan.objects.create(
            loannumber='Test loan',
            discipline=self.discipline,
        )
        loan_id = loan.id

        loan.delete()

        self.assertEqual(
            models.Loan.objects.filter(id=loan_id).count(),
            0,
        )

    def test_delete_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='Test gift',
            discipline=self.discipline,
        )
        gift_id = gift.id

        gift.delete()

        self.assertEqual(
            models.Gift.objects.filter(id=gift_id).count(),
            0,
        )

    def test_delete_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=1,
            invoicenumber='Test invoice',
        )
        borrow_id = borrow.id

        borrow.delete()

        self.assertEqual(
            models.Borrow.objects.filter(id=borrow_id).count(),
            0,
        )

    def test_delete_disposal(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='Test disposal',
        )
        disposal_id = disposal.id

        disposal.delete()

        self.assertEqual(
            models.Disposal.objects.filter(id=disposal_id).count(),
            0,
        )

    def test_delete_deaccession(self):
        deaccession = models.Deaccession.objects.create(
            deaccessionnumber='Test deaccession',
        )
        deaccession_id = deaccession.id

        deaccession.delete()

        self.assertEqual(
            models.Deaccession.objects.filter(id=deaccession_id).count(),
            0,
        )