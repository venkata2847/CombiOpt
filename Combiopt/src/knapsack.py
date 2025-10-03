# src/algorithms/knapsack.py
def greedy_knapsack(items, capacity=50):
    # items: list of dicts {id, weight, value}
    sorted_items = sorted(items, key=lambda x: x['value']/x['weight'], reverse=True)
    total_v = 0
    total_w = 0
    selected = []
    for it in sorted_items:
        if total_w + it['weight'] <= capacity:
            selected.append(it['id'])
            total_w += it['weight']
            total_v += it['value']
    return {"selected": selected, "value": total_v, "weight": total_w, "quality": None}

def dp_knapsack(items, capacity=50):
    n = len(items)
    # dp table
    dp = [[0]*(capacity+1) for _ in range(n+1)]
    for i in range(1, n+1):
        w = items[i-1]['weight']; v = items[i-1]['value']
        for c in range(capacity+1):
            dp[i][c] = dp[i-1][c]
            if c >= w:
                dp[i][c] = max(dp[i][c], dp[i-1][c-w] + v)
    # reconstruct
    c = capacity
    selected = []
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i-1][c]:
            selected.append(items[i-1]['id'])
            c -= items[i-1]['weight']
    return {"selected": selected[::-1], "value": dp[n][capacity], "weight": capacity-c, "quality": 1.0}
