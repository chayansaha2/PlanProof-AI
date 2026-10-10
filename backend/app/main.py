

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.validator import validate_plan
from app.repair import repair_plan


app = FastAPI(
    title="PlanProof AI API",
    description="Constraint-aware task plan validation and repair",
    version="0.1.0",
)


# Allow requests from the deployed frontend and local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://plan-proof-ai.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlanRequest(BaseModel):
    task_order: list[str] = Field(
        ...,
        description="Current order of task IDs",
    )
    required_tasks: list[str] = Field(
        ...,
        description="All task IDs required in the plan",
    )
    precedence_constraints: list[list[str]] = Field(
        default_factory=list,
        description="Each pair is [prerequisite, dependent_task]",
    )


@app.get("/")
def root():
    return {
        "name": "PlanProof AI",
        "status": "running",
        "message": "Plan validation API is ready",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/validate")
def validate(plan: PlanRequest) -> dict[str, Any]:
    return validate_plan(plan.model_dump())


@app.post("/repair")
def repair(plan: PlanRequest) -> dict[str, Any]:
    return repair_plan(plan.model_dump())

