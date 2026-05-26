## Data Mapper (WbPlanView)

WbPlanView stands for WorkBench Upload Plan Viewer

### Concepts

Tree rank names are prefixed with `$` (`$Kingdom`) and -to-many indexes with `#`
(`#1`) everywhere, except for Upload Plan

#### UploadPlan

JSON object that explains how Data Set columns should be corresponded to Data
Model fields.

Upload Plan is the final product of any WbPlanView mapping. It is used by the
back-end during the validation/upload process.

[JSON Schema](https://github.com/specify/specify7/blob/main/specifyweb/workbench/upload/upload_plan_schema.py)

Example:

```json
{
  "baseTableName": "collectingevent",
  "uploadable": {
    "uploadTable": {
      "wbcols": {
        "enddate": "Field Number",
        "method": "Collecting Event Gear"
      },
      "static": {},
      "toOne": {
        "locality": {
          "uploadTable": {
            "wbcols": {
              "localityname": "Locality",
              "latitude1": "Latitude1",
              "longitude1": "Longitude1"
            },
            "static": {},
            "toOne": {
              "geography": {
                "treeRecord": {
                  "ranks": {
                    "Continent": {
                      "treeNodeCols": {
                        "name": "Continent"
                      }
                    },
                    "Country": {
                      "treeNodeCols": {
                        "name": "Country"
                      }
                    },
                    "State": {
                      "treeNodeCols": {
                        "name": "State"
                      }
                    },
                    "County": {
                      "treeNodeCols": {
                        "name": "County"
                      }
                    }
                  }
                }
              }
            },
            "toMany": {}
          }
        }
      },
      "toMany": {}
    }
  }
}
```

#### SplitMappingPaths

Branches of `UploadPlan` split into array of objects:

```json
[
  {
    "mappingPath": ["enddate"],
    "headerName": "Field Number",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["method"],
    "headerName": "Collecting Event Gear",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "localityname"],
    "headerName": "Locality",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "latitude1"],
    "headerName": "Latitude1",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "longitude1"],
    "headerName": "Longitude1",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "geography", "$Continent", "name"],
    "headerName": "Continent",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "geography", "$Country", "name"],
    "headerName": "Country",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "geography", "$State", "name"],
    "headerName": "State",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["locality", "geography", "$County", "name"],
    "headerName": "County",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": ["collectors", "#1", "agent", "email"],
    "headerName": "Collectors Email",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  }
]
```
