from django.test import SimpleTestCase
from unittest.mock import patch

from specifyweb.backend.workbench.upload.auditlog import _extract_pref_bool, _get_pref_bool


class AuditLogPreferenceTests(SimpleTestCase):
    def test_extract_pref_bool_parses_true_false(self) -> None:
        self.assertTrue(_extract_pref_bool("auditing.do_audits=true", "auditing.do_audits"))
        self.assertFalse(_extract_pref_bool("auditing.do_audits=false", "auditing.do_audits"))
        self.assertIsNone(_extract_pref_bool("auditing.do_audits=maybe", "auditing.do_audits"))
        self.assertIsNone(_extract_pref_bool("", "auditing.do_audits"))

    @patch('specifyweb.backend.workbench.upload.auditlog.get_global_prefs', return_value="auditing.do_audits=false")
    @patch('specifyweb.backend.workbench.upload.auditlog.get_remote_prefs', return_value="auditing.do_audits=true")
    def test_prefers_global_preferences_when_present(self, _mock_remote, _mock_global) -> None:
        self.assertFalse(_get_pref_bool("auditing.do_audits"))

    @patch('specifyweb.backend.workbench.upload.auditlog.get_global_prefs', return_value="")
    @patch('specifyweb.backend.workbench.upload.auditlog.get_remote_prefs', return_value="auditing.audit_field_updates=false")
    def test_uses_remote_when_global_missing(self, _mock_remote, _mock_global) -> None:
        self.assertFalse(_get_pref_bool("auditing.audit_field_updates"))

    @patch('specifyweb.backend.workbench.upload.auditlog.get_global_prefs', return_value="")
    @patch('specifyweb.backend.workbench.upload.auditlog.get_remote_prefs', return_value="")
    def test_default_false_when_missing_everywhere(self, _mock_remote, _mock_global) -> None:
        self.assertFalse(_get_pref_bool("auditing.do_audits"))

    @patch('specifyweb.backend.workbench.upload.auditlog.get_global_prefs', return_value="")
    @patch('specifyweb.backend.workbench.upload.auditlog.get_remote_prefs', return_value="")
    def test_default_value_used_when_requested(self, _mock_remote, _mock_global) -> None:
        self.assertTrue(_get_pref_bool("auditing.do_audits", default=True))
