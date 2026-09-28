from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.inspection import permutation_importance

from xgboost import XGBClassifier

from feature_extractor import (
    extract_features,
    get_feature_names,
)


# ============================================================
# 설정
# ============================================================

DATA_PATH = Path("ciphertexts.csv")

MODEL_PATH = Path(
    "xgb_hamming_cramer_model.joblib"
)

IMPORTANCE_PATH = Path(
    "xgb_feature_importance.csv"
)

CONFUSION_MATRIX_PATH = Path(
    "xgb_confusion_matrix.png"
)

PERMUTATION_IMPORTANCE_PATH = Path(
    "xgb_permutation_importance.csv"
)


VALID_LABELS = {0, 2, 3, 4, 5}

RANDOM_STATE = 42

TEST_SIZE = 0.2


# ============================================================
# 데이터 로딩
# ============================================================

def load_dataset():

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} 파일이 없습니다."
        )

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
            "CSV에는 ciphertext, label column이 필요합니다."
        )

    df = df.dropna(
        subset=[
            "ciphertext",
            "label"
        ]
    ).copy()

    # 공백 / 줄바꿈 제거
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
            f"잘못된 label: {invalid_labels}"
        )

    invalid_mask = ~df[
        "ciphertext"
    ].str.match(
        r"^\d+$"
    )

    if invalid_mask.any():

        print(
            df.loc[invalid_mask]
        )

        raise ValueError(
            "숫자가 아닌 ciphertext가 존재합니다."
        )

    return df


# ============================================================
# Feature extraction
# ============================================================

def make_features(df):

    X = np.vstack([
        extract_features(text)
        for text in df["ciphertext"]
    ])

    y = df[
        "label"
    ].to_numpy()

    return X, y


# ============================================================
# Main
# ============================================================

def main():

    print("=" * 60)
    print("Hamming + Cramer's V XGBoost")
    print("=" * 60)

    # --------------------------------------------------------
    # Dataset
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Feature
    # --------------------------------------------------------

    X, y_original = make_features(
        df
    )

    feature_names = (
        get_feature_names()
    )

    print()
    print(
        f"Feature shape: {X.shape}"
    )

    print(
        f"Feature count: "
        f"{len(feature_names)}"
    )

    # --------------------------------------------------------
    # XGBoost용 label encoding
    #
    # 원래:
    #   0, 2, 3, 4, 5
    #
    # XGBoost:
    #   0, 1, 2, 3, 4
    # --------------------------------------------------------

    label_encoder = LabelEncoder()

    y = label_encoder.fit_transform(
        y_original
    )

    print()
    print("Label mapping:")

    for encoded, original in enumerate(
        label_encoder.classes_
    ):

        print(
            f"{original} -> {encoded}"
        )

    # --------------------------------------------------------
    # Train / Test split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,

            test_size=TEST_SIZE,

            random_state=RANDOM_STATE,

            stratify=y
        )
    )

    print()
    print(
        f"Train samples: {len(y_train)}"
    )

    print(
        f"Test samples : {len(y_test)}"
    )

    # --------------------------------------------------------
    # XGBoost
    # --------------------------------------------------------

    model = XGBClassifier(

        # tree 개수
        n_estimators=500,

        # tree 깊이
        max_depth=5,

        # 각 tree가 이전 tree의 오류를
        # 얼마나 강하게 수정할지
        learning_rate=0.05,

        # 각 tree에서 사용할 sample 비율
        subsample=0.8,

        # 각 tree에서 사용할 feature 비율
        colsample_bytree=0.8,

        # leaf를 너무 쉽게 만들지 않도록
        min_child_weight=2,

        # L2 regularization
        reg_lambda=1.0,

        # L1 regularization
        reg_alpha=0.0,

        objective="multi:softprob",

        num_class=5,

        eval_metric="mlogloss",

        # feature_importances_ 계산 기준
        importance_type="gain",

        random_state=RANDOM_STATE,

        n_jobs=-1,
    )

    print()
    print("=" * 60)
    print("Training XGBoost...")
    print("=" * 60)

    model.fit(
        X_train,
        y_train
    )

    print("Training complete.")

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    y_pred = model.predict(
        X_test
    )

    # 다시 원래 label로 복원
    y_test_original = (
        label_encoder.inverse_transform(
            y_test
        )
    )

    y_pred_original = (
        label_encoder.inverse_transform(
            y_pred.astype(int)
        )
    )

    labels = [
        0,
        2,
        3,
        4,
        5
    ]

    # --------------------------------------------------------
    # Classification Report
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("Classification Report")
    print("=" * 60)

    print(
        classification_report(
            y_test_original,
            y_pred_original,

            labels=labels,

            digits=4,

            zero_division=0,
        )
    )

    # --------------------------------------------------------
    # Confusion Matrix
    # --------------------------------------------------------

    cm = confusion_matrix(
        y_test_original,
        y_pred_original,
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

    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=labels
    )

    disp.plot(
        values_format="d"
    )

    plt.title(
        "XGBoost Confusion Matrix"
    )

    plt.tight_layout()

    plt.savefig(
        CONFUSION_MATRIX_PATH,
        dpi=200
    )

    plt.show()

    # --------------------------------------------------------
    # XGBoost Feature Importance
    # --------------------------------------------------------

    importance_df = pd.DataFrame({

        "feature":
            feature_names,

        "importance":
            model.feature_importances_
    })

    importance_df = (
        importance_df
        .sort_values(
            "importance",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    importance_df.to_csv(
        IMPORTANCE_PATH,
        index=False
    )

    print()
    print("=" * 60)
    print("XGBoost Feature Importance")
    print("=" * 60)

    print(
        importance_df.to_string(
            index=False
        )
    )

    plt.figure(
        figsize=(10, 8)
    )

    plt.barh(
        importance_df[
            "feature"
        ][::-1],

        importance_df[
            "importance"
        ][::-1]
    )

    plt.xlabel(
        "Gain Importance"
    )

    plt.title(
        "XGBoost Feature Importance"
    )

    plt.tight_layout()

    plt.show()

    # --------------------------------------------------------
    # Permutation Importance
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("Permutation Importance")
    print("=" * 60)

    permutation = permutation_importance(

        model,

        X_test,
        y_test,

        n_repeats=20,

        random_state=RANDOM_STATE,

        n_jobs=-1,
    )

    permutation_df = pd.DataFrame({

        "feature":
            feature_names,

        "importance_mean":
            permutation.importances_mean,

        "importance_std":
            permutation.importances_std,
    })

    permutation_df = (
        permutation_df
        .sort_values(
            "importance_mean",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    permutation_df.to_csv(
        PERMUTATION_IMPORTANCE_PATH,
        index=False
    )

    print(
        permutation_df.to_string(
            index=False
        )
    )

    # --------------------------------------------------------
    # 모델 저장
    # --------------------------------------------------------

    model_data = {

        "model":
            model,

        "label_encoder":
            label_encoder,

        "feature_names":
            feature_names,

        "labels":
            labels,
    }

    joblib.dump(
        model_data,
        MODEL_PATH
    )

    print()
    print("=" * 60)
    print("Saved")
    print("=" * 60)

    print(
        f"Model: {MODEL_PATH}"
    )

    print(
        f"Feature importance: "
        f"{IMPORTANCE_PATH}"
    )

    print(
        f"Permutation importance: "
        f"{PERMUTATION_IMPORTANCE_PATH}"
    )

    print(
        f"Confusion matrix: "
        f"{CONFUSION_MATRIX_PATH}"
    )


if __name__ == "__main__":
    main()
