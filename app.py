import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

st.title("Firewall Logs Data Analytics")

# Load data with sampling for performance
@st.cache_data
def load_data(sample_size=10000):
    df = pd.read_csv('firewall_logs_100mb_nov2025.csv', nrows=sample_size)
    return df

df = load_data()

st.header("Data Preview")
st.dataframe(df.head())

st.header("Basic Statistics")
st.write(df.describe())

st.header("Action Distribution")
action_counts = df['action'].value_counts()
st.bar_chart(action_counts)

st.header("Protocol Distribution")
protocol_counts = df['protocol'].value_counts()
st.bar_chart(protocol_counts)

st.header("Top Source IPs")
src_ip_counts = df['src_ip'].value_counts().head(10)
st.bar_chart(src_ip_counts)

st.header("Top Destination IPs")
dst_ip_counts = df['dst_ip'].value_counts().head(10)
st.bar_chart(dst_ip_counts)
