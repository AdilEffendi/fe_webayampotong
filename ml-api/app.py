from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array([[data['utang'], data['hari_raya'], data['margin_ayam'], data['log_ayam_terjual'], data['interaksi_ayam_margin']]])
    pred_log = model.predict(features)
    epsilon = 1e-5
    pred = np.exp(pred_log) - epsilon
    return jsonify({'prediction': float(pred[0])})

@app.route('/prediksi2025', methods=['GET'])
def prediksi_2025():
    df_2025 = pd.read_csv('data_mingguan_2025ni.csv')
    epsilon = 1e-5
    df_2025['margin_ayam'] = df_2025['harga_per_ekor'] - df_2025['modal_per_ekor']
    df_2025['log_ayam_terjual'] = np.log1p(df_2025['ayam_terjual'])
    df_2025['interaksi_ayam_margin'] = df_2025['ayam_terjual'] * df_2025['margin_ayam']
    X_2025 = df_2025[['utang', 'hari_raya', 'margin_ayam', 'log_ayam_terjual', 'interaksi_ayam_margin']]
    df_2025['prediksi_keuntungan'] = np.exp(model.predict(X_2025)) - epsilon
    result = []
    for i, row in df_2025.iterrows():
        result.append({
            "minggu": f"M-{i+1}",
            "prediksi_keuntungan": float(row['prediksi_keuntungan']),
            "hari_raya": int(row['hari_raya'])
        })
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
