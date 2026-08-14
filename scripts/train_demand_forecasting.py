# ============================================================
# DEMAND FORECASTING - MODEL TRAINING
# ============================================================
#
# Purpose:
#     Train and evaluate demand forecasting models using
#     chronological train / validation / test splits.
#
# Models:
#     1. Linear Regression
#     2. Random Forest
#     3. XGBoost
#
# Production model:
#     Automatically selected using validation MAE.
#
# Saved files:
#
#     models/demand_forecasting/
#
#         demand_forecasting_model.joblib
#         rf_demand_model.joblib
#         xgb_demand_model.joblib
#         linear_demand_model.joblib
#         demand_preprocessor.joblib
#         model_metrics.json
#
# ============================================================


import json
from pathlib import Path
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from xgboost import XGBRegressor


warnings.filterwarnings("ignore")


# ============================================================
# PROJECT PATH SETUP
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]


DATA_FILE = (
    BASE_DIR
    / "datasets"
    / "processed"
    / "demand_forecasting_features.csv"
)


MODEL_DIR = (
    BASE_DIR
    / "models"
    / "demand_forecasting"
)


MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# MODEL OUTPUT FILES
# ============================================================

PRODUCTION_MODEL_FILE = (
    MODEL_DIR
    / "demand_forecasting_model.joblib"
)


RF_MODEL_FILE = (
    MODEL_DIR
    / "rf_demand_model.joblib"
)


XGB_MODEL_FILE = (
    MODEL_DIR
    / "xgb_demand_model.joblib"
)


LINEAR_MODEL_FILE = (
    MODEL_DIR
    / "linear_demand_model.joblib"
)


PREPROCESSOR_FILE = (
    MODEL_DIR
    / "demand_preprocessor.joblib"
)


METRICS_FILE = (
    MODEL_DIR
    / "model_metrics.json"
)


# ============================================================
# SETTINGS
# ============================================================

TARGET_COLUMN = "target_next_day_sales"


TEST_DAYS = 90


VALIDATION_DAYS = 90


RANDOM_STATE = 42


# ============================================================
# HELPER FUNCTION
# ============================================================

def calculate_wape(
    actual,
    predicted
):
    """
    Calculate Weighted Absolute Percentage Error.

    WAPE =
        sum(abs(actual - predicted))
        /
        sum(abs(actual))
        * 100
    """

    actual = np.asarray(
        actual,
        dtype=float
    )

    predicted = np.asarray(
        predicted,
        dtype=float
    )

    denominator = np.sum(
        np.abs(actual)
    )

    if denominator == 0:

        return 0.0

    wape = (
        np.sum(
            np.abs(
                actual - predicted
            )
        )
        / denominator
    ) * 100

    return float(wape)


# ============================================================
# HELPER FUNCTION
# ============================================================

def calculate_metrics(
    actual,
    predicted
):
    """
    Calculate all forecasting metrics.
    """

    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    r2 = r2_score(
        actual,
        predicted
    )

    wape = calculate_wape(
        actual,
        predicted
    )

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "wape_percent": float(wape)
    }


# ============================================================
# MAIN TRAINING FUNCTION
# ============================================================

