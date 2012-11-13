from django.test.simple import DjangoTestSuiteRunner
from django.conf import settings

from selenium.webdriver.firefox.webdriver import WebDriver, FirefoxProfile

class SeleniumTestSuiteRunner(DjangoTestSuiteRunner):
    def setup_test_environment(self, **kwargs):
        super(SeleniumTestSuiteRunner, self).setup_test_environment(**kwargs)

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

        self.__class__.selenium = WebDriver(firefox_profile=profile)

    def teardown_test_environment(self):
        self.__class__.selenium.quit()
        super(SeleniumTestSuiteRunner, self).teardown_test_environment()

