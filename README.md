# tiendamatetp · versión Supabase

Versión estable del catálogo con:

- base de datos Supabase;
- autenticación privada para administradores;
- seguridad RLS;
- fotos en Supabase Storage;
- gestión de productos, precios, stock y visibilidad;
- Ver detalles, WhatsApp por producto y Armá tu combo conservados.

Leé `INSTRUCCIONES-SUPABASE.md` antes de conectarla.


## V20 Multimedia
Antes de usar fotos/videos extra, ejecutar `MIGRACION-V20-MULTIMEDIA.sql` una sola vez en Supabase SQL Editor. La foto principal sigue viviendo en `products.image`; la galería adicional usa `product_media`.
