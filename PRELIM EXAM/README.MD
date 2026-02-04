# Sorting Analytics & Benchmark Tool

A comprehensive benchmarking tool for analyzing the performance of different sorting algorithms (Bubble Sort, Insertion Sort, Merge Sort) on CSV datasets. This tool provides a modern GUI dashboard to visualize loading times, sorting times, and algorithm progress.

## Features

- **Multiple Sorting Algorithms**:
  - Bubble Sort (O(n²))
  - Insertion Sort (O(n²))
  - Merge Sort (O(n log n))
- **Interactive Dashboard**: Modern Tkinter-based GUI with dark/light theme elements.
- **Real-time Progress**: Visual progress bars and percentage indicators.
- **Performance Metrics**: Measures and displays load time, sort time, and total execution time.
- **Safety Checks**: Warns user before running O(n²) algorithms on large datasets (>50k records).
- **Sorting Options**: Sort by different columns (ID, Name, LikeCount, Time, etc.) in ascending or descending order (support varies by algorithm/implementation).

## Requirements

- Python 3.6+
- `tkinter` (usually included with Python)

## Setup

1. Ensure you have Python installed.
2. The tool expects a `generated_data.csv` file in the same directory.
   - Required columns: `ID`, `FirstName`, `LastName`, `LikeCount`, `Time`.

## Usage

1. Run the main script:
   ```bash
   python MAIN.PY
   ```
2. **Configuration Sidebar**:
   - Select an algorithm (Bubble, Insertion, or Merge).
   - Select the column to sort by.
   - Choose the dataset size (number of rows to load/sort).
3. Click **START BENCHMARK**.
4. View results in the "Execution Logs & Results" panel.

## Troubleshooting

- **Missing File Error**: Ensure `generated_data.csv` is in the same folder as `MAIN.PY`.
- **Freezing**: Sorting large datasets with Bubble/Insertion sort can be slow. The GUI runs sorting in a separate thread to remain responsive, but it may take time to complete.

## License

Personal/Educational Use.
