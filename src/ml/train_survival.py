import argparse
import xgboost as xgb
import polars as pl
from pathlib import Path
import json

def train_survival_model(data_path: Path, use_gpu: bool):
    print(f"Loading data from {data_path}")
    df = pl.read_parquet(data_path)
    
    df = df.with_columns([
        pl.when(pl.col("failure") == 1).then(100).otherwise(200).alias("y_lower"),
        pl.when(pl.col("failure") == 1).then(100).otherwise(float('inf')).alias("y_upper")
    ])
    
    features = ["smart_5_raw", "smart_187_raw", "smart_188_raw", "smart_197_raw", "smart_198_raw"]
    X = df.select(features).to_pandas().values
    y_lower = df.select("y_lower").to_pandas()["y_lower"].values
    y_upper = df.select("y_upper").to_pandas()["y_upper"].values
    
    dtrain = xgb.DMatrix(X)
    dtrain.set_float_info('label_lower_bound', y_lower)
    dtrain.set_float_info('label_upper_bound', y_upper)
    
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
        
    print("Training XGBoost AFT model...")
    bst = xgb.train(params, dtrain, num_boost_round=10)
    
    project_root = data_path.parent.parent.parent
    api_dir = project_root / "src" / "api"
    model_path = api_dir / "survival_model.onnx"
    
    print(f"Exporting ONNX graph to {model_path}...")
    try:
        from onnxmltools.convert import convert_xgboost
        from onnxmltools.convert.common.data_types import FloatTensorType
        
        initial_types = [('float_input', FloatTensorType([None, 5]))]
        onnx_model = convert_xgboost(bst, initial_types=initial_types)
        
        with open(model_path, "wb") as f:
            f.write(onnx_model.SerializeToString())
            
        print("ONNX compilation successful.")
    except Exception as e:
        print(f"ONNX export failed: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cpu", action="store_true", help="Force CPU training")
    args = parser.parse_args()
    
    project_root = Path(__file__).resolve().parent.parent.parent
    data_path = project_root / "data" / "processed" / "survival_data.parquet"
    
    train_survival_model(data_path, use_gpu=not args.cpu)

if __name__ == "__main__":
    main()
