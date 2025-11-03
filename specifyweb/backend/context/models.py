from django.db import models


class LoginNotice(models.Model):
    """
    Stores the optional institution-wide notice displayed on the login screen.
    """

    sp_global_messages_id = models.AutoField(
        primary_key=True,
        db_column='SpGlobalMessagesID',
    )
    scope = models.TextField(default='login')
    content = models.TextField(blank=True, default='')
    is_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'spglobalmessages'
        constraints = [
            models.UniqueConstraint(fields=['scope'], name='spglobalmessages_scope_unique')
        ]

    def __str__(self) -> str:  # pragma: no cover - helpful in admin/debug
        state = 'enabled' if self.is_enabled else 'disabled'
        preview = (self.content or '').strip().replace('\n', ' ')[:40]
        return f'Login notice ({state}): {preview}'
