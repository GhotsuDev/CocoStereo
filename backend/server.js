const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Carpeta "uploads" creada automáticamente.');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });
const app = express();
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const db = new sqlite3.Database('./biblioteca.db', (err) => {
    if (!err) {
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            correo TEXT UNIQUE,
            password TEXT,
            foto TEXT,
            descripcion TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER, 
            nombre TEXT, 
            descripcion TEXT, 
            foto TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS playlist_canciones (
            playlist_id INTEGER,
            cancion_id INTEGER,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id),
            FOREIGN KEY (cancion_id) REFERENCES canciones(id),
            PRIMARY KEY (playlist_id, cancion_id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS canciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            titulo TEXT,
            artista TEXT,
            genero TEXT,
            url_audio TEXT,
            duracion_segundos INTEGER,
            calificacion INTEGER,
            favorito INTEGER DEFAULT 0,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`);
    }
});

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN Y USUARIOS
// ==========================================

app.post('/usuarios', (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    db.run(
        'INSERT INTO usuarios (nombre, descripcion, foto) VALUES (?, ?, ?)',
        [nombre, 'Nuevo en CocoStereo', ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, nombre, descripcion: 'Nuevo en CocoStereo', foto: '' });
        }
    );
});

app.post('/auth/registro', (req, res) => {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password) return res.status(400).json({ error: 'Faltan datos' });

    db.run(
        'INSERT INTO usuarios (nombre, correo, password, descripcion, foto) VALUES (?, ?, ?, ?, ?)',
        [nombre, correo, password, 'Nuevo en CocoStereo', ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, nombre, correo, descripcion: 'Nuevo en CocoStereo', foto: '' });
        }
    );
});

app.post('/auth/login', (req, res) => {
    const { correo, password } = req.body;
    db.get('SELECT * FROM usuarios WHERE correo = ? AND password = ?', [correo, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        res.json(row);
    });
});

app.post('/login', (req, res) => {
    const { email, password, nombre } = req.body;
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
        if (row && row.password === password) {
            res.json(row);
        } else if (!row && nombre) {
            const foto = `https://ui-avatars.com/api/?name=${nombre}&background=8A2BE2&color=FFF`;
            const descripcion = "Nuevo en CocoStereo";
            db.run('INSERT INTO usuarios (nombre, email, password, foto, descripcion) VALUES (?, ?, ?, ?, ?)', 
                [nombre, email, password, foto, descripcion], function(err) {
                res.json({ id: this.lastID, nombre, email, foto, descripcion });
            });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
});

app.get('/usuarios/:id', (req, res) => {
    const usuarioId = req.params.id;
    db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(row);
    });
});

app.put('/usuarios/:id', (req, res) => {
    const { nombre, descripcion, foto } = req.body;
    const usuarioId = req.params.id;

    db.run(
        'UPDATE usuarios SET nombre = ?, descripcion = ?, foto = ? WHERE id = ?',
        [nombre, descripcion, foto, usuarioId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Perfil actualizado correctamente' });
        }
    );
});

// ==========================================
// ENDPOINTS DE ARCHIVOS (MULTER)
// ==========================================

