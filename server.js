import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import geoIp2 from 'geoip-lite2';
import { configDotenv } from 'dotenv';
//import fetch from 'node-fetch';
//import FormData from 'form-data';
import { WebhookClient, EmbedBuilder, Client, Events, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

// Webhooks discord
const webhookClient = new WebhookClient({ url: process.env.webhookAdminsUrl });
const webhookClientCarreras = new WebhookClient({ url: process.env.webhookCarrerasUrl});
const webhookMonitoreoIP = new WebhookClient({ url: process.env.webhookMonitoreoIPUrl});
const webhookRecords = new WebhookClient({ url: process.env.webhookRecordsUrl});
const webhookBaneados = new WebhookClient({ url: process.env.webhookBaneadosUrl});
// Conexión DS bot 
//const client = new Client({ intents: [GatewayIntentBits.Guilds] }); 
//const cooldowns = new Map(); // Línea para definir la variable cooldowns
//client.once(Events.ClientReady, readyClient => {
//	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
//});

// Log in to Discord with your client's token
//client.login(token);

// const topCommand = new SlashCommandBuilder()
//   .setName('top')
//   .setDescription('Muestra el ranking de puntos de los usuarios');

// // Registra el comando al iniciar el bot
// client.on('ready', async () => {
//   await client.application.commands.create(topCommand);
//   //console.log('Comando /top registrado');
// });

// // Maneja la interacción con el comando
// client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand() || interaction.commandName !== 'top') return;

//   // Control de cooldown para evitar spam
//   const now = Date.now();
//   const cooldownAmount = 10 * 1000; // 10 segundos de cooldown

//   if (cooldowns.has(interaction.user.id)) {
//     const expirationTime = cooldowns.get(interaction.user.id) + cooldownAmount;
//     if (now < expirationTime) {
//       const timeLeft = (expirationTime - now) / 1000;
//       return interaction.reply(`Por favor, espera ${timeLeft.toFixed(1)} segundos antes de volver a usar el comando.`);
//     }
//   }

//   // Establece el tiempo de cooldown
//   cooldowns.set(interaction.user.id, now);

//   try {
//     // Obtiene los usuarios ordenados por puntos en orden descendente, limitando al top 30.
//     const topUsers = await User.find()
//       .sort({ 'stats.puntos': -1 })
//       .limit(50)
//       .exec();

//     // Genera el mensaje de ranking.
//     let rankingMessage = '🏆 **Top 50 Puntos** 🏆\n';
//     topUsers.forEach((user, index) => {
//       let medalEmoji = '';
//       if (index === 0) {
//         medalEmoji = '🥇'; // Oro
//       } else if (index === 1) {
//         medalEmoji = '🥈'; // Plata
//       } else if (index === 2) {
//         medalEmoji = '🥉'; // Bronce
//       } else {
//         medalEmoji = `**#${index + 1}**`; // Para el resto
//       }

//       rankingMessage += `${medalEmoji} ${user.usuario}: ${user.stats.puntos} puntos\n`;
//     });

//     // Envía el mensaje de ranking en el canal donde se usó el comando.
//     await interaction.reply({ content: rankingMessage, ephemeral: false }); 
//   } catch (error) {
//     console.error('Error al obtener el top de puntos:', error);
//     await interaction.reply('Hubo un error al obtener el ranking. Inténtalo de nuevo más tarde.');
//   }
// });


async function sendRaceResultsEmbed(webhookClientCarreras, raceResults, _Circuit) {
   // Asegurarse de que raceResults es un array
    if (!Array.isArray(raceResults)) {
      raceResults = [raceResults]; // Convierte a un array si es un solo objeto
    }
  const f1ScoringSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]; // Puntos para las primeras 10 posiciones

  const standings = raceResults.map((player, index) => {
      const playerName = player.name;  // Nombre del jugador
      const playerTime = player.time; // Tiempo del jugador
      const pointsEarned = (index + 1 <= 10) ? `(+${f1ScoringSystem[index]} puntos)` : "Sin puntos";
      const fastestLapBonus = player.name === (_Circuit.BestTime ? _Circuit.BestTime[1] : null) ? " (+1 Vuelta rápida)" : "";

      return `${index + 1}. **${playerName}** | ${playerTime} | ${pointsEarned}${fastestLapBonus}`;
  }).join('\n');

  // Extraer los tres primeros para el podio
  const podium = raceResults.slice(0, 3).map((player, index) => {
      return `${index + 1}️⃣ **${player.name}**`; // Usar directamente el nombre del jugador
  });

  // Extraer la vuelta rápida
  const fastestLap = _Circuit.BestTime && _Circuit.BestTime.length > 1 ? {
      usuario: _Circuit.BestTime[1],
      tiempo: _Circuit.BestTime[0]
  } : null;

  const nombreCircuito = _Circuit.Name;

  // Crear el embed de resultados
  const embed = new EmbedBuilder()
      .setTitle('🏁 Resultados de la Carrera de Fórmula 1')
      .setDescription(`¡Finalizó una nueva carrera de FNA Public Host! - Circuito: ${nombreCircuito}`)
      .addFields(
          {
              name: 'Clasificación de la Carrera',
              value: standings || 'No hay resultados.',
              inline: false
          },
          {
              name: '🥇 Podio',
              value: podium.length > 0 ? podium.join('\n') : 'N/A',
              inline: false
          },
          {
              name: '⏱️ Vuelta Rápida',
              value: fastestLap ? `**${fastestLap.usuario}** - ${fastestLap.tiempo.toFixed(3)} segundos` : 'No disponible',
              inline: false
          }
      )
      .setColor('#FF0000')
      .setFooter({
          text: 'FNA - La comunidad #1 de Hax Racing',
          iconURL: 'https://media.discordapp.net/attachments/1298080114994839726/1300490477950468156/fna_new_png.png?ex=6723aaa3&is=67225923&hm=752c97ca84f08eb472dbc9516eeb1393fd9eaa0f4ede3289a68be2c0aeb291a3&=&format=webp&quality=lossless&width=100&height=100'
      })
      .setTimestamp();

  // Enviar el embed usando el webhook
  webhookClientCarreras.send({
      username: 'FNA - Formula Nacional Argentina',
      avatarURL: 'https://media.discordapp.net/attachments/1298080114994839726/1300490477950468156/fna_new_png.png?ex=6723aaa3&is=67225923&hm=752c97ca84f08eb472dbc9516eeb1393fd9eaa0f4ede3289a68be2c0aeb291a3&=&format=webp&quality=lossless&width=50&height=50',
      embeds: [embed]
  });
}

