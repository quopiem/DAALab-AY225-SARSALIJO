import pandas as pd
import os

# Read dataset with correct encoding
df = pd.read_csv('gdp-csv-.csv', encoding='latin-1')

print("Original shape:", df.shape)
print("Original columns:", df.columns.tolist())

# Remove columns that are completely empty (all NaN)
df_cleaned = df.dropna(axis=1, how='all')
print("\nAfter removing all-empty columns:", df_cleaned.shape)
print("Remaining columns:", df_cleaned.columns.tolist())

# Remove rows that are completely empty
df_cleaned = df_cleaned.dropna(axis=0, how='all')

# Skip the first few header rows to find actual data
# Find the row that looks like a header with actual column names
for i, row in df_cleaned.iterrows():
    if 'Ranking' in str(row.values) or 'Country' in str(row.values):
        print(f"\nHeader row found at index {i}")
        df_cleaned = df_cleaned.iloc[i:].reset_index(drop=True)
        df_cleaned.columns = df_cleaned.iloc[0]
        df_cleaned = df_cleaned.iloc[1:].reset_index(drop=True)
        break

# Remove remaining empty columns
df_cleaned = df_cleaned.dropna(axis=1, how='all')

# Remove columns with mostly NaN values (>80% empty)
threshold = len(df_cleaned) * 0.8
df_cleaned = df_cleaned.dropna(axis=1, thresh=threshold)

# Remove completely empty rows
df_cleaned = df_cleaned.dropna(axis=0, how='all')

# Reset index
df_cleaned = df_cleaned.reset_index(drop=True)

print(f"\nFinal shape: {df_cleaned.shape}")
print(f"Final columns: {df_cleaned.columns.tolist()}")
print("\nFirst few rows:")
print(df_cleaned.head())

# Save cleaned CSV
df_cleaned.to_csv('data.csv', index=False, encoding='utf-8')
print("\nCleaned CSV saved to: data.csv")
