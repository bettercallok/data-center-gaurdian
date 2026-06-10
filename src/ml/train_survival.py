import argparse
import xgboost as xgb
import polars as pl
from pathlib import Path
import json

def compute_real_ttf(df: pl.DataFrame) -> pl.DataFrame:
    """
    Computes real Time-To-Failure bounds per drive from actual observation dates.
    
    For each unique serial_number:
      - ttf = number of days from first_seen to last_seen (the drive's real lifespan)
      - y_lower = ttf (the exact observed lifespan — a hard lower bound)
      - y_upper = ttf if failed==1, else inf (right-censored: drive still alive)
    
    This replaces synthetic math with ground-truth survival times from the dataset.
    """
    df = df.with_columns(pl.col("date").str.strptime(pl.Date, "%Y-%m-%d", strict=False))

    drive_stats = (
        df.group_by("serial_number")
        .agg([
            pl.col("date").min().alias("first_seen"),
            pl.col("date").max().alias("last_seen"),
            pl.col("failure").max().alias("ever_failed"),
            pl.col("smart_5_raw").mean().alias("smart_5_raw"),
            pl.col("smart_187_raw").mean().alias("smart_187_raw"),
            pl.col("smart_188_raw").mean().alias("smart_188_raw"),
            pl.col("smart_197_raw").mean().alias("smart_197_raw"),
            pl.col("smart_198_raw").mean().alias("smart_198_raw"),
        ])
    )

    drive_stats = drive_stats.with_columns([
        ((pl.col("last_seen") - pl.col("first_seen")).dt.total_days() + 1).alias("ttf")
    ])

    drive_stats = drive_stats.with_columns([
        pl.col("ttf").clip(lower_bound=1).alias("y_lower"),
        pl.when(pl.col("ever_failed") == 1)
          .then(pl.col("ttf").clip(lower_bound=1))
          .otherwise(float("inf"))
          .alias("y_upper"),
        pl.col("ever_failed").alias("failure"),
    ])

    print(f"  drives processed: {len(drive_stats)}")
    print(f"  failed drives:    {drive_stats['ever_failed'].sum()}")
    print(f"  median TTF days:  {drive_stats['ttf'].median():.1f}")

    return drive_stats

def train_survival_model(data_path: Path, use_gpu: bool):
    print(f"loading data from {data_path}")
    df = pl.read_parquet(data_path)

    print("computing real per-drive TTF from observation dates...")
    drive_stats = compute_real_ttf(df)
    
    features = ["smart_5_raw", "smart_187_raw", "smart_188_raw", "smart_197_raw", "smart_198_raw"]
    X = drive_stats.select(features).to_pandas().values
    y_lower = drive_stats.select("y_lower").to_pandas()["y_lower"].values
    y_upper = drive_stats.select("y_upper").to_pandas()["y_upper"].values

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