async function sendAdminRequestToDiscord(webhookClient, username, razon) {
  const embed = new EmbedBuilder()
      .setTitle("Solicitud de Admin")
      .setDescription(`Usuario: ${username}\nRazón: ${razon} - @Staff`)
      .setColor(0xff0000) // Color rojo para la solicitud
      .setTimestamp();

  webhookClient.send({ embeds: [embed] })
      .then(() => console.log("Solicitud de admin enviada a Discord"))
      .catch(err => console.error("Error al enviar solicitud de admin a Discord:", err));
}

async function enviarBanADiscord(webhookBaneados, username, id, conn, mod) {
    const embed = new EmbedBuilder()
        .setTitle("Usuario Baneado")
        .setDescription(`Usuario: ${username}\nID Haxball: ${id}\nConn: ${conn}\nModerador: ${mod}`)
        .setColor(0xff0000) // Color rojo para la solicitud
        .setTimestamp();

    webhookBaneados.send({ embeds: [embed] })
        .then(() => console.log("Usuario baneado enviado a Discord"))
        .catch(err => console.error("Error al enviar usuario baneado a Discord:", err));
}

async function enviarIPaDiscord(webhookMonitoreoIP, username, conn) {
  let ipUsuario = Buffer.from(conn, 'hex').toString('utf8');
  const geo = geoIp2.lookup(ipUsuario);
  let descripcion = ""

  if (username == "kuadriplejiko") {
    descripcion = `Ingresó el usuario ${username}, con IP 181.46.50.70 - localizado en Buenos Aires, AR - Conn: 3138312E34362E35302E3730`;
    const embed = new EmbedBuilder()
    .setTitle("Monitoreo")
    .setDescription((descripcion))
    .setColor(0xff0000)
    .setTimestamp(); 
    webhookMonitoreoIP.send({ embeds: [embed] })
        .then(() => console.log("Se envío información del usuario ", username))
        .catch(err => console.error("Error al enviar información de usuario entrante a Discord", err));
    return;
  }

  if(geo) {
    const ciudad = geo.city;
    const pais = geo.country;
    descripcion = `Ingresó el usuario ${username}, con IP ${ipUsuario} - localizado en ${ciudad}, ${pais} - Conn: ${conn}`;
  } else {
    descripcion = `Ingresó el usuario ${username}, con IP ${ipUsuario} - Conn: ${conn}`;
  }

  const embed = new EmbedBuilder()
  .setTitle("Monitoreo")
  .setDescription((descripcion))
  .setColor(0xff0000)
  .setTimestamp(); 
  webhookMonitoreoIP.send({ embeds: [embed] })
      .then(() => console.log("Se envío información del usuario ", username))
      .catch(err => console.error("Error al enviar información de usuario entrante a Discord", err));
}

