
import pandas as pd

from .model import (
    model,
    preprocessor,
    FEATURE_COLUMNS
)


def predict_demand(input_data: dict) -> float:
    """
    Generate a demand index prediction using
    the trained Improved XGBoost model.
    """

    # Convert input dictionary into DataFrame
    input_df = pd.DataFrame(
        [input_data],
        columns=FEATURE_COLUMNS
    )

    # Apply the exact preprocessing pipeline
    processed_data = preprocessor.transform(input_df)

    # Generate prediction
    prediction = model.predict(processed_data)

    # Return the predicted demand index
    return float(prediction[0])

