// Readable names for the backend contract. Generated source: ./schema.ts
// (run `npm run generate:api` after the backend's docs/openapi.json changes).
import type { components } from './schema';

type Schemas = components['schemas'];

// Request
export type RecommendationRequest = Schemas['RecommendationRequest'];
export type StudentProfile = Schemas['StudentProfile'];
export type Constraints = Schemas['Constraints'];
export type Priorities = Schemas['Priorities'];

// Recommendation response
export type RecommendationResponse = Schemas['RecommendationResponse'];
export type RankedCandidate = Schemas['RankedCandidate'];
export type CostBreakdown = Schemas['CostBreakdown'];
export type CostComponent = Schemas['CostComponent'];
export type FactorScore = Schemas['FactorScore'];
export type ExcludedCandidate = Schemas['ExcludedCandidate'];
export type ConstraintViolation = Schemas['ConstraintViolation'];
export type EligibilityNote = Schemas['EligibilityNote'];
export type NextAction = Schemas['NextAction'];
export type PriorityAlternative = Schemas['PriorityAlternative'];
export type ProfileSummary = Schemas['ProfileSummary'];

// Shared records
export type AccommodationOption = Schemas['AccommodationOption'];
export type AccommodationList = Schemas['AccommodationList'];
export type TransportOption = Schemas['TransportOption'];
export type TransportOptionList = Schemas['TransportOptionList'];
export type JourneyLeg = Schemas['JourneyLeg'];
export type TicketInfo = Schemas['TicketInfo'];
export type Provenance = Schemas['Provenance'];
export type SourceStatus = Schemas['SourceStatus'];
export type HealthResponse = Schemas['HealthResponse'];

// Errors
export type ErrorResponse = Schemas['ErrorResponse'];
export type ErrorDetail = Schemas['ErrorDetail'];

// Enumerations
export type TransportMode = TransportOption['mode'];
export type DataStatus = Provenance['status'];
