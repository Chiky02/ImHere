export type Role = "admin" | "operator" | "driver";

export type AppRole = {
  id: string;
  name: string;
  slug: string;
  /** Determines landing page and which permission family is allowed */
  home: Role;
  permissions: string[];
  isSystem: boolean;
  active: boolean;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: Role;
  roleId?: string;
  busetaId?: string;
  approved: boolean;
  /** If false, login is blocked */
  active: boolean;
  createdAt: string;
  deletedAt?: string;
};

export type Punto = {
  id: string;
  name: string;
  address: string;
  operatorIds: string[];
  active: boolean;
  deletedAt?: string;
};

export type RecorridoPunto = {
  puntoId: string;
  orden: number;
  tiempoEsperadoMin: number;
};

export type Recorrido = {
  id: string;
  name: string;
  active: boolean;
  puntos: RecorridoPunto[];
  deletedAt?: string;
};

export type Buseta = {
  id: string;
  codigo: string;
  placa: string;
  active: boolean;
  deletedAt?: string;
};

export type Horario = {
  id: string;
  recorridoId: string;
  busetaId: string;
  conductorId: string;
  horaSalida: string;
  horaLlegada: string;
  tiempoViajeMin: number;
  dias: number[];
  active: boolean;
  deletedAt?: string;
};

export type AlertaStatus = "pending" | "arrived" | "cancelled";

export type Alerta = {
  id: string;
  puntoId: string;
  conductorId: string;
  busetaId: string;
  horarioId?: string;
  createdAt: string;
  status: AlertaStatus;
};

export type RegistroCruce = {
  id: string;
  puntoId: string;
  conductorId: string;
  busetaId: string;
  horarioId?: string;
  alertaId?: string;
  horaLlegadaReal: string;
  horaSalidaReal?: string;
  registradoPor: string;
  evidenciaUrl?: string;
  /** Optional note from the operator (delay reason, etc.) */
  descripcion?: string;
  createdAt: string;
};

export type Notificacion = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  registroId?: string;
  puntoId?: string;
};

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type AppSettings = {
  /** URL pública o /api/config/alert-audio si hay archivo subido */
  alertSoundUrl: string;
  /** Base64 sin prefijo data: (opcional, archivo subido) */
  alertSoundData?: string;
  alertSoundMime?: string;
  alertSoundName?: string;
  /** ISO timestamp for cache-busting audio URLs */
  updatedAt?: string;
};

export type Database = {
  users: User[];
  puntos: Punto[];
  recorridos: Recorrido[];
  busetas: Buseta[];
  horarios: Horario[];
  alertas: Alerta[];
  registros: RegistroCruce[];
  notificaciones: Notificacion[];
  pushSubscriptions: PushSubscriptionRecord[];
  settings: AppSettings;
  /** Per-operator alert sound overrides (userId → settings) */
  operatorAlertSettings: Record<string, AppSettings>;
  roles: AppRole[];
};

export type PublicUser = Omit<User, "passwordHash">;

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  roleId?: string;
  roleName?: string;
  busetaId?: string;
  approved: boolean;
  active: boolean;
  permissions: string[];
};
