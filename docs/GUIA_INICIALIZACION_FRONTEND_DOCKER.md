# Guía de Inicialización del Frontend con Docker

Esta guía explica cómo levantar y desarrollar el Frontend (React + Vite) utilizando Docker.

## Prerrequisitos
1.  **Docker Desktop** instalado y ejecutándose.
2.  Puerto **5173** libre en tu máquina.

## Pasos para Inicializar

### 1. Levantar el entorno
Si ya ejecutaste el comando general, el frontend debería estar corriendo:

```bash
docker-compose up -d
```

### 2. Instalar módulos de Node
Aunque el Dockerfile hace `npm install`, es recomendable asegurar que los módulos estén sincronizados si montamos volúmenes:

```bash
docker-compose exec frontend npm install
```

### 3. Acceder a la aplicación
Abre tu navegador en:
`http://localhost:5173`

Cualquier cambio que hagas en los archivos locales dentro de `frontend/src` se reflejará automáticamente (Hot Reloading) gracias al volumen configurado en `docker-compose.yml`.

## Comandos Útiles

**Ver logs del frontend:**
```bash
docker-compose logs -f frontend
```

**Reiniciar el servicio:**
```bash
docker-compose restart frontend
```

**Reconstruir si añades nuevas dependencias:**
Si añades paquetes al `package.json`, reconstruye la imagen:
```bash
docker-compose up -d --build frontend
```

## Configuración de API
El frontend se conecta al backend a través de la red de Docker o localhost dependiendo de cómo se acceda.
En `docker-compose.yml`, hemos preconfigurado:
`VITE_API_BASE_URL=http://localhost:8000`

Esto asume que tu navegador (que corre fuera de Docker) accede al backend expuesto en el puerto 8000 de tu máquina.
