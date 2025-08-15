export interface QuizAnswer {
  id: number;
  letter: string;
  answer_text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'single' | 'multiple' | 'text_input' | 'true_false';
  media?: string | null;
  answers: QuizAnswer[];
}

export interface QuizSession {
  id: string;
  quiz_type: 'timed' | 'first_answer' | 'admin_controlled';
  time_per_question: number;
  is_active: boolean;
  current_question_index: number;
  admin_id: number;
  title: string;
  description: string;
  round_image?: string | null;
}

export interface QuizParticipant {
  id: number;
  username: string;
  profile_image?: string | null;
  answered: boolean;
  correct_answers: number;
  wrong_answers: number;
  total_answered: number;
  is_online: boolean;
  score?: number;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  correct: number;
  wrong: number;
}

export interface QuizResult {
  username: string;
  score: number;
  correct: number;
  wrong: number;
}