#!/usr/bin/env python3
"""Korean numeric substitution: N-gram, corruption regression and pairwise ranking.

pip install numpy scikit-learn requests
python experiment.py --fetch --train-docs 250 --test-docs 20 --steps 2500 --restarts 4
python experiment.py --corpus my_korean_text.txt --steps 2500
"""
import argparse
import json
import math
import random
import re
import time
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import SGDRegressor, SGDClassifier

CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'
CONSONANTS = set(CHO) | (set(JONG) - {' '})
VOWELS = set(JUNG)
SIMPLE = set(CHO) | set(JUNG) | (set(JONG) - {' '})
HANGUL_RE = re.compile(r'[가-힣]+')

# Only the first codepoint among possible jamo representations is used per symbol.
def split_syllable(ch):
    n = ord(ch) - 0xAC00
    if not (0 <= n < 11172):
        return ch
    a, rem = divmod(n, 21 * 28)
    b, c = divmod(rem, 28)
    return CHO[a] + JUNG[b] + (JONG[c] if c else '')


def normalize(txt):
    return ''.join(HANGUL_RE.findall(txt))


def jamo(s):
    return ''.join(split_syllable(c) for c in normalize(s))


def build_docs(lines, width=85):
    docs = []
    for line in lines:
        clean = normalize(line)
        for i in range(0, len(clean) - width + 1, width):
            docs.append(clean[i:i + width])
    return docs


