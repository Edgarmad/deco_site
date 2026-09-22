export type Location = {
  id?: string;
  number: string;
  slug: string;
  name: string;
  city: string;
  type: string;
  address: string;
  schedule: string;
  phone?: string;
  whatsappUrl?: string;
  mapsUrl: string;
  catalogUrl?: string;
  agents: LocationAgent[];
};

export type LocationAgent = {
  id?: string;
  name: string;
  phone: string;
  photoUrl?: string;
};
