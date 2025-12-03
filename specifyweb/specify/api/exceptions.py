class RecordSetException(Exception):
    """Raised for problems related to record sets."""
    pass

class OptimisticLockException(Exception):
    """Raised when there is a problem related to optimistic locking."""
    pass

class MissingVersionException(OptimisticLockException):
    """Raised when an object is expected to have an optimistic locking
    version number, but none can be determined from the request.
    """
    pass

class StaleObjectException(OptimisticLockException):
    """Raised when attempting to mutate a resource with a newer
    version than the client has supplied.
    """
    pass

class FilterError(Exception):
    """Raised when filter a resource collection using a bad value."""
    pass

class OrderByError(Exception):
    """Raised for bad fields in order by clause."""
    pass