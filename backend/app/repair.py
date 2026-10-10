from typing import Any
from collections import defaultdict
import heapq


def repair_plan(plan: dict[str, Any]) -> dict[str, Any]:
    order = plan.get("task_order", [])
    required = plan.get("required_tasks", [])
    constraints = plan.get("precedence_constraints", [])

    if not all(isinstance(x, list) for x in (order, required, constraints)):
        return {"success": False, "errors": ["Inputs must be lists."]}

    if not all(isinstance(t, str) and t.strip() for t in order + required):
        return {"success": False, "errors": ["Task IDs must be non-empty strings."]}

    if len(required) != len(set(required)):
        return {"success": False, "errors": ["Duplicate IDs in required_tasks."]}

    required_set = set(required)
    outgoing = defaultdict(set)
    indegree = {task: 0 for task in required}

    for edge in constraints:
        if not isinstance(edge, (list, tuple)) or len(edge) != 2:
            return {"success": False, "errors": [f"Invalid dependency: {edge!r}"]}

        before, after = edge
        if before not in required_set or after not in required_set:
            return {"success": False, "errors": [f"Unknown task in dependency: {edge!r}"]}

        if after not in outgoing[before]:
            outgoing[before].add(after)
            indegree[after] += 1

    # Remove duplicates and unknown tasks; add any missing required tasks.
    cleaned = []
    seen = set()
    for task in order:
        if task in required_set and task not in seen:
            cleaned.append(task)
            seen.add(task)
    cleaned.extend(task for task in required if task not in seen)

    rank = {task: i for i, task in enumerate(cleaned)}
    ready = [(rank[t], t) for t in required if indegree[t] == 0]
    heapq.heapify(ready)
    repaired = []

    while ready:
        _, task = heapq.heappop(ready)
        repaired.append(task)
        for nxt in outgoing[task]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                heapq.heappush(ready, (rank[nxt], nxt))

    if len(repaired) != len(required):
        return {"success": False, "errors": ["Dependency cycle detected."]}

    old_positions = {task: i for i, task in enumerate(order)}
    changes = sum(
        old_positions[task] != i
        for i, task in enumerate(repaired)
        if task in old_positions and task in required_set
    )

    return {
        "success": True,
        "repaired_order": repaired,
        "changes": changes,
        "original_order": order,
        "message": "A valid task order was generated."
    }
