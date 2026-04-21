from xml.etree import ElementTree

from .dwca import prettify

def extract_query(query):
    query_node = ElementTree.Element('query')
    query_node.set('name', query.name)
    query_node.set('contextTableId', str(query.contexttableid))

    for field in query.fields.all():
        field_node = ElementTree.SubElement(query_node, 'field')
        field_node.set('stringId', field.stringid)
        field_node.set('oper', str(field.operstart))
        field_node.set('value', field.startvalue)
        field_node.set('isNot', 'true' if field.isnot else 'false')
        field_node.set('isRelFld', 'true' if field.isrelfld else 'false')
        if field.formatname is not None:
            field_node.set('formatName', field.formatname)

    return prettify(query_node)
