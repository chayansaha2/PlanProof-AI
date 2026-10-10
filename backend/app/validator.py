
from collections import Counter
from typing import Any


def validate_plan(plan: dict[str, Any]) -> dict[str, Any]:
    """
    Validate a task plan.

    Expected input:
    {
        "task_order": ["T1", "T2"],
        "required_tasks": ["T1", "T2"],
        "precedence_constraints": [["T1", "T2"]]
    }
    """
    order = plan.get("task_order", [])
    required = plan.get("required_tasks", [])
    constraints = plan.get("precedence_constraints", [])

    if not all(isinstance(items, list) for items in (order, required, constraints)):
        return {
            "valid": False,
            "errors": ["task_order, required_tasks, and precedence_constraints must be lists."],
            "violations": [],
        }

    if not all(isinstance(task, str) and task.strip() for task in order + required):
        return {
            "valid": False,
            "errors": ["Task IDs must be non-empty strings."],
            "violations": [],
        }

    errors = []
    violations = []

    duplicates = sorted(
        task for task, count in Counter(order).items() if count > 1
    )
    if duplicates:
        violations.append({
            "type": "duplicate_task",
            "tasks": duplicates,
        })

    required_set = set(required)
    order_set = set(order)

    missing = sorted(required_set - order_set)
    unknown = sorted(order_set - required_set)

    if missing:
        violations.append({
            "type": "missing_task",
            "tasks": missing,
        })

    if unknown:
        violations.append({
            "type": "unknown_task",
            "tasks": unknown,
        })

    if len(required) != len(required_set):
        errors.append("required_tasks contains duplicate IDs.")

    positions = {task: index for index, task in enumerate(order)}

    for edge in constraints:
        if (
            not isinstance(edge, (list, tuple))
            or len(edge) != 2
            or not all(isinstance(task, str) for task in edge)
        ):
            errors.append(f"Invalid precedence constraint: {edge!r}")
            continue

        before, after = edge

        if before not in required_set or after not in required_set:
            errors.append(
                f"Constraint ({before}, {after}) references an unknown task."
            )
            continue

        if before in positions and after in positions:
            if positions[before] >= positions[after]:
                violations.append({
                    "type": "precedence_violation",
                    "before": before,
                    "after": after,
                })

    return {
        "valid": not errors and not violations,
        "errors": errors,
        "violations": violations,
    }
