# app.py
from flask import Flask, request, jsonify, render_template, send_file
import time
import json
import os
import csv

from src import tsp, knapsack
from src.utils import save_result

app = Flask(__name__, static_folder="static", template_folder="templates")

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
RESULTS_DIR = os.path.join(BASE_DIR, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


# Algorithm mapping
ALGO_MAP = {
    "tsp": {
        "greedy": tsp.nearest_neighbor,
        "two_opt": tsp.two_opt_optional
    },
    "knapsack": {
        "greedy": knapsack.greedy_knapsack,
        "dp": knapsack.dp_knapsack
    }
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/run", methods=["POST"])
def run_algo():
    try:
        payload = request.json
        problem = payload.get("problem")
        method = payload.get("method")
        dataset = payload.get("dataset")

        # Validate problem and method
        if problem not in ALGO_MAP or method not in ALGO_MAP[problem]:
            return jsonify({"error": "Unknown problem or method"}), 400

        
        # Load dataset
        if problem == "tsp":
            path = os.path.join(DATA_DIR, f"{dataset}.csv")  # Directly in data/
            if not os.path.exists(path):
                return jsonify({"error": f"TSP dataset '{dataset}' not found"}), 404

            coords = []
            with open(path, newline='') as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) < 2:
                        continue
                    coords.append((float(row[0]), float(row[1])))

            func = ALGO_MAP["tsp"][method]
            start = time.perf_counter()
            solution = func(coords)  # Expected dict: { 'route': [...], 'length': ... }
            elapsed = time.perf_counter() - start

        elif problem == "knapsack":
            path = os.path.join(DATA_DIR, f"{dataset}.json")  # Directly in data/
            if not os.path.exists(path):
                return jsonify({"error": f"Knapsack dataset '{dataset}' not found"}), 404

            with open(path) as f:
                items = json.load(f)

            # Optional: check for capacity parameter
            capacity = payload.get("capacity", None)
            func = ALGO_MAP["knapsack"][method]

            start = time.perf_counter()
            if capacity is not None:
                solution = func(items, capacity)
            else:
                solution = func(items)
            elapsed = time.perf_counter() - start

        
        # Validate solution
        if not isinstance(solution, dict):
            return jsonify({"error": "Algorithm did not return a valid solution"}), 500

        result = {
            "problem": problem,
            "method": method,
            "dataset": dataset,
            "runtime_sec": round(elapsed, 6),
            "solution": solution,
            "quality": solution.get("quality", None)
        }

        # Save result
        filename = save_result(result, RESULTS_DIR)
        result["result_file"] = filename

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Serve TSP CSV files for frontend visualization
@app.route("/data/tsp/<dataset>.csv")
def get_tsp_csv(dataset):
    path = os.path.join(DATA_DIR, f"{dataset}.csv")  # Directly in data/
    if not os.path.exists(path):
        return "File not found", 404
    return send_file(path)


# Serve Knapsack JSON files if needed
@app.route("/data/knapsack/<dataset>.json")
def get_knapsack_json(dataset):
    path = os.path.join(DATA_DIR, f"{dataset}.json")  # Directly in data/
    if not os.path.exists(path):
        return "File not found", 404
    return send_file(path)


# Download results
@app.route("/download/<path:fname>")
def download(fname):
    path = os.path.join(RESULTS_DIR, fname)
    if not os.path.exists(path):
        return "File not found", 404
    return send_file(path, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)
