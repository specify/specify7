from specifyweb.specify.tests.test_api import ApiTests


class TestEditPreviousVersionObjects(ApiTests):

    def test_edit_collectionobject_created_in_previous_version(self):
        collectionobject = self.collectionobjects[0]

        collectionobject.catalogeddate = '2026-09-02'
        collectionobject.save()
        collectionobject.refresh_from_db()

        self.assertEqual(
            str(collectionobject.catalogeddate),
            '2026-09-02',
        )

    def test_edit_attachment_created_in_previous_version(self):
        attachment = self.attachments[0]

        attachment.origfilename = 'updated.txt'
        attachment.save()
        attachment.refresh_from_db()

        self.assertEqual(
            attachment.origfilename,
            'updated.txt',
        )

    def test_edit_taxontreedefitem_created_in_previous_version(self):
        item = self.taxontreedefitems[0]

        item.name = 'Updated taxon'
        item.save()
        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Updated taxon',
        )

    def test_edit_geologictimeperiodtreedefitem_created_in_previous_version(self):
        item = self.geologictimeperiodtreedefitems[0]

        item.name = 'Updated geologic time period'
        item.save()
        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Updated geologic time period',
        )

    def test_edit_lithostrattreedefitem_created_in_previous_version(self):
        item = self.lithostrattreedefitems[0]

        item.name = 'Updated lithostrat item'
        item.save()
        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Updated lithostrat item',
        )

    def test_edit_tectonicunittreedefitem_created_in_previous_version(self):
        item = self.tectonicunittreedefitems[0]

        item.name = 'Updated tectonic unit item'
        item.save()
        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Updated tectonic unit item',
        )

    def test_edit_agent_created_in_previous_version(self):
        agent = self.agents[0]

        agent.firstname = 'Updated'
        agent.save()
        agent.refresh_from_db()

        self.assertEqual(
            agent.firstname,
            'Updated',
        )

    def test_edit_collectingevent_created_in_previous_version(self):
        collectingevent = self.collectingevents[0]

        collectingevent.localityname = 'Updated locality'
        collectingevent.save()
        collectingevent.refresh_from_db()

        self.assertEqual(
            collectingevent.localityname,
            'Updated locality',
        )

    def test_edit_geography_created_in_previous_version(self):
        geography = self.geographies[0]

        geography.name = 'Updated geography'
        geography.save()
        geography.refresh_from_db()

        self.assertEqual(
            geography.name,
            'Updated geography',
        )

    def test_edit_locality_created_in_previous_version(self):
        locality = self.localities[0]

        locality.localityname = 'Updated locality'
        locality.save()
        locality.refresh_from_db()

        self.assertEqual(
            locality.localityname,
            'Updated locality',
        )

    def test_edit_collectionobjectgroup_created_in_previous_version(self):
        group = self.collectionobjectgroups[0]

        group.name = 'Updated group'
        group.save()
        group.refresh_from_db()

        self.assertEqual(
            group.name,
            'Updated group',
        )

    def test_edit_accession_created_in_previous_version(self):
        accession = self.accessions[0]

        accession.accessionnumber = '123'
        accession.save()
        accession.refresh_from_db()

        self.assertEqual(
            accession.accessionnumber,
            '123',
        )

    def test_edit_loan_created_in_previous_version(self):
        loan = self.loans[0]

        loan.loannumber = '123'
        loan.save()
        loan.refresh_from_db()

        self.assertEqual(
            loan.loannumber,
            '123',
        )

    def test_edit_gift_created_in_previous_version(self):
        gift = self.gifts[0]

        gift.giftnumber = '123'
        gift.save()
        gift.refresh_from_db()

        self.assertEqual(
            gift.giftnumber,
            '123',
        )

    def test_edit_borrow_created_in_previous_version(self):
        borrow = self.borrows[0]

        borrow.invoicenumber = '123'
        borrow.save()
        borrow.refresh_from_db()

        self.assertEqual(
            borrow.invoicenumber,
            '123',
        )

    def test_edit_disposal_created_in_previous_version(self):
        disposal = self.disposals[0]

        disposal.disposalnumber = '123'
        disposal.save()
        disposal.refresh_from_db()

        self.assertEqual(
            disposal.disposalnumber,
            '123',
        )

    def test_edit_deaccession_created_in_previous_version(self):
        deaccession = self.deaccessions[0]

        deaccession.deaccessionnumber = '123'
        deaccession.save()
        deaccession.refresh_from_db()

        self.assertEqual(
            deaccession.deaccessionnumber,
            '123',
        )