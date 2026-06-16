import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, metrics } = body;

    if (!id || !metrics) {
      return NextResponse.json({ error: 'ID y métricas son requeridos' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ metrics })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, profile: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