async function enviarVueltaRapidaDiscord(webhookRecords, usuario, circuito, tiempo) {
  const embed = new EmbedBuilder()
      .setTitle("¡Nuevo Récord de host! | New host record!")
      .setDescription(`🏎️ **Piloto:** ${usuario}\n🌍 **Circuito:** ${circuito}\n⏱️ **Tiempo:** ${tiempo}`)
      .setColor(0x00ff00) 
      .setTimestamp();

  try {
    await webhookRecords.send({ embeds: [embed] });
    console.log("Anuncio de nuevo récord global enviado a Discord");
  } catch (err) {
    console.error("Error al enviar anuncio de récord global a Discord:", err);
  }
}


// Conectar a MongoDB Atlas usando Mongoose
const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error conectando a MongoDB Atlas:", err));

// Definir el esquema de vueltas
const lapSchema = new mongoose.Schema({
  usuario: String,
  circuito: String,
  tiempo: Number,  // Tiempo de vuelta en segundos o milisegundos
  fecha: { type: Date, default: Date.now }  // Fecha en que se almacenó la vuelta
});


// Definir el esquema de usuarios con las estadísticas adicionales
const userSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  pais: { type: String },  // País del jugador,
  dinero: { type: Number }, 
  avatar: { type: String, default: '00' },  // Avatar (dos caracteres o números)

  stats: {
      carrerasCompletadas: { type: Number, default: 0 },
      polepositions: { type: Number, default: 0 },
      carrerasGanadas: { type: Number, default: 0 },
      carrerasPodio: { type: Number, default: 0 },
      carrerasTop10: { type: Number, default: 0 },
      puntos: { type: Number, default: 0 },
      valor: { type: Number },
      valorFinal: { type: Number }
  },

  rankingVueltaRapida: [{
      circuito: String,
      tiempo: Number
  }]
});


const bannedUserSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Nombre del usuario baneado
  conn: { type: String, required: true, unique: true },  // Identificador único de conexión
  banDate: { type: Date, default: Date.now },  // Fecha del baneo
});

// Esquema para los récords globales de vuelta rápida
const globalRecordSchema = new mongoose.Schema({
    circuito: { type: String, required: true, unique: true }, // Le puse unique para evitar duplicaciones
    usuario: { type: String, required: true },  // Usuario que tiene el récord
    tiempo: { type: Number, required: true },   // Tiempo de vuelta en segundos o milisegundos
    fecha: { type: Date, default: Date.now }    // Fecha en que se estableció el récord
  });

const ofertaSchema = new mongoose.Schema({
    jefeDeEquipo: {
        type: String,
        required: true, // El usuario que realiza la oferta
    },
    receptor: {
        type: String,
        required: true, // El piloto que recibe la oferta
    },
    monto: {
        type: Number,
        required: true, // Monto ofrecido para fichar al piloto
        min: 1,
    },
    sueldo: {
        type: Number,
        required: true, // Sueldo por carrera ofrecido
        min: 1,
    },
    escuderia: {
        type: String,
        required: true, // Nombre de la escudería que hace la oferta
    },
    fecha: {
        type: Date,
        default: Date.now, // Fecha de la oferta
    }
});

const escuderiaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },  // Nombre de la escudería
  jefeDeEquipo: { type: String, default: '' },  // Nombre del jefe de equipo
  sueldoJefe: { type: Number, default: 0 },  // Sueldo del jefe de equipo
  campeonatos: { type: Number, default: 0 },  // Cantidad de campeonatos ganados
  carrerasTerminadas: { type: Number, default: 0 },  // Carreras terminadas
  carrerasGanadas: { type: Number, default: 0 },  // Carreras ganadas
  poles: { type: Number, default: 0 },  // Cantidad de poles obtenidas
  podios: { type: Number, default: 0 },  // Cantidad de podios
  puntos: { type: Number, default: 0 },  // Total de puntos acumulados
  dinero: { type: Number, default: 0 },  // Dinero de la escudería (presupuesto)

  // Piloto 1
  piloto1: {
      nombre: { type: String, default: '' },  // Nombre del piloto 1
      estadisticas: {
          carrerasTerminadas: { type: Number, default: 0 },
          carrerasGanadas: { type: Number, default: 0 },
          poles: { type: Number, default: 0 },
          podios: { type: Number, default: 0 },
          puntos: { type: Number, default: 0 }
      },
      sueldo: { type: Number, default: 0 }  // Sueldo del piloto 1
  },

  // Piloto 2
  piloto2: {
      nombre: { type: String, default: '' },  // Nombre del piloto 2
      estadisticas: {
          carrerasTerminadas: { type: Number, default: 0 },
          carrerasGanadas: { type: Number, default: 0 },
          poles: { type: Number, default: 0 },
          podios: { type: Number, default: 0 },
          puntos: { type: Number, default: 0 }
      },
      sueldo: { type: Number, default: 0 }  // Sueldo del piloto 2
  }
});

const User = mongoose.model('User', userSchema);
const GlobalRecord = mongoose.model('GlobalRecord', globalRecordSchema);
const BannedUser = mongoose.model('BannedUser', bannedUserSchema);
const Lap = mongoose.model('Lap', lapSchema);
const Oferta = mongoose.model('Oferta', ofertaSchema);
const Escuderia = mongoose.model('Escuderia', escuderiaSchema)

