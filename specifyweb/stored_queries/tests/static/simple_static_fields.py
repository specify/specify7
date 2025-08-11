from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec, TreeRankQuery
from specifyweb.stored_queries.queryfield import QueryField

from specifyweb.specify.datamodel import datamodel
import specifyweb.stored_queries.models as sql_models


def get_sql_table(name):
    return getattr(sql_models, name)


static_simple_field_spec = [
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": None,
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "catalogedDate"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": "Full Date",
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("catalogedDate"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "catalogedDate"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": "Day",
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("catalogedDate"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "catalogedDate"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": "Month",
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("catalogedDate"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "catalogNumber"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("catalogNumber"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "guid"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("guid"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "cataloger"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("cataloger"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "cataloger"
                    ),
                    datamodel.get_table_strict("Agent").get_field_strict(
                        "abbreviation"
                    ),
                ),
                "table": datamodel.get_table_strict("Agent"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Agent").get_field_strict(
                    "abbreviation"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "cataloger"
                    ),
                    datamodel.get_table_strict("Agent").get_field_strict("agentType"),
                ),
                "table": datamodel.get_table_strict("Agent"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Agent").get_field_strict(
                    "agentType"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "cataloger"
                    ),
                    datamodel.get_table_strict("Agent").get_field_strict("firstName"),
                ),
                "table": datamodel.get_table_strict("Agent"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Agent").get_field_strict(
                    "firstName"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "determinations"
                    ),
                    datamodel.get_table_strict("Determination").get_field_strict(
                        "isCurrent"
                    ),
                ),
                "table": datamodel.get_table_strict("Determination"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "Determination"
                ).get_field_strict("isCurrent"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "determinations"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("determinations"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "preparations"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("preparations"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "preparations"
                    ),
                    datamodel.get_table_strict("Preparation").get_field_strict("text5"),
                ),
                "table": datamodel.get_table_strict("Preparation"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "Preparation"
                ).get_field_strict("text5"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectionObject"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectionObject"
                ).get_field_strict("collectingEvent"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                ),
                "table": datamodel.get_table_strict("CollectingEvent"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict(
                    "CollectingEvent"
                ).get_field_strict("locality"),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict("text2"),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "text2"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict("remarks"),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "remarks"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "geography"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Continent",
                            "relatedModelName": "Geography",
                            "type": "many-to-one",
                            "column": "geographyId",
                        }
                    ),
                    datamodel.get_table_strict("Geography").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Geography"),
                "date_part": None,
                "tree_rank": "Continent",
                "tree_field": datamodel.get_table_strict("Geography").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "geography"
                    ),
                    datamodel.get_table_strict("Geography").get_field_strict(
                        "geographyCode"
                    ),
                ),
                "table": datamodel.get_table_strict("Geography"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Geography").get_field_strict(
                    "geographyCode"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "geography"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Country",
                            "relatedModelName": "Geography",
                            "type": "many-to-one",
                            "column": "geographyId",
                        }
                    ),
                    datamodel.get_table_strict("Geography").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Geography"),
                "date_part": None,
                "tree_rank": "Country",
                "tree_field": datamodel.get_table_strict("Geography").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "geography"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Province",
                            "relatedModelName": "Geography",
                            "type": "many-to-one",
                            "column": "geographyId",
                        }
                    ),
                    datamodel.get_table_strict("Geography").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Geography"),
                "date_part": None,
                "tree_rank": "Province",
                "tree_field": datamodel.get_table_strict("Geography").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "geography"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "County",
                            "relatedModelName": "Geography",
                            "type": "many-to-one",
                            "column": "geographyId",
                        }
                    ),
                    datamodel.get_table_strict("Geography").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Geography"),
                "date_part": None,
                "tree_rank": "County",
                "tree_field": datamodel.get_table_strict("Geography").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "determinations"
                    ),
                    datamodel.get_table_strict("Determination").get_field_strict(
                        "taxon"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Subspecies",
                            "relatedModelName": "Taxon",
                            "type": "many-to-one",
                            "column": "taxonId",
                        }
                    ),
                    datamodel.get_table_strict("Taxon").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Taxon"),
                "date_part": None,
                "tree_rank": "Subspecies",
                "tree_field": datamodel.get_table_strict("Taxon").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "determinations"
                    ),
                    datamodel.get_table_strict("Determination").get_field_strict(
                        "taxon"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Species",
                            "relatedModelName": "Taxon",
                            "type": "many-to-one",
                            "column": "taxonId",
                        }
                    ),
                    datamodel.get_table_strict("Taxon").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Taxon"),
                "date_part": None,
                "tree_rank": "Species",
                "tree_field": datamodel.get_table_strict("Taxon").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "determinations"
                    ),
                    datamodel.get_table_strict("Determination").get_field_strict(
                        "taxon"
                    ),
                    TreeRankQuery(
                        **{
                            "name": "Genus",
                            "relatedModelName": "Taxon",
                            "type": "many-to-one",
                            "column": "taxonId",
                        }
                    ),
                    datamodel.get_table_strict("Taxon").get_field_strict("name"),
                ),
                "table": datamodel.get_table_strict("Taxon"),
                "date_part": None,
                "tree_rank": "Genus",
                "tree_field": datamodel.get_table_strict("Taxon").get_field_strict(
                    "name"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "latitude1"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "latitude1"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "longitude1"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "longitude1"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "latitude2"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "latitude2"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "longitude2"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "longitude2"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "latLongType"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "latLongType"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "latLongAccuracy"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "latLongAccuracy"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
    QueryField(
        fieldspec=QueryFieldSpec(
            **{
                "root_table": datamodel.get_table_strict("CollectionObject"),
                "root_sql_table": get_sql_table("CollectionObject"),
                "join_path": (
                    datamodel.get_table_strict("CollectionObject").get_field_strict(
                        "collectingEvent"
                    ),
                    datamodel.get_table_strict("CollectingEvent").get_field_strict(
                        "locality"
                    ),
                    datamodel.get_table_strict("Locality").get_field_strict(
                        "localityId"
                    ),
                ),
                "table": datamodel.get_table_strict("Locality"),
                "date_part": None,
                "tree_rank": None,
                "tree_field": datamodel.get_table_strict("Locality").get_field_strict(
                    "localityId"
                ),
            }
        ),
        op_num=8,
        value="",
        negate=False,
        display=True,
        format_name=None,
        sort_type=0,
        strict=None,
    ),
]
