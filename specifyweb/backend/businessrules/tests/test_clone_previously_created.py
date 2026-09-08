from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class TestClonePreviousVersionObjects(ApiTests):
    """
    Mirrors the "Clone" button in Save.tsx: cloning a record creates a
    brand new, independent database object with the applicable data copied
    over from the original, while fields that must stay unique (e.g. catalog
    or accession numbers) are not blindly duplicated. The original record
    must remain unaffected by the clone.

    CollectionObjectGroup is intentionally not covered here: NO_CLONE in
    ResourceView.tsx hides the Clone button for that table.
    """

    def setUp(self):
        super().setUp()

        self.attachments = [
            models.Attachment.objects.create(
                origfilename='test.txt',
                tableid=1,
                remarks='Test remarks',
            )
        ]
        taxon_root = models.Taxontreedefitem.objects.create(
            name='Root taxon',
            rankid=0,
            treedef=self.taxontreedef,
        )
        self.taxontreedefitems = [
            models.Taxontreedefitem.objects.create(
                name='Test taxon',
                rankid=1,
                parent=taxon_root,
                treedef=self.taxontreedef,
                remarks='Test remarks',
            )
        ]

        geologic_root = models.Geologictimeperiodtreedefitem.objects.create(
            name='Root geologic time period',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )
        self.geologictimeperiodtreedefitems = [
            models.Geologictimeperiodtreedefitem.objects.create(
                name='Test geologic time period',
                rankid=1,
                parent=geologic_root,
                treedef=self.geologictimeperiodtreedef,
                remarks='Test remarks',
            )
        ]

        lithostrat_treedef = models.Lithostrattreedef.objects.create(
            name='Test lithostrat',
        )
        lithostrat_root = models.Lithostrattreedefitem.objects.create(
            name='Root lithostrat item',
            rankid=0,
            treedef=lithostrat_treedef,
        )
        self.lithostrattreedefitems = [
            models.Lithostrattreedefitem.objects.create(
                name='Test lithostrat item',
                rankid=1,
                parent=lithostrat_root,
                treedef=lithostrat_treedef,
                remarks='Test remarks',
            )
        ]

        tectonic_treedef = models.Tectonicunittreedef.objects.create(
            name='Test tectonic unit',
        )
        tectonic_root = models.Tectonicunittreedefitem.objects.create(
            name='Root tectonic unit item',
            rankid=0,
            treedef=tectonic_treedef,
        )
        self.tectonicunittreedefitems = [
            models.Tectonicunittreedefitem.objects.create(
                name='Test tectonic unit item',
                rankid=1,
                parent=tectonic_root,
                treedef=tectonic_treedef,
                remarks='Test remarks',
            )
        ]

        self.agents = [self.agent]
        self.collectingevents = [self.collectingevent]

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
        self.geographies = [
            models.Geography.objects.create(
                name='Test geography',
                rankid=1,
                definition=self.geographytreedef,
                definitionitem=definitionitem,
                parent=geography_root,
                remarks='Test remarks',
            )
        ]
        self.localities = [
            models.Locality.objects.create(
                localityname='Test locality',
                srclatlongunit=0,
                discipline=self.discipline,
                remarks='Test remarks',
            )
        ]

        self.accessions = [
            models.Accession.objects.create(
                accessionnumber='Test accession',
                division=self.division,
                remarks='Test remarks',
            )
        ]
        self.loans = [
            models.Loan.objects.create(
                loannumber='Test loan',
                discipline=self.discipline,
                remarks='Test remarks',
            )
        ]
        self.gifts = [
            models.Gift.objects.create(
                giftnumber='Test gift',
                discipline=self.discipline,
                remarks='Test remarks',
            )
        ]
        self.borrows = [
            models.Borrow.objects.create(
                collectionmemberid=1,
                invoicenumber='Test invoice',
                remarks='Test remarks',
            )
        ]
        self.disposals = [
            models.Disposal.objects.create(
                disposalnumber='Test disposal',
                remarks='Test remarks',
            )
        ]
        self.deaccessions = [
            models.Deaccession.objects.create(
                deaccessionnumber='Test deaccession',
                remarks='Test remarks',
            )
        ]

    def test_clone_collectionobject(self):
        original = self.collectionobjects[0]

        clone = models.Collectionobject.objects.create(
            collection=original.collection,
            collectionobjecttype=original.collectionobjecttype,
            collectionmemberid=original.collectionmemberid,
            # Catalog number is unique per collection, so it is not copied
            catalognumber='num-clone',
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.collection_id, original.collection_id)
        self.assertEqual(
            clone.collectionobjecttype_id, original.collectionobjecttype_id
        )
        self.assertNotEqual(clone.catalognumber, original.catalognumber)

        original.refresh_from_db()
        self.assertEqual(original.catalognumber, 'num-0')

        clone.delete()

    def test_clone_attachment(self):
        original = self.attachments[0]

        clone = models.Attachment.objects.create(
            origfilename=original.origfilename,
            tableid=original.tableid,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.origfilename, original.origfilename)
        self.assertEqual(clone.tableid, original.tableid)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.origfilename, 'test.txt')

        clone.delete()

    def test_clone_taxontreedefitem(self):
        original = self.taxontreedefitems[0]

        clone = models.Taxontreedefitem.objects.create(
            # Name is unique per tree definition, so it is not copied
            name='Test taxon (clone)',
            rankid=original.rankid,
            parent=original.parent,
            treedef=original.treedef,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.rankid, original.rankid)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.treedef_id, original.treedef_id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.name, original.name)

        original.refresh_from_db()
        self.assertEqual(original.name, 'Test taxon')

        clone.delete()

    def test_clone_geologictimeperiodtreedefitem(self):
        original = self.geologictimeperiodtreedefitems[0]

        clone = models.Geologictimeperiodtreedefitem.objects.create(
            name=original.name,
            rankid=original.rankid,
            parent=original.parent,
            treedef=original.treedef,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.rankid, original.rankid)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.treedef_id, original.treedef_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.name, 'Test geologic time period')

        clone.delete()

    def test_clone_lithostrattreedefitem(self):
        original = self.lithostrattreedefitems[0]

        clone = models.Lithostrattreedefitem.objects.create(
            name=original.name,
            rankid=original.rankid,
            parent=original.parent,
            treedef=original.treedef,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.rankid, original.rankid)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.treedef_id, original.treedef_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.name, 'Test lithostrat item')

        clone.delete()

    def test_clone_tectonicunittreedefitem(self):
        original = self.tectonicunittreedefitems[0]

        clone = models.Tectonicunittreedefitem.objects.create(
            name=original.name,
            rankid=original.rankid,
            parent=original.parent,
            treedef=original.treedef,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.rankid, original.rankid)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.treedef_id, original.treedef_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.name, 'Test tectonic unit item')

        clone.delete()

    def test_clone_agent(self):
        original = self.agents[0]

        clone = models.Agent.objects.create(
            agenttype=original.agenttype,
            firstname=original.firstname,
            lastname=original.lastname,
            division=original.division,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.agenttype, original.agenttype)
        self.assertEqual(clone.firstname, original.firstname)
        self.assertEqual(clone.lastname, original.lastname)
        self.assertEqual(clone.division_id, original.division_id)

        original.refresh_from_db()
        self.assertEqual(original.firstname, 'Test')
        self.assertEqual(original.lastname, 'User')

        clone.delete()

    def test_clone_collectingevent(self):
        original = self.collectingevents[0]

        clone = models.Collectingevent.objects.create(
            discipline=original.discipline,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.discipline_id, original.discipline_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.discipline_id, self.discipline.id)

        clone.delete()

    def test_clone_geography(self):
        original = self.geographies[0]

        clone = models.Geography.objects.create(
            name=original.name,
            rankid=original.rankid,
            definition=original.definition,
            definitionitem=original.definitionitem,
            parent=original.parent,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.definition_id, original.definition_id)
        self.assertEqual(clone.definitionitem_id, original.definitionitem_id)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.name, 'Test geography')

        clone.delete()

    def test_clone_locality(self):
        original = self.localities[0]

        clone = models.Locality.objects.create(
            localityname=original.localityname,
            srclatlongunit=original.srclatlongunit,
            discipline=original.discipline,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.localityname, original.localityname)
        self.assertEqual(clone.discipline_id, original.discipline_id)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.localityname, 'Test locality')

        clone.delete()

    def test_clone_accession(self):
        original = self.accessions[0]

        clone = models.Accession.objects.create(
            # Accession number is unique per division, so it is not copied
            accessionnumber='Test accession (clone)',
            division=original.division,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.division_id, original.division_id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.accessionnumber, original.accessionnumber)

        original.refresh_from_db()
        self.assertEqual(original.accessionnumber, 'Test accession')

        clone.delete()

    def test_clone_loan(self):
        original = self.loans[0]

        clone = models.Loan.objects.create(
            # Loan number is unique per discipline, so it is not copied
            loannumber='Test loan (clone)',
            discipline=original.discipline,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.discipline_id, original.discipline_id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.loannumber, original.loannumber)

        original.refresh_from_db()
        self.assertEqual(original.loannumber, 'Test loan')

        clone.delete()

    def test_clone_gift(self):
        original = self.gifts[0]

        clone = models.Gift.objects.create(
            # Gift number is unique per discipline, so it is not copied
            giftnumber='Test gift (clone)',
            discipline=original.discipline,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.discipline_id, original.discipline_id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.giftnumber, original.giftnumber)

        original.refresh_from_db()
        self.assertEqual(original.giftnumber, 'Test gift')

        clone.delete()

    def test_clone_borrow(self):
        original = self.borrows[0]

        clone = models.Borrow.objects.create(
            collectionmemberid=original.collectionmemberid,
            invoicenumber=original.invoicenumber,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.collectionmemberid, original.collectionmemberid)
        self.assertEqual(clone.invoicenumber, original.invoicenumber)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.invoicenumber, 'Test invoice')

        clone.delete()

    def test_clone_disposal(self):
        original = self.disposals[0]

        clone = models.Disposal.objects.create(
            # Disposal number is unique, so it is not copied
            disposalnumber='Test disposal (clone)',
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.disposalnumber, original.disposalnumber)

        original.refresh_from_db()
        self.assertEqual(original.disposalnumber, 'Test disposal')

        clone.delete()

    def test_clone_deaccession(self):
        original = self.deaccessions[0]

        clone = models.Deaccession.objects.create(
            # Deaccession number is unique, so it is not copied
            deaccessionnumber='Test deaccession (clone)',
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertNotEqual(clone.deaccessionnumber, original.deaccessionnumber)

        original.refresh_from_db()
        self.assertEqual(original.deaccessionnumber, 'Test deaccession')

        clone.delete()
