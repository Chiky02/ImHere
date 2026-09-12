export type Role = "admin" | "operator" | "driver";

export type User = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: Role;
  busetaId?: string;
  approved: boolean;
  createdAt: string;
};

export type Punto = {
  id: string;
  name: string;
  address: string;
  operatorIds: string[];
  active: boolean;
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
};

export type Buseta = {
  id: string;
  codigo: string;
  placa: string;
  active: boolean;
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
};

export type PublicUser = Omit<User, "passwordHash">;

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  busetaId?: string;
  approved: boolean;
};
