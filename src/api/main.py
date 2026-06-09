import math
import json
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from src.api.schemas import DriveTelemetry, SurvivalPrediction

app = FastAPI(title="Data Center Guardian API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load XGBoost model globally
try:
    import xgboost as xgb
    session = xgb.Booster()
    session.load_model("src/api/survival_model.json")
except Exception as e:
    print(f"Warning: Could not load XGBoost model. {e}")
    session = None

@app.post("/predict", response_model=SurvivalPrediction)
async def predict_survival(telemetry: DriveTelemetry):
    """
    Predicts the Time-To-Failure and Remaining Useful Life of an HDD based on SMART telemetry.
    Uses the native XGBoost model.
    """
    if not session:
        raise HTTPException(status_code=500, detail="XGBoost Model not loaded.")
        
    try:
        # Prepare input DMatrix
        input_data = xgb.DMatrix(np.array([[
            telemetry.smart_5_raw,
            telemetry.smart_187_raw,
            telemetry.smart_188_raw,
            telemetry.smart_197_raw,
            telemetry.smart_198_raw
        ]], dtype=np.float32))
        
        # Run XGBoost inference
        output = session.predict(input_data)
        
        # XGBoost natively returns the expected value (TTF in days) for AFT objective
        ttf_days = float(output[0])
        
        # Determine risk level
        if ttf_days > 1000:
            risk = "Low"
        elif ttf_days > 365:
            risk = "Medium"
        elif ttf_days > 90:
            risk = "High"
        else:
            risk = "Critical"
            
        return SurvivalPrediction(
            ttf_days=round(ttf_days, 1),
            rul_days=round(max(0, ttf_days - 30), 1),
            risk_level=risk,
            log_time=round(math.log(max(1.0, ttf_days)), 4)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/telemetry")
async def get_telemetry():
    """Returns the latest dataset telemetry"""
    try:
        with open("data/processed/telemetry.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Telemetry file not found. Run pipeline first."}

# Mount static frontend files for Hugging Face single-port deployment
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
