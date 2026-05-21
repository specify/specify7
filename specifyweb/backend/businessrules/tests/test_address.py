from specifyweb.specify.tests.test_api import ApiTests

class AddressTests(ApiTests):
    def test_at_most_one_primary_address_per_agent(self):
        addresses = self.agent.addresses
        a1 = addresses.create(address="foobar st", isprimary=True)
        a2 = addresses.create(address="foobaz st", isprimary=False)
        a3 = addresses.create(address="snozberry st", isprimary=True)
        self.assertEqual(addresses.get(isprimary=True).id, a3.id)
        a2.isprimary = True
        a2.save()
        self.assertEqual(addresses.get(isprimary=True).id, a2.id)
        a2.isprimary = False
        a2.save()
        self.assertEqual(addresses.filter(isprimary=True).count(), 0)
