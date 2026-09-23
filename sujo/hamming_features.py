from itertools import combinations

import numpy as np


BLOCK_SIZES = (2, 3, 4, 5)


def clean_ciphertext(ciphertext: str) -> str:
    """
    공백 / 줄바꿈 제거 후 숫자 문자열 검증
    """
    ciphertext = "".join(str(ciphertext).split())

    if not ciphertext:
        raise ValueError("ciphertext가 비어 있습니다.")

    if not ciphertext.isdigit():
        raise ValueError(
            f"ciphertext에는 숫자만 들어갈 수 있습니다: {ciphertext}"
        )

    return ciphertext


def split_blocks(ciphertext: str, block_size: int):
    """
    ciphertext를 block_size 단위로 자른다.

    뒤에 남는 불완전한 block은 버린다.

    예:
        "12345678", k=3
        -> ["123", "456"]
    """
    n_blocks = len(ciphertext) // block_size

    return [
        ciphertext[i * block_size:(i + 1) * block_size]
        for i in range(n_blocks)
    ]


def hamming_distance(a: str, b: str) -> int:
    """
    같은 길이 문자열 두 개의 Hamming distance
    """
    if len(a) != len(b):
        raise ValueError("Hamming distance는 같은 길이끼리만 계산할 수 있습니다.")

    return sum(x != y for x, y in zip(a, b))


def hamming_distribution(ciphertext: str, block_size: int):
    """
    모든 block pair의 Hamming distance를 계산하고
    distance별 비율을 반환한다.

    k=3이라면:
        [
            P(distance=0),
            P(distance=1),
            P(distance=2),
            P(distance=3)
        ]
    """

    blocks = split_blocks(ciphertext, block_size)

    # pair를 만들 수 없는 경우
    if len(blocks) < 2:
        return np.zeros(block_size + 1, dtype=np.float64)

    counts = np.zeros(block_size + 1, dtype=np.float64)

    total_pairs = 0

    for a, b in combinations(blocks, 2):
        distance = hamming_distance(a, b)

        counts[distance] += 1
        total_pairs += 1

    return counts / total_pairs


def extract_features(ciphertext: str):
    """
    최종 18-dimensional feature vector 생성.

    k=2 -> distance 0~2 : 3 features
    k=3 -> distance 0~3 : 4 features
    k=4 -> distance 0~4 : 5 features
    k=5 -> distance 0~5 : 6 features

    총 18 features.
    """

    ciphertext = clean_ciphertext(ciphertext)

    features = []

    for block_size in BLOCK_SIZES:
        distribution = hamming_distribution(
            ciphertext,
            block_size
        )

        features.extend(distribution)

    return np.asarray(
        features,
        dtype=np.float64
    )


def get_feature_names():
    """
    Random Forest feature importance 확인용 이름
    """

    names = []

    for block_size in BLOCK_SIZES:
        for distance in range(block_size + 1):
            names.append(
                f"k{block_size}_hamming_{distance}"
            )

    return names


if __name__ == "__main__":
    # 단독 실행 테스트
    example = "041204150522041305240418"

    features = extract_features(example)

    print("Feature count:", len(features))

    for name, value in zip(
        get_feature_names(),
        features
    ):
        print(f"{name:20s}: {value:.6f}")
