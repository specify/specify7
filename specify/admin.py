import django

from django.contrib import admin
from djangospecify.specify import models

for i in models.__dict__.values():
    if isinstance(i, django.db.models.base.ModelBase):
        admin.site.register(i)
