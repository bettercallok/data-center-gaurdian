import os
import glob
import csv
import time

def main():
    start_time = time.time()
    input_dir = '/Users/omkhatri/Downloads/data_Q4_2025'
    output_file = '/Users/omkhatri/DataGuardian/data-center-guardian/compiled_smart_data.csv'

    target_columns = [
        'date',
        'serial_number',
        'model',
        'failure',
        'smart_5_raw',
        'smart_187_raw',
        'smart_188_raw',
        'smart_197_raw',
        'smart_198_raw'
    ]

    csv_files = glob.glob(os.path.join(input_dir, '*.csv'))
    csv_files.sort()
    
    print(f"Found {len(csv_files)} CSV files to process.")

    with open(output_file, 'w', newline='') as out_f:
        writer = csv.writer(out_f)
        writer.writerow(target_columns)
        
        for idx, file in enumerate(csv_files):
            # Print progress every 10 files
            if idx % 10 == 0:
                print(f"Processing file {idx+1}/{len(csv_files)}: {os.path.basename(file)}")
                
            with open(file, 'r', newline='') as in_f:
                reader = csv.reader(in_f)
                try:
                    header = next(reader)
                except StopIteration:
                    continue
                    
                # Find indices for this specific file
                try:
                    indices = [header.index(col) for col in target_columns]
                except ValueError as e:
                    print(f"Skipping {os.path.basename(file)} due to missing column: {e}")
                    continue
                
                # Write rows
                for row in reader:
                    # Only write rows that have enough columns
                    if len(row) > max(indices):
                        writer.writerow([row[i] for i in indices])
                    else:
                        writer.writerow([row[i] if i < len(row) else '' for i in indices])

    elapsed = time.time() - start_time
    print(f"\nData extraction complete in {elapsed:.2f} seconds.")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    main()
