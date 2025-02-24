from django.db import models
from functools import partialmethod
from specifyweb.specify.models import Collection, Specifyuser, datamodel, custom_save

class UserPolicy(models.Model):
    specify_model = datamodel.get_table('userpolicy')

    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=True)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE, null=True)
    resource = models.CharField(max_length=1024)
    action = models.CharField(max_length=1024)

    def __str__(self):
        return str((self.collection_id, self.specifyuser_id, self.resource, self.action))

    class Meta:
        db_table = 'spuserpolicy'
    
    # save = partialmethod(custom_save)

class Role(models.Model):
    specify_model = datamodel.get_table('role')

    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    name = models.CharField(max_length=1024)
    description = models.TextField(default='')

    class Meta:
        db_table = 'sprole'
    
    # save = partialmethod(custom_save)

class LibraryRole(models.Model):
    specify_model = datamodel.get_table('libraryrole')

    name = models.CharField(max_length=1024)
    description = models.TextField(default='')

    class Meta:
        db_table = 'splibraryrole'
    
    # save = partialmethod(custom_save)

class UserRole(models.Model):
    specify_model = datamodel.get_table('userrole')

    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE, related_name="roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserrole"
    
    # save = partialmethod(custom_save)

class RolePolicy(models.Model):
    specify_model = datamodel.get_table('rolepolicy')

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='policies')
    resource = models.CharField(max_length=1024)
    action = models.CharField(max_length=1024)

    class Meta:
        db_table = 'sprolepolicy'
    
    # save = partialmethod(custom_save)

class LibraryRolePolicy(models.Model):
    specify_model = datamodel.get_table('libraryrolepolicy')

    role = models.ForeignKey(LibraryRole, on_delete=models.CASCADE, related_name='policies')
    resource = models.CharField(max_length=1024)
    action = models.CharField(max_length=1024)

    class Meta:
        db_table = 'splibraryrolepolicy'
    
    # save = partialmethod(custom_save)
