import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle

df = pd.read_csv('dataset.csv')

X = df[['x1', 'x2', 'x3']]
y = df['y']

model = LinearRegression()
model.fit(X, y)

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model telah dilatih dan disimpan jadi model.pkl")
