"""
Browser automation testing

I don't think this is used anymore
"""

import os
from django.test import LiveServerTestCase
from selenium.webdriver.support.ui import WebDriverWait

from specifyweb.specify.tests.test_api import MainSetupTearDown
from .selenium_testsuite_runner import SeleniumTestSuiteRunner as TestRunner


def jquery_selector(selector):
    return lambda driver: driver.execute_script('''return $('%s')[0]''' % selector)

class SeleniumTests(LiveServerTestCase):
    def setUp(self):
        super(SeleniumTests, self).setUp()
        self.selenium = TestRunner.selenium

    def selenium_wait(self):
        return WebDriverWait(self.selenium, 10)

    def wait_select(self, selector):
        return self.selenium_wait().until(jquery_selector(selector))

    def select(self, selector):
        return jquery_selector(selector)(self.selenium)

    def do_login(self, username, password):
        username_input = self.selenium.find_element_by_name('username')
        password_input = self.selenium.find_element_by_name('password')
        collection_input = self.selenium.find_element_by_name('collection_id')
        submit = self.selenium.find_element_by_xpath('//input[@value="Log in"]')

        username_input.send_keys(username)
        password_input.send_keys(password)
        submit.submit()

class WithFixturesTest(SeleniumTests):
    fixtures = ['empty_db.json']

    def test_foo(self):
        self.selenium.get(self.live_server_url)
        self.do_login('testuser', 'testuser')

        # add a taxon
        self.wait_select('.forms a:contains("Taxon")').click()
        self.wait_select('.ui-dialog button').click()
        self.wait_select('input.specify-field[name="parent"]').send_keys('life')
        self.wait_select('.ui-autocomplete a:contains("Life")').click()
        self.wait_select('select[name="definitionItem"] option:contains("Genus")').click()
        self.select('input.specify-field[name="name"]').send_keys('Foo')
        self.select('.save-and-add-button').click()

        # add another taxon
        parent = self.wait_select('input.specify-field[name="parent"]')
        parent.clear()
        parent.send_keys('foo')

        self.wait_select('.ui-autocomplete a:contains("Foo")').click()

        self.wait_select('select[name="definitionItem"] option:contains("Species")').click()

        name = self.select('input.specify-field[name="name"]')
        name.clear()
        name.send_keys('bar\n')

        self.select('.save-button').click()

        self.selenium_wait().until(
            lambda driver: not driver.title.lower().startswith('new'))

        # add collection object
        self.select('#site-name a').click()

        self.wait_select('.forms a:contains("Collection Object")').click()
        recordset_name = self.wait_select('.ui-dialog input[name="name"]')
        recordset_name.clear()
        recordset_name.send_keys('Some Collection Objects')
        self.select('.ui-dialog button').click()

        # add an accession for the object
        self.wait_select('.specify-field[name="accession"] ~ .querycbx-add').click()

        self.wait_select('.ui-dialog .specify-field[name="accessionNumber"]').send_keys('123')
        self.select('.ui-dialog .specify-field[name="type"] option:contains("Field Work")').click()
        self.select('.ui-dialog .specify-field[name="status"] option:contains("In Process")').click()
        self.select('.ui-dialog .specify-field[name="remarks"]').send_keys('A test accession.')

        # add an accession agent
        self.select('.ui-dialog .specify-subview[data-specify-field-name="accessionAgents"] a.specify-add-related').click()

        self.wait_select('.ui-dialog .specify-subview[data-specify-field-name="accessionAgents"] .specify-field[name="agent"]')\
                                     .send_keys('user')
        self.wait_select('.ui-autocomplete a:contains("User"):visible').click()

        self.select('.ui-dialog .save-button').click() # save the accession

        self.select('.specify-field:[name="cataloger"]').send_keys('user')
        self.wait_select('.ui-autocomplete a:contains("User"):visible').click()

        self.select('label:contains("Cataloged Date")').click()
        self.selenium.switch_to_active_element().send_keys('2012-07-04\n')

        # add a determination
        self.select('.specify-subview[data-specify-field-name="determinations"] a.specify-add-related').click()

        self.wait_select('.specify-field[name="taxon"]').send_keys('foo bar')
        self.wait_select('.ui-autocomplete a:contains("Foo bar"):visible').click()

        self.select('label:contains("Determined Date")').click()
        self.selenium.switch_to_active_element().send_keys('2011-07-04\n')

        self.select('.specify-field[name="determiner"]').send_keys('user')
        self.wait_select('.ui-autocomplete a:contains("User"):visible').click()

        self.select('.save-button').click()

        self.selenium_wait().until(
            lambda driver: not driver.title.lower().startswith('new'))


class FreshDBTests(MainSetupTearDown, SeleniumTests):
    from specifyweb import context

    sl_path = os.path.dirname(context.__file__)
    sl_filename = os.path.join(sl_path, 'data', 'schemalocalization.json')
    sl = open(sl_filename).read()

    def setUp(self):
        super(FreshDBTests, self).setUp()
        self.selenium = TestRunner.selenium

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.save()

        # inject a schema localization into the cache to avoid having to load it into the db
        self.schema_localization_cache[self.discipline] = self.sl

    def tearDown(self):
        super(FreshDBTests, self).tearDown()
        del self.schema_localization_cache[self.discipline]

    def test_login(self):
        self.selenium.get(self.live_server_url)
        self.do_login(self.specifyuser.name, self.specifyuser.name)

        self.selenium_wait().until(
            lambda driver: driver.title.lower().startswith("welcome"))

    def test_new_collection_object(self):
        self.selenium.get(self.live_server_url + '/specify/view/collectionobject/new/')
        self.do_login(self.specifyuser.name, self.specifyuser.name)

        self.selenium_wait().until(
            lambda driver: driver.title.lower().startswith('new'))

        self.selenium.find_element_by_name('catalogNumber').clear()
        self.selenium.find_element_by_name('catalogNumber').send_keys('1234')

        # set cataloger
        self.selenium.find_element_by_name('cataloger').send_keys('user')
        self.wait_select('a:contains("User"):visible').click()

        # add determination
        self.select('[data-specify-field-name="determinations"] a.specify-add-related').click()

        self.wait_select('[data-specify-field-name="determinations"] p:contains("nothing here"):hidden')

        # set determiner
        self.selenium.find_element_by_name('determiner').send_keys('user')
        self.wait_select('a:contains("User"):visible').click()

        # set catalog date
        self.select('label:contains("Cat Date")').click()
        self.selenium.switch_to_active_element().send_keys('2012-11-06')

        # set determination date
        jquery_selector('[data-specify-field-name="determinations"] label:contains("Date")')(self.selenium).click()
        self.selenium.switch_to_active_element().send_keys('2012-07-04')

        self.select('.specify-querycbx[name="accession"] ~ .querycbx-add').click()

        self.wait_select('[data-specify-model="Accession"] .specify-field[name="accessionNumber"]').send_keys('0')

        self.select('[data-specify-model="Accession"] .specify-field[name="remarks"]').send_keys('Some test items.')

        self.select('[data-specify-model="Accession"] .save-button:submit').click()

        # save the form
        self.selenium.find_elements_by_class_name("save-button")[0].click()

        self.selenium_wait().until(
            lambda driver: 'new' not in driver.title)

        self.selenium_wait().until(
            lambda driver: driver.find_elements_by_class_name("save-button"))




