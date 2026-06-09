"""
train_survival.py
XGBoost AFT Survival Analysis training logic.
"""
import argparse
import xgboost as xgb
import polars as pl
from pathlib import Path
import json

def train_survival_model(data_path: Path, use_gpu: bool):
    print(f"Loading data from {data_path}")
    df = pl.read_parquet(data_path)
    
    # We construct the AFT survival labels
    # If failure == 1, then the drive failed exactly at T (label_lower_bound = T, label_upper_bound = T)
    # If failure == 0, then the drive survived up to T (label_lower_bound = T, label_upper_bound = +inf)
    # For this mock, we just use dummy times.
    df = df.with_columns([
        pl.when(pl.col("failure") == 1).then(100).otherwise(200).alias("y_lower"),
        pl.when(pl.col("failure") == 1).then(100).otherwise(float('inf')).alias("y_upper")
    ])
    
    features = ["smart_5_raw", "smart_187_raw", "smart_188_raw", "smart_197_raw", "smart_198_raw"]
    X = df.select(features).to_pandas()
    y_lower = df.select("y_lower").to_pandas()["y_lower"]
    y_upper = df.select("y_upper").to_pandas()["y_upper"]
    
    dtrain = xgb.DMatrix(X)
    dtrain.set_float_info('label_lower_bound', y_lower)
    dtrain.set_float_info('label_upper_bound', y_upper)
    
    params = {
        'objective': 'survival:aft',
        'eval_metric': 'aft-nloglik',
        'aft_loss_distribution': 'normal',
        'aft_loss_distribution_scale': 1.2,
        'tree_method': 'hist' if use_gpu else 'hist',
        'learning_rate': 0.05,
        'max_depth': 6,
        'subsample': 0.8
    }
    
    if use_gpu:
        params['device'] = 'cuda'
        
    print("Training XGBoost AFT model...")
    bst = xgb.train(params, dtrain, num_boost_round=10)
    
    model_dir = data_path.parent
    model_path = model_dir / "survival_model.json"
    bst.save_model(str(model_path))
    print(f"Model saved to {model_path}")
    
    # Normally we'd export to ONNX here using onnxmltools
    print("Skipping ONNX export in mock environment, returning true json model.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cpu", action="store_true", help="Force CPU training")
    args = parser.parse_args()
    
    project_root = Path(__file__).resolve().parent.parent.parent
    data_path = project_root / "data" / "processed" / "survival_data.parquet"
    
    train_survival_model(data_path, use_gpu=not args.cpu)

if __name__ == "__main__":
    main()
