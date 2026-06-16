import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service Role Key no configurada' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const [profilesRes, vehiclesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('role', 'driver'),
      supabaseAdmin.from('vehicles').select('*')
    ]);

    if (profilesRes.error) throw new Error('Error perfiles: ' + profilesRes.error.message);
    if (vehiclesRes.error) throw new Error('Error vehículos: ' + vehiclesRes.error.message);

    return NextResponse.json({
      drivers: profilesRes.data,
      vehicles: vehiclesRes.data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('API POST /admin/flota received body:', body);

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, appointment_date, budget, description } = body;
    if (!id || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Actualizar estado del vehículo
    const { data: vehicle, error: vError } = await supabaseAdmin
      .from('vehicles')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (vError) throw vError;

    // 2. Si es mantenimiento, lubricentro o lavadero, notificar al chofer designado y crear orden de servicio
    if (status === 'maintenance' || status === 'lubricentro' || status === 'lavadero') {
      // Limpiar datos (convertir strings vacíos a null)
      const cleanDate = appointment_date && appointment_date.trim() !== '' ? appointment_date : null;
      const cleanBudget = budget && budget.toString().trim() !== '' ? parseFloat(budget.toString()) : null;

      let providerType = 'taller';
      let placeName = 'el taller';
      let emoji = '⚠️';

      if (status === 'lubricentro') {
        providerType = 'lubricentro';
        placeName = 'el lubricentro';
        emoji = '🛢️';
      } else if (status === 'lavadero') {
        providerType = 'lavadero';
        placeName = 'el lavadero';
        emoji = '🧽';
      }

      // Crear Orden de Servicio
      const { error: sError } = await supabaseAdmin.from('service_orders').insert([{
        vehicle_id: id,
        provider_type: providerType,
        appointment_date: cleanDate,
        budget: cleanBudget,
        description: description || `Envío automático a ${placeName}`,
        status: 'pending'
      }]);

      if (sError) {
        console.error('Error creando service_order:', sError.message);
        throw new Error('Error al crear la orden de servicio: ' + sError.message);
      }

      // Buscar chofer asignado a esta unidad
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('vehicle_id', id)
        .single();

      if (profile) {
        await supabaseAdmin.from('announcements').insert([{
          title: `${emoji} UNIDAD EN ${status.toUpperCase()}`,
          content: `Hola ${profile.full_name}, tu unidad asignada (Patente: ${vehicle.plate}) ha sido enviada a ${placeName}. Por favor, coordinar con administración.`,
          is_active: true,
          driver_id: profile.id 
        }]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/flota:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
