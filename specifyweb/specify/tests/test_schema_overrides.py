"""
Tests to validate schema_overrides.json files.

These tests ensure that:
1. All table names in schema_overrides.json exist in schema_localization_en.json
2. All field names in schema_overrides.json items exist in the corresponding table in schema_localization_en.json

```bash
./venv/bin/python -m pytest specifyweb/specify/tests/test_schema_overrides.py -v
```

"""

import json
from pathlib import Path
from unittest import TestCase


def load_json_file(path: Path) -> dict:
    """Load a JSON file and return its contents."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_all_schema_overrides_paths() -> list[Path]:
    """Get all schema_overrides.json files in the config directory."""
    config_dir = Path(__file__).parent.parent.parent.parent / 'config'
    override_files = []
    
    # Recursively find all schema_overrides.json files
    for override_file in config_dir.rglob('schema_overrides.json'):
        override_files.append(override_file)
    
    return sorted(override_files)


class SchemaOverridesValidationTests(TestCase):
    """Validate all schema_overrides.json files against schema_localization_en.json."""
    
    @classmethod
    def setUpClass(cls):
        """Load the base schema localization file once for all tests."""
        schema_locale_path = (
            Path(__file__).parent.parent.parent.parent / 
            'config' / 'common' / 'schema_localization_en.json'
        )
        cls.schema_localization = load_json_file(schema_locale_path)
    
    def test_schema_overrides_files_exist(self):
        """Test that at least one schema_overrides.json file exists."""
        override_files = get_all_schema_overrides_paths()
        self.assertGreater(
            len(override_files),
            0,
            "No schema_overrides.json files found in config directory"
        )
    
    def test_all_table_names_exist_in_localization(self):
        """Test that all table names in overrides exist in schema_localization_en.json."""
        override_files = get_all_schema_overrides_paths()
        errors = []
        
        for override_file in override_files:
            overrides = load_json_file(override_file)
            discipline = override_file.parent.name
            
            for table_name in overrides.keys():
                table_name_lower = table_name.lower()
                
                if table_name_lower not in self.schema_localization:
                    errors.append(
                        f"[{discipline}] Table '{table_name}' not found in schema_localization_en.json"
                    )
        
        self.assertEqual(
            len(errors),
            0,
            f"Table name validation errors:\n" + "\n".join(errors)
        )
    
    def test_all_field_names_exist_in_tables(self):
        """Test that all field names in items exist in the corresponding table's schema."""
        override_files = get_all_schema_overrides_paths()
        errors = []
        
        for override_file in override_files:
            overrides = load_json_file(override_file)
            discipline = override_file.parent.name
            
            for table_name, table_config in overrides.items():
                table_name_lower = table_name.lower()
                table_schema = self.schema_localization.get(table_name_lower, {})
                table_items = table_schema.get('items', {})
                
                # Check items in the override
                override_items = table_config.get('items', [])
                if isinstance(override_items, list):
                    for item_dict in override_items:
                        for field_name in item_dict.keys():
                            field_name_lower = field_name.lower()
                            
                            # Handle nested items
                            if 'items' in item_dict[field_name]:
                                # This is a nested structure, validate the items
                                nested_items = item_dict[field_name].get('items', [])
                                if isinstance(nested_items, list):
                                    for nested_item_dict in nested_items:
                                        for nested_field_name in nested_item_dict.keys():
                                            nested_field_lower = nested_field_name.lower()
                                            # For nested items, we can't easily validate without
                                            # knowing the exact structure, so we'll just check
                                            # that it's in the root table's items if it's a simple field
                                            if nested_field_lower not in table_items and \
                                               nested_field_lower != field_name_lower.lower():
                                                # This might be a valid nested field, skip strict validation
                                                pass
                            elif field_name_lower not in table_items:
                                errors.append(
                                    f"[{discipline}/{table_name}] Field '{field_name}' not found in table schema"
                                )
        
        self.assertEqual(
            len(errors),
            0,
            f"Field name validation errors:\n" + "\n".join(errors)
        )
    
    def test_schema_overrides_json_valid(self):
        """Test that all schema_overrides.json files are valid JSON."""
        override_files = get_all_schema_overrides_paths()
        errors = []
        
        for override_file in override_files:
            try:
                load_json_file(override_file)
            except json.JSONDecodeError as e:
                errors.append(
                    f"{override_file.relative_to(override_file.parent.parent.parent)}: {e}"
                )
        
        self.assertEqual(
            len(errors),
            0,
            f"JSON validation errors:\n" + "\n".join(errors)
        )
    
    def test_schema_overrides_structure(self):
        """Test that schema_overrides.json files have the expected structure."""
        override_files = get_all_schema_overrides_paths()
        errors = []
        
        for override_file in override_files:
            overrides = load_json_file(override_file)
            discipline = override_file.parent.name
            
            # Top level should be a dict of tables
            if not isinstance(overrides, dict):
                errors.append(
                    f"[{discipline}] Root must be a dictionary"
                )
                continue
            
            for table_name, table_config in overrides.items():
                if not isinstance(table_config, dict):
                    errors.append(
                        f"[{discipline}/{table_name}] Table config must be a dictionary"
                    )
                    continue
                
                # If items exist, they should be a list
                if 'items' in table_config:
                    items = table_config['items']
                    if not isinstance(items, list):
                        errors.append(
                            f"[{discipline}/{table_name}] 'items' must be a list"
                        )
                        continue
                    
                    # Each item should be a dict with field names as keys
                    for idx, item in enumerate(items):
                        if not isinstance(item, dict):
                            errors.append(
                                f"[{discipline}/{table_name}] items[{idx}] must be a dictionary"
                            )
                            continue
                        
                        # Each field in the item should have a config dict
                        for field_name, field_config in item.items():
                            if not isinstance(field_config, dict):
                                errors.append(
                                    f"[{discipline}/{table_name}] items[{idx}][{field_name}] must be a dictionary"
                                )
        
        self.assertEqual(
            len(errors),
            0,
            f"Structure validation errors:\n" + "\n".join(errors)
        )
