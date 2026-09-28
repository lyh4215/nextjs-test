# cramer_positional_features.py

import numpy as np
from itertools import combinations


BLOCK_SIZES = (2, 3, 4, 5)

POSITION_NAMES = "ABCDE"


def clean_ciphertext(ciphertext: str) -> str:
    ciphertext = "".join(str(ciphertext).split())

    if not ciphertext:
        raise ValueError("ciphertext가 비어 있습니다.")

    if not ciphertext.isdigit():
        raise ValueError(
            "ciphertext에는 숫자만 들어갈 수 있습니다."
        )

    return ciphertext


def split_blocks_matrix(
    ciphertext: str,
    block_size: int
):
    """
    ciphertext를 block_size 단위로 나누어

    shape:
        (n_blocks, block_size)

    numpy 배열로 반환.

    남는 불완전한 block은 버린다.
    """

    ciphertext = clean_ciphertext(
        ciphertext
    )

    n_blocks = (
        len(ciphertext)
        // block_size
    )

    if n_blocks == 0:
        return np.empty(
            (0, block_size),
            dtype=np.uint8
        )

    usable = ciphertext[
        :n_blocks * block_size
    ]

    digits = np.fromiter(
        (
            ord(c) - ord("0")
            for c in usable
        ),
        dtype=np.uint8
    )

    return digits.reshape(
        n_blocks,
        block_size
    )


def contingency_table(
    x: np.ndarray,
    y: np.ndarray
):
    """
    두 digit position 사이의 10x10 count table 생성.

    table[a, b]:
        x=a이고 y=b였던 횟수
    """

    table = np.zeros(
        (10, 10),
        dtype=np.float64
    )

    np.add.at(
        table,
        (x, y),
        1
    )

    # 전혀 관측되지 않은 row / column은 제거.
    # Cramer's V 계산 안정성을 위해 필요.
    used_rows = (
        table.sum(axis=1) > 0
    )

    used_cols = (
        table.sum(axis=0) > 0
    )

    return table[
        np.ix_(
            used_rows,
            used_cols
        )
    ]


def chi_square_from_table(
    table: np.ndarray
):
    """
    contingency table에서 chi-square statistic 계산.
    """

    n = table.sum()

    if n <= 0:
        return 0.0

    row_sum = table.sum(
        axis=1,
        keepdims=True
    )

    col_sum = table.sum(
        axis=0,
        keepdims=True
    )

    expected = (
        row_sum @ col_sum
    ) / n

    valid = expected > 0

    chi2 = np.sum(
        (
            table[valid]
            - expected[valid]
        ) ** 2
        / expected[valid]
    )

    return float(chi2)


def cramers_v(
    x: np.ndarray,
    y: np.ndarray,
    bias_corrected: bool = True
):
    """
    두 categorical digit position 사이의
    Cramer's V 계산.

    반환값:
        0 ~ 1

    0에 가까움:
        두 위치가 거의 독립

    클수록:
        두 위치의 count pattern 사이에
        강한 관계가 있음

    짧은 암호문을 고려해 bias-corrected
    Cramer's V를 기본 사용.
    """

    if len(x) != len(y):
        raise ValueError(
            "x와 y 길이가 같아야 합니다."
        )

    n = len(x)

    if n < 2:
        return 0.0

    table = contingency_table(
        x,
        y
    )

    r, c = table.shape

    # 한쪽 position이 한 값밖에 갖지 않는 경우
    if r < 2 or c < 2:
        return 0.0

    chi2 = chi_square_from_table(
        table
    )

    phi2 = chi2 / n

    # -----------------------------
    # 일반 Cramer's V
    # -----------------------------
    if not bias_corrected:

        denom = min(
            r - 1,
            c - 1
        )

        if denom <= 0:
            return 0.0

        return float(
            np.sqrt(
                phi2 / denom
            )
        )

    # -----------------------------
    # Bias-corrected Cramer's V
    #
    # 짧은 sample / sparse table에서
    # 일반 V가 과대평가되는 현상 완화
    # -----------------------------

    if n <= 1:
        return 0.0

    phi2_corrected = max(
        0.0,
        phi2
        - (
            (c - 1)
            * (r - 1)
        )
        / (n - 1)
    )

    r_corrected = (
        r
        - ((r - 1) ** 2)
        / (n - 1)
    )

    c_corrected = (
        c
        - ((c - 1) ** 2)
        / (n - 1)
    )

    denom = min(
        r_corrected - 1,
        c_corrected - 1
    )

    if denom <= 0:
        return 0.0

    value = np.sqrt(
        phi2_corrected
        / denom
    )

    # numerical safety
    return float(
        np.clip(
            value,
            0.0,
            1.0
        )
    )


def cramer_features_for_k(
    ciphertext: str,
    block_size: int
):
    """
    특정 block size에서
    모든 position pair의 Cramer's V.

    예:
        k=4

        A-B
        A-C
        A-D
        B-C
        B-D
        C-D
    """

    blocks = split_blocks_matrix(
        ciphertext,
        block_size
    )

    features = []

    for i, j in combinations(
        range(block_size),
        2
    ):

        value = cramers_v(
            blocks[:, i],
            blocks[:, j],
            bias_corrected=True
        )

        features.append(value)

    return np.asarray(
        features,
        dtype=np.float64
    )


def extract_cramer_features(
    ciphertext: str
):
    """
    k=2,3,4,5 전체 positional Cramer's V.

    총 feature:
        1 + 3 + 6 + 10 = 20
    """

    features = []

    for block_size in BLOCK_SIZES:

        values = cramer_features_for_k(
            ciphertext,
            block_size
        )

        features.extend(values)

    return np.asarray(
        features,
        dtype=np.float64
    )


def get_cramer_feature_names():

    names = []

    for k in BLOCK_SIZES:

        for i, j in combinations(
            range(k),
            2
        ):

            pos_i = POSITION_NAMES[i]
            pos_j = POSITION_NAMES[j]

            names.append(
                f"k{k}_cramer_{pos_i}_{pos_j}"
            )

    return names


if __name__ == "__main__":

    example = (
        "613931290139313858612912"
        "648554927425170531303239"
    )

    features = extract_cramer_features(
        example
    )

    names = get_cramer_feature_names()

    print(
        "Feature count:",
        len(features)
    )

    for name, value in zip(
        names,
        features
    ):

        print(
            f"{name:20s}: "
            f"{value:.6f}"
        )
