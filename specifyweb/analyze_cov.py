import sys
import json

with open(sys.argv[1]) as f:
    cov = json.loads(f.read())

apps = {
    key: value["summary"]
    for (key, value) in cov["files"].items()
    if key.startswith("specifyweb/")
}

data = {}
for key, value in apps.items():
    key_split = key.split("/")
    assert len(key_split) >= 2
    context = data
    previous_context = context
    for node in key_split[:-1]:
        context[node] = context.get(node, dict(report=None, children={}))
        context = context[node]["children"]

    context[key_split[-1]] = dict(report=value, children={})


def make_report(cov_lines, num_lines):
    return dict(
        covered_lines=cov_lines,
        num_statements=num_lines,
        percent_covered=100 if num_lines == 0 else (cov_lines * 100 / num_lines),
    )


def get_lines(current_context):
    previous_report = current_context["report"]
    if previous_report is not None:
        return previous_report["covered_lines"], previous_report["num_statements"]
    cov_lines = 0
    num_stmts = 0
    for child in current_context["children"].values():
        child_cov_lines, child_num_stmts = get_lines(child)
        cov_lines += child_cov_lines
        num_stmts += child_num_stmts

    current_context["report"] = make_report(cov_lines, num_stmts)
    return (cov_lines, num_stmts)


get_lines(data["specifyweb"])

with open("dumped.json", "w") as f:
    f.write(json.dumps(data, indent=4))


def _get_tuples(obj):
    to_return = [
        dict(appName=key, report=value.get("report")) for (key, value) in obj.items()
    ]

    tuples = [
        ",".join(
            [
                obj["appName"],
                str(obj["report"]["covered_lines"]),
                str(obj["report"]["num_statements"]),
                str(obj["report"]["percent_covered"]),
            ]
        )
        for obj in to_return
    ]

    tuples = [
        ",".join(["appname", "covered_lines", "num_statements", "percent covered"]),
        *tuples,
    ]

    return to_return, tuples


specifyweb_children, tuples = _get_tuples(data["specifyweb"]["children"])


# with open("dumped_per_app.json", "w") as f:

#     f.write(json.dumps(specifyweb_children, indent=4))

# with open("/mnt/c/Users/realv/Desktop/specify/apps_report.csv", "w") as f:

#     f.write("\n".join(tuples))


specify_app, specify_tuples = _get_tuples(
    data["specifyweb"]["children"]["specify"]["children"]
)


with open("dumped_specify_app.json", "w") as f:

    f.write(json.dumps(specify_app, indent=4))

with open("/mnt/c/Users/realv/Desktop/specify/apps_report_specify.csv", "w") as f:

    f.write("\n".join(specify_tuples))
