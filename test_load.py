def load_data_from_file(filename):
    try:
        with open(filename, 'r') as f:
            data = []
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data.append(int(line))
                    except ValueError:
                        pass
        return data
    except FileNotFoundError:
        return None
    except Exception as e:
        return None

data = load_data_from_file("dataset.txt")
print(f"Total numbers loaded: {len(data)}")
print(f"First 5: {data[:5]}")
print(f"Last 5: {data[-5:]}")
