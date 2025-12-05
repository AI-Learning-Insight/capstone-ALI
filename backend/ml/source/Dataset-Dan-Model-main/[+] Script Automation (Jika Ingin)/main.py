# main.py
from fastapi import FastAPI
from inference import predict_learner_type
from feature_engineering import compute_features
import pandas as pd

app = FastAPI()

@app.post("/predict/{user_id}")
def predict_user(user_id: int):

    # ===== SIMULASI AMBIL DARI DATABASE =====
    tracking_df = pd.read_sql(
        f"SELECT * FROM tracking WHERE user_id={user_id}", con=None
    )
    submission_df = pd.read_sql(
        f"SELECT * FROM submission WHERE user_id={user_id}", con=None
    )
    exam_df = pd.read_sql(
        f"SELECT * FROM exam WHERE user_id={user_id}", con=None
    )
    # ======================================

    features = compute_features(
        tracking_df,
        submission_df,
        exam_df
    )

    learner_type = predict_learner_type(features)

    return {
        "user_id": user_id,
        "learner_type": learner_type,
        "features": features
    }
