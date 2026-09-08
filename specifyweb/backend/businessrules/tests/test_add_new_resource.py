from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests


class TestAddNewObjects(ApiTests):
    """
    Mirrors the "Add" button in Save.tsx: using Add creates a brand new,
    empty resource that gets its own database id once saved, and the data
    entered on it is persisted independently of any other record.
    """

    def test_add_collectionobject(self):
        collectionobject = post_resource(
            self.collection,
            self.agent,
            'collectionobject',
            {
                'collection': uri_for_model('collection', self.collection.id),
                'collectionobjecttype': uri_for_model(
                    'collectionobjecttype', self.collectionobjecttype.id
                ),
                'catalognumber': 'num-add',
            },
        )

        self.assertIsNotNone(collectionobject.id)
        self.assertExists(
            models.Collectionobject.objects.filter(
                id=collectionobject.id,
                catalognumber='num-add',
            )
        )

        collectionobject.delete()

    def test_add_attachment(self):
        attachment = models.Attachment.objects.create(
            origfilename='new.txt',
            tableid=1,
        )

        self.assertIsNotNone(attachment.id)
        self.assertExists(
            models.Attachment.objects.filter(
                id=attachment.id,
                origfilename='new.txt',
            )
        )

        attachment.delete()

    def test_add_taxontreedefitem(self):
        root = models.Taxontreedefitem.objects.create(
            name='Root taxon',
            rankid=0,
            treedef=self.taxontreedef,
        )
        item = models.Taxontreedefitem.objects.create(
            name='New taxon',
            rankid=1,
            parent=root,
            treedef=self.taxontreedef,
        )

        self.assertIsNotNone(item.id)
        self.assertExists(
            models.Taxontreedefitem.objects.filter(id=item.id, name='New taxon')
        )

        item.delete()

    def test_add_geologictimeperiodtreedefitem(self):
        root = models.Geologictimeperiodtreedefitem.objects.create(
            name='Root geologic time period',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )
        item = models.Geologictimeperiodtreedefitem.objects.create(
            name='New geologic time period',
            rankid=1,
            parent=root,
            treedef=self.geologictimeperiodtreedef,
        )

        self.assertIsNotNone(item.id)
        self.assertExists(
            models.Geologictimeperiodtreedefitem.objects.filter(
                id=item.id, name='New geologic time period'
            )
        )

        item.delete()

    def test_add_lithostrattreedefitem(self):
        treedef = models.Lithostrattreedef.objects.create(name='Test lithostrat')
        root = models.Lithostrattreedefitem.objects.create(
            name='Root lithostrat item',
            rankid=0,
            treedef=treedef,
        )
        item = models.Lithostrattreedefitem.objects.create(
            name='New lithostrat item',
            rankid=1,
            parent=root,
            treedef=treedef,
        )

        self.assertIsNotNone(item.id)
        self.assertExists(
            models.Lithostrattreedefitem.objects.filter(
                id=item.id, name='New lithostrat item'
            )
        )

        item.delete()

    def test_add_tectonicunittreedefitem(self):
        treedef = models.Tectonicunittreedef.objects.create(name='Test tectonic unit')
        root = models.Tectonicunittreedefitem.objects.create(
            name='Root tectonic unit item',
            rankid=0,
            treedef=treedef,
        )
        item = models.Tectonicunittreedefitem.objects.create(
            name='New tectonic unit item',
            rankid=1,
            parent=root,
            treedef=treedef,
        )

        self.assertIsNotNone(item.id)
        self.assertExists(
            models.Tectonicunittreedefitem.objects.filter(
                id=item.id, name='New tectonic unit item'
            )
        )

        item.delete()

    def test_add_agent(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Agent',
            division=self.division,
        )

        self.assertIsNotNone(agent.id)
        self.assertExists(
            models.Agent.objects.filter(id=agent.id, lastname='Agent')
        )

        agent.delete()

    def test_add_collectingevent(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
        )

        self.assertIsNotNone(collectingevent.id)
        self.assertExists(
            models.Collectingevent.objects.filter(
                id=collectingevent.id, discipline=self.discipline
            )
        )

        collectingevent.delete()

    def test_add_geography(self):
        geography_root_definitionitem = models.Geographytreedefitem.objects.create(
            name='Root geography',
            rankid=0,
            treedef=self.geographytreedef,
        )
        geography_root = models.Geography.objects.create(
            name='Root geography',
            rankid=0,
            definition=self.geographytreedef,
            definitionitem=geography_root_definitionitem,
        )
        definitionitem = models.Geographytreedefitem.objects.create(
            name='Test geography level',
            rankid=1,
            parent=geography_root_definitionitem,
            treedef=self.geographytreedef,
        )
        geography = models.Geography.objects.create(
            name='New geography',
            rankid=1,
            definition=self.geographytreedef,
            definitionitem=definitionitem,
            parent=geography_root,
        )

        self.assertIsNotNone(geography.id)
        self.assertExists(
            models.Geography.objects.filter(id=geography.id, name='New geography')
        )

        geography.delete()

    def test_add_locality(self):
        locality = models.Locality.objects.create(
            localityname='New locality',
            srclatlongunit=0,
            discipline=self.discipline,
        )

        self.assertIsNotNone(locality.id)
        self.assertExists(
            models.Locality.objects.filter(
                id=locality.id, localityname='New locality'
            )
        )

        locality.delete()

    def test_add_collectionobjectgroup(self):
        cog_type_picklist = models.Picklist.objects.create(
            name='SystemCOGTypes',
            issystem=True,
            type=0,
            readonly=True,
            collection=self.collection,
        )
        models.Picklistitem.objects.create(
            title='Discrete',
            value='Discrete',
            picklist=cog_type_picklist,
        )
        cogtype = models.Collectionobjectgrouptype.objects.create(
            name='Test group type',
            type='Discrete',
            collection=self.collection,
        )
        group = models.Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cogtype,
            description='New description',
        )

        self.assertIsNotNone(group.id)
        self.assertExists(
            models.Collectionobjectgroup.objects.filter(
                id=group.id, description='New description'
            )
        )

        group.delete()

    def test_add_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='New accession',
            division=self.division,
        )

        self.assertIsNotNone(accession.id)
        self.assertExists(
            models.Accession.objects.filter(
                id=accession.id, accessionnumber='New accession'
            )
        )

        accession.delete()

    def test_add_loan(self):
        loan = models.Loan.objects.create(
            loannumber='New loan',
            discipline=self.discipline,
        )

        self.assertIsNotNone(loan.id)
        self.assertExists(
            models.Loan.objects.filter(id=loan.id, loannumber='New loan')
        )

        loan.delete()

    def test_add_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='New gift',
            discipline=self.discipline,
        )

        self.assertIsNotNone(gift.id)
        self.assertExists(
            models.Gift.objects.filter(id=gift.id, giftnumber='New gift')
        )

        gift.delete()

    def test_add_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=1,
            invoicenumber='New invoice',
        )

        self.assertIsNotNone(borrow.id)
        self.assertExists(
            models.Borrow.objects.filter(id=borrow.id, invoicenumber='New invoice')
        )

        borrow.delete()

    def test_add_disposal(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='New disposal',
        )

        self.assertIsNotNone(disposal.id)
        self.assertExists(
            models.Disposal.objects.filter(
                id=disposal.id, disposalnumber='New disposal'
            )
        )

        disposal.delete()

    def test_add_deaccession(self):
        deaccession = models.Deaccession.objects.create(
            deaccessionnumber='New deaccession',
        )

        self.assertIsNotNone(deaccession.id)
        self.assertExists(
            models.Deaccession.objects.filter(
                id=deaccession.id, deaccessionnumber='New deaccession'
            )
        )

        deaccession.delete()
