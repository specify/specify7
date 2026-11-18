from sqlalchemy.sql.expression import Executable, ClauseElement
from sqlalchemy.ext import compiler


class SelectIntoOutfile(Executable, ClauseElement):
    def __init__(self, select, path):
        self.select = select
        self.path = path

@compiler.compiles(SelectIntoOutfile)
def compile(element, compiler, **kwargs):
    return (
        "%s INTO OUTFILE '%s' "
        "FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' "
        "LINES TERMINATED BY '\\n'"
    ) % (compiler.process(element.select), element.path)
