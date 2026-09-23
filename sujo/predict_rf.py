import argparse
from pathlib import Path

import joblib
import numpy as np

from hamming_features import (
    extract_features,
    get_feature_names,
)


MODEL_PATH = Path(
    "rf_hamming_model.joblib"
)


def predict(ciphertext: str):

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "rf_hamming_model.joblib이 없습니다.\n"
            "먼저 python train_rf.py 를 실행하세요."
        )

    model_data = joblib.load(
        MODEL_PATH
    )

    model = model_data[
        "model"
    ]

    feature_names = model_data[
        "feature_names"
    ]

    features = extract_features(
        ciphertext
    )

    X = features.reshape(
        1,
        -1
    )

    prediction = int(
        model.predict(X)[0]
    )

    probabilities = (
        model.predict_proba(X)[0]
    )

    classes = model.classes_

    print("=" * 60)
    print("Prediction")
    print("=" * 60)

    print()
    print(
        f"Predicted block size: "
        f"{prediction}"
    )

    print()
    print("Class probabilities:")

    ranking = sorted(
        zip(
            classes,
            probabilities
        ),
        key=lambda x: x[1],
        reverse=True
    )

    for label, probability in ranking:

        name = (
            "random"
            if label == 0
            else f"{label}-digit"
        )

        print(
            f"{name:10s}: "
            f"{probability:.4f}"
        )

    print()
    print("=" * 60)
    print("Hamming Features")
    print("=" * 60)

    for name, value in zip(
        feature_names,
        features
    ):
        print(
            f"{name:20s}: "
            f"{value:.6f}"
        )


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "ciphertext",
        type=str,
        help="숫자로 이루어진 암호문",
    )

    args = parser.parse_args()

    predict(
        args.ciphertext
    )


if __name__ == "__main__":
    main()
