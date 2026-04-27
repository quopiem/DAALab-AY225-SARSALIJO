import pandas as pd
import kagglehub

# Download dataset from Kaggle
print("Downloading World Bank GDP dataset...")
path = kagglehub.dataset_download("theworldbank/world-bank-gdp-ranking")
print(f"Dataset downloaded to: {path}")

# Find CSV file in downloaded path
import os
csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
if not csv_files:
    print("No CSV files found!")
    exit(1)

csv_file = os.path.join(path, csv_files[0])
print(f"Reading: {csv_file}")

# Read CSV
df = pd.read_csv(csv_file)

print(f"\nOriginal shape: {df.shape}")
print(f"Original columns: {df.columns.tolist()}")

# Remove completely empty columns
df_cleaned = df.dropna(axis=1, how='all')
print(f"\nAfter removing all-empty columns: {df_cleaned.shape}")

# Remove columns with >50% missing values
threshold = len(df_cleaned) * 0.5
df_cleaned = df_cleaned.dropna(axis=1, thresh=threshold)
print(f"After removing mostly-empty columns: {df_cleaned.shape}")

print(f"\nKept columns: {df_cleaned.columns.tolist()}")

# Save cleaned CSV to FINALS-PROJECT folder
output_path = r"c:\Users\JOHN MIKO SARSALIJO\DAALab-AY225-SARSALIJO\FINALS-PROJECT\data.csv"
df_cleaned.to_csv(output_path, index=False)
print(f"\nCleaned CSV saved to: {output_path}")
print(f"Total rows: {len(df_cleaned)}")
