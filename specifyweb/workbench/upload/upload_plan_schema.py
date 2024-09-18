from typing import Dict, Any, Union, Tuple

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models

from .upload_table import UploadTable, OneToOneTable, MustMatchTable
from .treerecord import TreeRecord, MustMatchTreeRecord
from .uploadable import Uploadable
from .column_options import ColumnOptions


schema: Dict = {
    "title": "Specify 7 Workbench Upload Plan",
    "description": "The workbench upload plan defines how to load columnar data into the Specify datamodel.",
    "$schema": "http://json-schema.org/schema#",
    "type": "object",
    "properties": {
        "baseTableName": {"type": "string"},
        "uploadable": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "uploadTable": {"$ref": "#/definitions/uploadTable"}
                    },
                    "required": ["uploadTable"],
                    "additionalProperties": False,
                },
                {
                    "type": "object",
                    "properties": {"treeRecord": {"$ref": "#/definitions/treeRecord"}},
                    "required": ["treeRecord"],
                    "additionalProperties": False,
                },
            ]
        },
        "batchEditPrefs": {
            "type": "object",
            "description": "Batch-edit matching preferences",
            "properties": {
                "deferForNullCheck": {
                    "type": "boolean",
                    "default": False,
                    "description": "If true, invisible database fields will not be used for determining whether the record is empty or not.",
                },
                "deferForMatch": {
                    "type": "boolean",
                    "default": True,
                    "description": "If true, invisible database fields will not be used for matching.",
                },
            },
        },
    },
    "required": ["baseTableName", "uploadable"],
    "additionalProperties": False,
    "definitions": {
        "uploadTable": {
            "type": "object",
            "description": "The uploadTable structure defines how to upload data for a given table.",
            "properties": {
                "overrideScope": {
                    "description": "",
                    "type": "object",
                    "properties": {
                        "collection": {"$ref": "#/definitions/scopingOverride"}
                    },
                    "additionalProperties": False,
                },
                "wbcols": {"$ref": "#/definitions/wbcols"},
                "static": {"$ref": "#/definitions/static"},
                "toOne": {"$ref": "#/definitions/toOne"},
                "toMany": {"$ref": "#/definitions/toManyRecords"},
            },
            "required": ["wbcols", "static", "toOne", "toMany"],
            "additionalProperties": False,
        },
        # this is not needed anymore?
        # having it for legacy purposes (most backward compatiblity)
        # TODO: Remove this entirely once front-end treats to-many as uploadables
        "toManyRecord": {
            "type": "object",
            "description": "The toManyRecord structure defines how to upload data for one record into a given table that stands "
            "in a many-to-one relationship to another.",
            "properties": {
                "wbcols": {"$ref": "#/definitions/wbcols"},
                "static": {"$ref": "#/definitions/static"},
                "toOne": {"$ref": "#/definitions/toOne"},
                "toMany": {"$ref": "#/definitions/toManyRecords"},
            },
            # not making tomany required, to not choke on legacy upload plans
            "required": ["wbcols", "static", "toOne"],
            "additionalProperties": False,
        },
        "treeRecord": {
            "type": "object",
            "description": "The treeRecord structure defines how to upload data into Specify tree type table.",
            "properties": {
                "ranks": {
                    "type": "object",
                    "description": "Maps the ranks of the tree to the headers of the source columns of input data.",
                    "additionalProperties": {
                        "oneOf": [
                            {"type": "string"},
                            {
                                "type": "object",
                                "properties": {
                                    "treeNodeCols": {
                                        "$ref": "#/definitions/treeNodeCols"
                                    },
                                },
                                "required": ["treeNodeCols"],
                                "additionalProperties": False,
                            },
                        ]
                    },
                    "examples": [
                        {
                            "Continent": "Continent/Ocean",
                            "Country": "Country",
                            "State": "State/Prov/Pref",
                            "County": "Region",
                        },
                        {
                            "Class": "Class",
                            "Superfamily": "Superfamily",
                            "Family": "Family",
                            "Genus": "Genus",
                            "Subgenus": "Subgenus",
                            "Species": "Species",
                            "Subspecies": "Subspecies",
                        },
                    ],
                },
            },
            "required": ["ranks"],
            "additionalProperties": False,
        },
        "uploadable": {
            "description": "The uploadable structure differentiates among types of uploadable data structures which can be either "
            "the base structure for uploading data or stand in a -to-one relationship to another uploadable structure. Currently only "
            "uploadTable or treeRecord.",
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "uploadTable": {"$ref": "#/definitions/uploadTable"}
                    },
                    "required": ["uploadTable"],
                    "additionalProperties": False,
                },
                {
                    "type": "object",
                    "properties": {
                        "oneToOneTable": {"$ref": "#/definitions/uploadTable"}
                    },
                    "required": ["oneToOneTable"],
                    "additionalProperties": False,
                },
                {
                    "type": "object",
                    "properties": {
                        "mustMatchTable": {"$ref": "#/definitions/uploadTable"}
                    },
                    "required": ["mustMatchTable"],
                    "additionalProperties": False,
                },
                {
                    "type": "object",
                    "properties": {"treeRecord": {"$ref": "#/definitions/treeRecord"}},
                    "required": ["treeRecord"],
                    "additionalProperties": False,
                },
                {
                    "type": "object",
                    "properties": {
                        "mustMatchTreeRecord": {"$ref": "#/definitions/treeRecord"}
                    },
                    "required": ["mustMatchTreeRecord"],
                    "additionalProperties": False,
                },
            ],
        },
        "wbcols": {
            "type": "object",
            "description": "Maps the columns of the destination table to the headers of the source columns of input data.",
            "additionalProperties": {
                "oneOf": [{"type": "string"}, {"$ref": "#/definitions/columnOptions"}]
            },
            "examples": [
                {
                    "catalognumber": "Specimen #",
                    "catalogeddate": "Recored Date",
                    "objectcondition": "Condition",
                },
                {
                    "lastname": "Collector 1 Last Name",
                    "firstname": "Collector 1 First Name",
                },
            ],
        },
        "treeNodeCols": {
            "type": "object",
            "description": "Maps the columns of the destination tree table to the headers of the source columns of input data.",
            "required": ["name"],
            "properties": {
                "nodenumber": False,
                "highestchildnodenumber": False,
                "rankid": False,
            },
            "additionalProperties": {
                "oneOf": [{"type": "string"}, {"$ref": "#/definitions/columnOptions"}]
            },
            "examples": [
                {"name": "Species", "author": "Species Author"},
            ],
        },
        "columnOptions": {
            "type": "object",
            "properties": {
                "column": {
                    "type": "string",
                    "description": "The column header of the source data.",
                },
                "matchBehavior": {
                    "type": "string",
                    "enum": ["ignoreWhenBlank", "ignoreAlways", "ignoreNever"],
                    "default": "ignoreNever",
                    "description": """When set to ignoreWhenBlank blank values in this column will not be considered for matching purposes.
Blank values are ignored when matching even if a default values is provided. When set to ignoreAlways the value in
this column will never be considered for matching purposes, only for uploading.""",
                },
                "nullAllowed": {
                    "type": "boolean",
                    "default": True,
                    "description": "If set to false rows that would result in null values being uploaded for this column will be rejected.",
                },
                "default": {
                    "type": ["string", "null"],
                    "default": None,
                    "description": "When set use this value for any cells that are empty in this column.",
                },
            },
            "required": ["column"],
            "additionalProperties": False,
        },
        "toOne": {
            "type": "object",
            "description": "Maps the names of -to-one relationships of the table to upload definitions for each.",
            "additionalProperties": {"$ref": "#/definitions/uploadable"},
        },
        "static": {
            "type": "object",
            "description": "A set of static values that will be added to every record loaded.",
            "examples": [{"ispublic": True, "license": "CC BY-NC-ND 2.0"}],
        },
        "scopingOverride": {
            "description": "",
            "default": None,
            "oneOf": [{"type": "integer"}, {"type": "null"}],
        },
        "toManyRecords": {
            "type": "object",
            "desciption": "Maps the names of -to-many relationships of the table to an array of upload definitions for each.",
            "additionalProperties": {
                "type": "array",
                "items": {"$ref": "#/definitions/toManyRecord"},
            },
        },
    },
}


