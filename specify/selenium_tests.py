import os

from django.test import LiveServerTestCase
from django.conf import settings

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.webdriver import WebDriver, FirefoxProfile

from api_tests import MainSetupTearDown

class SeleniumTests(MainSetupTearDown, LiveServerTestCase):
    import context
    from context.schema_localization import schema_localization_cache

    sl_path = os.path.dirname(context.__file__)
    sl_filename = os.path.join(sl_path, 'data', 'schemalocalization.json')
    sl = open(sl_filename).read()

    @classmethod
    def setUpClass(cls):
        profile = FirefoxProfile()
        profile.add_extension(settings.FIREBUG_EXTENSION)
        profile.add_extension(settings.FIRESTARTER_EXTENSION)
        profile.set_preference('extensions.firebug.currentVersion', '1.10.3')
        profile.set_preference('extensions.firebug.allPagesActivation', 'on')
        profile.set_preference('extensions.firebug.previousPlacement', 1)
        profile.set_preference('extensions.firebug.onByDefault', True)
        profile.set_preference('extensions.firebug.showFirstRunPage', False)
        profile.set_preference('extensions.firebug.defaultPanelName', 'console')
        profile.set_preference('extensions.firebug.net.enableSites', True)
        profile.set_preference('extensions.firebug.console.enableSites', True)

        cls.selenium = WebDriver(firefox_profile=profile)
        super(SeleniumTests, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        #cls.selenium.quit()
        super(SeleniumTests, cls).tearDownClass()

    def setUp(self):
        super(SeleniumTests, self).setUp()

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.save()

        # inject a schema localization into the cache to avoid having to load it into the db
        self.schema_localization_cache[self.discipline] = self.sl

    def tearDown(self):
        super(SeleniumTests, self).tearDown()
        del self.schema_localization_cache[self.discipline]

    def selenium_wait(self):
        return WebDriverWait(self.selenium, 10)

    def test_login(self):
        self.selenium.get(self.live_server_url)
        self.do_login()

        self.selenium_wait().until(
            lambda driver: driver.title.lower().startswith("welcome"))

    def do_login(self):
        username_input = self.selenium.find_element_by_name('username')
        password_input = self.selenium.find_element_by_name('password')
        collection_input = self.selenium.find_element_by_name('collection_id')
        submit = self.selenium.find_element_by_xpath('//input[@value="Log in"]')

        username_input.send_keys(self.specifyuser.name)
        password_input.send_keys(self.specifyuser.name) # assume testuser has same username and password
        submit.submit()

    def test_new_collection_object_wo_schema_localization(self):
        del self.schema_localization_cache[self.discipline]
        self.selenium.get(self.live_server_url + '/specify/view/collectionobject/new/')
        self.do_login()

        self.selenium_wait().until(
            lambda driver: driver.title.lower().startswith('new'))

    def test_new_collection_object(self):
        self.selenium.get(self.live_server_url + '/specify/view/collectionobject/new/')
        self.do_login()

        self.selenium_wait().until(
            lambda driver: driver.title.lower().startswith('new'))

        self.selenium.find_element_by_name('catalogNumber').clear()
        self.selenium.find_element_by_name('catalogNumber').send_keys('1234')

        # set cataloger
        self.selenium.find_element_by_name('cataloger').send_keys('user')

        def get_test_user_autocomplete(driver):
            return driver.execute_script('''return $('a:contains("User"):visible')[0]''')

        self.selenium_wait().until(get_test_user_autocomplete)

        get_test_user_autocomplete(self.selenium).click()


        # add determination
        self.selenium.execute_script(
            '''return $('[data-specify-field-name="determinations"] a.specify-add-related')[0]'''
            ).click()

        self.selenium_wait().until(
            lambda driver: driver.execute_script('''
                return $('[data-specify-field-name="determinations"] p:contains("nothing here"):hidden')[0]
            '''))

        # set determiner
        self.selenium.find_element_by_name('determiner').send_keys('user')

        self.selenium_wait().until(get_test_user_autocomplete)

        get_test_user_autocomplete(self.selenium).click()

        #self.selenium.execute_script('''return $('label:contains("Cat Date")')[0]''').click()
        #self.selenium.send_keys('2012-11-06')

        # save the form
        self.selenium.find_elements_by_class_name("save-button")[0].click()

        self.selenium_wait().until(
            lambda driver: 'new' not in driver.title)

        self.selenium_wait().until(
            lambda driver: driver.find_elements_by_class_name("save-button"))



