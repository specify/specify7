from django.db.models import signals
from django.dispatch import receiver

from specify import models

def orm_signal_handler(signal, model=None):
    def _dec(rule):
        receiver_kwargs = {}
        if model is not None:
            receiver_kwargs['sender'] = getattr(models, model)
            def handler(sender, **kwargs):
                # since the rule knows what model the signal comes from
                # the sender value is redundant.
                rule(kwargs['instance'])
        else:
            def handler(sender, **kwargs):
                rule(sender, kwargs['instance'])

        return receiver(getattr(signals, signal), **receiver_kwargs)(handler)
    return _dec
