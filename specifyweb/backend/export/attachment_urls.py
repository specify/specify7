"""Auto-construct attachment URLs for DwC exports."""
from django.conf import settings


def construct_attachment_url(collection, filename):
    """Build full URL to an attachment file on the web asset server.

    Returns the URL string or empty string if no asset server configured.
    """
    base_url = getattr(settings, 'WEB_ATTACHMENT_URL', None)
    if not base_url:
        return ''

    # Strip trailing slash
    base_url = base_url.rstrip('/')

    collection_name = collection.collectionname if collection else ''
    return f'{base_url}/{collection_name}/{filename}'


def is_attachment_field(field_name):
    """Check if a field name corresponds to an attachment field."""
    attachment_fields = {
        'attachmentlocation', 'origfilename', 'attachmentimageattribute',
    }
    return field_name.lower() in attachment_fields
