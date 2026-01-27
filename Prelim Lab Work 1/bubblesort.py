import time
import os

def bubble_sort(arr):
    n = len(arr)
    # Traverse through all array elements
    for i in range(n):
        swapped = False
        # Last i elements are already in place
        for j in range(0, n - i - 1):
            # Traverse the array from 0 to n-i-1
            # Swap if the element found is greater than the next element
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        
        # IF no two elements were swapped by inner loop, then break
        if not swapped:
            break
    return arr

def main():
    dataset_file = 'dataset.txt'
    
    # Check if file exists
    if not os.path.exists(dataset_file):
        print(f"Error: {dataset_file} not found in the current directory.")
        return

    # Read the dataset
    print(f"Reading data from {dataset_file}...")
    try:
        with open(dataset_file, 'r') as f:
            # Read lines, strip whitespace, and convert to integers
            # Handling potential empty lines or non-integer lines gracefully
            data = [int(line.strip()) for line in f if line.strip().isdigit() or (line.strip().startswith('-') and line.strip()[1:].isdigit())]
    except ValueError as e:
        print(f"Error reading data: {e}")
        return

    print(f"Successfully read {len(data)} integers.")
    
    # Limit to 10,000 integers if the file has more, as per requirements
    if len(data) > 10000:
        print("Dataset larger than 10,000 elements. Using the first 10,000.")
        data = data[:10000]
    elif len(data) < 10000:
        print(f"Warning: Dataset has fewer than 10,000 elements ({len(data)} found).")

    # Start timing
    start_time = time.time()
    
    # Perform Bubble Sort
    print("Starting Bubble Sort... This might take a moment.")
    sorted_data = bubble_sort(data)
    
    # End timing
    end_time = time.time()
    execution_time = end_time - start_time
    
    # Output results
    print("\n--- Results ---")
    print(f"Execution Time: {execution_time:.6f} seconds")
    
    print("\nSorted Array:")
    print(sorted_data)

if __name__ == "__main__":
    main()
