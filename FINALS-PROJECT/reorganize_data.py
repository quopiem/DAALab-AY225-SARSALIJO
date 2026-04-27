import pandas as pd

# Read current data
df = pd.read_csv('data.csv')

print("Current columns:", df.columns.tolist())
print("Current order:")
print(df.head(3))

# Rename columns to match expected format
df = df.rename(columns={
    df.columns[0]: 'CountryCode',
    df.columns[1]: 'Rank',
    df.columns[2]: 'CountryName',
    df.columns[3]: 'GDP'
})

# Reorder columns: CountryCode, Rank, CountryName, GDP
df = df[['CountryCode', 'Rank', 'CountryName', 'GDP']]

print("\nNew columns:", df.columns.tolist())
print("New order:")
print(df.head(3))

# Save
df.to_csv('data.csv', index=False)
print("\nData saved to data.csv")
