from pydantic import BaseModel, Field

class DriveTelemetry(BaseModel):
    # SMART sensor values are 16-bit unsigned integers (0-65535).
    # Pydantic will reject any request that falls outside these bounds with a 422 error.
    smart_5_raw: int = Field(default=0, ge=0, le=65535, description="Reallocated Sectors Count")
    smart_187_raw: int = Field(default=0, ge=0, le=65535, description="Reported Uncorrectable Errors")
    smart_188_raw: int = Field(default=0, ge=0, le=65535, description="Command Timeout")
    smart_197_raw: int = Field(default=0, ge=0, le=65535, description="Current Pending Sector Count")
    smart_198_raw: int = Field(default=0, ge=0, le=65535, description="Uncorrectable Sector Count")

class SurvivalPrediction(BaseModel):
    ttf_days: float = Field(..., description="Predicted Time-To-Failure in days")
    rul_days: float = Field(..., description="Remaining Useful Life in days")
    risk_level: str = Field(..., description="Risk severity badge (low, medium, high, critical)")
    log_time: float = Field(..., description="Raw log survival time from AFT")
