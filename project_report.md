# Project Report: Aether 3D MST Simulator
## High-Fidelity Minimum Spanning Tree Visualization Platform

---

### **1. Abstract**
The **Aether 3D MST Simulator** is a full-stack educational tool designed to visualize and compare the two primary Minimum Spanning Tree (MST) algorithms: Kruskal’s and Prim’s. Utilizing a modern tech stack of Python (Flask) for backend logical processing and high-performance JavaScript for 3D CSS rendering, the simulator provides a step-by-step interactive experience. It bridges the gap between abstract mathematical graph theory and real-world engineering by implementing "Industry Premise Modes"—allowing users to simulate road networks, internet latencies, and power grid optimizations in an immersive 3D environment.

---

### **2. Objective**
The primary objective of this project is to develop an interactive, high-fidelity simulator that:
*   Visualizes the greedy approach of MST algorithms in a 3D space.
*   Provides real-time performance analytics and comparative metrics.
*   Demonstrates the practical application of MST in various industries (Infrastructure, Networking, Energy).
*   Validates graph connectivity and integrity using backend-driven network intelligence.

---

### **3. Introduction**
In graph theory, a Minimum Spanning Tree is a subset of edges that connects all vertices in a weighted graph without cycles and with the minimum total edge weight. MST algorithms are foundational to computer science, used in everything from optimizing network layouts to image processing. **Aether 3D** transforms these traditional 2D whiteboard examples into a dynamic, "Cyber-themed" 3D application that emphasizes human-in-the-loop interaction and logical transparency.

---

### **4. Problem Statement**
Students and engineers often struggle to grasp the operational differences between Kruskal’s (edge-based) and Prim’s (vertex-based) algorithms, especially in large or sparse/dense graphs. Additionally, standard textbooks fail to show the impact of graph properties (like density) on execution time. There is a need for a tool that not only shows *how* an algorithm works but also *why* it is performing a certain way through live benchmarking and visual proof.

---

### **5. Algorithm / Methodology**

#### **Kruskal’s Algorithm**
*   **Approach:** Edge-based greedy strategy.
*   **Methodology:** Sorts all edges by weight and uses a **Disjoint Set Union (DSU)** data structure with path compression to detect and prevent cycles while growing a "forest" into a tree.

#### **Prim’s Algorithm**
*   **Approach:** Vertex-based greedy strategy.
*   **Methodology:** Starts from a root node and expands outward by continuously selecting the cheapest edge connected to the current tree. The implementation uses an adjacency list for efficient boundary exploration.

#### **Network Intelligence (Analytical Methodology)**
*   The system performs a **Breadth-First Search (BFS)** from the first available node to verify global connectivity before allowing a simulation to run, ensuring the resulting MST is valid.

---

### **6. Implementation**
The project is built using a decoupled **Full-Stack Architecture**:
*   **Backend (Python/Flask):** Handles the mathematical core. All MST steps, time-complexity calculations ($O(E \log V)$), and connectivity analysis are offloaded to Python for speed and precision.
*   **Frontend (HTML5/CSS3/JS):** A custom 3D engine built with Vanilla JavaScript and CSS `transform-style: preserve-3d`. Node positioning is calculated using circular layout trigonometry.
*   **Visual Analytics (Chart.js):** Integrated to provide cumulative cost distribution charts across steps.
*   **Deployment:** Configured for serverless execution on Vercel using `vercel.json` routing.

---

### **7. Input and Output**
*   **Input:** Users provide a comma-separated stream of edge tokens (e.g., `A-B:4, B-C:2`) or standalone nodes (`F`).
*   **Real-World Preset Modes:**
    *   **City Road Network:** Distances in km.
    *   **Internet Routing:** Latency in ms.
    *   **Power Grid:** Cable costs in Watts.
*   **Output:** 
    *   **Visualizer:** Interactive 3D cubes representing nodes and glowing SVG lines for edges.
    *   **Data Stream:** A live terminal-style log of every decision made by the algorithm.
    *   **Benchmarks:** Comparative tables showing execution time (μs), total cost, and total steps evaluated.

---

### **8. Result and Analysis**
Through the Benchmark module, we observe that:
*   **Kruskal’s** is more efficient in **sparse graphs** since it processes fewer edges overall.
*   **Prim’s** tends to perform better in **dense graphs** where the boundary of the growing tree offers fewer possibilities than the global edge list.
*   The **Visual Performance Chart** reveals that Kruskal's adds cost in a "step-ladder" fashion (due to sorting), while Prim's adds cost based on local proximity.
*   The **Execution Summary** validates that both algorithms consistently converge on the same MST cost, mathematically proving their correctness.

---

### **9. Conclusion**
The Aether 3D MST Simulator successfully demonstrates that complex algorithms can be made transparent through high-fidelity visualization. By offloading logic to a Python backend, we achieved a production-ready separation of concerns. The inclusion of industrial "Premises" proves that MST is not just a mathematical concept but a vital tool for real-world cost optimization in modern infrastructure.

---

### **10. References**
1.  Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms*.
2.  Kruskal, J. B. (1956). On the Shortest Spanning Subtree of a Graph and the Traveling Salesman Problem.
3.  Prim, R. C. (1957). Shortest Connection Networks and Some Generalizations.
4.  Vercel Documentation (2024). *Deploying Python Flask Applications*.
5.  Chart.js Documentation. *Creating Dynamic Performance Charts*.
