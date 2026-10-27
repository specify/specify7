from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.load_datamodel import Relationship


class TreeRankQuery(Relationship):
    # FUTURE: used to remember what the previous value was. Useless after 6 retires
    original_field: str
    # This is used to query a particular treedef. If this is none, all treedefs are searched, otherwise a specific treedef is searched.
    treedef_id: int | None
    # Yeah this can be inferred from treedef_id but doing it this way avoids a database lookup because we already fetch it once.
    treedef_name: str | None

    def __hash__(self):
        return hash((TreeRankQuery, self.relatedModelName, self.name))

    def __eq__(self, value):
        return (
            isinstance(value, TreeRankQuery)
            and value.name == self.name
            and value.relatedModelName == self.relatedModelName
        )

    @staticmethod
    def create(name, table_name, treedef_id=None, treedef_name=None):
        obj = TreeRankQuery(
            name=name,
            relatedModelName=table_name,
            type="many-to-one",
            column=datamodel.get_table_strict(table_name).idFieldName,
        )
        obj.treedef_id = treedef_id
        obj.treedef_name = treedef_name
        return obj

    def get_workbench_name(self):
        from specifyweb.backend.workbench.upload.treerecord import RANK_KEY_DELIMITER

        # Treedef id included to make it easier to pass it to batch edit
        return f"{self.treedef_name}{RANK_KEY_DELIMITER}{self.name}{RANK_KEY_DELIMITER}{self.treedef_id}"
