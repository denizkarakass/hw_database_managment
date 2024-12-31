const { Client } = require('pg'); // PostgreSQL bağlantısını sağlıyoruz

// PostgreSQL bağlantı bilgileri
const client = new Client({
  host: 'localhost', // Docker'da çalışıyorsa, container'ın IP'si veya localhost
  port: 5432, // PostgreSQL'in dinlediği port
  user: 'admin', // Docker'da veya kendi ayarlarınızdaki kullanıcı adı
  password: 'password', // Şifre
  database: 'hw_database', // Veritabanı adı
});

// Veritabanı bağlantısını başlatıyoruz
client.connect()
  .then(() => {
    console.log('PostgreSQL veritabanına bağlanıldı!');
  })
  .catch(err => {
    console.error('PostgreSQL bağlantı hatası:', err.stack); 
  });

// Ana sayfa controller fonksiyonu
exports.getIndexPage = async (req, res) => {
  try {

    return res.render('index.ejs');
  } catch (err) {
    console.error('Veritabanı sorgu hatası:', err.stack);
    res.status(500).send('Sunucu hatası');  
  }
};


exports.getSubscribedChannels = async (req, res) => {
  const userId = req.params.userId; // URL parametresinden kullanıcı ID'sini alıyoruz
  console.log('Kullanıcı ID:', userId);

  try {
    // Kullanıcının abone olduğu kanalları almak için SQL sorgusu
    const result = await client.query(
      `SELECT channels.name, channels.description, channels.created_at 
       FROM channels 
       JOIN subscriptions ON channels.id = subscriptions.channel_id 
       WHERE subscriptions.subscriber_id = $1`,
      [userId] // Parametreyi doğru şekilde gönderiyoruz
    );
    

    // Abone olunan kanalları kontrol ediyoruz
    if (result.rows.length > 0) {
      console.log('Kullanıcının abone olduğu kanallar:', result.rows);

      // Abone olunan kanalların bilgilerini "subscriptions.ejs" şablonuna gönderiyoruz
     return res.send(result.rows);
    } else {
      // Kullanıcının abone olduğu kanal yoksa mesaj gösteriyoruz
      res.send('Bu kullanıcıya ait abone olunan kanal bulunamadı.');
    }

  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};


// Kanalın videolarını almak için controller fonksiyonu
exports.getChannelVideos = async (req, res) => {
  const { channelId } = req.params;  // Kanal ID'sini URL parametresinden alıyoruz
  console.log('Kanal ID:', channelId);

  try {
    // Kanala ait tüm videoları almak için SQL sorgusu
    const result = await client.query(
      `SELECT title, description, thumbnail_url, duration_seconds, views_count, likes_count, created_at
       FROM videos 
       WHERE channel_id = $1
       ORDER BY created_at DESC`,  // Videoları yüklenme tarihine göre azalan sırayla alıyoruz
      [channelId]
    );

    // Videoları kontrol ediyoruz
    if (result.rows.length > 0) {
      console.log('Kanalın videoları:', result.rows);

      // Videoları "channelVideos.ejs" şablonuna gönderiyoruz
     return res.send(result.rows);
    } else {
      // Kanala ait video yoksa mesaj gösteriyoruz
      res.send('Bu kanala ait video bulunamadı.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};


// Videoya ait tüm yorumları almak için controller fonksiyonu
exports.getCommentsOnVideo = async (req, res) => {
  const { videoId } = req.params; // Video ID'sini URL parametresinden alıyoruz
  console.log('Video ID:', videoId);

  try {
    // Videoya ait tüm yorumları almak için SQL sorgusu
    const result = await client.query(
      `SELECT users.name, comments.content, comments.created_at
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.video_id = $1
       ORDER BY comments.created_at DESC`,  // Yorumları, oluşturulma tarihine göre azalan sırayla alıyoruz
      [videoId]
    );

    // Yorumları kontrol ediyoruz
    if (result.rows.length > 0) {
      console.log('Videoya ait yorumlar:', result.rows);

      // Yorumları "videoComments.ejs" şablonuna gönderiyoruz
      return res.send(result.rows);
    } else {
      // Videoya ait yorum yoksa mesaj gösteriyoruz
      res.send('Bu videoya ait yorum bulunamadı.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};


// Belirli bir yoruma ait cevapları getiren controller fonksiyonu
exports.getRepliesToComment = async (req, res) => {
  const { commentId } = req.params; // Yorum ID'sini URL parametresinden alıyoruz
  console.log('Yorum ID:', commentId);

  try {
    // Cevapları almak için SQL sorgusu
    const result = await client.query(
      `SELECT users.name, replies.content, replies.created_at
       FROM replies
       JOIN users ON replies.user_id = users.id
       WHERE replies.comment_id = $1
       ORDER BY replies.created_at ASC`, // Cevapları tarih sırasına göre getiriyoruz
      [commentId]
    );

    // Cevapları kontrol ediyoruz
    if (result.rows.length > 0) {
      console.log('Yoruma ait cevaplar:', result.rows);

      // Cevapları "commentReplies.ejs" şablonuna gönderiyoruz
      return res.send(result.rows);
    } else {
      // Yoruma ait cevap yoksa mesaj gösteriyoruz
      res.send('Bu yoruma ait cevap bulunamadı.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};


exports.checkUserLikedVideo = async (req, res) => {
  const { userId, videoId } = req.params; // URL parametresinden userId ve videoId'yi alıyoruz
  console.log('Kullanıcı ID:', userId, 'Video ID:', videoId);

  try {
    // Kullanıcının videoyu beğenip beğenmediğini kontrol eden SQL sorgusu
    const result = await client.query(
      `SELECT * 
       FROM likes 
       WHERE user_id = $1 AND video_id = $2`,
      [userId, videoId]
    );

    if (result.rows.length > 0) {
      // Kullanıcı videoyu beğenmişse
      console.log('Kullanıcı bu videoyu beğenmiş:', result.rows[0]);
      res.json({ liked: true });
    } else {
      // Kullanıcı videoyu beğenmemişse
      console.log('Kullanıcı bu videoyu beğenmemiş.');
      res.json({ liked: false });
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};

// Kullanıcının izleme geçmişini getiren controller
exports.getWatchHistory = async (req, res) => {
  const userId = req.params.userId; // URL parametresinden kullanıcı ID'sini alıyoruz
  console.log('Kullanıcı ID:', userId);

  try {
    // İzleme geçmişini en fazla 100 kayıtla sınırlı olarak getiren SQL sorgusu
    const result = await client.query(
      `SELECT 
         videos.title, 
         videos.thumbnail_url, 
         videos.duration_seconds, 
         watch_history.watched_at 
       FROM watch_history 
       JOIN videos ON watch_history.video_id = videos.id 
       WHERE watch_history.user_id = $1 
       ORDER BY watch_history.watched_at DESC 
       LIMIT 100`,
      [userId]
    );

    if (result.rows.length > 0) {
      // İzleme geçmişi bulunduysa
      console.log('Kullanıcının izleme geçmişi:', result.rows);
      return res.send(result.rows);
    } else {
      // İzleme geçmişi yoksa mesaj döndürüyoruz
      console.log('Kullanıcı için izleme geçmişi bulunamadı.');
      res.send('İzleme geçmişiniz boş.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};


// Kullanıcının yüklediği videoları getiren controller
exports.getUserUploadedVideos = async (req, res) => {
  const userId = req.params.userId; // URL'den kullanıcı ID'sini alıyoruz
  console.log('Kullanıcı ID:', userId);

  try {
    // Kullanıcının yüklediği videoları almak için SQL sorgusu
    const result = await client.query(
      `SELECT 
         videos.id AS video_id, 
         videos.title, 
         videos.description, 
         videos.thumbnail_url, 
         videos.duration_seconds, 
         videos.views_count, 
         videos.likes_count, 
         videos.created_at 
       FROM videos 
       JOIN channels ON videos.channel_id = channels.id 
       WHERE channels.user_id = $1 
       ORDER BY videos.created_at DESC`,
      [userId]
    );

    // Videolar kontrol ediliyor
    if (result.rows.length > 0) {
      console.log('Kullanıcının yüklediği videolar:', result.rows);
      return res.send(result.rows);
    } else {
      console.log('Kullanıcının yüklediği video bulunamadı.');
      res.send('Henüz yüklediğiniz bir video yok.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};

// Videoları başlık veya açıklama üzerinden arayan controller
exports.searchVideos = async (req, res) => {
  const keyword = req.query.keyword; // Arama anahtar kelimesini alıyoruz
  console.log('Arama anahtar kelimesi:', keyword);

  if (!keyword) {
    return res.status(400).send('Lütfen bir arama anahtar kelimesi girin.');
  }

  try {
    // Videoları başlık veya açıklama üzerinden aramak için SQL sorgusu
    const result = await client.query(
      `SELECT 
         videos.id AS video_id, 
         videos.title, 
         videos.description, 
         videos.created_at, 
         channels.name AS channel_name 
       FROM videos 
       JOIN channels ON videos.channel_id = channels.id 
       WHERE LOWER(videos.title) LIKE LOWER($1) 
          OR LOWER(videos.description) LIKE LOWER($1) 
       ORDER BY videos.created_at DESC 
       LIMIT 20`,
      [`%${keyword}%`]
    );

    // Arama sonuçlarını kontrol ediyoruz
    if (result.rows.length > 0) {
      console.log('Arama sonuçları:', result.rows);
      return res.send(result.rows);
    } else {
      console.log('Eşleşen video bulunamadı.');
      res.send('Eşleşen video bulunamadı.');
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};

// Kullanıcının bir kanala abone olup olmadığını kontrol eden controller
exports.checkSubscription = async (req, res) => {
  const { userId, channelId } = req.params; // Kullanıcı ID ve Kanal ID'sini alıyoruz

  console.log('Kontrol edilen kullanıcı:', userId);
  console.log('Kontrol edilen kanal:', channelId);

  try {
    // Kullanıcının kanala abone olup olmadığını kontrol etmek için SQL sorgusu
    const result = await client.query(
      `SELECT * 
       FROM subscriptions 
       WHERE subscriber_id = $1 AND channel_id = $2`,
      [userId, channelId]
    );

    if (result.rows.length > 0) {
      // Kullanıcı abone ise
      console.log('Kullanıcı zaten bu kanala abone.');
      res.json({ subscribed: true, message: 'Kullanıcı bu kanala abone.' });
    } else {
      // Kullanıcı abone değilse
      console.log('Kullanıcı bu kanala abone değil.');
      res.json({ subscribed: false, message: 'Kullanıcı bu kanala abone değil.' });
    }
  } catch (err) {
    console.error('Veri çekme hatası:', err.stack);
    res.status(500).send('Sunucu hatası');
  }
};

// Kanal arama fonksiyonu
exports.searchChannels = async (req, res) => {
  const { channel } = req.query; // Arama anahtar kelimesini sorgu parametresinden alıyoruz

  console.log('Arama anahtar kelimesi:', channel);

  if (!channel || channel.trim() === '') {
    return res.status(400).json({ message: 'Anahtar kelime boş olamaz.' });
  }

  try {
    // Kanalları isim veya açıklamaya göre arayan SQL sorgusu
    const result = await client.query(
      `SELECT id, name, description, created_at 
       FROM channels 
       WHERE LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1) 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [`%${channel}%`]
    );

    if (result.rows.length > 0) {
      console.log('Eşleşen kanallar bulundu:', result.rows);
      res.json({ channels: result.rows });
    } else {
      console.log('Eşleşen kanal bulunamadı.');
      res.json({ channels: [], message: 'Eşleşen kanal bulunamadı.' });
    }
  } catch (err) {
    console.error('Kanal arama hatası:', err.stack);
    res.status(500).send('Sunucu hatası'); 
  }
};

