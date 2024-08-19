plan = {
    "baseTableName": "Collectionobject",
    "uploadable": {
        "uploadTable": {
            "wbcols": {
                "catalognumber": "CollectionObject catalogNumber",
                "integer1": "CollectionObject integer1",
            },
            "static": {},
            "toOne": {
                "cataloger": {
                    "uploadTable": {
                        "wbcols": {
                            "firstname": "Agent firstName",
                            "lastname": "Agent lastName",
                        },
                        "static": {},
                        "toOne": {},
                        "toMany": {
                            "agentspecialties": [
                                {
                                    "wbcols": {
                                        "specialtyname": "AgentSpecialty specialtyName"
                                    },
                                    "static": {},
                                    "toOne": {},
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {
                                        "specialtyname": "AgentSpecialty specialtyName #2"
                                    },
                                    "static": {},
                                    "toOne": {},
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {
                                        "specialtyname": "AgentSpecialty specialtyName #3"
                                    },
                                    "static": {},
                                    "toOne": {},
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {
                                        "specialtyname": "AgentSpecialty specialtyName #4"
                                    },
                                    "static": {},
                                    "toOne": {},
                                    "toMany": {},
                                },
                            ],
                            "collectors": [
                                {
                                    "wbcols": {"remarks": "Collector remarks"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #2"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #2"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #3"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #3"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #4"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #4"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #5"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #5"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #6"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #6"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #7"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #7"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                                {
                                    "wbcols": {"remarks": "Collector remarks #8"},
                                    "static": {},
                                    "toOne": {
                                        "collectingevent": {
                                            "uploadTable": {
                                                "wbcols": {
                                                    "stationfieldnumber": "CollectingEvent stationFieldNumber #8"
                                                },
                                                "static": {},
                                                "toOne": {},
                                                "toMany": {},
                                            }
                                        }
                                    },
                                    "toMany": {},
                                },
                            ],
                        },
                    }
                }
            },
            "toMany": {
                "determinations": [
                    {
                        "wbcols": {
                            "integer1": "Determination integer1",
                            "remarks": "Determination remarks",
                        },
                        "static": {},
                        "toOne": {},
                        "toMany": {},
                    },
                    {
                        "wbcols": {
                            "integer1": "Determination integer1 #2",
                            "remarks": "Determination remarks #2",
                        },
                        "static": {},
                        "toOne": {},
                        "toMany": {},
                    },
                    {
                        "wbcols": {
                            "integer1": "Determination integer1 #3",
                            "remarks": "Determination remarks #3",
                        },
                        "static": {},
                        "toOne": {},
                        "toMany": {},
                    },
                ]
            },
        }
    },
}
