export interface StockItem {
  Ticker: string;
  Expected_Return_Annual: number;
  Last_Price: number;
  Data_Points: number;
}

export interface GAResult {
  best_portfolio: number[];
  best_fitness: number;
  history: number[]; 
  total_cost: number;
  total_profit: number;
}

export function runGeneticAlgorithm(
  items: StockItem[],
  budget: number,
  lotSize: number = 100,
  populationSize: number = 100,
  generations: number = 200,
  mutationRate: number = 0.1 // Sedikit dinaikkan karena search space integer lebih luas
): GAResult {
  const numItems = items.length;
  // Biaya per Lot
  const costs = items.map(i => i.Last_Price * lotSize);
  // Ekspektasi profit tahunan (cost * return rate)
  const profits = items.map((i, idx) => costs[idx] * i.Expected_Return_Annual);
  
  // Batas teoritis lot maksimal per saham agar mutasi tidak menembak di angka miliaran
  const maxLots = costs.map(c => Math.floor(budget / c));

  function createIndividual(): number[] {
    const ind = new Array(numItems).fill(0);
    // Berikan seed awalan beberapa saham acak yang memiliki lot antara 1 sampai 10% kemampuan finansialnya
    // Jangan langsung full budget agar variasi silang terjadi
    const startItems = Math.floor(Math.random() * 5) + 2; 
    for (let j = 0; j < startItems; j++) {
      const idx = Math.floor(Math.random() * numItems);
      if (maxLots[idx] > 0 && items[idx].Expected_Return_Annual > 0) {
        const upTo = Math.max(1, Math.floor(maxLots[idx] / 10));
        ind[idx] = Math.floor(Math.random() * upTo) + 1;
      }
    }
    return ind;
  }

  function calculateFitness(individual: number[]): number {
    let totalCost = 0;
    let totalProfit = 0;
    
    for (let i = 0; i < numItems; i++) {
        const qty = individual[i];
        if (qty > 0) {
            totalCost += costs[i] * qty;
            totalProfit += profits[i] * qty;
        }
    }
    
    // Fungsi Penalti yang SANGAT keras untuk Integer Knapsack
    if (totalCost > budget) {
        return totalProfit - (totalCost - budget) * 20;
    }
    
    return totalProfit;
  }

  function tournamentSelection(population: number[][]): number[] {
    let best = population[Math.floor(Math.random() * populationSize)];
    for (let i = 1; i < 5; i++) { 
      const ind = population[Math.floor(Math.random() * populationSize)];
      if (calculateFitness(ind) > calculateFitness(best)) {
        best = ind;
      }
    }
    return best;
  }

  function crossover(parent1: number[], parent2: number[]): number[][] {
    const point = Math.floor(Math.random() * (numItems - 1)) + 1;
    const child1 = [...parent1.slice(0, point), ...parent2.slice(point)];
    const child2 = [...parent2.slice(0, point), ...parent1.slice(point)];
    return [child1, child2];
  }

  function mutate(individual: number[]): void {
    const shifts = [-2, -1, 1, 2, 3];
    for (let i = 0; i < numItems; i++) {
        if (Math.random() < mutationRate) {
            if (maxLots[i] > 0) {
                const shift = shifts[Math.floor(Math.random() * shifts.length)];
                individual[i] += shift;
                // Clip batas bawah dan batas atas
                individual[i] = Math.max(0, Math.min(individual[i], maxLots[i]));
            }
        }
    }
  }

  let population = Array.from({ length: populationSize }, createIndividual);
  let bestOverall = population[0];
  let bestFitnessOverall = -Infinity;
  const history: number[] = [];

  for (let gen = 0; gen < generations; gen++) {
    population.sort((a, b) => calculateFitness(b) - calculateFitness(a));
    const currentBest = population[0];
    const currentFitness = calculateFitness(currentBest);

    if (currentFitness > bestFitnessOverall) {
      bestOverall = [...currentBest];
      bestFitnessOverall = currentFitness;
    }

    history.push(bestFitnessOverall);

    const newPopulation = [[...population[0]], [...population[1]]]; // Elitism
    while (newPopulation.length < populationSize) {
      const p1 = tournamentSelection(population);
      const p2 = tournamentSelection(population);
      const [c1, c2] = crossover(p1, p2);
      mutate(c1);
      mutate(c2);
      newPopulation.push(c1, c2);
    }
    population = newPopulation.slice(0, populationSize);
  }

  let finalCost = 0;
  let finalProfit = 0;
  for (let i = 0; i < numItems; i++) {
    const qty = bestOverall[i];
    if (qty > 0) {
      finalCost += costs[i] * qty;
      finalProfit += profits[i] * qty;
    }
  }

  return {
    best_portfolio: bestOverall,
    best_fitness: bestFitnessOverall,
    history,
    total_cost: finalCost,
    total_profit: finalProfit
  };
}