async function bot() {
  const browser = await puppeteer.launch({
    // executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('Se abre el browser');

  const page = await browser.newPage();
  await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });

  console.log('Se abre el headless');

  // Exponer la función sendRaceResultsEmbed para ser llamada desde el script en el navegador
  await page.exposeFunction('sendRaceResultsEmbed', async (raceResults, _Circuit) => {
    // Llama a la función sendRaceResultsEmbed y pasa los parámetros necesarios
    await sendRaceResultsEmbed(webhookClientCarreras, raceResults, _Circuit);
  });

  await page.exposeFunction('sendAdminRequestToDiscord', async (username, razon) => {
    // Llama a la función sendRaceResultsEmbed y pasa los parámetros necesarios
    await sendAdminRequestToDiscord(webhookClient, username, razon);
  });

  await page.exposeFunction('enviarIPaDiscord', async (username, conn) => {
    await enviarIPaDiscord(webhookMonitoreoIP, username, conn);
  });

  await page.exposeFunction('enviarBanADiscord', async (username, id, conn, mod) => {
    await enviarBanADiscord(webhookBaneados, username, id, conn, mod);
});

  await page.exposeFunction('enviarVueltaRapidaDiscord', async (usuario, circuito, tiempo) => {
    await enviarVueltaRapidaDiscord(usuario, circuito, tiempo);
  });

  // Exponer la función saveLap para ser llamada desde el script en el navegador
  await page.exposeFunction('saveLap', async (usuario, circuito, tiempo) => {
    try {
        if (tiempo <= 1) {
            return { newRecord: false, difference: null };
        }

        // Busca la vuelta rápida existente en la colección global y en el perfil del usuario
        const [user, globalRecord] = await Promise.all([
            User.findOne({ usuario: usuario }),
            GlobalRecord.findOne({ circuito: circuito })
        ]);

        // Actualizar récord global
        let newGlobalRecord = false;
        let globalDifference = 0;

        if (!globalRecord || tiempo < globalRecord.tiempo) {
            newGlobalRecord = true;
            globalDifference = globalRecord ? globalRecord.tiempo - tiempo : 0;

            if (globalRecord) {
                globalRecord.tiempo = tiempo;
                globalRecord.usuario = usuario;
                await globalRecord.save();
            } else {
                await new GlobalRecord({ circuito, tiempo, usuario }).save();
            }
        }

        // Actualizar récord del usuario
        const userRecord = user.rankingVueltaRapida.find(record => record.circuito === circuito);
        let userDifference = 0;
        let newUserRecord = false;

        if (!userRecord) {
            user.rankingVueltaRapida.push({ circuito, tiempo });
            newUserRecord = true; // Establecer nuevo récord personal
        } else if (tiempo < userRecord.tiempo) {
            userDifference = userRecord.tiempo - tiempo;
            userRecord.tiempo = tiempo;
            newUserRecord = true; // Establecer nuevo récord personal
        } else {
            userDifference = tiempo - userRecord.tiempo; // No se mejora el récord
        }

        await user.save();

        return {
            newRecord: newUserRecord,
            difference: newUserRecord ? userDifference : userDifference,
            globalRecord: newGlobalRecord, // Para indicar si es un nuevo récord global
            previousGlobalHolder: globalRecord ? globalRecord.usuario : null // Obtener el poseedor anterior del récord global
        };
    } catch (err) {
        console.error("Error al guardar la vuelta en MongoDB:", err);
        return { error: true, message: "Error al guardar la vuelta." };
    }
});

await page.exposeFunction('loadBannedPlayers', async () => {
  try {
      const bannedUsers = await BannedUser.find(); // Obtener baneos de la base de datos
      //console.log("Lista de baneados cargada: ", bannedUsers);
      return bannedUsers.map(user => ({
          name: user.name,
          conn: user.conn
      }));
  } catch (err) {
      console.error('Error al cargar los baneos desde la base de datos:', err.message);
      return [];
  }
});


await page.exposeFunction('addBannedUser', async (name, conn) => {
  try {
      // Verifica si ya existe un usuario baneado con la misma conexión
      const existingUser = await BannedUser.findOne({ conn });
      if (existingUser) {
          throw new Error('El usuario ya está baneado');
      }

      // Crea un nuevo usuario baneado
      const newBannedUser = new BannedUser({
          name: name,
          conn: conn
      });

      // Guarda el nuevo usuario baneado en la base de datos
      await newBannedUser.save();
      console.log("Se baneó al usuario: ", name);
      return 'Usuario baneado.';
  } catch (err) {
      throw new Error('Error al agregar el usuario baneado: ' + err.message);
  }
});  
    
// Exponiendo la función para actualizar bannedPlayers
await page.exposeFunction('updateBannedPlayers', async () => {

  const bannedData = await BannedUser.find(); // Obtener jugadores baneados de la base de datos
  return bannedData.map(banned => ({
      name: banned.name,
      conn: banned.conn 
  }));
});

await page.exposeFunction('getOffersForPlayer', async (playerName) => {
  try {
      if (!playerName) {
          throw new Error("El nombre del jugador es obligatorio.");
      }

      const offers = await Oferta.find({ receptor: playerName });

      return offers; // Devuelve directamente el arreglo de ofertas
  } catch (err) {
      console.error(`Error al verificar las ofertas para ${playerName}:`, err);
      throw err; // Lanza el error para que el cliente lo capture
  }
});

// Exponer función para obtener información de la escudería de un jugador
await page.exposeFunction('getPlayerTeamInfo', async (playerName) => {
  try {
      if (!playerName) {
          console.error("Nombre de jugador no válido en getPlayerTeamInfo");
          return null;
      }

      const escuderiaColors = {
        "Alfa Romeo": 0xC13A3A, // Rojo más claro
        "McLaren": 0xFF6A13, // Naranja
        "Alpine": 0xFD4BC7, // Rosita
        "Aston Martin": 0x037A68, // Verde oscuro
        "Red Bull": 0x345CFF, // Azul eléctrico brillante
        "Ferrari": 0xFF0D05, // Rojo Ferrari
        "Lotus": 0xFBFF7A, // Verde oscuro
        "Williams": 0x005AA7, // Azul
        "Mercedes": 0x30D5C8, // Verde azulado metálico
        "Toro Rosso": 0x469BFF, // Azul eléctrico
        "Haas": 0xB4B7B4, // Gris
        "Porsche": 0xADD8E6, // Azul claro
        "Peugeot": 0xE6E6E6, // Gris claro
        "Jaguar": 0x006747, // Verde oscuro
        "Chevrolet": 0xF7C800, // Amarillo
        "Pagani": 0xe3e4e5, // Gris claro
        "BMW": 0xEBBB63, // Dorado
        "Sauber": 0x52E252, // Azul oscuro
        "Ford": 0x47A8E5, // Azul claro
        "Racing Bulls": 0X6692FF, // Azul claro
        "Audi": 0xF50537, 
        "Cadillac": 0xD50032, // Rojo Cadillac
        "Renault": 0xfcd205, // Amarillo
        "Caterham": 0xA1C435, // Verde brillante
        "Manor": 0xE45A20, // Rojo brillante
        "Lancia": 0x004C8C, // Azul Lancia
        "Fiat Sauber": 0x00A0E2, // Azul claro
        "Lamborghini": 0xd8a016, // Amarillo Lamborghini
        "Honda": 0xFF0000, // Rojo claro
        "Toyota": 0x00FF00, // Verde claro
        "Benetton": 0x71E6E6 // Azul claro
    };    

      // Buscar si el jugador pertenece a una escudería
      const team = await Escuderia.findOne({
          $or: [
              { jefeDeEquipo: playerName },
              { "piloto1.nombre": playerName },
              { "piloto2.nombre": playerName }
          ]
      });

      if (!team) {
          return null; // No pertenece a ninguna escudería
      }

      // Determinar rol y sueldo
      let rol = '';
      let sueldo = 0;

      if (team.jefeDeEquipo === playerName) {
          rol = 'Jefe de Equipo';
          sueldo = team.sueldoJefe;
      } else if (team.piloto1.nombre === playerName) {
          rol = 'Piloto 1';
          sueldo = team.piloto1.sueldo;
      } else if (team.piloto2.nombre === playerName) {
          rol = 'Piloto 2';
          sueldo = team.piloto2.sueldo;
      }

      // Retornar información del jugador, escudería y color
      return {
          nombre: playerName,
          escuderia: team.nombre,
          rol: rol,
          sueldo: sueldo,
          color: escuderiaColors[team.nombre] || 0xFFFFFF // Blanco por defecto si no hay color
      };
  } catch (err) {
      console.error(`Error al obtener información de la escudería para ${playerName}:`, err);
      return null;
  }
});



  // Exponer la función para registrar un nuevo usuario
  await page.exposeFunction('registerUser', async (usuario, password) => {
    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ usuario: usuario });
        if (existingUser) {
            return { success: false, message: "El usuario ya existe. Por favor, elige otro nombre." };
        }

        const nuevoUsuario = new User({
            usuario: usuario,
            password: password,
            stats: {
                carrerasCompletadas: 0,
                polepositions: 0,
                carrerasGanadas: 0,
                carrerasPodio: 0,
                carrerasTop10: 0,
                vueltasRapidas: 0,
                valor: 0,
                valorFinal: 0,
                puntos: 0,
                recordsVuelta: []
            }
        });

         await nuevoUsuario.save();
        console.log(`Usuario ${usuario} registrado exitosamente.`);
        return { success: true };
    } catch (err) {
        console.error(`Error al registrar el usuario ${usuario}:`, err);
        return { success: false, message: "Error al registrar el usuario. Inténtalo nuevamente." };
    }
});

  
  // Exponer la función para iniciar sesión
  await page.exposeFunction('loginUser', async (usuario, password) => {
    try {
        const user = await User.findOne({ usuario: usuario, password: password });
        if (user) {
            user.loggedIn = true;
            await user.save();
            //console.log(`${usuario} ha iniciado sesión.`);
            return { success: true };  // Retornamos un objeto en vez de solo true
        } else {
            //console.log(`Usuario o contraseña incorrectos para ${usuario}.`);
            return { success: false, message: 'Usuario o contraseña incorrectos.' };  // Retornamos un objeto con más información
        }
    } catch (err) {
        //console.error(`Error al iniciar sesión para ${usuario}:`, err);
        return { success: false, message: 'Error al iniciar sesión.' };  // Retornamos también el mensaje de error
    }
});

  // Exponer la función para obtener estadísticas de un usuario
  await page.exposeFunction('getUserStats', async (usuario) => {
    try {
      const user = await User.findOne({ usuario: usuario });
      if (user) {
        return user.stats;
      } else {
        console.log(`Usuario ${usuario} no encontrado.`);
        return null;
      }
    } catch (err) {
      console.error(`Error al obtener las estadísticas de ${usuario}:`, err);
      return null;
    }
  });


  await page.exposeFunction('getTopEscuderias', async () => {
    try {
        // Obtener las escuderías, ordenadas por puntos en orden descendente
        const escuderias = await Escuderia.find()
            .sort({ puntos: -1 }) // Ordenar por puntos de mayor a menor
            .limit(10); // Limitar a las 10 primeras

        // Mapear las escuderías a un formato más legible para el cliente
        return escuderias.map(esc => ({
            nombre: esc.nombre,
            puntos: esc.puntos,
            victorias: esc.carrerasGanadas,
            podios: esc.podios
        }));
    } catch (err) {
        console.error("Error al obtener las escuderías:", err);
        return [];
    }
});


  await page.exposeFunction('checkUserRegistered', async (usuario) => {
    try {
        const user = await User.findOne({ usuario: usuario });
        if (user) {
            return { registered: true, loggedIn: user.loggedIn };
        } else {
            return { registered: false };
        }
    } catch (err) {
        console.error("Error al verificar si el usuario está registrado:", err);
        throw err;
    }
});

