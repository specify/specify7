"""Adapts Django Spqueryfield models to the EphemeralField interface
expected by the stored queries QueryField.from_spqueryfield."""


class EphemeralFieldAdapter:
    """Bridges Django Spqueryfield (lowercase attrs) to the EphemeralField
    interface (camelCase attrs) used by QueryField.from_spqueryfield."""

    def __init__(self, spqf, force_display=False):
        self._spqf = spqf
        self._force_display = force_display

    @property
    def stringId(self):
        return self._spqf.stringid

    @property
    def isRelFld(self):
        return self._spqf.isrelfld

    @property
    def operStart(self):
        return self._spqf.operstart

    @property
    def startValue(self):
        return self._spqf.startvalue or ''

    @property
    def isNot(self):
        return self._spqf.isnot

    @property
    def isDisplay(self):
        return True if self._force_display else self._spqf.isdisplay

    @property
    def formatName(self):
        return self._spqf.formatname

    @property
    def sortType(self):
        return self._spqf.sorttype

    @property
    def isStrict(self):
        return getattr(self._spqf, 'isstrict', False)
