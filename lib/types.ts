export interface City {
  id: string | number;
  name: string;
  country?: string;
}

export interface Destination extends City {
  weather?: any;
  photos?: any;
}
