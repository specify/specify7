from django.test.simple import DjangoTestSuiteRunner

class ReuseDBTestSuiteRunner(DjangoTestSuiteRunner):
    def setup_databases(self, **kwargs):
        from django.db import connections
        old_names = []
        for alias in connections:
            connection = connections[alias]
            db_name = connection.settings_dict['NAME']
            old_names.append((connection, db_name, False))
            connection.settings_dict['NAME'] = connection.settings_dict["TEST_NAME"]
        return old_names, []
