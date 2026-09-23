from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

from hamming_features import (
    extract_features,
    get_feature_names,
)


# =========================================================
# 설정
# =========================================================

DATA_PATH = Path("ciphertexts.csv")

MODEL_PATH = Path("rf_hamming_model.joblib")

IMPORTANCE_PATH = Path(
    "feature_importance.csv"
)

CONFUSION_MATRIX_PATH = Path(
    "confusion_matrix.png"
)


VALID_LABELS = {0, 2, 3, 4, 5}

RANDOM_STATE = 42

TEST_SIZE = 0.2


# =========================================================
# 데이터 로딩
# =========================================================

def load_dataset():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} 파일이 없습니다."
        )

    # ciphertext를 반드시 문자열로 읽는다.
    # 앞자리 0 보존 목적.
    df = pd.read_csv(
        DATA_PATH,
        dtype={
            "ciphertext": "string"
        }
    )

    required_columns = {
        "ciphertext",
        "label",
    }

    if not required_columns.issubset(
        df.columns
    ):
        raise ValueError(
            "CSV에는 ciphertext, label "
            "column이 필요합니다."
        )

    df = df.dropna(
        subset=[
            "ciphertext",
            "label"
        ]
    ).copy()

    # 공백/줄바꿈 제거
    df["ciphertext"] = (
        df["ciphertext"]
        .astype(str)
        .str.replace(
            r"\s+",
            "",
            regex=True
        )
    )

    df["label"] = (
        pd.to_numeric(
            df["label"]
        )
        .astype(int)
    )

    invalid_labels = (
        set(df["label"].unique())
        - VALID_LABELS
    )

    if invalid_labels:
        raise ValueError(
            f"잘못된 label: {invalid_labels}\n"
            f"가능한 label: {VALID_LABELS}"
        )

    # ciphertext 숫자 검증
    invalid_mask = ~df[
        "ciphertext"
    ].str.match(
        r"^\d+$"
    )

    if invalid_mask.any():
        bad_rows = df[
            invalid_mask
        ]

        raise ValueError(
            "숫자가 아닌 ciphertext가 있습니다:\n"
            f"{bad_rows}"
        )

    return df


# =========================================================
# Feature extraction
# =========================================================

def make_features(df):
    X = np.vstack([
        extract_features(text)
        for text in df["ciphertext"]
    ])

    y = df[
        "label"
    ].to_numpy()

    return X, y


# =========================================================
# Main
# =========================================================

def main():

    print("=" * 60)
    print("Hamming Similarity Random Forest")
    print("=" * 60)

    df = load_dataset()

    print()
    print(
        f"전체 암호문 개수: {len(df)}"
    )

    print()
    print("Class distribution:")

    print(
        df["label"]
        .value_counts()
        .sort_index()
    )

    # -----------------------------------------------------
    # Feature 생성
    # -----------------------------------------------------

    X, y = make_features(df)

    feature_names = get_feature_names()

    print()
    print(
        f"Feature shape: {X.shape}"
    )

    print(
        f"Feature 개수: {len(feature_names)}"
    )

    # -----------------------------------------------------
    # Train / Test split
    # -----------------------------------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE,
            stratify=y,
        )
    )

    print()
    print(
        f"Train samples: {len(y_train)}"
    )

    print(
        f"Test samples : {len(y_test)}"
    )

    # -----------------------------------------------------
    # Random Forest
    # -----------------------------------------------------

    model = RandomForestClassifier(

        # 충분히 많은 tree 사용
        n_estimators=500,

        # 너무 깊은 tree가 짧은 암호문의 noise를
        # 외우는 것을 어느 정도 제한
        max_depth=10,

        # leaf에 하나짜리 sample만 존재하는 것 방지
        min_samples_leaf=2,

        # 각 tree마다 일부 feature만 사용
        max_features="sqrt",

        # class imbalance 대응
        class_weight="balanced_subsample",

        random_state=RANDOM_STATE,

        n_jobs=-1,

        # OOB 성능도 참고 가능
        oob_score=True,
    )

    print()
    print("Training Random Forest...")

    model.fit(
        X_train,
        y_train
    )

    print("Training complete.")

    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    y_pred = model.predict(
        X_test
    )

    labels = [
        0,
        2,
        3,
        4,
        5
    ]

    # -----------------------------------------------------
    # 결과
    # -----------------------------------------------------

    print()
    print("=" * 60)
    print("Classification Report")
    print("=" * 60)

    print(
        classification_report(
            y_test,
            y_pred,
            labels=labels,
            digits=4,
            zero_division=0,
        )
    )

    print(
        f"OOB Accuracy: "
        f"{model.oob_score_:.4f}"
    )

    # -----------------------------------------------------
    # Confusion Matrix
    # -----------------------------------------------------

    cm = confusion_matrix(
        y_test,
        y_pred,
        labels=labels
    )

    print()
    print("=" * 60)
    print("Confusion Matrix")
    print("=" * 60)

    print(
        pd.DataFrame(
            cm,
            index=[
                f"true_{x}"
                for x in labels
            ],
            columns=[
                f"pred_{x}"
                for x in labels
            ],
        )
    )

    display = (
        ConfusionMatrixDisplay(
            confusion_matrix=cm,
            display_labels=labels,
        )
    )

    display.plot(
        values_format="d"
    )

    plt.title(
        "Hamming RF Confusion Matrix"
    )

    plt.tight_layout()

    plt.savefig(
        CONFUSION_MATRIX_PATH,
        dpi=200
    )

    plt.close()

    print()
    print(
        f"Confusion matrix saved: "
        f"{CONFUSION_MATRIX_PATH}"
    )

    # -----------------------------------------------------
    # Feature Importance
    # -----------------------------------------------------

    importance = pd.DataFrame({
        "feature": feature_names,
        "importance":
            model.feature_importances_,
    })

    importance = (
        importance
        .sort_values(
            "importance",
            ascending=False
        )
        .reset_index(drop=True)
    )

    importance.to_csv(
        IMPORTANCE_PATH,
        index=False
    )

    print()
    print("=" * 60)
    print("Feature Importance")
    print("=" * 60)

    print(
        importance.to_string(
            index=False
        )
    )

    print()
    print(
        f"Feature importance saved: "
        f"{IMPORTANCE_PATH}"
    )

    # -----------------------------------------------------
    # 모델 저장
    # -----------------------------------------------------

    model_data = {
        "model": model,
        "feature_names":
            feature_names,

        "labels": labels,
    }

    joblib.dump(
        model_data,
        MODEL_PATH
    )

    print()
    print(
        f"Model saved: "
        f"{MODEL_PATH}"
    )


if __name__ == "__main__":
    main()
