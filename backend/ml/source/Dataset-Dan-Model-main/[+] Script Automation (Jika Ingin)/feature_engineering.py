# feature_engineering.py

import pandas as pd

def compute_features(tracking_df, submission_df, exam_df):

    total_completed_modules = tracking_df[tracking_df["status"] == 1].shape[0]

    avg_time_to_complete = tracking_df["time_to_complete_hours"].mean()
    if pd.isna(avg_time_to_complete):
        avg_time_to_complete = 0

    active_days = pd.to_datetime(
        tracking_df["last_activity_date"]
    ).dt.date.nunique()

    repeat_ratio = (
        tracking_df["tutorial_id"].duplicated().sum()
        / len(tracking_df)
        if len(tracking_df) > 0 else 0
    )

    avg_submission_rating = submission_df["rating"].mean()
    if pd.isna(avg_submission_rating):
        avg_submission_rating = 0

    avg_exam_score = exam_df["score"].mean()
    if pd.isna(avg_exam_score):
        avg_exam_score = 0

    exam_pass_rate = exam_df["is_passed"].mean()
    if pd.isna(exam_pass_rate):
        exam_pass_rate = 0

    return [
        avg_time_to_complete,
        total_completed_modules,
        active_days,
        repeat_ratio,
        avg_submission_rating,
        avg_exam_score,
        exam_pass_rate
    ]
