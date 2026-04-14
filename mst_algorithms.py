import heapq

class Graph:
    def __init__(self, vertices):
        self.V = vertices
        self.edges = []
        self.adj = {i: [] for i in range(vertices)}

    def add_edge(self, u, v, weight):
        self.edges.append((u, v, weight))
        self.adj[u].append((v, weight))
        self.adj[v].append((u, weight))

    # ==========================================
    # Kruskal's Algorithm Implementation
    # ==========================================
    def kruskal_find(self, parent, i):
        if parent[i] == i:
            return i
        parent[i] = self.kruskal_find(parent, parent[i]) # Path compression
        return parent[i]

    def kruskal_union(self, parent, rank, x, y):
        xroot = self.kruskal_find(parent, x)
        yroot = self.kruskal_find(parent, y)

        if rank[xroot] < rank[yroot]:
            parent[xroot] = yroot
        elif rank[xroot] > rank[yroot]:
            parent[yroot] = xroot
        else:
            parent[yroot] = xroot
            rank[xroot] += 1

    def kruskal_mst(self):
        result = []
        i, e = 0, 0
        # Step 1: Sort all edges in non-decreasing order of their weight
        sorted_edges = sorted(self.edges, key=lambda item: item[2])
        parent = []
        rank = []

        for node in range(self.V):
            parent.append(node)
            rank.append(0)

        # Step 2: Pick the smallest edge, check if it forms a cycle
        while e < self.V - 1 and i < len(sorted_edges):
            u, v, w = sorted_edges[i]
            i += 1
            x = self.kruskal_find(parent, u)
            y = self.kruskal_find(parent, v)

            # If including this edge doesn't cause cycle, include it
            if x != y:
                e += 1
                result.append((u, v, w))
                self.kruskal_union(parent, rank, x, y)
                
        return result

    # ==========================================
    # Prim's Algorithm Implementation
    # ==========================================
    def prim_mst(self):
        mst = []
        visited = set([0]) # Start from vertex 0
        edges = [(weight, 0, to) for to, weight in self.adj[0]]
        heapq.heapify(edges)

        while edges and len(visited) < self.V:
            weight, frm, to = heapq.heappop(edges)
            
            if to not in visited:
                visited.add(to)
                mst.append((frm, to, weight))
                
                for next_to, next_weight in self.adj[to]:
                    if next_to not in visited:
                        heapq.heappush(edges, (next_weight, to, next_to))
                        
        return mst

def visualize_graph_and_mst(g, kruskal_result, prim_result):
    try:
        import networkx as nx
        import matplotlib.pyplot as plt
        
        G = nx.Graph()
        for u, v, w in g.edges:
            G.add_edge(u, v, weight=w)

        pos = nx.spring_layout(G, seed=42)
        
        plt.figure(figsize=(15, 5))
        
        # Plot Original Graph
        plt.subplot(131)
        plt.title("Original Graph")
        nx.draw(G, pos, with_labels=True, node_color='lightblue', node_size=500, font_weight='bold')
        labels = nx.get_edge_attributes(G, 'weight')
        nx.draw_networkx_edge_labels(G, pos, edge_labels=labels)

        # Plot Kruskal's MST
        plt.subplot(132)
        plt.title("Kruskal's MST")
        K_G = nx.Graph()
        for u, v, w in kruskal_result:
            K_G.add_edge(u, v, weight=w)
        nx.draw(K_G, pos, with_labels=True, node_color='lightgreen', node_size=500, font_weight='bold', edge_color='green', width=2)
        k_labels = nx.get_edge_attributes(K_G, 'weight')
        nx.draw_networkx_edge_labels(K_G, pos, edge_labels=k_labels)
        
        # Plot Prim's MST
        plt.subplot(133)
        plt.title("Prim's MST")
        P_G = nx.Graph()
        for u, v, w in prim_result:
            P_G.add_edge(u, v, weight=w)
        nx.draw(P_G, pos, with_labels=True, node_color='lightcoral', node_size=500, font_weight='bold', edge_color='red', width=2)
        p_labels = nx.get_edge_attributes(P_G, 'weight')
        nx.draw_networkx_edge_labels(P_G, pos, edge_labels=p_labels)

        plt.tight_layout()
        plt.show()
    except ImportError:
        print("\n[!] Note: matplotlib and networkx are not installed.")
        print("To see visualizations, run: pip install networkx matplotlib\n")

if __name__ == "__main__":
    # Create a graph with 9 vertices (0 to 8)
    g = Graph(9)
    g.add_edge(0, 1, 4)
    g.add_edge(0, 7, 8)
    g.add_edge(1, 2, 8)
    g.add_edge(1, 7, 11)
    g.add_edge(2, 3, 7)
    g.add_edge(2, 8, 2)
    g.add_edge(2, 5, 4)
    g.add_edge(3, 4, 9)
    g.add_edge(3, 5, 14)
    g.add_edge(4, 5, 10)
    g.add_edge(5, 6, 2)
    g.add_edge(6, 7, 1)
    g.add_edge(6, 8, 6)
    g.add_edge(7, 8, 7)

    print("--------------------------------------------------")
    print("        MINIMUM SPANNING TREE ALGORITHMS          ")
    print("--------------------------------------------------")

    # Run Kruskal's Algorithm
    kruskal_result = g.kruskal_mst()
    print("\n[+] Kruskal's Minimum Spanning Tree:")
    kruskal_cost = 0
    for u, v, weight in kruskal_result:
        print(f"Edge: {u} - {v} | Weight: {weight}")
        kruskal_cost += weight
    print(f"Total Minimum Cost (Kruskal): {kruskal_cost}")

    # Run Prim's Algorithm
    prim_result = g.prim_mst()
    print("\n[+] Prim's Minimum Spanning Tree:")
    prim_cost = 0
    for u, v, weight in prim_result:
        print(f"Edge: {u} - {v} | Weight: {weight}")
        prim_cost += weight
    print(f"Total Minimum Cost (Prim): {prim_cost}")
    print("--------------------------------------------------")

    # Visualize the results
    visualize_graph_and_mst(g, kruskal_result, prim_result)
