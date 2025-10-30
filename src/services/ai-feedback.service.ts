import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateAiFeedbackCommand } from '@/types';

export class AiFeedbackService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async logFeedback(command: CreateAiFeedbackCommand, userId: string): Promise<void> {
    // 1. Sprawdź, czy produkt o podanym list_item_id istnieje
    const { data: listItem, error: selectError } = await this.supabase
      .from('list_items')
      .select('id')
      .eq('id', command.list_item_id)
      .single();

    if (selectError || !listItem) {
      // Rzuć błąd, jeśli produkt nie istnieje lub wystąpił błąd zapytania
      throw new Error('NotFound');
    }

    // 2. Wstaw nowy rekord do tabeli ai_feedback_log
    const { error: insertError } = await this.supabase.from('ai_feedback_log').insert({
      list_item_id: command.list_item_id,
      user_id: userId,
    });

    if (insertError) {
      // Rzuć błąd, jeśli wstawienie się nie powiedzie
      console.error('Error logging AI feedback:', insertError);
      throw new Error('InternalServerError');
    }
  }
}
