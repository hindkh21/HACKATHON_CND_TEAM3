import pandas as pd
import numpy as np
import sys
import glob
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import IsolationForest

# Configuration
LOG_PATTERN = 'firewall_logs_*.csv'
OUTPUT_MERGED_CSV = 'merged_cleaned_firewall_logs.csv'
OUTPUT_SUBSET_XLSX = 'subset_firewall_logs.xlsx'

def load_and_explore(file_path):
    """
    1) Load and explore the CSV.
    """
    print(f"--- Loading Data from {file_path} ---")
    try:
        df = pd.read_csv(file_path)
        print(f"Loaded {len(df)} rows.")
        return df
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return None

def clean_data(df):
    """
    2) Define clear cleaning rules.
    """
    # print("\n--- Step 2: Cleaning Data ---")
    initial_count = len(df)

    # Rule 1: Drop rows where critical fields are missing
    critical_cols = ['timestamp', 'src_ip', 'dst_ip', 'action']
    existing_critical = [c for c in critical_cols if c in df.columns]

    df_clean = df.dropna(subset=existing_critical)
    # print(f"Dropped {initial_count - len(df_clean)} rows containing missing values in critical columns {existing_critical}.")

    # Rule 2: Remove duplicates
    before_dedup = len(df_clean)
    df_clean = df_clean.drop_duplicates()
    # print(f"Dropped {before_dedup - len(df_clean)} duplicate rows.")

    # print(f"Total rows removed: {initial_count - len(df_clean)}")
    # print(f"Remaining rows: {len(df_clean)}")
    return df_clean

def engineer_features(df):
    """
    3) Engineer relevant features for detection.
    """
    # print("\n--- Step 3: Feature Engineering ---")
    # Ensure timestamp is datetime
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df = df.dropna(subset=['timestamp']) # Drop rows where timestamp parsing failed

    # Example Feature: High Port flag
    if 'dst_port' in df.columns:
        df['is_high_port'] = df['dst_port'] > 1024

    # --- ML Feature: Anomaly Detection (Isolation Forest) ---
    # print("Running Isolation Forest for anomaly detection...")
    features = ['bytes', 'duration_ms', 'src_port', 'dst_port']
    # Fill NaNs for ML
    X = df[features].fillna(0)

    # Contamination set to 'auto' or a small fraction
    iso_forest = IsolationForest(contamination=0.01, random_state=42)
    df['anomaly_score'] = iso_forest.fit_predict(X)
    # -1 is anomaly, 1 is normal.
    df['is_anomaly_ml'] = df['anomaly_score'] == -1
    # print(f"ML detected {df['is_anomaly_ml'].sum()} statistical anomalies.")

    return df

def detect_threats(df):
    """
    4) Propose and implement a detection strategy.
    """
    # print("\n--- Step 4: Threat Detection ---")

    # Initialize type as 'Normal'
    df['type'] = 'Normal'

    # --- Threat Intelligence Mapping (MITRE ATT&CK / OWASP) ---
    mitre_mapping = {
        'Known malicious domain contacted': 'T1071 - Application Layer Protocol',
        'Multiple auth failures': 'T1110 - Brute Force',
        'Port scan detected': 'T1595 - Active Scanning',
        'Potential DDoS - high rate': 'T1498 - Network Denial of Service',
        'Suspicious SQL payload': 'T1190 - Exploit Public-Facing Application',
        'XSS attempt': 'T1190 - Exploit Public-Facing Application',
        'Suspicious payload': 'T1203 - Exploitation for Client Execution'
    }

    owasp_mapping = {
        'Suspicious SQL payload': 'A03:2021-Injection',
        'XSS attempt': 'A03:2021-Injection',
        'Multiple auth failures': 'A07:2021-Identification and Authentication Failures',
        'Known malicious domain contacted': 'A06:2021-Vulnerable and Outdated Components'
    }

    # Apply mappings
    df['mitre_technique'] = df['reason'].map(mitre_mapping)
    df['owasp_category'] = df['reason'].map(owasp_mapping)

    # Defined Attack Categories (Pure Attacks)
    pure_attacks = [
        'Known malicious domain contacted',
        'Multiple auth failures',
        'Port scan detected',
        'Potential DDoS - high rate',
        'Suspicious SQL payload',
        'XSS attempt'
    ]

    # Rule 1: Pure Attacks
    if 'reason' in df.columns:
        df.loc[df['reason'].isin(pure_attacks), 'type'] = 'Attack'

    # Rule 3: Bugs
    if 'reason' in df.columns and 'action' in df.columns:
        bug_mask = (df['reason'] == 'Protocol violation') & (df['action'] != 'REJECT')
        df.loc[bug_mask, 'type'] = 'Bug'

    return df