// Función para obtener los récords de circuitos desde la base de datos
await page.exposeFunction('getCircuitRecords', async (playerName) => {
  try {
      // Obtener los récords globales
      const globalRecords = await GlobalRecord.find({}).lean();

      // Obtener los récords personales del usuario
      const user = await User.findOne({ usuario: playerName }).lean();
      const userRecords = user ? user.rankingVueltaRapida : [];

      return { globalRecords, userRecords };
  } catch (err) {
      console.error("Error al obtener los récords de circuitos:", err);
      return { error: "Error al obtener los récords de circuitos." };
  }
});

await page.exposeFunction('updateEscuderiaYPago', async (usuario, posicion, gananciaEscuderia, puntosGanados) => {
  try {
      // Buscar la escudería asociada al usuario
      const escuderia = await Escuderia.findOne({
          $or: [
              { jefeDeEquipo: usuario },
              { "piloto1.nombre": usuario },
              { "piloto2.nombre": usuario }
          ]
      });

      let sueldo = 0;
      let rol = ""; // Identificar si es jefe, piloto1 o piloto2

      if (escuderia) {
          // Identificar el rol del usuario en la escudería
          if (escuderia.jefeDeEquipo === usuario) {
              sueldo = escuderia.sueldoJefe;
              rol = "jefeDeEquipo";
          } else if (escuderia.piloto1.nombre === usuario) {
              sueldo = escuderia.piloto1.sueldo;
              rol = "piloto1";
          } else if (escuderia.piloto2.nombre === usuario) {
              sueldo = escuderia.piloto2.sueldo;
              rol = "piloto2";
          }

          // Actualizar el dinero de la escudería
          escuderia.dinero += gananciaEscuderia - sueldo;

          // Actualizar estadísticas de la escudería
          if (posicion === 1) {
              escuderia.carrerasGanadas += 1;
              escuderia.podios += 1; // Una victoria cuenta como podio
              escuderia.puntos += puntosGanados;
          } else if (posicion <= 3) {
              escuderia.podios += 1; // Podio para posiciones 2 y 3
              escuderia.puntos += puntosGanados;
          } else {
              escuderia.puntos += puntosGanados;
          }

          escuderia.carrerasTerminadas += 1;

          // Actualizar estadísticas del piloto específico
          if (rol === "piloto1") {
              const piloto = escuderia.piloto1.estadisticas;
              piloto.carrerasTerminadas += 1;
              piloto.puntos += puntosGanados;

              if (posicion === 1) {
                  piloto.carrerasGanadas += 1;
                  piloto.podios += 1;
              } else if (posicion <= 3) {
                  piloto.podios += 1;
              }
          } else if (rol === "piloto2") {
              const piloto = escuderia.piloto2.estadisticas;
              piloto.carrerasTerminadas += 1;
              piloto.puntos += puntosGanados;

              if (posicion === 1) {
                  piloto.carrerasGanadas += 1;
                  piloto.podios += 1;
              } else if (posicion <= 3) {
                  piloto.podios += 1;
              }
          }

          // Guardar cambios en la escudería
          await escuderia.save();
      } else {
          console.log(`El usuario ${usuario} no tiene escudería asignada. No se procesará sueldo ni estadísticas de escudería.`);
      }

      // Actualizar el dinero del piloto, solo si tiene escudería
      if (escuderia) {
          const piloto = await User.findOne({ usuario });
          if (!piloto) {
              console.error(`No se encontró al piloto ${usuario}.`);
              return;
          }

          piloto.dinero += sueldo;

          // Guardar cambios en el piloto
          await piloto.save();
      }
  } catch (err) {
      console.error(`Error al actualizar la escudería y el piloto para ${usuario}:`, err);
  }
});



