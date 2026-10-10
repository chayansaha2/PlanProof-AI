
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PlanProof AI API",
    description="Constraint-aware task plan validation and repair",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "PlanProof AI",
        "status": "running",
        "message": "PlanProof AI API is ready",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