def fetch_wikipedia(path, pages=650):
    """Fetch public encyclopedia prose. Network needed only for corpus preparation."""
    import requests
    url = 'https://ko.wikipedia.org/w/api.php'
    sess = requests.Session()
    sess.headers.update({'User-Agent': 'KoreanCipherScorerResearch/0.1 (educational experiment)'})
    chunks = []
    for _ in range((pages+19)//20):
        params = {'action':'query','format':'json','generator':'random',
                  'grnnamespace':0, 'grnlimit':20, 'prop':'extracts',
                  'explaintext':1, 'exintro':1, 'exchars':2500}
        data = sess.get(url, params=params, timeout=30)
        data.raise_for_status()
        chunks.extend(x.get('extract','') for x in data.json().get('query',{}).get('pages',{}).values())
    path.write_text('\n'.join(chunks), encoding='utf-8')
    print(f'[corpus] saved {path}, raw entries={len(chunks)}')


def mixed_units(s, rng, ratio=0.22):
    """Each Hangul syllable is either one intact syllable token or jamo tokens.
    In deployment the same tokenization policy must match the real cipher.
    """
    out = []
    for ch in s:
        if rng.random() < ratio:
            out.append(ch)
        else:
            out.extend(split_syllable(ch))
    return out


def make_key(units, rng):
    vocab = sorted(set(units))
    nums = list(range(100, 100 + len(vocab)))
    rng.shuffle(nums)
    return dict(zip(vocab, nums))


def encode(units, key):
    return [key[u] for u in units]


def swap_units(units, a, b):
    return [b if x == a else a if x == b else x for x in units]


def noise(units, rng, swaps, vocab):
    # Same global swap action as hill climbing; not per-character independent noise.
    v = list(units)
    for _ in range(swaps):
        a,b = rng.sample(vocab,2)
        v = swap_units(v,a,b)
    return v


def weighted_distance(a, b):
    """Illustrative user-defined distance, NOT a linguistic ground truth."""
    if a == b: return 0.0
    if a in VOWELS and b in VOWELS:
        close = [('ㅏ','ㅑ'),('ㅓ','ㅕ'),('ㅗ','ㅛ'),('ㅜ','ㅠ'),('ㅏ','ㅐ'),('ㅓ','ㅔ')]
        return 0.25 if (a,b) in close or (b,a) in close else 0.85
    if a in CONSONANTS and b in CONSONANTS: return 0.7
    if len(a) > 1 or len(b) > 1: return 1.0
    return 1.0


def target(original, corrupt):
    return max(0., 1. - sum(weighted_distance(a,b) for a,b in zip(original,corrupt))/len(original))


class CorruptionRegressor:
    """Sparse hashed jamo 2-6gram linear regression; cheap prediction at test time."""
    def __init__(self, seed=7, dims=2**18):
        self.vectorizer = HashingVectorizer(analyzer='char', ngram_range=(2,6),
                                            n_features=dims, alternate_sign=False, norm='l2')
        self.model = SGDRegressor(loss='squared_error', penalty='l2', alpha=1e-5,
                                  max_iter=1000, tol=1e-4, random_state=seed,
                                  learning_rate='adaptive', eta0=0.02)
    def fit(self, docs, rng, copies=65, max_swaps=12, syllable_ratio=0.22, batch_size=256):
        inputs, labels = [], []
        total = 0
        def flush():
            nonlocal total
            if not inputs:
                return
            X = self.vectorizer.transform(inputs)
            self.model.partial_fit(X, np.asarray(labels, dtype=float))
            total += len(inputs)
            inputs.clear(); labels.clear()
        for doc in docs:
            units = mixed_units(doc, rng, syllable_ratio)
            vocab = sorted(set(units))
            if len(vocab) < 3: continue
            inputs.append(''.join(units)); labels.append(1.)
            for _ in range(copies):
                swaps = rng.choice([1, 1, 2, 3, 4, 5, 7, 9, max_swaps])
                altered = noise(units, rng, swaps, vocab)
                inputs.append(''.join(altered))
                labels.append(target(units, altered))
                if len(inputs) >= batch_size:
                    flush()
        flush()
        print(f'[corruption] {total} labeled samples (streaming batches)')
    def score(self, units):
        return float(self.model.predict(self.vectorizer.transform([''.join(units)]))[0])


class CorruptionPairwiseRanker:
    """Pairwise logistic ranking on within-document global-swap corruptions.

    For a pair a,b with target(a)>target(b), train on phi(a)-phi(b) as
    positive and its negation as negative. Inference is w dot phi(candidate),
    so it never requires the true plaintext. This produces a single scalar
    objective for hill climbing; it is not a calibrated probability.
    """
    def __init__(self, seed=7, dims=2**18, min_gap=0.02):
        self.vectorizer = HashingVectorizer(analyzer='char', ngram_range=(2,6),
            n_features=dims, alternate_sign=False, norm='l2')
        self.model = SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-5,
            learning_rate='optimal', random_state=seed)
        self.min_gap = min_gap

    def fit(self, docs, rng, copies=50, max_swaps=12, syllable_ratio=0.22,
            batch_size=256, pairs_per_doc=64):
        from scipy import sparse
        buffered = []
        trained_pairs = 0
        def flush():
            nonlocal trained_pairs
            if not buffered:
                return
            # Each row is an oriented positive difference, followed by its
            # negation. Both labels prevent an all-positive degenerate fit.
            x = sparse.vstack(buffered, format='csr')
            xx = sparse.vstack((x, -x), format='csr')
            yy = np.r_[np.ones(x.shape[0], dtype=int),
                        np.zeros(x.shape[0], dtype=int)]
            self.model.partial_fit(xx, yy, classes=np.array([0, 1]))
            trained_pairs += len(buffered)
            buffered.clear()
        for doc in docs:
            units = mixed_units(doc, rng, syllable_ratio)
            vocab = sorted(set(units))
            if len(vocab) < 3:
                continue
            texts = [''.join(units)]
            labels = [1.0]
            for _ in range(copies):
                swaps = rng.choice([1, 1, 2, 3, 4, 5, 7, 9, max_swaps])
                altered = noise(units, rng, swaps, vocab)
                texts.append(''.join(altered))
                labels.append(target(units, altered))
            x = self.vectorizer.transform(texts).tocsr()
            # Include both nearby hard negatives and distant negatives.
            # All pairs come from the same original, never across documents.
            order = sorted(range(len(labels)), key=lambda i: labels[i], reverse=True)
            valid = [(i,j) for pos,i in enumerate(order)
                     for j in order[pos+1:] if labels[i]-labels[j] >= self.min_gap]
            if not valid:
                continue
            for i,j in rng.sample(valid, min(pairs_per_doc, len(valid))):
                buffered.append(x[i] - x[j])
                if len(buffered) >= batch_size:
                    flush()
        flush()
        if trained_pairs == 0:
            raise ValueError('No valid ranking pairs generated; lower --ranking-min-gap.')
        print(f'[pairwise] {trained_pairs} comparison pairs ({2*trained_pairs} signed training rows)')

    def score(self, units):
        vec = self.vectorizer.transform([''.join(units)])
        return float(self.model.decision_function(vec)[0])


