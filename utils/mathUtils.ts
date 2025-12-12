
export const UNITS = {
  length: {
    meters: 1,
    kilometers: 0.001,
    centimeters: 100,
    millimeters: 1000,
    miles: 0.000621371,
    yards: 1.09361,
    feet: 3.28084,
    inches: 39.3701
  },
  weight: {
    kilograms: 1,
    grams: 1000,
    milligrams: 1000000,
    pounds: 2.20462,
    ounces: 35.274,
    tons: 0.001
  },
  data: {
    bytes: 1,
    kilobytes: 0.0009765625,
    megabytes: 9.5367431640625e-7,
    gigabytes: 9.313225746154785e-10,
    bits: 8
  },
  time: {
    seconds: 1,
    minutes: 1/60,
    hours: 1/3600,
    days: 1/86400,
    milliseconds: 1000
  }
};

export type UnitCategory = keyof typeof UNITS;

export const convertUnit = (category: UnitCategory, from: string, to: string, value: number): number => {
  const cat = UNITS[category];
  // @ts-ignore
  const baseValue = value / cat[from]; // convert to base (e.g. meters)
  // @ts-ignore
  const targetValue = baseValue * cat[to]; // convert from base to target
  return targetValue;
};