app.post('/upload', upload.single('archivo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// ==========================================
// ENDPOINTS DE CANCIONES
// ==========================================

app.get('/canciones/:usuario_id', (req, res) => {
    db.all('SELECT * FROM canciones WHERE usuario_id = ?', [req.params.usuario_id], (err, rows) => res.json(rows || []));
});

app.post('/canciones', (req, res) => {
    const { usuario_id, titulo, artista, genero, url_audio, duracion_segundos, calificacion } = req.body;
    db.run(`INSERT INTO canciones (usuario_id, titulo, artista, genero, url_audio, duracion_segundos, calificacion, favorito) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`, 
            [usuario_id, titulo, artista, genero, url_audio, duracion_segundos, calificacion], function(err) {
        res.json({ id: this.lastID });
    });
});

app.put('/canciones/:id', (req, res) => {
    const { titulo, artista, genero, url_audio, calificacion } = req.body;
    const cancionId = req.params.id;

    db.run(
        `UPDATE canciones 
         SET titulo = ?, artista = ?, genero = ?, url_audio = ?, calificacion = ? 
         WHERE id = ?`,
        [titulo, artista, genero, url_audio, calificacion, cancionId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Canción no encontrada' });
            res.json({ message: 'Canción actualizada como un reloj suizo' });
        }
    );
});

app.post('/canciones/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.status(400).json({ error: 'No IDs' });
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM canciones WHERE id IN (${placeholders})`, ids, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ eliminados: this.changes });
    });
});

// ==========================================
// ENDPOINTS DE PLAYLISTS
// ==========================================

app.post('/playlists', (req, res) => {
    const { usuario_id, nombre, descripcion, foto, canciones_ids } = req.body;
    db.run('INSERT INTO playlists (usuario_id, nombre, descripcion, foto) VALUES (?, ?, ?, ?)', 
      [usuario_id, nombre, descripcion, foto], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const playlistId = this.lastID;
        
        const stmt = db.prepare('INSERT INTO playlist_canciones (playlist_id, cancion_id) VALUES (?, ?)');
        canciones_ids.forEach(id => stmt.run([playlistId, id]));
        stmt.finalize();
        
        res.json({ success: true, playlistId });
    });
});

app.get('/playlists/:usuario_id', (req, res) => {
    db.all('SELECT * FROM playlists WHERE usuario_id = ?', [req.params.usuario_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.put('/playlists/:id', (req, res) => {
    const { nombre, descripcion, foto } = req.body;
    const playlistId = req.params.id;
    
    db.run('UPDATE playlists SET nombre = ?, descripcion = ?, foto = ? WHERE id = ?', 
        [nombre, descripcion, foto, playlistId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/playlists/:id', (req, res) => {
    const playlistId = req.params.id;
    
    db.run('DELETE FROM playlist_canciones WHERE playlist_id = ?', [playlistId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/canciones/:id', (req, res) => {
    const cancionId = req.params.id;
    
    // Primero la quitamos de todas las playlists para evitar errores de integridad
    db.run('DELETE FROM playlist_canciones WHERE cancion_id = ?', [cancionId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Luego la eliminamos definitivamente de la biblioteca
        db.run('DELETE FROM canciones WHERE id = ?', [cancionId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// 2. QUITAR UNA CANCIÓN SOLO DE UNA PLAYLIST
app.delete('/playlists/:playlist_id/canciones/:cancion_id', (req, res) => {
    const { playlist_id, cancion_id } = req.params;
    
    db.run('DELETE FROM playlist_canciones WHERE playlist_id = ? AND cancion_id = ?', 
        [playlist_id, cancion_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
    });
});

app.get('/playlists/:playlist_id/canciones', (req, res) => {
    const sql = `
        SELECT c.* FROM canciones c
        JOIN playlist_canciones pc ON c.id = pc.cancion_id
        WHERE pc.playlist_id = ?
    `;
    db.all(sql, [req.params.playlist_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/playlists/:playlist_id/canciones-batch', (req, res) => {
    const { canciones_ids } = req.body;
    if (!canciones_ids || canciones_ids.length === 0) return res.status(400).json({ error: 'No IDs' });
    
    const playlistId = req.params.playlist_id;
    
    const placeholders = canciones_ids.map(() => '?').join(',');
    db.all(`SELECT cancion_id FROM playlist_canciones WHERE playlist_id = ? AND cancion_id IN (${placeholders})`, 
      [playlistId, ...canciones_ids], 
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (rows.length > 0) {
            return res.status(409).json({ error: '¡Ya está en esta Playlist!' });
        }

        const stmt = db.prepare('INSERT INTO playlist_canciones (playlist_id, cancion_id) VALUES (?, ?)');
        canciones_ids.forEach(id => stmt.run([playlistId, id]));
        stmt.finalize();
        
        res.json({ success: true });
    });
});

app.listen(3000, () => console.log(`Servidor corriendo en puerto 3000`));