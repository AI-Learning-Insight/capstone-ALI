# inference.py
import pandas as pd
from model_loader import scaler, model, label_map

feature_cols = [
    "avg_time_to_complete",
    "total_completed_modules",
    "active_days",
    "repeat_ratio",
    "avg_submission_rating",
    "avg_exam_score",
    "exam_pass_rate"
]

def predict_learner_type(feature_values):

    df = pd.DataFrame([feature_values], columns=feature_cols)

    X_scaled = scaler.transform(df)
    label = int(model.predict(X_scaled)[0])

    return label_map[label]
