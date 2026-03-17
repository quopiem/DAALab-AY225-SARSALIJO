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

# ── Color Palette (Futuristic HUD) ──
BG_MAIN        = '#050A14'          # Deep Space Black
BG_HEADER      = '#0F1724'          # Dark Blue-Grey
BG_CARD        = '#0F1724'          # Dark Card
FG_PRIMARY     = '#00F0FF'          # Neon Cyan
FG_SECONDARY   = '#8DA9C4'          # Muted Cool Grey
ACCENT_PRIMARY = '#00F0FF'          # Neon Cyan
ACCENT_HOVER   = '#FF0055'          # Neon Pink
BTN_RESET_BG   = '#1B2735'
BTN_RESET_HOV  = '#263445'
EDGE_COLOR     = '#1B2735'          # Faint structure lines
EDGE_TEXT      = '#8DA9C4'
NODE_FILL      = '#050A14'
NODE_OUTLINE   = '#00F0FF'
HL_EDGE        = '#FF0055'          # Neon Pink
HL_NODE        = '#FF0055'

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

    # Background pattern (Digital Grid)
    canvas.create_rectangle(0, 0, W, H, fill=BG_MAIN, outline='')
    
    # Grid lines
    for i in range(0, W, 40):
        color = '#102A43' if i % 120 != 0 else '#243B53'
        canvas.create_line(i, 0, i, H, fill=color, width=1)
    for i in range(0, H, 40):
        color = '#102A43' if i % 120 != 0 else '#243B53'
        canvas.create_line(0, i, W, i, fill=color, width=1)

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
            
            # Base Line
            color = HL_EDGE if is_hl else EDGE_COLOR
            width = 4 if is_hl else 2
            
            # Glow effect for highlighted path
            if is_hl:
                canvas.create_line(x1, y1, x2, y2, fill=HL_EDGE, width=10, capstyle=tk.ROUND, stipple='gray50') # Fake glow
                canvas.create_line(x1, y1, x2, y2, fill=HL_EDGE, width=6, capstyle=tk.ROUND)

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
            
            # Label badge (Hexagon or Box style)
            is_hl = key in hl_edges
            bg = '#102A43' if is_hl else '#0F1724'
            fg = HL_EDGE if is_hl else EDGE_TEXT
            outline = HL_EDGE if is_hl else '#1B2735'
            
            # Draw a tech-style label box
            canvas.create_rectangle(mx-18, my-10, mx+18, my+10, fill=bg, outline=outline, width=1)
            canvas.create_text(mx, my, text=f"{val_str}{suffix}", fill=fg, font=('Consolas', 8))

    # Pass 3: Draw Nodes
    for name in nodes:
        x, y = pos(name)
        is_hl = highlight_path and name in highlight_path
        
        # Outer Ring
        ring_col = HL_NODE if is_hl else NODE_OUTLINE
        canvas.create_oval(x-RADIUS*1.2, y-RADIUS*1.2, x+RADIUS*1.2, y+RADIUS*1.2, outline=ring_col, width=1)
        
        # Inner Circle
        fill = BG_MAIN
        outline = HL_NODE if is_hl else NODE_OUTLINE
        
        id = canvas.create_oval(x-RADIUS, y-RADIUS, x+RADIUS, y+RADIUS, fill=fill, outline=outline, width=2, tags=f"node_{name}")
        
        # Inner Dot
        dot_col = HL_NODE if is_hl else NODE_OUTLINE
        canvas.create_oval(x-4, y-4, x+4, y+4, fill=dot_col, outline='')

        # Label inside
        text_col = '#FFFFFF'
        # canvas.create_text(x, y, text=name[:3], fill=text_col, font=('Roboto', 9, 'bold'), tags=f"node_text_{name}")
        
        # Name Label below (Neon text)
        canvas.create_text(x, y+RADIUS+12, text=name, fill=FG_PRIMARY, font=('Consolas', 10, 'bold'), anchor='n')


# ─────────────────────────────────────────
#  GUI / LAYOUT
# ─────────────────────────────────────────

