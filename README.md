# fnaBOT
Este proyecto fue creado con el propósito de establecer un "Bot" para las salas públicas y campeonato de la comunidad ***[FÓRMULA NACIONAL ARGENTINA](https://discord.gg/wDN3kxY5rD)***.

Cuenta con los siguientes módulos

## bot_funcionalAuth
Cuenta con un código que, utilizando las funciones nativas proporcionadas por [Haxball Headless Host](https://github.com/haxball/haxball-issues/wiki/Headless-Host), abarca algoritmos que permiten:
 - La gestión de carreras (definición de vueltas, control de posiciones, display de resultados, etc.)
 - La gestión de clasificaciones (definición de minutos, control de posiciones, display de resultados en tiempo real y posiciones finales)
 - La gestión de campeonatos *in-game* (permite llevar un registro de los puntos otorgados a los jugadores si la sala se encuentra en "modo campeonato")
 - La gestión de estadísticas de cada jugador y circuito (permite consulta de las estadísticas y records de circuito de cada usuario, previamente registrado, así como el logging de cada usuario al ingresar a la sala)

## server
Componente que permite arrancar la sala desde la línea de comandos del IDE o desde un servidor remoto, facilitando la modularización y extensibilidad del proyecto.
Este archivo posee las siguientes responsabilidades:
 - Configuración y Conexión a MongoDB:
   - define esquemas de Mongoose para modelar los datos.
   - establece una conexión a MongoDB Atlas.
 - Interacción con Discord:
   - se utiliza discord.js para enviar mensajes y notificaciones a Discord mediante webhooks.
 - Automatización del navegador con Puppeteer:
   - se utiliza Puppeteer para cargar la página de Haxball en modo headless.
   - expone funciones para ser llamadas desde el [script del navegador](https://github.com/velazquez91196/fnaBOT/blob/main/bot_funcionalAuth.js).
 - Exposición de funciones para el script del navegador:
   - Expone funciones para registrar usuarios, iniciar sesión, actualizar estadísticas, enviar resultados de carreras a Discord, y más.
 - Definición de funciones para la lógica del Juego:
   - Define funciones para manejar eventos del juego y enviar notificaciones a Discord.

## circuitos
 - Definición de Circuitos: define circuitos de carreras en formato JSON con información detallada sobre la geometría y las propiedades físicas del circuito y los jugadores.
 - Configuración de Circuitos: configura los circuitos definidos en JSON, asignando propiedades adicionales como el nombre, las coordenadas de la meta, los colores de los jugadores, las posiciones de reinicio, si tiene boxes, etc.
