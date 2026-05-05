```javascript
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Datos persistentes
const DATA_FILE = path.join(__dirname, 'habits_data.json');

// Cargar datos existentes o inicializar
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  return {
    habits: {},
    records: []
  };
}

// Guardar datos
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Crear interfaz readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper para preguntas
function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Crear nuevo hábito
async function createHabit(data) {
  const name = await question('Nombre del hábito: ');
  const description = await question('Descripción: ');
  const frequency = await question('Frecuencia (diario/semanal/mensual): ');
  
  const habitId = Date.now().toString();
  data.habits[habitId] = {
    id: habitId,
    name,
    description,
    frequency,
    createdAt: new Date().toISOString(),
    completions: 0
  };
  
  saveData(data);
  console.log('\n✓ Hábito creado exitosamente\n');
}

// Registrar completitud de hábito
async function logHabit(data) {
  const habitIds = Object.keys(data.habits);
  
  if (habitIds.length === 0) {
    console.log('\nNo hay hábitos creados aún.\n');
    return;
  }
  
  console.log('\nHábitos disponibles:');
  habitIds.forEach((id, index) => {
    const habit = data.habits[id];
    console.log(`${index + 1}. ${habit.name} (${habit.frequency})`);
  });
  
  const choice = await question('Selecciona el número del hábito: ');
  const selectedId = habitIds[parseInt(choice) - 1];
  
  if (!selectedId) {
    console.log('\nOpción inválida.\n');
    return;
  }
  
  const record = {
    habitId: selectedId,
    habitName: data.habits[selectedId].name,
    completedAt: new Date().toISOString(),
    notes: await question('Notas (opcional): ')
  };
  
  data.records.push(record);
  data.habits[selectedId].completions += 1;
  
  saveData(data);
  console.log('\n✓ Registro completado\n');
}

// Ver todos los hábitos
function viewHabits(data) {
  const habitIds = Object.keys(data.habits);
  
  if (habitIds.length === 0) {
    console.log('\nNo hay hábitos creados aún.\n');
    return;
  }
  
  console.log('\n=== MIS HÁBITOS ===\n');
  habitIds.forEach((id, index) => {
    const habit = data.habits[id];
    const createdDate = new Date(habit.createdAt).toLocaleDateString('es-ES');
    console.log(`${index + 1}. ${habit.name}`);
    console.log(`   Descripción: ${habit.description}`);
    console.log(`   Frecuencia: ${habit.frequency}`);
    console.log(`   Completaciones: ${habit.completions}`);
    console.log(`   Creado: ${createdDate}`);
    console.log('');
  });
}

// Estadísticas detalladas
function showStatistics(data) {
  if (Object.keys(data.habits).length === 0) {
    console.log('\nNo hay hábitos para mostrar estadísticas.\n');
    return;
  }
  
  console.log('\n=== ESTADÍSTICAS ===\n');
  
  const habitIds = Object.keys(data.habits);
  let totalCompletions = 0;
  
  habitIds.forEach(id => {
    const habit = data.habits[id];
    const completions = habit.completions;
    totalCompletions += completions;
    
    const createdDate = new Date(habit.createdAt);
    const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const consistencyRate = daysSinceCreation > 0 ? ((completions / daysSinceCreation) * 100).toFixed(1) : 0;
    
    console.log(`${habit.name}`);
    console.log(`  Completaciones totales: ${completions}`);
    console.log(`  Días desde creación: ${Math.max(0, daysSinceCreation)}`);
    console.log(`  Tasa de consistencia: ${consistencyRate}%`);
    
    // Últimas completaciones
    const habitRecords = data.records.filter(r => r.habitId === id).slice(-3);
    if (habitRecords.length > 0) {
      console.log(`  Últimas completaciones:`);
      habitRecords.forEach(record => {
        const date = new Date(record.completedAt).toLocaleDateString('es-ES');
        console.log(`    - ${date} ${record.notes ? '(' + record.notes + ')' : ''}`);
      });
    }
    console.log('');
  });
  
  console.log(`Total de completaciones: