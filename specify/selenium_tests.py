from django.test import LiveServerTestCase
from django.conf import settings

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.webdriver import WebDriver, FirefoxProfile

from api_tests import MainSetupTearDown

class SeleniumTests(MainSetupTearDown, LiveServerTestCase):
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
        profile.set_preference('extensions.firebug.defaultPanelName', 'net')
        profile.set_preference('extensions.firebug.net.enableSites', True)
        profile.set_preference('extensions.firebug.console.enableSites', True)

        cls.selenium = WebDriver(firefox_profile=profile)
        super(SeleniumTests, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        #cls.selenium.quit()
        super(SeleniumTests, cls).tearDownClass()

    def test_login(self):
        self.selenium.get(self.live_server_url)
        username_input = self.selenium.find_element_by_name('username')
        password_input = self.selenium.find_element_by_name('password')
        collection_input = self.selenium.find_element_by_name('collection_id')
        submit = self.selenium.find_element_by_xpath('//input[@value="Log in"]')

        username_input.send_keys(self.specifyuser.name)
        password_input.send_keys(self.specifyuser.name) # assume testuser has same username and password
        submit.submit()

        WebDriverWait(self.selenium, 10).until(
            lambda driver: driver.title.lower().startswith("welcome"))

