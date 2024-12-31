# Resmi PostgreSQL imajını kullan
FROM postgres:13

# Çalıştırma için gerekli çevresel değişkenler
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=mydatabase

# Veritabanı dosyalarının eklenmesi (isteğe bağlı)
# COPY ./init.sql /docker-entrypoint-initdb.d/

# Bağlantı noktalarını aç
EXPOSE 5432

# PostgreSQL'i başlatmak için varsayılan komutu kullan
CMD ["postgres"]
