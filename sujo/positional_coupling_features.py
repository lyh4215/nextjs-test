# positional_coupling_features.py

from itertools import combinations

import numpy as np


def clean_ciphertext(ciphertext: str) -> str:
    ciphertext = "".join(
        str(ciphertext).split()
    )

    if not ciphertext:
        raise ValueError(
            "ciphertext가 비어 있습니다."
        )

    if not ciphertext.isdigit():
        raise ValueError(
            "ciphertext에는 숫자만 들어갈 수 있습니다."
        )

    return ciphertext


def split_k4_blocks(ciphertext: str):
    """
    ciphertext를 4자리씩 나눈다.

    예:
        123456789012
        ->
        1234
        5678
        9012

    뒤에 남는 불완전 block은 버린다.
    """

    ciphertext = clean_ciphertext(
        ciphertext
    )

    n_blocks = (
        len(ciphertext) // 4
    )

    if n_blocks == 0:
        return np.empty(
            (0, 4),
            dtype=np.uint8
        )

    usable = ciphertext[
        :n_blocks * 4
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
        4
    )


def half_similarity(
    block1,
    block2,
    start,
    end
):
    """
    지정된 position 구간에서
    같은 자리 비율.

    AB 또는 CD 비교용.

    반환값:
        0.0 : 둘 다 다름
        0.5 : 하나만 같음
        1.0 : 둘 다 같음
    """

    a = block1[start:end]
    b = block2[start:end]

    return float(
        np.mean(
            a == b
        )
    )


def extract_coupling_features(
    ciphertext: str
):
    """
    4자리 block을

        [A B] [C D]

    로 보고,

    모든 block pair에서

        S_L = similarity(AB)
        S_R = similarity(CD)

    를 계산한다.

    반환 features:

    1. left similarity mean
    2. right similarity mean
    3. covariance(S_L, S_R)
    4. correlation(S_L, S_R)
    5. joint-high excess
    """

    blocks = split_k4_blocks(
        ciphertext
    )

    n_blocks = len(blocks)

    if n_blocks < 2:
        return np.zeros(
            5,
            dtype=np.float64
        )

    left_scores = []
    right_scores = []

    for i, j in combinations(
        range(n_blocks),
        2
    ):

        left = half_similarity(
            blocks[i],
            blocks[j],
            0,
            2
        )

        right = half_similarity(
            blocks[i],
            blocks[j],
            2,
            4
        )

        left_scores.append(left)
        right_scores.append(right)

    left_scores = np.asarray(
        left_scores,
        dtype=np.float64
    )

    right_scores = np.asarray(
        right_scores,
        dtype=np.float64
    )

    # --------------------------------------------
    # 평균 similarity
    # --------------------------------------------

    left_mean = float(
        left_scores.mean()
    )

    right_mean = float(
        right_scores.mean()
    )

    # --------------------------------------------
    # Cov(S_L, S_R)
    #
    # population covariance를 사용한다.
    # 이 값 자체를 descriptive ML feature로 쓰는 목적.
    # --------------------------------------------

    covariance = float(
        np.mean(
            (
                left_scores
                - left_mean
            )
            *
            (
                right_scores
                - right_mean
            )
        )
    )

    # --------------------------------------------
    # correlation
    # --------------------------------------------

    left_std = left_scores.std()
    right_std = right_scores.std()

    if (
        left_std < 1e-12
        or
        right_std < 1e-12
    ):
        correlation = 0.0

    else:
        correlation = float(
            covariance
            / (
                left_std
                * right_std
            )
        )

    # --------------------------------------------
    # 동시에 비슷한 pair가
    # 독립 가정 대비 얼마나 많은가?
    #
    # similarity >= 0.5
    # = 두 자리 중 최소 한 자리 일치
    # --------------------------------------------

    left_high = (
        left_scores >= 0.5
    )

    right_high = (
        right_scores >= 0.5
    )

    p_left = left_high.mean()
    p_right = right_high.mean()

    p_joint = np.mean(
        left_high & right_high
    )

    joint_high_excess = float(
        p_joint
        - p_left * p_right
    )

    return np.array(
        [
            left_mean,
            right_mean,
            covariance,
            correlation,
            joint_high_excess,
        ],
        dtype=np.float64
    )


def get_coupling_feature_names():

    return [
        "k4_left_similarity_mean",
        "k4_right_similarity_mean",
        "k4_left_right_cov",
        "k4_left_right_corr",
        "k4_joint_high_excess",
    ]


if __name__ == "__main__":

    example = (
        "613931290139313858612912"
        "648554927425170531303239"
    )

    features = extract_coupling_features(
        example
    )

    names = (
        get_coupling_feature_names()
    )

    for name, value in zip(
        names,
        features
    ):

        print(
            f"{name:28s}: "
            f"{value:.6f}"
        )
