import logging
from functools import wraps
from django.apps import apps

logger = logging.getLogger(__name__)

def orm_signal_handler(signal_name, model_name=None, dispatch_uid=None):
    """Decorator for Django ORM signal handlers."""
    def decorator(rule):
        @wraps(rule)
        def handler(sender=None, instance=None, **kwargs):
            # Handle both standard signal dispatch and edge cases
            obj = instance or kwargs.get('instance')

            try:
                rule(obj)
            except Exception as e:
                logger.exception(f"Error in {rule.__name__} for {obj.__class__.__name__}")
                raise
        
        # connect the signal handler
        try:
            from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
            
            signal_map = {
                'pre_save': pre_save,
                'post_save': post_save,
                'pre_delete': pre_delete,
                'post_delete': post_delete,
            }
            signal = signal_map.get(signal_name)
            
            if signal is None:
                raise ValueError(f"Unknown signal: {signal_name}")
            
            if model_name is not None:
                try:
                    model = apps.get_model('specify', model_name)
                    signal.connect(
                        handler, 
                        sender=model, 
                        dispatch_uid=dispatch_uid or f"{rule.__module__}.{rule.__name__}"
                    )
                except LookupError:
                    logger.debug(f"Model {model_name} not found, skipping signal handler registration")
            else:
                signal.connect(
                    handler, 
                    dispatch_uid=dispatch_uid or f"{rule.__module__}.{rule.__name__}"
                )
        except Exception as e:
            logger.exception(f"Failed to register signal handler {rule.__name__}")
        
        return handler
    
    return decorator