def assign_severity(df):
    """
    5) Create a severity column.
    """
    # print("\n--- Step 5: Severity Classification ---")
    df['severity'] = None # Default to None

    # --- Attack Severity ---
    high_sev_attacks = [
        'Potential DDoS - high rate',
        'Suspicious SQL payload',
        'XSS attempt',
        'Known malicious domain contacted'
    ]

    medium_sev_attacks = [
        'Port scan detected'
    ]

    low_sev_attacks = [
        'Multiple auth failures'
    ]

    if 'reason' in df.columns:
        df.loc[(df['type'] == 'Attack') & (df['reason'].isin(high_sev_attacks)), 'severity'] = 'High'
        df.loc[(df['type'] == 'Attack') & (df['reason'].isin(medium_sev_attacks)), 'severity'] = 'Medium'
        df.loc[(df['type'] == 'Attack') & (df['reason'].isin(low_sev_attacks)), 'severity'] = 'Low'

    # --- Bug Severity ---
    if 'status' in df.columns:
        # High: ERR, MALFORMED
        df.loc[(df['type'] == 'Bug') & (df['status'].isin(['ERR', 'MALFORMED'])), 'severity'] = 'High'
        # Medium: TIMEOUT
        df.loc[(df['type'] == 'Bug') & (df['status'] == 'TIMEOUT'), 'severity'] = 'Medium'
        # Low: OK (Default for Bugs)
        df.loc[(df['type'] == 'Bug') & (df['severity'].isnull()), 'severity'] = 'Low'

    # Fallback for any unassigned
    df.loc[(df['type'] != 'Normal') & (df['severity'].isnull()), 'severity'] = 'Medium'

    return df

def main():
    # Find all log files
    log_files = glob.glob(LOG_PATTERN)
    print(f"Found {len(log_files)} log files: {log_files}")

    all_dfs = []

    for file_path in log_files:
        print(f"\nProcessing {file_path}...")
        df = load_and_explore(file_path)
        if df is not None:
            # Apply pipeline
            df = clean_data(df)
            df = engineer_features(df)
            df = detect_threats(df)
            df = assign_severity(df)
            all_dfs.append(df)
            print(f"Finished processing {file_path}. Rows: {len(df)}")

    if not all_dfs:
        print("No data processed.")
        return

    # Merge all dataframes
    print("\nMerging all datasets...")
    merged_df = pd.concat(all_dfs, ignore_index=True)
    print(f"Total merged rows: {len(merged_df)}")

    # Validation on merged dataset
    print("\n--- Validation on Merged Data ---")
    counts = merged_df['type'].value_counts()
    print("Counts by Type:")
    print(counts)

    print("\nCounts by Severity:")
    print(merged_df['severity'].value_counts())

    # Save merged CSV
    print(f"\nSaving merged data to {OUTPUT_MERGED_CSV}...")
    merged_df.to_csv(OUTPUT_MERGED_CSV, index=False)
    print("Done.")

    # Create Subset for Excel (Bug and Attack only)
    print(f"\nCreating subset for Excel (Bug and Attack only)...")
    subset_cols = ['timestamp', 'type', 'severity']
    # Filter only Bug and Attack
    subset_df = merged_df[merged_df['type'].isin(['Bug', 'Attack'])][subset_cols].copy()

    # Remove timezone info for Excel compatibility
    if subset_df['timestamp'].dt.tz is not None:
        subset_df['timestamp'] = subset_df['timestamp'].dt.tz_localize(None)

    print(f"Subset rows: {len(subset_df)}")
    print(f"Saving subset to {OUTPUT_SUBSET_XLSX}...")
    subset_df.to_excel(OUTPUT_SUBSET_XLSX, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
