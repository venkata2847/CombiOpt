# src/algorithms/tsp.py
import math, random, itertools

def dist(a, b):
    return math.hypot(a[0]-b[0], a[1]-b[1])

def route_length(coords, route):
    total = 0.0
    for i in range(len(route)):
        a = coords[route[i]]
        b = coords[route[(i+1)%len(route)]]
        total += dist(a, b)
    return total

def nearest_neighbor(coords, start=0):
    n = len(coords)
    if n == 0:
        return {"route": [], "length": 0.0}
    unvisited = set(range(n))
    route = [start]
    unvisited.remove(start)
    while unvisited:
        last = route[-1]
        nxt = min(unvisited, key=lambda j: dist(coords[last], coords[j]))
        route.append(nxt)
        unvisited.remove(nxt)
    length = route_length(coords, route)
    # baseline: compare to some random shuffles to compute relative quality
    best_rand = min(route_length(coords, list(r)) for r in (random.sample(range(n), n) for _ in range(min(50, max(1, n)))))
    quality = round(best_rand / length, 4)  # >1 means better than random baseline
    return {"route": route, "length": length, "quality": quality}

# simple 2-opt improvement (optional)
def two_opt_optional(coords):
    res = nearest_neighbor(coords)
    route = res["route"]
    n = len(route)
    improved = True
    while improved:
        improved = False
        for i in range(1, n-2):
            for j in range(i+1, n):
                a, b = route[i-1], route[i]
                c, d = route[j-1], route[j % n]
                # compute delta
                old = dist(coords[a], coords[b]) + dist(coords[c], coords[d])
                new = dist(coords[a], coords[c]) + dist(coords[b], coords[d])
                if new < old:
                    route[i:j] = reversed(route[i:j])
                    improved = True
    length = route_length(coords, route)
    return {"route": route, "length": length, "quality": None}
