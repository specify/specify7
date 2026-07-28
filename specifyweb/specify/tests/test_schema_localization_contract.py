import ast
import json
from pathlib import Path
from unittest import TestCase


# These tables are present in schema_localization_en.json but are not backed by
# Django model classes in models.py, so they need an explicit exception here.
ALLOWLISTED_JSON_ONLY_TABLES = {
    'autonumsch_coll',
    'autonumsch_div',
    'autonumsch_dsp',
    'dnasequencingrunattachment',
    'libraryrole',
    'libraryrolepolicy',
    'message',
    'project_colobj',
    'role',
    'rolepolicy',
    'sp_schema_mapping',
    'spattachmentdataset',
    'spdataset',
    'spdatasetattachment',
    'specifyuser_spprincipal',
    'spmerging',
    'spprincipal_sppermission',
    'spuserexternalid',
    'uniquenessrule',
    'uniquenessrulefield',
    'userpolicy',
    'userrole',
}


class SchemaLocalizationContractTests(TestCase):
    """Ensure schema localization entries cover the model-backed tables."""

    @classmethod
    def setUpClass(cls):
        cls.repo_root = Path(__file__).resolve().parents[3]
        cls.localization_path = cls.repo_root / 'config' / 'common' / 'schema_localization_en.json'
        cls.models_path = cls.repo_root / 'specifyweb' / 'specify' / 'models.py'

        with cls.localization_path.open(encoding='utf-8') as handle:
            cls.localization = json.load(handle)

        cls.model_tables = cls._extract_model_tables()

    @classmethod
    def _extract_model_tables(cls):
        source = cls.models_path.read_text(encoding='utf-8')
        module = ast.parse(source)
        tables = {}

        for node in module.body:
            if not isinstance(node, ast.ClassDef):
                continue

            for child in node.body:
                if isinstance(child, ast.ClassDef) and child.name == 'Meta':
                    for stmt in child.body:
                        if isinstance(stmt, ast.Assign):
                            for target in stmt.targets:
                                if isinstance(target, ast.Name) and target.id == 'db_table':
                                    if isinstance(stmt.value, ast.Constant) and isinstance(stmt.value.value, str):
                                        table = stmt.value.value.lower()
                                        tables.setdefault(table, set()).add(node.name)
                    break

        return tables

    def test_model_tables_have_schema_localization_entries(self):
        json_keys = set(self.localization.keys())
        model_tables = set(self.model_tables)

        missing = sorted(model_tables - json_keys)
        extra = sorted(json_keys - model_tables)

        unexpected_missing = [table for table in missing if table not in ALLOWLISTED_JSON_ONLY_TABLES]
        unexpected_extra = [table for table in extra if table not in ALLOWLISTED_JSON_ONLY_TABLES]

        message_parts = []
        if unexpected_missing:
            message_parts.append(
                'Missing schema localization entries for model-backed tables:\n'
                + '\n'.join(
                    f'{table}: {", ".join(sorted(self.model_tables[table]))}'
                    for table in unexpected_missing
                )
            )

        if unexpected_extra:
            message_parts.append(
                'Unexpected schema localization-only tables:\n'
                + '\n'.join(unexpected_extra)
            )

        if message_parts:
            summary = (
                f'Missing tables: {len(unexpected_missing)}; '
                f'Unexpected tables: {len(unexpected_extra)}'
            )
            self.fail(
                summary
                + '\n\n'
                + '\n\n'.join(message_parts)
                + '\n\nAdd entries to the `schema_localization_en.json` file or update the `allowlisted_json_only_tables` allowlist.'
            )