await page.exposeFunction('updateStats', async (usuario, stats) => {
  try {
      // Busca al usuario por nombre
      const user = await User.findOne({ usuario });

      if (user) {
          // Verificar si las estadísticas proporcionadas son valores absolutos
          // y asignar directamente los nuevos valores si existen
          if (stats.carrerasCompletadas !== undefined) {
              user.stats.carrerasCompletadas = stats.carrerasCompletadas;
          }
          if (stats.polepositions !== undefined) {
              user.stats.polepositions = stats.polepositions;
          }
          if (stats.carrerasGanadas !== undefined) {
              user.stats.carrerasGanadas = stats.carrerasGanadas;
          }
          if (stats.carrerasPodio !== undefined) {
              user.stats.carrerasPodio = stats.carrerasPodio;
          }
          if (stats.carrerasTop10 !== undefined) {
              user.stats.carrerasTop10 = stats.carrerasTop10;
          }
          if (stats.puntos !== undefined) {
              user.stats.puntos = stats.puntos;
          }
          if (stats.valor !== undefined) {
              user.stats.valor = stats.valor;
          }
          if (stats.valorFinal !== undefined) {
              // Validar `valorFinal` para evitar `NaN`
              user.stats.valorFinal = !isNaN(Number(stats.valorFinal)) ? stats.valorFinal : 0;
          }

          // Guarda los cambios en la base de datos
          await user.save();
          console.log(`Estadísticas de ${usuario} actualizadas correctamente.`);
      } else {
          console.error(`Usuario ${usuario} no encontrado.`);
      }
  } catch (err) {
      console.error(`Error al actualizar las estadísticas de ${usuario}:`, err);
  }
});


