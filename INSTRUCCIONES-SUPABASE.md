# Conectar la versión final a Supabase

Esta carpeta funciona de dos maneras:

- **Sin configurar Supabase:** abre el catálogo estable con la base local de demostración. El panel real queda bloqueado.
- **Con Supabase configurado:** productos y fotos quedan sincronizados en internet y el panel exige correo y contraseña.

## 1. Crear el proyecto

1. Entrá a Supabase y creá un proyecto.
2. Abrí **SQL Editor**.
3. Copiá todo el contenido de `supabase-schema.sql`, pegalo y ejecutalo.

## 2. Crear tu usuario administrador

1. En Supabase abrí **Authentication > Users**.
2. Creá un usuario con tu correo y una contraseña de prueba.
3. Copiá el **UUID** del usuario.
4. En SQL Editor ejecutá:

```sql
insert into public.admin_users (user_id)
values ('PEGAR_ACA_EL_UUID');
```

Cuando Tiago tenga su cuenta, creala de la misma manera. Podés borrar tu permiso con:

```sql
delete from public.admin_users
where user_id = 'UUID_DE_GERONIMO';
```

## 3. Conectar la página

En Supabase abrí **Project Settings > API** y copiá:

- Project URL
- Publishable key o anon public key

Abrí `supabase-config.js` y reemplazá:

```js
window.TP_SUPABASE_CONFIG = {
  url: 'PEGAR_PROJECT_URL',
  anonKey: 'PEGAR_PUBLISHABLE_O_ANON_KEY',
  storageBucket: 'product-images'
};
```

La publishable/anon key puede estar en la página. **Nunca pongas una service_role key en el navegador.**

## 4. Probar correctamente

No abras `index.html` con doble clic para la prueba final. Levantá un servidor local:

```bash
python -m http.server 8000
```

Después abrí `http://localhost:8000`.

Probá:

1. Entrar al Panel de Tiago.
2. Iniciar sesión.
3. Crear un producto con foto JPG, PNG o WebP.
4. Cambiar precio y stock.
5. Cerrar sesión y comprobar que el catálogo sigue visible, pero no editable.
6. Abrir la página en otro dispositivo y verificar que aparezcan los mismos cambios.

## Seguridad incluida

- La contraseña se valida con Supabase Auth y no está escrita en HTML ni JavaScript.
- RLS deja leer productos visibles a los clientes.
- Solo usuarios incluidos en `admin_users` pueden crear, editar o eliminar.
- Las fotos aceptan JPG, PNG y WebP, con máximo de 8 MB.
- El panel mantiene sesión y permite cerrarla.

## Antes de publicar

- Cambiar los productos de ejemplo por los reales.
- Crear la cuenta de Tiago y quitar cuentas de prueba.
- Usar una contraseña larga y única.
- Activar recuperación de contraseña y revisar las URL permitidas en Supabase Auth.
