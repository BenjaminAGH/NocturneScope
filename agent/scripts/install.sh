#!/bin/bash

# URL base donde se alojarán los binarios (ejemplo)
BASE_URL="https://tu-servidor-o-bucket.com/downloads"
BINARY_NAME="nocturne-agent-linux"
INSTALL_DIR="/usr/local/bin"
TARGET_NAME="nocturne-agent"

echo "⬇️  Descargando Nocturne Agent..."
# En un caso real, descomentar la siguiente línea:
# curl -L -o $TARGET_NAME "$BASE_URL/$BINARY_NAME"
# Por ahora, asumimos que el usuario tiene el binario o lo simulamos
echo "⚠️  Este script es una plantilla. Debes configurar BASE_URL."

# Simulación de descarga (si se ejecuta localmente desde dist)
if [ -f "../dist/$BINARY_NAME" ]; then
    cp "../dist/$BINARY_NAME" "$TARGET_NAME"
fi

if [ ! -f "$TARGET_NAME" ]; then
    echo "❌ Error: No se encontró el binario."
    exit 1
fi

chmod +x $TARGET_NAME

echo "🚀 Ejecutando instalador..."
sudo ./$TARGET_NAME
