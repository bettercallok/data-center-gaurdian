import math
import json
from fastapi import FastAPI, HTTPException
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

# Mocked ONNX inference for demo purposes
# In production, we'd use:
# import onnxruntime as ort
# session = ort.InferenceSession("survival_model.onnx")

@app.post("/predict", response_model=SurvivalPrediction)
async def predict_survival(telemetry: DriveTelemetry):
    """
    Predicts the Time-To-Failure and Remaining Useful Life of an HDD based on SMART telemetry.
    Uses an XGBoost AFT Survival model exported to ONNX.
    """
    try:
        # Mocking AFT inference logic
        # AFT formula: ln(T) = x^T * beta + sigma * epsilon
        # We simulate the log time based on the smart metrics
        penalty = (telemetry.smart_5_raw * 0.1) + \
                  (telemetry.smart_187_raw * 0.5) + \
                  (telemetry.smart_188_raw * 0.2) + \
                  (telemetry.smart_197_raw * 0.3) + \
                  (telemetry.smart_198_raw * 0.3)
        
        base_log_time = 7.5  # approx 1800 days
        log_time = max(0.0, base_log_time - penalty)
        
        # Exponentiate prediction to get actual days
        ttf_days = math.exp(log_time)
        
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
            rul_days=round(max(0, ttf_days - 30), 1), # Assume drive is 30 days old for mock RUL
            risk_level=risk,
            log_time=round(log_time, 4)
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
