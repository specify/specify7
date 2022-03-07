from django.db import models

from specifyweb.specify import models as spmodels

Collection = getattr(spmodels, 'Collection')
Specifyuser = getattr(spmodels, 'Specifyuser')


class UserPolicy(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=True)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE, null=True)
    resource = models.CharField(max_length=1024)
    action = models.CharField(max_length=1024)

    def __str__(self):
        return str((self.collection_id, self.specifyuser_id, self.resource, self.action))

    class Meta:
        db_table = 'spuserpolicy'

class Role(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    name = models.CharField(max_length=1024)

    class Meta:
        db_table = 'sprole'

class UserRole(models.Model):
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserrole"

class RolePolicy(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='policies')
    resource = models.CharField(max_length=1024)
    action = models.CharField(max_length=1024)

    class Meta:
        db_table = 'sprolepolicy'
