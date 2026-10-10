
import pytest

from app.validator import validate_plan


def test_valid_plan():
    plan = {
        "task_order": ["T1", "T2", "T3"],
        "required_tasks": ["T1", "T2", "T3"],
        "precedence_constraints": [["T1", "T2"], ["T2", "T3"]],
    }

    result = validate_plan(plan)

    assert result["valid"] is True
    assert result["violations"] == []
    assert result["errors"] == []


def test_missing_task():
    plan = {
        "task_order": ["T1", "T3"],
        "required_tasks": ["T1", "T2", "T3"],
        "precedence_constraints": [],
    }

    result = validate_plan(plan)

    assert result["valid"] is False
    assert any(
        item["type"] == "missing_task"
        for item in result["violations"]
    )


def test_duplicate_task():
    plan = {
        "task_order": ["T1", "T1", "T2"],
        "required_tasks": ["T1", "T2"],
        "precedence_constraints": [],
    }

    result = validate_plan(plan)

    assert result["valid"] is False
    assert any(
        item["type"] == "duplicate_task"
        for item in result["violations"]
    )


def test_unknown_task():
    plan = {
        "task_order": ["T1", "T2", "T9"],
        "required_tasks": ["T1", "T2"],
        "precedence_constraints": [],
    }

    result = validate_plan(plan)

    assert result["valid"] is False
    assert any(
        item["type"] == "unknown_task"
        for item in result["violations"]
    )


def test_precedence_violation():
    plan = {
        "task_order": ["T2", "T1"],
        "required_tasks": ["T1", "T2"],
        "precedence_constraints": [["T1", "T2"]],
    }

    result = validate_plan(plan)

    assert result["valid"] is False
    assert any(
        item["type"] == "precedence_violation"
        for item in result["violations"]
    )


def test_empty_plan():
    result = validate_plan({
        "task_order": [],
        "required_tasks": [],
        "precedence_constraints": [],
    })

    assert result["valid"] is True
