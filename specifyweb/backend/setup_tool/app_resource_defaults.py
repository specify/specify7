from typing import Optional

from specifyweb.specify.models import (
    Discipline,
    Spappresource,
    Spappresourcedata,
    Spappresourcedir,
    Specifyuser,
)
import logging
logger = logging.getLogger(__name__)

DEFAULT_REMOTE_PREFS = b'''ui.formatting.scrdateformat=yyyy-MM-dd
auditing.do_audits=true
auditing.audit_field_updates=true
'''

def create_app_resource_defaults() -> None:
    """Adds initial app resource files to the database."""
    # create_global_prefs() # Replacing globabl prefs with remote to avoid user confusion
    create_remote_prefs()

def create_global_prefs(user: Optional[Specifyuser] = None) -> None:
    """Create a blank Global Prefs file."""
    directory, _ = Spappresourcedir.objects.get_or_create(
        usertype='Global Prefs',
        defaults={
            'ispersonal': False
        }
    )

    # This function is intended to be used during setup, so there should be one user.
    # DBs created in Specify 6 set specifyuser to NULL for global prefs.
    admin_user = user or Specifyuser.objects.first()

    resource = Spappresource.objects.create(
        spappresourcedir=directory,
        specifyuser=admin_user,
        level=0,
        name='preferences'
    )

    Spappresourcedata.objects.create(
        spappresource=resource,
        data=b''
    )

def create_remote_prefs(user: Optional[Specifyuser] = None) -> None:
    """Create a default Remote Preferences file."""
    directory, _ = Spappresourcedir.objects.get_or_create(
        usertype='Prefs',
        defaults={
            'ispersonal': False
        }
    )

    # This function is intended to be used during setup, so there should be one user.
    # DBs created in Specify 6 set specifyuser to NULL for remote prefs.
    admin_user = user or Specifyuser.objects.first()

    resource = Spappresource.objects.create(
        spappresourcedir=directory,
        specifyuser=admin_user,
        level=0,
        name='preferences'
    )

    Spappresourcedata.objects.create(
        spappresource=resource,
        data=DEFAULT_REMOTE_PREFS
    )

def ensure_discipline_resource_dir(discipline: Discipline) -> Spappresourcedir:
    """
    Ensure a discipline-level app resource directory exists
    """
    existing_dir, _, _ = _ensure_discipline_resource_dir(discipline)
    return existing_dir

def _ensure_discipline_resource_dir(
    discipline: Discipline,
) -> tuple[Spappresourcedir, bool, bool]:
    """
    Ensure a discipline-level app resource directory exists.

    Returns a tuple of (directory, created, updated).
    """
    existing_dir = (
        Spappresourcedir.objects.filter(
            discipline=discipline,
            collection__isnull=True,
            specifyuser__isnull=True,
            usertype__isnull=True,
            ispersonal=False
        )
        .first()
    )

    if existing_dir is None:
        return (
            Spappresourcedir.objects.create(
            discipline=discipline,
            disciplinetype=discipline.type,
            ispersonal=False,
            ),
            True,
            False,
        )

    was_updated = False
    if existing_dir.disciplinetype != discipline.type:
        existing_dir.disciplinetype = discipline.type
        existing_dir.save(update_fields=['disciplinetype'])
        was_updated = True

    return existing_dir, False, was_updated

def ensure_all_discipline_resource_dirs() -> dict[str, int]:
    """
    Ensure every discipline has a discipline-scoped app resource directory.

    Returns summary counts for auditability.
    """
    total = 0
    created = 0
    updated = 0

    for discipline in Discipline.objects.only('id', 'type'):
        total += 1
        _, was_created, was_updated = _ensure_discipline_resource_dir(discipline)
        if was_created:
            created += 1
        if was_updated:
            updated += 1

    return {
        'total_disciplines': total,
        'created': created,
        'updated': updated,
    }
