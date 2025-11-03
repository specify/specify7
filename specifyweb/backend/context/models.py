from django.db import models


class LoginNotice(models.Model):
    """
    Stores the optional institution-wide notice displayed on the login screen.
    """

    content = models.TextField(blank=True, default='')
    is_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'login_notice'

    def __str__(self) -> str: 
        state = 'enabled' if self.is_enabled else 'disabled'
        preview = (self.content or '').strip().replace('\n', ' ')[:40]
        return f'Login notice ({state}): {preview}'
