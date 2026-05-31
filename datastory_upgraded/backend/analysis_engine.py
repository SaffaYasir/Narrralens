import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats
import warnings
warnings.filterwarnings('ignore')


def load_dataframe(filepath, ext):
    if ext == 'csv':
        return pd.read_csv(filepath)
    return pd.read_excel(filepath)


def detect_column_types(df):
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    datetime_cols = []
    
    for col in categorical_cols[:]:
        try:
            parsed = pd.to_datetime(df[col], infer_datetime_format=True)
            datetime_cols.append(col)
            categorical_cols.remove(col)
        except:
            pass
    
    return numeric_cols, categorical_cols, datetime_cols


def basic_statistics(df, numeric_cols):
    stats_dict = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        stats_dict[col] = {
            "mean": round(float(series.mean()), 4),
            "median": round(float(series.median()), 4),
            "std": round(float(series.std()), 4),
            "min": round(float(series.min()), 4),
            "max": round(float(series.max()), 4),
            "q1": round(float(series.quantile(0.25)), 4),
            "q3": round(float(series.quantile(0.75)), 4),
            "skewness": round(float(series.skew()), 4),
            "kurtosis": round(float(series.kurtosis()), 4),
            "missing": int(df[col].isnull().sum()),
            "missing_pct": round(df[col].isnull().mean() * 100, 2)
        }
    return stats_dict


def detect_anomalies(df, numeric_cols):
    if len(numeric_cols) == 0:
        return {}, []
    
    valid_cols = [c for c in numeric_cols if df[c].notna().sum() > 10]
    if not valid_cols:
        return {}, []
    
    X = df[valid_cols].dropna()
    if len(X) < 10:
        return {}, []
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    iso = IsolationForest(contamination=0.05, random_state=42)
    preds = iso.fit_predict(X_scaled)
    
    anomaly_indices = X.index[preds == -1].tolist()
    anomaly_rows = df.loc[anomaly_indices].head(10).to_dict(orient='records')
    
    # Per-column outliers using IQR
    outlier_info = {}
    for col in valid_cols:
        series = df[col].dropna()
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = series[(series < lower) | (series > upper)]
        outlier_info[col] = {
            "count": int(len(outliers)),
            "pct": round(len(outliers) / len(series) * 100, 2),
            "lower_bound": round(float(lower), 4),
            "upper_bound": round(float(upper), 4)
        }
    
    return outlier_info, anomaly_rows


def correlation_analysis(df, numeric_cols):
    if len(numeric_cols) < 2:
        return {}, []
    
    valid_cols = [c for c in numeric_cols if df[c].notna().sum() > 5]
    if len(valid_cols) < 2:
        return {}, []
    
    corr_matrix = df[valid_cols].corr()
    corr_dict = corr_matrix.round(4).to_dict()
    
    # Top correlations
    pairs = []
    for i, col1 in enumerate(valid_cols):
        for col2 in valid_cols[i+1:]:
            val = corr_matrix.loc[col1, col2]
            if not np.isnan(val):
                pairs.append({
                    "col1": col1,
                    "col2": col2,
                    "correlation": round(float(val), 4),
                    "strength": _corr_strength(val),
                    "direction": "positive" if val > 0 else "negative"
                })
    
    pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return corr_dict, pairs[:10]


def _corr_strength(val):
    abs_val = abs(val)
    if abs_val >= 0.8: return "very strong"
    if abs_val >= 0.6: return "strong"
    if abs_val >= 0.4: return "moderate"
    if abs_val >= 0.2: return "weak"
    return "negligible"


def trend_analysis(df, numeric_cols, datetime_cols):
    trends = []
    
    if datetime_cols:
        date_col = datetime_cols[0]
        try:
            df[date_col] = pd.to_datetime(df[date_col])
            df_sorted = df.sort_values(date_col)
            
            for col in numeric_cols[:3]:
                series = df_sorted[col].dropna()
                if len(series) < 5:
                    continue
                x = np.arange(len(series))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, series.values)
                trends.append({
                    "column": col,
                    "date_column": date_col,
                    "slope": round(float(slope), 6),
                    "r_squared": round(float(r_value**2), 4),
                    "p_value": round(float(p_value), 6),
                    "trend_direction": "upward" if slope > 0 else "downward",
                    "significant": p_value < 0.05
                })
        except:
            pass
    
    # Detect peaks
    peak_insights = []
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) < 3:
            continue
        mean_val = series.mean()
        std_val = series.std()
        max_val = series.max()
        min_val = series.min()
        
        if std_val > 0:
            pct_above_mean = round((max_val - mean_val) / mean_val * 100, 1) if mean_val != 0 else 0
            peak_insights.append({
                "column": col,
                "max": round(float(max_val), 4),
                "min": round(float(min_val), 4),
                "mean": round(float(mean_val), 4),
                "pct_above_mean": round(float(pct_above_mean), 1),
                "cv": round(float(std_val / mean_val * 100), 2) if mean_val != 0 else 0
            })
    
    return trends, peak_insights


def categorical_analysis(df, categorical_cols):
    cat_stats = {}
    for col in categorical_cols[:5]:
        vc = df[col].value_counts()
        cat_stats[col] = {
            "unique_count": int(df[col].nunique()),
            "top_value": str(vc.index[0]) if len(vc) > 0 else None,
            "top_count": int(vc.iloc[0]) if len(vc) > 0 else 0,
            "top_pct": round(vc.iloc[0] / len(df) * 100, 2) if len(vc) > 0 else 0,
            "distribution": {str(k): int(v) for k, v in vc.head(10).items()}
        }
    return cat_stats


