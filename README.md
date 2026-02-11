# 🗺️ RotaFácil — Otimizador de Rotas para Atendimento em Campo

<p align="center">
  <img src="https://img.shields.io/badge/Status-Ativo-22c55e?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Licença-MIT-3b82f6?style=for-the-badge" alt="Licença">
</p>

<p align="center">
  <b>Calcule a melhor rota de atendimento a clientes a partir de links do Google Maps.</b><br>
  Menos deslocamento. Mais eficiência. Rota inteligente.
</p>

---

## 📖 Sobre o Projeto

O **RotaFácil** é uma aplicação web criada para profissionais que trabalham em centrais de atendimento, suporte técnico em campo, logística e entregas. A ferramenta recebe links do Google Maps de múltiplos clientes e calcula automaticamente a **melhor rota com o menor deslocamento possível**, resolvendo o clássico **Problema do Caixeiro Viajante (TSP)**.

### 🎯 Problema que resolve

Quando você precisa visitar vários clientes no dia, definir manualmente a ordem das visitas pode resultar em rotas ineficientes e desperdício de tempo e combustível. O RotaFácil otimiza essa rota automaticamente, economizando tempo e recursos.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| 🔗 **Links do Google Maps** | Cole links do Google Maps e as coordenadas são extraídas automaticamente |
| 📝 **Coordenadas manuais** | Opção para inserir latitude e longitude diretamente |
| 🧮 **Rota otimizada (TSP)** | Algoritmo que encontra a rota com menor deslocamento entre todos os pontos |
| 🗺️ **Mapa interativo** | Visualização em mapa escuro com marcadores customizados e rota animada |
| 📊 **Resumo da rota** | Exibe distância total, tempo estimado e ordem de visita |
| 🧭 **Exportar para Google Maps** | Abre a rota otimizada diretamente no Google Maps para navegação GPS |
| 📌 **Base configurável** | Defina qualquer ponto como sua localização central |
| 💾 **Persistência local** | Clientes são salvos automaticamente no navegador |
| 📱 **Design responsivo** | Funciona perfeitamente em desktop e dispositivos móveis |
| 🌙 **Dark Mode** | Interface moderna com tema escuro e efeitos glassmorphism |

---

## 🚀 Como Usar

### 1. Abrir a aplicação

Basta abrir o arquivo `index.html` no navegador, ou iniciar um servidor local:

```bash
# Usando Python
python -m http.server 8080

# Usando Node.js
npx serve .
```

Acesse: **http://localhost:8080**

### 2. Configurar sua base

A localização da sua central (ponto de partida) já vem configurada. Para alterar, edite as coordenadas no painel lateral e clique em **"Atualizar Base"**.

### 3. Adicionar clientes

- Dê um **nome** ao cliente (opcional)
- **Cole o link** do Google Maps no campo de texto
- Clique em **"Adicionar Cliente"**

### 4. Calcular a rota

Após adicionar todos os clientes, clique no botão verde **"Calcular Melhor Rota"**. O sistema irá:

1. Enviar os pontos para o serviço de otimização
2. Calcular a melhor ordem de visita
3. Desenhar a rota no mapa
4. Exibir o resumo com distância e tempo

## 🛠️ Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| **HTML5** | Estrutura da aplicação |
| **CSS3** | Estilização com variáveis CSS, glassmorphism e animações |
| **JavaScript (Vanilla)** | Lógica da aplicação, parsing de links e gerenciamento de estado |
| **[Leaflet.js](https://leafletjs.com/)** | Renderização do mapa interativo |
| **[OSRM](https://project-osrm.org/)** | Serviço gratuito de cálculo e otimização de rotas (Trip API / TSP) |
| **[CARTO](https://carto.com/)** | Tiles do mapa com tema escuro |
| **[Lucide Icons](https://lucide.dev/)** | Ícones SVG modernos |
| **[Google Fonts (Inter)](https://fonts.google.com/specimen/Inter)** | Tipografia |

---

## 📁 Estrutura do Projeto

```
PROJECT/
├── index.html     # Página principal da aplicação
├── styles.css     # Estilos e design system
├── app.js         # Lógica da aplicação
└── README.md      # Documentação
```

---

## 🔧 Como Funciona (Técnico)

1. **Parsing de Links**: Expressões regulares extraem coordenadas de diversos formatos de URLs do Google Maps.

2. **Otimização de Rota**: A API [OSRM Trip](https://project-osrm.org/docs/v5.5.1/api/#trip-service) resolve o Problema do Caixeiro Viajante (TSP), retornando a ordem de visita que minimiza o deslocamento total.

3. **Visualização**: O [Leaflet.js](https://leafletjs.com/) renderiza o mapa com tiles escuros do CARTO, marcadores customizados numerados e uma polyline animada representando a rota.

4. **Exportação**: A rota otimizada é convertida em um link do Google Maps Directions com waypoints na ordem correta, permitindo navegação GPS imediata.

---


## ⚠️ Limitações

- O serviço OSRM público é gratuito, mas pode ter limites de requisições em picos de uso.
- Links encurtados do Google Maps (`goo.gl/maps/...`) precisam ser expandidos primeiro (o navegador faz isso automaticamente ao acessar).
- A precisão da rota depende da cobertura de dados do OpenStreetMap na região.

---
