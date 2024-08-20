from specifyweb.stored_queries.batch_edit import (
    BatchEditFieldPack,
    BatchEditPack,
    RowPlanMap,
)


row_plan_map = RowPlanMap(
    batch_edit_pack=BatchEditPack(
        id=BatchEditFieldPack(field=None, idx=11, value=None),
        order=BatchEditFieldPack(field=None, idx=None, value=None),
        version=BatchEditFieldPack(field=None, idx=12, value=None),
    ),
    columns=[
        BatchEditFieldPack(field=None, idx=1, value=None),
        BatchEditFieldPack(field=None, idx=2, value=None),
        BatchEditFieldPack(field=None, idx=3, value=None),
        BatchEditFieldPack(field=None, idx=4, value=None),
        BatchEditFieldPack(field=None, idx=5, value=None),
        BatchEditFieldPack(field=None, idx=6, value=None),
        BatchEditFieldPack(field=None, idx=7, value=None),
        BatchEditFieldPack(field=None, idx=8, value=None),
        BatchEditFieldPack(field=None, idx=9, value=None),
        BatchEditFieldPack(field=None, idx=10, value=None),
    ],
    to_one={
        "cataloger": RowPlanMap(
            batch_edit_pack=BatchEditPack(
                id=BatchEditFieldPack(field=None, idx=16, value=None),
                order=BatchEditFieldPack(field=None, idx=None, value=None),
                version=BatchEditFieldPack(field=None, idx=17, value=None),
            ),
            columns=[
                BatchEditFieldPack(field=None, idx=13, value=None),
                BatchEditFieldPack(field=None, idx=14, value=None),
                BatchEditFieldPack(field=None, idx=15, value=None),
            ],
            to_one={},
            to_many={},
            has_filters=False,
        ),
        "collectingevent": RowPlanMap(
            batch_edit_pack=BatchEditPack(
                id=BatchEditFieldPack(field=None, idx=19, value=None),
                order=BatchEditFieldPack(field=None, idx=None, value=None),
                version=BatchEditFieldPack(field=None, idx=20, value=None),
            ),
            columns=[BatchEditFieldPack(field=None, idx=18, value=None)],
            to_one={
                "locality": RowPlanMap(
                    batch_edit_pack=BatchEditPack(
                        id=BatchEditFieldPack(field=None, idx=30, value=None),
                        order=BatchEditFieldPack(field=None, idx=None, value=None),
                        version=BatchEditFieldPack(field=None, idx=31, value=None),
                    ),
                    columns=[
                        BatchEditFieldPack(field=None, idx=21, value=None),
                        BatchEditFieldPack(field=None, idx=22, value=None),
                        BatchEditFieldPack(field=None, idx=23, value=None),
                        BatchEditFieldPack(field=None, idx=24, value=None),
                        BatchEditFieldPack(field=None, idx=25, value=None),
                        BatchEditFieldPack(field=None, idx=26, value=None),
                        BatchEditFieldPack(field=None, idx=27, value=None),
                        BatchEditFieldPack(field=None, idx=28, value=None),
                        BatchEditFieldPack(field=None, idx=29, value=None),
                    ],
                    to_one={
                        "geography": RowPlanMap(
                            batch_edit_pack=BatchEditPack(
                                id=BatchEditFieldPack(field=None, idx=33, value=None),
                                order=BatchEditFieldPack(
                                    field=None, idx=None, value=None
                                ),
                                version=BatchEditFieldPack(
                                    field=None, idx=34, value=None
                                ),
                            ),
                            columns=[
                                BatchEditFieldPack(field=None, idx=32, value=None)
                            ],
                            to_one={
                                "Continent": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=36, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=37, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=35, value=None
                                        )
                                    ],
                                    to_one={},
                                    to_many={},
                                    has_filters=False,
                                ),
                                "Country": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=39, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=40, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=38, value=None
                                        )
                                    ],
                                    to_one={},
                                    to_many={},
                                    has_filters=False,
                                ),
                                "County": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=42, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=43, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=41, value=None
                                        )
                                    ],
                                    to_one={},
                                    to_many={},
                                    has_filters=False,
                                ),
                                "Province": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=45, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=46, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=44, value=None
                                        )
                                    ],
                                    to_one={},
                                    to_many={},
                                    has_filters=False,
                                ),
                            },
                            to_many={},
                            has_filters=False,
                        )
                    },
                    to_many={},
                    has_filters=False,
                )
            },
            to_many={},
            has_filters=False,
        ),
    },
    to_many={
        "determinations": RowPlanMap(
            batch_edit_pack=BatchEditPack(
                id=BatchEditFieldPack(field=None, idx=48, value=None),
                order=BatchEditFieldPack(field=None, idx=None, value=None),
                version=BatchEditFieldPack(field=None, idx=49, value=None),
            ),
            columns=[BatchEditFieldPack(field=None, idx=47, value=None)],
            to_one={
                "taxon": RowPlanMap(
                    batch_edit_pack=BatchEditPack(
                        id=BatchEditFieldPack(field=None, idx=50, value=None),
                        order=BatchEditFieldPack(field=None, idx=None, value=None),
                        version=BatchEditFieldPack(field=None, idx=51, value=None),
                    ),
                    columns=[],
                    to_one={
                        "Genus": RowPlanMap(
                            batch_edit_pack=BatchEditPack(
                                id=BatchEditFieldPack(field=None, idx=53, value=None),
                                order=BatchEditFieldPack(
                                    field=None, idx=None, value=None
                                ),
                                version=BatchEditFieldPack(
                                    field=None, idx=54, value=None
                                ),
                            ),
                            columns=[
                                BatchEditFieldPack(field=None, idx=52, value=None)
                            ],
                            to_one={},
                            to_many={},
                            has_filters=False,
                        ),
                        "Species": RowPlanMap(
                            batch_edit_pack=BatchEditPack(
                                id=BatchEditFieldPack(field=None, idx=56, value=None),
                                order=BatchEditFieldPack(
                                    field=None, idx=None, value=None
                                ),
                                version=BatchEditFieldPack(
                                    field=None, idx=57, value=None
                                ),
                            ),
                            columns=[
                                BatchEditFieldPack(field=None, idx=55, value=None)
                            ],
                            to_one={},
                            to_many={},
                            has_filters=False,
                        ),
                        "Subspecies": RowPlanMap(
                            batch_edit_pack=BatchEditPack(
                                id=BatchEditFieldPack(field=None, idx=59, value=None),
                                order=BatchEditFieldPack(
                                    field=None, idx=None, value=None
                                ),
                                version=BatchEditFieldPack(
                                    field=None, idx=60, value=None
                                ),
                            ),
                            columns=[
                                BatchEditFieldPack(field=None, idx=58, value=None)
                            ],
                            to_one={},
                            to_many={},
                            has_filters=False,
                        ),
                    },
                    to_many={},
                    has_filters=False,
                )
            },
            to_many={},
            has_filters=False,
        ),
        "preparations": RowPlanMap(
            batch_edit_pack=BatchEditPack(
                id=BatchEditFieldPack(field=None, idx=62, value=None),
                order=BatchEditFieldPack(field=None, idx=None, value=None),
                version=BatchEditFieldPack(field=None, idx=63, value=None),
            ),
            columns=[BatchEditFieldPack(field=None, idx=61, value=None)],
            to_one={},
            to_many={},
            has_filters=False,
        ),
    },
    has_filters=False,
)
