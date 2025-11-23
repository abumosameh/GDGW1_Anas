# This is a Flask application that serves as an API endpoint for querying data from Google BigQuery.

import os
import numpy as np
from flask import Flask, jsonify
from flask_cors import CORS
from google.cloud import bigquery
from sklearn.linear_model import LinearRegression
# We removed PolynomialFeatures to stop the "crash to zero" effect
from sklearn.metrics import r2_score

app = Flask(__name__)
CORS(app)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "keys/service-account.json"


@app.route("/api/bq")
def get_tech_trends():
    client = bigquery.Client()

    # Query last 5 years
    query = """
        SELECT
            EXTRACT(YEAR FROM creation_date) AS year,
            tag,
            COUNT(*) as post_count
        FROM
            `bigquery-public-data.stackoverflow.posts_questions`,
            UNNEST(SPLIT(tags, '|')) as tag
        WHERE
            EXTRACT(YEAR FROM creation_date) >= 2019
            AND EXTRACT(YEAR FROM creation_date) < 2024
            AND tag IN ('python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust', 'sql')
        GROUP BY
            year, tag
        ORDER BY
            year ASC
    """

    rows = client.query(query).result()

    processed_data = {}
    for row in rows:
        tag = row.tag
        year = row.year
        count = row.post_count

        if tag not in processed_data:
            processed_data[tag] = {"years": [], "counts": []}

        processed_data[tag]["years"].append(year)
        processed_data[tag]["counts"].append(count)

    final_results = []

    # Apply Linear Regression (Safer, no crash to zero)
    for tag, data in processed_data.items():
        years_raw = np.array(data["years"])
        start_year = years_raw[0]
        X = (years_raw - start_year).reshape(-1, 1)
        y = np.array(data["counts"])

        # FIX: Use simple LinearRegression instead of Polynomial
        model = LinearRegression()
        model.fit(X, y)

        # Calculate Accuracy
        y_pred_historical = model.predict(X)
        accuracy = r2_score(y, y_pred_historical) * 100

        # Predict 2025
        future_year_normalized = np.array([[2025 - start_year]])
        prediction = model.predict(future_year_normalized)[0]

        # Calculate Growth
        slope = model.coef_[0]

        if slope > 500:
            verdict = "Skyrocketing 🚀"
        elif slope > 0:
            verdict = "Growing Steady 📈"
        elif slope > -500:
            verdict = "Plateauing ⚖️"
        else:
            verdict = "Declining 📉"

        # Add prediction
        final_years = data["years"] + [2025]
        final_counts = data["counts"] + [int(prediction)]

        final_results.append({
            "language": tag,
            "years": final_years,
            "counts": final_counts,
            "growth_rate": round(slope, 2),
            "verdict": verdict,
            "prediction": int(prediction),
            "accuracy": round(accuracy, 1)
        })

    return jsonify({"trends": final_results})


if __name__ == "__main__":
    app.run(port=5000, debug=True)