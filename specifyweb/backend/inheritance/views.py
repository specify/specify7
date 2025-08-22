import json
from django import http
from specifyweb.specify import models
from specifyweb.specify.views import login_maybe_required
from django.views.decorators.http import require_POST


@login_maybe_required
@require_POST
def catalog_number_for_sibling(request: http.HttpRequest):
    """
    Returns the catalog number of the primary CO of a COG if one is present 
    """
    try:
        request_data = json.loads(request.body)
        object_id = request_data.get('id')
        provided_catalog_number = request_data.get('catalognumber')
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    if object_id is None:
        return http.JsonResponse({'error': "'id' field is required."}, status=400)

    if provided_catalog_number is not None:
        return http.JsonResponse(None, safe=False)

    try:
        # Find the join record for the requesting object and its parent group ID
        requesting_cojo = models.Collectionobjectgroupjoin.objects.filter(
            childco_id=object_id
        ).values('parentcog_id').first()

        if not requesting_cojo:
            return http.JsonResponse(None, safe=False)

        parent_cog_id = requesting_cojo['parentcog_id']

        primary_cojo = models.Collectionobjectgroupjoin.objects.filter(
            parentcog_id=parent_cog_id,
            isprimary=True
        ).select_related('childco').first()

        # Extract the catalog number if a primary sibling CO exists
        primary_catalog_number = None
        if primary_cojo and primary_cojo.childco:
            primary_catalog_number = primary_cojo.childco.catalognumber

        return http.JsonResponse(primary_catalog_number, safe=False)

    except Exception as e:
        print(f"Error processing request: {e}")
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)                  
                                

@login_maybe_required
@require_POST
def catalog_number_from_parent(request: http.HttpRequest):
    """
    Returns the catalog number of the parent component
    """
    try:
        request_data = json.loads(request.body)
        object_id = request_data.get('id')
        provided_catalog_number = request_data.get('catalognumber')
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    if object_id is None:
        return http.JsonResponse({'error': "'id' field is required."}, status=400)

    if provided_catalog_number is not None:
        return http.JsonResponse(None, safe=False)

    try:
        # Get the child CO
        child = models.Collectionobject.objects.get(id=object_id)

        # Get the parent CO
        parent = child.componentParent

        if parent and parent.catalognumber:
            return http.JsonResponse(parent.catalognumber, safe=False)
        else:
            return http.JsonResponse({'error': 'Parent or parent catalog number not found.'}, status=404)

    except Exception as e:
        print(f"Error processing request: {e}")
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)  

