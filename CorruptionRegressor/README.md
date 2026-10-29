python -u experiment.py \
  --corpus korean_corpus.txt \
  --train-docs 3000 \
  --test-docs 50 \
  --samples-per-doc 20 \
  --ranking-pairs-per-doc 64 \
  --ranking-min-gap 0.02 \
  --steps 500 \
  --restarts 3 \
  --plot comparison.png


  # 한국어 숫자 치환 암호: Scorer 비교 실험

## 실행

Python 3.10+ 사용.

```bash
pip install -r requirements.txt
python experiment.py --fetch --train-docs 250 --test-docs 12 --samples-per-doc 50 --steps 1200 --restarts 3
```

처음 `--fetch`는 한국어 위키백과 API에서 공개 문서의 한국어 텍스트를 불러와 `korean_corpus.txt`에 저장합니다. 네트워크가 막히거나 API 접근이 실패하면, 자체 UTF-8 코퍼스(줄마다 서로 다른 85자 이상 한국어 원문)를 제공하세요:

```bash
python experiment.py --corpus korean_corpus.txt --train-docs 250 --test-docs 12 --steps 1200 --restarts 3
```

동작 확인용 소형 데이터(매우 중복되고 작으므로 성능 비교에 쓰지 말 것):

```bash
python experiment.py --corpus demo_corpus.txt --train-docs 35 --test-docs 2 --samples-per-doc 5 --steps 15 --restarts 1
```

## 암호 정의

한글 각 음절은 난수에 따라 (1) 원형 완성형 한글 음절 `학`, 혹은 (2) `ㅎ`, `ㅏ`, `ㄱ` 자모 3토큰으로 표현합니다. 공백과 음절 경계는 암호에서 제거됩니다. 각 서로 다른 토큰은 **유일한 정수 코드**를 가집니다. 예: `ㅎ -> 107`, `ㅏ -> 121`, `학 -> 134`. 동일한 토큰은 항상 같은 숫자입니다. 숫자↔토큰 매핑은 일대일이며 Hill Climbing의 이웃은 두 코드에 지정한 복호화 토큰을 서로 교환하는 swap입니다.

`--syllable-ratio 0.22`가 완성형 음절 토큰의 비율입니다. 실제 암호가 전부 자모라면 `--syllable-ratio 0`으로 설정하십시오. 완성형 한글 토큰 비중을 높이면 키 알파벳이 늘어 HC가 어려워집니다.

## Scorer

1. `syllable_3gram`: 원본 완성형 한글 코퍼스에서 `P(syllable_t | previous two syllables)`를 additive smoothing으로 추정. 후보 숫자열을 복호화한 자모열에 **greedy 음절 복원** 적용 후 평균 로그 확률 계산. 모호한 경계는 전역 최적화하지 않아 기본 모델 한계가 존재합니다.
2. `corruption_regression`: 훈련 문장에 실제 HC와 같은 **전역 token swap corruption**을 시행해 가짜 복호화 문자열 생성. 원문과 오염 결과의 가중 문자 거리를 `1-distance`로 만든 레이블로 훈련. HashingVectorizer의 char 2–6 gram과 SGD 선형 회귀를 사용; 점수 계산에 원문/정답 정보 사용하지 않음. ㅏ↔ㅑ 거리는 0.25, 먼 모음은 0.85 (예시 하이퍼파라미터).

## 공정 비교

- 각 테스트 암호문에 같은 키 초기화 시드 및 같은 HC swap 제안 순서를 사용합니다.
- 각 scorer의 스코어로 greedy HC를 수행하여 최종 점수가 가장 높은 restart를 선택합니다.
- 각 scorer마다 테스트 정답 기준 **token accuracy**와 **key accuracy**를 출력합니다.
- 원본 문장/치환 키는 평가용으로만 사용합니다.
- 동일 페이지/라인에서 생성된 텍스트 조각은 train/test에 함께 들어가지 않도록 분리합니다. 위키백과 간 문서 중복 여부까지는 자동 제거하지 않습니다.
- `results.json`에 scorer별 결과와 진행 곡선(trace)을 저장합니다.

## 제약 / 다음 개선

- 이 코드는 **실행 가능한 실험 프로토타입**입니다. 정답 복구 성공은 보장하지 않습니다. alphabet 수십~수백 개에 대한 랜덤 초기화 + greedy HC는 지역 최적해에 갇힐 수 있습니다. SA, beam, 주파수 기반 초기화 및 충분한 restart는 공정성 유지하면서 별도로 추가 가능.
- 기본 scorer의 음절 경계 복원은 greedy 근사입니다. 실사용 코드의 정확한 복원기를 대신 연결하면 현재 3-gram baseline을 더 공정하게 비교할 수 있습니다.
- corruption 모델에 사용하는 자모 위치·모음 간 가중 거리 함수는 연구자가 정의한 가설이며 정답 자체가 아닙니다. 손실이 작다고 실제 복호화가 좋아지는 것은 아니므로 **실제 key/token accuracy로 평가**해야 합니다.
- 실험의 글자별 오염이 아니라 **전역 키 swap**을 사용합니다. 정답 오류 시각화는 해당 오류 위치 전체를 변경합니다.
- Wikipedia 텍스트의 라이선스/저작자표시는 재배포·게시 전 별도 확인하고 준수하세요.

## NIR / Landscape 평가 (추가됨)

```bash
python experiment.py --corpus korean_corpus.txt --train-docs 250 --test-docs 12 \
  --steps 1200 --restarts 3 --nir-states 20 --nir-neighbors 12
```

