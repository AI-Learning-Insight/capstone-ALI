# model_loader.py
import joblib

scaler = joblib.load("scaler.pkl")
model = joblib.load("model_learner_classifier.pkl")

label_map = {
    0: "Consistent Learner",
    1: "Fast Learner",
    2: "Reflective Learner"
}
