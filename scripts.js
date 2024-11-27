  // ************************************** ROS initialization and connection **************************************

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
  
  // Suscribirse al topic /odom para obtener las velocidades
  const odomTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/odom',
    messageType: 'nav_msgs/msg/Odometry'
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
  
    /*
    console.log('Velocidades recibidas:', {
      lineal: velLineal,
      angular: velAngular
    });
    */
  });

  

  // ************************************** DECLARATIONS **************************************

  // Configurar sensibilidad
  let maxVelLineal = 1.0;    // m/s
  let maxVelAngular = 1.0;   // rad/s
  const noiseThreshold = 0.01; // 
  
  // HTML objects
  const velLinealSpan = document.getElementById('vel_lineal');
  const velAngularSpan = document.getElementById('vel_angular');
  const joystickDiv = document.getElementById('joystick');
  const velocidadesDiv = document.getElementById('velocidades');
  const manualBtn = document.getElementById('manualBtn');
  const automaticoBtn = document.getElementById('automaticoBtn');
  const configuracionBtn = document.getElementById('configuracionBtn');
  const configModal = document.getElementById('configModal');
  const closeModal = document.getElementById('closeModal');
  const saveConfigBtn = document.getElementById('saveConfigBtn');

  // Crear el joystick usando nipplejs
  const joystick = nipplejs.create({
    zone: joystickDiv,
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'blue'
  });
  
  // Función para redondear a 0 si el valor es menor que el umbral de ruido
  function filtrarRuido(valor, umbral) {
    return Math.abs(valor) < umbral ? 0 : valor;
  }
  


  // ************************************** BUTTOMS EVENTS **************************************

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
    //activarModoAutomatico(); TODO
    console.log('Modo Automático Activado');
  });
  
  // Enviar velocidad en función de los movimientos del joystick
  joystick.on('move', (event, data) => {
    const velLineal = data.distance / 100 * maxVelLineal * Math.sin(data.angle.radian);
    const velAngular = data.distance / 100 * maxVelAngular * Math.cos(data.angle.radian);
  
    const mensajeTwist = new ROSLIB.Message({
      linear: { x: velLineal*2, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: velAngular*2 }
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
    maxVelLineal = parseFloat(document.getElementById('maxVelLineal').value);
    maxVelAngular = parseFloat(document.getElementById('maxVelAngular').value);

    // Actualizar las variables globales o enviarlas al robot
    console.log('Nuevos Parámetros:', { maxVelLineal, maxVelAngular });

    // Cerrar el modal
    configModal.style.display = 'none';
  });