// Exponer la función para actualizar Pole Positions
await page.exposeFunction('updatePolePositions', async (usuario) => {
    try {
        const user = await User.findOne({ usuario });

        if (user) {
            // Incrementar el contador de polepositions del usuario
            user.stats.polepositions += 1;
            user.stats.puntos += 1;

            // Guardar los cambios en la base de datos
            await user.save();
            console.log(`PolePositions de ${usuario} actualizadas correctamente.`);
        } else {
            console.error(`Usuario ${usuario} no encontrado.`);
        }
    } catch (err) {
        console.error(`Error al actualizar las PolePositions de ${usuario}:`, err);
    }
});

// Exponer la función para obtener los rankings
await page.exposeFunction('getTopPlayers', async (stat) => {
    try {
        const validStats = ['victorias', 'poles', 'carreras', 'podios', 'top10', 'promedio', 'valor', 'puntos'];

        if (!validStats.includes(stat)) {
            throw new Error(`Estadística inválida: ${stat}`);
        }

        // Definir los campos de ordenamiento según la estadística solicitada
        const sortField = {
            victorias: 'stats.carrerasGanadas',
            poles: 'stats.polepositions',
            carreras: 'stats.carrerasCompletadas',
            podios: 'stats.carrerasPodio',
            top10: 'stats.carrerasTop10',
            promedio: 'avgPoints',
            valor: 'stats.valorFinal',
            puntos: 'stats.puntos'
        }[stat];

        // Consultar la base de datos para obtener los jugadores ordenados
        const players = await User.aggregate([
            // Calcular el promedio de puntos por carrera si se solicita "promedio"
            {
                $addFields: {
                    avgPoints: {
                        $cond: {
                            if: { $eq: ['$stats.carrerasCompletadas', 0] },
                            then: 0,
                            else: { $divide: ['$stats.puntos', '$stats.carrerasCompletadas'] }
                        }
                    }
                }
            },
            { $sort: { [sortField]: -1 } },
            { $limit: 20 }
        ]);

        // Devolver la lista de jugadores con las estadísticas solicitadas
        return players.map((player, index) => ({
            rank: index + 1,
            nombre: player.usuario,
            statValue: player.stats[sortField.split('.')[1]],
            stats: player.stats,
            promedio: player.avgPoints.toFixed(2), // Asegurarse de que el promedio se formatee como decimal
            valor: player.stats.valorFinal
        }));
    } catch (err) {
        console.error("Error al obtener el ranking:", err);
        return null;
    }
});

await page.exposeFunction('sendRoomLink', (url) => {
  console.log(`Link de la sala: ${url}`);
});

  // Circuitos
  await page.addScriptTag({ path: './circuitos/circuitos.js' });

  // Agregados
  await page.addScriptTag({ path: './agregados/colores.js'});
  await page.addScriptTag({ path: './agregados/fuentes.js'});
  await page.addScriptTag({ path: './agregados/sonidos.js'});
  await page.addScriptTag({ path: './agregados/nombres.js'}); // Nombres FIA, Sponsor, F1, F2

  // Script principal
  await page.addScriptTag({ path: './bot_funcionalAuth.js' });

  // Discord 
  //await page.addScriptTag({ path: './discord/funciones.js'});


  console.log('Bot loaded');
}

bot();
  