class AppUI:
    def __init__(self, root, graph, nodes):
        self.root = root
        self.graph = graph
        self.nodes = nodes
        self.current_path = None  # To persist path on resize
        self._anim_job = None     # For animation cancellation

        # Fonts
        self.font_header = ('Consolas', 14, 'bold')
        self.font_reg = ('Consolas', 10)
        self.font_bold = ('Consolas', 10, 'bold')
        
        # Configure Dark Theme for TTK Widgets
        style = ttk.Style()
        style.theme_use('clam')
        
        # Combobox
        style.configure('TCombobox', 
                        fieldbackground=BG_MAIN, 
                        background=BG_HEADER, 
                        foreground=FG_PRIMARY,
                        arrowcolor=FG_PRIMARY,
                        borderwidth=0)
        style.map('TCombobox', fieldbackground=[('readonly', BG_MAIN)], selectbackground=[('readonly', BG_MAIN)], selectforeground=[('readonly', FG_PRIMARY)])

        # Treeview
        style.configure("Treeview", 
                        background=BG_MAIN, 
                        foreground=FG_SECONDARY, 
                        fieldbackground=BG_MAIN, 
                        borderwidth=0,
                        rowheight=25)
        style.configure("Treeview.Heading", 
                        background=BG_HEADER, 
                        foreground=FG_PRIMARY, 
                        borderwidth=0,
                        font=('Consolas', 9, 'bold'))
        style.map("Treeview", background=[('selected', '#102A43')], foreground=[('selected', FG_PRIMARY)])

        self.setup_ui()

    def setup_ui(self):
        self.root.configure(bg=BG_MAIN) # Root Background

        # ── TOP BAR (Floating Header Style) ──
        self.header = tk.Frame(self.root, bg=BG_HEADER, pady=10, padx=20)
        self.header.pack(side='top', fill='x')
        
        # Add bottom border to header (Neon Line)
        tk.Frame(self.root, bg=FG_PRIMARY, height=2).pack(side='top', fill='x')

        # 1. Title Section
        title_frm = tk.Frame(self.header, bg=BG_HEADER)
        title_frm.pack(side='left', padx=(0, 30))
        tk.Label(title_frm, text="MAPS__OPTIMIZER_V2.0", bg=BG_HEADER, fg=FG_PRIMARY, font=('Consolas', 16, 'bold')).pack(anchor='w')
        tk.Label(title_frm, text="CAVITE_SECTOR", bg=BG_HEADER, fg=FG_SECONDARY, font=('Consolas', 9)).pack(anchor='w')

        # 2. Metrics Section (Right aligned) - PACKED FIRST to ensure visibility
        metrics_frm = tk.Frame(self.header, bg=BG_HEADER)
        metrics_frm.pack(side='right', padx=10)
        
        # Reset Button (Far Right)
        tk.Button(self.header, text="[ REBOOT SYSTEM ]", command=self.reset, 
                  bg=BTN_RESET_BG, fg=FG_PRIMARY, activebackground=BTN_RESET_HOV, activeforeground=FG_PRIMARY,
                  relief='flat', padx=15, pady=5, 
                  font=self.font_bold, borderwidth=0).pack(side='right', padx=10)

        self.lbl_dist = self.create_metric(metrics_frm, "DISTANCE", "0 km")
        self.lbl_dist.pack(side='left', padx=10)
        
        self.lbl_time = self.create_metric(metrics_frm, "ETA", "0 min")
        self.lbl_time.pack(side='left', padx=10)
        
        self.lbl_fuel = self.create_metric(metrics_frm, "FUEL_REQ", "0 L")
        self.lbl_fuel.pack(side='left', padx=10)

        # 3. Controls Section (Grid Layout in Center) - PACKED LAST to fill remaining space
        ctrl_frm = tk.Frame(self.header, bg=BG_HEADER)
        ctrl_frm.pack(side='left', fill='both', expand=True)
        
        # Origin
        tk.Label(ctrl_frm, text="INIT_NODE", bg=BG_HEADER, fg=FG_SECONDARY, font=('Consolas', 8)).grid(row=0, column=0, sticky='w', padx=5)
        self.frm_var = tk.StringVar()
        cb_origin = ttk.Combobox(ctrl_frm, textvariable=self.frm_var, values=self.nodes, state='readonly', width=15)
        cb_origin.set("- Select -")
        cb_origin.grid(row=1, column=0, padx=5)
        cb_origin.bind("<<ComboboxSelected>>", lambda e: self.on_change())

        # Arrow Icon
        tk.Label(ctrl_frm, text=" >> ", bg=BG_HEADER, fg=FG_PRIMARY).grid(row=1, column=1, padx=5)

        # Destination
        tk.Label(ctrl_frm, text="TARGET_NODE", bg=BG_HEADER, fg=FG_SECONDARY, font=('Consolas', 8)).grid(row=0, column=2, sticky='w', padx=5)
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
        
        modes = [("DIST", "distance"), ("N-TIME", "time"), ("FUEL", "fuel")]
        for text, val in modes:
            tk.Radiobutton(radio_frm, text=text, variable=self.opt_var, value=val,
                           bg=BG_HEADER, fg=FG_SECONDARY, activebackground=BG_HEADER, activeforeground=FG_PRIMARY,
                           selectcolor=BG_HEADER, indicatoron=0,
                           bd=0, padx=10, pady=5, command=self.on_change).pack(side='left', padx=2)

        # ── MAIN CONTENT AREA ──
        # Path Bar at Bottom
        self.path_bar = tk.Label(self.root, text="> AWAITING INPUT COMPLIANCE...", bg=BG_MAIN, fg=FG_SECONDARY, font=('Consolas', 11), pady=10, anchor='w', padx=20)
        self.path_bar.pack(side='bottom', fill='x')

        # Container for Canvas + Details
        content_frm = tk.Frame(self.root, bg=BG_MAIN)
        content_frm.pack(fill='both', expand=True)

        # Right Panel: Route Metrics Data
        self.details_panel = tk.Frame(content_frm, bg=BG_CARD, width=300)
        self.details_panel.pack(side='right', fill='y', padx=(1, 0)) # 1px left margin
        self.details_panel.pack_propagate(False)
        
        # Border for panel
        tk.Frame(self.details_panel, bg=FG_PRIMARY, width=1).pack(side='left', fill='y')

        tk.Label(self.details_panel, text="SEGMENT_DATA", bg=BG_CARD, fg=FG_PRIMARY, font=('Consolas', 11, 'bold')).pack(pady=(15, 10), padx=15, anchor='w')

        # Treeview for Data
        cols = ('to', 'dist', 'time', 'fuel')
        self.tree = ttk.Treeview(self.details_panel, columns=cols, show='headings', selectmode='browse')
        
        self.tree.heading('to', text='STEP')
        self.tree.heading('dist', text='KM')
        self.tree.heading('time', text='MIN')
        self.tree.heading('fuel', text='L')
        
        self.tree.column('to', width=80, anchor='w')
        self.tree.column('dist', width=50, anchor='center')
        self.tree.column('time', width=50, anchor='center')
        self.tree.column('fuel', width=45, anchor='center')
        
        self.tree.pack(fill='both', expand=True, padx=10, pady=(0, 10))

        # ── CANVAS ──
        self.canvas = tk.Canvas(content_frm, bg=BG_MAIN, highlightthickness=0)
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.bind('<Configure>', lambda e: draw_map(self.canvas, self.graph, self.nodes, 
                                                           highlight_path=self.current_path, 
                                                           active_metric=self.opt_var.get()))
        
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

    def update_details(self, path):
        # Clear existing
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        if not path or len(path) < 2:
            return

        # Add Start
        self.tree.insert('', 'end', values=(f"Start: {path[0]}", "-", "-", "-"))

        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            
            # Find edge attrs
            attrs = None
            for (neighbor, edge_attrs) in self.graph.get(u, []):
                if neighbor == v:
                    attrs = edge_attrs
                    break
            
            if attrs:
                d = attrs['distance']
                t = attrs['time']
                f = attrs['fuel']
                
                self.tree.insert('', 'end', values=(
                    f"→ {v}",
                    f"{d:.1f}",
                    f"{t:.0f}",
                    f"{f:.1f}"
                ))

    def reset(self):
        if self._anim_job:
            self.root.after_cancel(self._anim_job)
            self._anim_job = None

        self.current_path = None
        
        # Clear Treeview
        for item in self.tree.get_children():
            self.tree.delete(item)

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
        
        # Stop existing animation
        if self._anim_job:
            self.root.after_cancel(self._anim_job)
            self._anim_job = None
        
        self.current_path = None

        if start not in self.nodes or end not in self.nodes or start == end:
            draw_map(self.canvas, self.graph, self.nodes, active_metric=metric)
            if start == end and start != "- Select -":
                 self.path_bar.config(text="Start and End are the same.", fg='#D93025')
            return

        cost, path, totals = dijkstra(self.graph, start, end, metric)
        if not path:
            draw_map(self.canvas, self.graph, self.nodes, active_metric=metric)
            self.path_bar.config(text="No path found.", fg='#D93025')
            return

        # Start Animation
        self.current_path = path
        self.update_details(path)

        self.lbl_dist.config(text=f"{totals['distance']:.1f} km")
        self.lbl_time.config(text=f"{totals['time']:.0f} min")
        self.lbl_fuel.config(text=f"{totals['fuel']:.1f} L")
        self.path_bar.config(text=" ➝ ".join(path), fg=FG_PRIMARY)

        self.animate_path(path, metric)

    def animate_path(self, path, metric):
        # 1. Draw base without highlight
        draw_map(self.canvas, self.graph, self.nodes, highlight_path=None, active_metric=metric)
        
        self._anim_path = path
        self._anim_metric = metric
        self._anim_idx = 0
        self._anim_t = 0
        self._anim_steps = 15  # Speed of animation

        # Get initial position
        u = path[0]
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        px, py = NODE_POSITIONS.get(u, (0.5, 0.5))
        sx, sy = int(px * w), int(py * h)

        # Draw vehicle (Glowing Drone)
        self._vehicle_id = self.canvas.create_oval(sx-6, sy-6, sx+6, sy+6, fill='#FFFFFF', outline=HL_NODE, width=2)
        
        self.step_animation()

    def step_animation(self):
        if self._anim_idx >= len(self._anim_path) - 1:
            # Animation Done -> Draw final static map with full highlight
            self.canvas.delete(self._vehicle_id)
            draw_map(self.canvas, self.graph, self.nodes, highlight_path=self._anim_path, active_metric=self._anim_metric)
            self._anim_job = None
            return

        u = self._anim_path[self._anim_idx]
        v = self._anim_path[self._anim_idx + 1]
        
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        
        px1, py1 = NODE_POSITIONS.get(u, (0.5, 0.5))
        px2, py2 = NODE_POSITIONS.get(v, (0.5, 0.5))
        
        x1, y1 = int(px1 * w), int(py1 * h)
        x2, y2 = int(px2 * w), int(py2 * h)
        
        # Interpolate
        self._anim_t += 1
        fraction = self._anim_t / self._anim_steps
        
        cx = x1 + (x2 - x1) * fraction
        cy = y1 + (y2 - y1) * fraction
        
        # Move vehicle
        self.canvas.coords(self._vehicle_id, cx-6, cy-6, cx+6, cy+6)
        
        # Draw trail (Neon)
        self.canvas.create_line(x1, y1, cx, cy, fill=HL_EDGE, width=4, capstyle=tk.ROUND, tag='anim_trail')
        self.canvas.create_line(x1, y1, cx, cy, fill='#4285F4', width=5, capstyle=tk.ROUND, tag='anim_trail')
        
        if self._anim_t >= self._anim_steps:
            self._anim_t = 0
            self._anim_idx += 1
            
        self._anim_job = self.root.after(20, self.step_animation)


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
