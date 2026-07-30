import pandas as pd

from .model import (
    model,
    preprocessor,
    FEATURE_COLUMNS,
)


def predict_price(input_data: dict) -> float:
    """
    Generate a price prediction using the trained
    XGBoost price prediction model.
    """

    # Convert input dictionary into a DataFrame
    input_df = pd.DataFrame(
        [input_data],
        columns=FEATURE_COLUMNS,
    )

    # Apply the exact preprocessing pipeline
    processed_data = preprocessor.transform(input_df)

    # Generate prediction
    prediction = model.predict(processed_data)

    # Return predicted price
    return float(prediction[0])