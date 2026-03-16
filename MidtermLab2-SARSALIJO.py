import csv
import heapq
import math
import tkinter as tk
from tkinter import ttk, messagebox

# ─────────────────────────────────────────
#  DATA LOADING
# ─────────────────────────────────────────

def load_graph(filepath):
    graph = {}   # adjacency list: node -> list of (neighbor, attrs)
    nodes = set()

    with open(filepath, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            frm  = row['From Node'].strip()
            to   = row['To Node'].strip()
            dist = float(row['Distance (km)'])
            time = float(row['Time (mins)'])
            fuel = float(row['Fuel (Liters)'])

            nodes.add(frm)
            nodes.add(to)

            graph.setdefault(frm, []).append((to,   {'distance': dist, 'time': time, 'fuel': fuel}))
            graph.setdefault(to,  []).append((frm,  {'distance': dist, 'time': time, 'fuel': fuel}))

    return graph, sorted(nodes)


# ─────────────────────────────────────────
#  DIJKSTRA
# ─────────────────────────────────────────

def dijkstra(graph, start, end, weight_key):
    """
    Returns (cost, path, totals_dict) where totals_dict has distance/time/fuel
    for the found path regardless of which weight was optimised.
    """
    # priority queue: (cost, node, path_so_far)
    pq = [(0, start, [start])]
    visited = {}

    while pq:
        cost, node, path = heapq.heappop(pq)

        if node in visited:
            continue
        visited[node] = (cost, path)

        if node == end:
            # compute full totals along the path
            totals = {'distance': 0, 'time': 0, 'fuel': 0}
            for i in range(len(path) - 1):
                a, b = path[i], path[i + 1]
                for (nb, attrs) in graph.get(a, []):
                    if nb == b:
                        totals['distance'] += attrs['distance']
                        totals['time']     += attrs['time']
                        totals['fuel']     += attrs['fuel']
                        break
            return cost, path, totals

        for (nb, attrs) in graph.get(node, []):
            if nb not in visited:
                new_cost = cost + attrs[weight_key]
                heapq.heappush(pq, (new_cost, nb, path + [nb]))

    return None, [], {}   # no path found


# ─────────────────────────────────────────
#  NODE MAP (Canvas-based)
# ─────────────────────────────────────────

NODE_POSITIONS = {
    'NOVELETA': (0.15, 0.25),
    'KAWIT':    (0.48, 0.08),
    'BACOOR':   (0.80, 0.18),
    'IMUS':     (0.85, 0.40),
    'GENTRI':   (0.20, 0.55),
    'DASMA':    (0.65, 0.65),
    'INDANG':   (0.25, 0.85),
    'SILANG':   (0.75, 0.88),
}

# ── Color Palette (Modern Google Maps) ──
BG_MAIN        = '#F8F9FA'          # Lightest gray background
BG_HEADER      = '#FFFFFF'          # White header
BG_CARD        = '#FFFFFF'          # White cards
FG_PRIMARY     = '#202124'          # Dark gray text
FG_SECONDARY   = '#5F6368'          # Medium gray text
ACCENT_PRIMARY = '#1A73E8'          # Google Blue
ACCENT_HOVER   = '#174EA6'          # Darker Blue
BTN_RESET_BG   = '#F1F3F4'
BTN_RESET_HOV  = '#E8EAED'
EDGE_COLOR     = '#BDC1C6'          # Soft gray edges
EDGE_TEXT      = '#3C4043'
NODE_FILL      = '#FFFFFF'
NODE_OUTLINE   = '#5F6368'
HL_EDGE        = '#4285F4'          # Blue highlight
HL_NODE        = '#4285F4'

CANVAS_W       = 1000
CANVAS_H       = 700
RADIUS         = 18

def draw_map(canvas, graph, nodes, highlight_path=None, active_metric='distance'):
    canvas.delete('all')
    W = canvas.winfo_width()
    H = canvas.winfo_height()
    # Fallback if window hasn't rendered size yet
    if W < 100: W = CANVAS_W
    if H < 100: H = CANVAS_H

    # Background pattern (subtle grid)
    canvas.create_rectangle(0, 0, W, H, fill=BG_MAIN, outline='')
    for i in range(0, W, 40):
        canvas.create_line(i, 0, i, H, fill='#E8EAED', width=1)
    for i in range(0, H, 40):
        canvas.create_line(0, i, W, i, fill='#E8EAED', width=1)

    def pos(name):
        px, py = NODE_POSITIONS.get(name, (0.5, 0.5))
        return int(px * W), int(py * H)

    # Collect highlighted edges
    hl_edges = set()
    if highlight_path and len(highlight_path) > 1:
        for i in range(len(highlight_path) - 1):
            a, b = highlight_path[i], highlight_path[i + 1]
            hl_edges.add((min(a, b), max(a, b)))

    # Pass 1: Draw Connections
    drawn_edges = set()
    for node in graph:
        for (nb, attrs) in graph[node]:
            key = (min(node, nb), max(node, nb))
            if key in drawn_edges: continue
            drawn_edges.add(key)

            x1, y1 = pos(node)
            x2, y2 = pos(nb)
            is_hl  = key in hl_edges
            
            color = HL_EDGE if is_hl else EDGE_COLOR
            width = 5 if is_hl else 3
            
            # Shadow for highlighted path
            if is_hl:
                canvas.create_line(x1, y1+2, x2, y2+2, fill='#D2E3FC', width=8, capstyle=tk.ROUND, smooth=True)

            canvas.create_line(x1, y1, x2, y2, fill=color, width=width, capstyle=tk.ROUND, smooth=True)

    # Pass 2: Draw Edge Labels
    drawn_labels = set()
    for node in graph:
        for (nb, attrs) in graph[node]:
            key = (min(node, nb), max(node, nb))
            if key in drawn_labels: continue
            drawn_labels.add(key)
            
            x1, y1 = pos(node)
            x2, y2 = pos(nb)
            mx, my = (x1 + x2) // 2, (y1 + y2) // 2
            
            metric_val = attrs[active_metric]
            val_str = f"{metric_val:.0f}"
            if active_metric == 'distance': suffix = 'km'
            elif active_metric == 'time': suffix = 'min'
            else: suffix = 'L'
            
            # Label badge
            is_hl = key in hl_edges
            bg = '#E8F0FE' if is_hl else '#FFFFFF'
            fg = '#1967D2' if is_hl else '#5F6368'
            
            canvas.create_oval(mx-15, my-10, mx+15, my+10, fill=bg, outline=EDGE_COLOR, width=1)
            canvas.create_text(mx, my, text=f"{val_str}{suffix}", fill=fg, font=('Roboto', 8, 'bold'))

    # Pass 3: Draw Nodes
    for name in nodes:
        x, y = pos(name)
        is_hl = highlight_path and name in highlight_path
        
        # Shadow
        canvas.create_oval(x-RADIUS, y-RADIUS+2, x+RADIUS, y+RADIUS+2, fill='#DADCE0', outline='')
        
        # Main Circle
        fill = HL_NODE if is_hl else NODE_FILL
        outline = '#FFFFFF' if is_hl else NODE_OUTLINE
        
        # If highlighted, show a larger pin-like circle
        r = RADIUS + 2 if is_hl else RADIUS
        
        id = canvas.create_oval(x-r, y-r, x+r, y+r, fill=fill, outline=outline, width=2, tags=f"node_{name}")
        
        # Label inside
        text_col = '#FFFFFF' if is_hl else FG_PRIMARY
        canvas.create_text(x, y, text=name[:3], fill=text_col, font=('Roboto', 9, 'bold'), tags=f"node_text_{name}")
        
        # Name Label below
        canvas.create_text(x, y+r+10, text=name, fill=FG_PRIMARY, font=('Roboto', 10, 'bold'), anchor='n')


# ─────────────────────────────────────────
#  GUI / LAYOUT
# ─────────────────────────────────────────

class AppUI:
    def __init__(self, root, graph, nodes):
        self.root = root
        self.graph = graph
        self.nodes = nodes
        
        # Fonts
        self.font_header = ('Product Sans', 14, 'bold')
        self.font_reg = ('Roboto', 10)
        self.font_bold = ('Roboto', 10, 'bold')
        
        self.setup_ui()

    def setup_ui(self):
        # ── TOP BAR (Floating Header Style) ──
        self.header = tk.Frame(self.root, bg=BG_HEADER, pady=10, padx=20)
        self.header.pack(side='top', fill='x')
        
        # Add bottom border to header
        tk.Frame(self.root, bg='#DADCE0', height=1).pack(side='top', fill='x')

        # 1. Title Section
        title_frm = tk.Frame(self.header, bg=BG_HEADER)
        title_frm.pack(side='left', padx=(0, 30))
        tk.Label(title_frm, text="Maps Optimizer", bg=BG_HEADER, fg=FG_PRIMARY, font=('Product Sans', 16, 'bold')).pack(anchor='w')
        tk.Label(title_frm, text="Cavite Chapter", bg=BG_HEADER, fg=FG_SECONDARY, font=('Roboto', 9)).pack(anchor='w')

        # 2. Metrics Section (Right aligned) - PACKED FIRST to ensure visibility
        metrics_frm = tk.Frame(self.header, bg=BG_HEADER)
        metrics_frm.pack(side='right', padx=10)
        
        # Reset Button (Far Right)
        tk.Button(self.header, text="↺ Reset", command=self.reset, 
                  bg=BTN_RESET_BG, fg=FG_PRIMARY, relief='flat', padx=15, pady=5, 
                  font=self.font_bold).pack(side='right', padx=10)

        self.lbl_dist = self.create_metric(metrics_frm, "DISTANCE", "0 km")
        self.lbl_dist.pack(side='left', padx=10)
        
        self.lbl_time = self.create_metric(metrics_frm, "TIME", "0 min")
        self.lbl_time.pack(side='left', padx=10)
        
        self.lbl_fuel = self.create_metric(metrics_frm, "FUEL", "0 L")
        self.lbl_fuel.pack(side='left', padx=10)

        # 3. Controls Section (Grid Layout in Center) - PACKED LAST to fill remaining space
        ctrl_frm = tk.Frame(self.header, bg=BG_HEADER)
        ctrl_frm.pack(side='left', fill='both', expand=True)
        
        # Styling for Combobox
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TCombobox', fieldbackground='#F1F3F4', background='white', borderwidth=0)
        
        # Origin
        tk.Label(ctrl_frm, text="Origin", bg=BG_HEADER, fg=FG_SECONDARY, font=('Roboto', 8)).grid(row=0, column=0, sticky='w', padx=5)
        self.frm_var = tk.StringVar()
        cb_origin = ttk.Combobox(ctrl_frm, textvariable=self.frm_var, values=self.nodes, state='readonly', width=15)
        cb_origin.set("- Select -")
        cb_origin.grid(row=1, column=0, padx=5)
        cb_origin.bind("<<ComboboxSelected>>", lambda e: self.on_change())

        # Arrow Icon
        tk.Label(ctrl_frm, text="➔", bg=BG_HEADER, fg='#BDC1C6').grid(row=1, column=1, padx=5)

        # Destination
        tk.Label(ctrl_frm, text="Destination", bg=BG_HEADER, fg=FG_SECONDARY, font=('Roboto', 8)).grid(row=0, column=2, sticky='w', padx=5)
        self.to_var = tk.StringVar()
        cb_dest = ttk.Combobox(ctrl_frm, textvariable=self.to_var, values=self.nodes, state='readonly', width=15)
        cb_dest.set("- Select -")
        cb_dest.grid(row=1, column=2, padx=5)
        cb_dest.bind("<<ComboboxSelected>>", lambda e: self.on_change())

        # Optimize By
        tk.Frame(ctrl_frm, width=20, bg=BG_HEADER).grid(row=1, column=3) # Spacer
        
        self.opt_var = tk.StringVar(value='distance')
        radio_frm = tk.Frame(ctrl_frm, bg=BG_HEADER)
        radio_frm.grid(row=1, column=4, padx=10)
        
        modes = [("📏 Distance", "distance"), ("⏱ Time", "time"), ("⛽ Fuel", "fuel")]
        for text, val in modes:
            tk.Radiobutton(radio_frm, text=text, variable=self.opt_var, value=val,
                           bg=BG_HEADER, fg=FG_PRIMARY, activebackground=BG_HEADER,
                           selectcolor=BG_HEADER, indicatoron=0,
                           bd=0, padx=10, pady=5, command=self.on_change).pack(side='left', padx=2)

        # ── CANVAS ──
        self.canvas = tk.Canvas(self.root, bg=BG_MAIN, highlightthickness=0)
        self.canvas.pack(fill='both', expand=True)
        self.canvas.bind('<Configure>', lambda e: draw_map(self.canvas, self.graph, self.nodes, active_metric=self.opt_var.get()))
        
        # Path Bar at Bottom
        self.path_bar = tk.Label(self.root, text="Ready to route...", bg=BG_MAIN, fg=FG_SECONDARY, font=('Roboto', 11, 'italic'), pady=10)
        self.path_bar.pack(side='bottom', fill='x')

        # Bind clicks
        self.canvas.bind('<Button-1>', self.on_canvas_click)

    def create_metric(self, parent, label, value):
        f = tk.Frame(parent, bg=BG_HEADER)
        tk.Label(f, text=label, bg=BG_HEADER, fg=FG_SECONDARY, font=('Roboto', 7, 'bold')).pack(anchor='w')
        l = tk.Label(f, text=value, bg=BG_HEADER, fg=ACCENT_PRIMARY, font=('Product Sans', 14, 'bold'))
        l.pack(anchor='w')
        return l

    def on_change(self):
        self.find_path()

    def on_canvas_click(self, event):
        # Click detection logic to select nodes
        x, y = event.x, event.y
        w, h = self.canvas.winfo_width(), self.canvas.winfo_height()
        
        clicked_node = None
        min_dist = RADIUS * 2
        
        for name in self.nodes:
            px, py = NODE_POSITIONS.get(name, (0.5, 0.5))
            nx, ny = int(px * w), int(py * h)
            dist = math.hypot(x - nx, y - ny)
            if dist < min_dist:
                clicked_node = name
                break
        
        if clicked_node:
            start = self.frm_var.get()
            end = self.to_var.get()
            
            if start == "- Select -" or start == clicked_node:
                self.frm_var.set(clicked_node)
            elif end == "- Select -" or end == clicked_node:
                self.to_var.set(clicked_node)
            else:
                self.frm_var.set(clicked_node)
                self.to_var.set("- Select -")
            
            self.on_change()

    def reset(self):
        self.frm_var.set("- Select -")
        self.to_var.set("- Select -")
        self.lbl_dist.config(text="0 km")
        self.lbl_time.config(text="0 min")
        self.lbl_fuel.config(text="0 L")
        self.path_bar.config(text="Ready to route...", fg=FG_SECONDARY)
        draw_map(self.canvas, self.graph, self.nodes, active_metric=self.opt_var.get())

    def find_path(self):
        start = self.frm_var.get()
        end = self.to_var.get()
        metric = self.opt_var.get()
        
        if start not in self.nodes or end not in self.nodes or start == end:
            draw_map(self.canvas, self.graph, self.nodes, active_metric=metric)
            if start == end and start != "- Select -":
                 self.path_bar.config(text="Start and End are the same.", fg='#D93025')
            return

        cost, path, totals = dijkstra(self.graph, start, end, metric)
        if not path:
            self.path_bar.config(text="No path found.", fg='#D93025')
            return

        draw_map(self.canvas, self.graph, self.nodes, highlight_path=path, active_metric=metric)
        self.lbl_dist.config(text=f"{totals['distance']:.1f} km")
        self.lbl_time.config(text=f"{totals['time']:.0f} min")
        self.lbl_fuel.config(text=f"{totals['fuel']:.1f} L")
        
        self.path_bar.config(text=" ➝ ".join(path), fg=FG_PRIMARY)


def build_gui(graph, nodes):
    root = tk.Tk()
    root.title("Google Maps Style Optimizer")
    root.geometry("1100x750")
    root.minsize(1000, 600)
    root.state('zoomed') # Open maximized on Windows
    
    app = AppUI(root, graph, nodes)
    root.mainloop()


# ─────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────

import os

if __name__ == '__main__':
    # Ensure we look for the dataset in the same directory as this script regardless of working directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    CSV_FILE = os.path.join(script_dir, 'dataset.csv')
    
    try:
        graph, nodes = load_graph(CSV_FILE)
    except FileNotFoundError:
        print(f"ERROR: '{CSV_FILE}' not found. Please ensure 'dataset.csv' exists in the same folder.")
        raise

    print(f"Loaded {len(nodes)} nodes and {sum(len(v) for v in graph.values()) // 2} edges.")
    build_gui(graph, nodes)