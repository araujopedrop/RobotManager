from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

# Inicializar la aplicación Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://0.0.0.0:8000"}})

# Conexión a MongoDB
client = MongoClient('mongodb://localhost:27017/')  # Cambia la URL si MongoDB está en otro servidor
db = client.RobotManager  # Base de datos RobotManager
config_collection = db.configurations  # Colección configurations

# Ruta para obtener la configuración
@app.route('/config', methods=['GET'])
def get_config():
    config = config_collection.find_one()  # Obtiene el primer documento de la colección
    if config:
        return jsonify({
            'linear_vel': config.get('linear_vel', 1),  # Velocidad lineal predeterminada: 1
            'angular_vel': config.get('angular_vel', 1)  # Velocidad angular predeterminada: 1
        }), 200
    else:
        return jsonify({'message': 'No se encontró configuración'}), 404

# Ruta para guardar o actualizar la configuración
@app.route('/config', methods=['POST'])
def save_config():
    data = request.json  # Obtiene los datos enviados desde el frontend
    if not data or 'linear_vel' not in data or 'angular_vel' not in data:
        return jsonify({'message': 'Datos inválidos'}), 400

    # Inserta o actualiza la configuración en la colección
    config_collection.update_one({}, {'$set': {
        'linear_vel': data['linear_vel'],
        'angular_vel': data['angular_vel']
    }}, upsert=True)  # upsert=True crea un nuevo documento si no existe

    return jsonify({'message': 'Configuración guardada correctamente'}), 200

# Iniciar el servidor Flask
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Cambia el puerto si es necesario
