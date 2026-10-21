/* MotoAuction Supabase integration helpers. Browser key is publishable; RLS is mandatory. */
(function () {
  const waitForClient = () => window.motoSupabase || null;
  window.motoSupabaseReady = async function () {
    for (let i = 0; i < 50; i++) {
      const client = waitForClient();
      if (client) return client;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Supabase-клиент не загружен. Проверьте подключение и порядок скриптов.');
  };
  window.motoGetUser = async function () {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data.user;
  };
  window.motoRegister = async function ({email, password, username, phone}) {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { username, full_name: username, phone } }
    });
    if (error) throw error;
    return data;
  };
  window.motoLogin = async function (email, password) {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.auth.signInWithPassword({email, password});
    if (error) throw error;
    return data;
  };
  window.motoLogout = async function () {
    const sb = await window.motoSupabaseReady();
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };
  async function uploadImage(sb, userId, source, index) {
    if (!source || !/^data:image\/(png|jpeg|webp);base64,/i.test(source)) return source || null;
    const parts = source.split(',');
    const mime = parts[0].match(/data:(.*?);/)[1];
    const bytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
    const path = `${userId}/${Date.now()}-${index}.${ext}`;
    const { error } = await sb.storage.from('motorcycle-images').upload(path, new Blob([bytes], {type:mime}), {contentType:mime, upsert:false});
    if (error) throw error;
    return sb.storage.from('motorcycle-images').getPublicUrl(path).data.publicUrl;
  }
  window.motoCreateLot = async function (payload) {
    const sb = await window.motoSupabaseReady();
    const { data: authData, error: authError } = await sb.auth.getUser();
    if (authError) throw authError;
    const user = authData.user;
    if (!user) throw new Error('Сначала войдите в аккаунт.');
    const photos = Array.isArray(payload.images) ? payload.images : [payload.image];
    if (!photos.length || !photos[0]) throw new Error('Добавьте хотя бы одну фотографию.');
    const imageUrl = await uploadImage(sb, user.id, photos[0], 0);
    const { data, error } = await sb.from('motorcycles').insert({
      user_id: user.id,
      title: payload.title,
      brand: payload.brand || null,
      model: payload.model || null,
      year: Number(payload.year) || null,
      description: payload.description || null,
      starting_price: Number(payload.startingPrice),
      current_price: Number(payload.startingPrice),
      image_url: imageUrl,
      end_date: payload.endDate || null,
      status: 'pending'
    }).select().single();
    if (error) throw error;
    return data;
  };

  // Convert database rows to the shape used by the existing UI.
  window.motoMapMotorcycle = function (row) {
    if (!row) return null;
    return {
      id: Number(row.id), title: row.title || [row.brand, row.model].filter(Boolean).join(' ') || 'Мотоцикл',
      brand: row.brand || '', model: row.model || '', year: row.year || '',
      description: row.description || '', startingPrice: Number(row.starting_price || 0),
      currentPrice: Number(row.current_price ?? row.starting_price ?? 0), image: row.image_url || '',
      images: row.image_url ? [row.image_url] : [], sellerId: row.user_id || '',
      status: row.status || 'pending', endDate: row.end_date || null, createdAt: row.created_at || null, bids: []
    };
  };
  window.motoFetchMotorcycles = async function () {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.from('motorcycles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data || []).map(window.motoMapMotorcycle);
    // Keep legacy UI components in sync with the RLS-filtered database result.
    localStorage.setItem('motorcycles', JSON.stringify(rows));
    return rows;
  };
  window.motoFetchMotorcycle = async function (id) {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.from('motorcycles').select('*').eq('id', Number(id)).maybeSingle();
    if (error) throw error;
    return window.motoMapMotorcycle(data);
  };

  window.motoPlaceBid = async function (motorcycleId, amount) {
    const sb = await window.motoSupabaseReady();
    const { data, error } = await sb.rpc('place_bid', {
      p_motorcycle_id: Number(motorcycleId), p_amount: Number(amount)
    });
    if (error) throw error;
    return data;
  };
})();
