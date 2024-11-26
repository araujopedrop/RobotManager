// Inicialización del ROS
const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'  // Cambia 'localhost' si rosbridge corre en otra IP
  });
  
  ros.on('connection', function() {
    console.log('Conectado a ROSBridge');
  });
  
  ros.on('error', function(error) {
    console.error('Error conectando a ROSBridge:', error);
  });
  
  ros.on('close', function() {
    console.log('Conexión a ROSBridge cerrada');
  });
  
  // Definir el topic cmd_vel para enviar velocidades
  const cmdVelTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/msg/Twist'
  });
  
  // Definir el topic de la cámara
  const imageTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/camera/image_raw',
    messageType: 'sensor_msgs/msg/Image'
  });
  
  // Crear un elemento de imagen para mostrar la imagen de la cámara
  const imgElement = document.getElementById('camera-image');
  
  // Función para convertir los datos de la imagen de ROS a una imagen HTML
  function convertImageDataToBase64(imageData) {
    const base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imageData)));
    return 'data:image/jpeg;base64,' + base64String;
  }
  
  // Suscribirse al topic de la cámara
  imageTopic.subscribe((message) => {
    // Convertir los datos de la imagen en base64
    const base64Image = convertImageDataToBase64(message.data);
  
    // Actualizar la imagen en el HTML
    imgElement.src = base64Image;
    console.log('Imagen recibida y mostrada en la web');
  });
  
  // Suscribirse al topic /odom para obtener las velocidades
  const odomTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/odom',
    messageType: 'nav_msgs/msg/Odometry'
  });
  
  // Configurar sensibilidad
  const maxVelLineal = 1.0;   // Velocidad máxima lineal en m/s
  const maxVelAngular = 1.0;  // Velocidad máxima angular en rad/s
  const noiseThreshold = 0.01; // Umbral para eliminar ruido en velocidades
  
  // Referencias a los elementos HTML
  const velLinealSpan = document.getElementById('vel_lineal');
  const velAngularSpan = document.getElementById('vel_angular');
  const joystickDiv = document.getElementById('joystick');
  const velocidadesDiv = document.getElementById('velocidades');
  const manualBtn = document.getElementById('manualBtn');
  const automaticoBtn = document.getElementById('automaticoBtn');
  
  // Función para redondear a 0 si el valor es menor que el umbral de ruido
  function filtrarRuido(valor, umbral) {
    return Math.abs(valor) < umbral ? 0 : valor;
  }
  
  // Modo Manual
  manualBtn.addEventListener('click', () => {
    joystickDiv.style.display = 'block';
    velocidadesDiv.style.display = 'block';
    console.log('Modo Manual Activado');
  });
  
  // Modo Automático
  automaticoBtn.addEventListener('click', () => {
    joystickDiv.style.display = 'none';
    //velocidadesDiv.style.display = 'none';
    //activarModoAutomatico();
    console.log('Modo Automático Activado');
  });
  
  // Crear el joystick usando nipplejs
  const joystick = nipplejs.create({
    zone: joystickDiv,
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'blue'
  });
  
  // Enviar velocidad en función de los movimientos del joystick
  joystick.on('move', (event, data) => {
    const velLineal = data.distance / 100 * maxVelLineal * Math.sin(data.angle.radian);
    const velAngular = data.distance / 100 * maxVelAngular * Math.cos(data.angle.radian);
  
    const mensajeTwist = new ROSLIB.Message({
      linear: { x: velLineal, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: velAngular }
    });
  
    cmdVelTopic.publish(mensajeTwist);
    console.log('Velocidad enviada:', mensajeTwist);
  });
  
  // Detener el robot cuando el joystick regresa al centro
  joystick.on('end', () => {
    const mensajeTwist = new ROSLIB.Message({
      linear: { x: 0.0, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: 0.0 }
    });
    cmdVelTopic.publish(mensajeTwist);
    console.log('Robot detenido');
  });
  
  // Actualizar las velocidades visualizadas en pantalla desde /odom
  odomTopic.subscribe((message) => {
    let velLineal = message.twist.twist.linear.x;  // Velocidad lineal en x
    let velAngular = message.twist.twist.angular.z;  // Velocidad angular en z
  
    // Filtrar ruido en velocidades
    velLineal = filtrarRuido(velLineal, noiseThreshold);
    velAngular = filtrarRuido(velAngular, noiseThreshold);
  
    // Actualizar la información en pantalla
    velLinealSpan.textContent = velLineal.toFixed(2);
    velAngularSpan.textContent = velAngular.toFixed(2);
  
    console.log('Velocidades recibidas:', {
      lineal: velLineal,
      angular: velAngular
    });
  });
  
  const configuracionBtn = document.getElementById('configuracionBtn');
  const configModal = document.getElementById('configModal');
  const closeModal = document.getElementById('closeModal');
  const saveConfigBtn = document.getElementById('saveConfigBtn');


// Abrir el modal al presionar "Configuración"
configuracionBtn.addEventListener('click', () => {
  configModal.style.display = 'flex';
});

// Cerrar el modal al presionar la "X"
closeModal.addEventListener('click', () => {
  configModal.style.display = 'none';
});

// Guardar los parámetros al presionar "Guardar"
saveConfigBtn.addEventListener('click', () => {
  const maxVelLineal = parseFloat(document.getElementById('maxVelLineal').value);
  const maxVelAngular = parseFloat(document.getElementById('maxVelAngular').value);

  // Actualizar las variables globales o enviarlas al robot
  console.log('Nuevos Parámetros:', { maxVelLineal, maxVelAngular });

  // Cerrar el modal
  configModal.style.display = 'none';
});
