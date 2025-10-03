# src/utils.py
import time, json, os
from datetime import datetime

def timeit(func, *args, **kwargs):
    t0 = time.perf_counter()
    res = func(*args, **kwargs)
    t1 = time.perf_counter()
    return res, t1 - t0

def save_result(result_dict, results_dir="results"):
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    fname = f"result_{result_dict['problem']}_{result_dict['method']}_{ts}.json"
    path = os.path.join(results_dir, fname)
    with open(path, "w") as f:
        json.dump(result_dict, f, indent=2)
    return fname
