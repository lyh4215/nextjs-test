# feature_extractor.py

import numpy as np

from hamming_features import (
    extract_hamming_features,
    get_hamming_feature_names,
)

from cramer_positional_features import (
    extract_cramer_features,
    get_cramer_feature_names,
)

from positional_coupling_features import (
    extract_coupling_features,
    get_coupling_feature_names,
)


def extract_features(
    ciphertext: str
):

    hamming = (
        extract_hamming_features(
            ciphertext
        )
    )

    cramer = (
        extract_cramer_features(
            ciphertext
        )
    )

    coupling = (
        extract_coupling_features(
            ciphertext
        )
    )

    return np.concatenate([
        hamming,
        cramer,
        coupling,
    ])


def get_feature_names():

    return (
        get_hamming_feature_names()
        +
        get_cramer_feature_names()
        +
        get_coupling_feature_names()
    )


if __name__ == "__main__":

    example = (
        "613931290139313858612912"
        "648554927425170531303239"
    )

    features = extract_features(
        example
    )

    names = get_feature_names()

    print(
        "Feature count:",
        len(features)
    )

    for name, value in zip(
        names,
        features
    ):

        print(
            f"{name:28s}: "
            f"{value:.6f}"
        )
