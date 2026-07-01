class Runtime:
    def __init__(self, name, api, display_name):
        self.name = name
        self.api = api
        self.display_name = display_name


RUNTIMES = {
    "python": Runtime(
        "python",
        "https://endoflife.date/api/python.json",
        "Python",
    ),
    "node": Runtime(
        "node",
        "https://endoflife.date/api/nodejs.json",
        "Node.js",
    ),
    "django": Runtime(
        "django",
        "https://endoflife.date/api/django.json",
        "Django",
    ),
}