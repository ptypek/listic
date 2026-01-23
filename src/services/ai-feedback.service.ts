import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateAiFeedbackCommand } from '@/types';

export class AiFeedbackService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async logFeedback(command: CreateAiFeedbackCommand, userId: string): Promise<void> {
    const { data: listItem, error: selectError } = await this.supabase
      .from('list_items')
      .select('id')
      .eq('id', command.list_item_id)
      .single();

    if (selectError || !listItem) {
      throw new Error('NotFound');
    }

    const { error: insertError } = await this.supabase.from('ai_feedback_log').insert({
      list_item_id: command.list_item_id,
      user_id: userId,
    });

    if (insertError) {
      console.error('Error logging AI feedback:', insertError);
      throw new Error('InternalServerError');
    }
  }
}
