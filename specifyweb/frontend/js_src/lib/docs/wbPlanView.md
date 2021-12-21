## Data Mapper (WbPlanView)

### Concepts

Tree rank names are prefixed with `$` (`$Kingdom`) and -to-many indexes with `#`
(`#1`) everywhere, except for Upload Plan

#### UploadPlan

JSON object that explains how Data Set columns should be corresponded to Data
Model fields.

Upload Plan is the final product of any WbPlanView mapping. It is used by the
back-end during the validation/upload process.

[JSON Schema](https://github.com/specify/specify7/blob/production/specifyweb/workbench/upload/upload_plan_schema.py)

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

#### MappingTree

Serves similar purpose as `UploadPlan`, but it's structure is optimized for
easier mutation, rather than expression of relationship types and field types.

It is used by `WbPlanView` as an intermediate step between `UploadPlan` and
`MappingPaths`.

Example:
```json5
{
  // Field name
  "enddate": {
    /*
     * This is always 'existingHeader' (artifact from the previous
     * implementation of new header addition)
     */
    "existingHeader": {
      // The name of the column in the Data Set
      "Field Number": {
        // 'ignoreWhenBlank' | 'ignoreAlways' | 'ignoreNever'
        "matchBehavior": "ignoreNever",
        // boolean
        "nullAllowed": true,
        // null | string
        "default": null
      }
    }
  },
  "method": {
    "existingHeader": {
      "Collecting Event Gear": {
        "matchBehavior": "ignoreNever",
        "nullAllowed": true,
        "default": null
      }
    }
  },
  "locality": {
    "localityname": {
      "existingHeader": {
        "Locality": {
          "matchBehavior": "ignoreNever",
          "nullAllowed": true,
          "default": null
        }
      }
    },
    "latitude1": {
      "existingHeader": {
        "Latitude1": {
          "matchBehavior": "ignoreNever",
          "nullAllowed": true,
          "default": null
        }
      }
    },
    "longitude1": {
      "existingHeader": {
        "Longitude1": {
          "matchBehavior": "ignoreNever",
          "nullAllowed": true,
          "default": null
        }
      }
    },
    // Relationship Name
    "geography": {
      // Rank names begin with '$'
      "$Continent": {
        "name": {
          "existingHeader": {
            "Continent": {
              "matchBehavior": "ignoreNever",
              "nullAllowed": true,
              "default": null
            }
          }
        }
      },
      "$Country": {
        "name": {
          "existingHeader": {
            "Country": {
              "matchBehavior": "ignoreNever",
              "nullAllowed": true,
              "default": null
            }
          }
        }
      },
      "$State": {
        "name": {
          "existingHeader": {
            "State": {
              "matchBehavior": "ignoreNever",
              "nullAllowed": true,
              "default": null
            }
          }
        }
      },
      "$County": {
        "name": {
          "existingHeader": {
            "County": {
              "matchBehavior": "ignoreNever",
              "nullAllowed": true,
              "default": null
            }
          }
        }
      }
    }
  },
  "collectors": {
    // To-many reference number. 1-based index. The number itself has no meaning
    "#1": {
      "agent": {
        "email": {
          "existingHeader": {
            "Collectors Email": {
              "matchBehavior": "ignoreNever",
              "nullAllowed": true,
              "default": null
            }
          }
        }
      }
    }
  }
}
```

#### MappingPaths

Branches of `MappingsTree` separated into an array of tupples:

```json
[
  [
    "enddate",
    "existingHeader",
    "Field Number",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "method",
    "existingHeader",
    "Collecting Event Gear",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "localityname",
    "existingHeader",
    "Locality",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "latitude1",
    "existingHeader",
    "Latitude1",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "longitude1",
    "existingHeader",
    "Longitude1",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "geography",
    "$Continent",
    "name",
    "existingHeader",
    "Continent",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "geography",
    "$Country",
    "name",
    "existingHeader",
    "Country",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "geography",
    "$State",
    "name",
    "existingHeader",
    "State",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "locality",
    "geography",
    "$County",
    "name",
    "existingHeader",
    "County",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ],
  [
    "collectors",
    "#1",
    "agent",
    "email",
    "existingHeader",
    "Collectors Email",
    {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  ]
]
```

#### SplitMappingPaths

Array of tuples (`MappingPaths`) converted into array of objects:

```json
[
  {
    "mappingPath": [
      "enddate"
    ],
    "mappingType": "existingHeader",
    "headerName": "Field Number",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "method"
    ],
    "mappingType": "existingHeader",
    "headerName": "Collecting Event Gear",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "localityname"
    ],
    "mappingType": "existingHeader",
    "headerName": "Locality",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "latitude1"
    ],
    "mappingType": "existingHeader",
    "headerName": "Latitude1",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "longitude1"
    ],
    "mappingType": "existingHeader",
    "headerName": "Longitude1",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "geography",
      "$Continent",
      "name"
    ],
    "mappingType": "existingHeader",
    "headerName": "Continent",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "geography",
      "$Country",
      "name"
    ],
    "mappingType": "existingHeader",
    "headerName": "Country",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "geography",
      "$State",
      "name"
    ],
    "mappingType": "existingHeader",
    "headerName": "State",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "locality",
      "geography",
      "$County",
      "name"
    ],
    "mappingType": "existingHeader",
    "headerName": "County",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  },
  {
    "mappingPath": [
      "collectors",
      "#1",
      "agent",
      "email"
    ],
    "mappingType": "existingHeader",
    "headerName": "Collectors Email",
    "columnOptions": {
      "matchBehavior": "ignoreNever",
      "nullAllowed": true,
      "default": null
    }
  }
]
```