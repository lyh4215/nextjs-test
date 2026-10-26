import numpy as np
import matplotlib.pyplot as plt

from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import (
    silhouette_score,
    adjusted_rand_score,
)


DEFAULT_WEIGHTS = {
    "first": 1.0,
    "second": 1.0,
    "joint": 1.0,
    "interaction": 0.3,
    "entropy": 0.2,
}


def parse_cipher(cipher: list[str]) -> np.ndarray:
    """
    list[str] -> (N, 3) digit array

    Examples:
        ["123", "045"] -> [[1, 2, 3], [0, 4, 5]]
    """
    if not cipher:
        raise ValueError("cipher가 비어 있습니다.")

    if any(
        not isinstance(s, str)
        or len(s) != 3
        or any(ch not in "0123456789" for ch in s)
        for s in cipher
    ):
        raise ValueError(
            "각 원소는 '123', '045' 형태의 3자리 문자열이어야 합니다."
        )

    return np.array(
        [[int(ch) for ch in s] for s in cipher],
        dtype=int,
    )


def extract_features(
    digits: np.ndarray,
    position: str,
    weights: dict[str, float] | None = None,
):
    """
    position='a': A별 B,C 분포
    position='b': B별 A,C 분포
    position='c': C별 A,B 분포
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    positions = {"a": 0, "b": 1, "c": 2}

    if position not in positions:
        raise ValueError("position must be a, b, or c")

    if any(v < 0 for v in weights.values()):
        raise ValueError("Weights must be non-negative")

    target_idx = positions[position]
    other_idx = [i for i in range(3) if i != target_idx]

    target = digits[:, target_idx]
    x = digits[:, other_idx[0]]
    y = digits[:, other_idx[1]]

    values = np.unique(target)

    features = []
    counts = {}

    def entropy(p):
        p = p[p > 0]
        return -np.sum(p * np.log(p))

    for value in values:
        mask = target == value
        n = int(mask.sum())

        counts[int(value)] = n

        # Marginal distributions
        px = np.bincount(x[mask], minlength=10) / n
        py = np.bincount(y[mask], minlength=10) / n

        # Joint distribution
        joint_idx = x[mask] * 10 + y[mask]

        pxy = np.bincount(
            joint_idx, minlength=100
        ).reshape(10, 10) / n

        # Dependency between the two digits
        interaction = pxy - np.outer(px, py)

        # Normalized entropy
        ent = np.array([
            entropy(px) / np.log(10),
            entropy(py) / np.log(10),
            entropy(pxy.ravel()) / np.log(100),
        ])

        blocks = {
            "first": np.sqrt(px),
            "second": np.sqrt(py),
            "joint": np.sqrt(pxy.ravel()),
            "interaction": interaction.ravel(),
            "entropy": ent,
        }

        feature = np.concatenate([
            np.sqrt(weights.get(name, 0.0)) * block
            for name, block in blocks.items()
        ])

        features.append(feature)

    return values, np.vstack(features), counts


def fit_clusters(X: np.ndarray, random_state=42):
    model = KMeans(
        n_clusters=2,
        n_init=30,
        random_state=random_state,
    )
    labels = model.fit_predict(X)
    return model, labels


def bootstrap_stability(
    digits: np.ndarray,
    position: str,
    original_values: np.ndarray,
    original_labels: np.ndarray,
    weights: dict[str, float] | None = None,
    n_bootstrap: int = 200,
    random_state: int = 42,
):
    """
    Stratified bootstrap:
    - Preserve each target digit's sample size
    - Resample its observations with replacement
    - Recluster and compare to original labels using ARI
    """
    if n_bootstrap < 1:
        raise ValueError("n_bootstrap must be >= 1")

    rng = np.random.default_rng(random_state)

    target_idx = {"a": 0, "b": 1, "c": 2}[position]
    target = digits[:, target_idx]

    groups = [
        np.flatnonzero(target == v)
        for v in original_values
    ]

    scores = []

    for _ in range(n_bootstrap):
        sampled_indices = np.concatenate([
            rng.choice(idx, size=len(idx), replace=True)
            for idx in groups
        ])

        sampled_digits = digits[sampled_indices]

        values, X_boot, _ = extract_features(
            sampled_digits,
            position,
            weights,
        )

        _, boot_labels = fit_clusters(X_boot)

        # Values are preserved by stratified sampling
        assert np.array_equal(values, original_values)

        # ARI is invariant to cluster-label permutations
        ari = adjusted_rand_score(
            original_labels,
            boot_labels,
        )

        scores.append(ari)

    scores = np.asarray(scores)

    return {
        "mean": float(scores.mean()),
        "std": float(scores.std()),
        "p05": float(np.percentile(scores, 5)),
        "p95": float(np.percentile(scores, 95)),
        "scores": scores,
    }


def run_clustering(
    digits: np.ndarray,
    position: str,
    weights: dict[str, float] | None = None,
    n_bootstrap: int = 200,
):
    values, X, counts = extract_features(
        digits, position, weights
    )

    if len(values) < 3:
        raise ValueError(
            f"Position {position}: "
            "Silhouette 평가를 위해 서로 다른 값이 3개 이상 필요합니다."
        )

    model, labels = fit_clusters(X)

    silhouette = silhouette_score(X, labels)

    stability = bootstrap_stability(
        digits=digits,
        position=position,
        original_values=values,
        original_labels=labels,
        weights=weights,
        n_bootstrap=n_bootstrap,
    )

    # PCA is only for visualization
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X)
    centers_2d = pca.transform(model.cluster_centers_)

    groups = {
        cluster: sorted(
            int(v) for v, label in zip(values, labels)
            if label == cluster
        )
        for cluster in range(2)
    }

    return {
        "position": position,
        "values": values,
        "features": X,
        "labels": labels,
        "counts": counts,
        "groups": groups,
        "silhouette": silhouette,
        "stability": stability,
        "pca": pca,
        "X_2d": X_2d,
        "centers_2d": centers_2d,
        "model": model,
    }


def plot_comparison(results):
    fig, axes = plt.subplots(
        1, len(results),
        figsize=(7 * len(results), 6),
        squeeze=False,
    )
    axes = axes.ravel()

    colors = ["tab:blue", "tab:orange"]

    for ax, (position, result) in zip(
        axes, results.items()
    ):
        X_2d = result["X_2d"]
        labels = result["labels"]
        values = result["values"]
        counts = result["counts"]

        for cluster in range(2):
            mask = labels == cluster

            ax.scatter(
                X_2d[mask, 0],
                X_2d[mask, 1],
                color=colors[cluster],
                s=180,
                alpha=0.85,
                edgecolors="black",
                label=f"Cluster {cluster}",
            )

        for i, value in enumerate(values):
            ax.annotate(
                f"{value}",
                X_2d[i],
                xytext=(7, 7),
                textcoords="offset points",
                fontsize=13,
                fontweight="bold",
            )

        for cluster in range(2):
            ax.scatter(
                *result["centers_2d"][cluster],
                marker="X",
                s=260,
                color=colors[cluster],
                edgecolors="black",
                linewidths=1.5,
            )

        pca = result["pca"]
        stability = result["stability"]

        ax.set_xlabel(
            f"PC1 ({pca.explained_variance_ratio_[0]:.1%})"
        )
        ax.set_ylabel(
            f"PC2 ({pca.explained_variance_ratio_[1]:.1%})"
        )

        ax.set_title(
            f"Position {position.upper()}\n"
            f"Silhouette: {result['silhouette']:.3f}  |  "
            f"Stability ARI: {stability['mean']:.3f}"
        )

        ax.grid(alpha=0.25)
        ax.legend()

    plt.tight_layout()
    plt.show()


def compare_positions(
    cipher: list[str],
    weights: dict[str, float] | None = None,
    n_bootstrap: int = 200,
    positions: tuple[str, ...] = ("a", "b"),
):
    digits = parse_cipher(cipher)

    results = {
        position: run_clustering(
            digits=digits,
            position=position,
            weights=weights,
            n_bootstrap=n_bootstrap,
        )
        for position in positions
    }

    plot_comparison(results)

    print("\n=== Clustering Comparison ===")

    for position, result in results.items():
        stability = result["stability"]

        print(f"\n[{position.upper()} position]")
        print(f"Silhouette      : {result['silhouette']:.4f}")
        print(
            f"Bootstrap ARI   : "
            f"{stability['mean']:.4f} ± {stability['std']:.4f}"
        )
        print(
            f"ARI 5-95% range : "
            f"[{stability['p05']:.4f}, {stability['p95']:.4f}]"
        )

        for cluster, members in result["groups"].items():
            print(f"Cluster {cluster}: {members}")

        print("Counts:", result["counts"])

    silhouette_winner = max(
        results,
        key=lambda p: results[p]["silhouette"],
    )

    stability_winner = max(
        results,
        key=lambda p: results[p]["stability"]["mean"],
    )

    print("\n=== Comparison Summary ===")
    print(f"Best separation : {silhouette_winner.upper()}")
    print(f"Best stability  : {stability_winner.upper()}")

    return results


cipher: list[str] = [
    "315", "631", "631", "135", "136", "631", "732", "136",
    # 실제 암호문 데이터 추가
]

results = compare_positions(
    cipher,
    n_bootstrap=500,
)
