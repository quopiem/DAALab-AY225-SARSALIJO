import csv
import time
import sys
import os
import threading
from typing import List, Tuple, Any
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from tkinter import font as tkFont

class SortingBenchmark:
    """A comprehensive benchmarking tool for sorting algorithms."""
    
    def __init__(self, csv_file_path: str):
        """Initialize the benchmark tool with a CSV file path."""
        self.csv_file_path = csv_file_path
        self.data = []
        self.load_time = 0
        self.sort_time = 0
        
    def load_csv(self, num_rows: int = None) -> float:
        """
        Load the CSV file into memory.
        
        Args:
            num_rows: Number of rows to load. If None, loads all rows.
            
        Returns:
            Time taken to load the file in seconds.
        """
        start_time = time.time()
        self.data = []
        
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                row_count = 0
                
                for row in reader:
                    if num_rows and row_count >= num_rows:
                        break
                    
                    self.data.append(row)
                    row_count += 1
                    
                    # Progress indicator
                    if row_count % 10000 == 0:
                        print(f"  Loaded {row_count:,} records...", end='\r')
            
            if self.data:
                print(f"  ✓ Successfully loaded {len(self.data):,} records")
            
        except FileNotFoundError:
            print(f"Error: File '{self.csv_file_path}' not found.")
            sys.exit(1)
        except Exception as e:
            print(f"Error loading CSV: {e}")
            sys.exit(1)
        
        self.load_time = time.time() - start_time
        return self.load_time
    
    def bubble_sort(self, key: str, reverse: bool = False) -> List[dict]:
        """
        Bubble Sort algorithm - O(n²) complexity.
        
        Args:
            key: Column name to sort by.
            reverse: If True, sort in descending order.
            
        Returns:
            Sorted list of records.
        """
        arr = [row.copy() for row in self.data]
        n = len(arr)
        
        for i in range(n):
            swapped = False
            for j in range(0, n - i - 1):
                if self._compare(arr[j], arr[j + 1], key, reverse):
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
                    swapped = True
            
            if not swapped:
                break
            
            # Progress indicator
            if (i + 1) % max(1, n // 10) == 0:
                progress = (i + 1) / n * 100
                print(f"  Bubble Sort Progress: {progress:.1f}%", end='\r')
        
        print("  ✓ Bubble Sort complete")
        return arr
    
    def insertion_sort(self, key: str, reverse: bool = False) -> List[dict]:
        """
        Insertion Sort algorithm - O(n²) complexity.
        
        Args:
            key: Column name to sort by.
            reverse: If True, sort in descending order.
            
        Returns:
            Sorted list of records.
        """
        arr = [row.copy() for row in self.data]
        
        for i in range(1, len(arr)):
            key_item = arr[i]
            j = i - 1
            
            while j >= 0 and self._compare(arr[j], key_item, key, reverse):
                arr[j + 1] = arr[j]
                j -= 1
            
            arr[j + 1] = key_item
            
            # Progress indicator
            if i % max(1, len(arr) // 10) == 0:
                progress = i / len(arr) * 100
                print(f"  Insertion Sort Progress: {progress:.1f}%", end='\r')
        
        print("  ✓ Insertion Sort complete")
        return arr
    
    def merge_sort(self, key: str, reverse: bool = False) -> List[dict]:
        """
        Merge Sort algorithm - O(n log n) complexity.
        
        Args:
            key: Column name to sort by.
            reverse: If True, sort in descending order.
            
        Returns:
            Sorted list of records.
        """
        arr = [row.copy() for row in self.data]
        
        self._merge_sort_helper(arr, 0, len(arr) - 1, key, reverse)
        print("  ✓ Merge Sort complete")
        return arr
    
    def _merge_sort_helper(self, arr: List[dict], left: int, right: int, 
                          key: str, reverse: bool) -> None:
        """Helper function for merge sort using divide and conquer."""
        if left < right:
            mid = (left + right) // 2
            self._merge_sort_helper(arr, left, mid, key, reverse)
            self._merge_sort_helper(arr, mid + 1, right, key, reverse)
            self._merge(arr, left, mid, right, key, reverse)
    
    def _merge(self, arr: List[dict], left: int, mid: int, right: int, 
               key: str, reverse: bool) -> None:
        """Merge operation for merge sort."""
        left_arr = arr[left:mid + 1]
        right_arr = arr[mid + 1:right + 1]
        
        i = j = 0
        k = left
        
        while i < len(left_arr) and j < len(right_arr):
            if not self._compare(left_arr[i], right_arr[j], key, reverse):
                arr[k] = left_arr[i]
                i += 1
            else:
                arr[k] = right_arr[j]
                j += 1
            k += 1
        
        while i < len(left_arr):
            arr[k] = left_arr[i]
            i += 1
            k += 1
        
        while j < len(right_arr):
            arr[k] = right_arr[j]
            j += 1
            k += 1
    
    def _compare(self, row1: dict, row2: dict, key: str, reverse: bool) -> bool:
        """
        Compare two rows based on the specified key.
        Handles both integer and string comparisons.
        
        Returns True if row1 should come after row2 (for ascending order).
        """
        val1 = row1[key]
        val2 = row2[key]
        
        # Try to convert to integer for numeric columns
        if key in ['ID', 'LikeCount']:
            val1 = int(val1)
            val2 = int(val2)
        
        if reverse:
            return val1 < val2
        else:
            return val1 > val2
    
    def display_results(self, sorted_data: List[dict], algorithm: str, 
                       key: str, num_rows: int) -> None:
        """Display the sorting results."""
        print("\n" + "="*80)
        print(f"SORTING RESULTS - {algorithm}")
        print("="*80)
        print(f"Column sorted: {key}")
        print(f"Total records sorted: {len(sorted_data):,}")
        print(f"Load time: {self.load_time:.4f} seconds")
        print(f"Sort time: {self.sort_time:.4f} seconds")
        print(f"Total time: {self.load_time + self.sort_time:.4f} seconds")
        print("="*80)
        print("\nFirst 10 records:")
        print("-"*80)
        
        # Print headers
        if sorted_data:
            headers = list(sorted_data[0].keys())
            col_widths = {h: max(len(h), 15) for h in headers}
            
            header_str = " | ".join(f"{h:^{col_widths[h]}}" for h in headers)
            print(header_str)
            print("-"*80)
            
            # Print first 10 rows
            for i, row in enumerate(sorted_data[:10]):
                row_str = " | ".join(f"{str(row[h]):^{col_widths[h]}}" for h in headers)
                print(f"{i+1:2}. {row_str}")
        
        print("-"*80 + "\n")
    
    def benchmark(self, algorithm: str, column: str, num_rows: int, 
                 reverse: bool = False) -> List[dict]:
        """
        Run a benchmark test with the specified algorithm.
        
        Args:
            algorithm: Name of sorting algorithm ('bubble', 'insertion', 'merge').
            column: Column to sort by ('ID', 'FirstName', 'LastName').
            num_rows: Number of rows to process.
            reverse: If True, sort in descending order.
            
        Returns:
            Sorted data.
        """
        print(f"\nLoading data...")
        self.load_csv(num_rows)
        
        # Check for performance warnings
        if len(self.data) > 50000 and algorithm in ['bubble', 'insertion']:
            print(f"\n⚠️  WARNING: {algorithm.upper()} sort with {len(self.data):,} records")
            print("   This O(n²) algorithm may take a very long time!")
            response = input("   Continue? (y/n): ").strip().lower()
            if response != 'y':
                print("   Benchmark cancelled.")
                return []
        
        print(f"\nRunning {algorithm.upper()} Sort...")
        start_time = time.time()
        
        if algorithm.lower() == 'bubble':
            sorted_data = self.bubble_sort(column, reverse)
        elif algorithm.lower() == 'insertion':
            sorted_data = self.insertion_sort(column, reverse)
        elif algorithm.lower() == 'merge':
            sorted_data = self.merge_sort(column, reverse)
        else:
            print(f"Unknown algorithm: {algorithm}")
            return []
        
        self.sort_time = time.time() - start_time
        self.display_results(sorted_data, algorithm.upper(), column, num_rows)
        
        return sorted_data




class BenchmarkGUI:
    """GUI for the Sorting Algorithm Benchmarking Tool."""
    
    def __init__(self, root):
        """Initialize the GUI."""
        self.root = root
        self.root.title("Sorting Analytics & Benchmark")
        self.root.geometry("1100x850")
        
        # Get the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.csv_file = os.path.join(script_dir, "generated_data.csv")
        self.benchmark = SortingBenchmark(self.csv_file)
        self.is_running = False
        
        self.setup_styles()
        self.setup_ui()
    
    def setup_styles(self):
        """Configure custom styles for a professional dashboard look."""
        self.style = ttk.Style()
        self.style.theme_use('clam')  # 'clam' allows better color customization
        
        # Color Palette (Sidebar Dashboard Theme)
        self.colors = {
            "sidebar_bg": "#1e293b",      # Dark Slate for sidebar
            "sidebar_fg": "#f8fafc",      # Light text for sidebar
            "content_bg": "#f1f5f9",      # Very light blue-grey for main area
            "card_bg": "#ffffff",         # White cards
            "primary": "#3b82f6",         # Bright Blue
            "primary_hover": "#2563eb",   # Darker Blue
            "text_dark": "#0f172a",       # Almost black
            "text_muted": "#64748b",      # Muted gray
            "button_text": "#ffffff",
            "console_bg": "#0f172a",      # Deep dark blue/black for console
            "console_fg": "#e2e8f0"       # Light gray console text
        }
        
        # Fonts
        default_font = "Segoe UI" if "Segoe UI" in tkFont.families() else "Helvetica"
        self.fonts = {
            "h1": (default_font, 24, "bold"),
            "h2": (default_font, 18, "bold"),
            "h3": (default_font, 12, "bold"),
            "body": (default_font, 10),
            "label": (default_font, 9),
            "mono": ("Consolas", 10)
        }
        
        # --- Configure Styles ---
        
        # Layout Frames
        self.style.configure("Sidebar.TFrame", background=self.colors["sidebar_bg"])
        self.style.configure("Content.TFrame", background=self.colors["content_bg"])
        self.style.configure("Card.TFrame", background=self.colors["card_bg"], relief="flat")
        
        # Sidebar Elements
        self.style.configure("SidebarTitle.TLabel", background=self.colors["sidebar_bg"], 
                           foreground=self.colors["sidebar_fg"], font=self.fonts["h2"])
        
        self.style.configure("SidebarLabel.TLabel", background=self.colors["sidebar_bg"], 
                           foreground="#94a3b8", font=self.fonts["label"])
        
        self.style.configure("Sidebar.TRadiobutton", background=self.colors["sidebar_bg"], 
                           foreground="white", font=self.fonts["body"])
        self.style.map("Sidebar.TRadiobutton",
            background=[('active', self.colors["sidebar_bg"])],
            foreground=[('active', self.colors["primary"])]
        )

        # Content Elements
        self.style.configure("Header.TLabel", background=self.colors["content_bg"], 
                           foreground=self.colors["text_dark"], font=self.fonts["h1"])
        
        self.style.configure("CardTitle.TLabel", background=self.colors["card_bg"], 
                           foreground=self.colors["text_dark"], font=self.fonts["h3"])
        
        self.style.configure("CardStatus.TLabel", background=self.colors["card_bg"], 
                           foreground=self.colors["primary"], font=self.fonts["body"])
        
        # Primary Button (Run)
        self.style.configure("Primary.TButton", font=("Segoe UI", 11, "bold"), padding=10, borderwidth=0)
        self.style.map("Primary.TButton",
            background=[('active', self.colors["primary_hover"]), ('!disabled', self.colors["primary"])],
            foreground=[('!disabled', 'white')]
        )
        
        # Secondary Button (Clear)
        self.style.configure("Secondary.TButton", font=self.fonts["body"], padding=6)
        self.style.map("Secondary.TButton",
            background=[('active', '#e2e8f0'), ('!disabled', 'white')],
            foreground=[('!disabled', self.colors["text_dark"])]
        )

    def setup_ui(self):
        """Setup the user interface with a dashboard layout."""
        # Root Background
        self.root.configure(bg=self.colors["content_bg"])
        
        # --- Left Sidebar ---
        sidebar = ttk.Frame(self.root, style="Sidebar.TFrame", width=280, padding=20)
        sidebar.pack(side=tk.LEFT, fill=tk.Y)
        sidebar.pack_propagate(False) # Prevent shrinking
        
        # App Title in Sidebar
        ttk.Label(sidebar, text="Sorting\nAnalytics", style="SidebarTitle.TLabel").pack(anchor=tk.W, pady=(0, 40))
        
        # -- Configuration Section --
        ttk.Label(sidebar, text="CONFIGURATION", style="SidebarLabel.TLabel").pack(anchor=tk.W, pady=(0, 10))
        
        # Algorithm Choice
        ttk.Label(sidebar, text="Select Algorithm", style="SidebarLabel.TLabel", foreground="white").pack(anchor=tk.W, pady=(10, 5))
        self.algorithm_var = tk.StringVar(value="merge")
        
        for algo in ["bubble", "insertion", "merge"]:
            ttk.Radiobutton(
                sidebar,
                text=f"{algo.capitalize()} Sort",
                variable=self.algorithm_var,
                value=algo,
                style="Sidebar.TRadiobutton",
                cursor="hand2"
            ).pack(anchor=tk.W, pady=3, padx=5)

        ttk.Separator(sidebar, orient='horizontal').pack(fill=tk.X, pady=20)

        # Dropdowns
        ttk.Label(sidebar, text="Sort Column", style="SidebarLabel.TLabel", foreground="white").pack(anchor=tk.W, pady=(0, 5))
        self.column_var = tk.StringVar(value="ID")
        col_combo = ttk.Combobox(sidebar, textvariable=self.column_var, 
                               values=["ID", "FirstName", "LastName", "LikeCount", "Time"], state="readonly")
        col_combo.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(sidebar, text="Dataset Size", style="SidebarLabel.TLabel", foreground="white").pack(anchor=tk.W, pady=(0, 5))
        self.rows_var = tk.StringVar(value="1000")
        rows_spin = ttk.Spinbox(sidebar, from_=100, to=100000, textvariable=self.rows_var, increment=100)
        rows_spin.pack(fill=tk.X, pady=(0, 30))
        
        # Action Buttons
        self.run_button = ttk.Button(sidebar, text="▶  START BENCHMARK", 
                                   command=self.run_benchmark, style="Primary.TButton", cursor="hand2")
        self.run_button.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(sidebar, text="Reset & Clear Log", command=self.clear_output, 
                 style="Secondary.TButton", cursor="hand2").pack(fill=tk.X)

        # --- Main Content Area ---
        content = ttk.Frame(self.root, style="Content.TFrame", padding=30)
        content.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = ttk.Frame(content, style="Content.TFrame")
        header_frame.pack(fill=tk.X, pady=(0, 20))
        ttk.Label(header_frame, text="Performance Dashboard", style="Header.TLabel").pack(side=tk.LEFT)
        
        # Status Card
        status_card = ttk.Frame(content, style="Card.TFrame", padding=20)
        status_card.pack(fill=tk.X, pady=(0, 20))
        
        # Status Header
        s_head = ttk.Frame(status_card, style="Card.TFrame")
        s_head.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(s_head, text="Current Status", style="CardTitle.TLabel").pack(side=tk.LEFT)
        self.progress_label = ttk.Label(s_head, text="Ready to start", style="CardStatus.TLabel")
        self.progress_label.pack(side=tk.RIGHT)
        
        # Progress Bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(status_card, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, pady=(5, 0))
        
        # Console/Output Card
        out_card = ttk.Frame(content, style="Card.TFrame", padding=0)
        out_card.pack(fill=tk.BOTH, expand=True)
        
        # Console Header
        out_head = ttk.Frame(out_card, style="Card.TFrame", padding=15)
        out_head.pack(fill=tk.X)
        ttk.Label(out_head, text="Execution Logs & Results", style="CardTitle.TLabel").pack(side=tk.LEFT)
        
        # Console Text Area
        self.output_text = scrolledtext.ScrolledText(
            out_card,
            font=self.fonts["mono"],
            bg=self.colors["console_bg"],
            fg=self.colors["console_fg"],
            insertbackground="white",
            relief="flat",
            padx=20,
            pady=20,
            borderwidth=0
        )
        self.output_text.pack(fill=tk.BOTH, expand=True)
        
        self.print_welcome()
        
    def print_welcome(self):
        """Print initial welcome message."""
        self.output_text.insert(tk.END, "="*60 + "\n")
        self.output_text.insert(tk.END, "  SORTING ALGORITHM BENCHMARKING TOOL v2.1\n")
        self.output_text.insert(tk.END, "="*60 + "\n\n")
        self.output_text.insert(tk.END, "  System ready.\n")
        self.output_text.insert(tk.END, "  Please select an algorithm from the sidebar to begin.\n")
        self.output_text.config(state=tk.DISABLED)
    
    def log_output(self, message: str, clear: bool = False):
        """Add message to output text widget."""
        self.output_text.config(state=tk.NORMAL)
        if clear:
            self.output_text.delete(1.0, tk.END)
        self.output_text.insert(tk.END, message)
        self.output_text.see(tk.END)
        self.output_text.config(state=tk.DISABLED)
        self.root.update()
    
    def update_progress(self, value: float, text: str = ""):
        """Update progress bar and label."""
        self.progress_var.set(value)
        if text:
            self.progress_label.config(text=text)
        self.root.update()
    
    def run_benchmark(self):
        """Run the benchmark in a separate thread."""
        if self.is_running:
            messagebox.showwarning("Warning", "A benchmark is already running!")
            return
        
        try:
            algorithm = self.algorithm_var.get()
            column = self.column_var.get()
            num_rows = int(self.rows_var.get())
            
            if num_rows < 1 or num_rows > 100000:
                messagebox.showerror("Error", "Number of rows must be between 1 and 100,000")
                return
            
            # Run in separate thread to avoid freezing GUI
            self.is_running = True
            self.run_button.config(state=tk.DISABLED)
            
            thread = threading.Thread(
                target=self._run_benchmark_thread,
                args=(algorithm, column, num_rows),
                daemon=True
            )
            thread.start()
            
        except ValueError:
            messagebox.showerror("Error", "Invalid input. Please check your settings.")
    
    def _run_benchmark_thread(self, algorithm: str, column: str, num_rows: int):
        """Run benchmark in separate thread."""
        try:
            self.log_output("", clear=True)
            self.update_progress(0, "Loading data...")
            
            # Load CSV
            start_time = time.time()
            self.benchmark.load_csv(num_rows)
            load_time = time.time() - start_time
            
            loaded_records = len(self.benchmark.data)
            
            # Check for warnings
            if loaded_records > 50000 and algorithm in ['bubble', 'insertion']:
                self.log_output(f"\n⚠️  WARNING: {algorithm.upper()} sort with {loaded_records:,} records\n")
                self.log_output("   This O(n²) algorithm may take a VERY LONG TIME!\n\n")
            
            self.update_progress(10, f"Loaded {loaded_records:,} records")
            
            # Run sorting algorithm
            self.log_output(f"\nRunning {algorithm.upper()} Sort...\n")
            self.update_progress(20, f"Sorting...")
            
            start_time = time.time()
            
            if algorithm == 'bubble':
                sorted_data = self._bubble_sort_with_progress(column)
            elif algorithm == 'insertion':
                sorted_data = self._insertion_sort_with_progress(column)
            elif algorithm == 'merge':
                sorted_data = self.benchmark.merge_sort(column)
            
            sort_time = time.time() - start_time
            
            # Display results
            self.display_results(sorted_data, algorithm, column, load_time, sort_time, loaded_records)
            self.update_progress(100, "Done")
            
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
            self.update_progress(0, "Error")
        finally:
            self.is_running = False
            self.run_button.config(state=tk.NORMAL)
    
    def _bubble_sort_with_progress(self, key: str) -> List[dict]:
        """Bubble sort with progress updates."""
        arr = [row.copy() for row in self.benchmark.data]
        n = len(arr)
        
        for i in range(n):
            swapped = False
            for j in range(0, n - i - 1):
                if self.benchmark._compare(arr[j], arr[j + 1], key, False):
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
                    swapped = True
            
            if not swapped:
                break
            
            progress = 20 + (i + 1) / n * 70
            self.update_progress(progress, f"Bubble Sort: {progress:.1f}%")
        
        return arr
    
    def _insertion_sort_with_progress(self, key: str) -> List[dict]:
        """Insertion sort with progress updates."""
        arr = [row.copy() for row in self.benchmark.data]
        
        for i in range(1, len(arr)):
            key_item = arr[i]
            j = i - 1
            
            while j >= 0 and self.benchmark._compare(arr[j], key_item, key, False):
                arr[j + 1] = arr[j]
                j -= 1
            
            arr[j + 1] = key_item
            
            progress = 20 + i / len(arr) * 70
            self.update_progress(progress, f"Insertion Sort: {progress:.1f}%")
        
        return arr
    
    def display_results(self, sorted_data: List[dict], algorithm: str, column: str, 
                       load_time: float, sort_time: float, num_records: int):
        """Display benchmark results."""
        output = ""
        output += "\n" + "="*80 + "\n"
        output += f"SORTING RESULTS - {algorithm.upper()}\n"
        output += "="*80 + "\n"
        output += f"Column sorted: {column}\n"
        output += f"Total records sorted: {num_records:,}\n"
        output += f"Load time: {load_time:.4f} seconds\n"
        output += f"Sort time: {sort_time:.4f} seconds\n"
        output += f"Total time: {load_time + sort_time:.4f} seconds\n"
        output += "="*80 + "\n\n"
        output += "First 10 records:\n"
        output += "-"*80 + "\n"
        
        if sorted_data:
            headers = list(sorted_data[0].keys())
            col_widths = {h: max(len(h), 15) for h in headers}
            
            header_str = " | ".join(f"{h:^{col_widths[h]}}" for h in headers)
            output += header_str + "\n"
            output += "-"*80 + "\n"
            
            for i, row in enumerate(sorted_data[:10]):
                row_str = " | ".join(f"{str(row[h]):^{col_widths[h]}}" for h in headers)
                output += f"{i+1:2}. {row_str}\n"
        
        output += "-"*80 + "\n"
        
        self.log_output(output)
    
    def clear_output(self):
        """Clear the output text widget."""
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete(1.0, tk.END)
        self.output_text.config(state=tk.DISABLED)
        self.progress_var.set(0)
        self.progress_label.config(text="Ready")



def main():
    """Main function to run the GUI."""
    root = tk.Tk()
    gui = BenchmarkGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