NIR (Neighbor Improvement Rate)은 **정답 복호화 토큰과의 오류 개수가 줄어드는 단일 키 swap** 중 Scorer 점수가 증가하는 비율입니다. Wrong Direction Rate는 반대로 오류 개수가 증가하는 swap 중 점수가 증가한 비율입니다. 둘 다 같은 테스트 암호, 같은 표본 키, 같은 swap을 사용하여 비교합니다. HC 탐색 결과와는 독립적으로 테스트 키 주변을 샘플링하므로, HC의 실제 진행에 조건화하지 않은 별도 지표입니다.

- `--nir-states`: 정답 키에 1/2/4/8/12/알파벳 절반 횟수의 swap을 적용한 키들을 섞어 샘플링하는 횟수 (테스트 문장마다)
- `--nir-neighbors`: 샘플 키마다 정답에 가까워지는 swap과 멀어지는 swap을 **각각** 최대 몇 개 측정할지
- 모든 swap 후보의 복호화 토큰 오류 수를 계산해 개선/악화 그룹으로 분리한 후 각 그룹에서 샘플링합니다. 따라서 무작위 이웃에 개선 이동이 거의 없어 NIR 분모가 0이 되는 문제를 줄입니다.
- 복호화 토큰의 오류 개수를 사용하므로 자모 간 가중 거리로 정해진 학습 Label과는 **평가 기준이 다릅니다**. NIR은 가까운 이동에 점수가 반응하는지를 평가하며 장거리 의미 일관성을 보증하지는 않습니다.
- 최종 출력에 NIR, Wrong Direction Rate, 분자·분모를 함께 표시하고 `results.json`의 `landscape`에 저장합니다. `nir`이 `null`이면 해당 테스트에 개선 이동 샘플이 없었다는 의미입니다.
- 많은 고유 완성형 음절을 포함하면 모든 가능한 swap 조합 열거에 시간이 걸릴 수 있습니다. 저사양에서는 `--nir-states`와 `--nir-neighbors`를 줄이세요.


## 업데이트: 3개 Scorer + Landscape Metrics + Matplotlib

새로운 `jamo_3gram`은 정상 한국어를 자모로 분해한 뒤 빈도 기반 자모 trigram을 학습합니다.
기존 `syllable_3gram`과 corruption-trained `corruption_regression`을 포함한 **세 가지 모델**에
동일한 초기키, 동일한 swap 제안 순서를 적용합니다.

```bash
pip install -r requirements.txt
python -u experiment.py --corpus korean_corpus.txt --train-docs 3000 --test-docs 50 \
  --samples-per-doc 20 --steps 100 --restarts 3 --nir-states 30 --nir-neighbors 12 \
  --plot comparison.png
```

출력: `results.json`(문서별 상세), `summary.json`(모델별 집계),
`comparison.png`(Matplotlib 6패널 비교). 그림에는 token/key accuracy, NIR,
Wrong-direction rate, improvement precision(IP), distance-stratified NIR이 들어갑니다.

- **NIR**: 정답 토큰 오류 수가 감소하는 swap 중 scorer 점수가 상승한 비율.
- **Wrong-direction rate**: 오류 수가 증가하는 swap 중 점수가 상승한 비율.
- **IP**: scorer 점수가 상승하는 swap 중 실제 오류가 감소하는 비율.
  NIR 표본은 better/worse/tie 방향별로 균등한 최대 개수를 뽑기 때문에,
  IP는 각 상태에서 전체 swap 모집단의 방향별 개수를 이용한 역표본 가중 추정치입니다.
  동률 오류 이동도 IP의 거짓 양성에 포함됩니다. 따라서 단순 샘플 내 정밀도와 다릅니다.
- **Distance-stratified NIR**: 현재 키의 decoded token error rate를
  `[0,20),[20,40),[40,60),[60,80),[80,100]` %로 구간화한 NIR.
  구간 내 improvement swap이 없으면 N/A로 표기합니다.

Corruption 회귀 모델은 메모리 폭증 방지를 위해 256 샘플씩 `partial_fit()` 합니다.
이 변경은 이전 배치 학습과 최적화 경로가 다릅니다.
데모 코퍼스에서 코드 동작 여부만 확인했으며 데이터가 중복되므로 수치상 성능 비교는 불가합니다.

## Pairwise ranking scorer (fourth baseline)

`corruption_pairwise` learns a **relative ranking** from pairs of global-swap
corruptions made from the *same* clean training document. For a pair with a
label gap of at least `--ranking-min-gap`, a sparse feature difference is
classified as positive, and its negation as negative. The labels are obtained
only while training, from the weighted distance to the known original.
During decoding `score(units)` requires no original; it returns a linear
ranking score (not a 0–1 calibrated probability).

Example:

```bash
python -u experiment.py \
  --corpus korean_corpus.txt \
  --train-docs 3000 --test-docs 50 \
  --samples-per-doc 20 \
  --ranking-pairs-per-doc 64 --ranking-min-gap 0.02 \
  --steps 500 --restarts 3 \
  --plot comparison.png
```

The existing NIR, wrong-direction rate, distance-stratified NIR, IP, HC token
accuracy, and key accuracy are all computed for four scorers using common
candidate-key states and swap proposals. `summary.json` and `results.json`
include the new `corruption_pairwise` key. The training approach uses online
`SGDClassifier.partial_fit` with sparse batches, so it does not hold all
ranking pairs in memory at once. Larger `--ranking-pairs-per-doc` increases
training cost; it does not change the number of HC steps.

**Caveat:** the demo corpus is tiny and the smoke test only validates that the
pipeline runs; it does not establish comparative model quality. The learned
score is not guaranteed to have better NIR or decoding accuracy than MSE
regression. Use untouched held-out test texts for comparison.
