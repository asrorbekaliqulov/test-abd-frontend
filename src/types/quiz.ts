export interface Question {
  id: number;
  text: string;
  options: Answer[];
  question_type: 'single' | 'multiple' | 'text';
  time_limit?: number;
  category?: Category;
}

export interface Answer {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface LiveQuiz {
  id: number;
  test: Test;
  mode: 'timed' | 'first_answer' | 'admin_controlled' | 'free';
  start_time?: string;
  end_time?: string;
  description?: string;
  is_public: boolean;
  is_active: boolean;
  time_per_question?: number;
  created_by: User;
  participants: QuizParticipant[];
  current_question_index: number;
  questions: Question[];
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  category: Category;
  questions_count: number;
  created_by: User;
}

export interface User {
  id: number;
  username: string;
  profile_image?: string;
}

export interface QuizParticipant {
  id: number;
  user: User;
  score: number;
  is_answered: boolean;
  joined_at: string;
  current_answer?: number[];
}

export interface QuizAnswer {
  question_id: number;
  selected_answer_ids: number[];
  written_answer?: string;
  duration?: number;
}