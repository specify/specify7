from django.db import models
from functools import partialmethod
from specifyweb.specify.models import Discipline, datamodel, custom_save

class PsuedoManyToManyManager(models.Manager):
    def __init__(self, base_instance, through_model, through_field) -> None:
        self.base_instance = base_instance
        self.through_model = through_model
        self.through_field = through_field.field.name

        self._related_field_name = [
            field.name for field in through_model._meta.fields if field.related_model is not None][0]

    def all(self) -> models.QuerySet:
        return self.through_model.objects.filter(**{self._related_field_name: self.base_instance})

    def filter(self, *args, **kwargs) -> models.QuerySet:
        return self.all().filter(*args, **kwargs)

    def clear(self):
        return self.all().delete()

    def add(self, *args, through_defaults={}):
        for item in args:
            to_create = {
                self._related_field_name: self.base_instance,
                self.through_field: item}

            for field, value in through_defaults.items():
                to_create[field] = value
            self.through_model.objects.create(**to_create)

    def set(self, iterable, through_defaults={}):
        self.clear()
        self.add(*iterable, through_defaults=through_defaults)


class UniquenessRule(models.Model):
    specify_model = datamodel.get_table('uniquenessrule')

    id = models.AutoField('uniquenessruleid', primary_key=True, db_column='uniquenessruleid')
    isDatabaseConstraint = models.BooleanField(default=False, db_column='isDatabaseConstraint')
    modelName = models.CharField(max_length=256)
    discipline = models.ForeignKey(
        Discipline, null=True, blank=True, on_delete=models.PROTECT, db_column="DisciplineID")

    @property
    def fields(self):
        return PsuedoManyToManyManager(self, UniquenessRuleField, UniquenessRuleField.fieldPath)

    class Meta:
        db_table = 'uniquenessrule'

    save = partialmethod(custom_save)


class UniquenessRuleField(models.Model):
    specify_model = datamodel.get_table('uniquenessrulefield')

    id = models.AutoField('uniquenessrule_fieldsid', primary_key=True, db_column='uniquenessrule_fieldid')
    uniquenessrule = models.ForeignKey(UniquenessRule, on_delete=models.CASCADE, db_column='uniquenessruleid')
    fieldPath = models.TextField(null=True, blank=True)
    isScope = models.BooleanField(default=False)

    class Meta:
        db_table = "uniquenessrule_fields"

    save = partialmethod(custom_save)
