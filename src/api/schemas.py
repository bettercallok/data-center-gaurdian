from pydantic import BaseModel, Field

class DriveTelemetry(BaseModel):
    smart_5_raw: int = Field(default=0, description="Reallocated Sectors Count")
    smart_187_raw: int = Field(default=0, description="Reported Uncorrectable Errors")
    smart_188_raw: int = Field(default=0, description="Command Timeout")
    smart_197_raw: int = Field(default=0, description="Current Pending Sector Count")
    smart_198_raw: int = Field(default=0, description="Uncorrectable Sector Count")

class SurvivalPrediction(BaseModel):
    ttf_days: float = Field(..., description="Predicted Time-To-Failure in days")
    rul_days: float = Field(..., description="Remaining Useful Life in days")
    risk_level: str = Field(..., description="Risk severity badge (Low, Medium, High, Critical)")
    log_time: float = Field(..., description="Raw log survival time from AFT")
