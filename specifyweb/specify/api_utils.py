# Regex matching api uris for extracting the model name and id number.
import re


URI_RE = re.compile(r'^/api/specify/(\w+)/($|(\d+))')

def parse_uri(uri: str) -> tuple[str, str]:
    """Return the model name and id from a resource or collection URI."""
    match = URI_RE.match(uri)
    assert match is not None, f"Bad URI: {uri}"
    groups = match.groups()
    return groups[0], groups[2]

def strict_uri_to_model(uri: str, model: str) -> tuple[str, int]:
    uri_model, uri_id = parse_uri(uri)
    assert model.lower() == uri_model.lower(), f"{model} does not match model in uri: {uri_model}"
    assert uri_id is not None
    return uri_model, int(uri_id)