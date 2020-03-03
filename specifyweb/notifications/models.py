

from django.db import models
from ..specify.models import Specifyuser

class Message(models.Model):
    user = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    timestampcreated = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    read = models.BooleanField(default=False)

