#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              🔍 Vérification de la Configuration                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

cd "/Users/brunodasilvalopes/Documents/GitHub/Test GIt/BDD_LVMH"

echo "📁 Vérification des fichiers..."
echo ""

if [ -f "app.js" ]; then
    SIZE=$(ls -lh app.js | awk '{print $5}')
    echo "✅ app.js existe ($SIZE)"
else
    echo "❌ app.js manquant"
fi

if [ -f "engine.js" ]; then
    SIZE=$(ls -lh engine.js | awk '{print $5}')
    echo "✅ engine.js existe ($SIZE)"
else
    echo "❌ engine.js manquant"
fi

if [ -f "index.html" ]; then
    SIZE=$(ls -lh index.html | awk '{print $5}')
    echo "✅ index.html existe ($SIZE)"
else
    echo "❌ index.html manquant"
fi

if [ -f "index.css" ]; then
    SIZE=$(ls -lh index.css | awk '{print $5}')
    echo "✅ index.css existe ($SIZE)"
else
    echo "❌ index.css manquant"
fi

echo ""
echo "🔍 Vérification des fonctions de rendu..."
echo ""

if grep -q "function renderDashboard" engine.js; then
    echo "✅ renderDashboard() existe"
else
    echo "❌ renderDashboard() manquante"
fi

if grep -q "function renderNBA" engine.js; then
    echo "✅ renderNBA() existe"
else
    echo "❌ renderNBA() manquante"
fi

if grep -q "function renderPrivacy" engine.js; then
    echo "✅ renderPrivacy() existe"
else
    echo "❌ renderPrivacy() manquante"
fi

if grep -q "function renderVendeurHome" app.js; then
    echo "✅ renderVendeurHome() existe"
else
    echo "❌ renderVendeurHome() manquante"
fi

echo ""
echo "🔍 Vérification des pages HTML..."
echo ""

if grep -q 'id="page-m-dashboard"' index.html; then
    echo "✅ page-m-dashboard existe"
else
    echo "❌ page-m-dashboard manquante"
fi

if grep -q 'id="page-nba"' index.html; then
    echo "✅ page-nba existe"
else
    echo "❌ page-nba manquante"
fi

if grep -q 'id="page-m-privacy"' index.html; then
    echo "✅ page-m-privacy existe"
else
    echo "❌ page-m-privacy manquante"
fi

if grep -q 'id="page-m-import"' index.html; then
    echo "✅ page-m-import existe"
else
    echo "❌ page-m-import manquante"
fi

if grep -q 'id="page-m-team"' index.html; then
    echo "✅ page-m-team existe"
else
    echo "❌ page-m-team manquante"
fi

echo ""
echo "🌐 Vérification du serveur..."
echo ""

if lsof -ti:5001 > /dev/null 2>&1; then
    echo "✅ Serveur Flask actif sur port 5001"
else
    echo "❌ Serveur Flask non actif"
    echo "   Lancez: python3 server.py"
fi

echo ""
echo "🔑 Vérification Supabase..."
echo ""

if [ -f ".env" ]; then
    if grep -q "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .env; then
        echo "✅ Clé Supabase configurée"
    else
        echo "⚠️  Clé Supabase peut-être incorrecte"
    fi
else
    echo "❌ Fichier .env manquant"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                        📋 Résumé                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Si tous les tests sont ✅, le problème vient du cache du navigateur."
echo ""
echo "SOLUTION :"
echo "1. Videz le cache : Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)"
echo "2. Rechargez : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)"
echo "3. Ouvrez la console : F12"
echo "4. Testez la navigation"
echo ""