def parse_plan_with_basetable(to_parse: Dict) -> Tuple[Table, Uploadable]:
    base_table = datamodel.get_table_strict(to_parse["baseTableName"])
    return base_table, parse_uploadable(base_table, to_parse["uploadable"])


def parse_plan(to_parse: Dict) -> Uploadable:
    return parse_plan_with_basetable(to_parse)[1]


def parse_uploadable(table: Table, to_parse: Dict) -> Uploadable:
    if "uploadTable" in to_parse:
        return parse_upload_table(table, to_parse["uploadTable"])

    if "oneToOneTable" in to_parse:
        return OneToOneTable(*parse_upload_table(table, to_parse["oneToOneTable"]))

    if "mustMatchTable" in to_parse:
        return MustMatchTable(*parse_upload_table(table, to_parse["mustMatchTable"]))

    if "mustMatchTreeRecord" in to_parse:
        return MustMatchTreeRecord(
            *parse_tree_record(table, to_parse["mustMatchTreeRecord"])
        )

    if "treeRecord" in to_parse:
        return parse_tree_record(table, to_parse["treeRecord"])

    raise ValueError("unknown uploadable type")


def parse_upload_table(table: Table, to_parse: Dict) -> UploadTable:

    def rel_table(key: str) -> Table:
        return datamodel.get_table_strict(table.get_relationship(key).relatedModelName)

    return UploadTable(
        name=table.django_name,
        overrideScope=(
            to_parse["overrideScope"] if "overrideScope" in to_parse.keys() else None
        ),
        wbcols={k: parse_column_options(v) for k, v in to_parse["wbcols"].items()},
        static=to_parse["static"],
        toOne={
            key: parse_uploadable(rel_table(key), to_one)
            for key, to_one in to_parse["toOne"].items()
        },
        toMany={
            key: [
                parse_uploadable(rel_table(key), _hacky_augment_to_many(record))
                for record in to_manys
            ]
            # legacy
            for key, to_manys in to_parse.get("toMany", {}).items()
        },
    )


# TODO: Figure out a better way to do this. Django migration? Silently handle it?
def _hacky_augment_to_many(to_parse: Dict):
    return {"uploadTable": to_parse}


def parse_tree_record(table: Table, to_parse: Dict) -> TreeRecord:
    ranks = {
        rank: (
            {"name": parse_column_options(name_or_cols)}
            if isinstance(name_or_cols, str)
            else {
                k: parse_column_options(v)
                for k, v in name_or_cols["treeNodeCols"].items()
            }
        )
        for rank, name_or_cols in to_parse["ranks"].items()
    }
    for rank, cols in ranks.items():
        assert "name" in cols, to_parse

    return TreeRecord(
        name=table.django_name,
        ranks=ranks,
    )


def parse_column_options(to_parse: Union[str, Dict]) -> ColumnOptions:
    if isinstance(to_parse, str):
        return ColumnOptions(
            column=to_parse,
            matchBehavior="ignoreNever",
            nullAllowed=True,
            default=None,
        )
    else:
        return ColumnOptions(
            column=to_parse["column"],
            matchBehavior=to_parse.get("matchBehavior", "ignoreNever"),
            nullAllowed=to_parse.get("nullAllowed", True),
            default=to_parse.get("default", None),
        )
