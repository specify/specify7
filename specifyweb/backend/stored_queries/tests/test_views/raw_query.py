get_simple_query = lambda specifyuser: {
    "name": "New Query",
    "contextname": "CollectionObject",
    "contexttableid": 1,
    "selectdistinct": False,
    "smushed": False,
    "countonly": False,
    "formatauditrecids": False,
    "specifyuser": f"/api/specify/specifyuser/{specifyuser.id}/",
    "isfavorite": True,
    "ordinal": 32767,
    "fields": [
        {
            "tablelist": "1",
            "stringid": "1.collectionobject.catalogNumber",
            "fieldname": "catalogNumber",
            "isrelfld": False,
            "sorttype": 0,
            "position": 0,
            "isdisplay": True,
            "operstart": 8,
            "startvalue": "",
            "isnot": False,
            "isstrict": False,
            "_tableName": "SpQueryField"
        }
    ],
    "_tableName": "SpQuery"
}