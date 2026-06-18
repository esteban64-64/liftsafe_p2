export const API_BASE_URL = 'http://localhost:8000';

export const ROLE_IDS = {
  Administrador: 1,
  'Director Técnico': 2,
  Coordinador: 3,
  Inspector: 4,
  Asesor: 5,
  Cliente: 6,
};

export const ADMIN_CREATABLE_ROLES = [
  'Administrador',
  'Director Técnico',
  'Coordinador',
  'Inspector',
  'Asesor',
];

export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PPE', label: 'PPE' },
  { value: 'CE', label: 'Cédula de extranjería' },
];
