"""Tests for SQLAlchemy connection URL construction.

Verifies that special characters in credentials are properly
URL-encoded so they aren't misinterpreted as URL delimiters.
See: https://github.com/specify/specify7/issues/7387

These tests exercise the same URL-building logic as get_sa_db_url
in specifyweb/settings/__init__.py without importing the full
Django/Celery dependency chain.
"""
from unittest import TestCase
from urllib.parse import quote_plus


def get_sa_db_url(master_name, master_password, db_host, db_port, db_name):
    """Mirror of the production get_sa_db_url with quote_plus encoding.

    This must stay in sync with specifyweb/settings/__init__.py.
    If the production code changes, update this mirror and re-run tests.
    """
    return 'mysql://{}:{}@{}:{}/{}?charset=utf8'.format(
        quote_plus(master_name),
        quote_plus(master_password),
        db_host,
        db_port or 3306,
        db_name)


def get_sa_db_url_broken(master_name, master_password, db_host, db_port, db_name):
    """The OLD (broken) version without URL encoding -- used to confirm
    tests would fail without the fix."""
    return 'mysql://{}:{}@{}:{}/{}?charset=utf8'.format(
        master_name,
        master_password,
        db_host,
        db_port or 3306,
        db_name)


class GetSaDbUrlTests(TestCase):

    def _url(self, master_name='root', master_password='password',
             db_host='localhost', db_port=3306, db_name='testdb'):
        return get_sa_db_url(master_name, master_password,
                             db_host, db_port, db_name)

    def test_plain_password(self):
        url = self._url(master_password='simple')
        self.assertEqual(
            url, 'mysql://root:simple@localhost:3306/testdb?charset=utf8')

    def test_at_sign_in_password(self):
        url = self._url(master_password='p@ssword')
        self.assertIn(quote_plus('p@ssword'), url)
        # The raw @ must not appear unencoded between password and host
        self.assertNotIn(':p@ssword@', url)

    def test_special_chars_in_password(self):
        password = 'p@ss$w#rd:/?'
        url = self._url(master_password=password)
        encoded = quote_plus(password)
        self.assertIn(f':{encoded}@', url)

    def test_special_chars_in_username(self):
        url = self._url(master_name='user@host')
        self.assertIn(f'{quote_plus("user@host")}:', url)

    def test_url_is_well_formed(self):
        url = self._url(master_password='p@ss')
        self.assertTrue(url.startswith('mysql://'))
        self.assertIn('@localhost:3306/testdb?charset=utf8', url)


class BrokenVersionFailsTests(TestCase):
    """Confirm the old code would fail with special characters."""

    def test_at_sign_breaks_old_url(self):
        broken_url = get_sa_db_url_broken(
            'root', 'p@ssword', 'localhost', 3306, 'testdb')
        # The broken version has an unencoded @ that splits the URL wrong
        self.assertIn(':p@ssword@', broken_url)
