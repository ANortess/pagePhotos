# Usa una imagen base de Node.js (Node 20 es la que usas)
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor a /app
# Aquí es donde se copiarán los archivos y se ejecutará la aplicación
WORKDIR /app

# Copia los archivos de definicion de dependencias primero
# Esto permite que Docker use caché si solo cambias el código de index.js
COPY package.json package-lock.json ./

# Instala las dependencias del backend
# Este paso instala todo lo que Express y MySQL necesitan
RUN npm install

# Copia el resto de los archivos de tu carpeta 'server' (incluyendo index.js)
COPY . .

# Expone el puerto que tu aplicación escuchará
# El puerto 3001 es el que configuraste como fallback en index.js
EXPOSE 3001

# Comando para arrancar el servidor Express
# Esto es CRUCIAL: Ejecuta el script "start": "node index.js"
CMD ["npm", "start"]