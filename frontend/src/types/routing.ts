export type LegType =
  | 'WALK'
  | 'SUBWAY'
  | 'TRAM'
  | 'BUS'
  | 'TRAIN'
  | 'REGIONAL_TRAIN'
  | 'OTHER_TRANSIT';

export type RealtimeStatus =
  | 'ON_TIME'
  | 'DELAYED'
  | 'CANCELLED'
  | 'STOP_SKIPPED'
  | 'DISRUPTED'
  | 'NO_DATA';

export type TransferDifficulty = 'RELAXED' | 'TIGHT' | 'RISKY';

export interface LocationPoint {
  lat: number;
  lon: number;
  label: string;
  type?: 'STOP' | 'ADDRESS' | 'STATION' | 'POI' | 'CURRENT_LOCATION';
  stopId?: string;
  municipality?: string;
}

export interface StopPoint {
  id?: string;
  name: string;
  lat: number;
  lon: number;
  platform?: string;
  scheduledTime: string;
  estimatedTime?: string;
  delayMinutes?: number;
}

export interface TransferInfo {
  stationName: string;
  durationSeconds: number;
  walkingMeters: number;
  difficulty: TransferDifficulty;
  difficultyLabel: string;
  bufferMinutes: number;
  isPlatformCross?: boolean;
}

export interface IntermediateStop {
  name: string;
  scheduledTime: string;
  estimatedTime?: string;
  delayMinutes?: number;
}

export interface Leg {
  id: string;
  type: LegType;
  line?: string;              // z.B. "U1", "S7", "13A", "D"
  headsign?: string;          // z.B. "Leopoldau", "Flughafen Wien"
  color?: string;             // HEX Farbcode für die Linie
  textColor?: string;
  fromStop: StopPoint;
  toStop: StopPoint;
  startTime: string;          // ISO String
  endTime: string;            // ISO String
  durationSeconds: number;
  distanceMeters?: number;
  stopsCount?: number;
  intermediateStops?: IntermediateStop[];
  realtimeStatus: RealtimeStatus;
  delayMinutes: number;
  expectedDelayMinutes?: number;
  punctualityPercent?: number;
  isCancelled?: boolean;
  disruptionNotice?: string;
  transferInfo?: TransferInfo;
  coordinates?: [number, number][]; // [[lon, lat], ...]
}

export interface JourneyExplanation {
  headline: string;
  details: string[];
}

export interface AlternativeComparison {
  timeDiffMinutes: number;      // z.B. +8 (8 min langsamer)
  transferDiff: number;         // z.B. -1 (1 Umstieg weniger)
  walkDiffMinutes: number;      // z.B. +4 (4 min mehr Fußweg)
  summaryText: string;          // z.B. "8 min langsamer • aktuell +9 min verspätet"
  reasons: string[];
}

export interface CostBreakdown {
  costScore: number;
  etaSeconds: number;
  etaMinutes: number;
  transferPenalty: number;
  missedConnectionRisk: number;
  disruptionRisk: number;
  alpha: number;
  beta: number;
  gamma: number;
  reliabilityPercent: number;
  summary: string;
}

export interface Journey {
  id: string;
  recommended: boolean;
  categoryTag?: 'EMPFOHLEN' | 'DIREKTER' | 'WENIGER_FUSSWEG' | 'ALTERNATIVE';
  tagLabel?: string;            // z.B. "EMPFOHLEN", "DIREKTER", "WENIGER ZU FUSS"
  departureTime: string;        // ISO String
  arrivalTime: string;          // ISO String
  durationSeconds: number;      // Gesamtdauer
  walkingSeconds: number;
  walkingMeters: number;
  transferCount: number;
  realtime: boolean;
  totalDelayMinutes: number;
  hasCancellations?: boolean;
  hasDisruptions?: boolean;
  costScore?: number;
  costBreakdown?: CostBreakdown;
  reliabilityPercent?: number;
  explanation: JourneyExplanation;
  comparisonWithRecommended?: AlternativeComparison;
  legs: Leg[];
}

export type TimeMode = 'NOW' | 'DEPARTURE' | 'ARRIVAL';

export interface JourneySearchPreferences {
  maxWalkingDistance?: number;
  maxTransfers?: number;
  wheelchair?: boolean;
  optimization?: 'FASTEST' | 'LEAST_WALKING' | 'FEWEST_TRANSFERS';
  alpha?: number;  // Gewichtung Transfer-Penalty
  beta?: number;   // Gewichtung Anschlussrisiko
  gamma?: number;  // Gewichtung Störungsrisiko
}

export interface JourneySearchRequest {
  from: LocationPoint;
  to: LocationPoint;
  dateTime: string;
  timeMode: 'DEPARTURE' | 'ARRIVAL';
  preferences?: JourneySearchPreferences;
}

export interface JourneySearchResponse {
  generatedAt: string;
  recommendedJourneyId: string;
  journeys: Journey[];
  realtimeActive: boolean;
  disruptionSummary?: string;
}

export interface IncidentAlert {
  id: string;
  title: string;
  description: string;
  lines: string[];
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  validFrom: string;
  validTo?: string;
}

export interface TrainPerformanceMetric {
  line: string;
  category: string;
  operator: string;
  sampleCount: number;
  meanDelayMinutes: number;
  stdDevMinutes: number;
  punctualityRatePct: number;
  cancellationRatePct: number;
  sourceDataset: string;
}

export interface CostConfiguration {
  alpha: number;
  beta: number;
  gamma: number;
  baseTransferPenaltySec: number;
  defaultHeadwayPenaltySec: number;
  formula: string;
}

export interface RiskSimulationResult {
  line: string;
  category: string;
  meanDelayMinutes: number;
  stdDevMinutes: number;
  bufferMinutes: number;
  missedConnectionProbability: number;
  connectionReliabilityPercent: number;
  riskPenaltySeconds: number;
}