class SyllableTrigram:
    """Original Hangul syllable trigram with additive smoothing.

    Since jamo has no boundaries, decode candidate with a deterministic greedy
    resyllabifier. This is intentionally a fast baseline, not a globally optimal parser.
    """
    def __init__(self, docs, k=0.05):
        self.count3=Counter();self.count2=Counter();self.vocab=set()
        self.k=k
        for d in docs:
            t='^^'+d+'$'
            self.vocab.update(d)
            self.count3.update(t[i:i+3] for i in range(len(t)-2))
            self.count2.update(t[i:i+2] for i in range(len(t)-1))
        self.V=max(len(self.vocab),100)
    def restore(self, units):
        # Greedy rules: initial consonant + vowel + optional final consonant.
        # An ambiguous consonant before a vowel is assigned to next onset.
        chars=list(''.join(units))
        out=[];i=0
        while i<len(chars):
            c=chars[i]
            if 0xAC00 <= ord(c) <= 0xD7A3:
                out.append(c);i+=1;continue
            if c in CHO and i+1<len(chars) and chars[i+1] in JUNG:
                a=CHO.index(c);b=JUNG.index(chars[i+1]);i+=2
                final=0
                if i<len(chars) and chars[i] in JONG[1:]:
                    if not (i+1<len(chars) and chars[i+1] in JUNG and chars[i] in CHO):
                        final=JONG.index(chars[i]);i+=1
                out.append(chr(0xAC00+(a*21+b)*28+final))
            else:
                out.append('□');i+=1
        return ''.join(out)
    def score(self, units):
        s='^^'+self.restore(units)+'$'
        val=0.0
        for i in range(2,len(s)):
            bg=s[i-2:i]; tri=s[i-2:i+1]
            val+=math.log((self.count3[tri]+self.k)/(self.count2[bg]+self.k*self.V))
        return val/max(1,len(s)-2)


class JamoNgram:
    """Unsupervised jamo character N-gram baseline from clean Hangul text.

    Character tokens (not encoded cipher symbols) form the sequence; when the
    cipher contains a complete syllable it is decomposed to jamo at scoring.
    """
    def __init__(self, docs, n=3, k=0.05):
        self.n = n
        self.k = k
        self.ngrams = Counter()
        self.contexts = Counter()
        self.V = len(SIMPLE) + 1
        for doc in docs:
            chars = '^' * (n-1) + jamo(doc) + '$'
            self.ngrams.update(chars[i:i+n] for i in range(len(chars)-n+1))
            self.contexts.update(chars[i:i+n-1] for i in range(len(chars)-n+1))
    def score(self, units):
        chars = '^' * (self.n-1) + ''.join(split_syllable(u) for u in units) + '$'
        total = 0.0
        for i in range(len(chars)-self.n+1):
            ng = chars[i:i+self.n]
            ctx = ng[:-1]
            total += math.log((self.ngrams[ng]+self.k) /
                              (self.contexts[ctx]+self.k*self.V))
        return total/max(1,len(chars)-self.n+1)

SCORER_NAMES = ('syllable_3gram', 'jamo_3gram', 'corruption_regression', 'corruption_pairwise')
DISTANCE_BINS = ((0.0,0.2), (0.2,0.4), (0.4,0.6), (0.6,0.8), (0.8,1.000001))
def distance_bin(ratio):
    for idx, (lo, hi) in enumerate(DISTANCE_BINS):
        if lo <= ratio < hi:
            return idx
    return len(DISTANCE_BINS)-1


def hill_climb(cipher, alphabet, scorer, start_key, steps, rng):
    """Swap two entries in cipher-number -> token permutation. Same proposal schedule.
    Allow equal score? No; strict HC. Preserve best solution.
    """
    key=list(start_key)
    def decoded(k): return [k[code-100] for code in cipher]
    best=scorer.score(decoded(key)); calls=1; trace=[best]
    for step in range(steps):
        a,b=rng.sample(range(len(key)),2)
        key[a],key[b]=key[b],key[a]
        score=scorer.score(decoded(key));calls+=1
        if score > best:
            best=score
        else:
            key[a],key[b]=key[b],key[a]
        if (step+1)%100==0: trace.append(best)
    return key,best,trace,calls


