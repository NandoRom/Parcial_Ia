let chart;
let dataset = [];
let kohonenWeights = [];

// Event listener para entrenar la red
document.getElementById('entrenarBtn').addEventListener('click', entrenarRed);

// Event listener para cargar el dataset
document.getElementById('datasetInput').addEventListener('change', async function(event) {
    const files = event.target.files;
    if (files.length > 0) {
        dataset = await loadImages(files);
        document.getElementById('datasetInfo').style.display = 'block';
        document.getElementById('numEntradas').textContent = files.length;
        document.getElementById('numPatrones').textContent = files.length;
    }
});

// Event listener para el botón de simular
document.getElementById('simulateButton').addEventListener('click', () => {
    if (dataset.length === 0) {
        alert("Cargue primero un dataset.");
        return;
    }

    const currentPattern = dataset[Math.floor(Math.random() * dataset.length)];
    const result = simulate(currentPattern);
    console.log("Resultado de la simulación:", result);
});

// Función para cargar las imágenes
async function loadImages(files) {
    const images = [];
    for (const file of files) {
        const img = await loadImage(file);
        images.push(convertImageToVector(img));
    }
    return images;
}

// Función para cargar una imagen
function loadImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

// Función para convertir una imagen en un vector
function convertImageToVector(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = Array.from(imageData.data).slice(0, imageData.width * imageData.height * 4);
    return data.map(value => value / 255); // Normaliza los valores entre 0 y 1
}

// Función para entrenar la red Kohonen
function entrenarRed() {
    const numNeuronas = parseInt(document.getElementById('neuronas').value);
    const tipoCompetencia = document.getElementById('competencia').value;
    const iteraciones = parseInt(document.getElementById('iteraciones').value);
    const learningRate = parseFloat(document.getElementById('learningRate').value);

    if (!dataset.length) {
        alert("Por favor, carga un dataset antes de entrenar la red.");
        return;
    }

    kohonenWeights = inicializarPesosAleatorios(numNeuronas, dataset[0].length);

    for (let iter = 0; iter < iteraciones; iter++) {
        actualizarPesos(kohonenWeights, tipoCompetencia, learningRate);
    }

    graficarPesos(kohonenWeights);
    alert('Entrenamiento completado');
}

// Función para inicializar pesos aleatorios
function inicializarPesosAleatorios(numNeuronas, inputSize) {
    let pesos = [];
    for (let i = 0; i < numNeuronas; i++) {
        let neurona = [];
        for (let j = 0; j < inputSize; j++) {
            neurona.push(Math.random() * 2 - 1);
        }
        pesos.push(neurona);
    }
    return pesos;
}

// Función para actualizar los pesos
function actualizarPesos(pesos, tipoCompetencia, learningRate) {
    const patron = dataset[Math.floor(Math.random() * dataset.length)];
    const winnerIndex = calcularGanadora(patron);

    for (let i = 0; i < pesos.length; i++) {
        if (i === winnerIndex) {
            for (let j = 0; j < pesos[i].length; j++) {
                pesos[i][j] += learningRate * (patron[j] - pesos[i][j]);
            }
        } else if (tipoCompetencia === 'blanda') {
            const distancia = calcularDistanciaEuclidiana(patron, pesos[i]);
            const vecindad = Math.exp(-distancia);
            for (let j = 0; j < pesos[i].length; j++) {
                pesos[i][j] += learningRate * vecindad * (patron[j] - pesos[i][j]);
            }
        }
    }
}

// Función para graficar los pesos
function graficarPesos(pesos) {
    const ctx = document.getElementById('graficoPesos').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: pesos.map((_, i) => `Neurona ${i + 1}`),
            datasets: [{
                label: 'Pesos de las Neuronas',
                data: pesos.flat(),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para calcular la distancia euclidiana
function calcularDistanciaEuclidiana(pattern, weights) {
    return Math.sqrt(pattern.reduce((acc, val, idx) => acc + Math.pow(val - weights[idx], 2), 0));
}

// Función para encontrar la neurona vencedora
function calcularGanadora(pattern) {
    let minDistance = Infinity;
    let winnerIndex = -1;

    kohonenWeights.forEach((weights, index) => {
        const distance = calcularDistanciaEuclidiana(pattern, weights);
        if (distance < minDistance) {
            minDistance = distance;
            winnerIndex = index;
        }
    });

    return winnerIndex;
}

// Función para simular con un nuevo patrón
function simulate(pattern) {
    const winnerIndex = calcularGanadora(pattern);
    console.log("Neurona vencedora:", winnerIndex);
    console.log("Pesos de la vencedora:", kohonenWeights[winnerIndex]);
    return kohonenWeights[winnerIndex];
}
