import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const connectionString = process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
      return NextResponse.json({ success: false, error: 'No connection string found in environment variables.' }, { status: 500 });
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const sql = `
      DROP TABLE IF EXISTS public.chat_messages;

      CREATE TABLE public.chat_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          channel VARCHAR(50) NOT NULL,
          sender VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow public all" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
        END IF;
      EXCEPTION WHEN OTHERS THEN
      END
      $$;
    `;
    
    await client.query(sql);
    await client.end();
    
    return NextResponse.json({ success: true, message: 'Migración del chat ejecutada correctamente con conexión desde Vercel.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
