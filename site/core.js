export const OSMS = 'https://osmsdataexplorer.com/';
export const padId = id => String(id).padStart(9, '0');
export function flattenMaps(data) { return data.regions.flatMap(r => r.maps); }
export function rankMaps(maps, monsterId) {
  return maps.filter(m => !m.is_town).map(map => {
    const positions = map.mob_positions || [];
    const targets = positions.filter(p => p.id === Number(monsterId));
    if (!targets.length) return null;
    const purity = targets.length / positions.length;
    // A shortlist only: avoids pretending spawn count is a measured kill rate.
    const score = targets.length * (0.65 + 0.35 * purity);
    return {map, targets, purity, score};
  }).filter(Boolean).sort((a,b) => b.score - a.score || a.map.id - b.map.id);
}
export function validateRoute(result, allowedMapIds) {
  if (!result || !allowedMapIds.includes(result.mapId)) throw new Error('Mapa retornado fora dos candidatos.');
  for (const key of ['reason','access','caution']) if (typeof result[key] !== 'string' || result[key].length > 5000) throw new Error('Resposta de rota inválida.');
  if (!Array.isArray(result.steps) || result.steps.length > 12) throw new Error('Etapas de rota inválidas.');
  for (const step of result.steps) {
    if (typeof step.text !== 'string' || step.text.length > 1000 || !['walk','climb','drop','wait'].includes(step.action)) throw new Error('Etapa inválida.');
    if (!Array.isArray(step.points) || !step.points.length || step.points.length > 30) throw new Error('Trajeto inválido.');
    for (const point of step.points) if (![point.x,point.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) throw new Error('Coordenadas fora da imagem.');
  }
  return result;
}
