import argparse
import xgboost as xgb
import polars as pl
from pathlib import Path
import json

def train_survival_model(data_path: Path, use_gpu: bool):
    print(f"Loading data from {data_path}")
    df = pl.read_parquet(data_path)
    
    # Create synthetic survival bounds for the demo so the model reacts to SMART inputs
    df = df.with_columns([
        (pl.col("smart_5_raw") * 0.1 + pl.col("smart_187_raw") * 0.5 + pl.col("smart_197_raw") * 0.3).alias("penalty")
    ])
    
    df = df.with_columns([
        pl.when(pl.col("failure") == 1)
          .then(pl.max_horizontal(10.0, 100.0 - pl.col("penalty")))
          .otherwise(pl.max_horizontal(50.0, 200.0 - pl.col("penalty"))).alias("y_lower"),
        pl.when(pl.col("failure") == 1)
          .then(pl.max_horizontal(10.0, 100.0 - pl.col("penalty")))
          .otherwise(float('inf')).alias("y_upper")
    ])
    
    features = ["smart_5_raw", "smart_187_raw", "smart_188_raw", "smart_197_raw", "smart_198_raw"]
    X = df.select(features).to_pandas().values
    y_lower = df.select("y_lower").to_pandas()["y_lower"].values
    y_upper = df.select("y_upper").to_pandas()["y_upper"].values

    # 80/20 train/eval split for early stopping
    split = int(len(X) * 0.8)
    X_train, X_eval = X[:split], X[split:]
    y_lower_train, y_lower_eval = y_lower[:split], y_lower[split:]
    y_upper_train, y_upper_eval = y_upper[:split], y_upper[split:]

    dtrain = xgb.DMatrix(X_train)
    dtrain.set_float_info('label_lower_bound', y_lower_train)
    dtrain.set_float_info('label_upper_bound', y_upper_train)

    deval = xgb.DMatrix(X_eval)
    deval.set_float_info('label_lower_bound', y_lower_eval)
    deval.set_float_info('label_upper_bound', y_upper_eval)
    
    params = {
        'objective': 'survival:aft',
        'eval_metric': 'aft-nloglik',
        'aft_loss_distribution': 'normal',
        'aft_loss_distribution_scale': 1.2,
        'tree_method': 'hist',
        'learning_rate': 0.05,
        'max_depth': 6,
        'subsample': 0.8
    }
    
    if use_gpu:
        params['device'] = 'cuda'
        
    print("Training XGBoost AFT model (up to 300 rounds with early stopping)...")
    bst = xgb.train(
        params,
        dtrain,
        num_boost_round=300,
        evals=[(deval, "eval")],
        early_stopping_rounds=20,
        verbose_eval=50
    )
    
    project_root = data_path.parent.parent.parent
    api_dir = project_root / "src" / "api"
    model_path = api_dir / "survival_model.json"
    
    print(f"Exporting XGBoost model to {model_path}...")
    try:
        bst.save_model(model_path)
        print("Model saved successfully.")
    except Exception as e:
        print(f"Model export failed: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cpu", action="store_true", help="Force CPU training")
    args = parser.parse_args()
    
    project_root = Path(__file__).resolve().parent.parent.parent
    data_path = project_root / "data" / "processed" / "survival_data.parquet"
    
    train_survival_model(data_path, use_gpu=not args.cpu)

if __name__ == "__main__":
    main()
