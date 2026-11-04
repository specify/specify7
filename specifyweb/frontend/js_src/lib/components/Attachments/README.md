# Attachments

Uploaded file attachments require the asset server to be configured. External
HTTP(S) resource URLs can be attached to records and opened without an asset
server.

WorkBench validates mapped `Attachment.resourceURL` values during validation and
upload. Non-empty values must be valid HTTP(S) URLs; optional URL cells may be
left blank.
