from inspect import getfullargspec
from typing import Callable, Literal, Optional, Hashable

from django.db.models import signals
from django.dispatch import receiver

from specifyweb.specify import models

# See https://docs.djangoproject.com/en/3.2/ref/signals/#module-django.db.models.signals
MODEL_SIGNAL = Literal["pre_init", "post_init", "pre_save",
                       "post_save", "pre_delete", "post_delete", 
                       "m2m_changed"]


def orm_signal_handler(signal: MODEL_SIGNAL, model: Optional[str] = None, **kwargs):
    def _dec(rule):
        receiver_kwargs = kwargs
        if model is not None:
            receiver_kwargs['sender'] = getattr(models, model)

            def handler(sender, **kwargs):
                if kwargs.get('raw', False):
                    return
                # since the rule knows what model the signal comes from
                # the sender value is redundant.
                rule(kwargs['instance'])
        else:
            def handler(sender, **kwargs):
                if kwargs.get('raw', False):
                    return
                
                instance = kwargs['instance']
                created = kwargs.get('created', None)
                argspec = getfullargspec(rule)
                rule_has_created = 'created' in argspec.args
                
                if created is not None and rule_has_created:
                    rule(sender, instance, created)
                else:
                    rule(sender, instance)

        return receiver(getattr(signals, signal), **receiver_kwargs)(handler)
    return _dec


def disconnect_signal(signal: MODEL_SIGNAL, model_name: Optional[str] = None, dispatch_uid: Optional[Hashable] = None) -> bool:
    fetched_signal = getattr(signals, signal)
    django_model = None if model_name is None else getattr(models, model_name)
    return fetched_signal.disconnect(
        sender=django_model, dispatch_uid=dispatch_uid)

def connect_signal(signal: MODEL_SIGNAL, callback: Callable, model_name: Optional[str] = None, dispatch_uid: Optional[Hashable] = None):
    fetched_signal = getattr(signals, signal)
    django_model = None if model_name is None else getattr(models, model_name)
    return fetched_signal.connect(callback, sender=django_model, dispatch_uid=dispatch_uid)