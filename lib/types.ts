// Shared domain types matching the Supabase schema in supabase/full_setup.sql.

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AdminUser extends Profile {
  is_admin?: boolean;
}

export interface AptitudeQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  created_at?: string;
}

export interface AptitudeResult {
  id: string;
  user_id: string;
  category: string;
  score: number;
  total: number;
  time_taken: number;
  answers: unknown;
  created_at: string;
}

export interface RTRTest {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive' | string;
  created_at?: string;
}

export interface RTRPart1Question {
  id: string;
  test_id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  created_at?: string;
}

export interface RTRPart2Exchange {
  speaker: 'ATC' | 'Pilot' | string;
  text: string;
  hint?: string;
}

// Header block on the printed chart paper. Labels are fixed in UI; values are admin-editable.
export interface RTRChartContext {
  time_allowed: string;     // e.g. "25 minutes"
  total_marks: number;      // e.g. 100
  aircraft_id: string;      // VT ERB
  type_aircraft: string;    // Embraier
  flight_rules: string;     // I
  wake_turb_cat: string;    // M
  flight_type: string;      // N
  equipment: string;        // S
  departure: string;        // VOPB
  time: string;             // 08:45
  level: string;            // F360
  route: string;            // P628 OPONI G450
  destination: string;      // VANP
  alternate: string;        // VERC
  other_info: string;       // Only VHF on board.
}

// One fill-in blank inside a sub-part (used for question 5 with multiple labelled blanks).
export interface RTRBlank {
  label: string;            // e.g. "Classifications of AIRPROX are"
  expectedAnswer: string;
}

export interface RTRSubPart {
  label: string;            // "a", "b", "" (none)
  prompt: string;           // What ATC / scenario tells the candidate.
  expectedAnswer: string;   // Reference transmission for similarity scoring (ignored when blanks set).
  marks: number;
  blanks?: RTRBlank[];      // When present, render as labelled inputs and score per blank.
}

export interface RTRChartQuestion {
  number: number;           // 1, 2, 3, ...
  subParts: RTRSubPart[];
}

export interface RTRPart2Scenario {
  id: string;
  test_id: string;
  marks: number;
  scenario: string;
  instruction: string | null;
  exchanges?: RTRPart2Exchange[] | null;       // Legacy dialogue model — retained for old data.
  chart_context?: RTRChartContext | null;      // New chart-paper model: header.
  questions?: RTRChartQuestion[] | null;       // New chart-paper model: numbered questions.
  created_at?: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  test_id: string;
  amount: number;
  payment_id: string | null;
  purchased_at: string;
  // Optional joined data shown by admin views.
  rtr_tests?: { title: string } | null;
  profiles?: { email: string | null; full_name: string | null } | null;
}

export interface RTRResult {
  id: string;
  user_id: string;
  test_id: string;
  part: 'part1' | 'part2';
  score: number;
  total: number;
  answers: unknown;
  created_at: string;
}

export interface Guide {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  content: string | null;
  read_time: string | null;
  difficulty: string | null;
  published: boolean;
  created_at?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  exam_date: string | null;
  exam_time: string | null;
  duration: number;
  total_questions: number;
  fee: number;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | string;
  created_at?: string;
  registration_count?: number;
  isRegistered?: boolean;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  created_at?: string;
}

export interface ExamRegistration {
  id: string;
  user_id: string;
  exam_id: string;
  payment_id: string | null;
  registered_at: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  answers: Record<string, number> | null;
  score: number | null;
  total: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalRevenue: number;
  totalAttempts: number;
  totalRegistrations: number;
  totalExams: number;
  totalRTRTests: number;
  totalGuides: number;
  totalAptitudeQuestions: number;
  recentUsers?: Profile[];
  recentPurchases?: UserPurchase[];
}

// Used in catch blocks to safely render an error message without `any`.
export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return fallback;
}
