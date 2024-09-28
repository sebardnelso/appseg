const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3000;

// Configuración del middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la base de datos
const db = mysql.createConnection({
  host: '190.228.29.61',
  user: 'kalel2016',
  password: 'Kalel2016',
  database: 'ausol'
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) throw err;
  console.log('Conectado a la base de datos MySQL');
});

// Configuración de sesión
app.use(session({
  secret: 'secreto',
  resave: false,
  saveUninitialized: true,
}));

// Ruta para mostrar el login
app.get('/', (req, res) => {
  res.render('login');
});

// Ruta para procesar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM aus_usuario WHERE nombre = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.loggedIn = true;
      req.session.username = username;
      res.redirect('/maps');
    } else {
      res.send('Usuario o contraseña incorrectos');
    }
  });
});

// Ruta para mostrar el mapa
app.get('/maps', async (req, res) => {
  try {
    const [vendedores] = await db.promise().query(`
      SELECT id, nombre 
      FROM aus_ven`); // Obtener todos los vendedores

    const [ubicaciones] = await db.promise().query(`
      SELECT DISTINCT latitud, longitud, vendedor_id, fecha 
      FROM aus_ven_ubicaciones 
      WHERE DATE(fecha) = CURDATE()`); // Filtrar por la fecha actual

    console.log('Ubicaciones iniciales para el mapa:', ubicaciones);
    res.render('maps', { ubicaciones, vendedores });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener ubicaciones');
  }
});

// Ruta para obtener ubicaciones
app.get('/ubicaciones', async (req, res) => {
  const vendedorId = req.query.vendedor_id; // Obtener el ID del vendedor desde los parámetros de consulta
  console.log('Vendedor ID recibido:', vendedorId); // Log para depuración

  try {
    let ubicaciones;
    if (vendedorId) {
      // Filtrar ubicaciones por vendedor
      [ubicaciones] = await db.promise().query(`
        SELECT DISTINCT latitud, longitud, vendedor_id, fecha 
        FROM aus_ven_ubicaciones 
        WHERE vendedor_id = ? AND DATE(fecha) = CURDATE()`, [vendedorId]);
    } else {
      // Obtener todas las ubicaciones si no hay un vendedor seleccionado
      [ubicaciones] = await db.promise().query(`
        SELECT DISTINCT latitud, longitud, vendedor_id, fecha 
        FROM aus_ven_ubicaciones 
        WHERE DATE(fecha) = CURDATE()`);
    }

    console.log('Ubicaciones devueltas:', ubicaciones); // Log para depuración
    res.json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
});

// Escuchando en el puerto
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
