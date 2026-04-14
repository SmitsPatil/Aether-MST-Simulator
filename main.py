from flask import Flask, send_from_directory, request, jsonify
import os

import random

app = Flask(__name__)

# Serve from the current folder
CWD = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return send_from_directory(CWD, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(CWD, path)

@app.route('/api/solve', methods=['POST'])
def solve_mst():
    data = request.json
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    alg = data.get('algorithm', 'Kruskal')
    
    kruskal_sort = data.get('kruskalSort', 'asc')
    prim_start = data.get('primStart', '').strip().upper() # handle case safely depending on input
    
    if alg == 'Kruskal':
        steps = compile_kruskal(nodes, edges, kruskal_sort)
    else:
        steps = compile_prim(nodes, edges, prim_start)
        
    return jsonify({"steps": steps})

@app.route('/api/benchmarks', methods=['POST'])
def run_benchmarks():
    data = request.json
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    kruskal_sort = data.get('kruskalSort', 'asc')
    prim_start = data.get('primStart', '').strip()
    
    # Run both silently
    k_steps = compile_kruskal(nodes, edges, kruskal_sort)
    p_steps = compile_prim(nodes, edges, prim_start)
    
    return jsonify({
        "kruskal": k_steps,
        "prim": p_steps
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_graph():
    import math, time
    data = request.json
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    n = len(nodes)
    e = len(edges)

    warnings = []

    # Density: actual edges / max possible edges for undirected graph
    max_edges = n * (n - 1) / 2 if n > 1 else 1
    density = round((e / max_edges) * 100, 1)

    # Connectivity check via BFS
    adj = {node: [] for node in nodes}
    for edge in edges:
        adj[edge['u']].append(edge['v'])
        adj[edge['v']].append(edge['u'])
    
    visited = set()
    if nodes:
        queue = [nodes[0]]
        while queue:
            curr = queue.pop(0)
            if curr not in visited:
                visited.add(curr)
                queue.extend(adj.get(curr, []))
    
    is_connected = len(visited) == n

    # Negative weight detection
    has_negative = any(e['w'] < 0 for e in edges)
    if has_negative:
        warnings.append("⚠️ Negative weights detected! MST results may be unreliable.")
    if not is_connected:
        warnings.append("⚠️ Graph is disconnected! MST cannot span all nodes.")
    if density < 20:
        warnings.append("ℹ️ Sparse graph detected. Kruskal's may outperform Prim's.")
    elif density > 70:
        warnings.append("ℹ️ Dense graph detected. Prim's may outperform Kruskal's.")

    # Timing Kruskal vs Prim
    kruskal_sort = data.get('kruskalSort', 'asc')
    prim_start = data.get('primStart', '').strip()

    t0 = time.perf_counter()
    compile_kruskal(nodes, edges, kruskal_sort)
    k_time_us = round((time.perf_counter() - t0) * 1_000_000, 2)

    t0 = time.perf_counter()
    compile_prim(nodes, edges, prim_start)
    p_time_us = round((time.perf_counter() - t0) * 1_000_000, 2)

    return jsonify({
        "nodes": n,
        "edges": e,
        "density": density,
        "connected": is_connected,
        "hasNegative": has_negative,
        "warnings": warnings,
        "kruskalTimeUs": k_time_us,
        "primTimeUs": p_time_us
    })

def compile_kruskal(nodes, edges, sort_order):
    steps = []

    # Sort purely by weight, keeping stable sort logic
    is_desc = (sort_order == 'desc')
    edges_sorted = sorted(edges, key=lambda x: x['w'], reverse=is_desc)
    
    parent = {n: n for n in nodes}
    rank = {n: 0 for n in nodes}
    
    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]
        
    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if rank[root_i] < rank[root_j]:
            parent[root_i] = root_j
        elif rank[root_i] > rank[root_j]:
            parent[root_j] = root_i
        else:
            parent[root_j] = root_i
            rank[root_i] += 1
            
    current_cost = 0
    for e in edges_sorted:
        root_u = find(e['u'])
        root_v = find(e['v'])
        
        if root_u != root_v:
            action = 'SUCCESS'
            current_cost += e['w']
            union(root_u, root_v)
        else:
            action = 'CYCLE'
            
        steps.append({
            'edgeLabel': f"{e['u']}-{e['v']}",
            'edgeIds': [e['id']],
            'weight': e['w'],
            'action': action,
            'cost': current_cost
        })
    return steps


def compile_prim(nodes, edges, start_node):
    steps = []
    if not nodes:
        return steps
        
    visited = set()
    current_cost = 0
    
    # Check parameter or random selection
    act_node = start_node if start_node in nodes else random.choice(nodes)
    visited.add(act_node)
    
    while len(visited) < len(nodes):
        possible_edges = []
        for e in edges:
            u_in = e['u'] in visited
            v_in = e['v'] in visited
            # XOR: exactly one is visited
            if (u_in and not v_in) or (not u_in and v_in):
                possible_edges.append(e)
                
        if not possible_edges:
            break
            
        # Tie-breaker logic for Python: sort by weight, then by stable ID to mimic deterministic results
        possible_edges.sort(key=lambda x: (x['w'], x['id']))
        min_edge = possible_edges[0]
        
        current_cost += min_edge['w']
        visited.add(min_edge['u'])
        visited.add(min_edge['v'])
        
        steps.append({
            'edgeLabel': f"{min_edge['u']}-{min_edge['v']}",
            'edgeIds': [min_edge['id']],
            'weight': min_edge['w'],
            'action': 'SUCCESS',
            'cost': current_cost
        })
        
    return steps

if __name__ == '__main__':
    # Force run without heavy caching so JS updates reflect live
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.run(debug=True, port=5000)
