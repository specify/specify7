from django.db.models import signals
from django.dispatch import receiver

from specifyweb.specify.models import Spauditlog

INSERT = 0
UPDATE = 1
REMOVE = 2


@receiver(signals.post_save)
def audit_save(sender, instance, created, raw, **kwargs):
    if sender is Spauditlog or raw:
        return

    Spauditlog.objects.create(
        action = INSERT if created else UPDATE,
        recordid = instance.id,
        recordversion = instance.version,
        tablenum = sender.specify_model.tableId)

@receiver(signals.post_delete)
def audit_delete(sender, instance, **kwargs):
    if sender is Spauditlog:
        return

    Spauditlog.objects.create(
        action = REMOVE,
        recordid = instance.id,
        recordversion = instance.version,
        tablenum = sender.specify_model.tableId)
