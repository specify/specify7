from datetime import timedelta
from typing import Literal

from django.utils import timezone

from .models import UserPresence

PresenceStatus = Literal['active', 'inactive', 'offline']
PRESENCE_TIMEOUT = timedelta(minutes=5)
ACTIVE_TIMEOUT = timedelta(minutes=5)


def get_user_presence_statuses(
    user_ids: list[int],
) -> dict[int, PresenceStatus]:
    now = timezone.now()
    presence_by_user_id = {
        presence.specifyuser_id: presence
        for presence in UserPresence.objects.filter(specifyuser_id__in=user_ids)
    }

    def get_status(user_id: int) -> PresenceStatus:
        presence = presence_by_user_id.get(user_id)
        if (
            presence is None
            or now - presence.last_heartbeat > PRESENCE_TIMEOUT
        ):
            return 'offline'
        if (
            presence.last_activity is not None
            and now - presence.last_activity <= ACTIVE_TIMEOUT
        ):
            return 'active'
        return 'inactive'

    return {user_id: get_status(user_id) for user_id in user_ids}
