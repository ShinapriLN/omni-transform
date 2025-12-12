/**
 * Handles Text Case Transformations
 */
export const transformTextCase = (text: string, type: string): string => {
  switch (type) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w/g, c => c.toUpperCase());
    case 'camel':
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    case 'snake':
      return text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('_') || text;
    case 'kebab':
      return text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('-') || text;
    case 'pascal':
      return text
        .replace(new RegExp(/[-_]+/, 'g'), ' ')
        .replace(new RegExp(/[^\w\s]/, 'g'), '')
        .replace(
          new RegExp(/\s+(.)(\w*)/, 'g'),
          ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
        )
        .replace(new RegExp(/\w/), s => s.toUpperCase());
    default:
      return text;
  }
};

/**
 * Handles JSON <> CSV Transformations
 */
export const transformDataFormat = (text: string, type: string): string => {
  if (type === 'json_to_csv') {
    try {
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("JSON must be an array of objects");
      if (json.length === 0) return "";
      
      const keys = Object.keys(json[0]);
      const csv = [
        keys.join(','),
        ...json.map(row => keys.map(k => {
           let val = (row as any)[k];
           if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
           return val;
        }).join(','))
      ].join('\n');
      return csv;
    } catch (e: any) {
      throw new Error("Invalid JSON: " + e.message);
    }
  } else if (type === 'csv_to_json') {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error("CSV must have at least header and one row");
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => {
        let val: any = values[i]?.trim();
        // Try simple number parsing
        if (!isNaN(Number(val)) && val !== '') val = Number(val);
        // Remove quotes if present
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
        }
        obj[h] = val;
      });
      return obj;
    });
    return JSON.stringify(result, null, 2);
  }
  return text;
};