def prepare_chart_data(df, numeric_cols, categorical_cols, datetime_cols):
    charts = []
    
    # Time series chart
    if datetime_cols and numeric_cols:
        date_col = datetime_cols[0]
        try:
            df[date_col] = pd.to_datetime(df[date_col])
            df_sorted = df.sort_values(date_col)
            target_col = numeric_cols[0]
            chart_df = df_sorted[[date_col, target_col]].dropna()
            
            # Resample if too many points
            if len(chart_df) > 100:
                chart_df = chart_df.iloc[::len(chart_df)//100]
            
            charts.append({
                "type": "line",
                "title": f"{target_col} Over Time",
                "data": [
                    {"x": str(row[date_col])[:10], "y": round(float(row[target_col]), 4)}
                    for _, row in chart_df.iterrows()
                ],
                "xKey": "x",
                "yKey": "y",
                "xLabel": date_col,
                "yLabel": target_col
            })
        except:
            pass
    
    # Bar chart for categorical
    if categorical_cols and numeric_cols:
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        grouped = df.groupby(cat_col)[num_col].mean().reset_index().head(12)
        charts.append({
            "type": "bar",
            "title": f"Average {num_col} by {cat_col}",
            "data": [
                {"name": str(row[cat_col]), "value": round(float(row[num_col]), 4)}
                for _, row in grouped.iterrows()
            ],
            "xKey": "name",
            "yKey": "value",
            "xLabel": cat_col,
            "yLabel": f"Avg {num_col}"
        })
    
    # Distribution / histogram for top numeric col
    if numeric_cols:
        col = numeric_cols[0]
        series = df[col].dropna()
        hist, edges = np.histogram(series, bins=20)
        charts.append({
            "type": "histogram",
            "title": f"Distribution of {col}",
            "data": [
                {"range": f"{round(float(edges[i]),1)}-{round(float(edges[i+1]),1)}", "count": int(hist[i])}
                for i in range(len(hist))
            ],
            "xKey": "range",
            "yKey": "count",
            "xLabel": col,
            "yLabel": "Count"
        })
    
    # Scatter plot for top correlated pair
    if len(numeric_cols) >= 2:
        c1, c2 = numeric_cols[0], numeric_cols[1]
        scatter_df = df[[c1, c2]].dropna().head(300)
        charts.append({
            "type": "scatter",
            "title": f"{c1} vs {c2}",
            "data": [
                {"x": round(float(row[c1]), 4), "y": round(float(row[c2]), 4)}
                for _, row in scatter_df.iterrows()
            ],
            "xKey": "x",
            "yKey": "y",
            "xLabel": c1,
            "yLabel": c2
        })
    
    # Pie chart for categorical distribution
    if categorical_cols:
        col = categorical_cols[0]
        vc = df[col].value_counts().head(8)
        charts.append({
            "type": "pie",
            "title": f"Distribution of {col}",
            "data": [{"name": str(k), "value": int(v)} for k, v in vc.items()],
            "nameKey": "name",
            "valueKey": "value"
        })
    
    return charts


def run_full_analysis(filepath, ext, lightweight=False):
    """Run full or lightweight analysis. Lightweight skips heavy ML for chat speed."""
    df = load_dataframe(filepath, ext)
    
    # For large files in lightweight mode, sample for speed
    if lightweight and len(df) > 10000:
        df = df.sample(n=10000, random_state=42)
    
    numeric_cols, categorical_cols, datetime_cols = detect_column_types(df)
    
    stats_data = basic_statistics(df, numeric_cols)
    
    if lightweight:
        # Skip IsolationForest (expensive) for chat
        outlier_info = {}
        anomaly_rows = []
        for col in numeric_cols[:5]:
            series = df[col].dropna()
            if len(series) == 0: continue
            q1, q3 = series.quantile(0.25), series.quantile(0.75)
            iqr = q3 - q1
            lower, upper = q1 - 1.5*iqr, q3 + 1.5*iqr
            outliers = series[(series < lower) | (series > upper)]
            outlier_info[col] = {
                "count": int(len(outliers)),
                "pct": round(len(outliers)/len(series)*100, 2),
                "lower_bound": round(float(lower), 4),
                "upper_bound": round(float(upper), 4)
            }
    else:
        outlier_info, anomaly_rows = detect_anomalies(df, numeric_cols)
    
    corr_matrix, top_correlations = correlation_analysis(df, numeric_cols)
    trends, peak_insights = trend_analysis(df, numeric_cols, datetime_cols)
    cat_stats = categorical_analysis(df, categorical_cols)
    
    charts = [] if lightweight else prepare_chart_data(df, numeric_cols, categorical_cols, datetime_cols)
    
    return {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": df.columns.tolist(),
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
        "datetime_cols": datetime_cols,
        "statistics": stats_data,
        "outliers": outlier_info,
        "anomaly_rows": anomaly_rows if not lightweight else [],
        "correlations": {
            "matrix": corr_matrix,
            "top_pairs": top_correlations
        },
        "trends": trends,
        "peak_insights": peak_insights,
        "categorical_analysis": cat_stats,
        "charts": charts,
        "missing_summary": df.isnull().sum().to_dict(),
        "total_missing": int(df.isnull().sum().sum()),
        "preview": df.head(5).to_dict(orient='records')
    }
