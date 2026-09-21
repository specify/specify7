from typing import Iterable
from itertools import islice

def batch_query(queryset, batch_size: int = 200, db_chunk_size: int=1000):
    """
    Takes a Django QuerySet and performs two performance optimizations:
        1. Use a Django iterator to pull up to db_chunk_size elements from the
        DB at a time
        2. Yields up to batch_size elements from the QuerySet at a time within
        tuples

    You can use values_list on the QuerySet to prevent Django from initializing
    model instances and further save memory

    Example usage:
    ```py
    all_taxons = Taxon.objects.all().values_list("pk", flat=True)

    # For the above query, pull 500 at a time from the database and then grab
    # 100 of them for each iteration of this loop to use for our own processing
    for taxon_ids in batch_query(all_taxons, batch_size=100, db_chunk_size=500):
        # In this case, taxon_ids is always a tuple containing up to 100
        # integers (the taxon IDs)
        Determination.objects.bulk_create(
            # The below list will always have at most 100 elements
            # (Determination objects). This limits the amount of upfront memory
            # that this list creation will allocate
            [
                Determination(
                    taxon=taxon,
                    ...
                )
                for taxon in taxon_ids
            ]
        )
    ```
    """
    yield from batch_iterable(queryset.iterator(chunk_size=db_chunk_size), batch_size=batch_size)

def batch_iterable[T](iterable: Iterable[T], batch_size: int):
    """
    A generator that takes any Iterable and yields tuples containing up to
    batch_size elements until the iterable is exhausted.

    This is useful when you want to perform some operation over all
    elements in the iterable, but the operation is memory intensive and can
    be batched.

    Example:
    ```py
    example = [1, 2, 3]
    for batched in batch_iterable(example, 2):
        print(batched)
    # prints (1, 2) then (3,)
    ```
    """
    iterator = iter(iterable)
    while batch := tuple(islice(iterator, batch_size)):
        yield batch
