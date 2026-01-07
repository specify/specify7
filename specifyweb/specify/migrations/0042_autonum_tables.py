from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("specify", "0041_add_missing_schema_after_reorganization"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="AutonumSchColl",
                    fields=[
                        (
                            "collection",
                            models.ForeignKey(
                                db_column="CollectionID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.collection",
                            ),
                        ),
                        (
                            "autonumberingscheme",
                            models.ForeignKey(
                                db_column="AutoNumberingSchemeID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.autonumberingscheme",
                            ),
                        ),
                    ],
                    options={
                        "managed": False,
                        "db_table": "autonumsch_coll",
                        "unique_together": {("collection", "autonumberingscheme")},
                    },
                ),
                migrations.AddIndex(
                    model_name="autonumschcoll",
                    index=models.Index(
                        fields=["autonumberingscheme"],
                        name="FK46F04F2AFE55DD76",
                    ),
                ),
                migrations.AddIndex(
                    model_name="autonumschcoll",
                    index=models.Index(
                        fields=["collection"],
                        name="FK46F04F2A8C2288BA",
                    ),
                ),
                migrations.CreateModel(
                    name="AutonumSchDiv",
                    fields=[
                        (
                            "division",
                            models.ForeignKey(
                                db_column="DivisionID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.division",
                            ),
                        ),
                        (
                            "autonumberingscheme",
                            models.ForeignKey(
                                db_column="AutoNumberingSchemeID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.autonumberingscheme",
                            ),
                        ),
                    ],
                    options={
                        "managed": False,
                        "db_table": "autonumsch_div",
                        "unique_together": {("division", "autonumberingscheme")},
                    },
                ),
                migrations.AddIndex(
                    model_name="autonumschdiv",
                    index=models.Index(
                        fields=["autonumberingscheme"],
                        name="FKA8BE493FE55DD76",
                    ),
                ),
                migrations.AddIndex(
                    model_name="autonumschdiv",
                    index=models.Index(
                        fields=["division"],
                        name="FKA8BE49397C961D8",
                    ),
                ),
                migrations.CreateModel(
                    name="AutonumSchDsp",
                    fields=[
                        (
                            "discipline",
                            models.ForeignKey(
                                db_column="DisciplineID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.discipline",
                            ),
                        ),
                        (
                            "autonumberingscheme",
                            models.ForeignKey(
                                db_column="AutoNumberingSchemeID",
                                on_delete=django.db.models.deletion.DO_NOTHING,
                                to="your_app_label.autonumberingscheme",
                            ),
                        ),
                    ],
                    options={
                        "managed": False,
                        "db_table": "autonumsch_dsp",
                        "unique_together": {("discipline", "autonumberingscheme")},
                    },
                ),
                migrations.AddIndex(
                    model_name="autonumschdsp",
                    index=models.Index(
                        fields=["autonumberingscheme"],
                        name="FKA8BE5C3FE55DD76",
                    ),
                ),
                migrations.AddIndex(
                    model_name="autonumschdsp",
                    index=models.Index(
                        fields=["discipline"],
                        name="FKA8BE5C34CE675DE",
                    ),
                ),
            ],
        ),
    ]
