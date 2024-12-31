const express = require('express');
const bodyParser = require('body-parser'); // Body verisini parse etmek için
const methodOverride = require('method-override'); // HTTP PUT ve DELETE metodlarını kullanmak için
const path = require('path');
const { Client } = require('pg'); // PostgreSQL bağlantısı için
const session = require('express-session'); // Session için

const mainRoute = require('./routes/main.js'); 


const app = express();

// PostgreSQL bağlantı bilgileri
const client = new Client({
  host: 'localhost', // Docker'da çalışıyorsa, container'ın IP'si veya localhost
  port: 5432, // PostgreSQL'in dinlediği port
  user: 'admin', // Docker'da veya kendi ayarlarınızdaki kullanıcı adı
  password: 'password', // Şifre
  database: 'hw_database', // Veritabanı adı
});

// PostgreSQL'e bağlanıyoruz
client.connect()
  .then(() => {
    console.log('PostgreSQL veritabanına bağlanıldı!');
  })
  .catch(err => {
    console.error('PostgreSQL bağlantı hatası:', err.stack);
  });

// EJS şablon motorunu kullanıyoruz
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // EJS şablonlarının bulunduğu klasör

// Statik dosyalar (CSS, JS, resimler) için public klasörünü ayarlıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// Body verisini parse etmek için body-parser middleware kullanıyoruz
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HTTP metotlarını override etmek için method-override kullanıyoruz (PUT ve DELETE)
app.use(methodOverride('_method', {
  methods: ['POST', 'GET'], // PUT ve DELETE işlemleri için
}));

// Express session middleware'ini kullanıyoruz
app.use(session({
  secret: 'my_homework', // Session şifresi
  resave: false,
  saveUninitialized: true,
}));

// Kullanıcı bilgilerini global olarak almak için middleware
app.use('*', (req, res, next) => {
  global.userIN = req.session.userID; // Kullanıcı ID'sini session'dan alıyoruz
  console.log(req.url)
  next();
});


// Routes
app.use('/', mainRoute); // Ana sayfa yönlendirmesi

// Sunucu başlatma
const port = 5051; // Uygulamanın dinleyeceği port numarası
app.listen(port, () => {
  console.log(`Uygulama ${port} numaralı portta çalışıyor...`);
});