def measure_nir(cipher, actual, scorers, seed, states=20, neighbors=12):
    """Paired NIR/WDR and distance-stratified NIR with population-weighted IP.

    Stratified sampling selects up to `neighbors` swaps from EACH of better,
    worse and tie categories. This oversamples rare better swaps. IP therefore
    uses inverse sampling probabilities to estimate precision across ALL legal
    swap proposals rather than reporting biased balanced-sample precision.
    """
    rng = random.Random(seed)
    codes = sorted(actual)
    true_key = [actual[c] for c in codes]
    counts = {name: Counter() for name in scorers}
    by_bin = {name: [Counter() for _ in DISTANCE_BINS] for name in scorers}
    if len(codes) < 2:
        return {name: {'nir':None,'wrong_direction_rate':None,'improvement_precision':None,
                       'distance_nir':[], 'better_moves':0,'worse_moves':0,
                       'better_score_up':0,'worse_score_up':0} for name in scorers}
    freq = Counter(cipher)
    def errors(key):
        return sum(freq[c] for i,c in enumerate(codes) if key[i] != true_key[i])
    def decode(key):
        lookup=dict(zip(codes,key))
        return [lookup[c] for c in cipher]
    for t in range(states):
        key=true_key.copy()
        swaps=[1,max(2,len(key)//8),max(3,len(key)//3),max(4,len(key)//2),len(key),3*len(key)][t%6]
        for _ in range(swaps):
            i,j=rng.sample(range(len(key)),2)
            key[i],key[j]=key[j],key[i]
        current_error=errors(key)
        band=distance_bin(current_error/len(cipher))
        base=decode(key)
        base_scores={name:model.score(base) for name,model in scorers.items()}
        groups={'better':[],'worse':[],'tie':[]}
        for i in range(len(key)):
            for j in range(i+1,len(key)):
                key[i],key[j]=key[j],key[i]
                d=errors(key)
                key[i],key[j]=key[j],key[i]
                direction='better' if d<current_error else 'worse' if d>current_error else 'tie'
                groups[direction].append((i,j))
        for direction, group in groups.items():
            selected=rng.sample(group,min(neighbors,len(group)))
            if not selected: continue
            weight=len(group)/len(selected)
            for i,j in selected:
                key[i],key[j]=key[j],key[i]
                changed=decode(key)
                for name,model in scorers.items():
                    c=counts[name]; b=by_bin[name][band]
                    c[direction+'_moves']+=1
                    b[direction+'_moves']+=1
                    if model.score(changed)>base_scores[name]+1e-12:
                        c[direction+'_score_up']+=1
                        b[direction+'_score_up']+=1
                        c[direction+'_weighted_up']+=weight
                key[i],key[j]=key[j],key[i]
    out={}
    for name in scorers:
        c=counts[name]; good=c['better_moves']; bad=c['worse_moves']
        weighted_positive=sum(c[d+'_weighted_up'] for d in ('better','worse','tie'))
        bands=[]
        for idx,(lo,hi) in enumerate(DISTANCE_BINS):
            b=by_bin[name][idx]; count=b['better_moves']
            bands.append({'range':f'{int(lo*100)}-{min(100,int(hi*100))}%',
                          'nir':b['better_score_up']/count if count else None,
                          'better_moves':count,'better_score_up':b['better_score_up'],
                          'worse_moves':b['worse_moves'],
                          'worse_score_up':b['worse_score_up']})
        out[name]={
            'nir':c['better_score_up']/good if good else None,
            'wrong_direction_rate':c['worse_score_up']/bad if bad else None,
            'improvement_precision':c['better_weighted_up']/weighted_positive if weighted_positive else None,
            'ip_weighted_tp':c['better_weighted_up'],
            'ip_weighted_predicted_positive':weighted_positive,
            'better_moves':good,'worse_moves':bad,'tie_moves':c['tie_moves'],
            'better_score_up':c['better_score_up'],
            'worse_score_up':c['worse_score_up'],
            'tie_score_up':c['tie_score_up'],
            'distance_nir':bands,
        }
    return out


def test_one(doc, scorers, seed, steps, restarts, ratio, nir_states=20, nir_neighbors=12):
    rng=random.Random(seed)
    units=mixed_units(doc,rng,ratio)
    encrypt=make_key(units,rng)
    cipher=encode(units,encrypt)
    numeric_alphabet=sorted(set(cipher))
    actual={num:token for token,num in encrypt.items()}
    vocab=list(actual.values())
    records={}
    for name,model in scorers.items():
        best_record=None
        for restart in range(restarts):
            init=vocab[:]
            random.Random(seed+10001+restart).shuffle(init)
            proposal_rng=random.Random(seed+20001+restart)
            key,score,trace,calls=hill_climb(cipher,numeric_alphabet,model,init,steps,proposal_rng)
            original=[actual[c] for c in cipher]
            decoded=[key[c-100] for c in cipher]
            char_acc=sum(a==b for a,b in zip(original,decoded))/len(original)
            key_acc=sum(key[c-100]==actual[c] for c in numeric_alphabet)/len(numeric_alphabet)
            entry={'score':score,'token_accuracy':char_acc,'key_accuracy':key_acc,
                   'preview':''.join(decoded[:75]),'trace':trace,'calls':calls}
            if best_record is None or score>best_record['score']:
                best_record=entry
        records[name]=best_record
    nir=measure_nir(cipher,actual,scorers,seed+40001,nir_states,nir_neighbors)
    for name in records:
        records[name]['landscape']=nir[name]
    return records


def summarize(results):
    summary={}
    for name in SCORER_NAMES:
        landscapes=[r[name]['landscape'] for r in results]
        good=sum(z['better_moves'] for z in landscapes)
        bad=sum(z['worse_moves'] for z in landscapes)
        tp=sum(z.get('ip_weighted_tp',0) for z in landscapes)
        pred=sum(z.get('ip_weighted_predicted_positive',0) for z in landscapes)
        bands=[]
        for i,(lo,hi) in enumerate(DISTANCE_BINS):
            up=sum(z['distance_nir'][i]['better_score_up'] for z in landscapes)
            denom=sum(z['distance_nir'][i]['better_moves'] for z in landscapes)
            bands.append({'range':f'{int(lo*100)}-{min(100,int(hi*100))}%',
                          'nir':up/denom if denom else None,
                          'better_moves':denom,'better_score_up':up})
        summary[name]={
            'token_accuracy':float(np.mean([r[name]['token_accuracy'] for r in results])),
            'key_accuracy':float(np.mean([r[name]['key_accuracy'] for r in results])),
            'nir':sum(z['better_score_up'] for z in landscapes)/good if good else None,
            'wrong_direction_rate':sum(z['worse_score_up'] for z in landscapes)/bad if bad else None,
            'improvement_precision':tp/pred if pred else None,
            'distance_nir':bands,'better_moves':good,'worse_moves':bad,
        }
    return summary


def plot_summary(summary, path):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    names=list(SCORER_NAMES)
    labels=['Syllable 3-gram','Jamo 3-gram','Corruption regression','Pairwise ranking']
    metrics=[('token_accuracy','Token accuracy'),('key_accuracy','Key accuracy'),
             ('nir','NIR'),('wrong_direction_rate','Wrong-direction rate'),
             ('improvement_precision','Improvement precision (IP)')]
    fig,axes=plt.subplots(2,3,figsize=(18,10))
    for ax,(metric,title) in zip(axes.flat[:5],metrics):
        vals=[summary[n][metric] for n in names]
        bars=ax.bar(labels,[v if v is not None else 0 for v in vals])
        for bar,v in zip(bars,vals):
            ax.text(bar.get_x()+bar.get_width()/2,bar.get_height()+0.01,
                    'N/A' if v is None else f'{v:.3f}',ha='center',fontsize=9)
        ax.set_ylim(0,1.12);ax.set_title(title);ax.tick_params(axis='x',labelrotation=24,labelsize=8)
    ax=axes.flat[5]
    bins=[b['range'] for b in summary[names[0]]['distance_nir']]
    for n,label in zip(names,labels):
        values=[b['nir'] if b['nir'] is not None else np.nan for b in summary[n]['distance_nir']]
        ax.plot(bins,values,marker='o',label=label)
    ax.set_ylim(0,1.05);ax.set_title('Distance-stratified NIR')
    ax.set_xlabel('Decoded token error rate at current key')
    ax.legend(fontsize=8)
    for ax in axes.flat: ax.grid(axis='y',alpha=0.25)
    fig.tight_layout()
    fig.savefig(path,dpi=160)
    plt.close(fig)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--corpus',default='korean_corpus.txt')
    p.add_argument('--fetch', action='store_true', help='Fetch Korean Wikipedia article extracts')
    p.add_argument('--train-docs',type=int,default=250)
    p.add_argument('--test-docs',type=int,default=12)
    p.add_argument('--samples-per-doc',type=int,default=50)
    p.add_argument('--steps',type=int,default=1200)
    p.add_argument('--restarts',type=int,default=3)
    p.add_argument('--syllable-ratio',type=float,default=0.22)
    p.add_argument('--seed',type=int,default=42)
    p.add_argument('--plot',default='comparison.png',help='Matplotlib output PNG')
    p.add_argument('--nir-states',type=int,default=20, help='Sampled perturbed keys per test cipher')
    p.add_argument('--nir-neighbors',type=int,default=12, help='Max one-swap neighbors EACH for better/worse categories per sampled key')
    p.add_argument('--ranking-pairs-per-doc',type=int,default=64)
    p.add_argument('--ranking-min-gap',type=float,default=0.02)
    args=p.parse_args()
    path=Path(args.corpus)
    if args.fetch:
        fetch_wikipedia(path)
    if not path.exists():
        raise SystemExit(f'Missing {path}. Supply --corpus UTF-8 file or use --fetch (internet required).')
    if not 0 <= args.syllable_ratio <= 1: raise ValueError('syllable-ratio must be 0..1')
    # Split by source line/article BEFORE chunking to prevent same-source leakage.
    lines=[line for line in path.read_text(encoding='utf-8').splitlines() if len(normalize(line))>=85]
    rng=random.Random(args.seed)
    rng.shuffle(lines)
    required=args.test_docs+30
    if len(lines)<required:
        raise SystemExit(f'Too few independent corpus lines: {len(lines)}. Need >= {required} lines of 85+ Korean syllables.')
    test=build_docs(lines[:args.test_docs])[:args.test_docs]
    train=build_docs(lines[args.test_docs:])[:args.train_docs]
    if len(train)<30:
        raise SystemExit(f'Too few training chunks: {len(train)}; need at least 30.')
    print(f'[data] train={len(train)}, test={len(test)} | no text leakage')
    t=time.perf_counter()
    baseline=SyllableTrigram(train)
    jamo_baseline=JamoNgram(train)
    learned=CorruptionRegressor(args.seed)
    learned.fit(train,random.Random(args.seed+1),args.samples_per_doc,syllable_ratio=args.syllable_ratio)
    ranked=CorruptionPairwiseRanker(args.seed+10,min_gap=args.ranking_min_gap)
    ranked.fit(train,random.Random(args.seed+2),args.samples_per_doc,
               syllable_ratio=args.syllable_ratio,pairs_per_doc=args.ranking_pairs_per_doc)
    print(f'[train] {time.perf_counter()-t:.2f}s')
    scorers={'syllable_3gram':baseline,'jamo_3gram':jamo_baseline,'corruption_regression':learned,'corruption_pairwise':ranked}
    results=[]
    for i,d in enumerate(test):
        t=time.perf_counter()
        result=test_one(d,scorers,args.seed+i*13,args.steps,args.restarts,args.syllable_ratio,args.nir_states,args.nir_neighbors)
        results.append(result)
        print(f'[{i+1:02}/{len(test)}] '+ ' | '.join(f'{name}: token={v["token_accuracy"]:.3f}, key={v["key_accuracy"]:.3f}, NIR={v["landscape"]["nir"]}' for name,v in result.items())+f' {time.perf_counter()-t:.1f}s')
    summary=summarize(results)
    print('\n=== FINAL ===')
    for name,metrics in summary.items():
        print(name)
        for metric in ('token_accuracy','key_accuracy','nir','wrong_direction_rate','improvement_precision'):
            value=metrics[metric]
            print(f'  {metric}: {value:.4f}' if value is not None else f'  {metric}: N/A')
        print('  distance NIR:', ' | '.join(f"{b['range']}: {b['nir']:.3f} (n={b['better_moves']})" if b['nir'] is not None else f"{b['range']}: N/A" for b in metrics['distance_nir']))
    Path('results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    Path('summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    plot_summary(summary,args.plot)
    print(f'results.json, summary.json and {args.plot} saved')

if __name__=='__main__':
    main()
