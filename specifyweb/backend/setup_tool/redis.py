# Keep track of the currently running setup task. There should only ever be one.
# Also defined separately in setup_tool/apps.py
ACTIVE_TASK_REDIS_KEY = "specify:{database}:setup:active_task_id"
ACTIVE_TASK_TTL = 60*60*2 # setup should be less than 2 hours
# Keep track of last error.
LAST_ERROR_REDIS_KEY = "specify:{database}:setup:last_error"

# Track async setup/config tasks by resource scope.
COLLECTION_TASKS_REDIS_KEY = "specify:{database}:setup:collection:{collection_id}:tasks"
DISCIPLINE_TASKS_REDIS_KEY = "specify:{database}:setup:discipline:{discipline_id}:tasks"
