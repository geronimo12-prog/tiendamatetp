# tiendamatetp · Remodelación 2026

## Qué cambió
- Barra de estado de stock online.
- Catálogo con buscador y orden por destacados, stock, precio y nombre.
- Cantidades exactas visibles en cada producto.
- Modal de producto con selector de cantidad, subtotal y pedido preparado para WhatsApp.
- Resumen de inventario en portada.
- Modo de respaldo: si Supabase no responde, la tienda usa la última copia local disponible y avisa que los datos pueden estar desactualizados.
- Caché local actualizada cada vez que Supabase responde correctamente.
- Corrección de una imagen faltante en la sección de personalizados.

## Supabase
La configuración del frontend apunta al proyecto:
`kzftmbsnnmsjbquewkwp.supabase.co`

El SQL incluido está bien estructurado: Auth, RLS, tabla de administradores, productos y Storage.
Si el proyecto está pausado/inactivo, reactivarlo desde el dashboard de Supabase debería ser el primer paso. Una vez activo, la web volverá a sincronizar y el panel admin funcionará sin cambiar la arquitectura.

## Importante
La copia local sirve solo como respaldo visual. Para que el stock publicado sea verdaderamente en tiempo real entre todos los dispositivos, Supabase debe estar activo.
