from django.test import TestCase

from specifyweb.backend.permissions.models import LibraryRole


class AttachmentImportRoleTests(TestCase):
    def test_role_has_dataset_actions(self):
        role = LibraryRole.objects.get(name="Bulk Attachment Import")

        actions = set(
            role.policies.filter(
                resource="/attachment_import/dataset"
            ).values_list("action", flat=True)
        )

        self.assertEqual(
            actions,
            {"create", "update", "delete", "upload", "rollback"},
        )