def train_demand_models():

    print("=" * 70)
    print("DEMAND FORECASTING MODEL TRAINING")
    print("=" * 70)


    # ========================================================
    # STEP 1 - LOAD DATASET
    # ========================================================

    print("\n" + "-" * 70)
    print("STEP 1: Loading prepared forecasting dataset")
    print("-" * 70)

    print(
        f"\nDataset:\n{DATA_FILE}"
    )

    if not DATA_FILE.exists():

        raise FileNotFoundError(
            f"\nDemand forecasting dataset not found:\n"
            f"{DATA_FILE}\n\n"
            f"Run:\n"
            f"python scripts/prepare_demand_forecasting.py"
        )


    df = pd.read_csv(
        DATA_FILE
    )


    print(
        f"\nRows    : {len(df):,}"
    )

    print(
        f"Columns : {len(df.columns):,}"
    )


    # ========================================================
    # STEP 2 - PREPARE DATE
    # ========================================================

    print("\n" + "-" * 70)
    print("STEP 2: Preparing chronological dataset")
    print("-" * 70)


    if "date" not in df.columns:

        raise ValueError(
            "Dataset does not contain required 'date' column."
        )


    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )


    df = df.dropna(
        subset=["date"]
    )


    df = (
        df
        .sort_values("date")
        .reset_index(drop=True)
    )


    print(
        f"Date range: "
        f"{df['date'].min().date()} → "
        f"{df['date'].max().date()}"
    )


    # ========================================================
    # STEP 3 - VALIDATE TARGET
    # ========================================================

    print("\n" + "-" * 70)
    print("STEP 3: Validating target data")
    print("-" * 70)


    if TARGET_COLUMN not in df.columns:

        raise ValueError(
            f"Target column '{TARGET_COLUMN}' "
            f"not found in dataset."
        )


    missing_target = (
        df[TARGET_COLUMN]
        .isna()
        .sum()
    )


    print(
        f"Missing target values: "
        f"{missing_target:,}"
    )


    if missing_target > 0:

        print(
            "\nRemoving rows with missing target values..."
        )

        df = df.dropna(
            subset=[TARGET_COLUMN]
        ).reset_index(
            drop=True
        )


    # Convert target to numeric.

    df[TARGET_COLUMN] = pd.to_numeric(
        df[TARGET_COLUMN],
        errors="coerce"
    )


    df = df.dropna(
        subset=[TARGET_COLUMN]
    ).reset_index(
        drop=True
    )


    # Demand cannot be negative.

    negative_targets = (
        df[TARGET_COLUMN] < 0
    ).sum()


    if negative_targets > 0:

        print(
            f"Negative target values found: "
            f"{negative_targets:,}"
        )

        print(
            "Clipping negative targets to zero..."
        )

        df[TARGET_COLUMN] = (
            df[TARGET_COLUMN]
            .clip(lower=0)
        )


    print(
        f"Target minimum: "
        f"{df[TARGET_COLUMN].min():,.2f}"
    )

    print(
        f"Target maximum: "
        f"{df[TARGET_COLUMN].max():,.2f}"
    )


    # ========================================================
    # STEP 4 - SELECT FEATURES
    # ========================================================

    print("\n" + "-" * 70)
    print("STEP 4: Selecting model features")
    print("-" * 70)


    DROP_COLUMNS = [
        TARGET_COLUMN,
        "date"
    ]


    X = df.drop(
        columns=DROP_COLUMNS,
        errors="ignore"
    )


    y = df[
        TARGET_COLUMN
    ]


    print(
        f"Features available: "
        f"{X.shape[1]}"
    )


    print(
        f"Target: "
        f"{TARGET_COLUMN}"
    )


    # ========================================================
    # STEP 5 - IDENTIFY FEATURE TYPES
    # ========================================================

    print("\n" + "-" * 70)
    print("STEP 5: Identifying feature types")
    print("-" * 70)


    categorical_columns = [
        column
        for column in X.columns
        if X[column].dtype == "object"
        or str(
            X[column].dtype
        ).startswith("category")
    ]


    numerical_columns = [
        column
        for column in X.columns
        if column not in categorical_columns
    ]


    print(
        f"Numerical features  : "
        f"{len(numerical_columns)}"
    )


    print(
        f"Categorical features: "
        f"{len(categorical_columns)}"
    )


    if categorical_columns:

        print(
            "\nCategorical columns:"
        )

        for column in categorical_columns:

            print(
                f"  - {column}"
            )


    # ========================================================
    # STEP 6 - CHRONOLOGICAL SPLIT
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 6: Creating chronological train/validation/test split"
    )
    print("-" * 70)


    total_rows = len(df)


    if total_rows <= (
        TEST_DAYS
        + VALIDATION_DAYS
    ):

        raise ValueError(
            "Not enough rows for the requested "
            "train/validation/test split."
        )


    test_start = (
        total_rows
        - TEST_DAYS
    )


    validation_start = (
        test_start
        - VALIDATION_DAYS
    )


    train_df = (
        df
        .iloc[:validation_start]
        .copy()
    )


    validation_df = (
        df
        .iloc[
            validation_start:test_start
        ]
        .copy()
    )


    test_df = (
        df
        .iloc[test_start:]
        .copy()
    )


    print(
        f"\nTraining rows   : "
        f"{len(train_df):,}"
    )


    print(
        f"Validation rows : "
        f"{len(validation_df):,}"
    )


    print(
        f"Testing rows    : "
        f"{len(test_df):,}"
    )


    print(
        "\nTraining period:"
    )


    print(
        f"{train_df['date'].min().date()} → "
        f"{train_df['date'].max().date()}"
    )


    print(
        "\nValidation period:"
    )


    print(
        f"{validation_df['date'].min().date()} → "
        f"{validation_df['date'].max().date()}"
    )


    print(
        "\nTesting period:"
    )


    print(
        f"{test_df['date'].min().date()} → "
        f"{test_df['date'].max().date()}"
    )


    # ========================================================
    # STEP 7 - CREATE TRAIN / VALIDATION / TEST DATASETS
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 7: Creating train / validation / test datasets"
    )
    print("-" * 70)


    X_train = train_df.drop(
        columns=DROP_COLUMNS,
        errors="ignore"
    )


    y_train = train_df[
        TARGET_COLUMN
    ]


    X_validation = validation_df.drop(
        columns=DROP_COLUMNS,
        errors="ignore"
    )


    y_validation = validation_df[
        TARGET_COLUMN
    ]


    X_test = test_df.drop(
        columns=DROP_COLUMNS,
        errors="ignore"
    )


    y_test = test_df[
        TARGET_COLUMN
    ]


    print(
        f"X_train shape      : "
        f"{X_train.shape}"
    )


    print(
        f"X_validation shape : "
        f"{X_validation.shape}"
    )


    print(
        f"X_test shape       : "
        f"{X_test.shape}"
    )


    # ========================================================
    # STEP 8 - BUILD PREPROCESSING PIPELINE
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 8: Building preprocessing pipeline"
    )
    print("-" * 70)


    numerical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                )
            )
        ]
    )


    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                )
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                )
            )
        ]
    )


    transformers = []


    if numerical_columns:

        transformers.append(
            (
                "numeric",
                numerical_pipeline,
                numerical_columns
            )
        )


    if categorical_columns:

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_columns
            )
        )


    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop"
    )


    # ========================================================
    # STEP 9 - FIT PREPROCESSOR
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 9: Fitting preprocessing pipeline"
    )
    print("-" * 70)


    X_train_processed = (
        preprocessor.fit_transform(
            X_train
        )
    )


    X_validation_processed = (
        preprocessor.transform(
            X_validation
        )
    )


    X_test_processed = (
        preprocessor.transform(
            X_test
        )
    )


    print(
        f"Processed training shape: "
        f"{X_train_processed.shape}"
    )


    print(
        f"Processed validation shape: "
        f"{X_validation_processed.shape}"
    )


    print(
        f"Processed test shape: "
        f"{X_test_processed.shape}"
    )


    # ========================================================
    # STEP 10 - CREATE MODELS
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 10: Creating forecasting models"
    )
    print("-" * 70)


    models = {

        "Linear Regression":
            LinearRegression(),


        "Random Forest":
            RandomForestRegressor(
                n_estimators=500,
                max_depth=12,
                min_samples_leaf=2,
                max_features="sqrt",
                random_state=RANDOM_STATE,
                n_jobs=-1
            ),


        "XGBoost":
            XGBRegressor(
                n_estimators=500,
                max_depth=6,
                learning_rate=0.03,
                subsample=0.85,
                colsample_bytree=0.85,
                objective="reg:squarederror",
                random_state=RANDOM_STATE,
                n_jobs=-1
            )
    }


    print(
        f"\nModels created: "
        f"{len(models)}"
    )


    for model_name in models:

        print(
            f"  - {model_name}"
        )


    # ========================================================
    # STEP 11 - TRAIN MODELS
    # ========================================================

    print("\n" + "=" * 70)
    print("MODEL TRAINING")
    print("=" * 70)


    results = {}


    trained_models = {}


    validation_predictions = {}


    test_predictions = {}


    for model_name, model in models.items():

        print("\n" + "-" * 70)
        print(
            f"Training: "
            f"{model_name}"
        )
        print("-" * 70)


        # ----------------------------------------------------
        # Train model
        # ----------------------------------------------------

        model.fit(
            X_train_processed,
            y_train
        )


        # ----------------------------------------------------
        # Validation prediction
        # ----------------------------------------------------

        validation_prediction = (
            model.predict(
                X_validation_processed
            )
        )


        validation_prediction = np.maximum(
            validation_prediction,
            0
        )


        validation_metrics = (
            calculate_metrics(
                y_validation,
                validation_prediction
            )
        )


        # ----------------------------------------------------
        # Test prediction
        # ----------------------------------------------------

        test_prediction = (
            model.predict(
                X_test_processed
            )
        )


        test_prediction = np.maximum(
            test_prediction,
            0
        )


        test_metrics = (
            calculate_metrics(
                y_test,
                test_prediction
            )
        )


        # ----------------------------------------------------
        # Store predictions
        # ----------------------------------------------------

        validation_predictions[
            model_name
        ] = validation_prediction


        test_predictions[
            model_name
        ] = test_prediction


        # ----------------------------------------------------
        # Store metrics
        # ----------------------------------------------------

        results[
            model_name
        ] = {

            "validation_mae":
                validation_metrics["mae"],

            "validation_rmse":
                validation_metrics["rmse"],

            "validation_r2":
                validation_metrics["r2"],

            "validation_wape_percent":
                validation_metrics[
                    "wape_percent"
                ],


            "test_mae":
                test_metrics["mae"],

            "test_rmse":
                test_metrics["rmse"],

            "test_r2":
                test_metrics["r2"],

            "test_wape_percent":
                test_metrics[
                    "wape_percent"
                ]
        }


        trained_models[
            model_name
        ] = model


        # ----------------------------------------------------
        # Display metrics
        # ----------------------------------------------------

        print(
            f"\nValidation MAE : "
            f"{validation_metrics['mae']:,.4f}"
        )


        print(
            f"Validation RMSE: "
            f"{validation_metrics['rmse']:,.4f}"
        )


        print(
            f"Validation R²   : "
            f"{validation_metrics['r2']:.4f}"
        )


        print(
            f"Validation WAPE : "
            f"{validation_metrics['wape_percent']:.2f}%"
        )


        print(
            f"\nTest MAE       : "
            f"{test_metrics['mae']:,.4f}"
        )


        print(
            f"Test RMSE      : "
            f"{test_metrics['rmse']:,.4f}"
        )


        print(
            f"Test R²        : "
            f"{test_metrics['r2']:.4f}"
        )


        print(
            f"Test WAPE      : "
            f"{test_metrics['wape_percent']:.2f}%"
        )


    # ========================================================
    # STEP 12 - MODEL COMPARISON
    # ========================================================

    print("\n" + "=" * 70)
    print("MODEL COMPARISON")
    print("=" * 70)


    for model_name, metrics in results.items():

        print(
            f"\n{model_name}"
        )


        print(
            f"  Validation MAE : "
            f"{metrics['validation_mae']:,.4f}"
        )


        print(
            f"  Validation RMSE: "
            f"{metrics['validation_rmse']:,.4f}"
        )


        print(
            f"  Validation R²  : "
            f"{metrics['validation_r2']:.4f}"
        )


        print(
            f"  Test MAE       : "
            f"{metrics['test_mae']:,.4f}"
        )


        print(
            f"  Test RMSE      : "
            f"{metrics['test_rmse']:,.4f}"
        )


        print(
            f"  Test R²        : "
            f"{metrics['test_r2']:.4f}"
        )


        print(
            f"  Test WAPE      : "
            f"{metrics['test_wape_percent']:.2f}%"
        )


    # ========================================================
    # STEP 13 - SELECT BEST MODEL
    # ========================================================

    print("\n" + "=" * 70)
    print("SELECTING BEST MODEL")
    print("=" * 70)


    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Model selection is based on VALIDATION MAE.
    #
    # The test set is used only for final evaluation.
    #
    # Lower MAE = better.
    # --------------------------------------------------------

    best_model_name = min(
        results,
        key=lambda name:
            results[name][
                "validation_mae"
            ]
    )


    best_model = trained_models[
        best_model_name
    ]


    best_metrics = results[
        best_model_name
    ]


    print(
        f"\nBEST MODEL: "
        f"{best_model_name}"
    )


    print(
        f"\nValidation MAE: "
        f"{best_metrics['validation_mae']:,.4f}"
    )


    print(
        f"Test MAE: "
        f"{best_metrics['test_mae']:,.4f}"
    )


    print(
        f"Test RMSE: "
        f"{best_metrics['test_rmse']:,.4f}"
    )


    print(
        f"Test R²: "
        f"{best_metrics['test_r2']:.4f}"
    )


    print(
        f"Test WAPE: "
        f"{best_metrics['test_wape_percent']:.2f}%"
    )


    # ========================================================
    # STEP 14 - SAVE BEST PRODUCTION MODEL
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 14: Saving best production model"
    )
    print("-" * 70)


    joblib.dump(
        best_model,
        PRODUCTION_MODEL_FILE
    )


    print(
        "\nBest model saved:"
    )


    print(
        PRODUCTION_MODEL_FILE
    )


    # ========================================================
    # STEP 15 - SAVE RANDOM FOREST MODEL
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 15: Saving Random Forest model"
    )
    print("-" * 70)


    rf_model = trained_models[
        "Random Forest"
    ]


    joblib.dump(
        rf_model,
        RF_MODEL_FILE
    )


    print(
        "\nRandom Forest model saved:"
    )


    print(
        RF_MODEL_FILE
    )


    # ========================================================
    # STEP 16 - SAVE XGBOOST MODEL
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 16: Saving XGBoost model"
    )
    print("-" * 70)


    xgb_model = trained_models[
        "XGBoost"
    ]


    joblib.dump(
        xgb_model,
        XGB_MODEL_FILE
    )


    print(
        "\nXGBoost model saved:"
    )


    print(
        XGB_MODEL_FILE
    )


    # ========================================================
    # STEP 17 - SAVE LINEAR REGRESSION MODEL
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 17: Saving Linear Regression model"
    )
    print("-" * 70)


    linear_model = trained_models[
        "Linear Regression"
    ]


    joblib.dump(
        linear_model,
        LINEAR_MODEL_FILE
    )


    print(
        "\nLinear Regression model saved:"
    )


    print(
        LINEAR_MODEL_FILE
    )


    # ========================================================
    # STEP 18 - SAVE PREPROCESSOR
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 18: Saving preprocessing pipeline"
    )
    print("-" * 70)


    joblib.dump(
        preprocessor,
        PREPROCESSOR_FILE
    )


    print(
        "\nPreprocessor saved:"
    )


    print(
        PREPROCESSOR_FILE
    )


    # ========================================================
    # STEP 19 - SAVE MODEL METRICS
    # ========================================================

    print("\n" + "-" * 70)
    print(
        "STEP 19: Saving model metrics"
    )
    print("-" * 70)


    metrics_output = {

        "target":
            TARGET_COLUMN,


        "dataset_rows":
            int(len(df)),


        "feature_count":
            int(X.shape[1]),


        "processed_feature_count":
            int(
                X_train_processed.shape[1]
            ),


        "train_rows":
            int(len(train_df)),


        "validation_rows":
            int(len(validation_df)),


        "test_rows":
            int(len(test_df)),


        "train_period": {

            "start":
                str(
                    train_df[
                        "date"
                    ]
                    .min()
                    .date()
                ),

            "end":
                str(
                    train_df[
                        "date"
                    ]
                    .max()
                    .date()
                )
        },


        "validation_period": {

            "start":
                str(
                    validation_df[
                        "date"
                    ]
                    .min()
                    .date()
                ),

            "end":
                str(
                    validation_df[
                        "date"
                    ]
                    .max()
                    .date()
                )
        },


        "test_period": {

            "start":
                str(
                    test_df[
                        "date"
                    ]
                    .min()
                    .date()
                ),

            "end":
                str(
                    test_df[
                        "date"
                    ]
                    .max()
                    .date()
                )
        },


        "best_model":
            best_model_name,


        "model_selection_metric":
            "validation_mae",


        "models":
            results,


        "saved_models": {

            "production":
                str(
                    PRODUCTION_MODEL_FILE
                ),

            "random_forest":
                str(
                    RF_MODEL_FILE
                ),

            "xgboost":
                str(
                    XGB_MODEL_FILE
                ),

            "linear_regression":
                str(
                    LINEAR_MODEL_FILE
                ),

            "preprocessor":
                str(
                    PREPROCESSOR_FILE
                )
        }
    }


    with open(
        METRICS_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metrics_output,
            file,
            indent=4
        )


    print(
        "\nMetrics saved:"
    )


    print(
        METRICS_FILE
    )


    # ========================================================
    # STEP 20 - FINAL REPORT
    # ========================================================

    print("\n" + "=" * 70)
    print(
        "DEMAND FORECASTING MODEL TRAINING COMPLETED"
    )
    print("=" * 70)


    print(
        f"\nProduction model: "
        f"{best_model_name}"
    )


    print(
        f"\nValidation MAE: "
        f"{best_metrics['validation_mae']:,.4f}"
    )


    print(
        f"Test MAE: "
        f"{best_metrics['test_mae']:,.4f}"
    )


    print(
        f"Test RMSE: "
        f"{best_metrics['test_rmse']:,.4f}"
    )


    print(
        f"Test R²: "
        f"{best_metrics['test_r2']:.4f}"
    )


    print(
        f"Test WAPE: "
        f"{best_metrics['test_wape_percent']:.2f}%"
    )


    print(
        "\nAll saved files:"
    )


    print(
        f"  - {PRODUCTION_MODEL_FILE}"
    )


    print(
        f"  - {RF_MODEL_FILE}"
    )


    print(
        f"  - {XGB_MODEL_FILE}"
    )


    print(
        f"  - {LINEAR_MODEL_FILE}"
    )


    print(
        f"  - {PREPROCESSOR_FILE}"
    )


    print(
        f"  - {METRICS_FILE}"
    )


    print("\n" + "=" * 70)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    try:

        train_demand_models()

    except Exception as error:

        print("\n" + "=" * 70)
        print("MODEL TRAINING ERROR")
        print("=" * 70)

        print(
            f"\n{type(error).__name__}: "
            f"{error}"
        )

        raise