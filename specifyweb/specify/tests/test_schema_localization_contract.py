import ast
import json
from pathlib import Path
from unittest import TestCase


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

        allowlisted_json_only_tables = {
            'dnasequencingrunattachment',
            'libraryrole',
            'libraryrolepolicy',
            'message',
            'role',
            'rolepolicy',
            'spattachmentdataset',
            'spdataset',
            'spdatasetattachment',
            'spmerging',
            'spuserexternalid',
            'uniquenessrule',
            'uniquenessrulefield',
            'userpolicy',
            'userrole',
        }

        unexpected_extra = [table for table in extra if table not in allowlisted_json_only_tables]

        if missing or unexpected_extra:
            self.fail(
                'Missing schema localization entries for model-backed tables:\n'
                + '\n'.join(
                    f'{table}: {", ".join(sorted(self.model_tables[table]))}'
                    for table in missing
                )
                + '\n\nUnexpected schema localization-only tables:\n'
                + '\n'.join(unexpected_extra)
            )
